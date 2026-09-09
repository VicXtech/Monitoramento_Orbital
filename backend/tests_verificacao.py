import httpx
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_suite():
    client = httpx.Client(base_url=BASE_URL, timeout=30.0)
    print("=== INICIANDO SUÍTE DE TESTES E VALIDAÇÃO ORBITAL ===\n")

    # 1. Health check
    print("1. Testando /health...")
    r = client.get("/health")
    assert r.status_code == 200, f"Health check falhou: {r.text}"
    assert r.json().get("database") == "connected"
    print("   [OK] Backend e Banco de Dados 100% online.\n")

    # 2. Estatísticas Oficiais do Catálogo
    print("2. Testando /api/estatisticas...")
    r = client.get("/api/estatisticas")
    assert r.status_code == 200, f"Erro /api/estatisticas: {r.text}"
    stats = r.json()
    assert stats["total_objetos"] == 34104, f"Total incorreto: {stats['total_objetos']}"
    totais = stats.get("totais_oficiais", {})
    assert totais.get("ativos") == 16503
    assert totais.get("inativos") == 2782
    assert totais.get("foguetes") == 2295
    assert totais.get("detritos") == 12522
    assert totais.get("estacoes") == 2
    print("   [OK] Estatísticas e totais oficiais de catálogo conferem: 34.104 objetos (16.503 ativos, 2.782 inativos, 2.295 foguetes, 12.522 detritos, 2 estações).\n")

    # 3. Radar Padrão (1.000 amostragem + 2 estações fixas = 1.002 objetos)
    print("3. Testando /api/objetos com as 4 categorias ativas (1, 2, 5, 3)...")
    r = client.get("/api/objetos?limit=1000&categoria_ids=1,2,5,3")
    assert r.status_code == 200
    objs = r.json()
    assert len(objs) == 1002, f"Esperado 1002 objetos no radar, retornado: {len(objs)}"
    norads = {o["norad_id"] for o in objs}
    assert "25544" in norads, "ISS (25544) não encontrada no radar!"
    assert "48274" in norads, "Tiangong (48274) não encontrada no radar!"

    # Contagem por categoria no radar
    cat_counts = {}
    for o in objs:
        cid = o.get("categoria_id")
        cat_counts[cid] = cat_counts.get(cid, 0) + 1
    print(f"   [OK] Retornados exatamente 1.002 objetos. Distribuição no radar: {cat_counts}\n")

    # 4. Amostragem Redistributiva (Desativando Satélites Ativos - categoria 1)
    print("4. Testando Amostragem Redistributiva (Categorias 2, 5, 3 - sem ativos)...")
    r = client.get("/api/objetos?limit=1000&categoria_ids=2,5,3")
    assert r.status_code == 200
    objs_sem_ativos = r.json()
    assert len(objs_sem_ativos) == 1002, f"Esperado 1002 objetos redistribuídos, retornado: {len(objs_sem_ativos)}"
    assert not any(o["categoria_id"] == 1 for o in objs_sem_ativos), "Não deveria conter objetos da categoria 1!"
    print("   [OK] Amostragem redistribuiu automaticamente vagas ociosas preenchendo o limite com 1.002 objetos.\n")

    # 5. Todas as categorias do radar desativadas (categoria_ids=none)
    print("5. Testando todas categorias desativadas (categoria_ids=none)...")
    r = client.get("/api/objetos?limit=1000&categoria_ids=none")
    assert r.status_code == 200
    objs_none = r.json()
    assert len(objs_none) == 2, f"Esperado apenas as 2 estações permanentes, retornado: {len(objs_none)}"
    assert {o["norad_id"] for o in objs_none} == {"25544", "48274"}
    print("   [OK] Apenas as 2 estações espaciais permanentes (ISS e Tiangong) são retornadas.\n")

    # 6. Módulos acoplados da ISS (25544)
    print("6. Testando /api/estacoes/25544/modulos (ISS)...")
    r = client.get("/api/estacoes/25544/modulos")
    assert r.status_code == 200
    modulos_iss = r.json()
    assert len(modulos_iss) >= 10, f"Esperado pelo menos 10 módulos acoplados na ISS, retornado: {len(modulos_iss)}"
    nomes_iss = [m["nome"] for m in modulos_iss]
    print(f"   [OK] ISS possui {len(modulos_iss)} módulos/naves acopladas: {nomes_iss[:4]}...\n")

    # 7. Módulos acoplados da Tiangong (48274)
    print("7. Testando /api/estacoes/48274/modulos (Tiangong)...")
    r = client.get("/api/estacoes/48274/modulos")
    assert r.status_code == 200
    modulos_tian = r.json()
    assert len(modulos_tian) >= 4, f"Esperado pelo menos 4 módulos na Tiangong, retornado: {len(modulos_tian)}"
    nomes_tian = [m["nome"] for m in modulos_tian]
    print(f"   [OK] Tiangong possui {len(modulos_tian)} módulos/naves acopladas: {nomes_tian}\n")

    # 8. Ficha Factual Enriquecida da ISS (Tier 1 Wikidata)
    print("8. Testando dados enriquecidos da ISS (Wikidata)...")
    r = client.get("/api/objetos/25544")
    assert r.status_code == 200
    iss = r.json()
    assert iss["missao"] is not None
    assert iss["missao"]["imagem_url"] is not None, "ISS sem foto da Wikimedia!"
    assert "http" in iss["missao"]["imagem_url"]
    assert iss["missao"]["massa_kg"] and iss["missao"]["massa_kg"] > 400000
    print(f"   [OK] ISS enriquecida: Operador={iss['missao']['operador']}, Massa={iss['missao']['massa_kg']}kg, Imagem={iss['missao']['imagem_url'][:50]}...\n")

    # 9. Ficha Factual de Corpo de Foguete (Categoria 5 - Tier 3 Engenharia Aeroespacial)
    print("9. Testando enriquecimento de Corpo de Foguete (Categoria 5)...")
    r = client.get("/api/objetos?limit=5&categoria_ids=5")
    assert r.status_code == 200
    foguetes = [o for o in r.json() if o["categoria_id"] == 5]
    assert len(foguetes) > 0
    foguete = foguetes[0]
    assert foguete["missao"] is not None
    assert len(foguete["missao"]["descricao"]) > 20
    print(f"   [OK] Foguete '{foguete['nome']}': {foguete['missao']['descricao'][:80]}...\n")

    # 10. Ficha Factual de Detrito Espacial (Categoria 3 - Tier 3 Diagnóstico de Fragmentação)
    print("10. Testando enriquecimento de Detrito Espacial (Categoria 3)...")
    r = client.get("/api/objetos?limit=5&categoria_ids=3")
    assert r.status_code == 200
    detritos = [o for o in r.json() if o["categoria_id"] == 3]
    assert len(detritos) > 0
    detrito = detritos[0]
    assert detrito["missao"] is not None
    assert len(detrito["missao"]["descricao"]) > 20
    print(f"   [OK] Detrito '{detrito['nome']}': {detrito['missao']['descricao'][:80]}...\n")

    print("=== TODOS OS 10 TESTES PASSARAM COM 100% DE SUCESSO! ===")

if __name__ == "__main__":
    test_suite()
