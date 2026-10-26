// Catalogo de missoes educacionais taticas em 4 niveis de complexidade
export const MISSOES_ORBITAIS = [
  // Nivel 1: Reconhecimento Tatico (Cores e Categorias)
  {
    id: 'n1_detrito',
    nivel: 1,
    nivelRotulo: 'Nível 1',
    titulo: 'Rastrear Detrito',
    descricao: 'Inspecione qualquer detrito espacial (ponto vermelho no radar).',
    tempoSegundos: 30,
    dica: 'Ative o filtro "Detritos Espaciais" ou clique em um ponto vermelho no radar.',
    explicacaoConclusao: 'Detrito identificado: fragmento inerte viajando em alta velocidade sem controle.',
    verificar: ({ satSelecionado }) => {
      if (!satSelecionado) return false;
      return Number(satSelecionado.categoria_id) === 3;
    }
  },
  {
    id: 'n1_foguete',
    nivel: 1,
    nivelRotulo: 'Nível 1',
    titulo: 'Massa Inerte em Órbita',
    descricao: 'Localize um corpo de foguete descartado (estágio superior).',
    tempoSegundos: 35,
    dica: 'Ative o filtro "Corpos de Foguetes" (pontos roxos no radar).',
    explicacaoConclusao: 'Estágio de foguete localizado: massa inerte propensa a fragmentação.',
    verificar: ({ satSelecionado }) => {
      if (!satSelecionado) return false;
      return Number(satSelecionado.categoria_id) === 5;
    }
  },
  {
    id: 'n1_inativo',
    nivel: 1,
    nivelRotulo: 'Nível 1',
    titulo: 'Satélite Fantasma',
    descricao: 'Encontre um satélite inativo que perdeu comunicação com a Terra.',
    tempoSegundos: 35,
    dica: 'Use o filtro "Satélites Inativos" (pontos amarelos ou laranjas).',
    explicacaoConclusao: 'Satélite inativo confirmado: sem capacidade de manobra evasiva.',
    verificar: ({ satSelecionado }) => {
      if (!satSelecionado) return false;
      return Number(satSelecionado.categoria_id) === 2;
    }
  },
  {
    id: 'n1_estacao',
    nivel: 1,
    nivelRotulo: 'Nível 1',
    titulo: 'Presença Humana',
    descricao: 'Inspecione uma Estação Espacial tripulada em órbita baixa.',
    tempoSegundos: 40,
    dica: 'Clique no filtro "Estações Espaciais" no painel esquerdo para isolar a ISS ou Tiangong.',
    explicacaoConclusao: 'Estação identificada: complexo habitado sob monitoramento constante de colisão.',
    verificar: ({ satSelecionado }) => {
      if (!satSelecionado) return false;
      return Number(satSelecionado.categoria_id) === 4;
    }
  },

  // Nivel 2: Astrodinamica e Regimes Orbitais
  {
    id: 'n2_kessler',
    nivel: 2,
    nivelRotulo: 'Nível 2',
    titulo: 'Zona Crítica de Kessler',
    descricao: 'Inspecione um objeto na faixa crítica de Kessler (750 km a 950 km).',
    tempoSegundos: 60,
    dica: 'Filtre a camada "LEO" e procure objetos logo acima da atmosfera.',
    explicacaoConclusao: 'Altitude crítica verificada: maior densidade de cruzamentos orbitais.',
    verificar: ({ satSelecionado, parametrosOrbitaisSat }) => {
      if (!satSelecionado) return false;
      const alt = Number(parametrosOrbitaisSat?.altitudeInstantaneaKm || satSelecionado.perigeu_km || 0);
      return alt >= 750 && alt <= 950;
    }
  },
  {
    id: 'n2_geo_ativo',
    nivel: 2,
    nivelRotulo: 'Nível 2',
    titulo: 'Anel Geoestacionário',
    descricao: 'Localize um satélite ativo operando na faixa geoestacionária (~35.786 km).',
    tempoSegundos: 45,
    dica: 'Ative o filtro de camada "GEO" e o filtro "Satélites Ativos".',
    explicacaoConclusao: 'Satélite geoestacionário: período orbital sincronizado com o dia sideral da Terra.',
    verificar: ({ satSelecionado, parametrosOrbitaisSat }) => {
      if (!satSelecionado) return false;
      const regime = parametrosOrbitaisSat?.regimeCodigo || satSelecionado.regime;
      const catId = Number(satSelecionado.categoria_id);
      return regime === 'GEO' && catId === 1;
    }
  },
  {
    id: 'n2_cemiterio',
    nivel: 2,
    nivelRotulo: 'Nível 2',
    titulo: 'Órbita Cemitério',
    descricao: 'Encontre um satélite inativo descartado na Órbita Cemitério (acima de GEO).',
    tempoSegundos: 50,
    dica: 'Combine os filtros "Satélites Inativos" e a camada "GEO".',
    explicacaoConclusao: 'Descarte confirmado: satélite movido para além de 36.000 km para desobstruir o anel GEO.',
    verificar: ({ satSelecionado, parametrosOrbitaisSat }) => {
      if (!satSelecionado) return false;
      const regime = parametrosOrbitaisSat?.regimeCodigo || satSelecionado.regime;
      const catId = Number(satSelecionado.categoria_id);
      return regime === 'GEO' && catId === 2;
    }
  },
  {
    id: 'n2_eliptico',
    nivel: 2,
    nivelRotulo: 'Nível 2',
    titulo: 'Cruzador Elíptico',
    descricao: 'Inspecione um corpo de foguete ou satélite em Órbita Altamente Elíptica (HEO).',
    tempoSegundos: 45,
    dica: 'Clique na camada "HEO" no painel esquerdo para isolar órbitas alongadas.',
    explicacaoConclusao: 'Órbita elíptica detectada: grande variação entre apogeu e perigeu.',
    verificar: ({ satSelecionado, parametrosOrbitaisSat }) => {
      if (!satSelecionado) return false;
      const regime = parametrosOrbitaisSat?.regimeCodigo || satSelecionado.regime;
      return regime === 'HEO';
    }
  },
  {
    id: 'n2_meo',
    nivel: 2,
    nivelRotulo: 'Nível 2',
    titulo: 'Corredor de Navegação',
    descricao: 'Localize um satélite na Órbita Média (2.000 km a 35.786 km).',
    tempoSegundos: 45,
    dica: 'Selecione a camada orbital "MEO" no painel esquerdo.',
    explicacaoConclusao: 'Corredor MEO confirmado: altitude intermediária típica de frotas de navegação.',
    verificar: ({ satSelecionado, parametrosOrbitaisSat }) => {
      if (!satSelecionado) return false;
      const regime = parametrosOrbitaisSat?.regimeCodigo || satSelecionado.regime;
      return regime === 'MEO';
    }
  },

  // Nivel 3: Caca Historica e Soberania Nacional
  {
    id: 'n3_amazonia',
    nivel: 3,
    nivelRotulo: 'Nível 3',
    titulo: 'Guardião da Amazônia',
    descricao: 'Localize o satélite brasileiro Amazonia-1 ou CBERS-4A do INPE.',
    tempoSegundos: 60,
    dica: 'Use a barra de busca no topo e digite "AMAZONIA" ou "CBERS".',
    explicacaoConclusao: 'Satélite de sensoriamento remoto nacional: monitoramento ambiental brasileiro.',
    verificar: ({ satSelecionado }) => {
      if (!satSelecionado) return false;
      const nome = satSelecionado.nome || '';
      return /AMAZONIA-1|CBERS-4A|CBERS 4A/i.test(nome);
    }
  },
  {
    id: 'n3_scd',
    nivel: 3,
    nivelRotulo: 'Nível 3',
    titulo: 'Longevidade Brasileira',
    descricao: 'Encontre o SCD-1 (1993) ou SCD-2 (1998), satélites históricos do Brasil.',
    tempoSegundos: 60,
    dica: 'Digite "SCD" na barra de busca no topo direito da tela.',
    explicacaoConclusao: 'Marco aeroespacial brasileiro: décadas de operação contínua em órbita.',
    verificar: ({ satSelecionado }) => {
      if (!satSelecionado) return false;
      const nome = satSelecionado.nome || '';
      return /SCD-1|SCD-2|SCD 1|SCD 2/i.test(nome);
    }
  },
  {
    id: 'n3_colisao2009',
    nivel: 3,
    nivelRotulo: 'Nível 3',
    titulo: 'Cicatrização de Impacto',
    descricao: 'Inspecione um fragmento da colisão histórica entre Iridium 33 e Cosmos 2251.',
    tempoSegundos: 60,
    dica: 'Busque por "IRIDIUM 33 DEB" ou "COSMOS 2251 DEB" na busca superior.',
    explicacaoConclusao: 'Detrito do impacto de 2009: fragmentação que gerou milhares de alvos rastreados.',
    verificar: ({ satSelecionado }) => {
      if (!satSelecionado) return false;
      const nome = satSelecionado.nome || '';
      const catId = Number(satSelecionado.categoria_id);
      return (/IRIDIUM 33/i.test(nome) || /COSMOS 2251/i.test(nome)) && catId === 3;
    }
  },
  {
    id: 'n3_asat2007',
    nivel: 3,
    nivelRotulo: 'Nível 3',
    titulo: 'Vestígio de Teste ASAT',
    descricao: 'Rastreie um detrito gerado pelo teste antissatélite do Fengyun-1C.',
    tempoSegundos: 60,
    dica: 'Pesquise "FENGYUN 1C" na barra de busca ou filtre Detritos em LEO.',
    explicacaoConclusao: 'Fragmento ASAT: um dos maiores eventos de geração de detritos da história.',
    verificar: ({ satSelecionado }) => {
      if (!satSelecionado) return false;
      const nome = satSelecionado.nome || '';
      const catId = Number(satSelecionado.categoria_id);
      return /FENGYUN 1C/i.test(nome) && catId === 3;
    }
  },
  {
    id: 'n3_vanguard1',
    nivel: 3,
    nivelRotulo: 'Nível 3',
    titulo: 'O Mais Antigo no Espaço',
    descricao: 'Localize o Vanguard 1 (1958), o artefato humano mais antigo ainda em órbita.',
    tempoSegundos: 75,
    dica: 'Digite "VANGUARD" ou o ID "5" na caixa de pesquisa.',
    explicacaoConclusao: 'Vanguard 1 identificado: relíquia orbital em rota estável há mais de 6 décadas.',
    verificar: ({ satSelecionado }) => {
      if (!satSelecionado) return false;
      const norad = String(satSelecionado.norad_id);
      const nome = satSelecionado.nome || '';
      return norad === '5' || /VANGUARD 1/i.test(nome);
    }
  },

  // Nivel 4: Sustentabilidade e Reentrada Atmosferica
  {
    id: 'n4_reentrada',
    nivel: 4,
    nivelRotulo: 'Nível 4',
    titulo: 'Alerta de Reentrada',
    descricao: 'Inspecione qualquer objeto em órbita muito baixa (< 400 km) com alto arrasto.',
    tempoSegundos: 45,
    dica: 'Aproxime o zoom da Terra ou filtre Estações / LEO.',
    explicacaoConclusao: 'Alta desaceleração atmosférica: perda progressiva de altitude rumo à queima natural.',
    verificar: ({ satSelecionado, parametrosOrbitaisSat }) => {
      if (!satSelecionado) return false;
      const alt = Number(parametrosOrbitaisSat?.altitudeInstantaneaKm || satSelecionado.perigeu_km || 0);
      return alt > 0 && alt < 400;
    }
  },
  {
    id: 'n4_regra25',
    nivel: 4,
    nivelRotulo: 'Nível 4',
    titulo: 'Auditoria dos 25 Anos',
    descricao: 'Inspecione um detrito ou satélite inativo abandonado acima de 800 km.',
    tempoSegundos: 50,
    dica: 'Filtre "Detritos Espaciais" ou "Inativos" e selecione um objeto acima de 800 km.',
    explicacaoConclusao: 'Não conformidade normativa: acima de 800 km o decaimento natural excede 25 anos.',
    verificar: ({ satSelecionado, parametrosOrbitaisSat }) => {
      if (!satSelecionado) return false;
      const catId = Number(satSelecionado.categoria_id);
      const alt = Number(parametrosOrbitaisSat?.altitudeInstantaneaKm || satSelecionado.perigeu_km || 0);
      return (catId === 2 || catId === 3) && alt > 800;
    }
  }
];

// Sorteia proxima missao sem repeticao na sessao atual
export function sortearProximaMissao(historicoIds = []) {
  const naoJogadas = MISSOES_ORBITAIS.filter(m => !historicoIds.includes(m.id));
  const pool = naoJogadas.length > 0 ? naoJogadas : MISSOES_ORBITAIS;
  const escolhida = pool[Math.floor(Math.random() * pool.length)] || MISSOES_ORBITAIS[0];
  return {
    ...escolhida,
    timestampInicio: Date.now()
  };
}
