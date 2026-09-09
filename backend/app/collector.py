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
    "36086": {"nome": "POISK", "pais": "Rússia", "funcao": "Módulo de Pesquisa e Acoplagem Mini-Research 2 (Roscosmos)"},
    "49044": {"nome": "ISS (NAUKA)", "pais": "Rússia", "funcao": "Módulo Laboratório Científico Multiuso (Roscosmos)"},
    "67796": {"nome": "CREW DRAGON 12", "pais": "Estados Unidos", "funcao": "Cápsula Tripulada Comercial (SpaceX / NASA)"},
    "68837": {"nome": "PROGRESS-MS 34", "pais": "Rússia", "funcao": "Nave Cargueira Automática de Suprimentos (Roscosmos)"},
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
    "69049": {"nome": "TIANZHOU-10", "pais": "China", "funcao": "Nave Cargueira Automatizada de Reabastecimento"},
    "66515": {"nome": "SZ-21 MODULE", "pais": "China", "funcao": "Módulo Orbital de Suporte a Missão Shenzhou"}
}

class APIConector:
    def __init__(self):
        self.url_base = "https://celestrak.org/NORAD/elements/gp.php"
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
        if norad_id in MODULOS_ISS:
            return 4, "Módulo / Nave Acoplada", "25544"

        # 3. Módulos e naves acopladas à Tiangong
        if norad_id in MODULOS_TIANGONG:
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
                "pais": stmt.excluded.pais,
                "status": stmt.excluded.status,
                "data_lancamento": stmt.excluded.data_lancamento,
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

    def enriquecer_com_wikidata(self, db: Session):
        """
        Enriquece os objetos do banco com dados estruturados da Wikidata em 3 níveis:
        - Nível 1: Metadados nominais da Wikidata (via P377) para grandes satélites históricos e científicos
        - Nível 2: Herança de Constelações (Starlink, OneWeb)
        - Nível 3: Diagnóstico Factual de Engenharia para Corpos de Foguetes e Detritos
        """
        logger.info("LOG: Iniciando rotina de enriquecimento factual em 3 níveis (Wikidata + Engenharia)...")

        # 1. Nível 1: Consulta SPARQL para os principais satélites históricos catalogados
        norads_historicos = [
            "25544", "48274", "20580", "22823", "25400", "54380", "44883", 
            "24876", "00011", "43013", "22675", "24946", "36086", "49044", 
            "53239", "54216", "67796", "68689", "68837", "69049", "69180"
        ]
        val_str = " ".join([f"'{x}'" for x in norads_historicos])

        query = f"""
        SELECT ?norad ?item ?itemLabel ?desc_pt ?desc_en ?operatorLabel ?mass ?image WHERE {{
          VALUES ?norad {{ {val_str} }}
          ?item wdt:P377 ?norad .
          OPTIONAL {{ ?item schema:description ?desc_pt FILTER(LANG(?desc_pt) = 'pt') }}
          OPTIONAL {{ ?item schema:description ?desc_en FILTER(LANG(?desc_en) = 'en') }}
          OPTIONAL {{ ?item wdt:P137 ?operator . }}
          OPTIONAL {{ ?item wdt:P2067 ?mass . }}
          OPTIONAL {{ ?item wdt:P18 ?image . }}
          SERVICE wikibase:label {{ bd:serviceParam wikibase:language 'pt,en'. }}
        }}
        """

        headers = {
            "User-Agent": "OrbitalMonitorBot/1.0 (Educational TCC Research; contact: vihug@example.com)",
            "Accept": "application/json"
        }

        try:
            res = httpx.get("https://query.wikidata.org/sparql", params={"query": query, "format": "json"}, headers=headers, timeout=25.0)
            if res.status_code == 200:
                bindings = res.json().get("results", {}).get("bindings", [])
                logger.info(f"Wikidata SPARQL retornou {len(bindings)} registros nominais.")

                # Agrupa por NORAD para evitar duplicações de múltiplos operadores ou propriedades
                dados_wikidata = {}
                for r in bindings:
                    norad = r.get("norad", {}).get("value")
                    if not norad:
                        continue
                    if norad not in dados_wikidata:
                        wiki_id = r.get("item", {}).get("value", "").split("/")[-1]
                        d_pt = r.get("desc_pt", {}).get("value")
                        d_en = r.get("desc_en", {}).get("value")
                        desc = d_pt if d_pt else (d_en if d_en else "Missão científica de observação e monitoramento espacial.")
                        massa_str = r.get("mass", {}).get("value")
                        massa = float(massa_str) if massa_str else None
                        img = r.get("image", {}).get("value")
                        if img:
                            img = img.replace("http://", "https://")
                        dados_wikidata[norad] = {
                            "wikidata_id": wiki_id,
                            "descricao": desc,
                            "operadores": set(),
                            "massa_kg": massa,
                            "imagem_url": img,
                            "artigo_url": f"https://www.wikidata.org/wiki/{wiki_id}"
                        }
                    op = r.get("operatorLabel", {}).get("value")
                    if op and not op.startswith("Q") and op not in dados_wikidata[norad]["operadores"]:
                        dados_wikidata[norad]["operadores"].add(op)
                    if not dados_wikidata[norad]["imagem_url"] and r.get("image", {}).get("value"):
                        dados_wikidata[norad]["imagem_url"] = r.get("image", {}).get("value").replace("http://", "https://")

                for norad, item_data in dados_wikidata.items():
                    obj = db.query(ObjetoOrbital).filter(ObjetoOrbital.norad_id == norad).first()
                    if not obj:
                        continue

                    op_str = " / ".join(item_data["operadores"]) if item_data["operadores"] else "Agência Aeroespacial Soberana"
                    info_existente = db.query(InformacaoMissao).filter(InformacaoMissao.objeto_id == obj.id).first()
                    if not info_existente:
                        info = InformacaoMissao(
                            objeto_id=obj.id,
                            wikidata_id=item_data["wikidata_id"],
                            descricao=item_data["descricao"],
                            operador=op_str,
                            massa_kg=item_data["massa_kg"],
                            imagem_url=item_data["imagem_url"],
                            artigo_url=item_data["artigo_url"]
                        )
                        db.add(info)
                    else:
                        info_existente.wikidata_id = item_data["wikidata_id"]
                        info_existente.descricao = item_data["descricao"]
                        info_existente.operador = op_str
                        if item_data["massa_kg"]:
                            info_existente.massa_kg = item_data["massa_kg"]
                        if item_data["imagem_url"]:
                            info_existente.imagem_url = item_data["imagem_url"]
                        info_existente.artigo_url = item_data["artigo_url"]

                db.commit()
                logger.info("LOG: Enriquecimento de Nível 1 (Wikidata Nominal) persistido com sucesso.")
        except Exception as e:
            logger.warning(f"Aviso ao consultar Wikidata SPARQL: {e}")
            db.rollback()

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
                    wikidata_id="Q64875323",
                    descricao="Satélite integrante da megaconstelação Starlink para internet de banda larga global em órbita baixa. Desenvolvido com propulsores de íons de efeito Hall para prevenção de colisões e desorbitação ativa ao fim da vida útil.",
                    operador="SpaceX (EUA)",
                    massa_kg=260.0,
                    imagem_url="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Starlink_satellite_in_orbit.jpg/640px-Starlink_satellite_in_orbit.jpg",
                    artigo_url="https://www.wikidata.org/wiki/Q64875323"
                ))
                ids_com_missao.add(obj.id)

            # Nível 2: OneWeb
            elif "ONEWEB" in nome_up:
                dados_a_inserir.append(InformacaoMissao(
                    objeto_id=obj.id,
                    wikidata_id="Q19876251",
                    descricao="Satélite de telecomunicações em constelação operando a cerca de 1.200 km de altitude, fornecendo conectividade de baixa latência corporativa e governamental com descarte propulsionado obrigatório.",
                    operador="Eutelsat OneWeb (Reino Unido)",
                    massa_kg=150.0,
                    imagem_url="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/OneWeb_satellite.jpg/640px-OneWeb_satellite.jpg",
                    artigo_url="https://www.wikidata.org/wiki/Q19876251"
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
                    operador=f"Operador de Registro ({obj.pais})",
                    massa_kg=None,
                    imagem_url=None,
                    artigo_url=None
                ))
                ids_com_missao.add(obj.id)

        if dados_a_inserir:
            db.bulk_save_objects(dados_a_inserir)
            db.commit()
            logger.info(f"LOG: {len(dados_a_inserir)} registros de Nível 2 e 3 gerados com sucesso no banco.")
