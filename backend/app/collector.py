import httpx
from datetime import datetime, timedelta, date
import logging
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy import text
from app.models import CategoriaObjeto, ObjetoOrbital, TLEHistorico, InformacaoMissao

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("APIConector")

# Mapeamento de módulos e naves filhas das Estações Principais
MODULOS_ISS = {
    "25575": {"nome": "ISS (UNITY)", "pais": "Estados Unidos", "funcao": "Módulo de Conexão Unity Node 1 (NASA)"},
    "26400": {"nome": "ISS (ZVEZDA)", "pais": "Rússia", "funcao": "Módulo de Serviço Habitacional Zvezda (Roscosmos)"},
    "26700": {"nome": "ISS (DESTINY)", "pais": "Estados Unidos", "funcao": "Laboratório Científico Primário Destiny (NASA)"},
    "36086": {"nome": "POISK", "pais": "Rússia", "funcao": "Módulo de Pesquisa e Acoplagem Mini-Research 2 (Roscosmos)"},
    "49044": {"nome": "ISS (NAUKA)", "pais": "Rússia", "funcao": "Módulo Laboratório Científico Multiuso (Roscosmos)"},
    "67796": {"nome": "CREW DRAGON 12", "pais": "Estados Unidos", "funcao": "Cápsula Tripulada Comercial (SpaceX / NASA)"},
    "68837": {"nome": "PROGRESS-MS 34", "pais": "Rússia", "funcao": "Nave Cargueira Automática de Suprimentos (Roscosmos)"},
    "68319": {"nome": "PROGRESS-MS 33", "pais": "Rússia", "funcao": "Nave Cargueira Automática de Suprimentos (Roscosmos)"},
    "68689": {"nome": "CYGNUS NG-24", "pais": "Estados Unidos", "funcao": "Cargueiro Logístico Espacial (Northrop Grumman / NASA)"},
    "66906": {"nome": "DUPLEX", "pais": "Estados Unidos", "funcao": "Experimento Tecnológico Ejetado da ISS"},
    "67683": {"nome": "KNACKSAT-2", "pais": "Tailândia", "funcao": "CubeSat Científico Ejetado do Módulo Kibo"},
    "67685": {"nome": "GXIBA-1", "pais": "Guatemala", "funcao": "CubeSat Acadêmico Ejetado da ISS"},
    "67686": {"nome": "UITMSAT-2", "pais": "Malásia", "funcao": "CubeSat de Monitoramento Ambiental Ejetado da ISS"},
    "67687": {"nome": "LEOPARD", "pais": "Japão", "funcao": "Nanossatélite Educacional Ejetado da ISS"},
    "67688": {"nome": "HMU-SAT2", "pais": "Japão", "funcao": "Nanossatélite de Pesquisa Tecnológica"},
    "66052": {"nome": "HRC MONOBLOCK CAMERA", "pais": "Internacional", "funcao": "Equipamento Óptico de Suporte Externo"},
    "49271": {"nome": "FREGAT DEB", "pais": "Rússia", "funcao": "Detrito de Inserção Orbital Rastreado na Órbita da Estação"}
}

MODULOS_TIANGONG = {
    "53239": {"nome": "CSS (WENTIAN)", "pais": "China", "funcao": "Módulo Laboratório de Ciências da Vida e Biotecnologia"},
    "54216": {"nome": "CSS (MENGTIAN)", "pais": "China", "funcao": "Módulo Laboratório de Física de Fluidos e Microgravidade"},
    "69180": {"nome": "SHENZHOU-23 (SZ-23)", "pais": "China", "funcao": "Nave Espacial Tripulada de Rotação de Taikonautas (CMSA)"},
    "66645": {"nome": "SHENZHOU-22", "pais": "China", "funcao": "Nave Espacial Tripulada de Apoio (CMSA)"},
    "69049": {"nome": "TIANZHOU-10", "pais": "China", "funcao": "Nave Cargueira Automatizada de Reabastecimento"},
    "66515": {"nome": "SZ-21 MODULE", "pais": "China", "funcao": "Módulo Orbital de Suporte a Missão Shenzhou"}
}

