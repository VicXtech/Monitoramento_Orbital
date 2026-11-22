import csv
import io
import logging
import math
import re
from datetime import date, datetime, timedelta, timezone
import httpx
from sqlalchemy import func, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session
from app.models import CategoriaObjeto, InformacaoMissao, ObjetoOrbital, TLEHistorico

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("APIConector")


def normalizar_norad_id(norad_id: str) -> str:
    """Remove espaços e zeros à esquerda de identificadores NORAD numéricos."""
    s = str(norad_id or "").strip()
    if s.isdigit():
        return str(int(s))
    return s


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
    "AFETR": "Cabo Canaveral CCSFS, Flórida - EUA",
    "CCAFS": "Cabo Canaveral CCSFS, Flórida - EUA",
    "KSCUT": "Centro Espacial Kennedy KSC, Flórida - EUA",
    "KSC": "Centro Espacial Kennedy KSC, Flórida - EUA",
    "AFWTR": "Base Espacial de Vandenberg, Califórnia - EUA",
    "VAFB": "Base Espacial de Vandenberg, Califórnia - EUA",
    "WLPIS": "Instalação de Wallops Island, Virgínia - EUA",
    "KODAK": "Complexo Espacial de Kodiak, Alasca - EUA",
    "STBOS": "Starbase Boca Chica, Texas - EUA",
    "KWJLN": "Atol de Kwajalein Omelek - EUA / Ilhas Marshall",
    "KWAJ": "Atol de Kwajalein Omelek - EUA / Ilhas Marshall",
    "FRGUI": "Centro Espacial da Guiana Kourou - Guiana Francesa",
    "CSG": "Centro Espacial da Guiana Kourou - Guiana Francesa",
    "ALCNT": "Centro de Lançamento de Alcântara CLA - Brasil",
    "ALC": "Centro de Lançamento de Alcântara CLA - Brasil",
    "BARN": "Centro de Lançamento da Barreira do Inferno - Brasil",
    "TYMSC": "Cosmódromo de Baikonur - Cazaquistão / Rússia",
    "PLMSC": "Cosmódromo de Plesetsk - Rússia",
    "VOSTO": "Cosmódromo de Vostochny - Rússia",
    "KYMSC": "Cosmódromo de Kapustin Yar - Rússia",
    "KYMTR": "Cosmódromo de Kapustin Yar - Rússia",
    "SVOBO": "Cosmódromo de Svobodny - Rússia",
    "SVOB": "Cosmódromo de Svobodny - Rússia",
    "DOMBA": "Base Aérea de Dombarovsky Yasny - Rússia",
    "JSC": "Centro de Lançamento de Jiuquan - China",
    "XSC": "Centro de Lançamento de Xichang - China",
    "XICLF": "Centro de Lançamento de Xichang - China",
    "TSC": "Centro de Lançamento de Taiyuan - China",
    "TYSC": "Centro de Lançamento de Taiyuan - China",
    "WSC": "Centro de Lançamento de Wenchang Hainan - China",
    "WENCL": "Centro de Lançamento de Wenchang Hainan - China",
    "YSLA": "Plataforma Marítima no Mar Amarelo - China",
    "SRI": "Centro Espacial Satish Dhawan Sriharikota - Índia",
    "TNSTA": "Centro Espacial de Tanegashima - Japão",
    "TNSC": "Centro Espacial de Tanegashima - Japão",
    "UCHRA": "Centro Espacial de Uchinoura Kagoshima - Japão",
    "USC": "Centro Espacial de Uchinoura Kagoshima - Japão",
    "RLLC": "Complexo de Lançamento de Mahia - Nova Zelândia",
    "RLLB": "Complexo de Lançamento de Mahia - Nova Zelândia",
    "NARO": "Centro Espacial Naro - Coreia do Sul",
    "NAR": "Centro Espacial Naro - Coreia do Sul",
    "SOHAE": "Estação de Lançamento de Sohae - Coreia do Norte",
    "SOE": "Estação de Lançamento de Sohae - Coreia do Norte",
    "PALB": "Base Aérea de Palmachim - Israel",
    "PAL": "Base Aérea de Palmachim - Israel",
    "SEM": "Centro Espacial Imam Khomeini Semnan - Irã",
    "SHAHR": "Centro Espacial de Shahrud - Irã",
    "SMTS": "Plataforma Luigi Broglio Malindi - Quênia / Itália",
    "HGSTR": "Base de Hammaguir - Argélia / França",
    "WOMRA": "Complexo de Testes de Woomera - Austrália",
    "ANDSP": "Porto Espacial de Andøya - Noruega",
    "AND": "Porto Espacial de Andøya - Noruega",
    "ESR": "Esrange Space Center - Suécia",
    "SEAL": "Plataforma Marítima Sea Launch - Internacional",
    "ORBT": "Lançamento Aéreo Pegasus ou LauncherOne - Estratosfera",
    "ISS": "Ejetado da Estação Espacial Internacional ISS - LEO",
}

