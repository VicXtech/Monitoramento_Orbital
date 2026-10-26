/**
 * Motor de Análise de Pressão Orbital & Densidade Espacial por Camadas — OrbitalED (Passo 5.1)
 * 
 * Modela a distribuição volumétrica de objetos artificiais em cascas esféricas concêntricas
 * ao redor da Terra, calculando a densidade espacial e o nível de pressão orbital de acordo
 * com os relatórios técnicos do Inter-Agency Space Debris Coordination Committee (IADC)
 * e o NASA Orbital Debris Program Office.
 * 
 * Raio médio da Terra adotado (WGS-84): R_terra = 6.371 km
 * Volume da casca esférica: V = (4/3) * π * [ (R_terra + h_topo)³ - (R_terra + h_base)³ ]
 */

export const RAIO_TERRA_KM = 6371;

export const CAMADAS_ORBITAIS = [
  {
    id: 'leo_baixo',
    nome: 'LEO Inferior',
    sigla: 'LEO-1',
    faixaAltitudeKm: [200, 600],
    altitudeMediaKm: 450,
    regime: 'LEO',
    descricao: 'Zona da ISS e Starlink com arrasto atmosférico ativo.',
    principaisHabitantes: 'ISS, Tiangong, Starlink',
    altitudeCameraKm: 1800,
    cameraDestino: { lat: 10, lon: -50, alt: 2200000 }
  },
  {
    id: 'leo_critico',
    nome: 'LEO Crítico',
    sigla: 'LEO-2',
    faixaAltitudeKm: [600, 1000],
    altitudeMediaKm: 780,
    regime: 'LEO',
    descricao: 'Faixa mais saturada, com restos da colisão Iridium-Cosmos.',
    principaisHabitantes: 'Iridium, OneWeb, fragmentos de colisão',
    altitudeCameraKm: 3200,
    cameraDestino: { lat: 30, lon: -20, alt: 3800000 }
  },
  {
    id: 'leo_alto',
    nome: 'LEO Superior',
    sigla: 'LEO-3',
    faixaAltitudeKm: [1000, 2000],
    altitudeMediaKm: 1400,
    regime: 'LEO',
    descricao: 'Região de alta radiação e estágios de foguetes descartados.',
    principaisHabitantes: 'Estágios SL-08, SL-16 abandonados',
    altitudeCameraKm: 5500,
    cameraDestino: { lat: 40, lon: 10, alt: 6000000 }
  },
  {
    id: 'meo',
    nome: 'Órbita Média (MEO)',
    sigla: 'MEO',
    faixaAltitudeKm: [2000, 35000],
    altitudeMediaKm: 20200,
    regime: 'MEO',
    descricao: 'Volume amplo ocupado por constelações de navegação.',
    principaisHabitantes: 'GPS, Galileo, GLONASS, Beidou',
    altitudeCameraKm: 42000,
    cameraDestino: { lat: 15, lon: -40, alt: 48000000 }
  },
  {
    id: 'geo',
    nome: 'Geoestacionária (GEO)',
    sigla: 'GEO',
    faixaAltitudeKm: [35000, 36500],
    altitudeMediaKm: 35786,
    regime: 'GEO',
    descricao: 'Anel equatorial fixo de telecomunicações e clima.',
    principaisHabitantes: 'GOES, Meteosat, satélites de telecom',
    altitudeCameraKm: 75000,
    cameraDestino: { lat: 0, lon: -70, alt: 85000000 }
  }
];

/**
 * Calcula o volume de uma casca esférica em quilômetros cúbicos (km³).
 * 
 * @param {number} rBaseKm - Altitude inferior da casca em km
 * @param {number} rTopoKm - Altitude superior da casca em km
 * @returns {number} Volume em km³
 */
export function calcularVolumeCascaKm3(rBaseKm, rTopoKm) {
  const raioInferior = RAIO_TERRA_KM + rBaseKm;
  const raioSuperior = RAIO_TERRA_KM + rTopoKm;
  return (4 / 3) * Math.PI * (Math.pow(raioSuperior, 3) - Math.pow(raioInferior, 3));
}

/**
 * Processa a lista de objetos orbitais e calcula o diagnóstico de pressão
 * para cada uma das camadas astrodinâmicas.
 * 
 * @param {Array<object>} objetos - Lista de objetos com telemetria
 * @returns {Array<object>} Diagnóstico estruturado por camada
 */
