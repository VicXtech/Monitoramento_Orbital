const NOMES_CATEGORIAS = {
  1: 'Satélite Ativo',
  2: 'Satélite Inativo',
  3: 'Detrito Espacial',
  4: 'Estação Espacial',
  5: 'Corpo de Foguete'
};

// Converte resposta compacta do endpoint de radar para objetos completos
export function expandirObjetosRadar(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || payload.v !== 1 || !Array.isArray(payload.items)) {
    return [];
  }

  return payload.items.map((item) => {
    const [norad_id, nome, categoria_id, regime, pais, linha1, linha2, omm] = item;
    return {
      norad_id,
      nome,
      categoria_id,
      categoria: {
        id: categoria_id,
        nome: NOMES_CATEGORIAS[categoria_id] || 'Satélite'
      },
      regime,
      pais,
      ultimo_tle: linha1 && linha2 ? { linha1, linha2 } : null,
      omm: omm || null
    };
  });
}
