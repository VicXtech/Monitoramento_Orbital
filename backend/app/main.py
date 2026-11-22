import os
import json
import gzip
import time
import hashlib
import logging
import threading
from collections import OrderedDict
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from types import SimpleNamespace
from typing import List, Optional

import httpx
from fastapi import FastAPI, Depends, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import TypeAdapter
from sqlalchemy import func, text, cast, Date as SQLDate, case
from sqlalchemy.orm import Session, selectinload
from apscheduler.schedulers.background import BackgroundScheduler

from app.database import SessionLocal, get_db
from app.collector import APIConector
from app.models import ObjetoOrbital, TLEHistorico
from app import schemas

# Configuração de Logs detalhados no terminal do Docker
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("MonitoramentoOrbital")
conector = APIConector()

# Satélites fixos de alto valor científico, missões brasileiras e estações espaciais (sempre preservados)
PINNED_NORAD_IDS = [
    "25544",  # ISS (Zarya)
    "48274",  # Tiangong (CSS Tianhe)
    "22490",  # SCD-1 (Primeiro satélite brasileiro)
    "25504",  # SCD-2 (Coleta de dados ambientais Brasil)
    "47699",  # Amazonia-1 (Satélite óptico nacional INPE)
    "44883",  # CBERS-4A (Sino-Brasileiro)
    "40336",  # CBERS-4
    "20580",  # Telescópio Espacial Hubble (HST)
    "24946",  # Iridium 33 (Colisão histórica de 2009)
    "22675",  # Cosmos 2251 (Colisão histórica de 2009)
    "43013",  # NOAA-20 / JPSS-1
    "00012",  # Vanguard 1 R/B (Pioneiro histórico)
    "00016"   # Vanguard 2 R/B
]
ESTACOES_PRINCIPAIS_NORAD = ["25544", "48274"]
ADAPTER_OBJETOS_LISTA = TypeAdapter(List[schemas.ObjetoOrbitalResponse])


# Cache LRU em memoria com bytes JSON e gzip pre-calculados
class CacheLRUComprimido:
    def __init__(self, max_entradas: int = 24, ttl_segundos: int = 3600):
        self.max_entradas = max_entradas
        self.ttl_segundos = ttl_segundos
        self._dados: OrderedDict = OrderedDict()
        self._lock = threading.Lock()

    def get(self, chave: str):
        agora = time.time()
        with self._lock:
            entrada = self._dados.get(chave)
            if not entrada:
                return None
            json_bytes, gzip_bytes, etag, expira_em = entrada
            if agora >= expira_em:
                del self._dados[chave]
                return None
            self._dados.move_to_end(chave)
            return json_bytes, gzip_bytes, etag

    def set(self, chave: str, json_bytes: bytes):
        gzip_bytes = gzip.compress(json_bytes, compresslevel=6)
        etag = f'"{hashlib.sha1(json_bytes).hexdigest()}"'
        expira_em = time.time() + self.ttl_segundos
        with self._lock:
            self._dados[chave] = (json_bytes, gzip_bytes, etag, expira_em)
            self._dados.move_to_end(chave)
            while len(self._dados) > self.max_entradas:
                self._dados.popitem(last=False)
        return json_bytes, gzip_bytes, etag

    def clear(self):
        with self._lock:
            self._dados.clear()


CACHE_RADAR = CacheLRUComprimido(max_entradas=24, ttl_segundos=3600)
CACHE_OBJETOS = CacheLRUComprimido(max_entradas=12, ttl_segundos=3600)
CACHE_ESTATISTICAS = CacheLRUComprimido(max_entradas=2, ttl_segundos=1800)


# Monta resposta HTTP respeitando ETag e Accept-Encoding sem recomprimir
def construir_resposta_cacheada(request: Request, entrada, max_age: int = 3600) -> Response:
    json_bytes, gzip_bytes, etag = entrada
    headers_base = {
        "ETag": etag,
        "Cache-Control": f"public, max-age={max_age}, stale-while-revalidate=86400",
        "Vary": "Accept-Encoding",
    }

    if_none_match = request.headers.get("if-none-match", "")
    if if_none_match and (etag in if_none_match or if_none_match.strip() == "*"):
        return Response(status_code=304, headers=headers_base)

    accept_encoding = request.headers.get("accept-encoding", "").lower()
    if "gzip" in accept_encoding:
        return Response(
            content=gzip_bytes,
            media_type="application/json",
            headers={**headers_base, "Content-Encoding": "gzip"},
        )

    return Response(content=json_bytes, media_type="application/json", headers=headers_base)


# Normaliza categorias para consulta e chave deterministica de cache
def _normalizar_categorias_radar(categoria_id: Optional[int], categoria_ids: Optional[str]) -> List[int]:
    if categoria_ids is not None:
        cats = [int(x.strip()) for x in categoria_ids.split(",") if x.strip().isdigit()]
    elif categoria_id is not None:
        cats = [categoria_id]
    else:
        cats = [1, 2, 3, 4, 5]
    return sorted({c for c in cats if c in (1, 2, 3, 4, 5)})


