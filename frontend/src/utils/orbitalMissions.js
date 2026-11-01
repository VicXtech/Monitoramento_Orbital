// Catalogo de missoes educacionais taticas em 4 niveis de complexidade
export const MISSOES_ORBITAIS = [
  // Nivel 1: Reconhecimento Tatico (Cores e Categorias)
  {
    id: 'n1_detrito',
    nivel: 1,
    nivelRotulo: 'Nível 1',
    titulo: 'Rastrear Detrito',
    descricao: 'Inspecione qualquer detrito espacial marcado em vermelho no radar.',
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
    descricao: 'Localize um corpo de foguete descartado como estágio superior.',
    tempoSegundos: 35,
    dica: 'Ative o filtro "Corpos de Foguetes" com pontos roxos no radar.',
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
    dica: 'Use o filtro "Satélites Inativos" com pontos amarelos ou laranjas.',
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
  {
    id: 'n1_salto_tempo',
    nivel: 1,
    nivelRotulo: 'Nível 1',
    titulo: 'Salto no Tempo',
    descricao: 'Acelere a simulação para 60x ou 300x no controle de tempo.',
    tempoSegundos: 35,
    dica: 'Clique no botão 60x ou 300x no painel esquerdo.',
    explicacaoConclusao: 'Tempo acelerado: os cálculos do SGP4 propagam as posições em velocidade elevada.',
    verificar: ({ multiplicadorTempo }) => {
      return multiplicadorTempo >= 60;
    }
  },
  {
    id: 'n1_capacidade_maxima',
    nivel: 1,
    nivelRotulo: 'Nível 1',
    titulo: 'Capacidade Máxima',
    descricao: 'Alterne a amostragem do catálogo para Expandida com 10.000 objetos.',
    tempoSegundos: 35,
    dica: 'Clique em "EXPANDIDA 10.000" no painel esquerdo.',
    explicacaoConclusao: 'Densidade expandida ativada: 10.000 alvos simultâneos renderizados com alta performance.',
    verificar: ({ densidadeCatalogo }) => {
      return densidadeCatalogo === 'completo';
    }
  },

  // Nivel 2: Astrodinamica e Regimes Orbitais
  {
    id: 'n2_isolar_camada',
    nivel: 2,
    nivelRotulo: 'Nível 2',
    titulo: 'Isolar Camada',
    descricao: 'Isole uma camada orbital clicando em LEO, MEO, GEO ou HEO no painel esquerdo.',
    tempoSegundos: 45,
    dica: 'Clique em uma das barras de regime no painel esquerdo.',
    explicacaoConclusao: 'Camada isolada: apenas os objetos correspondentes à faixa selecionada são exibidos.',
    verificar: ({ regimeAtivo }) => {
      return Boolean(regimeAtivo);
    }
  },
  {
    id: 'n2_kessler',
    nivel: 2,
    nivelRotulo: 'Nível 2',
    titulo: 'Zona Crítica de Kessler',
    descricao: 'Inspecione um objeto na faixa crítica de Kessler entre 750 km e 950 km.',
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
    descricao: 'Localize um satélite ativo operando na faixa geoestacionária a ~35.786 km.',
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
    id: 'n2_eliptico',
    nivel: 2,
    nivelRotulo: 'Nível 2',
    titulo: 'Cruzador Elíptico',
    descricao: 'Inspecione um corpo de foguete ou satélite em Órbita Altamente Elíptica HEO.',
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
    descricao: 'Localize um satélite na Órbita Média entre 2.000 km e 35.786 km.',
    tempoSegundos: 45,
    dica: 'Selecione a camada orbital "MEO" no painel esquerdo.',
    explicacaoConclusao: 'Corredor MEO confirmado: altitude intermediária típica de frotas de navegação.',
    verificar: ({ satSelecionado, parametrosOrbitaisSat }) => {
      if (!satSelecionado) return false;
      const regime = parametrosOrbitaisSat?.regimeCodigo || satSelecionado.regime;
      return regime === 'MEO';
    }
  },

  // Nivel 3: Caca Historica, Recursos e Soberania Nacional
  {
    id: 'n3_soberania_brasil',
    nivel: 3,
    nivelRotulo: 'Nível 3',
    titulo: 'Soberania Brasileira',
    descricao: 'Localize qualquer satélite nacional como Amazonia-1, CBERS ou SCD.',
    tempoSegundos: 60,
    dica: 'Pesquise "AMAZONIA", "CBERS" ou "SCD" na busca.',
    explicacaoConclusao: 'Satélite brasileiro identificado: monitoramento ambiental e pioneirismo nacional.',
    verificar: ({ satSelecionado }) => {
      if (!satSelecionado) return false;
      const nome = satSelecionado.nome || '';
      return /AMAZONIA|CBERS|SCD/i.test(nome);
    }
  },
  {
    id: 'n3_fragmentacao',
    nivel: 3,
    nivelRotulo: 'Nível 3',
    titulo: 'Fragmentação Histórica',
    descricao: 'Rastreie um detrito da colisão Iridium 33 ou do teste Fengyun-1C.',
    tempoSegundos: 60,
    dica: 'Busque "IRIDIUM 33 DEB" ou "FENGYUN 1C" na pesquisa.',
    explicacaoConclusao: 'Detrito de impacto histórico localizado: evidência de fragmentações críticas em órbita.',
    verificar: ({ satSelecionado }) => {
      if (!satSelecionado) return false;
      const nome = satSelecionado.nome || '';
      const catId = Number(satSelecionado.categoria_id);
      return (/IRIDIUM 33/i.test(nome) || /COSMOS 2251/i.test(nome) || /FENGYUN 1C/i.test(nome)) && catId === 3;
    }
  },
  {
    id: 'n3_modulos_estacao',
    nivel: 3,
    nivelRotulo: 'Nível 3',
    titulo: 'Módulos Acoplados',
    descricao: 'Selecione a ISS ou Tiangong e inspecione uma das naves acopladas.',
    tempoSegundos: 50,
    dica: 'Filtre Estações e clique em uma nave na lista de acoplados.',
    explicacaoConclusao: 'Nave acoplada inspecionada: ecossistema logístico da estação espacial confirmado.',
    verificar: ({ satSelecionado }) => {
      if (!satSelecionado) return false;
      return Boolean(satSelecionado.estacao_pai_norad);
    }
  },
  {
    id: 'n3_vanguard1',
    nivel: 3,
    nivelRotulo: 'Nível 3',
    titulo: 'O Mais Antigo no Espaço',
    descricao: 'Localize o Vanguard 1 de 1958, o artefato humano mais antigo ainda em órbita.',
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
  {
    id: 'n3_eventos_aneis',
    nivel: 3,
    nivelRotulo: 'Nível 3',
    titulo: 'Eventos nos Anéis',
    descricao: 'Acesse o Modo Orbital e clique em um marcador de evento nos anéis.',
    tempoSegundos: 50,
    dica: 'Clique em MODO ORBITAL no topo e selecione um evento nos anéis.',
    explicacaoConclusao: 'Evento histórico nos anéis inspecionado: contexto aeroespacial verificado.',
    verificar: ({ modoOrbitalAtivo, pinoOrbitalAtivo }) => {
      return Boolean(modoOrbitalAtivo && pinoOrbitalAtivo);
    }
  },

  // Nivel 4: Sustentabilidade, Auditoria e Diagnostico
  {
    id: 'n4_auditoria',
    nivel: 4,
    nivelRotulo: 'Nível 4',
    titulo: 'Auditoria de Conformidade',
    descricao: 'Inspecione um objeto e abra a aba AUDITORIA no painel direito.',
    tempoSegundos: 45,
    dica: 'Selecione um satélite e clique na aba AUDITORIA.',
    explicacaoConclusao: 'Auditoria SIO consultada: pontuação de sustentabilidade e tempo de decaimento verificados.',
    verificar: ({ satSelecionado, abaDetalheAtiva, satNoradNoInicio, abaNoInicio }) => {
      if (!satSelecionado || abaDetalheAtiva !== 'auditoria') return false;
      // Impede auto-completar instantâneo se a missão iniciou já com este mesmo satélite e aba abertos
      if (abaNoInicio === 'auditoria' && satNoradNoInicio === satSelecionado.norad_id) {
        return false;
      }
      return true;
    }
  },
  {
    id: 'n4_registro',
    nivel: 4,
    nivelRotulo: 'Nível 4',
    titulo: 'Registro e Performance',
    descricao: 'Abra a aba REGISTRO no painel direito para auditar telemetria e motor.',
    tempoSegundos: 45,
    dica: 'Selecione um satélite e clique na aba REGISTRO.',
    explicacaoConclusao: 'Ficha técnica e telemetria de performance do motor verificadas com sucesso.',
    verificar: ({ satSelecionado, abaDetalheAtiva, satNoradNoInicio, abaNoInicio }) => {
      if (!satSelecionado || abaDetalheAtiva !== 'registro') return false;
      if (abaNoInicio === 'registro' && satNoradNoInicio === satSelecionado.norad_id) {
        return false;
      }
      return true;
    }
  },
  {
    id: 'n4_reentrada',
    nivel: 4,
    nivelRotulo: 'Nível 4',
    titulo: 'Alerta de Reentrada',
    descricao: 'Inspecione qualquer objeto em órbita muito baixa abaixo de 400 km com alto arrasto.',
    tempoSegundos: 45,
    dica: 'Aproxime o zoom da Terra ou filtre Estações / LEO.',
    explicacaoConclusao: 'Alta desaceleração atmosférica: perda progressiva de altitude rumo à queima natural.',
    verificar: ({ satSelecionado, parametrosOrbitaisSat }) => {
      if (!satSelecionado) return false;
      const alt = Number(parametrosOrbitaisSat?.altitudeInstantaneaKm || satSelecionado.perigeu_km || 0);
      return alt > 0 && alt < 400;
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