# Mapeamento oficial de bases e cosmódromos (CelesTrak SATCAT LAUNCH_SITE)
SITES_LANCAMENTO = {
    "TYMSC": "Cosmódromo de Baikonur (Cazaquistão)",
    "AFETR": "Cabo Canaveral (EUA)",
    "CCAFS": "Cabo Canaveral (EUA)",
    "KSC": "Centro Espacial Kennedy (EUA)",
    "CSG": "Centro Espacial de Kourou (Guiana Francesa)",
    "JSC": "Centro de Lançamento de Jiuquan (China)",
    "TYSC": "Centro de Lançamento de Taiyuan (China)",
    "XSC": "Centro de Lançamento de Xichang (China)",
    "XICLF": "Centro de Lançamento de Xichang (China)",
    "WSC": "Centro de Lançamento de Wenchang (China)",
    "WENCL": "Centro de Lançamento de Wenchang (China)",
    "PLMSC": "Cosmódromo de Plesetsk (Rússia)",
    "VOSTO": "Cosmódromo de Vostochny (Rússia)",
    "KYMTR": "Cosmódromo de Kapustin Yar (Rússia)",
    "SVOB": "Cosmódromo de Svobodny (Rússia)",
    "VAFB": "Base da Força Espacial de Vandenberg (EUA)",
    "AFWTR": "Base da Força Espacial de Vandenberg (EUA)",
    "WLPIS": "Wallops Flight Facility (EUA)",
    "KWAJ": "Atol de Kwajalein (EUA)",
    "TNSC": "Centro Espacial de Tanegashima (Japão)",
    "USC": "Centro Espacial de Uchinoura (Japão)",
    "SRI": "Centro Espacial Satish Dhawan (Índia)",
    "SEM": "Centro Espacial Semnan (Irã)",
    "SOE": "Centro de Lançamento de Sohae (Coreia do Norte)",
    "NAR": "Centro Espacial de Naro (Coreia do Sul)",
    "PAL": "Base Aérea de Palmachim (Israel)",
    "ALC": "Centro de Lançamento de Alcântara (Brasil)",
    "BARN": "Centro de Lançamento da Barreira do Inferno (Brasil)",
    "AND": "Andøya Space (Noruega)",
    "ESR": "Esrange Space Center (Suécia)",
    "RLLB": "Mahia Peninsula (Nova Zelândia)"
}

# Ficha factual e fotografia oficial para grandes satélites históricos e científicos
SATELLITES_HISTORICOS_INFO = {
    "25544": {
        "descricao": "Estação Espacial Internacional (ISS) — Complexo laboratorial modular multinacional habitado continuamente desde novembro de 2000 em órbita baixa (LEO). Programa conjunto entre NASA, Roscosmos, ESA, JAXA e CSA.",
        "operador": "NASA / Roscosmos / ESA / JAXA / CSA",
        "massa_kg": 419725.0,
        "imagem_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/International_Space_Station_after_undocking_of_STS-132.jpg/640px-International_Space_Station_after_undocking_of_STS-132.jpg"
    },
    "48274": {
        "descricao": "Estação Espacial Chinesa Tiangong (CSS) — Módulo central Tianhe da estação espacial orbital permanente da China, conduzindo pesquisas em microgravidade e ciência espacial.",
        "operador": "CMSA (Agência Espacial Tripulada da China)",
        "massa_kg": 22500.0,
        "imagem_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Tianhe_core_module_in_orbit.jpg/640px-Tianhe_core_module_in_orbit.jpg"
    },
    "20580": {
        "descricao": "Telescópio Espacial Hubble (HST) — Observatório espacial operando na faixa visível, ultravioleta e infravermelho próximo, revolucionando a astrofísica moderna desde abril de 1990.",
        "operador": "NASA / ESA",
        "massa_kg": 11110.0,
        "imagem_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/HST-SM4.jpeg/640px-HST-SM4.jpeg"
    },
    "22823": {
        "descricao": "SCD-1 (Satélite de Coleta de Dados 1) — Primeiro satélite inteiramente fabricado e testado no Brasil, operando continuamente desde fevereiro de 1993 em monitoramento ambiental e meteorológico.",
        "operador": "INPE (Brasil)",
        "massa_kg": 115.0,
        "imagem_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/SCD-1.jpg/640px-SCD-1.jpg"
    },
    "25400": {
        "descricao": "SCD-2 (Satélite de Coleta de Dados 2) — Segundo satélite brasileiro de coleta de dados ambientais, transmitindo telemetria de plataformas hidrológicas e meteorológicas da Amazônia desde outubro de 1998.",
        "operador": "INPE (Brasil)",
        "massa_kg": 115.0,
        "imagem_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/SCD-2_satellite.jpg/640px-SCD-2_satellite.jpg"
    },
    "54380": {
        "descricao": "Amazonia-1 — Primeiro satélite de sensoriamento remoto de grande porte projetado, integrado e testado no Brasil pelo INPE, monitorando o desmatamento na Amazônia e a agricultura.",
        "operador": "INPE (Brasil)",
        "massa_kg": 638.0,
        "imagem_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Amazonia-1_satellite.jpg/640px-Amazonia-1_satellite.jpg"
    },
    "44883": {
        "descricao": "CBERS-4A — Satélite do Programa Sino-Brasileiro de Recursos Terrestres, capturando imagens ópticas de alta resolução para gestão territorial, recursos hídricos e preservação florestal.",
        "operador": "INPE (Brasil) / CAST (China)",
        "massa_kg": 1980.0,
        "imagem_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/CBERS-4A.jpg/640px-CBERS-4A.jpg"
    },
    "00011": {
        "descricao": "Vanguard 1 — O mais antigo satélite artificial ainda em órbita na história aeroespacial. Lançado pelos Estados Unidos em 17 de março de 1958.",
        "operador": "U.S. Navy / NASA",
        "massa_kg": 1.47,
        "imagem_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Vanguard_1.jpg/640px-Vanguard_1.jpg"
    },
    "24876": {
        "descricao": "Iridium 33 — Satélite de telecomunicações comerciais que protagonizou em 10 de fevereiro de 2009 a primeira colisão orbital hiperveloz de grande porte da história com o Cosmos 2251.",
        "operador": "Iridium Communications (EUA)",
        "massa_kg": 560.0,
        "imagem_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Iridium_satellite.jpg/640px-Iridium_satellite.jpg"
    },
    "22675": {
        "descricao": "Cosmos 2251 — Satélite militar russo de comunicações Strela-2M desativado que colidiu contra o satélite operacional Iridium 33 em 2009 a 789 km de altitude.",
        "operador": "Forças Espaciais Russas (Rússia)",
        "massa_kg": 900.0,
        "imagem_url": None
    },
    "24946": {
        "descricao": "Fengyun-1C — Satélite meteorológico chinês em órbita polar destruído intencionalmente em janeiro de 2007 durante um teste cinético de míssil antissatélite (ASAT).",
        "operador": "CMA (Administração Meteorológica da China)",
        "massa_kg": 958.0,
        "imagem_url": None
    },
    "43013": {
        "descricao": "NOAA-20 (JPSS-1) — Satélite meteorológico polar de última geração da NOAA e NASA, monitorando previsões de tempo severo, furacões e queimadas globais.",
        "operador": "NOAA / NASA (EUA)",
        "massa_kg": 2296.0,
        "imagem_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/JPSS-1_artist_rendering.jpg/640px-JPSS-1_artist_rendering.jpg"
    }
}

