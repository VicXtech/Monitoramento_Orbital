import time
import logging
import math
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, text, cast, Date as SQLDate, case
from sqlalchemy.orm import Session, selectinload
from apscheduler.schedulers.background import BackgroundScheduler

from app.database import SessionLocal, get_db
from app.collector import APIConector
from app.models import ObjetoOrbital, CategoriaObjeto, TLEHistorico
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
        
        logger.info("LOG: Sincronização automática concluída com sucesso no Scheduler.")
    except Exception as e:
        logger.error(f"LOG: Falha crítica na sincronização automática do Scheduler: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP EVENT ---
    logger.info("LOG: Inicializando servidor e agendador automático (Scheduler)...")
    
    # Criar o scheduler de segundo plano
    scheduler = BackgroundScheduler()
    
    # Verificar se o banco já possui catálogo populado
    db = SessionLocal()
    total_objs = 0
    try:
        total_objs = db.query(ObjetoOrbital).count()
    except Exception as e:
        logger.warning(f"Aviso ao consultar quantidade inicial de objetos: {e}")
    finally:
        db.close()

    # Se já tiver mais de 1000 objetos, não sobrecarrega o CelesTrak no boot
    if total_objs >= 1000:
        logger.info(f"LOG: Banco de dados já populado com {total_objs} objetos. Próxima coleta agendada para daqui a 24 horas.")
        next_run = datetime.now() + timedelta(hours=24)
    else:
        logger.info(f"LOG: Banco inicial ({total_objs} objetos). Agendando coleta inicial em 15 segundos...")
        next_run = datetime.now() + timedelta(seconds=15)

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
    
    yield
    
    # --- SHUTDOWN EVENT ---
    logger.info("LOG: Encerrando servidor e desligando agendador...")
    scheduler.shutdown()
    logger.info("LOG: Scheduler finalizado de forma limpa.")


app = FastAPI(
    title="Monitoramento Orbital Educacional - API",
    description="Backend para plataforma de visualização didática de objetos em órbita terrestre.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

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

@app.get("/api/objetos", response_model=List[schemas.ObjetoOrbitalResponse])
def listar_objetos(
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
        # Aplica seed pseudo-aleatória no PostgreSQL se fornecida
        if seed:
            try:
                seed_float = (abs(hash(str(seed))) % 1000000) / 1000000.0
                db.execute(text(f"SELECT setseed({seed_float})"))
            except Exception as e:
                logger.warning(f"Aviso ao aplicar setseed: {e}")

        prioridade_pais = case(
            (ObjetoOrbital.pais.is_(None), 1),
            (ObjetoOrbital.pais == "", 1),
            (ObjetoOrbital.pais.ilike("%não identificado%"), 1),
            (ObjetoOrbital.pais.ilike("%desconhecido%"), 1),
            (ObjetoOrbital.pais.ilike("%unknown%"), 1),
            else_=0
        )

        subq = db.query(
            TLEHistorico.objeto_id,
            func.max(TLEHistorico.id).label("max_id")
        ).group_by(TLEHistorico.objeto_id).subquery()

        query_base = db.query(ObjetoOrbital, TLEHistorico).outerjoin(
            subq, ObjetoOrbital.id == subq.c.objeto_id
        ).outerjoin(
            TLEHistorico,
            TLEHistorico.id == subq.c.max_id
        ).options(
            selectinload(ObjetoOrbital.missao),
            selectinload(ObjetoOrbital.categoria)
        )

        # 1. Se for busca textual direta por nome ou NORAD ID
        if busca:
            busca_limpa = busca.strip()
            query = query_base.filter(
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
            results = query.order_by(prioridade_pais.asc(), ObjetoOrbital.id.asc()).offset(skip).limit(limit).all()

            # Enriquecimento sob demanda via SATCAT se o objeto buscado ainda não tiver cosmódromo
            if len(results) == 1 and results[0][0].local_lancamento is None:
                try:
                    conector.obter_satcat_individual(results[0][0].norad_id, db)
                except Exception:
                    pass

        else:
            # 2. No radar do simulador 3D: apenas objetos em órbita ativa (expurga objetos decaídos)
            query_base = query_base.filter(
                ObjetoOrbital.data_decaimento.is_(None),
                (ObjetoOrbital.codigo_status != 'D') | (ObjetoOrbital.codigo_status.is_(None))
            )

            # Categorias ativas
            if categoria_ids:
                cats_ativas = [int(x.strip()) for x in categoria_ids.split(",") if x.strip().isdigit()]
            elif categoria_id is not None:
                cats_ativas = [categoria_id]
            else:
                cats_ativas = [1, 2, 3, 4, 5]

            cats_radar = [c for c in cats_ativas if c in [1, 2, 3, 4, 5]]
            regime_filtro = regime.strip().upper() if regime else None

            # CASO A: Filtro específico por camada orbital (Drill-Down / isolamento de camada)
            if regime_filtro in ["LEO", "MEO", "GEO", "HEO"]:
                pinned_filter = (
                    ObjetoOrbital.norad_id.in_(["25544", "48274"]) | (
                        ObjetoOrbital.categoria_id.in_(cats_radar) &
                        ObjetoOrbital.norad_id.in_(PINNED_NORAD_IDS)
                    )
                )
                pinned_na_camada = query_base.filter(
                    pinned_filter,
                    ObjetoOrbital.regime == regime_filtro
                ).all()
                pinned_ids = set(p[0].id for p in pinned_na_camada)

                vagas_restantes = max(0, limit - len(pinned_na_camada))
                outros = []
                if vagas_restantes > 0:
                    outros_query = query_base.filter(
                        ObjetoOrbital.regime == regime_filtro,
                        ObjetoOrbital.categoria_id.in_(cats_radar),
                        ObjetoOrbital.estacao_pai_norad.is_(None),
                        ~ObjetoOrbital.nome.ilike("ISS (%"),
                        ~ObjetoOrbital.nome.ilike("CSS (%")
                    )
                    if pinned_ids:
                        outros_query = outros_query.filter(~ObjetoOrbital.id.in_(pinned_ids))

                    outros = outros_query.order_by(prioridade_pais.asc(), func.random()).limit(vagas_restantes).all()

                results = pinned_na_camada + outros

            # CASO B: Amostragem Estratificada 2D Proporcional da ESA (84% LEO, 9% GEO, 5% HEO, 2% MEO)
            else:
                cota_leo = int(round(limit * 0.84))
                cota_geo = int(round(limit * 0.09))
                cota_heo = int(round(limit * 0.05))
                cota_meo = max(1, limit - (cota_leo + cota_geo + cota_heo))

                cotas_camadas = {
                    "LEO": cota_leo,
                    "GEO": cota_geo,
                    "HEO": cota_heo,
                    "MEO": cota_meo
                }

                # Objetos VIP / Pinned sempre garantidos (inclui as 2 estações principais permanentemente)
                pinned_filter = (
                    ObjetoOrbital.norad_id.in_(["25544", "48274"]) | (
                        ObjetoOrbital.categoria_id.in_(cats_radar) &
                        ObjetoOrbital.norad_id.in_(PINNED_NORAD_IDS)
                    )
                )
                pinned = query_base.filter(pinned_filter).all()
                pinned_ids = set(p[0].id for p in pinned)

                pinned_por_reg = {"LEO": [], "GEO": [], "HEO": [], "MEO": []}
                for p in pinned:
                    reg_obj = p[0].regime or "LEO"
                    if reg_obj in pinned_por_reg:
                        pinned_por_reg[reg_obj].append(p)
                    else:
                        pinned_por_reg["LEO"].append(p)

                amostras_totais = []
                sobra_vagas = 0

                for reg_nome, cota_alvo in cotas_camadas.items():
                    pinned_camada = pinned_por_reg[reg_nome]
                    amostras_totais.extend(pinned_camada)
                    vagas = max(0, cota_alvo - len(pinned_camada))
                    if vagas > 0:
                        itens_query = query_base.filter(
                            ObjetoOrbital.regime == reg_nome,
                            ObjetoOrbital.categoria_id.in_(cats_radar),
                            ObjetoOrbital.estacao_pai_norad.is_(None),
                            ~ObjetoOrbital.nome.ilike("ISS (%"),
                            ~ObjetoOrbital.nome.ilike("CSS (%")
                        )
                        if pinned_ids:
                            itens_query = itens_query.filter(~ObjetoOrbital.id.in_(pinned_ids))

                        itens_camada = itens_query.order_by(prioridade_pais.asc(), func.random()).limit(vagas).all()
                        amostras_totais.extend(itens_camada)
                        if len(itens_camada) < vagas:
                            sobra_vagas += (vagas - len(itens_camada))

                # Se sobrar alguma vaga (ex: camada pequena com menos itens que a cota), compensa em LEO
                if sobra_vagas > 0:
                    ids_ja_inclusos = set(r[0].id for r in amostras_totais)
                    extras_leo = query_base.filter(
                        ObjetoOrbital.regime == "LEO",
                        ObjetoOrbital.categoria_id.in_(cats_radar),
                        ObjetoOrbital.estacao_pai_norad.is_(None),
                        ~ObjetoOrbital.id.in_(ids_ja_inclusos),
                        ~ObjetoOrbital.nome.ilike("ISS (%"),
                        ~ObjetoOrbital.nome.ilike("CSS (%")
                    ).order_by(prioridade_pais.asc(), func.random()).limit(sobra_vagas).all()
                    amostras_totais.extend(extras_leo)

                results = amostras_totais

        response_data = []
        for objeto, tle in results:
            objeto.ultimo_tle = tle
            objeto.omm = objeto.dados_omm
            response_data.append(objeto)

        return response_data
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
        subq = db.query(
            TLEHistorico.objeto_id,
            func.max(TLEHistorico.id).label("max_id")
        ).group_by(TLEHistorico.objeto_id).subquery()

        modulos = db.query(ObjetoOrbital, TLEHistorico).outerjoin(
            subq, ObjetoOrbital.id == subq.c.objeto_id
        ).outerjoin(
            TLEHistorico, TLEHistorico.id == subq.c.max_id
        ).options(
            selectinload(ObjetoOrbital.missao),
            selectinload(ObjetoOrbital.categoria)
        ).filter(
            ObjetoOrbital.estacao_pai_norad == norad_id.strip()
        ).order_by(
            ObjetoOrbital.nome.asc()
        ).all()

        response_data = []
        for objeto, tle in modulos:
            objeto.ultimo_tle = tle
            objeto.omm = objeto.dados_omm
            response_data.append(objeto)

        return response_data
    except Exception as e:
        logger.error(f"LOG: Erro ao listar módulos da estação {norad_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao consultar módulos da estação")


@app.get("/api/objetos/{norad_id}", response_model=schemas.ObjetoOrbitalResponse)
def obter_objeto_detalhe(norad_id: str, db: Session = Depends(get_db)):
    """Retorna detalhes de um objeto específico por NORAD ID, enriquecendo via SATCAT se necessário."""
    try:
        subq = db.query(
            TLEHistorico.objeto_id,
            func.max(TLEHistorico.id).label("max_id")
        ).group_by(TLEHistorico.objeto_id).subquery()

        row = db.query(ObjetoOrbital, TLEHistorico).outerjoin(
            subq, ObjetoOrbital.id == subq.c.objeto_id
        ).outerjoin(
            TLEHistorico,
            TLEHistorico.id == subq.c.max_id
        ).options(
            selectinload(ObjetoOrbital.missao),
            selectinload(ObjetoOrbital.categoria)
        ).filter(ObjetoOrbital.norad_id == str(norad_id).strip()).first()

        if not row:
            raise HTTPException(status_code=404, detail="Objeto orbital não encontrado")

        obj, tle = row

        # Se não possui cosmódromo ou data precisa, enriquece via SATCAT
        if obj.local_lancamento is None:
            try:
                conector.obter_satcat_individual(obj.norad_id, db)
                db.refresh(obj)
            except Exception:
                pass

        obj.ultimo_tle = tle
        return obj
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"LOG: Erro ao consultar detalhes do objeto {norad_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao buscar objeto")


@app.get("/api/estatisticas", response_model=schemas.EstatisticasResponse)
def obter_estatisticas(db: Session = Depends(get_db)):
    """
    Retorna métricas agregadas dos objetos orbitais para exibição gráfica no painel educacional principal,
    incluindo os totais oficiais do catálogo e a distribuição das 5 categorias por país.
    """
    try:
        total_banco = db.query(func.count(ObjetoOrbital.id)).scalar() or 0
        total_em_orbita = db.query(func.count(ObjetoOrbital.id)).filter(
            ObjetoOrbital.data_decaimento.is_(None),
            (ObjetoOrbital.codigo_status != 'D') | (ObjetoOrbital.codigo_status.is_(None))
        ).scalar() or total_banco

        paises_query = db.query(
            ObjetoOrbital.pais.label("pais"),
            func.count(ObjetoOrbital.id).label("total"),
            func.count(case((ObjetoOrbital.categoria_id == 1, 1))).label("ativos"),
            func.count(case((ObjetoOrbital.categoria_id == 2, 1))).label("inativos"),
            func.count(case((ObjetoOrbital.categoria_id == 3, 1))).label("detritos"),
            func.count(case((ObjetoOrbital.categoria_id == 4, 1))).label("estacoes"),
            func.count(case((ObjetoOrbital.categoria_id == 5, 1))).label("foguetes")
        ).group_by(
            ObjetoOrbital.pais
        ).order_by(
            func.count(ObjetoOrbital.id).desc()
        ).all()

        distribuicao_paises = [
            schemas.EstatisticasPais(
                pais=p.pais, 
                total=p.total,
                ativos=p.ativos,
                inativos=p.inativos,
                foguetes=p.foguetes,
                detritos=p.detritos,
                estacoes=p.estacoes
            )
            for p in paises_query
        ]

        limite_data = datetime.utcnow() - timedelta(days=7)
        evolucao_query = db.query(
            cast(TLEHistorico.data_captura, SQLDate).label("data"),
            func.count(TLEHistorico.id).label("total")
        ).filter(
            TLEHistorico.data_captura >= limite_data
        ).group_by(
            cast(TLEHistorico.data_captura, SQLDate)
        ).order_by(
            cast(TLEHistorico.data_captura, SQLDate).asc()
        ).all()

        evolucao_historica = [
            schemas.EvolucaoHistorica(data=str(e[0]), total=e[1])
            for e in evolucao_query
        ]

        try:
            contagens_regimes_query = db.query(
                ObjetoOrbital.regime,
                func.count(ObjetoOrbital.id)
            ).filter(
                ObjetoOrbital.data_decaimento.is_(None),
                (ObjetoOrbital.codigo_status != 'D') | (ObjetoOrbital.codigo_status.is_(None))
            ).group_by(ObjetoOrbital.regime).all()

            regimes_dict = {str(r).lower(): c for r, c in contagens_regimes_query if r}
            distribuicao_regimes = schemas.DistribuicaoRegimes(
                leo=regimes_dict.get("leo", 8831),
                meo=regimes_dict.get("meo", 290),
                geo=regimes_dict.get("geo", 1282),
                heo=regimes_dict.get("heo", 1132)
            )
        except Exception as e:
            logger.warning(f"Aviso ao calcular distribuicao_regimes: {e}")
            distribuicao_regimes = schemas.DistribuicaoRegimes(leo=8831, meo=290, geo=1282, heo=1132)

        # Contagens reais por categoria de objetos atualmente em órbita ativa
        contagens_cat = dict(
            db.query(
                ObjetoOrbital.categoria_id,
                func.count(ObjetoOrbital.id)
            ).filter(
                ObjetoOrbital.data_decaimento.is_(None),
                (ObjetoOrbital.codigo_status != 'D') | (ObjetoOrbital.codigo_status.is_(None)),
                ObjetoOrbital.estacao_pai_norad.is_(None)
            ).group_by(ObjetoOrbital.categoria_id).all()
        )

        ativos_em_orbita = contagens_cat.get(1, 5275)
        inativos_em_orbita = contagens_cat.get(2, 1117)
        detritos_em_orbita = contagens_cat.get(3, 2835)
        estacoes_em_orbita = 2  # As 2 estações espaciais principais permanentes (ISS e Tiangong)
        foguetes_em_orbita = contagens_cat.get(5, 2283)

        total_console = ativos_em_orbita + inativos_em_orbita + foguetes_em_orbita + detritos_em_orbita + estacoes_em_orbita  # 11512

        totais_oficiais = schemas.TotaisOficiaisCatalogo(
            total=total_banco,
            total_em_orbita=total_em_orbita,
            total_console=total_console,
            ativos=ativos_em_orbita,
            inativos=inativos_em_orbita,
            foguetes=foguetes_em_orbita,
            detritos=detritos_em_orbita,
            estacoes=estacoes_em_orbita,
            celestrak_catalogados=34729,
            celestrak_rastreados=31818,
            nao_catalogados_estimativa="Mais de 140 milhões"
        )

        perc_detritos = round((detritos_em_orbita / total_em_orbita) * 100.0, 2) if total_em_orbita > 0 else 0.0

        return schemas.EstatisticasResponse(
            total_objetos=total_banco,
            total_em_orbita=total_em_orbita,
            percentual_detritos=perc_detritos,
            distribuicao_paises=distribuicao_paises,
            evolucao_historica=evolucao_historica,
            distribuicao_regimes=distribuicao_regimes,
            totais_oficiais=totais_oficiais
        )
    except Exception as e:
        logger.error(f"LOG: Erro ao calcular estatísticas orbitais: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao consolidar dados estatísticos")

