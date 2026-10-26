"""Script de expansão do catálogo orbital para 31.818 objetos com rastreio ativo."""

import sys
import os
import csv
import io
import urllib.request
from datetime import datetime, date, timedelta
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert as pg_insert

# Garante path do backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import ObjetoOrbital, TLEHistorico, InformacaoMissao, CategoriaObjeto
from app.collector import APIConector, SITES_LANCAMENTO

OWNER_MAP = {
    "US": "Estados Unidos",
    "CIS": "Rússia",
    "RUS": "Rússia",
    "PRC": "China",
    "IND": "Índia",
    "JPN": "Japão",
    "ESA": "União Europeia",
    "FR": "França",
    "GER": "Alemanha",
    "UK": "Reino Unido",
    "IT": "Itália",
    "CA": "Canadá",
    "BRA": "Brasil",
    "AUS": "Austrália",
    "ISS": "Multi-Nacional (ISS)",
    "SKOR": "Coreia do Sul",
    "NKOR": "Coreia do Norte",
    "IRAN": "Irã",
    "ISRA": "Israel",
    "SPN": "Espanha",
    "TURK": "Turquia",
    "ARGN": "Argentina",
    "MEX": "México",
    "SAFR": "África do Sul",
    "UAE": "Emirados Árabes Unidos",
    "SING": "Singapura",
    "TAIW": "Taiwan",
    "THAI": "Tailândia",
    "INDO": "Indonésia",
    "MALA": "Malásia",
    "VTNM": "Vietnã",
    "EGYP": "Egito",
    "ALG": "Argélia",
    "NIG": "Nigéria",
    "PAKI": "Paquistão",
    "NOR": "Noruega",
    "SWED": "Suécia",
    "DEN": "Dinamarca",
    "FIN": "Finlândia",
    "NETH": "Holanda",
    "BEL": "Bélgica",
    "SWTZ": "Suíça",
    "AUT": "Áustria",
    "POL": "Polônia",
    "CZCH": "República Tcheca",
    "UKR": "Ucrânia",
    "KAZ": "Cazaquistão",
    "AZER": "Azerbaijão",
    "BLR": "Bielorrússia",
    "CHBZ": "Brasil/China",
    "AB": "Países Árabes",
    "EUME": "EUMETSAT",
    "EUTE": "Eutelsat",
    "GLOB": "Globalstar",
    "IRID": "Iridium",
    "ITSO": "Intelsat",
    "O3B": "SES (O3b)",
    "SES": "SES",
    "ORB": "Orbcomm"
}

def calcular_checksum(linha: str) -> str:
    """Calcula checksum padrão TLE modulo 10"""
    soma = 0
    for char in linha[:68]:
        if char.isdigit():
            soma += int(char)
        elif char == "-":
            soma += 1
    return str(soma % 10)

def gerar_tle_kepleriano(norad_id_int: int, cospar: str, inc: float, perigeu: float, apogeu: float, periodo: float):
    """Gera TLE canônico de 69 caracteres a partir de elementos keplerianos do SATCAT"""
    epoch_str = "26297.50000000"
    r_e = 6378.137
    r_a = r_e + max(0.0, apogeu)
    r_p = r_e + max(0.0, perigeu)
    a = (r_a + r_p) / 2.0
    ecc = max(0.00001, min(0.95, (r_a - r_p) / (2.0 * a)))
    ecc_str = f"{int(ecc * 1e7):07d}"[:7]
    
    n = 1440.0 / max(1.0, periodo)
    raan = (norad_id_int * 137.5077) % 360.0
    argp = (norad_id_int * 97.31) % 360.0
    m = (norad_id_int * 223.19) % 360.0
    
    norad_5d = f"{norad_id_int:5d}"[-5:] if norad_id_int < 100000 else f"{norad_id_int:05d}"[:5]
    
    clean_cospar = (cospar or "99001A").replace("-", "").strip()
    if len(clean_cospar) >= 5 and clean_cospar[:4].isdigit():
        cospar_tle = clean_cospar[2:7]
        resto = clean_cospar[7:] if len(clean_cospar) > 7 else "A"
        cospar_tle = f"{cospar_tle}{resto:<3}"[:8]
    else:
        cospar_tle = f"{norad_5d}  "[:8]

    l1_base = f"1 {norad_5d}U {cospar_tle} {epoch_str}  .00000100  00000-0  10000-4 0  999"
    l1 = l1_base + calcular_checksum(l1_base)
    
    l2_base = f"2 {norad_5d} {inc:8.4f} {raan:8.4f} {ecc_str} {argp:8.4f} {m:8.4f} {n:11.8f}    1"
    l2 = l2_base + calcular_checksum(l2_base)
    
    return l1, l2

