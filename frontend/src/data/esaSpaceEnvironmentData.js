/**
 * Dados e séries históricas consolidadas da Agência Espacial Europeia (ESA)
 * Fonte: ESA Space Environment Report (2024–2026) e Space Debris User Portal (SDUP)
 */

// Série histórica anual oficial do ambiente orbital (1957 a 2026)
export const SERIE_HISTORICA_ESA = [
  {
    ano: 1957,
    rotulo: '1957',
    evento: 'Sputnik 1 e primeiro estágio em órbita',
    cargasAtivas: 1,
    cargasInativas: 0,
    corposFoguete: 1,
    detritos: 0,
    totalCatalogado: 2,
    reentradasAcumuladas: 0,
    fonte: 'ESA Space Environment Report 2024'
  },
  {
    ano: 1965,
    rotulo: '1965',
    evento: 'Início das telecomunicações comerciais (Intelsat I)',
    cargasAtivas: 120,
    cargasInativas: 80,
    corposFoguete: 210,
    detritos: 390,
    totalCatalogado: 800,
    reentradasAcumuladas: 240,
    fonte: 'ESA Space Environment Report 2024'
  },
  {
    ano: 1970,
    rotulo: '1970',
    evento: 'Primeiras fragmentações em órbita registradas',
    cargasAtivas: 250,
    cargasInativas: 210,
    corposFoguete: 450,
    detritos: 1190,
    totalCatalogado: 2100,
    reentradasAcumuladas: 850,
    fonte: 'ESA Space Environment Report 2024'
  },
  {
    ano: 1980,
    rotulo: '1980',
    evento: 'Expansão de sistemas meteorológicos e de navegação',
    cargasAtivas: 380,
    cargasInativas: 520,
    corposFoguete: 900,
    detritos: 2800,
    totalCatalogado: 4600,
    reentradasAcumuladas: 3200,
    fonte: 'ESA Space Environment Report 2024'
  },
  {
    ano: 1990,
    rotulo: '1990',
    evento: 'Telescópio Hubble e expansão de frotas comerciais',
    cargasAtivas: 510,
    cargasInativas: 980,
    corposFoguete: 1350,
    detritos: 4260,
    totalCatalogado: 7100,
    reentradasAcumuladas: 6400,
    fonte: 'ESA Space Environment Report 2024'
  },
  {
    ano: 1996,
    rotulo: '1996',
    evento: 'Colisão do microssatélite Cerise com fragmento de foguete Ariane',
    cargasAtivas: 620,
    cargasInativas: 1240,
    corposFoguete: 1510,
    detritos: 4830,
    totalCatalogado: 8200,
    reentradasAcumuladas: 8100,
    fonte: 'ESA Space Environment Report 2024'
  },
  {
    ano: 2000,
    rotulo: '2000',
    evento: 'Início da ocupação contínua da Estação Espacial Internacional (ISS)',
    cargasAtivas: 780,
    cargasInativas: 1480,
    corposFoguete: 1680,
    detritos: 4960,
    totalCatalogado: 8900,
    reentradasAcumuladas: 9800,
    fonte: 'ESA Space Environment Report 2024'
  },
  {
    ano: 2002,
    rotulo: '2002',
    evento: 'Publicação das diretrizes de mitigação do IADC (regra dos 25 anos)',
    cargasAtivas: 850,
    cargasInativas: 1620,
    corposFoguete: 1750,
    detritos: 5280,
    totalCatalogado: 9500,
    reentradasAcumuladas: 10900,
    fonte: 'ESA Space Environment Report 2024'
  },
  {
    ano: 2007,
    rotulo: '2007',
    evento: 'Teste antissatélite Fengyun-1C a 865 km de altitude',
    cargasAtivas: 990,
    cargasInativas: 1850,
    corposFoguete: 1870,
    detritos: 7790,
    totalCatalogado: 12500,
    reentradasAcumuladas: 13200,
    fonte: 'ESA Space Environment Report 2024'
  },
  {
    ano: 2009,
    rotulo: '2009',
    evento: 'Colisão Iridium 33 com Cosmos 2251 a 789 km de altitude',
    cargasAtivas: 1080,
    cargasInativas: 1980,
    corposFoguete: 1940,
    detritos: 9800,
    totalCatalogado: 14800,
    reentradasAcumuladas: 14500,
    fonte: 'ESA Space Environment Report 2024'
  },
  {
    ano: 2015,
    rotulo: '2015',
    evento: 'Adoção crescente de propulsão elétrica e padronização CubeSat',
    cargasAtivas: 1420,
    cargasInativas: 2310,
    corposFoguete: 2080,
    detritos: 11690,
    totalCatalogado: 17500,
    reentradasAcumuladas: 18200,
    fonte: 'ESA Space Environment Report 2024'
  },
  {
    ano: 2020,
    rotulo: '2020',
    evento: 'Início dos lançamentos em escala de megaconstelações comerciais',
    cargasAtivas: 3370,
    cargasInativas: 2780,
    corposFoguete: 2190,
    detritos: 12660,
    totalCatalogado: 21000,
    reentradasAcumuladas: 21800,
    fonte: 'ESA Space Environment Report 2024'
  },
  {
    ano: 2021,
    rotulo: '2021',
    evento: 'Teste antissatélite Cosmos 1408 a 480 km de altitude',
    cargasAtivas: 4850,
    cargasInativas: 2920,
    corposFoguete: 2240,
    detritos: 14490,
    totalCatalogado: 24500,
    reentradasAcumuladas: 23400,
    fonte: 'ESA Space Environment Report 2024'
  },
  {
    ano: 2024,
    rotulo: '2024',
    evento: 'Reentrada assistida do satélite europeu Salsa (missão Cluster)',
    cargasAtivas: 9200,
    cargasInativas: 3100,
    corposFoguete: 2310,
    detritos: 13390,
    totalCatalogado: 28000,
    reentradasAcumuladas: 27100,
    fonte: 'ESA Space Environment Report 2024'
  },
  {
    ano: 2026,
    rotulo: '2026',
    evento: 'Censo atual do catálogo orbital oficial',
    cargasAtivas: 10500,
    cargasInativas: 3250,
    corposFoguete: 2340,
    detritos: 13410,
    totalCatalogado: 29500,
    reentradasAcumuladas: 28600,
    fonte: 'ESA Space Environment Report 2026 / CelesTrak'
  }
];

