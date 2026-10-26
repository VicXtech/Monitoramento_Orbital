// Catalogo de dados oficiais do Modo Orbital Figurativo
// Fontes: ESA Space Environment Report, NASA ODPO e INPE

export const CAMADAS_ORBITAIS = {
  leo: {
    id: 'leo',
    nome: 'Órbita Terrestre Baixa',
    sigla: 'LEO',
    cor: '#00f0ff',
    altitude: '160 a 2.000 km',
    catalogoPct: '~84%',
    risco: 'Crítico',
    velocidade: '~7,8 km/s',
    periodo: '90 a 120 min',
    subregioes: [
      {
        nome: 'VLEO (160 - 450 km)',
        desc: 'Zona das Estações Espaciais (ISS e Tiangong) e satélites de observação em altíssima resolução.',
        satelites: 'ISS, Tiangong'
      },
      {
        nome: 'Megaconstelações (500 - 600 km)',
        desc: 'Frotas de telecomunicações de banda larga em grande escala e alta densidade operacional.',
        satelites: 'Starlink, OneWeb'
      },
      {
        nome: 'Heliossíncrona SSO (600 - 900 km)',
        desc: 'Órbita com passagem no mesmo horário solar local para monitoramento climático e florestal.',
        satelites: 'CBERS-4A, Amazonia-1'
      },
      {
        nome: 'Faixa Crítica (750 - 950 km)',
        desc: 'Pico histórico de detritos espaciais decorrentes de fragmentações e colisões passadas.',
        satelites: 'Fragmentos históricos'
      }
    ],
    sustentabilidade: {
      impactos: [
        'Cascata de colisões em cadeia pela Síndrome de Kessler com risco de perda de faixas orbitais.',
        'Queima diária de satélites descartados liberando óxidos metálicos na estratosfera.'
      ],
      mitigacoes: [
        'Redução do prazo de desorbitagem pós-missão de 25 para 5 anos pela FCC e IADC.',
        'Diretriz Zero Debris da ESA com meta de impacto líquido nulo no espaço até 2030.'
      ]
    },
    pinosRelacionados: ['iridium-cosmos-2009', 'fengyun-2007', 'inpe-brasil-1993', 'cerise-1996']
  },
  meo: {
    id: 'meo',
    nome: 'Órbita Terrestre Média',
    sigla: 'MEO',
    cor: '#0066ff',
    altitude: '2.000 a 35.786 km',
    catalogoPct: '~2%',
    risco: 'Moderado',
    velocidade: '~3,9 km/s',
    periodo: '~12 horas',
    subregioes: [
      {
        nome: 'Cinturões de Radiação',
        desc: 'Zonas de prótons e elétrons aprisionados pelo campo magnético da Terra.',
        satelites: 'Cinturões Van Allen'
      },
      {
        nome: 'Corredor GNSS (19.100 - 23.222 km)',
        desc: 'Constelações mundiais de navegação, posicionamento por satélite e sincronismo temporal.',
        satelites: 'GPS, Galileo, GLONASS, BeiDou'
      }
    ],
    sustentabilidade: {
      impactos: [
        'Ausência de arrasto atmosférico natural; qualquer objeto abandonado permanece por milênios.',
        'Radiação contínua causa degradação eletrônica com risco de fragmentação de baterias.'
      ],
      mitigacoes: [
        'Alocação dos satélites aposentados em órbitas tampão acima e abaixo dos corredores GNSS.',
        'Passivação energética rigorosa com dreno de baterias e tanques de propelente.'
      ]
    },
    pinosRelacionados: ['vanguard-1958']
  },
  geo: {
    id: 'geo',
    nome: 'Órbita Geoestacionária',
    sigla: 'GEO',
    cor: '#a855f7',
    altitude: '35.786 km fixos',
    catalogoPct: '~9%',
    risco: 'Crítico',
    velocidade: '~3,07 km/s',
    periodo: '23h 56m 04s',
    subregioes: [
      {
        nome: 'Anel Operacional',
        desc: 'Satélites de telecomunicações de grande porte, meteorologia contínua e defesa nacional.',
        satelites: 'SGDC, GOES, Meteosat'
      },
      {
        nome: 'Slots Orbitais',
        desc: 'Posições equatoriais rigorosamente alocadas pela UIT para evitar interferências eletromagnéticas.',
        satelites: 'Vagas da ONU / UIT'
      },
      {
        nome: 'Super-GEO (+300 km)',
        desc: 'Faixa cemitério de descarte definitivo situada acima do anel geoestacionário.',
        satelites: 'Satélites aposentados'
      }
    ],
    sustentabilidade: {
      impactos: [
        'Escassez de recurso natural finito; satélites inativos à deriva viram zumbis sem controle.',
        'Risco de colapso de infraestruturas críticas terrestres de comunicação e clima.'
      ],
      mitigacoes: [
        'Manobra obrigatória de elevação para a órbita cemitério pelo cálculo do IADC.',
        'Veículos robóticos de acoplamento e extensão de vida útil (MEV).'
      ]
    },
    pinosRelacionados: []
  },
  heo: {
    id: 'heo',
    nome: 'Órbita Altamente Elíptica',
    sigla: 'HEO',
    cor: '#e879f9',
    altitude: 'Perigeu rasante a apogeu > 40.000 km',
    catalogoPct: '~5%',
    risco: 'Elevado',
    velocidade: '~10 km/s a ~1,5 km/s',
    periodo: 'Variável (~12 horas)',
    subregioes: [
      {
        nome: 'Transferência GTO',
        desc: 'Corredor de transição onde operam e são descartados estágios superiores de foguetes.',
        satelites: 'Corpos de foguetes'
      },
      {
        nome: 'Órbitas Molniya e Tundra',
        desc: 'Inclinação de 63,4 graus para comunicação contínua nas regiões de altas latitudes polares.',
        satelites: 'Molniya, Tundra'
      },
      {
        nome: 'Observatórios Científicos',
        desc: 'Telescópios espaciais para monitoramento da magnetosfera e radiação solar profunda.',
        satelites: 'Salsa, Cluster'
      }
    ],
    sustentabilidade: {
      impactos: [
        'Efeito cruzamento que atravessa LEO, MEO e GEO em altíssima velocidade relativa.',
        'Reentradas atmosféricas descontroladas de grandes massas metálicas com risco ao solo.'
      ],
      mitigacoes: [
        'Reentradas guiadas e controladas mirando o Ponto Nemo no Pacífico Sul.',
        'Queimas extras de desorbitagem ativa do estágio de foguete logo após a separação.'
      ]
    },
    pinosRelacionados: ['salsa-cluster-2024']
  }
};