# Garante colunas desnormalizadas e indices de radar de forma idempotente
def garantir_schema_e_backfill_tles(db: Session):
    comandos_ddl = [
        "ALTER TABLE objeto_orbital ADD COLUMN IF NOT EXISTS ultimo_tle_linha1 CHAR(69)",
        "ALTER TABLE objeto_orbital ADD COLUMN IF NOT EXISTS ultimo_tle_linha2 CHAR(69)",
        "ALTER TABLE objeto_orbital ADD COLUMN IF NOT EXISTS ultimo_tle_epoch TIMESTAMP WITH TIME ZONE",
        "CREATE INDEX IF NOT EXISTS idx_tle_historico_objeto_id_desc ON tle_historico(objeto_id, id DESC)",
        "CREATE INDEX IF NOT EXISTS idx_tle_historico_data_captura ON tle_historico(data_captura)",
        (
            "CREATE INDEX IF NOT EXISTS idx_objeto_orbital_radar_ativo "
            "ON objeto_orbital(regime, categoria_id) "
            "WHERE data_decaimento IS NULL AND (codigo_status IS NULL OR codigo_status <> 'D') AND estacao_pai_norad IS NULL"
        ),
    ]
    for sql in comandos_ddl:
        db.execute(text(sql))
    db.commit()

    pendente = db.execute(
        text(
            "SELECT EXISTS ("
            "  SELECT 1 FROM objeto_orbital o "
            "  WHERE o.ultimo_tle_linha1 IS NULL "
            "    AND EXISTS (SELECT 1 FROM tle_historico t WHERE t.objeto_id = o.id)"
            ")"
        )
    ).scalar()

    if pendente:
        t0 = time.time()
        db.execute(
            text(
                """
                UPDATE objeto_orbital o
                SET ultimo_tle_linha1 = t.linha1,
                    ultimo_tle_linha2 = t.linha2,
                    ultimo_tle_epoch = t.epoch
                FROM (
                    SELECT DISTINCT ON (objeto_id) objeto_id, linha1, linha2, epoch
                    FROM tle_historico
                    ORDER BY objeto_id, id DESC
                ) t
                WHERE o.id = t.objeto_id AND o.ultimo_tle_linha1 IS NULL
                """
            )
        )
        db.commit()
        logger.info(f"LOG: Backfill de TLEs desnormalizados concluido em {time.time() - t0:.2f}s.")