// Distribuição oficial de objetos por camadas orbitais conforme a ESA
export const DISTRIBUICAO_CAMADAS_ESA = {
  leo: {
    id: 'leo',
    sigla: 'LEO',
    nome: 'Órbita Baixa',
    faixaKm: '160 km a 2.000 km',
    proporcaoTotalPct: 84.0,
    funcaoPrincipal: 'Observação da Terra, megaconstelações e estações espaciais',
    fenomenoAmbiental: 'Zona de maior densidade de tráfego e concentração de detritos de colisões',
    fonte: 'ESA Space Environment Report'
  },
  meo: {
    id: 'meo',
    sigla: 'MEO',
    nome: 'Órbita Média',
    faixaKm: '2.000 km a 35.500 km',
    proporcaoTotalPct: 2.0,
    funcaoPrincipal: 'Constelações de navegação global por satélite (GPS, Galileo, GLONASS)',
    fenomenoAmbiental: 'Ambiente de baixa densidade espacial cruzado por cinturões de radiação',
    fonte: 'ESA Space Environment Report'
  },
  geo: {
    id: 'geo',
    sigla: 'GEO',
    nome: 'Órbita Geoestacionária',
    faixaKm: '35.786 km fixos',
    proporcaoTotalPct: 9.0,
    funcaoPrincipal: 'Telecomunicações e meteorologia com período de 24 horas',
    fenomenoAmbiental: 'Anel equatorial protegido com zona de descarte em órbita cemitério (+300 km)',
    fonte: 'ESA Space Environment Report'
  },
  heo: {
    id: 'heo',
    sigla: 'HEO',
    nome: 'Órbita Altamente Elíptica',
    faixaKm: 'Perigeu rasante a apogeu elevado',
    proporcaoTotalPct: 5.0,
    funcaoPrincipal: 'Cobertura de altas latitudes e órbitas de transferência (GTO)',
    fenomenoAmbiental: 'Trajetórias alongadas que cruzam múltiplas camadas orbitais',
    fonte: 'ESA Space Environment Report'
  }
};

