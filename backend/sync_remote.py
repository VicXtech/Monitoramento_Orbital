"""
Script de sincronização direta do banco local Docker (11.536 objetos) para o Supabase remoto.
Executa streaming direto entre as duas conexões PostgreSQL de forma ultra-rápida.

Uso:
  docker exec orbital_backend python sync_remote.py "<SUA_URL_SUPABASE>"
"""

import sys
import os
from sqlalchemy import create_engine, text
from app.database import SessionLocal

def sync(remote_url: str):
    print("=" * 60)
    print("SINCRONIZADOR ORBITALED -> SUPABASE")
    print("=" * 60)
    
    if not remote_url or not remote_url.startswith("postgres"):
        print("[ERRO] Informe a URL do Supabase válida como argumento!")
        print('Exemplo: docker exec orbital_backend python sync_remote.py "postgresql://postgres.xxx:senha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"')
        return

    local_db = SessionLocal()
    print(f"Conectando ao Supabase remoto...")
    remote_engine = create_engine(remote_url, pool_pre_ping=True)

    with remote_engine.connect() as remote_conn:
        print("[1/4] Sincronizando Categorias...")
        remote_conn.execute(text("""
            INSERT INTO categoria_objeto (id, nome, descricao, cor_visualizacao) VALUES
            (1, 'Satélite Ativo', 'Satélites operacionais ativos em órbita executando serviços de comunicação, observação, etc.', '#00FF66'),
            (2, 'Satélite Inativo', 'Satélites que encerraram suas operações e permanecem em órbita desativados.', '#FFAA00'),
            (3, 'Detrito Espacial', 'Fragmentos metálicos inertes resultantes de colisões ou degradação em órbita.', '#FF0055'),
            (4, 'Estação Espacial', 'Grandes estruturas habitáveis em órbita que abrigam astronautas e experimentos.', '#00F0FF'),
            (5, 'Corpo de Foguete', 'Estágios superiores descartados que atingiram velocidade orbital e permanecem à deriva.', '#B026FF')
            ON CONFLICT (id) DO UPDATE SET
                nome = EXCLUDED.nome,
                descricao = EXCLUDED.descricao,
                cor_visualizacao = EXCLUDED.cor_visualizacao;
        """))
        remote_conn.commit()

        print("[2/4] Sincronizando 11.536 Objetos Orbitais...")
        objs = local_db.execute(text("SELECT id, nome, norad_id, cospar_id, pais, status, data_lancamento, data_decaimento, local_lancamento, codigo_status, categoria_id, estacao_pai_norad FROM objeto_orbital ORDER BY id")).fetchall()
        
        for i in range(0, len(objs), 500):
            chunk = objs[i:i+500]
            params = []
            for o in chunk:
                params.append({
                    "id": o.id, "nome": o.nome, "norad_id": o.norad_id, "cospar_id": o.cospar_id,
                    "pais": o.pais, "status": o.status, "data_lancamento": o.data_lancamento,
                    "data_decaimento": o.data_decaimento, "local_lancamento": o.local_lancamento,
                    "codigo_status": o.codigo_status, "categoria_id": o.categoria_id,
                    "estacao_pai_norad": o.estacao_pai_norad
                })
            remote_conn.execute(text("""
                INSERT INTO objeto_orbital (id, nome, norad_id, cospar_id, pais, status, data_lancamento, data_decaimento, local_lancamento, codigo_status, categoria_id, estacao_pai_norad)
                VALUES (:id, :nome, :norad_id, :cospar_id, :pais, :status, :data_lancamento, :data_decaimento, :local_lancamento, :codigo_status, :categoria_id, :estacao_pai_norad)
                ON CONFLICT (id) DO UPDATE SET
                    nome = EXCLUDED.nome,
                    norad_id = EXCLUDED.norad_id,
                    cospar_id = EXCLUDED.cospar_id,
                    pais = EXCLUDED.pais,
                    status = EXCLUDED.status,
                    data_lancamento = EXCLUDED.data_lancamento,
                    data_decaimento = EXCLUDED.data_decaimento,
                    local_lancamento = EXCLUDED.local_lancamento,
                    codigo_status = EXCLUDED.codigo_status,
                    categoria_id = EXCLUDED.categoria_id,
                    estacao_pai_norad = EXCLUDED.estacao_pai_norad;
            """), params)
            remote_conn.commit()
            print(f" -> Objetos inseridos: {min(i+500, len(objs))}/{len(objs)}")

        remote_conn.execute(text("SELECT setval('objeto_orbital_id_seq', (SELECT COALESCE(max(id), 1) FROM objeto_orbital));"))
        remote_conn.commit()

        print("[3/4] Sincronizando 11.536 Informações de Missão...")
        missoes = local_db.execute(text("SELECT id, objeto_id, descricao, operador, massa_kg, imagem_url FROM informacao_missao ORDER BY id")).fetchall()
        for i in range(0, len(missoes), 500):
            chunk = missoes[i:i+500]
            params = []
            for m in chunk:
                params.append({
                    "id": m.id, "objeto_id": m.objeto_id, "descricao": m.descricao,
                    "operador": m.operador, "massa_kg": m.massa_kg, "imagem_url": m.imagem_url
                })
            remote_conn.execute(text("""
                INSERT INTO informacao_missao (id, objeto_id, descricao, operador, massa_kg, imagem_url)
                VALUES (:id, :objeto_id, :descricao, :operador, :massa_kg, :imagem_url)
                ON CONFLICT (id) DO UPDATE SET
                    objeto_id = EXCLUDED.objeto_id,
                    descricao = EXCLUDED.descricao,
                    operador = EXCLUDED.operador,
                    massa_kg = EXCLUDED.massa_kg,
                    imagem_url = EXCLUDED.imagem_url;
            """), params)
            remote_conn.commit()
            print(f" -> Missões inseridas: {min(i+500, len(missoes))}/{len(missoes)}")

        remote_conn.execute(text("SELECT setval('informacao_missao_id_seq', (SELECT COALESCE(max(id), 1) FROM informacao_missao));"))
        remote_conn.commit()

        print("[4/4] Sincronizando 11.536 TLEs Recentes...")
        tles = local_db.execute(text("""
            SELECT DISTINCT ON (objeto_id) objeto_id, epoch, linha1, linha2
            FROM tle_historico
            ORDER BY objeto_id, epoch DESC
        """)).fetchall()
        
        # Limpar TLEs existentes no remoto para evitar duplicatas primárias se necessário
        remote_conn.execute(text("TRUNCATE TABLE tle_historico;"))
        remote_conn.commit()

        for i in range(0, len(tles), 500):
            chunk = tles[i:i+500]
            params = []
            for t in chunk:
                params.append({
                    "objeto_id": t.objeto_id, "epoch": t.epoch, "linha1": t.linha1, "linha2": t.linha2
                })
            remote_conn.execute(text("""
                INSERT INTO tle_historico (objeto_id, epoch, linha1, linha2)
                VALUES (:objeto_id, :epoch, :linha1, :linha2);
            """), params)
            remote_conn.commit()
            print(f" -> TLEs inseridos: {min(i+500, len(tles))}/{len(tles)}")

    print("=" * 60)
    print("SINCRONIZACAO CONCLUIDA COM SUCESSO NO SUPABASE!")
    print("=" * 60)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python sync_remote.py <DATABASE_URL_DO_SUPABASE>")
        sys.exit(1)
    sync(sys.argv[1])