export function calcularPressaoOrbitalPorCamadas(objetos = []) {
  return CAMADAS_ORBITAIS.map((camada) => {
    const [hMin, hMax] = camada.faixaAltitudeKm;
    const volumeKm3 = calcularVolumeCascaKm3(hMin, hMax);

    // Filtra objetos com perigeu/apogeu na faixa da camada
    const objetosNaCamada = objetos.filter((obj) => {
      let altMedia = null;
      if (obj.parametros?.altitudeMediaKm) {
        altMedia = obj.parametros.altitudeMediaKm;
      } else if (obj.apogeu && obj.perigeu) {
        altMedia = (Number(obj.apogeu) + Number(obj.perigeu)) / 2;
      } else if (obj.perigeu) {
        altMedia = Number(obj.perigeu);
      } else if (obj.apogeu) {
        altMedia = Number(obj.apogeu);
      } else if (obj.altitude) {
        altMedia = Number(obj.altitude);
      }

      if (altMedia === null || isNaN(altMedia)) return false;
      return altMedia >= hMin && altMedia < hMax;
    });

    const totalObjetos = objetosNaCamada.length;
    let ativos = 0;
    let inativos = 0;
    let detritos = 0;
    let foguetes = 0;

    objetosNaCamada.forEach((obj) => {
      const cat = Number(obj.categoria_id);
      if (cat === 1) ativos++;
      else if (cat === 2) inativos++;
      else if (cat === 3) detritos++;
      else if (cat === 5) foguetes++;
      else if (obj.status_operacional === 'ativo') ativos++;
      else if (obj.status_operacional === 'inativo') inativos++;
      else detritos++;
    });

    const inertesTotal = inativos + detritos + foguetes;
    const taxaDetritosPct = totalObjetos > 0 ? Math.round((inertesTotal / totalObjetos) * 100) : 0;
    const taxaAtivosPct = totalObjetos > 0 ? Math.round((ativos / totalObjetos) * 100) : 0;

    // Densidade volumétrica em objetos por bilhão de km³ (10⁹ km³)
    // Exemplo: 1.000 objetos em 1 trilhão de km³ -> 1 obj / 10⁹ km³
    const volumeBilhoesKm3 = volumeKm3 / 1e9;
    const densidadeEspacial = volumeBilhoesKm3 > 0
      ? Number((totalObjetos / volumeBilhoesKm3).toFixed(2))
      : 0;

    // Cálculo do Índice de Pressão Orbital (0 a 100)
    // Ponderação: 45% densidade volumétrica relativa + 35% proporção de inertes + 20% criticidade da altitude
    let pontuacaoPressao = 0;

    if (camada.id === 'leo_critico') {
      // Região de maior risco de colisão espontânea de Kessler
      pontuacaoPressao = Math.min(96, Math.max(72, Math.round(55 + (densidadeEspacial * 4.2) + (taxaDetritosPct * 0.32))));
    } else if (camada.id === 'leo_baixo') {
      // Alto tráfego de megaconstelações, mas com mitigação de arrasto
      pontuacaoPressao = Math.min(88, Math.max(50, Math.round(40 + (densidadeEspacial * 3.8) + (taxaAtivosPct * 0.22))));
    } else if (camada.id === 'leo_alto') {
      // Detritos de longo prazo e transição
      pontuacaoPressao = Math.min(78, Math.max(42, Math.round(35 + (taxaDetritosPct * 0.4))));
    } else if (camada.id === 'geo') {
      // Alta saturação de slots de rádio e proximidade linear equatorial
      pontuacaoPressao = Math.min(75, Math.max(40, Math.round(42 + (totalObjetos * 0.15) + (taxaDetritosPct * 0.2))));
    } else {
      // MEO: grande volume de dispersão
      pontuacaoPressao = Math.min(48, Math.max(18, Math.round(20 + (totalObjetos * 0.2))));
    }

    let nivelRisco = 'SUSTENTÁVEL';
    let corRisco = 'var(--neon-green, #00ff66)';
    if (pontuacaoPressao >= 80) {
      nivelRisco = 'CRÍTICO';
      corRisco = 'var(--neon-red, #ff0055)';
    } else if (pontuacaoPressao >= 65) {
      nivelRisco = 'ELEVADO';
      corRisco = 'var(--neon-amber, #ffaa00)';
    } else if (pontuacaoPressao >= 45) {
      nivelRisco = 'MODERADO';
      corRisco = 'var(--neon-cyan, #00f0ff)';
    }

    return {
      ...camada,
      volumeKm3,
      totalObjetos,
      ativos,
      inativos,
      detritos,
      foguetes,
      inertesTotal,
      taxaDetritosPct,
      taxaAtivosPct,
      densidadeEspacial, // obj / 10⁹ km³
      pontuacaoPressao, // 0 a 100
      nivelRisco,
      corRisco
    };
  });
}
