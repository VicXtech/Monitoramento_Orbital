/**
 * Catálogo e Mecanismo de Missões Educacionais Relâmpago — OrbitalED (Passo 2.2)
 * 
 * Implementa desafios didáticos com tempo limite (countdown) que surgem aleatoriamente
 * durante a exploração do simulador para testar e fixar conhecimentos de mecânica celeste
 * e sustentabilidade orbital.
 */

export const MISSOES_ORBITAIS = [
  {
    id: 'missao-localizar-detrito',
    titulo: 'Rastrear Detrito',
    descricao: 'Inspecione qualquer detrito espacial (ponto vermelho no radar).',
    tempoSegundos: 50,
    dica: 'Ative o filtro "Detritos" ou clique num ponto vermelho.',
    explicacaoConclusao: 'Detrito identificado: fragmento inerte viajando sem propulsão ou controle.',
    verificar: ({ satSelecionado }) => {
      if (!satSelecionado) return false;
      return Number(satSelecionado.categoria_id) === 3;
    }
  },
  {
    id: 'missao-localizar-iss',
    titulo: 'Localizar a ISS',
    descricao: 'Selecione a Estação Espacial Internacional (ISS) no simulador.',
    tempoSegundos: 45,
    dica: 'Pesquise "ISS" ou "#25544" na busca.',
    explicacaoConclusao: 'ISS localizada: grande área de superfície exige manobras periódicas de desvio.',
    verificar: ({ satSelecionado }) => {
      if (!satSelecionado) return false;
      return String(satSelecionado.norad_id) === '25544';
    }
  },
  {
    id: 'missao-satelite-brasileiro',
    titulo: 'Satélite Brasileiro',
    descricao: 'Encontre um satélite brasileiro (Amazonia-1 ou SCD-1).',
    tempoSegundos: 50,
    dica: 'Pesquise "Amazonia-1" ou "SCD-1" na busca.',
    explicacaoConclusao: 'Satélite nacional localizado: missão vital do INPE para o Brasil.',
    verificar: ({ satSelecionado }) => {
      if (!satSelecionado) return false;
      const norad = String(satSelecionado.norad_id);
      const pais = String(satSelecionado.pais || '').toLowerCase();
      return norad === '54380' || norad === '22823' || pais.includes('brasil') || pais.includes('brazil');
    }
  },
  {
    id: 'missao-auditar-inativo',
    titulo: 'Satélite Inativo',
    descricao: 'Selecione um satélite inativo (ponto laranja) e verifique seu impacto.',
    tempoSegundos: 55,
    dica: 'Filtre por inativos e abra a aba Impacto.',
    explicacaoConclusao: 'Satélite inativo: abandono sem desorbitagem aumenta o risco de colisões.',
    verificar: ({ satSelecionado }) => {
      if (!satSelecionado) return false;
      return Number(satSelecionado.categoria_id) === 2;
    }
  },
  {
    id: 'missao-orbita-geo',
    titulo: 'Órbita GEO',
    descricao: 'Localize um satélite na órbita geoestacionária (>35.000 km).',
    tempoSegundos: 55,
    dica: 'Afaste o zoom até o anel externo a 36.000 km.',
    explicacaoConclusao: 'Órbita GEO confirmada: velocidade angular igual à rotação da Terra.',
    verificar: ({ parametrosOrbitaisSat }) => {
      if (!parametrosOrbitaisSat) return false;
      return (
        parametrosOrbitaisSat.regimeCodigo === 'GEO' ||
        parametrosOrbitaisSat.altitudeInstantaneaKm >= 35000
      );
    }
  }
];

/**
 * Retorna uma missão aleatória diferente da última executada.
 * @param {string|null} missaoAnteriorId - ID da missão anterior para evitar repetição imediata
 * @returns {object} Missão selecionada
 */
export function sortearMissaoRelampago(missaoAnteriorId = null) {
  const disponiveis = MISSOES_ORBITAIS.filter(m => m.id !== missaoAnteriorId);
  const escolhida = disponiveis[Math.floor(Math.random() * disponiveis.length)] || MISSOES_ORBITAIS[0];
  return {
    ...escolhida,
    timestampInicio: Date.now()
  };
}