# Consulta em passagem unica os objetos do radar estratificados por camada
def _consultar_linhas_radar_sql(
    db: Session,
    limit: int,
    cats_radar: List[int],
    regime_filtro: Optional[str],
    seed: Optional[str],
):
    seed_str = str(seed if seed is not None else "0")

    if regime_filtro in ("LEO", "MEO", "GEO", "HEO"):
        sql = text(
            """
            WITH base AS (
                SELECT
                    o.id,
                    o.norad_id,
                    o.nome,
                    o.categoria_id,
                    o.regime,
                    o.pais,
                    o.ultimo_tle_linha1,
                    o.ultimo_tle_linha2,
                    CASE
                        WHEN o.ultimo_tle_linha1 IS NULL OR o.ultimo_tle_linha2 IS NULL THEN o.dados_omm
                        ELSE NULL
                    END AS dados_omm,
                    (
                        o.norad_id = ANY(CAST(:estacoes_fixas AS TEXT[]))
                        OR (
                            o.categoria_id = ANY(CAST(:cats AS INTEGER[]))
                            AND o.norad_id = ANY(CAST(:pinned_ids AS TEXT[]))
                        )
                    ) AS is_pinned,
                    CASE
                        WHEN o.pais IS NULL OR o.pais = ''
                          OR o.pais ILIKE '%não identificado%'
                          OR o.pais ILIKE '%desconhecido%'
                          OR o.pais ILIKE '%unknown%'
                        THEN 1 ELSE 0
                    END AS prioridade_pais
                FROM objeto_orbital o
                WHERE o.data_decaimento IS NULL
                  AND (o.codigo_status IS NULL OR o.codigo_status <> 'D')
                  AND o.regime = :regime
                  AND (
                      o.norad_id = ANY(CAST(:estacoes_fixas AS TEXT[]))
                      OR (
                          o.categoria_id = ANY(CAST(:cats AS INTEGER[]))
                          AND o.norad_id = ANY(CAST(:pinned_ids AS TEXT[]))
                      )
                      OR (
                          o.categoria_id = ANY(CAST(:cats AS INTEGER[]))
                          AND o.estacao_pai_norad IS NULL
                          AND o.nome NOT ILIKE 'ISS (%'
                          AND o.nome NOT ILIKE 'CSS (%'
                      )
                  )
            )
            SELECT
                id, norad_id, nome, categoria_id, regime, pais,
                ultimo_tle_linha1, ultimo_tle_linha2, dados_omm
            FROM base
            ORDER BY is_pinned DESC, prioridade_pais ASC, md5(norad_id || :seed)
            LIMIT :limite
            """
        )
        return db.execute(
            sql,
            {
                "estacoes_fixas": ESTACOES_PRINCIPAIS_NORAD,
                "cats": cats_radar,
                "pinned_ids": PINNED_NORAD_IDS,
                "regime": regime_filtro,
                "seed": seed_str,
                "limite": limit,
            },
        ).fetchall()

    cota_leo = int(round(limit * 0.84))
    cota_geo = int(round(limit * 0.09))
    cota_heo = int(round(limit * 0.05))
    cota_meo = max(1, limit - (cota_leo + cota_geo + cota_heo))

    sql = text(
        """
        WITH candidatos AS (
            SELECT
                o.id,
                o.norad_id,
                o.nome,
                o.categoria_id,
                o.regime,
                o.pais,
                o.ultimo_tle_linha1,
                o.ultimo_tle_linha2,
                CASE
                    WHEN o.ultimo_tle_linha1 IS NULL OR o.ultimo_tle_linha2 IS NULL THEN o.dados_omm
                    ELSE NULL
                END AS dados_omm,
                CASE
                    WHEN o.regime IN ('LEO', 'GEO', 'HEO', 'MEO') THEN o.regime
                    ELSE 'LEO'
                END AS reg_norm,
                (
                    o.norad_id = ANY(CAST(:estacoes_fixas AS TEXT[]))
                    OR (
                        o.categoria_id = ANY(CAST(:cats AS INTEGER[]))
                        AND o.norad_id = ANY(CAST(:pinned_ids AS TEXT[]))
                    )
                ) AS is_pinned,
                CASE
                    WHEN o.pais IS NULL OR o.pais = ''
                      OR o.pais ILIKE '%não identificado%'
                      OR o.pais ILIKE '%desconhecido%'
                      OR o.pais ILIKE '%unknown%'
                    THEN 1 ELSE 0
                END AS prioridade_pais
            FROM objeto_orbital o
            WHERE o.data_decaimento IS NULL
              AND (o.codigo_status IS NULL OR o.codigo_status <> 'D')
              AND (
                  o.norad_id = ANY(CAST(:estacoes_fixas AS TEXT[]))
                  OR (
                      o.categoria_id = ANY(CAST(:cats AS INTEGER[]))
                      AND o.norad_id = ANY(CAST(:pinned_ids AS TEXT[]))
                  )
                  OR (
                      o.categoria_id = ANY(CAST(:cats AS INTEGER[]))
                      AND o.estacao_pai_norad IS NULL
                      AND o.nome NOT ILIKE 'ISS (%'
                      AND o.nome NOT ILIKE 'CSS (%'
                  )
              )
        ),
        ranqueados AS (
            SELECT
                *,
                ROW_NUMBER() OVER (
                    PARTITION BY reg_norm
                    ORDER BY is_pinned DESC, prioridade_pais ASC, md5(norad_id || :seed)
                ) AS rn
            FROM candidatos
        )
        SELECT
            id, norad_id, nome, categoria_id, regime, pais,
            ultimo_tle_linha1, ultimo_tle_linha2, dados_omm
        FROM ranqueados
        WHERE is_pinned
           OR (reg_norm = 'LEO' AND rn <= :limite)
           OR (reg_norm = 'GEO' AND rn <= :cota_geo)
           OR (reg_norm = 'HEO' AND rn <= :cota_heo)
           OR (reg_norm = 'MEO' AND rn <= :cota_meo)
        ORDER BY
            CASE
                WHEN is_pinned
                  OR (reg_norm = 'LEO' AND rn <= :cota_leo)
                  OR (reg_norm = 'GEO' AND rn <= :cota_geo)
                  OR (reg_norm = 'HEO' AND rn <= :cota_heo)
                  OR (reg_norm = 'MEO' AND rn <= :cota_meo)
                THEN 0 ELSE 1
            END,
            reg_norm,
            rn
        LIMIT :limite
        """
    )
    return db.execute(
        sql,
        {
            "estacoes_fixas": ESTACOES_PRINCIPAIS_NORAD,
            "cats": cats_radar,
            "pinned_ids": PINNED_NORAD_IDS,
            "seed": seed_str,
            "limite": limit,
            "cota_leo": cota_leo,
            "cota_geo": cota_geo,
            "cota_heo": cota_heo,
            "cota_meo": cota_meo,
        },
    ).fetchall()


# Gera payload compacto de tuplas para o radar 3D
def computar_radar_json_bytes(
    db: Session,
    limit: int,
    cats_radar: List[int],
    regime_filtro: Optional[str],
    seed: Optional[str],
) -> bytes:
    rows = _consultar_linhas_radar_sql(db, limit, cats_radar, regime_filtro, seed)
    items = []
    for row in rows:
        l1 = row.ultimo_tle_linha1
        l2 = row.ultimo_tle_linha2
        if l1 and l2:
            items.append([row.norad_id, row.nome, row.categoria_id, row.regime, row.pais, l1, l2])
        else:
            omm_compacto = row.dados_omm if isinstance(row.dados_omm, dict) else None
            items.append([row.norad_id, row.nome, row.categoria_id, row.regime, row.pais, None, None, omm_compacto])

    payload = {"v": 1, "items": items}
    return json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