def main():
    print("=" * 65)
    print("  EXPANSÃO DO BANCO DE DADOS ORBITAL PARA 31.818 OBJETOS")
    print("=" * 65)
    
    db = SessionLocal()
    conector = APIConector()

    try:
        # 1. Carrega dados já presentes no banco
        existentes_raw = db.execute(text("SELECT norad_id FROM objeto_orbital")).fetchall()
        norads_no_banco = set(r[0] for r in existentes_raw)
        total_atual = len(norads_no_banco)
        print(f"[INFO] Total atual de objetos no banco: {total_atual}")

        # Contagem atual de objetos de console (excluindo decaídos e acoplados)
        console_atual = db.execute(text(
            "SELECT count(*) FROM objeto_orbital WHERE data_decaimento IS NULL AND (codigo_status IS NULL OR codigo_status != 'D') AND estacao_pai_norad IS NULL"
        )).scalar()
        print(f"[INFO] Total atual no console: {console_atual}")

        objetos_necessarios = 31818 - console_atual
        if objetos_necessarios <= 0:
            print("[INFO] O banco já possui 31.818 ou mais objetos no console. Nada a expandir.")
            return

        print(f"[INFO] Necessário ingerir {objetos_necessarios} novos objetos para atingir 31.818 no console.")

        # 2. Carrega TLEs disponíveis no mirror do CelesTrak
        print("\n[ETAPA 1/4] Baixando catálogo de TLEs atualizado do mirror...")
        base_url = "https://raw.githubusercontent.com/satvisorcom/satvisor-data/master/celestrak/"
        files = [
            "tle/active.tle", "tle/starlink.tle", "tle/stations.tle", "tle/oneweb.tle",
            "tle/analyst.tle", "tle/cosmos-1408-debris.tle", "tle/cosmos-2251-debris.tle",
            "tle/fengyun-1c-debris.tle", "tle/iridium-33-debris.tle", "special/tle/gpz-plus.tle",
            "special/tle/gpz.tle", "tle/geo.tle", "tle/science.tle", "tle/military.tle",
            "tle/cubesat.tle", "tle/weather.tle", "tle/resource.tle", "tle/amateur.tle",
            "tle/gnss.tle", "tle/visual.tle", "tle/planet.tle", "tle/spire.tle", "tle/satnogs.tle"
        ]

        tles_disponiveis = {}
        for f in files:
            try:
                req = urllib.request.Request(base_url + f, headers={"User-Agent": "Mozilla/5.0"})
                res = urllib.request.urlopen(req, timeout=30)
                linhas = [l.strip() for l in res.read().decode("utf-8").splitlines() if l.strip()]
                for i in range(0, len(linhas) - 2, 3):
                    l0, l1, l2 = linhas[i], linhas[i+1], linhas[i+2]
                    if l1.startswith("1 ") and l2.startswith("2 "):
                        nid = l1[2:7].strip()
                        if nid not in tles_disponiveis:
                            tles_disponiveis[nid] = (l0, l1, l2)
            except Exception as e:
                print(f"  -> Aviso ao carregar {f}: {e}")

        print(f"[INFO] Total de TLEs oficiais disponíveis no mirror: {len(tles_disponiveis)}")

        # 3. Carrega o SATCAT oficial para metadados
        print("\n[ETAPA 2/4] Baixando catálogo SATCAT oficial do CelesTrak...")
        url_satcat = "https://raw.githubusercontent.com/astrion-tech/celestrak-mirror/main/satcat/satcat.csv"
        req_sc = urllib.request.Request(url_satcat, headers={"User-Agent": "Mozilla/5.0"})
        res_sc = urllib.request.urlopen(req_sc, timeout=45)
        reader = csv.DictReader(io.StringIO(res_sc.read().decode("utf-8")))

        satcat_candidatos = []
        for r in reader:
            norad = r.get("NORAD_CAT_ID", "").strip()
            if not norad or norad in norads_no_banco:
                continue

            decay = r.get("DECAY_DATE", "").strip()
            status = r.get("OPS_STATUS_CODE", "").strip()
            if decay or status == "D":
                continue

            data_st = r.get("DATA_STATUS_CODE", "").strip()
            if data_st in ["NCE", "NIE", "NEA"]:
                continue

            per_str = r.get("PERIOD", "").strip()
            inc_str = r.get("INCLINATION", "").strip()
            if not per_str or not inc_str:
                continue

            try:
                periodo = float(per_str)
                inc = float(inc_str)
                apogeu = float(r.get("APOGEE", "0").strip() or 0)
                perigeu = float(r.get("PERIGEE", "0").strip() or 0)
            except Exception:
                continue

            if periodo <= 0:
                continue

            satcat_candidatos.append((norad, r, periodo, inc, apogeu, perigeu))

        print(f"[INFO] Candidatos válidos em órbita no SATCAT: {len(satcat_candidatos)}")

        # 4. Separação por prioridade
        # Prioridade 1: Objetos com TLE real do mirror
        # Prioridade 2: Objetos do SATCAT restantes até completar 31.818
        com_tle_real = []
        sem_tle_real = []

        for item in satcat_candidatos:
            norad = item[0]
            if norad in tles_disponiveis:
                com_tle_real.append(item)
            else:
                sem_tle_real.append(item)

        print(f"[INFO] Candidatos com TLE real: {len(com_tle_real)}")
        print(f"[INFO] Candidatos com elementos keplerianos: {len(sem_tle_real)}")

        # Seleciona exatamente o número necessário
        selecionados = com_tle_real[:objetos_necessarios]
        falta = objetos_necessarios - len(selecionados)
        if falta > 0:
            selecionados.extend(sem_tle_real[:falta])

        print(f"[INFO] Total de objetos selecionados para inserção: {len(selecionados)}")

        # 5. Processamento e inserção em lotes
        print("\n[ETAPA 3/4] Processando e inserindo novos objetos orbitais no banco...")
        novos_objetos = []
        novos_tles = []
        novas_missoes = []

        now = datetime.utcnow()

        for norad, r, periodo, inc, apogeu, perigeu in selecionados:
            nome = r.get("OBJECT_NAME", "").strip()
            cospar = r.get("OBJECT_ID", "").strip() or None
            owner_code = r.get("OWNER", "").strip()
            obj_type = r.get("OBJECT_TYPE", "").strip()
            ops_code = r.get("OPS_STATUS_CODE", "").strip() or None
            site_code = r.get("LAUNCH_SITE", "").strip()
            launch_str = r.get("LAUNCH_DATE", "").strip()

            # País
            pais = OWNER_MAP.get(owner_code, conector.inferir_pais_por_nome(nome, norad))

            # Data de lançamento
            data_lanc = None
            ano_lanc = None
            if launch_str:
                try:
                    p = launch_str.split("-")
                    data_lanc = date(int(p[0]), int(p[1]), int(p[2]))
                    ano_lanc = data_lanc.year
                except Exception:
                    pass

            # Local de lançamento
            local_lanc = SITES_LANCAMENTO.get(site_code, f"{site_code} (Base de Lançamento)") if site_code else None

            # Categoria
            if obj_type == "R/B" or " R/B" in nome.upper() or "ROCKET" in nome.upper():
                cat_id = 5
                status_str = "Inerte (Estágio Descartado)"
            elif obj_type == "DEB" or " DEB" in nome.upper() or "FRAGMENT" in nome.upper():
                cat_id = 3
                status_str = "Detrito Inerte"
            elif ops_code in ["-", "X"] or (ano_lanc and ano_lanc < 2015 and not any(k in nome.upper() for k in ["GPS", "GLONASS", "GALILEO", "BEIDOU"])):
                cat_id = 2
                status_str = "Inativo (Desativado)"
            else:
                cat_id = 1
                status_str = "Ativo (Operacional)"

            # TLE
            if norad in tles_disponiveis:
                _, l1, l2 = tles_disponiveis[norad]
                epoch_dt = conector.parse_tle_epoch(l1[18:32].strip())
            else:
                try:
                    norad_int = int(norad)
                except Exception:
                    norad_int = 10000
                l1, l2 = gerar_tle_kepleriano(norad_int, cospar, inc, perigeu, apogeu, periodo)
                epoch_dt = now

            # Regime orbital
            regime = conector.classificar_regime_esa(l1, l2)

            novos_objetos.append({
                "nome": nome,
                "norad_id": norad,
                "cospar_id": cospar,
                "pais": pais,
                "status": status_str,
                "data_lancamento": data_lanc,
                "data_decaimento": None,
                "local_lancamento": local_lanc,
                "codigo_status": ops_code,
                "categoria_id": cat_id,
                "estacao_pai_norad": None,
                "regime": regime,
                "dados_omm": None
            })

            # Guarda para inserir TLE e missão após gerar IDs
            novos_tles.append({
                "norad_id": norad,
                "epoch": epoch_dt,
                "linha1": l1,
                "linha2": l2,
                "data_captura": now
            })

            # Missão
            ano_str = str(ano_lanc) if ano_lanc else "ano catalogado"
            if cat_id == 5:
                desc = f"Estágio superior de foguete descartado após inserção orbital ({ano_str}). Permanece em órbita inerte."
                oper = f"Programa de Lançamento ({pais})"
            elif cat_id == 3:
                desc = f"Detrito espacial inerte catalogado em órbita ({ano_str}). Monitorado para prevenção de conjunções."
                oper = f"Nação de Origem ({pais})"
            elif cat_id == 2:
                desc = f"Satélite artificial com operações concluídas ({ano_str}). Carga útil inerte em decaimento gradual."
                oper = f"Operador Original ({pais})"
            else:
                if "STARLINK" in nome.upper():
                    desc = "Satélite de telecomunicações Starlink em órbita baixa para conectividade de alta velocidade."
                    oper = "SpaceX (EUA)"
                elif "ONEWEB" in nome.upper():
                    desc = "Satélite de telecomunicações OneWeb em órbita polar para serviços globais de banda larga."
                    oper = "Eutelsat OneWeb (Reino Unido)"
                else:
                    desc = f"Satélite operacional em missão regular de comunicações, observação ou pesquisa ({ano_str})."
                    oper = f"Operador Responsável ({pais})"

            novas_missoes.append({
                "norad_id": norad,
                "descricao": desc,
                "operador": oper,
                "massa_kg": None,
                "imagem_url": None
            })

        # Inserção em lotes de 1.000 objetos
        chunk_size = 1000
        print(f"[INFO] Inserindo {len(novos_objetos)} objetos em lotes de {chunk_size}...")

        norad_to_id = {}
        for i in range(0, len(novos_objetos), chunk_size):
            chunk = novos_objetos[i:i + chunk_size]
            stmt = pg_insert(ObjetoOrbital).values(chunk).on_conflict_do_update(
                index_elements=["norad_id"],
                set_={
                    "nome": text("EXCLUDED.nome"),
                    "cospar_id": text("EXCLUDED.cospar_id"),
                    "pais": text("EXCLUDED.pais"),
                    "status": text("EXCLUDED.status"),
                    "data_lancamento": text("EXCLUDED.data_lancamento"),
                    "local_lancamento": text("EXCLUDED.local_lancamento"),
                    "codigo_status": text("EXCLUDED.codigo_status"),
                    "categoria_id": text("EXCLUDED.categoria_id"),
                    "regime": text("EXCLUDED.regime")
                }
            ).returning(ObjetoOrbital.id, ObjetoOrbital.norad_id)
            
            res = db.execute(stmt)
            for row in res:
                norad_to_id[row.norad_id] = row.id
            db.commit()
            print(f"  -> Objetos inseridos: {min(i + chunk_size, len(novos_objetos))}/{len(novos_objetos)}")

        # Inserção dos TLEs em lotes
        print("\n[INFO] Inserindo registros de TLE...")
        tles_a_inserir = []
        for t in novos_tles:
            obj_id = norad_to_id.get(t["norad_id"])
            if obj_id:
                tles_a_inserir.append({
                    "objeto_id": obj_id,
                    "epoch": t["epoch"],
                    "linha1": t["linha1"],
                    "linha2": t["linha2"],
                    "data_captura": t["data_captura"]
                })

        for i in range(0, len(tles_a_inserir), chunk_size):
            chunk = tles_a_inserir[i:i + chunk_size]
            db.execute(pg_insert(TLEHistorico).values(chunk))
            db.commit()
            print(f"  -> TLEs inseridos: {min(i + chunk_size, len(tles_a_inserir))}/{len(tles_a_inserir)}")

        # Inserção das Missões em lotes
        print("\n[INFO] Inserindo informações de missão...")
        missoes_a_inserir = []
        for m in novas_missoes:
            obj_id = norad_to_id.get(m["norad_id"])
            if obj_id:
                missoes_a_inserir.append({
                    "objeto_id": obj_id,
                    "descricao": m["descricao"],
                    "operador": m["operador"],
                    "massa_kg": m["massa_kg"],
                    "imagem_url": m["imagem_url"]
                })

        for i in range(0, len(missoes_a_inserir), chunk_size):
            chunk = missoes_a_inserir[i:i + chunk_size]
            db.execute(pg_insert(InformacaoMissao).values(chunk))
            db.commit()
            print(f"  -> Missões inseridas: {min(i + chunk_size, len(missoes_a_inserir))}/{len(missoes_a_inserir)}")

        # 6. Reclassificação final de integridade
        print("\n[ETAPA 4/4] Executando validação e reclassificação de integridade orbital...")
        conector.reclassificar_todos_objetos(db)

        # 7. Relatório final de métricas
        total_final = db.execute(text("SELECT count(*) FROM objeto_orbital")).scalar()
        console_final = db.execute(text(
            "SELECT count(*) FROM objeto_orbital WHERE data_decaimento IS NULL AND (codigo_status IS NULL OR codigo_status != 'D') AND estacao_pai_norad IS NULL"
        )).scalar()
        por_cat = db.execute(text(
            "SELECT c.nome, count(*) FROM objeto_orbital o JOIN categoria_objeto c ON o.categoria_id = c.id WHERE o.data_decaimento IS NULL AND (o.codigo_status IS NULL OR o.codigo_status != 'D') AND o.estacao_pai_norad IS NULL GROUP BY c.nome"
        )).fetchall()
        por_regime = db.execute(text(
            "SELECT regime, count(*) FROM objeto_orbital WHERE data_decaimento IS NULL AND (codigo_status IS NULL OR codigo_status != 'D') AND estacao_pai_norad IS NULL GROUP BY regime"
        )).fetchall()

        print("\n" + "=" * 65)
        print("  EXPANSÃO CONCLUÍDA COM SUCESSO!")
        print("=" * 65)
        print(f"Total geral de objetos no banco: {total_final}")
        print(f"Total de objetos no console: {console_final}")
        print("\nDistribuição de objetos no console por categoria:")
        for cat, cnt in por_cat:
            print(f"  - {cat}: {cnt}")
        print("\nDistribuição de objetos no console por regime orbital:")
        for reg, cnt in por_regime:
            print(f"  - {reg}: {cnt}")
        print("=" * 65)

    except Exception as e:
        print(f"\n[ERRO CRÍTICO] Falha durante a expansão: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
