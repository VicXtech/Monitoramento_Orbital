// Catalogo de dados oficiais do Modo Orbital Figurativo
// Fontes: ESA Space Environment Report, NASA ODPO e INPE

export const CAMADAS_ORBITAIS = {
  leo: {
    id: 'leo',
    nome: 'Órbita Terrestre Baixa',
    sigla: 'LEO',
    cor: '#38BDF8',
    altitudeCurta: '160 a 2.000 km',
    altitudeSub: 'Regime de alta densidade',
    trafegoGlobal: '~84% do total',
    trafegoSub: 'Fonte: Catálogo ESA',
    risco: 'Crítico',
    velocidadeFicha: '~7,8 km/s',
    velocidadeSub: 'Velocidade constante rápida',
    periodoFicha: '90 a 120 min',
    periodoSub: '14 a 16 voltas diárias',
    subregioes: [
      {
        nome: 'VLEO (160 - 450 km)',
        desc: 'Zona das Estações Espaciais e satélites de observação em altíssima resolução.',
        trafego: 'Estações ISS e Tiangong'
      },
      {
        nome: 'Megaconstelações (500 - 600 km)',
        desc: 'Frotas de telecomunicações de banda larga em grande escala e alta densidade operacional.',
        trafego: 'Satélites Starlink, OneWeb'
      },
      {
        nome: 'Heliossíncrona SSO (600 - 900 km)',
        desc: 'Passa sempre no mesmo horário solar local para monitoramento climático e florestal.',
        trafego: 'Satélites CBERS-4A, Amazonia-1'
      },
      {
        nome: 'Zona Crítica (750 - 950 km)',
        desc: 'Pico histórico de detritos espaciais decorrentes de fragmentações e colisões passadas.',
        trafego: 'Fragmentos de colisões'
      }
    ],
    termometroAmbiental: [
      { rotulo: 'Limpeza Natural (Ar)', valor: '5 a 100+ anos', pct: 45, nivel: 'medio', detalhe: 'Depende da altitude' },
      { rotulo: 'Risco Cascata (Kessler)', valor: 'EXTREMO', pct: 95, nivel: 'critico', detalhe: '84% do lixo espacial' },
      { rotulo: 'Poluição na Atmosfera', valor: 'ALTA', pct: 85, nivel: 'critico', detalhe: 'Queima diária de metais' }
    ],
    matrizImpacto: {
      espaco: {
        titulo: 'NO ESPAÇO',
        subtitulo: 'Síndrome de Kessler (1978)',
        desc: 'Colisões a até 14 km/s geram nuvens de estilhaços que ameaçam o acesso humano contínuo ao espaço.',
        consequencia: 'Inutilização de rotas orbitais'
      },
      terra: {
        titulo: 'NO PLANETA TERRA',
        subtitulo: 'Poluição na Estratosfera (PNAS)',
        desc: 'Queima diária de megaconstelações despeja óxidos de alumínio, cobre e lítio que atacam o ozônio.',
        consequencia: 'Dano químico e perda de serviços vitais'
      }
    },
    acoesNormas: [
      { badge: 'FCC 22-103', titulo: 'Regra dos 5 Anos', desc: 'Desorbitagem mandatória em até 5 anos após o término da missão.' },
      { badge: 'ESA Zero Debris', titulo: 'Remoção Ativa (ADR)', desc: 'Garras robóticas e redes (como ClearSpace-1) para capturar sucatas grandes.' },
      { badge: 'Engenharia Verde', titulo: 'Satélites Limpos', desc: 'Pesquisa com ligas ecológicas e satélites de madeira para eliminar fumaça tóxica.' }
    ],
    velocimetro: {
      velocidadeKmS: 7.8,
      multiplicador: '30x mais rápido que o avião',
      duracaoSegundos: 0.8
    },
    radarCobertura: {
      tipo: 'polar',
      rotulo: 'Órbita Polar / SSO',
      desc: 'Varredura diária de polo a polo sobre o Brasil.'
    },
    corteAtmosfera: {
      tipo: 'quimica',
      badgeCurta: 'ATMOSFERA',
      rotulo: 'Vaporização Química (PNAS)',
      desc: 'Alumínio e lítio retidos na camada de ozônio.',
      particulas: ['Óxido de Alumínio', 'Lítio e Cobre']
    },
    camaraDensidade: {
      rotulo: '84% do catálogo',
      alerta: 'Risco Crítico de Conjunção',
      nivel: 'critico',
      particulasCount: 20
    },
    impactoCotidiano: [
      { titulo: 'Monitoramento Florestal', desc: 'Alertas diários de desmatamento pelo INPE.' },
      { titulo: 'Previsão Meteorológica', desc: 'Rastreamento de frentes frias e temporais.' },
      { titulo: 'Internet em Áreas Remotas', desc: 'Conexão de baixa latência para o interior.' }
    ],
    pinosRelacionados: ['iridium-cosmos-2009', 'fengyun-2007', 'inpe-brasil-1993', 'cerise-1996']
  },
  meo: {
    id: 'meo',
    nome: 'Órbita Terrestre Média',
    sigla: 'MEO',
    cor: '#5B8DEF',
    altitudeCurta: '2.000 a 35.786 km',
    altitudeSub: 'Corredores de navegação global',
    trafegoGlobal: '~2% do total',
    trafegoSub: 'Fonte: Catálogo ESA',
    risco: 'Moderado',
    velocidadeFicha: '~3,9 km/s',
    velocidadeSub: 'Velocidade orbital intermediária',
    periodoFicha: '~12 horas',
    periodoSub: '2 voltas por dia',
    subregioes: [
      {
        nome: 'Cinturões de Radiação',
        desc: 'Zonas de prótons e elétrons aprisionados pelo campo magnético da Terra.',
        trafego: 'Cinturões Van Allen'
      },
      {
        nome: 'Corredor GNSS (19.100 - 23.222 km)',
        desc: 'Constelações mundiais de navegação, posicionamento por satélite e sincronismo temporal.',
        trafego: 'Constelações GPS, Galileo, GLONASS, BeiDou'
      }
    ],
    termometroAmbiental: [
      { rotulo: 'Limpeza Natural (Ar)', valor: 'Milênios', pct: 95, nivel: 'critico', detalhe: 'Sem ar para frear' },
      { rotulo: 'Risco Cascata (Kessler)', valor: 'BAIXO', pct: 20, nivel: 'baixo', detalhe: '2% do tráfego global' },
      { rotulo: 'Poluição na Atmosfera', valor: 'NULA', pct: 5, nivel: 'baixo', detalhe: 'Não reentra na Terra' }
    ],
    matrizImpacto: {
      espaco: {
        titulo: 'NO ESPAÇO',
        subtitulo: 'Contaminação de Corredor',
        desc: 'Explosões de baterias antigas por radiação dos Cinturões de Van Allen ameaçam as frotas de posicionamento.',
        consequencia: 'Paralisia de frotas de navegação GNSS'
      },
      terra: {
        titulo: 'NO PLANETA TERRA',
        subtitulo: 'Dependência de Navegação',
        desc: 'A perda dessa faixa paralisaria aviação comercial, rotas marítimas e sincronismo de redes bancárias.',
        consequencia: 'Blecaute em aviação, bancos e defesa'
      }
    },
    acoesNormas: [
      { badge: 'IADC', titulo: 'Órbitas Tampão', desc: 'Alocação de satélites aposentados em zonas seguras fora dos corredores GNSS.' },
      { badge: 'Diretriz', titulo: 'Passivação de Energia', desc: 'Dreno obrigatório de baterias e despressurização de tanques para evitar fragmentação.' }
    ],
    velocimetro: {
      velocidadeKmS: 3.9,
      multiplicador: '15x mais rápido que o avião',
      duracaoSegundos: 1.6
    },
    radarCobertura: {
      tipo: 'constelacao',
      rotulo: 'Constelação GNSS',
      desc: 'Triangulação de múltiplos feixes sobre a Terra.'
    },
    corteAtmosfera: {
      tipo: 'sem_reentrada',
      badgeCurta: 'CEMITÉRIO',
      rotulo: 'Sem Reentrada Natural',
      desc: 'Permanência milenar ou elevação para órbita cemitério.',
      particulas: ['Sem atrito de ar', 'Permanência secular']
    },
    camaraDensidade: {
      rotulo: '2% do catálogo',
      alerta: 'Tráfego Disperso e Seguro',
      nivel: 'baixo',
      particulasCount: 4
    },
    impactoCotidiano: [
      { titulo: 'Navegação GPS', desc: 'Posicionamento para trânsito e aviação civil.' },
      { titulo: 'Sincronismo Bancário', desc: 'Validação de horário de transações financeiras.' },
      { titulo: 'Resgate e Emergência', desc: 'Sinal de socorro marítimo e aéreo mundial.' }
    ],
    pinosRelacionados: ['vanguard-1958']
  },
  geo: {
    id: 'geo',
    nome: 'Órbita Geoestacionária',
    sigla: 'GEO',
    cor: '#7C69EF',
    altitudeCurta: '35.786 km fixos',
    altitudeSub: 'Anel equatorial sincronizado',
    trafegoGlobal: '~9% do total',
    trafegoSub: 'Fonte: Catálogo ESA',
    risco: 'Crítico',
    velocidadeFicha: '~3,07 km/s',
    velocidadeSub: 'Sincronizada à rotação da Terra',
    periodoFicha: '23h 56m 04s',
    periodoSub: '1 volta por dia sideral',
    subregioes: [
      {
        nome: 'Anel Operacional',
        desc: 'Satélites de telecomunicações de grande porte, meteorologia contínua e defesa nacional.',
        trafego: 'Satélites SGDC, GOES, Meteosat'
      },
      {
        nome: 'Slots Orbitais (UIT)',
        desc: 'Posições equatoriais rigorosamente alocadas pela ONU/UIT para prevenir interferências.',
        trafego: 'Vagas alocadas da UIT'
      },
      {
        nome: 'Super-GEO (+300 km)',
        desc: 'Faixa cemitério de descarte definitivo situada acima do anel geoestacionário.',
        trafego: 'Satélites aposentados'
      }
    ],
    termometroAmbiental: [
      { rotulo: 'Limpeza Natural (Ar)', valor: 'Eterno', pct: 100, nivel: 'critico', detalhe: 'Impossível cair sozinho' },
      { rotulo: 'Risco Cascata (Kessler)', valor: 'ALTO', pct: 75, nivel: 'medio', detalhe: 'Vagas orbitais limitadas' },
      { rotulo: 'Poluição na Atmosfera', valor: 'NULA', pct: 5, nivel: 'baixo', detalhe: 'Descarte em Super-GEO' }
    ],
    matrizImpacto: {
      espaco: {
        titulo: 'NO ESPAÇO',
        subtitulo: 'Satélites Zumbis',
        desc: 'Espaçonaves inativas sem controle derivam pelo anel equatorial, inutilizando slots valiosos para TV e dados.',
        consequencia: 'Bloqueio permanente de slots equatoriais'
      },
      terra: {
        titulo: 'NO PLANETA TERRA',
        subtitulo: 'Infraestrutura Crítica',
        desc: 'Perda de satélites GEO compromete monitoramento de furacões, previsão de tempo severo e canais de segurança.',
        consequencia: 'Perda de previsão de clima severo e defesa'
      }
    },
    acoesNormas: [
      { badge: 'IADC', titulo: 'Órbita Cemitério (+300 km)', desc: 'Reserva mandatória de combustível para elevação final para a faixa cemitério.' },
      { badge: 'Robótica MEV', titulo: 'Rebocadores Orbitais', desc: 'Veículos robóticos de acoplamento que estendem a operação de satélites em 5 a 10 anos.' }
    ],
    velocimetro: {
      velocidadeKmS: 3.07,
      multiplicador: '12x mais rápido que o avião',
      duracaoSegundos: 2.0
    },
    radarCobertura: {
      tipo: 'geo',
      rotulo: 'Anel Sincronizado',
      desc: 'Ponto fixo iluminando o mesmo continente.'
    },
    corteAtmosfera: {
      tipo: 'sem_reentrada',
      badgeCurta: 'CEMITÉRIO',
      rotulo: 'Sem Reentrada Natural',
      desc: 'Permanência milenar ou elevação para órbita cemitério.',
      particulas: ['Super-GEO (+300 km)', 'Órbita Cemitério']
    },
    camaraDensidade: {
      rotulo: '9% do catálogo',
      alerta: 'Faixa Linear Saturada',
      nivel: 'medio',
      particulasCount: 8
    },
    impactoCotidiano: [
      { titulo: 'Monitoramento de Furacões', desc: 'Imagens contínuas de tempestades e clima.' },
      { titulo: 'Comunicações Estratégicas', desc: 'Canais de dados seguros e defesa nacional.' },
      { titulo: 'Transmissão de Mídia', desc: 'Cobertura contínua de TV aberta e rádio.' }
    ],
    pinosRelacionados: []
  },
  heo: {
    id: 'heo',
    nome: 'Órbita Altamente Elíptica',
    sigla: 'HEO',
    cor: '#A864E8',
    altitudeCurta: '200 a 40.000+ km',
    altitudeSub: 'Órbita alongada de perigeu baixo',
    trafegoGlobal: '~5% do total',
    trafegoSub: 'Fonte: Catálogo ESA',
    risco: 'Elevado',
    velocidadeFicha: '1,5 a 10 km/s',
    velocidadeSub: 'Rápida no perigeu, lenta no apogeu',
    periodoFicha: 'Até 12 horas',
    periodoSub: 'Varia conforme a elipse',
    subregioes: [
      {
        nome: 'Transferência GTO',
        desc: 'Corredor de transição onde operam e são descartados estágios superiores de foguetes.',
        trafego: 'Estágios superiores de foguetes e satélites rumo a GEO'
      },
      {
        nome: 'Órbitas Molniya e Tundra',
        desc: 'Alta inclinação (63,4 graus) para comunicação e defesa nas altas latitudes polares.',
        trafego: 'Satélites de comunicação polar, defesa e meteorologia'
      },
      {
        nome: 'Observatórios Científicos',
        desc: 'Telescópios e sensores para monitoramento da magnetosfera e radiação profunda.',
        trafego: 'Satélites científicos Salsa e Cluster'
      }
    ],
    termometroAmbiental: [
      { rotulo: 'Limpeza Natural (Ar)', valor: 'Décadas a Séculos', pct: 70, nivel: 'medio', detalhe: 'Só freia no perigeu' },
      { rotulo: 'Risco Cascata (Kessler)', valor: 'ALTO', pct: 75, nivel: 'medio', detalhe: 'Cruza 3 regimes orbitais' },
      { rotulo: 'Risco ao Solo / Terra', valor: 'QUEDA DE ESTÁGIOS', pct: 70, nivel: 'medio', detalhe: 'Peças pesadas de titânio' }
    ],
    matrizImpacto: {
      espaco: {
        titulo: 'NO ESPAÇO',
        subtitulo: 'Efeito Cruzamento',
        desc: 'Estágios de foguetes em GTO cruzam LEO, MEO e GEO duas vezes por dia a velocidades de até 10 km/s.',
        consequencia: 'Risco de colisão cruzada a até 10 km/s'
      },
      terra: {
        titulo: 'NO PLANETA TERRA',
        subtitulo: 'Queda de Destroços Pesados',
        desc: 'Foguetes de várias toneladas em aço e titânio não fundem 100% no ar e oferecem risco ao solo e oceanos.',
        consequencia: 'Queda de tanques pesados e destroços de titânio'
      }
    },
    acoesNormas: [
      { badge: 'ESA 2024', titulo: 'Reentrada Guiada (Ponto Nemo)', desc: 'Manobras ativas para direcionar o mergulho de satélites para o cemitério oceânico desabitado.' },
      { badge: 'IADC', titulo: 'Passivação e Queima Final', desc: 'Esvaziamento de tanques e queima imediata de descarte do 2º estágio logo após a soltura da carga.' }
    ],
    velocimetro: {
      velocidadeKmS: 10.0,
      multiplicador: 'Até 40x mais rápido',
      duracaoSegundos: 0.6
    },
    radarCobertura: {
      tipo: 'eliptica',
      rotulo: 'Órbita Elíptica',
      desc: 'Apogeu lento no norte e perigeu rasante rápido.'
    },
    corteAtmosfera: {
      tipo: 'destrocos',
      badgeCurta: 'OCEANO',
      rotulo: 'Destroços no Solo / Mar',
      desc: 'Peças de titânio atingem o oceano no Ponto Nemo.',
      particulas: ['Titânio e Aço', 'Impacto Ponto Nemo']
    },
    camaraDensidade: {
      rotulo: '5% do catálogo',
      alerta: 'Cruzamento em Hipervelocidade',
      nivel: 'elevado',
      particulasCount: 6
    },
    impactoCotidiano: [
      { titulo: 'Comunicação Polar', desc: 'Conexão estável em rotas de voo árticas.' },
      { titulo: 'Clima Espacial', desc: 'Monitoramento de radiação e vento solar.' },
      { titulo: 'Pesquisa da Magnetosfera', desc: 'Sensores de plasma no espaço profundo.' }
    ],
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