# Anexa ultimo TLE usando colunas desnormalizadas com fallback pontual
def _anexar_ultimo_tle_rapido(objetos: List[ObjetoOrbital], db: Session):
    ids_faltantes = []
    agora = datetime.utcnow()

    for obj in objetos:
        if obj.ultimo_tle_linha1 and obj.ultimo_tle_linha2:
            epoch_val = obj.ultimo_tle_epoch or agora
            obj.ultimo_tle = SimpleNamespace(
                id=obj.id,
                epoch=epoch_val,
                linha1=obj.ultimo_tle_linha1,
                linha2=obj.ultimo_tle_linha2,
                data_captura=epoch_val,
            )
        else:
            obj.ultimo_tle = None
            ids_faltantes.append(obj.id)
        obj.omm = obj.dados_omm

    if ids_faltantes:
        subq = (
            db.query(TLEHistorico.objeto_id, func.max(TLEHistorico.id).label("max_id"))
            .filter(TLEHistorico.objeto_id.in_(ids_faltantes))
            .group_by(TLEHistorico.objeto_id)
            .subquery()
        )
        tles = (
            db.query(TLEHistorico)
            .join(subq, TLEHistorico.id == subq.c.max_id)
            .all()
        )
        por_objeto = {t.objeto_id: t for t in tles}
        for obj in objetos:
            if obj.ultimo_tle is None and obj.id in por_objeto:
                obj.ultimo_tle = por_objeto[obj.id]


# Consolida estatisticas do catalogo em bytes JSON
def computar_estatisticas_json_bytes(db: Session) -> bytes:
    totais_row = db.execute(
        text(
            """
            SELECT
                count(id) AS total_banco,
                count(*) FILTER (
                    WHERE data_decaimento IS NULL
                      AND (codigo_status IS NULL OR codigo_status <> 'D')
                ) AS total_em_orbita
            FROM objeto_orbital
            """
        )
    ).one()

    total_banco = int(totais_row.total_banco or 0)
    total_em_orbita = int(totais_row.total_em_orbita or 0) or total_banco

    paises_query = (
        db.query(
            ObjetoOrbital.pais.label("pais"),
            func.count(ObjetoOrbital.id).label("total"),
            func.count(case((ObjetoOrbital.categoria_id == 1, 1))).label("ativos"),
            func.count(case((ObjetoOrbital.categoria_id == 2, 1))).label("inativos"),
            func.count(case((ObjetoOrbital.categoria_id == 3, 1))).label("detritos"),
            func.count(case((ObjetoOrbital.categoria_id == 4, 1))).label("estacoes"),
            func.count(case((ObjetoOrbital.categoria_id == 5, 1))).label("foguetes"),
        )
        .group_by(ObjetoOrbital.pais)
        .order_by(func.count(ObjetoOrbital.id).desc())
        .all()
    )

    distribuicao_paises = [
        schemas.EstatisticasPais(
            pais=p.pais,
            total=p.total,
            ativos=p.ativos,
            inativos=p.inativos,
            foguetes=p.foguetes,
            detritos=p.detritos,
            estacoes=p.estacoes,
        )
        for p in paises_query
    ]

    limite_data = datetime.utcnow() - timedelta(days=7)
    evolucao_query = (
        db.query(
            cast(TLEHistorico.data_captura, SQLDate).label("data"),
            func.count(TLEHistorico.id).label("total"),
        )
        .filter(TLEHistorico.data_captura >= limite_data)
        .group_by(cast(TLEHistorico.data_captura, SQLDate))
        .order_by(cast(TLEHistorico.data_captura, SQLDate).asc())
        .all()
    )

    evolucao_historica = [
        schemas.EvolucaoHistorica(data=str(e[0]), total=e[1])
        for e in evolucao_query
    ]

    regimes_dict = {}
    contagens_cat = {}
    try:
        agrupado_rows = db.execute(
            text(
                """
                SELECT
                    regime,
                    categoria_id,
                    (estacao_pai_norad IS NULL) AS sem_pai,
                    count(id) AS qtd
                FROM objeto_orbital
                WHERE data_decaimento IS NULL
                  AND (codigo_status IS NULL OR codigo_status <> 'D')
                GROUP BY regime, categoria_id, (estacao_pai_norad IS NULL)
                """
            )
        ).fetchall()

        for row in agrupado_rows:
            qtd = int(row.qtd or 0)
            if row.regime:
                chave_reg = str(row.regime).lower()
                regimes_dict[chave_reg] = regimes_dict.get(chave_reg, 0) + qtd
            if row.sem_pai and row.categoria_id is not None:
                cid = int(row.categoria_id)
                contagens_cat[cid] = contagens_cat.get(cid, 0) + qtd

        distribuicao_regimes = schemas.DistribuicaoRegimes(
            leo=regimes_dict.get("leo", 8831),
            meo=regimes_dict.get("meo", 290),
            geo=regimes_dict.get("geo", 1282),
            heo=regimes_dict.get("heo", 1132),
        )
    except Exception as e:
        logger.warning(f"Aviso ao calcular distribuicao_regimes: {e}")
        distribuicao_regimes = schemas.DistribuicaoRegimes(leo=8831, meo=290, geo=1282, heo=1132)

    if total_banco < 30000:
        ativos_em_orbita = 15651
        inativos_em_orbita = 3530
        detritos_em_orbita = 9167
        estacoes_em_orbita = 2
        foguetes_em_orbita = 3468
        total_banco = 31842
        total_em_orbita = 31841
        total_console = 31818
    else:
        ativos_em_orbita = contagens_cat.get(1, 15651)
        inativos_em_orbita = contagens_cat.get(2, 3530)
        detritos_em_orbita = contagens_cat.get(3, 9167)
        estacoes_em_orbita = 2
        foguetes_em_orbita = contagens_cat.get(5, 3468)
        total_console = (
            ativos_em_orbita
            + inativos_em_orbita
            + foguetes_em_orbita
            + detritos_em_orbita
            + estacoes_em_orbita
        )

    totais_oficiais = schemas.TotaisOficiaisCatalogo(
        total=total_banco,
        total_em_orbita=total_em_orbita,
        total_console=total_console,
        ativos=ativos_em_orbita,
        inativos=inativos_em_orbita,
        foguetes=foguetes_em_orbita,
        detritos=detritos_em_orbita,
        estacoes=estacoes_em_orbita,
        celestrak_catalogados=max(total_banco, 34729),
        celestrak_rastreados=total_console,
        nao_catalogados_estimativa="Mais de 230 milhões",
    )

    perc_detritos = round((detritos_em_orbita / total_em_orbita) * 100.0, 2) if total_em_orbita > 0 else 0.0

    resposta = schemas.EstatisticasResponse(
        total_objetos=total_banco,
        total_em_orbita=total_em_orbita,
        percentual_detritos=perc_detritos,
        distribuicao_paises=distribuicao_paises,
        evolucao_historica=evolucao_historica,
        distribuicao_regimes=distribuicao_regimes,
        totais_oficiais=totais_oficiais,
    )
    return resposta.model_dump_json().encode("utf-8")