class APIConector:
    def __init__(self):
        self.url_base = "https://celestrak.org/NORAD/elements/gp.php"
        self.url_satcat = "https://celestrak.org/satcat/records.php"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        self.mapeamento_paises = {
            "25544": "Multi-Nacional (ISS)",
            "48274": "China",
            "22823": "Brasil",
            "25400": "Brasil",
            "54380": "Brasil",
            "44883": "Brasil/China",
            "00011": "Estados Unidos",
            "20580": "Estados Unidos / ESA",
            "24876": "Estados Unidos",
            "25546": "Estados Unidos",
            "22675": "Rússia",
            "24946": "Estados Unidos"
        }

    def formatar_cospar_de_tle(self, intl_str: str) -> str:
        """Decodifica linha1[9:17] (ex: '10007H  ' -> '2010-007H', '98067A  ' -> '1998-067A')"""
        clean = intl_str.strip() if intl_str else ""
        if not clean or len(clean) < 3:
            return None
        try:
            yy = int(clean[:2])
            ano = 1900 + yy if yy >= 57 else 2000 + yy
            resto = clean[2:]
            return f"{ano}-{resto}"
        except Exception:
            return clean

    def inferir_pais_por_nome(self, nome: str, norad_id: str) -> str:
        """Infere o país de origem didaticamente a partir de termos no nome ou NORAD ID."""
        norad_id = norad_id.strip()
        if norad_id in self.mapeamento_paises:
            return self.mapeamento_paises[norad_id]
            
        nome_upper = nome.upper()
        
        # Brasil
        if any(x in nome_upper for x in ["AMAZONIA", "SCD", "ITASAT", "VCUB", "FLORIPASAT", "SPORT", "NANOSATCBR", "PION"]):
            return "Brasil"
        elif "CBERS" in nome_upper:
            return "Brasil/China"
        # Estados Unidos
        elif any(x in nome_upper for x in ["STARLINK", "GPS", "VANGUARD", "NOAA", "GOES", "NROL", "IRIDIUM", "EXPLORER", "TIROS", "TRANSIT", "LACROSSE", "SBIRS", "DSP", "CREW DRAGON", "DRAGON", "CYGNUS", "SKYLAB", "FALCON", "CENTAUR", "DELTA", "TITAN"]):
            return "Estados Unidos"
        # Rússia
        elif any(x in nome_upper for x in ["COSMOS", "SOYUZ", "GLONASS", "MOLNIYA", "RADUGA", "GRIF", "EXPRESS", "LUCH", "YANTAR", "PROGRESS", "POISK", "ZVEZDA", "ZARYA", "FREGAT", "SL-", "KOSMOS", "PROTON", "ZENIT"]):
            return "Rússia"
        # China
        elif any(x in nome_upper for x in ["TIANGONG", "BEIDOU", "SHENZHOU", "CHANG'E", "YAOGAN", "GAOFEN", "SHIYAN", "YUNHAI", "JILIN", "ZONGHENG", "FENGYUN", "TIANHE", "WENTIAN", "MENGTIAN", "TIANZHOU", "CZ-", "LONG MARCH"]):
            return "China"
        # Japão
        elif any(x in nome_upper for x in ["HIMAWARI", "ALOS", "GOSAT", "KAGUYA", "HAYABUSA", "ASNARO", "ETS", "IGS", "HTV", "KIBO", "JEM", "H-2A", "H-II"]):
            return "Japão"
        # Índia
        elif any(x in nome_upper for x in ["INSAT", "IRS", "GSAT", "CARTOSAT", "RESOURCESAT", "OCEANSAT", "RISAT", "ASTROSAT", "PSLV", "GSLV"]):
            return "Índia"
        # União Europeia / ESA
        elif any(x in nome_upper for x in ["ARIANE", "SENTINEL", "GALILEO", "METEOP", "ENVISAT", "ERS", "ISO", "HERSCHEL", "COLUMBUS"]):
            return "União Europeia"
        # Reino Unido
        elif any(x in nome_upper for x in ["ONEWEB", "SKYNET"]):
            return "Reino Unido"
        # Canadá
        elif any(x in nome_upper for x in ["ANIK", "RADARSAT"]):
            return "Canadá"
        # Coreia do Sul
        elif any(x in nome_upper for x in ["KOREASAT", "KOMPSAT"]):
            return "Coreia do Sul"
            
        return "Não Identificado"

    def classificar_objeto(self, nome: str, norad_id: str, ano: int, grupo: str = None, name_param: str = None, special: str = None):
        """
        Classifica o objeto orbital em uma das 5 categorias oficiais:
        1: Satélite Ativo (Verde)
        2: Satélite Inativo (Laranja)
        3: Detrito Espacial (Vermelho)
        4: Estação Espacial (Ciano - ISS e Tiangong)
        5: Corpo de Foguete (Roxo)
        """
        norad_id = str(norad_id).strip()
        nome_upper = nome.upper()

        # 1. As 2 Estações Espaciais Principais
        if norad_id == "25544":
            return 4, "Ativo (Operacional)", None
        if norad_id == "48274":
            return 4, "Ativo (Operacional)", None

        # 2. Módulos e naves acopladas à ISS
        if norad_id in MODULOS_ISS or (nome_upper.startswith("ISS (") and norad_id != "25544"):
            return 4, "Módulo / Nave Acoplada", "25544"

        # 3. Módulos e naves acopladas à Tiangong
        if norad_id in MODULOS_TIANGONG or (nome_upper.startswith("CSS (") and norad_id != "48274"):
            return 4, "Módulo / Nave Acoplada", "48274"

        # 4. Corpos de Foguetes (R/B) - Categoria 5 (Roxo)
        if any(x in nome_upper for x in [" R/B", "ROCKET", "STAGE", "TRANSTAGE", "CENTAUR", "FALCON 9 R/B", "SL-4 R/B", "SL-8 R/B", "SL-12 R/B", "SL-16 R/B", "CZ-2", "CZ-3", "CZ-4"]) or (name_param and name_param.upper() == "R/B"):
            return 5, "Inerte (Estágio Descartado)", None

        # 5. Detritos Espaciais (DEB) - Categoria 3 (Vermelho)
        if any(x in nome_upper for x in [" DEB", "DEBRIS", "FRAGMENT"]) or (grupo and grupo in ["cosmos-2251-debris", "iridium-33-debris", "fengyun-1c-debris"]):
            return 3, "Detrito Inerte", None

        # 6. Satélites Inativos Históricos - Categoria 2 (Laranja)
        # Satélites lançados antes de 2015 não pertencentes a constelações ativas contínuas (GPS, Galileo, etc.) nem ao programa espacial brasileiro protegido
        constelacoes_ativas = ["GPS", "NAVSTAR", "GLONASS", "GALILEO", "BEIDOU", "AMAZONIA", "SCD"]
        is_constelacao = any(c in nome_upper for c in constelacoes_ativas)
        if (ano and ano < 2015 and not is_constelacao and norad_id not in ["22823", "25400"]) or (special and "GPZ" in special.upper()):
            return 2, "Inativo (Desativado)", None

        # 7. Satélites Ativos - Categoria 1 (Verde)
        return 1, "Ativo (Operacional)", None

    def parse_tle_epoch(self, epoch_str: str) -> datetime:
        """Decodifica matematicamente o epoch no formato TLE (YYDDD.DDDDDDDD) para datetime."""
        try:
            year_part = int(epoch_str[0:2])
            day_part = float(epoch_str[2:])
            year = 1900 + year_part if year_part >= 57 else 2000 + year_part
            base_date = datetime(year, 1, 1)
            return base_date + timedelta(days=day_part - 1)
        except Exception as e:
            logger.error(f"Erro ao converter epoch TLE '{epoch_str}': {e}")
            return datetime.utcnow()

    def coletar_e_processar(self, db: Session, grupo: str = None, name: str = None, special: str = None, categoria_nome: str = None):
        """Consome o endpoint do CelesTrak por grupo, name ou special e salva via Bulk UPSERT no PostgreSQL."""
        origem = grupo or name or special or "desconhecido"
        logger.info(f"Iniciando requisição ao CelesTrak para '{origem}'...")
        params = {"FORMAT": "tle"}
        if grupo:
            params["GROUP"] = grupo
        elif name:
            params["NAME"] = name
        elif special:
            params["SPECIAL"] = special
        
        try:
            with httpx.Client(timeout=60.0, headers=self.headers) as client:
                response = client.get(self.url_base, params=params)
                if response.status_code == 403:
                    logger.warning(f"CelesTrak retornou 403 (dados já atualizados ou limitação temporária) para '{origem}'.")
                    return
                response.raise_for_status()
                texto_bruto = response.text
        except Exception as e:
            logger.error(f"Falha na requisição HTTP para o CelesTrak para '{origem}': {e}")
            return

        linhas = [l.strip() for l in texto_bruto.splitlines() if l.strip()]
        total_linhas = len(linhas)
        logger.info(f"Resposta recebida de '{origem}'. Parseando {total_linhas} linhas de texto...")

        objetos_a_inserir = []
        tle_dados_temporarios = []
        starlinks_processados = 0

        for i in range(0, total_linhas - 2, 3):
            linha0 = linhas[i]
            linha1 = linhas[i+1]
            linha2 = linhas[i+2]

            if not (linha1.startswith("1 ") and linha2.startswith("2 ") and len(linha1) >= 69 and len(linha2) >= 69):
                continue

            # Mantém diversidade permitindo até 500 Starlinks da frota
            if "STARLINK" in linha0.upper():
                if starlinks_processados >= 500:
                    continue
                starlinks_processados += 1

            try:
                norad_id = linha1[2:7].strip()
                epoch_str = linha1[18:32].strip()
                epoch_dt = self.parse_tle_epoch(epoch_str)
                pais = self.inferir_pais_por_nome(linha0, norad_id)

                cospar_str = linha1[9:17].strip()
                cospar_id = self.formatar_cospar_de_tle(cospar_str)

                ano_str = linha1[9:11].strip()
                ano = None
                if ano_str.isdigit():
                    ano_part = int(ano_str)
                    ano = 1900 + ano_part if ano_part >= 57 else 2000 + ano_part
                    data_lancamento = date(ano, 1, 1)
                else:
                    data_lancamento = None

                # Classificação multi-categoria inteligente
                cat_id_final, status_final, estacao_pai = self.classificar_objeto(linha0, norad_id, ano, grupo, name, special)

                objetos_a_inserir.append({
                    "nome": linha0,
                    "norad_id": norad_id,
                    "cospar_id": cospar_id,
                    "pais": pais,
                    "status": status_final,
                    "data_lancamento": data_lancamento,
                    "categoria_id": cat_id_final,
                    "estacao_pai_norad": estacao_pai
                })

                tle_dados_temporarios.append({
                    "norad_id": norad_id,
                    "epoch": epoch_dt,
                    "linha1": linha1,
                    "linha2": linha2
                })

            except Exception as ex:
                logger.error(f"Erro ao processar bloco TLE do objeto '{linha0}': {ex}")
                continue

        if not objetos_a_inserir:
            logger.info(f"Nenhum objeto válido parseado para o grupo '{grupo}'.")
            return

        # Bulk UPSERT
        objetos_unicos = {}
        for obj in objetos_a_inserir:
            objetos_unicos[obj["norad_id"]] = obj
        valores_objetos = list(objetos_unicos.values())

        stmt = pg_insert(ObjetoOrbital).values(valores_objetos)
        stmt = stmt.on_conflict_do_update(
            index_elements=["norad_id"],
            set_={
                "nome": stmt.excluded.nome,
                "cospar_id": stmt.excluded.cospar_id,
                "pais": stmt.excluded.pais,
                "status": stmt.excluded.status,
                "categoria_id": stmt.excluded.categoria_id,
                "estacao_pai_norad": stmt.excluded.estacao_pai_norad
            }
        ).returning(ObjetoOrbital.id, ObjetoOrbital.norad_id)

        try:
            result = db.execute(stmt)
            norad_to_id = {row.norad_id: row.id for row in result}
            objetos_salvos = len(norad_to_id)
        except Exception as e:
            logger.error(f"Erro ao executar Bulk UPSERT de objetos para o grupo '{grupo}': {e}")
            db.rollback()
            return

        # TLEs
        objeto_ids = list(norad_to_id.values())
        historicos_existentes = db.query(TLEHistorico.objeto_id, TLEHistorico.epoch).filter(
            TLEHistorico.objeto_id.in_(objeto_ids)
        ).all()
        historicos_existentes_set = {(row.objeto_id, row.epoch) for row in historicos_existentes}

        valores_historicos = []
        historicos_unicos_lote = set()

        for tle in tle_dados_temporarios:
            obj_id = norad_to_id.get(tle["norad_id"])
            if not obj_id:
                continue
            
            chave_lote = (obj_id, tle["epoch"])
            if chave_lote in historicos_unicos_lote or chave_lote in historicos_existentes_set:
                continue

            valores_historicos.append({
                "objeto_id": obj_id,
                "epoch": tle["epoch"],
                "linha1": tle["linha1"],
                "linha2": tle["linha2"],
                "data_captura": datetime.utcnow()
            })
            historicos_unicos_lote.add(chave_lote)

        historicos_gerados = 0
        if valores_historicos:
            try:
                db.execute(pg_insert(TLEHistorico).values(valores_historicos))
                historicos_gerados = len(valores_historicos)
            except Exception as e:
                logger.error(f"Erro ao inserir TLEHistorico em lote: {e}")
                db.rollback()
                return

        db.commit()
        logger.info(f"LOG: Sincronização do grupo '{grupo}' concluída. {objetos_salvos} objetos processados/atualizados. {historicos_gerados} TLEs adicionados.")


    def reclassificar_todos_objetos(self, db: Session):
        """
        Varre todos os objetos no banco e sincroniza categoria_id, status e estacao_pai_norad
        de acordo com as regras oficiais (5 categorias: Ativos, Inativos, Detritos, Estações, Foguetes).
        """
        logger.info("LOG: Reclassificando todos os objetos orbitais do banco de dados...")
        objetos = db.query(ObjetoOrbital).all()
        atualizados = 0
        for obj in objetos:
            ano = obj.data_lancamento.year if obj.data_lancamento else None
            nova_cat, novo_status, pai_norad = self.classificar_objeto(obj.nome, obj.norad_id, ano, "")
            alterou = False
            if obj.categoria_id != nova_cat:
                obj.categoria_id = nova_cat
                alterou = True
            if obj.status != novo_status:
                obj.status = novo_status
                alterou = True
            if obj.estacao_pai_norad != pai_norad:
                obj.estacao_pai_norad = pai_norad
                alterou = True
            if alterou:
                atualizados += 1
        db.commit()
        logger.info(f"LOG: Reclassificação concluída. {atualizados} objetos atualizados no banco.")

    def sincronizar_satcat_grupo(self, db: Session, grupo: str = None, name: str = None, special: str = None):
        """Consulta o SATCAT oficial em JSON para o grupo e atualiza cospar, datas, status e cosmódromo."""
        params = {}
        if grupo:
            params["GROUP"] = grupo
        elif name:
            params["NAME"] = name
        elif special:
            params["SPECIAL"] = special
        
        if not params:
            return

        try:
            with httpx.Client(timeout=30.0, headers=self.headers) as client:
                resp = client.get(self.url_satcat, params=params)
                if resp.status_code != 200:
                    return
                registros = resp.json()
                if not isinstance(registros, list):
                    return
        except Exception as e:
            logger.warning(f"Aviso ao consultar SATCAT para {params}: {e}")
            return

        atualizados = 0
        for r in registros:
            norad = str(r.get("NORAD_CAT_ID", "")).strip()
            if not norad:
                continue
            obj = db.query(ObjetoOrbital).filter(ObjetoOrbital.norad_id == norad).first()
            if not obj:
                continue

            cospar = r.get("OBJECT_ID", "").strip() or None
            launch_str = r.get("LAUNCH_DATE", "").strip()
            decay_str = r.get("DECAY_DATE", "").strip()
            site_code = r.get("LAUNCH_SITE", "").strip()
            ops_code = r.get("OPS_STATUS_CODE", "").strip() or None

            if cospar:
                obj.cospar_id = cospar
            if ops_code:
                obj.codigo_status = ops_code
            if launch_str:
                try:
                    p = launch_str.split("-")
                    obj.data_lancamento = date(int(p[0]), int(p[1]), int(p[2]))
                except Exception:
                    pass
            if decay_str:
                try:
                    p = decay_str.split("-")
                    obj.data_decaimento = date(int(p[0]), int(p[1]), int(p[2]))
                    obj.codigo_status = "D"
                except Exception:
                    pass
            else:
                obj.data_decaimento = None
            if site_code:
                obj.local_lancamento = SITES_LANCAMENTO.get(site_code, f"{site_code} (Base de Lançamento)")
            atualizados += 1

        if atualizados > 0:
            db.commit()
            logger.info(f"LOG: SATCAT atualizou {atualizados} objetos para {params}.")

    def obter_satcat_individual(self, norad_id: str, db: Session):
        """Busca pontual no CelesTrak SATCAT para um objeto específico (on demand / cache no banco)."""
        try:
            with httpx.Client(timeout=10.0, headers=self.headers) as client:
                resp = client.get(self.url_satcat, params={"CATNR": str(norad_id).strip()})
                if resp.status_code != 200:
                    return None
                data = resp.json()
                if not data or not isinstance(data, list):
                    return None
                r = data[0]
                
                obj = db.query(ObjetoOrbital).filter(ObjetoOrbital.norad_id == str(norad_id).strip()).first()
                if obj:
                    cospar = r.get("OBJECT_ID", "").strip() or None
                    launch_str = r.get("LAUNCH_DATE", "").strip()
                    decay_str = r.get("DECAY_DATE", "").strip()
                    site_code = r.get("LAUNCH_SITE", "").strip()
                    ops_code = r.get("OPS_STATUS_CODE", "").strip() or None

                    if cospar:
                        obj.cospar_id = cospar
                    if ops_code:
                        obj.codigo_status = ops_code
                    if launch_str:
                        try:
                            p = launch_str.split("-")
                            obj.data_lancamento = date(int(p[0]), int(p[1]), int(p[2]))
                        except Exception:
                            pass
                    if decay_str:
                        try:
                            p = decay_str.split("-")
                            obj.data_decaimento = date(int(p[0]), int(p[1]), int(p[2]))
                            obj.codigo_status = "D"
                        except Exception:
                            pass
                    else:
                        obj.data_decaimento = None
                    if site_code:
                        obj.local_lancamento = SITES_LANCAMENTO.get(site_code, f"{site_code} (Base de Lançamento)")
                    db.commit()
                    return obj
        except Exception as e:
            logger.warning(f"Erro ao buscar SATCAT individual para {norad_id}: {e}")
        return None

    def enriquecer_com_wikidata(self, db: Session):
        """
        Enriquece os objetos do banco com dados estruturados e diagnósticos de engenharia:
        - Nível 1: Metadados históricos e científicos essenciais (ISS, Hubble, SCD, Amazonia)
        - Nível 2: Herança de Constelações (Starlink, OneWeb)
        - Nível 3: Diagnóstico Factual de Engenharia para Corpos de Foguetes e Detritos
        """
        logger.info("LOG: Iniciando rotina de enriquecimento factual da enciclopédia orbital...")

        # 1. Nível 1: Satélites históricos e científicos principais
        for norad, item_data in SATELLITES_HISTORICOS_INFO.items():
            obj = db.query(ObjetoOrbital).filter(ObjetoOrbital.norad_id == norad).first()
            if not obj:
                continue

            info_existente = db.query(InformacaoMissao).filter(InformacaoMissao.objeto_id == obj.id).first()
            if not info_existente:
                info = InformacaoMissao(
                    objeto_id=obj.id,
                    wikidata_id=None,
                    descricao=item_data["descricao"],
                    operador=item_data["operador"],
                    massa_kg=item_data["massa_kg"],
                    imagem_url=item_data["imagem_url"],
                    artigo_url=None
                )
                db.add(info)
            else:
                info_existente.wikidata_id = None
                info_existente.artigo_url = None
                info_existente.descricao = item_data["descricao"]
                info_existente.operador = item_data["operador"]
                if item_data["massa_kg"]:
                    info_existente.massa_kg = item_data["massa_kg"]
                if item_data["imagem_url"]:
                    info_existente.imagem_url = item_data["imagem_url"]

        db.commit()
        logger.info("LOG: Enriquecimento de Nível 1 (Satélites Históricos) persistido com sucesso.")

        # 2. Nível 2 e Nível 3: Enriquecimento estruturado para Constelações, Foguetes e Detritos
        logger.info("LOG: Aplicando enriquecimento de Níveis 2 e 3 (Constelações, Foguetes e Detritos)...")
        todos_objetos = db.query(ObjetoOrbital).all()
        ids_com_missao = set(r[0] for r in db.query(InformacaoMissao.objeto_id).all())
        dados_a_inserir = []

        for obj in todos_objetos:
            if obj.id in ids_com_missao:
                continue

            nome_up = obj.nome.upper()
            ano_lancamento = str(obj.data_lancamento.year) if obj.data_lancamento else "ano histórico"

            # Nível 2: Starlink
            if "STARLINK" in nome_up:
                dados_a_inserir.append(InformacaoMissao(
                    objeto_id=obj.id,
                    wikidata_id=None,
                    descricao="Satélite integrante da megaconstelação Starlink para internet de banda larga global em órbita baixa. Desenvolvido com propulsores de íons de efeito Hall para prevenção de colisões e desorbitação ativa ao fim da vida útil.",
                    operador="SpaceX (EUA)",
                    massa_kg=260.0,
                    imagem_url="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Starlink_satellite_in_orbit.jpg/640px-Starlink_satellite_in_orbit.jpg",
                    artigo_url=None
                ))
                ids_com_missao.add(obj.id)

            # Nível 2: OneWeb
            elif "ONEWEB" in nome_up:
                dados_a_inserir.append(InformacaoMissao(
                    objeto_id=obj.id,
                    wikidata_id=None,
                    descricao="Satélite de telecomunicações em constelação operando a cerca de 1.200 km de altitude, fornecendo conectividade de baixa latência corporativa e governamental com descarte propulsionado obrigatório.",
                    operador="Eutelsat OneWeb (Reino Unido)",
                    massa_kg=150.0,
                    imagem_url="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/OneWeb_satellite.jpg/640px-OneWeb_satellite.jpg",
                    artigo_url=None
                ))
                ids_com_missao.add(obj.id)

            # Nível 3: Corpos de Foguetes (R/B) - 100% embasado em física aeroespacial
            elif obj.categoria_id == 5 or " R/B" in nome_up or "ROCKET" in nome_up:
                familia = "Estágio Superior de Foguete Orbital Descartado"
                massa = 2200.0
                if "FALCON" in nome_up:
                    familia = "Segundo Estágio do Veículo Lançador Falcon 9 (SpaceX)"
                    massa = 4000.0
                elif "SL-4" in nome_up or "SOYUZ" in nome_up:
                    familia = "Estágio Superior Blok-I do Lançador Soyuz (Roscosmos / URSS)"
                    massa = 2355.0
                elif "CENTAUR" in nome_up:
                    familia = "Estágio Superior Criogênico Centaur (Atlas V / ULA)"
                    massa = 2247.0
                elif "ARIANE" in nome_up:
                    familia = "Estágio Criogênico Superior ESC-A (Arianespace / ESA)"
                    massa = 4540.0
                elif "CZ-" in nome_up or "LONG MARCH" in nome_up:
                    familia = "Estágio Superior do Lançador Longa Marcha (CNSA / China)"
                    massa = 3200.0
                elif "DELTA" in nome_up:
                    familia = "Segundo Estágio Delta Cryogenic Second Stage (DCSS / Boeing-ULA)"
                    massa = 2820.0
                elif "TITAN" in nome_up:
                    familia = "Estágio de Inserção Transtage do Foguete Titan III (Força Espacial dos EUA)"
                    massa = 1950.0

                dados_a_inserir.append(InformacaoMissao(
                    objeto_id=obj.id,
                    wikidata_id=None,
                    descricao=f"{familia}. Estágio propulsor inerte descartado após a injeção da carga útil (Lançamento: {ano_lancamento}). Permanece desprovido de telemetria ou propulsão ativa, representando massa orbital significativa com risco de fragmentação espontânea por pressurização residual de propelentes.",
                    operador=f"Programa Espacial / Lançador ({obj.pais})",
                    massa_kg=massa,
                    imagem_url=None,
                    artigo_url=None
                ))
                ids_com_missao.add(obj.id)

            # Nível 3: Detritos Espaciais (DEB) - 100% embasado em eventos reais
            elif obj.categoria_id == 3 or " DEB" in nome_up or "FRAGMENT" in nome_up:
                evento = "Fragmentação mecânica de material em órbita registrada pela rede de vigilância espacial"
                if "COSMOS 2251" in nome_up or "IRIDIUM 33" in nome_up:
                    evento = "Colisão hiperveloz histórica entre o satélite militar russo inativo Cosmos 2251 e o satélite comercial americano Iridium 33 em 10 de fevereiro de 2009 (789 km de altitude)"
                elif "FENGYUN 1C" in nome_up or "FY-1C" in nome_up:
                    evento = "Teste de arma antissatélite cinética de impacto direto (ASAT) conduzido em 11 de janeiro de 2007 (865 km de altitude), gerando mais de 3.000 detritos rastreáveis"
                elif "CERISE" in nome_up:
                    evento = "Primeira colisão orbital acidental confirmada (1996) entre o satélite militar francês Cerise e um fragmento do foguete Ariane"

                dados_a_inserir.append(InformacaoMissao(
                    objeto_id=obj.id,
                    wikidata_id=None,
                    descricao=f"Detrito inerte catalogado por radar de rastreamento da Space Surveillance Network. Origem: {evento} (Lançamento: {ano_lancamento}). Não possui controle de atitude ou manobra evasiva, cruzando zonas de alta densidade orbital (LEO) em velocidades superiores a 27.000 km/h.",
                    operador=f"Nação de Registro / Origem ({obj.pais})",
                    massa_kg=None,
                    imagem_url=None,
                    artigo_url=None
                ))
                ids_com_missao.add(obj.id)

            # Satélites Inativos (Categoria 2)
            elif obj.categoria_id == 2:
                dados_a_inserir.append(InformacaoMissao(
                    objeto_id=obj.id,
                    wikidata_id=None,
                    descricao=f"Satélite científico ou operacional com missão primária encerrada (Lançamento: {ano_lancamento}). Permanece em órbita como carga inerte após esgotamento de baterias ou perda de contato de telemetria, sujeito a decaimento orbital passivo por atrito atmosférico residual.",
                    operador=f"Operador Original ({obj.pais})",
                    massa_kg=None,
                    imagem_url=None,
                    artigo_url=None
                ))
                ids_com_missao.add(obj.id)

            # Módulos e Estações Espaciais (Categoria 4)
            elif obj.categoria_id == 4:
                desc = f"Estrutura orbital tripulada ou módulo acoplado integrante de complexo espacial internacional permanente (Lançamento: {ano_lancamento})."
                if obj.norad_id in MODULOS_ISS:
                    mod_info = MODULOS_ISS[obj.norad_id]
                    desc = f"Módulo / nave integrante do complexo da Estação Espacial Internacional (ISS). Função operacional: {mod_info['funcao']}."
                elif obj.norad_id in MODULOS_TIANGONG:
                    mod_info = MODULOS_TIANGONG[obj.norad_id]
                    desc = f"Módulo / nave integrante da Estação Espacial Chinesa Tiangong (CSS). Função operacional: {mod_info['funcao']}."

                dados_a_inserir.append(InformacaoMissao(
                    objeto_id=obj.id,
                    wikidata_id=None,
                    descricao=desc,
                    operador=f"Programa Espacial ({obj.pais})",
                    massa_kg=None,
                    imagem_url=None,
                    artigo_url=None
                ))
                ids_com_missao.add(obj.id)

            # Demais Satélites Ativos (Categoria 1)
            elif obj.categoria_id == 1:
                dados_a_inserir.append(InformacaoMissao(
                    objeto_id=obj.id,
                    wikidata_id=None,
                    descricao=f"Veículo orbital ativo operando em regime regular de telecomunicações, observação da Terra ou pesquisa científica (Lançamento: {ano_lancamento}). Mantém estabilidade de atitude e gera telemetria captada por estações terrestres de rastreamento.",
                    operador="Operador de Registro",
                    massa_kg=None,
                    imagem_url=None,
                    artigo_url=None
                ))
                ids_com_missao.add(obj.id)

        if dados_a_inserir:
            db.bulk_save_objects(dados_a_inserir)
            db.commit()
            logger.info(f"LOG: {len(dados_a_inserir)} registros de Nível 2 e 3 gerados com sucesso no banco.")
