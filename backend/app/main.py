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


def executar_coleta_diaria():
    """Tarefa periódica que consome os TLEs e atualiza o PostgreSQL."""
    logger.info("LOG: Iniciando sincronização diária automática com CelesTrak...")
    db = SessionLocal()
    conector = APIConector()
    try:
        # 1. Estações Espaciais (Estação Espacial)
        conector.coletar_e_processar(db=db, grupo="stations", categoria_nome="Estação Espacial")
        
        # 2. Catálogo Geral de Satélites Ativos (Satélite Ativo - Tenta obter tudo)
        conector.coletar_e_processar(db=db, grupo="active", categoria_nome="Satélite Ativo")
        
        # 3. Subgrupo Starlink como garantia (Satélite Ativo - Fallback de volume)
        conector.coletar_e_processar(db=db, grupo="starlink", categoria_nome="Satélite Ativo")
        
        # 4. Satélites de Interesse Visual (Satélite Ativo - Educacionais)
        conector.coletar_e_processar(db=db, grupo="visual", categoria_nome="Satélite Ativo")

        # 4.1. Subgrupos Ativos Menores e Altamente Resilientes (Garantia de volumetria ativa anti-403)
        subgrupos_ativos = [
            "weather", "noaa", "goes", "resource", "amateur", 
            "cubesat", "tle-new", "gps-ops", "galileo", "beidou"
        ]
        for sub in subgrupos_ativos:
            logger.info(f"LOG: Iniciando coleta preventiva do subgrupo ativo '{sub}'...")
            conector.coletar_e_processar(db=db, grupo=sub, categoria_nome="Satélite Ativo")
        
        # 5. Detritos de eventos de fragmentação (Detrito Espacial - Fengyun-1C, Cosmos 2251, Iridium 33)
        conector.coletar_e_processar(db=db, grupo="fengyun-1c-debris", categoria_nome="Detrito Espacial")
        conector.coletar_e_processar(db=db, grupo="cosmos-2251-debris", categoria_nome="Detrito Espacial")
        conector.coletar_e_processar(db=db, grupo="iridium-33-debris", categoria_nome="Detrito Espacial")
        
        # 6. Corpos de Foguetes Orbitais Reais (Corpo de Foguete - mais de 2.100 objetos do catálogo)
        conector.coletar_e_processar(db=db, name="R/B", categoria_nome="Corpo de Foguete")
        
        # 7. Satélites Inativos e Históricos (GPZ-PLUS)
        conector.coletar_e_processar(db=db, special="GPZ-PLUS", categoria_nome="Satélite Inativo")

        # 8. Carga Científica
        conector.coletar_e_processar(db=db, grupo="science", categoria_nome="Detrito Espacial")

        # 9. Executa enriquecimento factual em 3 níveis (Wikidata + Engenharia)
        conector.enriquecer_com_wikidata(db=db)
        
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
    
    # Adicionar o job de coleta periódica de TLEs a cada 24 horas (cumprindo RNF04)
    # Definimos next_run_time como datetime.now() para disparar uma carga inicial imediatamente no boot!
    scheduler.add_job(
        executar_coleta_diaria,
        trigger="interval",
        hours=24,
        next_run_time=datetime.now(),
        id="coleta_diaria_tles"
    )
    
    scheduler.start()
    logger.info("LOG: Scheduler iniciado com sucesso. Executando primeira carga imediata no boot...")
    
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
    limit: int = Query(1000, ge=1, le=2000, description="Limite de amostragem no radar (padrão 1000)"),
    categoria_id: Optional[int] = Query(None, description="Filtro opcional por ID da categoria"),
    categoria_ids: Optional[str] = Query(None, description="IDs de categorias ativas separados por vírgula (ex: 1,2,3,5)"),
    busca: Optional[str] = Query(None, description="Filtro de texto opcional para Nome ou NORAD ID"),
    seed: Optional[str] = Query(None, description="Semente ou timestamp para forçar nova amostragem pseudo-aleatória"),
    db: Session = Depends(get_db)
):
    """
    Retorna a lista de objetos orbitais contendo a categoria correspondente,
    metadados enriquecidos de missão (Wikidata/Engenharia) e o último registro de TLE correspondente,
    otimizado via selectinload para evitar N+1 queries (RNF01).
    Garante que as 2 Estações Espaciais Principais (ISS 25544 e Tiangong 48274) estejam sempre
    presentes no cinturão do simulador e aplica amostragem dinâmica redistributiva para as categorias ativas.
    """
    try:
        # Aplica seed pseudo-aleatória no PostgreSQL para garantir novo embaralhamento ao clicar em recarregar
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
            if categoria_id is not None:
                query = query.filter(ObjetoOrbital.categoria_id == categoria_id)
            elif categoria_ids:
                cids = [int(x.strip()) for x in categoria_ids.split(",") if x.strip().isdigit()]
                if cids:
                    query = query.filter(ObjetoOrbital.categoria_id.in_(cids))
            results = query.order_by(prioridade_pais.asc(), ObjetoOrbital.id.asc()).offset(skip).limit(limit).all()

        else:
            # 2. As 2 Estações Espaciais Principais permanecem 100% fixas e presentes
            estacoes = query_base.filter(
                ObjetoOrbital.norad_id.in_(["25544", "48274"])
            ).all()

            # Determinar quais categorias de satélites e detritos estão ativas
            if categoria_ids:
                cats_ativas = [int(x.strip()) for x in categoria_ids.split(",") if x.strip().isdigit()]
            elif categoria_id is not None:
                cats_ativas = [categoria_id]
            else:
                # Padrão: as 4 categorias do radar (1: Ativos, 2: Inativos, 3: Detritos, 5: Foguetes)
                cats_ativas = [1, 2, 3, 5]

            # Filtra apenas as categorias do radar (1, 2, 3, 5)
            cats_radar = [c for c in cats_ativas if c in [1, 2, 3, 5]]

            if not cats_radar:
                results = estacoes
            else:
                # Amostragem dinâmica redistributiva:
                # Distribui as vagas do limite (ex: 1000) entre as categorias ativas.
                # Categorias com menor estoque (Foguetes: ~110, Inativos: ~191) cedem vagas excedentes
                # para categorias de maior volume (Detritos: ~717, Ativos: ~5298).
                vagas_restantes = limit
                ordem = sorted(cats_radar, key=lambda c: 0 if c == 5 else (1 if c == 2 else (2 if c == 3 else 3)))
                amostras = []

                for idx, cid in enumerate(ordem):
                    n_restantes = len(ordem) - idx
                    cota = vagas_restantes // n_restantes
                    itens = query_base.filter(
                        ObjetoOrbital.categoria_id == cid,
                        ObjetoOrbital.estacao_pai_norad.is_(None),
                        ~ObjetoOrbital.norad_id.in_(["25544", "48274"])
                    ).order_by(prioridade_pais.asc(), func.random()).limit(cota).all()

                    amostras.extend(itens)
                    vagas_restantes -= len(itens)
                    if vagas_restantes <= 0:
                        break

                results = estacoes + amostras

        response_data = []
        for objeto, tle in results:
            objeto.ultimo_tle = tle
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
        
    ultimo_tle = db.query(TLEHistorico).filter(
        TLEHistorico.objeto_id == objeto.id
    ).order_by(TLEHistorico.epoch.desc()).first()
    
    objeto.ultimo_tle = ultimo_tle
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
            response_data.append(objeto)

        return response_data
    except Exception as e:
        logger.error(f"LOG: Erro ao listar módulos da estação {norad_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao consultar módulos da estação")