# Mapeamento oficial dos códigos OWNER do CelesTrak SATCAT para países em português
MAPA_OWNER_SATCAT = {
    "US": "Estados Unidos",
    "GLOB": "Estados Unidos",
    "ORB": "Estados Unidos",
    "ITSO": "Estados Unidos",
    "ABS": "Estados Unidos",
    "CIS": "Rússia",
    "PRC": "China",
    "BRAZ": "Brasil",
    "CB": "Brasil/China",
    "FR": "França",
    "UK": "Reino Unido",
    "IM": "Reino Unido",
    "ESA": "União Europeia",
    "EUTE": "União Europeia",
    "EUM": "União Europeia",
    "SES": "União Europeia",
    "O3B": "União Europeia",
    "JPN": "Japão",
    "IND": "Índia",
    "CA": "Canadá",
    "GER": "Alemanha",
    "IT": "Itália",
    "SPN": "Espanha",
    "SKOR": "Coreia do Sul",
    "NKOR": "Coreia do Norte",
    "AUS": "Austrália",
    "ARGN": "Argentina",
    "SWED": "Suécia",
    "NOR": "Noruega",
    "NETH": "Holanda",
    "DEN": "Dinamarca",
    "FIN": "Finlândia",
    "POL": "Polônia",
    "CZ": "República Tcheca",
    "CZCH": "República Tcheca",
    "TURK": "Turquia",
    "ISR": "Israel",
    "MEX": "México",
    "INDO": "Indonésia",
    "UAE": "Emirados Árabes Unidos",
    "ALG": "Argélia",
    "SAFR": "África do Sul",
    "UKR": "Ucrânia",
    "NIG": "Nigéria",
    "EGYP": "Egito",
    "THAI": "Tailândia",
    "MALA": "Malásia",
    "SING": "Singapura",
    "PAKI": "Paquistão",
    "KAZ": "Cazaquistão",
    "ARAB": "Países Árabes",
    "SAUD": "Arábia Saudita",
    "NZ": "Nova Zelândia",
    "TWN": "Taiwan",
    "IRAN": "Irã",
    "ISS": "Multi-Nacional (ISS)",
    "SEAL": "Internacional",
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
        "descricao": "Estação Espacial Chinesa Tiangong (CSS) — Módulo central Tianhe (22,5 t; ~66 t no complexo completo de 3 módulos) da estação espacial orbital permanente da China, conduzindo pesquisas em microgravidade e ciência espacial.",
        "operador": "CMSA (Agência Espacial Tripulada da China)",
        "massa_kg": 66000.0,
        "imagem_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Tianhe_core_module_in_orbit.jpg/640px-Tianhe_core_module_in_orbit.jpg"
    },
    "20580": {
        "descricao": "Telescópio Espacial Hubble (HST) — Observatório espacial operando na faixa visível, ultravioleta e infravermelho próximo, revolucionando a astrofísica moderna desde abril de 1990.",
        "operador": "NASA / ESA",
        "massa_kg": 11110.0,
        "imagem_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/HST-SM4.jpeg/640px-HST-SM4.jpeg"
    },
    "22490": {
        "descricao": "SCD-1 (Satélite de Coleta de Dados 1) — Primeiro satélite inteiramente fabricado e testado no Brasil pelo INPE, lançado em fevereiro de 1993 para monitoramento ambiental e meteorológico.",
        "operador": "INPE (Brasil)",
        "massa_kg": 115.0,
        "imagem_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/SCD-1.jpg/640px-SCD-1.jpg"
    },
    "25504": {
        "descricao": "SCD-2 (Satélite de Coleta de Dados 2) — Segundo satélite brasileiro de coleta de dados ambientais, transmitindo telemetria de plataformas hidrológicas e meteorológicas da Amazônia desde outubro de 1998.",
        "operador": "INPE (Brasil)",
        "massa_kg": 117.0,
        "imagem_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/SCD-2_satellite.jpg/640px-SCD-2_satellite.jpg"
    },
    "47699": {
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
    "40336": {
        "descricao": "CBERS-4 — Satélite do Programa Sino-Brasileiro de Recursos Terrestres lançado em 2014 para monitoramento ambiental, agrícola e cartográfico contínuo.",
        "operador": "INPE (Brasil) / CAST (China)",
        "massa_kg": 1980.0,
        "imagem_url": None
    },
    "5": {
        "descricao": "Vanguard 1 — O mais antigo satélite artificial ainda em órbita na história aeroespacial. Lançado pelos Estados Unidos em 17 de março de 1958.",
        "operador": "U.S. Navy / NASA",
        "massa_kg": 1.47,
        "imagem_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Vanguard_1.jpg/640px-Vanguard_1.jpg"
    },
    "24876": {
        "descricao": "GPS BIIR-2 (NAVSTAR 43) — Satélite da constelação de radionavegação GPS operando em órbita média (MEO) a cerca de 20.200 km com relógios atômicos de alta precisão.",
        "operador": "Força Espacial dos EUA",
        "massa_kg": 2032.0,
        "imagem_url": None
    },
    "24946": {
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
    "25730": {
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
        self.url_satcat_csv = "https://celestrak.org/pub/satcat.csv"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        self.mapeamento_paises = {
            "25544": "Multi-Nacional (ISS)",
            "48274": "China",
            "22490": "Brasil",
            "25504": "Brasil",
            "47699": "Brasil",
            "44883": "Brasil/China",
            "40336": "Brasil/China",
            "5": "Estados Unidos",
            "20580": "Estados Unidos / ESA",
            "24876": "Estados Unidos",
            "24946": "Estados Unidos",
            "22675": "Rússia",
            "25730": "China",
            "43013": "Estados Unidos",
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
        norad_norm = normalizar_norad_id(norad_id)
        if norad_norm in self.mapeamento_paises:
            return self.mapeamento_paises[norad_norm]

        nome_upper = (nome or "").upper()

        # Brasil
        if any(x in nome_upper for x in ["AMAZONIA", "SCD", "ITASAT", "VCUB", "FLORIPASAT", "NANOSATCBR"]) or re.search(r"\b(SPORT|PION)\b", nome_upper):
            return "Brasil"
        if "CBERS" in nome_upper:
            return "Brasil/China"
        # Estados Unidos
        if any(x in nome_upper for x in ["STARLINK", "GPS", "NAVSTAR", "VANGUARD", "NOAA", "GOES", "NROL", "IRIDIUM", "EXPLORER", "TIROS", "TRANSIT", "LACROSSE", "SBIRS", "DSP", "CREW DRAGON", "DRAGON", "CYGNUS", "SKYLAB", "FALCON", "CENTAUR", "DELTA", "TITAN"]):
            return "Estados Unidos"
        # Rússia
        if any(x in nome_upper for x in ["COSMOS", "SOYUZ", "GLONASS", "MOLNIYA", "RADUGA", "GRIF", "EXPRESS", "LUCH", "YANTAR", "PROGRESS", "POISK", "ZVEZDA", "ZARYA", "FREGAT", "SL-", "KOSMOS", "PROTON", "ZENIT"]):
            return "Rússia"
        # China
        if any(x in nome_upper for x in ["TIANGONG", "BEIDOU", "SHENZHOU", "CHANG'E", "YAOGAN", "GAOFEN", "SHIYAN", "YUNHAI", "JILIN", "ZONGHENG", "FENGYUN", "TIANHE", "WENTIAN", "MENGTIAN", "TIANZHOU", "CZ-", "LONG MARCH"]):
            return "China"
        # França
        if any(x in nome_upper for x in ["SPOT", "CERISE"]):
            return "França"
        # Japão
        if any(x in nome_upper for x in ["HIMAWARI", "ALOS", "GOSAT", "KAGUYA", "HAYABUSA", "ASNARO", "ETS", "IGS", "HTV", "KIBO", "JEM", "H-2A", "H-II"]):
            return "Japão"
        # Índia
        if any(x in nome_upper for x in ["INSAT", "IRS", "GSAT", "CARTOSAT", "RESOURCESAT", "OCEANSAT", "RISAT", "ASTROSAT", "PSLV", "GSLV"]):
            return "Índia"
        # União Europeia / ESA
        if any(x in nome_upper for x in ["ARIANE", "SENTINEL", "GALILEO", "METEOP", "METOP", "ENVISAT", "ERS", "ISO", "HERSCHEL", "COLUMBUS"]):
            return "União Europeia"
        # Reino Unido
        if any(x in nome_upper for x in ["ONEWEB", "SKYNET"]):
            return "Reino Unido"
        # Canadá
        if any(x in nome_upper for x in ["ANIK", "RADARSAT"]):
            return "Canadá"
        # Coreia do Sul
        if any(x in nome_upper for x in ["KOREASAT", "KOMPSAT"]):
            return "Coreia do Sul"

        return "Não Identificado"

    def classificar_objeto(
        self,
        nome: str,
        norad_id: str,
        ano: int,
        grupo: str = None,
        name_param: str = None,
        special: str = None,
        ops_code: str = None,
        object_type: str = None,
    ):
        """
        Classifica o objeto orbital em uma das 5 categorias oficiais:
        1: Satélite Ativo
        2: Satélite Inativo
        3: Detrito Espacial
        4: Estação Espacial
        5: Corpo de Foguete
        """
        norad_norm = normalizar_norad_id(norad_id)
        nome_upper = (nome or "").upper()
        ops = (ops_code or "").strip().upper()
        obj_type = (object_type or "").strip().upper()

        # Estações espaciais principais e módulos acoplados
        if norad_norm == "25544":
            return 4, "Ativo (Operacional)", None
        if norad_norm == "48274":
            return 4, "Ativo (Operacional)", None
        if norad_norm in MODULOS_ISS or (nome_upper.startswith("ISS (") and norad_norm != "25544"):
            return 4, "Módulo / Nave Acoplada", "25544"
        if norad_norm in MODULOS_TIANGONG or (nome_upper.startswith("CSS (") and norad_norm != "48274"):
            return 4, "Módulo / Nave Acoplada", "48274"

        # Corpos de foguetes
        if (
            obj_type == "R/B"
            or any(x in nome_upper for x in [" R/B", "ROCKET", "STAGE", "TRANSTAGE", "CENTAUR", "FALCON 9 R/B", "SL-4 R/B", "SL-8 R/B", "SL-12 R/B", "SL-16 R/B", "CZ-2", "CZ-3", "CZ-4"])
            or (name_param and name_param.upper() == "R/B")
        ):
            return 5, "Inerte (Estágio Descartado)", None

        # Detritos espaciais
        if (
            obj_type == "DEB"
            or any(x in nome_upper for x in [" DEB", "DEBRIS", "FRAGMENT"])
            or (grupo and grupo in ["cosmos-2251-debris", "iridium-33-debris", "fengyun-1c-debris"])
        ):
            return 3, "Detrito Inerte", None

        # Status operacional oficial do SATCAT quando disponível
        if ops in ("+", "P", "B", "S", "X"):
            return 1, "Ativo (Operacional)", None
        if ops == "-":
            return 2, "Inativo (Desativado)", None

        # Heurística de reserva para cargas sem OPS_STATUS_CODE
        constelacoes_ativas = ["GPS", "NAVSTAR", "GLONASS", "GALILEO", "BEIDOU", "AMAZONIA", "SCD"]
        ids_brasileiros_ativos = ["22490", "25504", "47699", "40336", "44883"]
        is_protegido = any(c in nome_upper for c in constelacoes_ativas) or norad_norm in ids_brasileiros_ativos
        if (ano and ano < 2015 and not is_protegido) or (special and "GPZ" in special.upper()):
            return 2, "Inativo (Desativado)", None

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

    @staticmethod
    def classificar_regime_esa(linha1: str, linha2: str) -> str:
        """Classifica o regime orbital (LEO, MEO, GEO, HEO) a partir do TLE."""
        if not linha2 or len(linha2) < 69:
            return "LEO"
        try:
            ecc_str = "0." + linha2[26:33].strip()
            ecc = float(ecc_str)
            mm_str = linha2[52:63].strip()
            mm = float(mm_str)
            if mm <= 0:
                return "LEO"
            period_min = 1440.0 / mm
            n_rad_s = (mm * 2.0 * math.pi) / 86400.0
            a = (398600.4418 / (n_rad_s * n_rad_s)) ** (1.0 / 3.0)
            h_p = a * (1.0 - ecc) - 6378.137
            h_a = a * (1.0 + ecc) - 6378.137

            if ((1350.0 <= period_min <= 1650.0) or (34000.0 <= h_p and h_a <= 50000.0)) and ecc < 0.25:
                return "GEO"
            if h_p < 2000.0 and h_a <= 2000.0 and ecc < 0.25:
                return "LEO"
            if h_p >= 2000.0 and h_a < 35500.0 and ecc < 0.25:
                return "MEO"
            return "HEO"
        except Exception:
            return "LEO"

    def classificar_regime_esa_omm(self, omm: dict) -> str:
        """Classifica o regime orbital (LEO, MEO, GEO, HEO) a partir dos parâmetros numéricos do OMM."""
        try:
            e = float(omm.get("ECCENTRICITY", 0.0))
            n = float(omm.get("MEAN_MOTION", 0.0))
            if n <= 0.0:
                return "LEO"

            n_rad = n * (2.0 * math.pi / 86400.0)
            mu = 398600.4418
            a = (mu / (n_rad ** 2)) ** (1.0 / 3.0)
            r_terra = 6378.137
            hp = a * (1.0 - e) - r_terra
            ha = a * (1.0 + e) - r_terra
            periodo_min = 1440.0 / n

            if ((1350.0 <= periodo_min <= 1650.0) or (34000.0 <= hp and ha <= 50000.0)) and e < 0.25:
                return "GEO"
            if hp < 2000.0 and ha <= 2000.0 and e < 0.25:
                return "LEO"
            if hp >= 2000.0 and ha < 35500.0 and e < 0.25:
                return "MEO"
            return "HEO"
        except Exception:
            return "LEO"

    def coletar_e_processar(self, db: Session, grupo: str = None, name: str = None, special: str = None, categoria_nome: str = None) -> bool:
        """Consome o endpoint do CelesTrak no formato OMM (JSON) ou TLE legado e salva via Bulk UPSERT no PostgreSQL."""
        origem = grupo or name or special or "desconhecido"
        logger.info(f"Iniciando requisição ao CelesTrak para '{origem}'...")
        params = {"FORMAT": "json"}
        if grupo:
            params["GROUP"] = grupo
        elif name:
            params["NAME"] = name
        elif special:
            params["SPECIAL"] = special

        try:
            with httpx.Client(timeout=20.0, headers=self.headers) as client:
                response = client.get(self.url_base, params=params)
                if response.status_code == 403:
                    logger.warning(f"CelesTrak retornou 403 (limitação temporária de taxa) para '{origem}'.")
                    return False
                response.raise_for_status()

                try:
                    dados_json = response.json()
                except Exception:
                    dados_json = None
                texto_bruto = response.text if dados_json is None else ""
        except httpx.TimeoutException:
            logger.warning(f"Tempo limite (timeout) esgotado para o CelesTrak para '{origem}'. Pulando com segurança.")
            return False
        except Exception as e:
            logger.error(f"Falha na requisição HTTP para o CelesTrak para '{origem}': {e}")
            return False

        objetos_a_inserir = []
        tle_dados_temporarios = []

        # Fluxo 1: Payload OMM em JSON
        if isinstance(dados_json, list) and len(dados_json) > 0:
            logger.info(f"Resposta OMM JSON recebida de '{origem}'. Processando {len(dados_json)} objetos orbitais...")
            for item in dados_json:
                if not isinstance(item, dict):
                    continue

                nome = str(item.get("OBJECT_NAME", "")).strip()
                norad_id = normalizar_norad_id(str(item.get("NORAD_CAT_ID", "")))
                if not norad_id:
                    continue

                cospar_id = str(item.get("OBJECT_ID", "")).strip() or None
                pais = self.inferir_pais_por_nome(nome, norad_id)

                ano = None
                if cospar_id and len(cospar_id) >= 4 and cospar_id[:4].isdigit():
                    ano = int(cospar_id[:4])
                    data_lancamento = date(ano, 1, 1)
                else:
                    data_lancamento = None

                cat_id_final, status_final, estacao_pai = self.classificar_objeto(nome, norad_id, ano, grupo, name, special)
                regime_final = self.classificar_regime_esa_omm(item)

                objetos_a_inserir.append({
                    "nome": nome,
                    "norad_id": norad_id,
                    "cospar_id": cospar_id,
                    "pais": pais,
                    "status": status_final,
                    "data_lancamento": data_lancamento,
                    "categoria_id": cat_id_final,
                    "estacao_pai_norad": estacao_pai,
                    "regime": regime_final,
                    "dados_omm": item,
                    "ultimo_tle_linha1": None,
                    "ultimo_tle_linha2": None,
                    "ultimo_tle_epoch": None
                })

        # Fluxo 2: Fallback para formato texto TLE legado
        elif texto_bruto:
            linhas = [l.strip() for l in texto_bruto.splitlines() if l.strip()]
            total_linhas = len(linhas)
            logger.info(f"Resposta de texto bruto recebida de '{origem}'. Parseando {total_linhas} linhas de texto...")

            for i in range(0, total_linhas - 2, 3):
                linha0 = linhas[i]
                linha1 = linhas[i + 1]
                linha2 = linhas[i + 2]

                if not (linha1.startswith("1 ") and linha2.startswith("2 ") and len(linha1) >= 69 and len(linha2) >= 69):
                    continue

                try:
                    norad_id = normalizar_norad_id(linha1[2:7])
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

                    cat_id_final, status_final, estacao_pai = self.classificar_objeto(linha0, norad_id, ano, grupo, name, special)
                    regime_final = self.classificar_regime_esa(linha1, linha2)

                    objetos_a_inserir.append({
                        "nome": linha0,
                        "norad_id": norad_id,
                        "cospar_id": cospar_id,
                        "pais": pais,
                        "status": status_final,
                        "data_lancamento": data_lancamento,
                        "categoria_id": cat_id_final,
                        "estacao_pai_norad": estacao_pai,
                        "regime": regime_final,
                        "dados_omm": None,
                        "ultimo_tle_linha1": linha1,
                        "ultimo_tle_linha2": linha2,
                        "ultimo_tle_epoch": epoch_dt
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
            logger.info(f"Nenhum objeto válido parseado para a origem '{origem}'.")
            return True

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
                "estacao_pai_norad": stmt.excluded.estacao_pai_norad,
                "regime": stmt.excluded.regime,
                "dados_omm": stmt.excluded.dados_omm,
                "ultimo_tle_linha1": func.coalesce(stmt.excluded.ultimo_tle_linha1, ObjetoOrbital.ultimo_tle_linha1),
                "ultimo_tle_linha2": func.coalesce(stmt.excluded.ultimo_tle_linha2, ObjetoOrbital.ultimo_tle_linha2),
                "ultimo_tle_epoch": func.coalesce(stmt.excluded.ultimo_tle_epoch, ObjetoOrbital.ultimo_tle_epoch)
            }
        ).returning(ObjetoOrbital.id, ObjetoOrbital.norad_id)

        try:
            result = db.execute(stmt)
            norad_to_id = {row.norad_id: row.id for row in result}
            objetos_salvos = len(norad_to_id)
        except Exception as e:
            logger.error(f"Erro ao executar Bulk UPSERT de objetos para a origem '{origem}': {e}")
            db.rollback()
            return False

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
                return False

        db.commit()
        logger.info(f"LOG: Sincronização do grupo '{origem}' concluída. {objetos_salvos} objetos processados/atualizados. {historicos_gerados} TLEs adicionados.")
        return True

    def reclassificar_todos_objetos(self, db: Session):
        """Sincroniza categoria_id, status, estacao_pai_norad e regime com base no código operacional e TLE."""
        logger.info("LOG: Reclassificando todos os objetos orbitais do banco de dados...")
        objetos = db.query(ObjetoOrbital).all()

        subq = db.query(TLEHistorico.objeto_id, func.max(TLEHistorico.id).label("max_id")).group_by(TLEHistorico.objeto_id).subquery()
        tle_rows = db.query(TLEHistorico.objeto_id, TLEHistorico.linha1, TLEHistorico.linha2).join(
            subq, TLEHistorico.id == subq.c.max_id
        ).all()
        tles_por_obj = {r.objeto_id: (r.linha1, r.linha2) for r in tle_rows}

        atualizados = 0
        for obj in objetos:
            ano = obj.data_lancamento.year if obj.data_lancamento else None
            nova_cat, novo_status, pai_norad = self.classificar_objeto(
                obj.nome,
                obj.norad_id,
                ano,
                ops_code=obj.codigo_status,
            )
            l1 = obj.ultimo_tle_linha1
            l2 = obj.ultimo_tle_linha2
            if not (l1 and l2) and obj.id in tles_por_obj:
                l1, l2 = tles_por_obj[obj.id]

            if l1 and l2:
                novo_regime = self.classificar_regime_esa(l1, l2)
            else:
                novo_regime = obj.regime or "LEO"

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
            if obj.regime != novo_regime:
                obj.regime = novo_regime
                alterou = True
            if alterou:
                atualizados += 1
        db.commit()
        logger.info(f"LOG: Reclassificação concluída. {atualizados} objetos atualizados no banco.")

    def deduplicar_norads_zeros_esquerda(self, db: Session) -> dict:
        """Remove duplicatas e normaliza NORAD IDs salvos com zeros à esquerda."""
        linhas = (
            db.query(ObjetoOrbital)
            .filter(text("norad_id ~ '^0+[0-9]+$'"))
            .order_by(ObjetoOrbital.id.asc())
            .all()
        )
        if not linhas:
            return {"removidos": 0, "normalizados": 0}

        todos_norads = {
            r[0]
            for r in db.query(ObjetoOrbital.norad_id).all()
        }

        removidos = 0
        normalizados = 0
        for obj in linhas:
            norm_id = normalizar_norad_id(obj.norad_id)
            if not norm_id or norm_id == obj.norad_id:
                continue
            if norm_id in todos_norads:
                db.delete(obj)
                removidos += 1
            else:
                todos_norads.add(norm_id)
                obj.norad_id = norm_id
                normalizados += 1

        db.commit()
        logger.info(f"LOG: Deduplicação NORAD concluída ({removidos} removidos, {normalizados} normalizados).")
        return {"removidos": removidos, "normalizados": normalizados}

    def sincronizar_satcat_completo(self, db: Session) -> bool:
        """Sincroniza metadados oficiais de país, tipo, status operacional e datas via satcat.csv do CelesTrak."""
        try:
            with httpx.Client(timeout=45.0, headers=self.headers, follow_redirects=True) as client:
                resp = client.get(self.url_satcat_csv)
                if resp.status_code != 200:
                    logger.warning(f"Aviso ao baixar satcat.csv: HTTP {resp.status_code}")
                    return False
                conteudo_csv = resp.text
        except Exception as e:
            logger.warning(f"Aviso ao baixar satcat.csv do CelesTrak: {e}")
            return False

        objetos_banco = db.query(ObjetoOrbital).all()
        por_norad = {normalizar_norad_id(o.norad_id): o for o in objetos_banco}

        total_em_orbita_satcat = 0
        atualizados = 0
        leitor = csv.DictReader(io.StringIO(conteudo_csv))

        for r in leitor:
            norad = normalizar_norad_id(r.get("NORAD_CAT_ID", ""))
            if not norad:
                continue

            decay_str = (r.get("DECAY_DATE") or "").strip()
            ops_code = (r.get("OPS_STATUS_CODE") or "").strip()
            if not decay_str and ops_code.upper() != "D":
                total_em_orbita_satcat += 1

            obj = por_norad.get(norad)
            if not obj:
                continue

            cospar = (r.get("OBJECT_ID") or "").strip() or None
            obj_type = (r.get("OBJECT_TYPE") or "").strip() or None
            owner_code = (r.get("OWNER") or "").strip().upper()
            launch_str = (r.get("LAUNCH_DATE") or "").strip()
            site_code = (r.get("LAUNCH_SITE") or "").strip().upper()

            if cospar:
                obj.cospar_id = cospar
            if ops_code:
                obj.codigo_status = ops_code
            elif not decay_str and obj.codigo_status == "D":
                obj.codigo_status = None

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

            if norad in self.mapeamento_paises:
                obj.pais = self.mapeamento_paises[norad]
            elif owner_code in MAPA_OWNER_SATCAT:
                obj.pais = MAPA_OWNER_SATCAT[owner_code]
            elif owner_code:
                obj.pais = owner_code

            ano = obj.data_lancamento.year if obj.data_lancamento else None
            nova_cat, novo_status, pai_norad = self.classificar_objeto(
                obj.nome,
                norad,
                ano,
                ops_code=obj.codigo_status,
                object_type=obj_type,
            )
            obj.categoria_id = nova_cat
            obj.status = novo_status
            obj.estacao_pai_norad = pai_norad
            atualizados += 1

        agora_iso = datetime.now(timezone.utc).isoformat()
        self._gravar_metadata(db, "satcat_total_em_orbita", str(total_em_orbita_satcat))
        self._gravar_metadata(db, "ultima_sincronizacao_utc", agora_iso)
        db.commit()
        logger.info(f"LOG: SATCAT completo sincronizado ({atualizados} objetos atualizados; {total_em_orbita_satcat} em órbita).")
        return True

    def _gravar_metadata(self, db: Session, chave: str, valor: str):
        """Insere ou atualiza chave de metadados do catálogo."""
        db.execute(
            text(
                """
                INSERT INTO catalogo_metadata (chave, valor, atualizado_em)
                VALUES (:chave, :valor, CURRENT_TIMESTAMP)
                ON CONFLICT (chave) DO UPDATE
                SET valor = EXCLUDED.valor,
                    atualizado_em = CURRENT_TIMESTAMP
                """
            ),
            {"chave": chave, "valor": valor},
        )

    def reparar_dados_locais(self, db: Session):
        """Corrige duplicatas, países incorretos, classificações e fichas históricas no banco local."""
        self.deduplicar_norads_zeros_esquerda(db)

        # Corrige falsos positivos de país acumulados por regras antigas
        db.execute(
            text(
                """
                UPDATE objeto_orbital
                SET pais = 'Não Identificado'
                WHERE pais = 'Brasil'
                  AND (nome ILIKE '%TRANSPORTER%' OR nome ILIKE '%SCORPION%')
                """
            )
        )
        db.execute(text("UPDATE objeto_orbital SET pais = 'Rússia' WHERE norad_id = '25400'"))
        db.execute(text("UPDATE objeto_orbital SET pais = 'França' WHERE norad_id = '22823'"))

        mapa_operadores = {
            "Globalstar": "Estados Unidos",
            "Intelsat": "Estados Unidos",
            "Orbcomm": "Estados Unidos",
            "Eutelsat": "União Europeia",
            "SES": "União Europeia",
            "EUMETSAT": "União Europeia",
        }
        for op_antigo, pais_destino in mapa_operadores.items():
            db.execute(
                text("UPDATE objeto_orbital SET pais = :destino WHERE pais = :origem"),
                {"destino": pais_destino, "origem": op_antigo},
            )

        for norad_chave, pais_correto in self.mapeamento_paises.items():
            db.execute(
                text("UPDATE objeto_orbital SET pais = :pais WHERE norad_id = :norad"),
                {"pais": pais_correto, "norad": norad_chave},
            )
        db.commit()

        self.reclassificar_todos_objetos(db)

        # Remove fichas históricas que apontavam para NORADs errados para regerar corretamente
        ids_regerar = ["22823", "25400", "54380", "24876", "24946", "11", "25730", "5", "22490", "25504", "47699", "40336", "48274"]
        db.execute(
            text(
                """
                DELETE FROM informacao_missao
                WHERE objeto_id IN (
                    SELECT id FROM objeto_orbital WHERE norad_id = ANY(:ids)
                )
                """
            ),
            {"ids": ids_regerar},
        )
        db.commit()

        self.enriquecer_missoes(db)
        logger.info("LOG: Reparo local de dados concluído com sucesso.")

    def limpar_historico_tles_antigos(self, db: Session, manter_por_objeto: int = 2) -> int:
        """Remove TLEs históricos excedentes mantendo os registros mais recentes por objeto."""
        res = db.execute(
            text(
                """
                DELETE FROM tle_historico
                WHERE id IN (
                    SELECT id FROM (
                        SELECT id, ROW_NUMBER() OVER (PARTITION BY objeto_id ORDER BY id DESC) AS rn
                        FROM tle_historico
                    ) sub
                    WHERE rn > :manter
                )
                """
            ),
            {"manter": manter_por_objeto},
        )
        db.commit()
        removidos = int(res.rowcount or 0)
        logger.info(f"LOG: Limpeza de tle_historico concluída ({removidos} registros antigos removidos).")
        return removidos

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

        norads_unicos = list({
            normalizar_norad_id(r.get("NORAD_CAT_ID", ""))
            for r in registros
            if normalizar_norad_id(r.get("NORAD_CAT_ID", ""))
        })
        por_norad = {}
        for i in range(0, len(norads_unicos), 500):
            lote_norads = norads_unicos[i:i + 500]
            for encontrado in db.query(ObjetoOrbital).filter(ObjetoOrbital.norad_id.in_(lote_norads)).all():
                por_norad[encontrado.norad_id] = encontrado

        atualizados = 0
        for r in registros:
            norad = normalizar_norad_id(r.get("NORAD_CAT_ID", ""))
            if not norad:
                continue
            obj = por_norad.get(norad)
            if not obj:
                continue

            cospar = (r.get("OBJECT_ID") or "").strip() or None
            launch_str = (r.get("LAUNCH_DATE") or "").strip()
            decay_str = (r.get("DECAY_DATE") or "").strip()
            site_code = (r.get("LAUNCH_SITE") or "").strip().upper()
            ops_code = (r.get("OPS_STATUS_CODE") or "").strip() or None
            obj_type = (r.get("OBJECT_TYPE") or "").strip() or None
            owner_code = (r.get("OWNER") or "").strip().upper()

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
            if norad not in self.mapeamento_paises and owner_code in MAPA_OWNER_SATCAT:
                obj.pais = MAPA_OWNER_SATCAT[owner_code]

            ano = obj.data_lancamento.year if obj.data_lancamento else None
            nova_cat, novo_status, pai_norad = self.classificar_objeto(
                obj.nome, norad, ano, ops_code=obj.codigo_status, object_type=obj_type
            )
            obj.categoria_id = nova_cat
            obj.status = novo_status
            obj.estacao_pai_norad = pai_norad
            atualizados += 1

        if atualizados > 0:
            db.commit()
            logger.info(f"LOG: SATCAT atualizou {atualizados} objetos para {params}.")

    def obter_satcat_individual(self, norad_id: str, db: Session):
        """Busca pontual no CelesTrak SATCAT para um objeto específico (on demand / cache no banco)."""
        norad_norm = normalizar_norad_id(norad_id)
        try:
            with httpx.Client(timeout=10.0, headers=self.headers) as client:
                resp = client.get(self.url_satcat, params={"CATNR": norad_norm})
                if resp.status_code != 200:
                    return None
                data = resp.json()
                if not data or not isinstance(data, list):
                    return None
                r = data[0]

                obj = db.query(ObjetoOrbital).filter(ObjetoOrbital.norad_id == norad_norm).first()
                if obj:
                    cospar = (r.get("OBJECT_ID") or "").strip() or None
                    launch_str = (r.get("LAUNCH_DATE") or "").strip()
                    decay_str = (r.get("DECAY_DATE") or "").strip()
                    site_code = (r.get("LAUNCH_SITE") or "").strip().upper()
                    ops_code = (r.get("OPS_STATUS_CODE") or "").strip() or None
                    obj_type = (r.get("OBJECT_TYPE") or "").strip() or None
                    owner_code = (r.get("OWNER") or "").strip().upper()

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
                    if norad_norm not in self.mapeamento_paises and owner_code in MAPA_OWNER_SATCAT:
                        obj.pais = MAPA_OWNER_SATCAT[owner_code]

                    ano = obj.data_lancamento.year if obj.data_lancamento else None
                    nova_cat, novo_status, pai_norad = self.classificar_objeto(
                        obj.nome, norad_norm, ano, ops_code=obj.codigo_status, object_type=obj_type
                    )
                    obj.categoria_id = nova_cat
                    obj.status = novo_status
                    obj.estacao_pai_norad = pai_norad
                    db.commit()
                    return obj
        except Exception as e:
            logger.warning(f"Erro ao buscar SATCAT individual para {norad_norm}: {e}")
        return None

    def enriquecer_missoes(self, db: Session):
        """Enriquece objetos com dados descritivos de missão e engenharia."""
        logger.info("LOG: Iniciando enriquecimento de informações de missão...")

        # Satélites históricos e científicos
        for norad, item_data in SATELLITES_HISTORICOS_INFO.items():
            obj = db.query(ObjetoOrbital).filter(ObjetoOrbital.norad_id == norad).first()
            if not obj:
                continue

            info_existente = db.query(InformacaoMissao).filter(InformacaoMissao.objeto_id == obj.id).first()
            if not info_existente:
                info = InformacaoMissao(
                    objeto_id=obj.id,
                    descricao=item_data["descricao"],
                    operador=item_data["operador"],
                    massa_kg=item_data["massa_kg"],
                    imagem_url=item_data["imagem_url"]
                )
                db.add(info)
            else:
                info_existente.descricao = item_data["descricao"]
                info_existente.operador = item_data["operador"]
                if item_data["massa_kg"]:
                    info_existente.massa_kg = item_data["massa_kg"]
                if item_data["imagem_url"]:
                    info_existente.imagem_url = item_data["imagem_url"]

        db.commit()

        # Demais categorias
        objetos_sem_missao = (
            db.query(
                ObjetoOrbital.id,
                ObjetoOrbital.nome,
                ObjetoOrbital.norad_id,
                ObjetoOrbital.pais,
                ObjetoOrbital.categoria_id,
                ObjetoOrbital.data_lancamento,
            )
            .outerjoin(InformacaoMissao, ObjetoOrbital.id == InformacaoMissao.objeto_id)
            .filter(InformacaoMissao.id.is_(None))
            .all()
        )
        ids_com_missao = set()
        dados_a_inserir = []

        for obj in objetos_sem_missao:
            if obj.id in ids_com_missao:
                continue

            nome_up = obj.nome.upper()
            ano_lancamento = str(obj.data_lancamento.year) if obj.data_lancamento else "ano histórico"

            # Constelação Starlink
            if "STARLINK" in nome_up:
                dados_a_inserir.append(InformacaoMissao(
                    objeto_id=obj.id,
                    descricao="Satélite integrante da megaconstelação Starlink para internet de banda larga global em órbita baixa. Desenvolvido com propulsores de íons de efeito Hall para prevenção de colisões e desorbitação ativa ao fim da vida útil.",
                    operador="SpaceX (EUA)",
                    massa_kg=260.0,
                    imagem_url="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Starlink_satellite_in_orbit.jpg/640px-Starlink_satellite_in_orbit.jpg"
                ))
                ids_com_missao.add(obj.id)

            # Constelação OneWeb
            elif "ONEWEB" in nome_up:
                dados_a_inserir.append(InformacaoMissao(
                    objeto_id=obj.id,
                    descricao="Satélite de telecomunicações em constelação operando a cerca de 1.200 km de altitude, fornecendo conectividade de baixa latência corporativa e governamental com descarte propulsionado obrigatório.",
                    operador="Eutelsat OneWeb (Reino Unido)",
                    massa_kg=150.0,
                    imagem_url="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/OneWeb_satellite.jpg/640px-OneWeb_satellite.jpg"
                ))
                ids_com_missao.add(obj.id)

            # Corpos de foguetes
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
                    descricao=f"{familia}. Estágio propulsor inerte descartado após a injeção da carga útil (Lançamento: {ano_lancamento}). Permanece desprovido de telemetria ou propulsão ativa, representando massa orbital significativa com risco de fragmentação espontânea por pressurização residual de propelentes.",
                    operador=f"Programa Espacial / Lançador ({obj.pais})",
                    massa_kg=massa,
                    imagem_url=None
                ))
                ids_com_missao.add(obj.id)

            # Detritos espaciais
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
                    descricao=f"Detrito inerte catalogado por radar de rastreamento da Space Surveillance Network. Origem: {evento} (Lançamento: {ano_lancamento}). Não possui controle de atitude ou manobra evasiva, cruzando zonas de alta densidade orbital (LEO) em velocidades superiores a 27.000 km/h.",
                    operador=f"Nação de Registro / Origem ({obj.pais})",
                    massa_kg=None,
                    imagem_url=None
                ))
                ids_com_missao.add(obj.id)

            # Satélites inativos
            elif obj.categoria_id == 2:
                dados_a_inserir.append(InformacaoMissao(
                    objeto_id=obj.id,
                    descricao=f"Satélite científico ou operacional com missão primária encerrada (Lançamento: {ano_lancamento}). Permanece em órbita como carga inerte após esgotamento de baterias ou perda de contato de telemetria, sujeito a decaimento orbital passivo por atrito atmosférico residual.",
                    operador=f"Operador Original ({obj.pais})",
                    massa_kg=None,
                    imagem_url=None
                ))
                ids_com_missao.add(obj.id)

            # Módulos e estações espaciais
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
                    descricao=desc,
                    operador=f"Programa Espacial ({obj.pais})",
                    massa_kg=None,
                    imagem_url=None
                ))
                ids_com_missao.add(obj.id)

            # Satélites ativos
            elif obj.categoria_id == 1:
                dados_a_inserir.append(InformacaoMissao(
                    objeto_id=obj.id,
                    descricao=f"Veículo orbital ativo operando em regime regular de telecomunicações, observação da Terra ou pesquisa científica (Lançamento: {ano_lancamento}). Mantém estabilidade de atitude e gera telemetria captada por estações terrestres de rastreamento.",
                    operador="Operador de Registro",
                    massa_kg=None,
                    imagem_url=None
                ))
                ids_com_missao.add(obj.id)

        if dados_a_inserir:
            db.bulk_save_objects(dados_a_inserir)
            db.commit()
            logger.info(f"LOG: {len(dados_a_inserir)} registros gerados com sucesso no banco.")