export const PINOS_HISTORICOS = [
  {
    id: 'iridium-cosmos-2009',
    ano: 2009,
    nome: 'Colisão Iridium 33 e Cosmos 2251',
    localNome: 'Sibéria, Rússia',
    posicao: { lat: 72.5, lon: 97.0, altKm: 789 },
    camadaId: 'leo',
    fatoTecnico: 'Hipercolisão acidental a 11,7 km/s entre satélite operacional e carcaça inativa, gerando mais de 2.000 detritos catalogados.',
    licaoSustentabilidade: 'Provou que satélites inativos são fontes de fragmentação irreversível que exigem alerta contínuo de conjunção.'
  },
  {
    id: 'fengyun-2007',
    ano: 2007,
    nome: 'Teste ASAT Fengyun-1C',
    localNome: 'China Central',
    posicao: { lat: 35.0, lon: 102.0, altKm: 865 },
    camadaId: 'leo',
    fatoTecnico: 'Destruição deliberada por projétil cinético em LEO alta, gerando mais de 3.500 fragmentos rastreáveis no radar.',
    licaoSustentabilidade: 'Em altitudes elevadas os fragmentos permanecem em órbita por séculos, impulsionando a moratória internacional de testes ASAT.'
  },
  {
    id: 'salsa-cluster-2024',
    ano: 2024,
    nome: 'Reentrada do Satélite Salsa',
    localNome: 'Ponto Nemo, Pacífico Sul',
    posicao: { lat: -45.0, lon: -125.0, altKm: 120 },
    camadaId: 'heo',
    fatoTecnico: 'Primeira reentrada guiada de satélite europeu em órbita altamente elíptica direcionada para a área de descarte oceânico.',
    licaoSustentabilidade: 'Marco do Zero Debris Charter da ESA demonstrando a eliminação de riscos de queda de destroços em solo povoado.'
  },
  {
    id: 'inpe-brasil-1993',
    ano: 1993,
    nome: 'Pioneirismo SCD-1 e Monitoramento INPE',
    localNome: 'Alcântara / Amazônia, Brasil',
    posicao: { lat: -2.3, lon: -44.4, altKm: 750 },
    camadaId: 'leo',
    fatoTecnico: 'SCD-1 superou em 30 vezes sua vida útil projetada de 1 ano; CBERS-4A e Amazonia-1 monitoram a floresta em tempo real.',
    licaoSustentabilidade: 'Demonstra a dependência direta da preservação orbital para o acompanhamento climático e combate ao desmatamento.'
  },
  {
    id: 'cerise-1996',
    ano: 1996,
    nome: 'Impacto no Satélite Cerise',
    localNome: 'Europa / Atlântico',
    posicao: { lat: 45.0, lon: 15.0, altKm: 666 },
    camadaId: 'leo',
    fatoTecnico: 'Primeira colisão histórica confirmada entre satélite operacional e detrito catalogado de foguete Ariane.',
    licaoSustentabilidade: 'Alerta mundial para as agências sobre o perigo de explosões espontâneas de estágios superiores abandonados.'
  },
  {
    id: 'vanguard-1958',
    ano: 1958,
    nome: 'Vanguard 1 em Órbita',
    localNome: 'Cabo Canaveral, EUA',
    posicao: { lat: 28.5, lon: -80.5, altKm: 650 },
    camadaId: 'meo',
    fatoTecnico: 'Objeto humano mais antigo ainda no espaço; perdeu comunicação em 1964 mas permanecerá em órbita por séculos.',
    licaoSustentabilidade: 'Símbolo da permanência de satélites desprovidos de mecanismos ativos de desorbitagem controlada.'
  }
];

export function obterCamadaOrbital(id) {
  if (!id) return null;
  return CAMADAS_ORBITAIS[id.toLowerCase()] || null;
}

export function obterPinoHistorico(id) {
  if (!id) return null;
  return PINOS_HISTORICOS.find(p => p.id === id) || null;
}

export function listarPinosPorCamada(camadaId) {
  if (!camadaId) return PINOS_HISTORICOS;
  return PINOS_HISTORICOS.filter(p => p.camadaId.toLowerCase() === camadaId.toLowerCase());
}
