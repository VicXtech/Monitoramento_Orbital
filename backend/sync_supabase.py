import sys
import os
import json
import time
from sqlalchemy import create_engine, text
from app.database import SessionLocal


def sincronizar(url_remota: str):
    # Valida string de conexao
    if not url_remota or not url_remota.startswith("postgres"):
        print("[ERRO] Informe uma URL valida do PostgreSQL/Supabase")
        print('Exemplo: docker exec orbital_backend python sync_supabase.py "postgresql://postgres.xxx:senha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"')
        return

    print("=" * 65)
    print("  SINCRONIZACAO COMPLETA: BANCO LOCAL (31.842) -> SUPABASE")
    print("=" * 65)

    local_db = SessionLocal()
    print("[1/5] Conectando ao banco Supabase remoto...")
    remote_engine = create_engine(url_remota, pool_pre_ping=True)

    with remote_engine.connect() as remote_conn:
        # 1. Garante categorias e colunas no remoto
        print("[2/5] Verificando estrutura e sincronizando categorias...")
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
        remote_conn.execute(text("ALTER TABLE objeto_orbital ADD COLUMN IF NOT EXISTS regime VARCHAR(10);"))
        remote_conn.execute(text("ALTER TABLE objeto_orbital ADD COLUMN IF NOT EXISTS dados_omm JSONB;"))
        remote_conn.commit()

        # 2. Sincroniza todos os objetos orbitais
        print("[3/5] Lendo todos os 31.842 objetos do banco local...")
        objs = local_db.execute(text("""
            SELECT id, nome, norad_id, cospar_id, pais, status, data_lancamento,
                   data_decaimento, local_lancamento, codigo_status, categoria_id,
                   estacao_pai_norad, regime, dados_omm
            FROM objeto_orbital ORDER BY id
        """)).fetchall()

        total_objs = len(objs)
        chunk_size = 1000
        print(f" -> Enviando {total_objs} objetos para o Supabase em lotes de {chunk_size}...")

        t_inicio = time.time()
        for i in range(0, total_objs, chunk_size):
            chunk = objs[i:i + chunk_size]
            params = []
            for o in chunk:
                params.append({
                    "id": o.id,
                    "nome": o.nome,
                    "norad_id": o.norad_id,
                    "cospar_id": o.cospar_id,
                    "pais": o.pais,
                    "status": o.status,
                    "data_lancamento": o.data_lancamento,
                    "data_decaimento": o.data_decaimento,
                    "local_lancamento": o.local_lancamento,
                    "codigo_status": o.codigo_status,
                    "categoria_id": o.categoria_id,
                    "estacao_pai_norad": o.estacao_pai_norad,
                    "regime": o.regime,
                    "dados_omm": json.dumps(o.dados_omm) if o.dados_omm else None
                })

            remote_conn.execute(text("""
                INSERT INTO objeto_orbital (
                    id, nome, norad_id, cospar_id, pais, status, data_lancamento,
                    data_decaimento, local_lancamento, codigo_status, categoria_id,
                    estacao_pai_norad, regime, dados_omm
                ) VALUES (
                    :id, :nome, :norad_id, :cospar_id, :pais, :status, :data_lancamento,
                    :data_decaimento, :local_lancamento, :codigo_status, :categoria_id,
                    :estacao_pai_norad, :regime, CAST(:dados_omm AS JSONB)
                )
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
                    estacao_pai_norad = EXCLUDED.estacao_pai_norad,
                    regime = EXCLUDED.regime,
                    dados_omm = EXCLUDED.dados_omm;
            """), params)
            remote_conn.commit()
            print(f"   Progresso objetos: {min(i + chunk_size, total_objs)}/{total_objs}")

        # Atualiza sequence de IDs de objetos
        remote_conn.execute(text("SELECT setval('objeto_orbital_id_seq', (SELECT COALESCE(max(id), 1) FROM objeto_orbital));"))
        remote_conn.commit()

        # 3. Sincroniza informacoes de missao
        print("[4/5] Sincronizando informações de missão dos objetos...")
        missoes = local_db.execute(text("""
            SELECT id, objeto_id, descricao, operador, massa_kg, imagem_url
            FROM informacao_missao ORDER BY id
        """)).fetchall()

        total_missoes = len(missoes)
        for i in range(0, total_missoes, chunk_size):
            chunk = missoes[i:i + chunk_size]
            params = []
            for m in chunk:
                params.append({
                    "id": m.id,
                    "objeto_id": m.objeto_id,
                    "descricao": m.descricao,
                    "operador": m.operador,
                    "massa_kg": m.massa_kg,
                    "imagem_url": m.imagem_url
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
            print(f"   Progresso missões: {min(i + chunk_size, total_missoes)}/{total_missoes}")

        remote_conn.execute(text("SELECT setval('informacao_missao_id_seq', (SELECT COALESCE(max(id), 1) FROM informacao_missao));"))
        remote_conn.commit()

        # 4. Sincroniza TLEs mais recentes de cada objeto
        print("[5/5] Sincronizando TLEs ativos mais recentes...")
        tles = local_db.execute(text("""
            SELECT DISTINCT ON (objeto_id) objeto_id, epoch, linha1, linha2
            FROM tle_historico
            ORDER BY objeto_id, epoch DESC
        """)).fetchall()

        total_tles = len(tles)
        # Substitui os registros com os mais atuais
        remote_conn.execute(text("TRUNCATE TABLE tle_historico;"))
        remote_conn.commit()

        for i in range(0, total_tles, chunk_size):
            chunk = tles[i:i + chunk_size]
            params = []
            for t in chunk:
                params.append({
                    "objeto_id": t.objeto_id,
                    "epoch": t.epoch,
                    "linha1": t.linha1,
                    "linha2": t.linha2
                })
            remote_conn.execute(text("""
                INSERT INTO tle_historico (objeto_id, epoch, linha1, linha2)
                VALUES (:objeto_id, :epoch, :linha1, :linha2);
            """), params)
            remote_conn.commit()
            print(f"   Progresso TLEs: {min(i + chunk_size, total_tles)}/{total_tles}")

        # Verificacao final dos totais remotos
        total_remoto = remote_conn.execute(text("SELECT count(*) FROM objeto_orbital")).scalar()
        tles_remoto = remote_conn.execute(text("SELECT count(*) FROM tle_historico")).scalar()

        t_total = round(time.time() - t_inicio, 1)
        print("=" * 65)
        print("  SINCRONIZACAO FINALIZADA COM SUCESSO!")
        print(f"  Tempo decorrido: {t_total} segundos")
        print(f"  Total de objetos no Supabase: {total_remoto}")
        print(f"  Total de TLEs no Supabase: {tles_remoto}")
        print("=" * 65)

    local_db.close()


if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else os.getenv("SUPABASE_DATABASE_URL")
    if not url:
        print("[AVISO] Informe a URL do Supabase como argumento")
        print('Exemplo de comando:')
        print('docker exec orbital_backend python sync_supabase.py "postgresql://postgres.[ref]:[senha]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"')
        sys.exit(1)
    sincronizar(url)