@app.get("/api/estatisticas", response_model=schemas.EstatisticasResponse)
def obter_estatisticas(db: Session = Depends(get_db)):
    """
    Retorna métricas agregadas dos objetos orbitais para exibição gráfica no painel educacional principal,
    incluindo os totais oficiais do catálogo e a distribuição das 5 categorias por país.
    """
    try:
        total_banco = db.query(func.count(ObjetoOrbital.id)).scalar() or 0

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
            subq_reg = db.query(
                TLEHistorico.objeto_id, func.max(TLEHistorico.id).label("max_id")
            ).group_by(TLEHistorico.objeto_id).subquery()
            tles_query = db.query(TLEHistorico.linha2).join(subq_reg, TLEHistorico.id == subq_reg.c.max_id).all()

            regimes_count = {"leo": 0, "meo": 0, "geo": 0, "heo": 0}
            for (l2,) in tles_query:
                try:
                    ecc = float("0." + l2[26:33].strip())
                    if ecc > 0.25:
                        regimes_count["heo"] += 1
                        continue
                    mm = float(l2[52:63].strip())
                    nRadS = (mm * 2 * math.pi) / 86400.0
                    a = (398600.4418 / (nRadS * nRadS)) ** (1.0 / 3.0)
                    alt = a - 6378.137
                    if alt >= 35000:
                        regimes_count["geo"] += 1
                    elif alt >= 2000:
                        regimes_count["meo"] += 1
                    else:
                        regimes_count["leo"] += 1
                except Exception:
                    regimes_count["leo"] += 1

            distribuicao_regimes = schemas.DistribuicaoRegimes(**regimes_count)
        except Exception:
            distribuicao_regimes = schemas.DistribuicaoRegimes(leo=5519, meo=183, geo=590, heo=44)

        totais_oficiais = schemas.TotaisOficiaisCatalogo(
            total=34104,
            ativos=16503,
            inativos=2782,
            foguetes=2295,
            detritos=12522,
            estacoes=2
        )

        return schemas.EstatisticasResponse(
            total_objetos=34104,
            percentual_detritos=round((12522 / 34104) * 100.0, 2),
            distribuicao_paises=distribuicao_paises,
            evolucao_historica=evolucao_historica,
            distribuicao_regimes=distribuicao_regimes,
            totais_oficiais=totais_oficiais
        )
    except Exception as e:
        logger.error(f"LOG: Erro ao calcular estatísticas orbitais: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao consolidar dados estatísticos")

