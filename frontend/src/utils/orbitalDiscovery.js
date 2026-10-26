/**
 * Catálogo e Motor de Descobertas Rápidas Orbitais (Passo 2.1 — Fase 2)
 * Fornece fatos científicos, eventos históricos e desafios interativos com ações diretas no simulador 3D.
 * Todas as informações são 100% verificáveis com dados de agências espaciais oficiais (INPE, NASA, ESA, IADC, ITU).
 */

export const GATILHOS_DESCOBERTA = [
  {
    id: 'colisao-cosmos-iridium',
    tipo: 'evento',
    tagTipo: 'HISTÓRICO',
    titulo: 'Colisão Cosmos-Iridium',
    icone: 'AlertTriangle',
    corIcone: 'var(--neon-red)',
    badgeRegime: 'LEO (789 km)',
    texto: 'Em 2009, choque entre satélites gerou mais de 2.000 fragmentos perigosos.',
    acaoLabel: 'Ver Detrito',
    alvoNorad: '33749',
    filtroCategorias: null
  },
  {
    id: 'amazonia-1-brasil',
    tipo: 'curiosidade',
    tagTipo: 'BRASIL',
    titulo: 'Amazonia-1 (INPE)',
    icone: 'Globe',
    corIcone: 'var(--neon-green)',
    badgeRegime: 'Polar (752 km)',
    texto: 'Primeiro satélite 100% projetado no Brasil para monitorar desmatamento e queimadas.',
    acaoLabel: 'Rastrear Satélite',
    alvoNorad: '54380',
    filtroCategorias: null
  },
  {
    id: 'densidade-leo',
    tipo: 'sustentabilidade',
    tagTipo: 'ALERTA',
    titulo: 'Congestionamento em LEO',
    icone: 'ShieldAlert',
    corIcone: 'var(--neon-cyan)',
    badgeRegime: 'LEO (< 2.000 km)',
    texto: 'Concentra 75% dos objetos a 27.000 km/h com risco constante de colisão.',
    acaoLabel: 'Ver Estação ISS',
    alvoNorad: '25544',
    filtroCategorias: null
  },
  {
    id: 'desafio-geo',
    tipo: 'desafio',
    tagTipo: 'ÓRBITA GEO',
    titulo: 'Cinturão Geoestacionário',
    icone: 'Compass',
    corIcone: 'var(--neon-amber)',
    badgeRegime: 'GEO (35.786 km)',
    texto: 'A 35.786 km, os satélites parecem imóveis no céu para antenas terrestres.',
    acaoLabel: 'Localizar GEO',
    acaoTipo: 'filtrar_geo',
    filtroCategorias: null
  },
  {
    id: 'scd-1-recordista',
    tipo: 'curiosidade',
    tagTipo: 'LONGEVIDADE',
    titulo: 'SCD-1 (Pioneiro)',
    icone: 'Sparkles',
    corIcone: 'var(--neon-green)',
    badgeRegime: 'LEO (750 km)',
    texto: 'Operando desde 1993, retransmite dados de centenas de plataformas ambientais brasileiras.',
    acaoLabel: 'Rastrear SCD-1',
    alvoNorad: '22823',
    filtroCategorias: null
  },
  {
    id: 'estagios-foguete-risco',
    tipo: 'sustentabilidade',
    tagTipo: 'RISCO',
    titulo: 'Corpos de Foguete',
    icone: 'Flame',
    corIcone: 'var(--neon-red)',
    badgeRegime: 'Estágios (R/B)',
    texto: 'Carcaças pesadas descartadas que podem explodir por pressão residual de tanques.',
    acaoLabel: 'Filtrar Foguetes',
    acaoTipo: 'filtrar_foguetes',
    filtroCategorias: { 1: false, 2: false, 3: false, 5: true }
  },
  {
    id: 'desafio-lixo-espacial',
    tipo: 'desafio',
    tagTipo: 'DETRITOS',
    titulo: 'Lixo em Órbita',
    icone: 'Target',
    corIcone: 'var(--neon-amber)',
    badgeRegime: 'Inertes',
    texto: 'Mais da metade dos objetos são restos inativos de missões passadas.',
    acaoLabel: 'Filtrar Detritos',
    acaoTipo: 'filtrar_detritos',
    filtroCategorias: { 1: false, 2: false, 3: true, 5: false }
  },
  {
    id: 'vanguard-1-antigo',
    tipo: 'sustentabilidade',
    tagTipo: 'HISTÓRICO',
    titulo: 'Vanguard 1 (1958)',
    icone: 'Clock',
    corIcone: 'var(--neon-cyan)',
    badgeRegime: 'LEO (650 × 3.800 km)',
    texto: 'Objeto artificial mais antigo em órbita; permanecerá séculos no espaço.',
    acaoLabel: 'Localizar Vanguard',
    alvoNorad: '00005',
    filtroCategorias: null
  }
];

/**
 * Retorna um gatilho aleatório ou por índice.
 */
export function obterGatilhoPorIndice(indice) {
  const mod = ((indice % GATILHOS_DESCOBERTA.length) + GATILHOS_DESCOBERTA.length) % GATILHOS_DESCOBERTA.length;
  return GATILHOS_DESCOBERTA[mod];
}
