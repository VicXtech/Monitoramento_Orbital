"""
Script utilitário para exportar a base orbital local completa (11.536 objetos + TLEs)
em arquivos SQL prontos para importar no Supabase ou diretamente via conexão remota.
"""

import os
from sqlalchemy import text
from app.database import SessionLocal

def exportar_sql():
    db = SessionLocal()
    print("Iniciando exportação dos 11.536 objetos locais...")

    cat_sql = """INSERT INTO categoria_objeto (id, nome, descricao, cor_visualizacao) VALUES
(1, 'Satélite Ativo', 'Satélites operacionais ativos em órbita executando serviços de comunicação, observação, etc.', '#00FF66'),
(2, 'Satélite Inativo', 'Satélites que encerraram suas operações e permanecem em órbita desativados.', '#FFAA00'),
(3, 'Detrito Espacial', 'Fragmentos metálicos inertes resultantes de colisões ou degradação em órbita.', '#FF0055'),
(4, 'Estação Espacial', 'Grandes estruturas habitáveis em órbita que abrigam astronautas e experimentos.', '#00F0FF'),
(5, 'Corpo de Foguete', 'Estágios superiores descartados que atingiram velocidade orbital e permanecem à deriva.', '#B026FF')
ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao,
    cor_visualizacao = EXCLUDED.cor_visualizacao;
"""

    # --- 1. Exportar Parte 1: Categorias e Objetos ---
    print("Exportando Parte 1: Objetos Orbitais...")
    objs = db.execute(text("SELECT id, nome, norad_id, cospar_id, pais, status, data_lancamento, data_decaimento, local_lancamento, codigo_status, categoria_id, estacao_pai_norad FROM objeto_orbital ORDER BY id")).fetchall()
    
    with open("/app/seed_parte1_objetos.sql", "w", encoding="utf-8") as f1:
        f1.write("-- PARTE 1/3: CATEGORIAS E 11.536 OBJETOS ORBITAIS\nBEGIN;\n\n")
        f1.write(cat_sql + "\n")
        for i in range(0, len(objs), 400):
            chunk = objs[i:i+400]
            vals = []
            for o in chunk:
                nome = o.nome.replace("'", "''")
                cospar = f"'{o.cospar_id}'" if o.cospar_id else "NULL"
                dt_lanc = f"'{o.data_lancamento}'" if o.data_lancamento else "NULL"
                dt_dec = f"'{o.data_decaimento}'" if o.data_decaimento else "NULL"
                local = f"'{o.local_lancamento.replace(chr(39), chr(39)*2)}'" if o.local_lancamento else "NULL"
                cod_st = f"'{o.codigo_status}'" if o.codigo_status else "NULL"
                pai = f"'{o.estacao_pai_norad}'" if o.estacao_pai_norad else "NULL"
                vals.append(f"({o.id}, '{nome}', '{o.norad_id}', {cospar}, '{o.pais}', '{o.status}', {dt_lanc}, {dt_dec}, {local}, {cod_st}, {o.categoria_id}, {pai})")
            f1.write("INSERT INTO objeto_orbital (id, nome, norad_id, cospar_id, pais, status, data_lancamento, data_decaimento, local_lancamento, codigo_status, categoria_id, estacao_pai_norad) VALUES\n" + ",\n".join(vals) + "\nON CONFLICT (id) DO NOTHING;\n\n")
        f1.write("SELECT setval('objeto_orbital_id_seq', (SELECT COALESCE(max(id), 1) FROM objeto_orbital));\nCOMMIT;\n")

    # --- 2. Exportar Parte 2: Informações de Missão ---
    print("Exportando Parte 2: Informações de Missão...")
    missoes = db.execute(text("SELECT id, objeto_id, descricao, operador, massa_kg, imagem_url FROM informacao_missao ORDER BY id")).fetchall()
    
    with open("/app/seed_parte2_missoes.sql", "w", encoding="utf-8") as f2:
        f2.write("-- PARTE 2/3: 11.536 INFORMAÇÕES DE MISSÃO E IMAGENS\nBEGIN;\n\n")
        for i in range(0, len(missoes), 400):
            chunk = missoes[i:i+400]
            vals = []
            for m in chunk:
                desc = f"'{m.descricao.replace(chr(39), chr(39)*2)}'" if m.descricao else "NULL"
                op = f"'{m.operador.replace(chr(39), chr(39)*2)}'" if m.operador else "NULL"
                massa = str(m.massa_kg) if m.massa_kg is not None else "NULL"
                img = f"'{m.imagem_url.replace(chr(39), chr(39)*2)}'" if m.imagem_url else "NULL"
                vals.append(f"({m.id}, {m.objeto_id}, {desc}, {op}, {massa}, {img})")
            f2.write("INSERT INTO informacao_missao (id, objeto_id, descricao, operador, massa_kg, imagem_url) VALUES\n" + ",\n".join(vals) + "\nON CONFLICT (id) DO NOTHING;\n\n")
        f2.write("SELECT setval('informacao_missao_id_seq', (SELECT COALESCE(max(id), 1) FROM informacao_missao));\nCOMMIT;\n")

    # --- 3. Exportar Parte 3: TLEs Recentes ---
    print("Exportando Parte 3: TLEs mais recentes...")
    tles = db.execute(text("""
        SELECT DISTINCT ON (objeto_id) objeto_id, epoch, linha1, linha2
        FROM tle_historico
        ORDER BY objeto_id, epoch DESC
    """)).fetchall()
    
    with open("/app/seed_parte3_tles.sql", "w", encoding="utf-8") as f3:
        f3.write("-- PARTE 3/3: 11.536 TLEs MAIS RECENTES\nBEGIN;\n\n")
        for i in range(0, len(tles), 400):
            chunk = tles[i:i+400]
            vals = []
            for t in chunk:
                vals.append(f"({t.objeto_id}, '{t.epoch.isoformat()}', '{t.linha1}', '{t.linha2}')")
            f3.write("INSERT INTO tle_historico (objeto_id, epoch, linha1, linha2) VALUES\n" + ",\n".join(vals) + ";\n\n")
        f3.write("COMMIT;\n")

    print("[SUCESSO] Todas as partes foram exportadas:")
    for arq in ["seed_parte1_objetos.sql", "seed_parte2_missoes.sql", "seed_parte3_tles.sql"]:
        path = f"/app/{arq}"
        mb = os.path.getsize(path) / (1024 * 1024)
        print(f" -> {arq}: {mb:.2f} MB")

if __name__ == "__main__":
    exportar_sql()
