import sys
import os

# Adiciona o diretório do backend ao sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.collector import APIConector
from app.models import CategoriaObjeto

def main():
    print("==============================================================")
    print("   MOTOR DE COLETA DE DADOS ORBITAIS (APIConector) - MANUAL   ")
    print("==============================================================")
    
    # Inicia a sessão com o banco de dados
    db = SessionLocal()
    conector = APIConector()

    try:
        # Verifica categorias existentes
        categorias_no_banco = db.query(CategoriaObjeto).count()
        if categorias_no_banco == 0:
            print("[ERRO] Nenhuma categoria cadastrada no banco de dados!")
            print("Certifique-se de que o container do Postgres subiu e o script init.sql rodou.")
            return

        print(f"[INFO] Conexão com banco de dados saudável. Categorias ativas: {categorias_no_banco}")

        # Coleta estações espaciais
        print("\n--> Iniciando coleta de Estações Espaciais (Stations)...")
        conector.coletar_e_processar(
            db=db, 
            grupo="stations", 
            categoria_nome="Estação Espacial"
        )

        # Coleta satélites ativos
        print("\n--> Iniciando coleta do catálogo geral de Satélites Ativos (Active)...")
        conector.coletar_e_processar(
            db=db, 
            grupo="active", 
            categoria_nome="Satélite Ativo"
        )

        # Coleta satélites Starlink
        print("\n--> Iniciando coleta do subgrupo massivo Starlink...")
        conector.coletar_e_processar(
            db=db, 
            grupo="starlink", 
            categoria_nome="Satélite Ativo"
        )

        # Coleta satélites visíveis
        print("\n--> Iniciando coleta de Satélites de Interesse Visual (Visual)...")
        conector.coletar_e_processar(
            db=db, 
            grupo="visual", 
            categoria_nome="Satélite Ativo"
        )

        # Coleta subgrupos adicionais
        subgrupos_ativos = [
            "weather", "noaa", "goes", "resource", "amateur", 
            "cubesat", "tle-new", "gps-ops", "galileo", "beidou"
        ]
        for sub in subgrupos_ativos:
            print(f"\n--> Iniciando coleta do subgrupo ativo '{sub}'...")
            conector.coletar_e_processar(db=db, grupo=sub, categoria_nome="Satélite Ativo")

        # Coleta detritos do Iridium 33
        print("\n--> Iniciando coleta de Detritos do evento Iridium 33...")
        conector.coletar_e_processar(
            db=db, 
            grupo="iridium-33-debris", 
            categoria_nome="Detrito Espacial"
        )

        # Coleta detritos do Cosmos 2251
        print("\n--> Iniciando coleta de Detritos do evento Cosmos 2251...")
        conector.coletar_e_processar(
            db=db, 
            grupo="cosmos-2251-debris", 
            categoria_nome="Detrito Espacial"
        )

        # Coleta dados científicos
        print("\n--> Iniciando coleta de Corpos de Foguetes / Científicos (Science)...")
        conector.coletar_e_processar(
            db=db, 
            grupo="science", 
            categoria_nome="Detrito Espacial"
        )

        print("\n==============================================================")
        print("   Sincronização de dados orbitais concluída com sucesso!     ")
        print("==============================================================")

    except Exception as e:
        print(f"\n[ERRO CRÍTICO] Falha durante o processo de importação: {e}")
    finally:
        db.close()



if __name__ == "__main__":
    main()