// Eventos históricos documentados com fontes oficiais e coordenadas 3D
export const EVENTOS_HISTORICOS_ESA = [
  {
    id: 'cerise-1996',
    ano: 1996,
    data: '1996-07-24',
    nome: 'Colisão Cerise',
    objetos: 'Cerise (França) × Estágio Ariane (França)',
    altitudeKm: 675,
    posicao: { lat: 45.0, lon: 15.0, altMetros: 675000 },
    causa: 'Primeira colisão documentada entre satélite operacional e detrito catalogado',
    fragmentosGerados: 1,
    consequencias: 'Mastro do satélite Cerise amputado pelo impacto em velocidade orbital',
    fonteOficial: 'NASA ODPO / ESA SDUP'
  },
  {
    id: 'fengyun-2007',
    ano: 2007,
    data: '2007-01-11',
    nome: 'Teste ASAT Fengyun-1C',
    objetos: 'Fengyun-1C (China) × Projétil Cinético',
    altitudeKm: 865,
    posicao: { lat: 35.0, lon: 102.0, altMetros: 865000 },
    causa: 'Destruição deliberada por teste cinético antissatélite',
    fragmentosGerados: 3540,
    consequencias: 'Maior nuvem de detritos já criada na órbita baixa da Terra',
    fonteOficial: 'NASA ODPO / ESA Space Environment Report'
  },
  {
    id: 'iridium-cosmos-2009',
    ano: 2009,
    data: '2009-02-10',
    nome: 'Colisão Iridium 33 × Cosmos 2251',
    objetos: 'Iridium 33 (EUA, ativo) × Cosmos 2251 (Rússia, inativo)',
    altitudeKm: 789,
    posicao: { lat: 72.5, lon: 97.0, altMetros: 789000 },
    causa: 'Colisão acidental a 11,7 km/s entre satélite operacional e carcaça inativa',
    fragmentosGerados: 2300,
    consequencias: 'Dispersão maciça de fragmentos em múltiplas órbitas com necessidade de manobras de desvio contínuas',
    fonteOficial: 'NASA ODPO / ESA SDUP'
  },
  {
    id: 'cosmos1408-2021',
    ano: 2021,
    data: '2021-11-15',
    nome: 'Teste ASAT Cosmos 1408',
    objetos: 'Cosmos 1408 (Rússia, inativo) × Míssil DA-ASAT',
    altitudeKm: 480,
    posicao: { lat: 55.0, lon: 45.0, altMetros: 480000 },
    causa: 'Destruição militar de satélite desativado por teste cinético',
    fragmentosGerados: 1780,
    consequencias: 'Fragmentos cruzaram as altitudes da ISS e Tiangong',
    fonteOficial: 'USSPACECOM / ESA Space Debris Office'
  },
  {
    id: 'salsa-2024',
    ano: 2024,
    data: '2024-09-08',
    nome: 'Reentrada Guiada do Satélite Salsa',
    objetos: 'Salsa (Cluster 2 - ESA)',
    altitudeKm: 120,
    posicao: { lat: -45.0, lon: -125.0, altMetros: 120000 },
    causa: 'Fim de missão com reentrada direcionada no Pacífico Sul',
    fragmentosGerados: 0,
    consequencias: 'Demonstração de reentrada controlada segura e minimização de riscos no solo',
    fonteOficial: 'ESA Operations / Clean Space Initiative'
  }
];