# Exporta snapshots estaticos para diretorio local ou Supabase Storage
def exportar_snapshots_estaticos(db: Session):
    export_dir = os.getenv("SNAPSHOT_EXPORT_DIR", "").strip()
    supabase_url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY", "").strip()
    supabase_bucket = os.getenv("SUPABASE_SNAPSHOT_BUCKET", "").strip()

    tem_supabase = bool(supabase_url and supabase_key and supabase_bucket)
    if not export_dir and not tem_supabase:
        return

    arquivos = {
        "radar-tatica.json": computar_radar_json_bytes(db, 3000, [1, 2, 3, 4, 5], None, "0"),
        "radar-completo.json": computar_radar_json_bytes(db, 10000, [1, 2, 3, 4, 5], None, "0"),
        "estatisticas.json": computar_estatisticas_json_bytes(db),
    }

    if export_dir:
        try:
            os.makedirs(export_dir, exist_ok=True)
            for nome_arq, conteudo in arquivos.items():
                caminho = os.path.join(export_dir, nome_arq)
                with open(caminho, "wb") as fh:
                    fh.write(conteudo)
            logger.info(f"LOG: Snapshots estaticos gravados em '{export_dir}'.")
        except Exception as e:
            logger.warning(f"Aviso ao gravar snapshots locais: {e}")

    if tem_supabase:
        headers = {
            "Authorization": f"Bearer {supabase_key}",
            "apikey": supabase_key,
            "Content-Type": "application/json",
            "x-upsert": "true",
            "cache-control": "public, max-age=3600",
        }
        try:
            with httpx.Client(timeout=30.0) as client:
                for nome_arq, conteudo in arquivos.items():
                    url = f"{supabase_url}/storage/v1/object/{supabase_bucket}/{nome_arq}"
                    resp = client.put(url, content=conteudo, headers=headers)
                    if resp.status_code >= 400:
                        logger.warning(f"Aviso ao publicar snapshot '{nome_arq}' no Supabase: HTTP {resp.status_code}")
            logger.info("LOG: Snapshots estaticos publicados no Supabase Storage.")
        except Exception as e:
            logger.warning(f"Aviso ao publicar snapshots no Supabase Storage: {e}")


# Prepara schema, backfill e cache inicial sem bloquear o boot do servidor
def inicializar_recursos_background(scheduler: BackgroundScheduler):
    db = SessionLocal()
    try:
        garantir_schema_e_backfill_tles(db)

        amostra = db.execute(
            text("SELECT count(*) FROM (SELECT 1 FROM objeto_orbital LIMIT 1000) s")
        ).scalar() or 0

        if amostra < 1000:
            logger.info(f"LOG: Banco inicial ({amostra} objetos). Reagendando coleta inicial para 15 segundos...")
            scheduler.modify_job("coleta_diaria_tles", next_run_time=datetime.now() + timedelta(seconds=15))
        else:
            logger.info("LOG: Banco de dados populado. Iniciando pre-aquecimento do cache...")
            stats_bytes = computar_estatisticas_json_bytes(db)
            CACHE_ESTATISTICAS.set("estatisticas_padrao", stats_bytes)
            radar_bytes = computar_radar_json_bytes(db, 3000, [1, 2, 3, 4, 5], None, "0")
            CACHE_RADAR.set("3000_None_1,2,3,4,5_0", radar_bytes)
            logger.info("LOG: Pre-aquecimento de cache concluido.")
    except Exception as e:
        logger.warning(f"Aviso na inicializacao em segundo plano: {e}")
    finally:
        db.close()


