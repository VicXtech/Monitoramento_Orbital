import { obterDadosAno } from './orbitalTimeline';

export const RAIO_TERRA_METROS = 6371000;

export const DEFINICOES_AREAS_ORBITAIS = [
  {
    id: 'leo',
    sigla: 'LEO',
    nome: 'Órbita Baixa (LEO)',
    faixaAltitudeKm: [160, 2000],
    faixaFormatada: '160 km – 2.000 km',
    corPadrao: '#00f0ff',
    fracaoObjetos: 0.84,
    cameraDestino: { lat: 25, lon: -40, alt: 7500000 },
    subdivisoes: [
      {
        nome: 'VLEO (160–400 km)',
        descricao: 'Satélites de observação e teste de reentrada.'
      },
      {
        nome: 'LEO Comercial (400–1.000 km)',
        descricao: 'Megaconstelações Starlink e estações espaciais.'
      },
      {
        nome: 'LEO Superior (1.000–2.000 km)',
        descricao: 'Cargas científicas e estágios de foguetes descartados.'
      }
    ]
  },
  {
    id: 'meo',
    sigla: 'MEO',
    nome: 'Órbita Média (MEO)',
    faixaAltitudeKm: [2000, 35500],
    faixaFormatada: '2.000 km – 35.500 km',
    corPadrao: '#38bdf8',
    fracaoObjetos: 0.02,
    cameraDestino: { lat: 20, lon: -40, alt: 48000000 },
    subdivisoes: [
      {
        nome: 'MEO Inferior (2.000–10.000 km)',
        descricao: 'Cinturão de radiação e constelações O3b.'
      },
      {
        nome: 'MEO Central (19.000–24.000 km)',
        descricao: 'Frotas de navegação GPS, Galileo e GLONASS.'
      },
      {
        nome: 'MEO Superior (24.000–35.500 km)',
        descricao: 'Rotas de transição e cargas governamentais.'
      }
    ]
  },
  {
    id: 'geo',
    sigla: 'GEO',
    nome: 'Órbita Geoestacionária (GEO)',
    faixaAltitudeKm: [35500, 36100],
    faixaFormatada: '35.786 km fixos',
    corPadrao: '#818cf8',
    fracaoObjetos: 0.09,
    cameraDestino: { lat: 0, lon: -45, alt: 85000000 },
    subdivisoes: [
      {
        nome: 'GEO Inclinada (35.786 km)',
        descricao: 'Satélites antigos com deriva norte-sul.'
      },
      {
        nome: 'Anel Ativo (35.786 km)',
        descricao: 'Satélites fixos de telecomunicação e meteorologia.'
      },
      {
        nome: 'Órbita Cemitério (+300 km)',
        descricao: 'Zona de descarte de satélites desativados.'
      }
    ]
  },
  {
    id: 'heo',
    sigla: 'HEO',
    nome: 'Altamente Elíptica (HEO)',
    faixaAltitudeKm: [500, 40000],
    faixaFormatada: 'Rotas Ovais',
    corPadrao: '#c084fc',
    fracaoObjetos: 0.05,
    cameraDestino: { lat: 45, lon: 20, alt: 60000000 },
    subdivisoes: [
      {
        nome: 'GTO',
        descricao: 'Rota de transferência elíptica de lançadores para GEO.'
      },
      {
        nome: 'Molniya',
        descricao: 'Órbita oval com alta permanência sobre o hemisfério norte.'
      },
      {
        nome: 'Tundra',
        descricao: 'Órbita elíptica sincronizada de 24h para cobertura polar.'
      }
    ]
  }
];

export function calcularMetricasArea(areaId, ano = 2026) {
  const area = DEFINICOES_AREAS_ORBITAIS.find((a) => a.id === areaId) || DEFINICOES_AREAS_ORBITAIS[0];
  const dadosAno = obterDadosAno(ano);
  const totalAno = dadosAno.totalObjetos;

  const totalObjetosArea = Math.max(1, Math.round(totalAno * area.fracaoObjetos));
  const taxaAtivosPct = dadosAno.satelitesAtivosPct;
  const taxaDetritosPct = dadosAno.detritosPct;
  const ativosArea = Math.round(totalObjetosArea * (taxaAtivosPct / 100));
  const detritosArea = totalObjetosArea - ativosArea;

  return {
    ...area,
    ano,
    totalObjetos: totalObjetosArea,
    ativosArea,
    detritosArea,
    taxaAtivosPct,
    taxaDetritosPct,
    fonteDados: 'ESA Space Environment Report & CelesTrak',
    classificacaoDado: 'Observado e Calculado'
  };
}