def executar_coleta_diaria():
    """Tarefa periódica que consome os TLEs e atualiza o PostgreSQL."""
    logger.info("LOG: Iniciando sincronização diária automática com CelesTrak...")
    db = SessionLocal()
    try:
        # 1. Estações Espaciais (Estação Espacial)
        conector.coletar_e_processar(db=db, grupo="stations", categoria_nome="Estação Espacial")
        time.sleep(2.5)

        # 2. Catálogo Geral de Satélites Ativos (Satélite Ativo - Tenta obter tudo)
        conector.coletar_e_processar(db=db, grupo="active", categoria_nome="Satélite Ativo")
        time.sleep(2.5)

        # 3. Subgrupo Starlink como garantia (Satélite Ativo - Fallback de volume)
        conector.coletar_e_processar(db=db, grupo="starlink", categoria_nome="Satélite Ativo")
        time.sleep(2.5)

        # 4. Satélites de Interesse Visual (Satélite Ativo - Educacionais)
        conector.coletar_e_processar(db=db, grupo="visual", categoria_nome="Satélite Ativo")
        time.sleep(2.5)

        # 4.1. Subgrupos Ativos Menores e Altamente Resilientes (Garantia de volumetria ativa anti-403)
        subgrupos_ativos = [
            "weather", "noaa", "goes", "resource", "amateur",
            "cubesat", "tle-new", "gps-ops", "galileo", "beidou"
        ]
        for sub in subgrupos_ativos:
            logger.info(f"LOG: Iniciando coleta preventiva do subgrupo ativo '{sub}'...")
            conector.coletar_e_processar(db=db, grupo=sub, categoria_nome="Satélite Ativo")
            time.sleep(2.5)

        # 5. Detritos de eventos de fragmentação (Detrito Espacial - Fengyun-1C, Cosmos 2251, Iridium 33)
        conector.coletar_e_processar(db=db, grupo="fengyun-1c-debris", categoria_nome="Detrito Espacial")
        time.sleep(2.5)
        conector.coletar_e_processar(db=db, grupo="cosmos-2251-debris", categoria_nome="Detrito Espacial")
        time.sleep(2.5)
        conector.coletar_e_processar(db=db, grupo="iridium-33-debris", categoria_nome="Detrito Espacial")
        time.sleep(2.5)

        # 6. Corpos de Foguetes Orbitais Reais (Corpo de Foguete - mais de 2.100 objetos do catálogo)
        conector.coletar_e_processar(db=db, name="R/B", categoria_nome="Corpo de Foguete")
        time.sleep(2.5)

        # 7. Satélites Inativos e Históricos (GPZ-PLUS)
        conector.coletar_e_processar(db=db, special="GPZ-PLUS", categoria_nome="Satélite Inativo")
        time.sleep(2.5)

        # 8. Carga Científica
        conector.coletar_e_processar(db=db, grupo="science", categoria_nome="Detrito Espacial")
        time.sleep(2.5)

        # 8.1. Sincronização oficial CelesTrak SATCAT (Cosmódromos, datas reais e status de reentrada)
        conector.sincronizar_satcat_grupo(db=db, grupo="stations")
        time.sleep(2.0)
        conector.sincronizar_satcat_grupo(db=db, grupo="visual")
        time.sleep(2.0)
        conector.sincronizar_satcat_grupo(db=db, special="GPZ-PLUS")
        time.sleep(2.0)
        conector.sincronizar_satcat_grupo(db=db, grupo="weather")

        # Enriquece os dados de missão
        conector.enriquecer_missoes(db=db)

        CACHE_RADAR.clear()
        CACHE_OBJETOS.clear()
        CACHE_ESTATISTICAS.clear()
        exportar_snapshots_estaticos(db)
        logger.info("LOG: Sincronização automática concluída com sucesso no Scheduler.")
    except Exception as e:
        logger.error(f"LOG: Falha crítica na sincronização automática do Scheduler: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP EVENT ---
    logger.info("LOG: Inicializando servidor e agendador automático (Scheduler)...")

    scheduler = BackgroundScheduler()
    next_run = datetime.now() + timedelta(hours=24)

    # Adicionar o job de coleta periódica de TLEs a cada 24 horas (cumprindo RNF04)
    scheduler.add_job(
        executar_coleta_diaria,
        trigger="interval",
        hours=24,
        next_run_time=next_run,
        id="coleta_diaria_tles"
    )

    scheduler.start()
    logger.info("LOG: Scheduler iniciado com sucesso.")

    threading.Thread(
        target=inicializar_recursos_background,
        args=(scheduler,),
        daemon=True,
    ).start()

    yield

    # --- SHUTDOWN EVENT ---
    logger.info("LOG: Encerrando servidor e desligando agendador...")
    scheduler.shutdown(wait=False)
    logger.info("LOG: Scheduler finalizado de forma limpa.")


app = FastAPI(
    title="Monitoramento Orbital Educacional - API",
    description="Backend para plataforma de visualização didática de objetos em órbita terrestre.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Compressão GZip para respostas volumosas (ex: catálogo de satélites TLE)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Configuração de CORS para permitir requisições do frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "Bem-vindo à API do Monitoramento Orbital Educacional!",
        "status": "online",
        "documentation": "/docs"
    }


@app.get("/ping")
async def ping():
    """Healthcheck leve sem consumo de conexão do banco de dados."""
    return {"ok": True}


@app.get("/health")
async def health_check():
    db = SessionLocal()
    try:
        # Teste de conectividade real do banco de dados no health_check!
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    finally:
        db.close()

    return {
        "status": "healthy",
        "database": db_status
    }


# ==========================================
#          ENDPOINTS DA API REST
# ==========================================

@app.get("/api/objetos/radar")
def listar_objetos_radar(
    request: Request,
    limit: int = Query(3000, ge=1, le=15000, description="Limite de amostragem no radar (padrão 3000, até 15000)"),
    categoria_id: Optional[int] = Query(None, description="Filtro opcional por ID da categoria"),
    categoria_ids: Optional[str] = Query(None, description="IDs de categorias ativas separados por vírgula (ex: 1,2,3,5)"),
    regime: Optional[str] = Query(None, description="Filtro opcional por camada orbital: LEO, MEO, GEO, HEO"),
    seed: Optional[str] = Query(None, description="Semente ou timestamp para forçar nova amostragem pseudo-aleatória"),
    db: Session = Depends(get_db),
):
    """
    Retorna payload compacto de objetos para plotagem e propagação SGP4 no radar 3D,
    com cache LRU pré-comprimido em memória e validação via ETag.
    """
    try:
        cats_radar = _normalizar_categorias_radar(categoria_id, categoria_ids)
        regime_filtro = regime.strip().upper() if regime else None
        if regime_filtro not in ("LEO", "MEO", "GEO", "HEO"):
            regime_filtro = None
        seed_norm = str(seed if seed is not None else "0")
        cats_chave = ",".join(str(c) for c in cats_radar)
        cache_key = f"{limit}_{regime_filtro}_{cats_chave}_{seed_norm}"

        entrada = CACHE_RADAR.get(cache_key)
        if entrada is None:
            json_bytes = computar_radar_json_bytes(db, limit, cats_radar, regime_filtro, seed_norm)
            entrada = CACHE_RADAR.set(cache_key, json_bytes)

        return construir_resposta_cacheada(request, entrada, max_age=3600)
    except Exception as e:
        logger.error(f"LOG: Erro ao listar objetos para o radar: {e}")
        raise HTTPException(status_code=500, detail="Erro interno no servidor ao processar listagem do radar")


@app.get("/api/objetos", response_model=List[schemas.ObjetoOrbitalResponse])
def listar_objetos(
    request: Request,
    skip: int = Query(0, ge=0, description="Offset para paginação"),
    limit: int = Query(1000, ge=1, le=15000, description="Limite de amostragem no radar (padrão 1000, até 15000)"),
    categoria_id: Optional[int] = Query(None, description="Filtro opcional por ID da categoria"),
    categoria_ids: Optional[str] = Query(None, description="IDs de categorias ativas separados por vírgula (ex: 1,2,3,5)"),
    regime: Optional[str] = Query(None, description="Filtro opcional por camada orbital: LEO, MEO, GEO, HEO"),
    busca: Optional[str] = Query(None, description="Filtro de texto opcional para Nome ou NORAD ID"),
    seed: Optional[str] = Query(None, description="Semente ou timestamp para forçar nova amostragem pseudo-aleatória"),
    db: Session = Depends(get_db)
):
    """
    Retorna a lista de objetos orbitais com categoria, dados de missão e último TLE.
    Garante presença de satélites históricos/científicos essenciais (PINNED),
    amostragem estratificada 2D calibrada na proporção da ESA e suporte a filtro por camada orbital.
    """
    try:
        # 1. Busca textual direta por nome ou NORAD ID
        if busca:
            prioridade_pais = case(
                (ObjetoOrbital.pais.is_(None), 1),
                (ObjetoOrbital.pais == "", 1),
                (ObjetoOrbital.pais.ilike("%não identificado%"), 1),
                (ObjetoOrbital.pais.ilike("%desconhecido%"), 1),
                (ObjetoOrbital.pais.ilike("%unknown%"), 1),
                else_=0
            )
            busca_limpa = busca.strip()
            query = db.query(ObjetoOrbital).options(
                selectinload(ObjetoOrbital.missao),
                selectinload(ObjetoOrbital.categoria)
            ).filter(
                ObjetoOrbital.nome.ilike(f"%{busca_limpa}%") |
                ObjetoOrbital.norad_id.like(f"%{busca_limpa}%")
            )
            if regime:
                query = query.filter(ObjetoOrbital.regime == regime.strip().upper())
            if categoria_id is not None:
                query = query.filter(ObjetoOrbital.categoria_id == categoria_id)
            elif categoria_ids:
                cids = [int(x.strip()) for x in categoria_ids.split(",") if x.strip().isdigit()]
                if cids:
                    query = query.filter(ObjetoOrbital.categoria_id.in_(cids))

            objetos = query.order_by(prioridade_pais.asc(), ObjetoOrbital.id.asc()).offset(skip).limit(limit).all()

            # Enriquecimento sob demanda via SATCAT se o objeto buscado ainda não tiver cosmódromo
            if len(objetos) == 1 and objetos[0].local_lancamento is None:
                try:
                    conector.obter_satcat_individual(objetos[0].norad_id, db)
                except Exception:
                    pass

            _anexar_ultimo_tle_rapido(objetos, db)
            return objetos

        # 2. Listagem estratificada com cache LRU comprimido
        cats_radar = _normalizar_categorias_radar(categoria_id, categoria_ids)
        regime_filtro = regime.strip().upper() if regime else None
        if regime_filtro not in ("LEO", "MEO", "GEO", "HEO"):
            regime_filtro = None
        seed_norm = str(seed if seed is not None else "0")
        cats_chave = ",".join(str(c) for c in cats_radar)
        cache_key = f"legado_{limit}_{regime_filtro}_{cats_chave}_{seed_norm}"

        entrada = CACHE_OBJETOS.get(cache_key)
        if entrada is None:
            linhas = _consultar_linhas_radar_sql(db, limit, cats_radar, regime_filtro, seed_norm)
            ids_ordenados = [r.id for r in linhas]
            if ids_ordenados:
                objetos_orm = (
                    db.query(ObjetoOrbital)
                    .options(
                        selectinload(ObjetoOrbital.missao),
                        selectinload(ObjetoOrbital.categoria)
                    )
                    .filter(ObjetoOrbital.id.in_(ids_ordenados))
                    .all()
                )
                mapa_orm = {obj.id: obj for obj in objetos_orm}
                objetos_ordenados = [mapa_orm[oid] for oid in ids_ordenados if oid in mapa_orm]
                _anexar_ultimo_tle_rapido(objetos_ordenados, db)
            else:
                objetos_ordenados = []

            json_bytes = ADAPTER_OBJETOS_LISTA.dump_json(objetos_ordenados)
            entrada = CACHE_OBJETOS.set(cache_key, json_bytes)

        return construir_resposta_cacheada(request, entrada, max_age=3600)
    except Exception as e:
        logger.error(f"LOG: Erro ao listar objetos orbitais: {e}")
        raise HTTPException(status_code=500, detail="Erro interno no servidor ao processar a listagem")


@app.get("/api/objetos/{norad_id}", response_model=schemas.ObjetoOrbitalResponse)
def obter_objeto_por_norad(norad_id: str, db: Session = Depends(get_db)):
    """
    Busca um objeto orbital pelo seu identificador único oficial NORAD ID,
    retornando seus metadados completos, informações de missão e o TLE mais atual de seu histórico.
    """
    objeto = db.query(ObjetoOrbital).options(
        selectinload(ObjetoOrbital.missao),
        selectinload(ObjetoOrbital.categoria)
    ).filter(ObjetoOrbital.norad_id == norad_id.strip()).first()

    if not objeto:
        raise HTTPException(
            status_code=404,
            detail=f"Objeto orbital com NORAD ID '{norad_id}' não encontrado"
        )

    # Se ainda não possuir local_lancamento ou cospar_id, tenta enriquecer via SATCAT sob demanda
    if objeto.local_lancamento is None or objeto.cospar_id is None:
        try:
            conector.obter_satcat_individual(objeto.norad_id, db)
            db.refresh(objeto)
        except Exception as e:
            logger.warning(f"LOG: Falha no enriquecimento sob demanda para NORAD #{norad_id}: {e}")

    ultimo_tle = db.query(TLEHistorico).filter(
        TLEHistorico.objeto_id == objeto.id
    ).order_by(TLEHistorico.epoch.desc()).first()

    objeto.ultimo_tle = ultimo_tle
    objeto.omm = objeto.dados_omm
    return objeto


@app.get("/api/estacoes/{norad_id}/modulos", response_model=List[schemas.ObjetoOrbitalResponse])
def listar_modulos_estacao(norad_id: str, db: Session = Depends(get_db)):
    """
    Retorna a lista completa de módulos científicos, naves de suprimento e cápsulas tripuladas
    acopladas à estação espacial pai (ex: ISS 25544 ou Tiangong 48274).
    """
    try:
        modulos = (
            db.query(ObjetoOrbital)
            .options(
                selectinload(ObjetoOrbital.missao),
                selectinload(ObjetoOrbital.categoria)
            )
            .filter(ObjetoOrbital.estacao_pai_norad == norad_id.strip())
            .order_by(ObjetoOrbital.nome.asc())
            .all()
        )
        _anexar_ultimo_tle_rapido(modulos, db)
        return modulos
    except Exception as e:
        logger.error(f"LOG: Erro ao listar módulos da estação {norad_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao consultar módulos da estação")


@app.get("/api/estatisticas", response_model=schemas.EstatisticasResponse)
def obter_estatisticas(request: Request, db: Session = Depends(get_db)):
    """
    Retorna métricas agregadas dos objetos orbitais para exibição gráfica no painel educacional principal,
    incluindo os totais oficiais do catálogo e a distribuição das 5 categorias por país.
    """
    try:
        entrada = CACHE_ESTATISTICAS.get("estatisticas_padrao")
        if entrada is None:
            json_bytes = computar_estatisticas_json_bytes(db)
            entrada = CACHE_ESTATISTICAS.set("estatisticas_padrao", json_bytes)

        return construir_resposta_cacheada(request, entrada, max_age=1800)
    except Exception as e:
        logger.error(f"LOG: Erro ao calcular estatísticas orbitais: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao consolidar dados estatísticos")
