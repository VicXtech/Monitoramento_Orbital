import * as satellite from 'satellite.js';

// Raio médio da Terra em quilômetros (WGS-84)
const RAIO_TERRA_KM = 6378.137;
// Parâmetro gravitacional padrão da Terra mu (km^3 / s^2)
const MU_TERRA = 398600.4418;

/**
 * Decodifica uma linha TLE e extrai seus elementos keplerianos brutos e derivados.
 * @param {string} linha1 - Primeira linha do TLE NORAD
 * @param {string} linha2 - Segunda linha do TLE NORAD
 * @param {Date} [dataReferencia] - Data atual para cálculo de posição instantânea
 * @returns {object|null} Metadados físicos calculados
 */
export function calcularParametrosOrbitais(linha1, linha2, dataReferencia = new Date()) {
  if (!linha1 || !linha2 || linha1.length < 69 || linha2.length < 69) {
    return null;
  }

  try {
    const satrec = satellite.twoline2satrec(linha1, linha2);

    // 1. Elementos Keplerianos fundamentais extraídos da Linha 2
    // Inclinação em graus
    const inclinacaoGraus = parseFloat(linha2.substring(8, 16).trim()) || 0;
    
    // Excentricidade (decimal com 7 casas implícitas)
    const excentricidadeStr = '0.' + linha2.substring(26, 33).trim();
    const excentricidade = parseFloat(excentricidadeStr) || 0;
    
    // Movimento Médio (revoluções por dia)
    const movimentoMedio = parseFloat(linha2.substring(52, 63).trim()) || 1;
    
    // Termo de arrasto BSTAR da Linha 1 (fração com expoente, ex: 19357-3 = 0.19357e-3)
    let bstar = 0;
    try {
      const bstarRaw = linha1.substring(53, 61).trim();
      if (bstarRaw && bstarRaw.length >= 2) {
        const mantissa = parseFloat(bstarRaw.slice(0, -2)) / 100000;
        const expoente = parseInt(bstarRaw.slice(-2), 10);
        bstar = mantissa * Math.pow(10, expoente);
      }
    } catch {
      bstar = 0;
    }

    // 2. Cálculo do Semi-eixo maior (a) em km
    // n em radianos por segundo:
    const nRadS = (movimentoMedio * 2 * Math.PI) / 86400;
    // a = (mu / n^2)^(1/3)
    const semiEixoMaior = Math.cbrt(MU_TERRA / (nRadS * nRadS));

    // 3. Apogeu e Perigeu em relação à superfície da Terra (km)
    const raioPerigeu = semiEixoMaior * (1 - excentricidade);
    const raioApogeu = semiEixoMaior * (1 + excentricidade);
    
    const perigeuKm = Math.round(Math.max(0, raioPerigeu - RAIO_TERRA_KM));
    const apogeuKm = Math.round(Math.max(0, raioApogeu - RAIO_TERRA_KM));

    // 4. Período Orbital em minutos e revoluções diárias
    const periodoMinutos = parseFloat((1440 / movimentoMedio).toFixed(1));
    const voltasPorDia = parseFloat(movimentoMedio.toFixed(1));

    // 5. Propagação da Posição e Velocidade Instantâneas via SGP4
    const gmst = satellite.gstime(dataReferencia);
    const posAndVel = satellite.propagate(satrec, dataReferencia);

    let altitudeInstantaneaKm = Math.round((perigeuKm + apogeuKm) / 2);
    // Estimativa teórica da velocidade orbital circular baseada no semi-eixo maior: v = sqrt(mu / r)
    const rMedio = Math.max(RAIO_TERRA_KM + 100, semiEixoMaior);
    let velocidadeKmS = parseFloat(Math.sqrt(MU_TERRA / rMedio).toFixed(2));
    let velocidadeKmH = Math.round(velocidadeKmS * 3600);

    if (posAndVel && posAndVel.position && posAndVel.velocity) {
      const vx = posAndVel.velocity.x;
      const vy = posAndVel.velocity.y;
      const vz = posAndVel.velocity.z;
      const vMag = Math.sqrt(vx * vx + vy * vy + vz * vz);

      const posGd = satellite.eciToGeodetic(posAndVel.position, gmst);
      const altSgp4 = Math.round(posGd.height);

      // Validação física de consistência orbital:
      // A velocidade de escape da Terra é ~11.2 km/s. Nenhuma órbita fechada pode ter v > 11.5 km/s ou v < 1.0 km/s.
      // Além disso, a altitude não pode ser negativa nem exceder apogeu + 1500 km por divergência secular do SGP4.
      const vValida = !isNaN(vMag) && vMag >= 1.0 && vMag <= 11.5;
      const altValida = !isNaN(altSgp4) && altSgp4 >= 0 && altSgp4 <= (apogeuKm + 1500);

      if (vValida && altValida) {
        altitudeInstantaneaKm = altSgp4;
        velocidadeKmS = parseFloat(vMag.toFixed(2));
        velocidadeKmH = Math.round(velocidadeKmS * 3600);
      }
    }

    // 6. Classificação de Regime Orbital
    let regimeCodigo = 'LEO';
    let regimeNome = 'Órbita Terrestre Baixa (LEO)';
    let regimeDescricao = 'Altitude inferior a 2.000 km. Região de maior concentração operacional e maior densidade de lixo espacial.';

    if (excentricidade > 0.25) {
      regimeCodigo = 'HEO';
      regimeNome = 'Órbita Altamente Elíptica (HEO)';
      regimeDescricao = 'Trajetória com formato muito alongado, alternando passagens rápidas no perigeu e permanência prolongada no apogeu.';
    } else if (altitudeInstantaneaKm >= 35000) {
      regimeCodigo = 'GEO';
      regimeNome = 'Órbita Geoestacionária (GEO)';
      regimeDescricao = 'Altitude de ~35.786 km. O satélite acompanha a rotação exata da Terra, permanecendo fixo sobre o mesmo ponto do equador.';
    } else if (altitudeInstantaneaKm >= 2000) {
      regimeCodigo = 'MEO';
      regimeNome = 'Órbita Terrestre Média (MEO)';
      regimeDescricao = 'Altitude entre 2.000 km e 35.000 km. Região estratégica utilizada por constelações de posicionamento global (GPS, Galileo, Glonass).';
    }

    // 7. Descrição Didática da Inclinação
    let classeInclinacao = 'Órbita de Média Inclinação';
    let descricaoInclinacao = 'Trajetória com ângulo intermediário em relação ao equador, cobrindo latitudes médias povoadas da Terra.';

    if (inclinacaoGraus >= 85 && inclinacaoGraus <= 95) {
      classeInclinacao = 'Órbita Polar';
      descricaoInclinacao = 'Cruza os polos Norte e Sul a cada volta, permitindo escanear a superfície do planeta inteiro conforme a Terra gira sob sua rota.';
    } else if (inclinacaoGraus > 95 && inclinacaoGraus <= 105) {
      classeInclinacao = 'Órbita Heliossíncrona (SSO)';
      descricaoInclinacao = 'Trajetória retrógrada cujo plano mantém o mesmo ângulo em relação à luz solar, ideal para satélites de imageamento e monitoramento climático.';
    } else if (inclinacaoGraus > 105) {
      classeInclinacao = 'Órbita Retrógrada';
      descricaoInclinacao = 'Trajetória retrógrada que se desloca no sentido oposto ao movimento natural de rotação da Terra.';
    } else if (inclinacaoGraus >= 60 && inclinacaoGraus < 85) {
      classeInclinacao = 'Órbita de Alta Inclinação';
      descricaoInclinacao = 'Trajetória de ângulo acentuado em relação ao equador, permitindo ampla cobertura de altas latitudes e regiões subpolares.';
    } else if (inclinacaoGraus < 20) {
      classeInclinacao = 'Órbita Quase-Equatorial';
      descricaoInclinacao = 'Trajetória de baixo ângulo que acompanha de perto a linha do equador da Terra.';
    } else if (Math.abs(inclinacaoGraus - 51.6) < 2) {
      classeInclinacao = 'Órbita Padrão ISS';
      descricaoInclinacao = 'Ângulo histórico da Estação Espacial Internacional, desenhado para permitir lançamentos e acoplamentos a partir da Rússia e dos Estados Unidos.';
    }

    // 8. Diagnóstico de Arrasto Atmosférico e Estimativa de Vida em Órbita
    let riscoDecaimento = 'Baixo';
    let estimativaVida = 'Milênios (Permanência Estável)';
    let impactoAmbientalReentrada = 'Estável em órbita alta';

    if (altitudeInstantaneaKm < 350) {
      riscoDecaimento = 'Crítico (Reentrada Iminente)';
      estimativaVida = 'Semanas a poucos meses';
      impactoAmbientalReentrada = 'Sofre atrito aerodinâmico severo na termosfera. Decai de forma acelerada rumo à incineração.';
    } else if (altitudeInstantaneaKm < 500) {
      riscoDecaimento = 'Moderado';
      estimativaVida = '1 a 5 anos';
      impactoAmbientalReentrada = 'O arrasto da atmosfera residual causará reentrada natural nos próximos anos, queimando na mesosfera.';
    } else if (altitudeInstantaneaKm < 650) {
      riscoDecaimento = 'Controlado';
      estimativaVida = '10 a 25 anos';
      impactoAmbientalReentrada = 'Dentro da diretriz internacional de descarte orbital seguro da ONU (regra dos 25 anos).';
    } else if (altitudeInstantaneaKm < 1000) {
      riscoDecaimento = 'Permanente (Zona Crítica Kessler)';
      estimativaVida = 'Séculos (100 a 500 anos)';
      impactoAmbientalReentrada = 'Altitude onde o ar é rarefeito demais para frear o objeto. Ficará em órbita por séculos sem decair.';
    } else {
      riscoDecaimento = 'Inerte';
      estimativaVida = 'Milhares a milhões de anos';
      impactoAmbientalReentrada = 'Permanência perpétua. Não sofrerá decaimento atmosférico perceptível em escalas de tempo humanas.';
    }

    return {
      inclinacaoGraus,
      classeInclinacao,
      descricaoInclinacao,
      excentricidade,
      perigeuKm,
      apogeuKm,
      altitudeInstantaneaKm,
      velocidadeKmS,
      velocidadeKmH,
      periodoMinutos,
      voltasPorDia,
      bstar,
      regimeCodigo,
      regimeNome,
      regimeDescricao,
      riscoDecaimento,
      estimativaVida,
      impactoAmbientalReentrada
    };
  } catch (error) {
    console.warn('Falha ao processar parâmetros orbitais matemáticos:', error);
    return null;
  }
}

/**
 * Gera os pontos cartesianos 3D de uma volta orbital completa para exibição no Cesium.
 * Utiliza mecânica kepleriana analítica 3D exata para garantir que a elipse seja
 * matematicamente suave, fechada e perfeitamente estável, imune a distorções do SGP4.
 * 
 * @param {string} linha1 - Linha 1 do TLE
 * @param {string} linha2 - Linha 2 do TLE
 * @param {Date} [dataBase] - Data inicial de referência
 * @param {number} [amostras=120] - Quantidade de pontos na elipse
 * @returns {Array<object>|null} Array de Cesium.Cartesian3 ou null
 */
export function gerarPontosOrbita(linha1, linha2, dataBase = new Date(), amostras = 120) {
  if (!window.Cesium || !linha1 || !linha2) return null;

  try {
    const inc = (parseFloat(linha2.substring(8, 16)) || 0) * Math.PI / 180;
    const raan = (parseFloat(linha2.substring(17, 25)) || 0) * Math.PI / 180;
    const eccStr = '0.' + linha2.substring(26, 33).trim();
    const ecc = parseFloat(eccStr) || 0;
    const argP = (parseFloat(linha2.substring(34, 42)) || 0) * Math.PI / 180;
    const mm = parseFloat(linha2.substring(52, 63).trim()) || 15;
    const nRadS = (mm * 2 * Math.PI) / 86400;
    const a = Math.cbrt(MU_TERRA / (nRadS * nRadS));

    const pontosCartesianos = [];
    const gmstFixo = satellite.gstime(dataBase);
    const cosG = Math.cos(gmstFixo);
    const sinG = Math.sin(gmstFixo);

    for (let i = 0; i <= amostras; i++) {
      const theta = (i / amostras) * 2 * Math.PI;
      const r = (a * (1 - ecc * ecc)) / (1 + ecc * Math.cos(theta));
      const u = argP + theta;

      // Coordenadas inerciais ECI
      const xEci = r * (Math.cos(raan) * Math.cos(u) - Math.sin(raan) * Math.sin(u) * Math.cos(inc));
      const yEci = r * (Math.sin(raan) * Math.cos(u) + Math.cos(raan) * Math.sin(u) * Math.cos(inc));
      const zEci = r * Math.sin(u) * Math.sin(inc);

      // Rotação analítica inercial ECI -> ECEF no instante de referência (em metros)
      const xMeters = (xEci * cosG + yEci * sinG) * 1000;
      const yMeters = (-xEci * sinG + yEci * cosG) * 1000;
      const zMeters = zEci * 1000;

      pontosCartesianos.push(new window.Cesium.Cartesian3(xMeters, yMeters, zMeters));
    }

    if (pontosCartesianos.length > 10) {
      pontosCartesianos.push(pontosCartesianos[0]);
    }

    return pontosCartesianos.length > 10 ? pontosCartesianos : null;
  } catch (err) {
    console.warn('Erro ao gerar elipse orbital tridimensional:', err);
    return null;
  }
}

/**
 * Calcula a posição geográfica (longitude, latitude, altitude em metros) via propagador kepleriano analítico.
 * Usado como fallback infalível caso o SGP4 numérico divirja devido a TLEs com alto decaimento.
 */
export function calcularPosicaoKepleriana(linha1, linha2, dataAtual = new Date()) {
  try {
    const inc = (parseFloat(linha2.substring(8, 16)) || 0) * Math.PI / 180;
    const raan = (parseFloat(linha2.substring(17, 25)) || 0) * Math.PI / 180;
    const eccStr = '0.' + linha2.substring(26, 33).trim();
    const ecc = parseFloat(eccStr) || 0;
    const argP = (parseFloat(linha2.substring(34, 42)) || 0) * Math.PI / 180;
    const m0 = (parseFloat(linha2.substring(43, 51)) || 0) * Math.PI / 180;
    const mm = parseFloat(linha2.substring(52, 63).trim()) || 15;
    const nRadS = (mm * 2 * Math.PI) / 86400;
    const a = Math.cbrt(MU_TERRA / (nRadS * nRadS));

    const epochYear = parseInt(linha1.substring(18, 20), 10);
    const fullYear = epochYear >= 57 ? 1900 + epochYear : 2000 + epochYear;
    const epochDay = parseFloat(linha1.substring(20, 32));
    const epochMs = Date.UTC(fullYear, 0, 1) + (epochDay - 1) * 86400000;
    const deltaSec = (dataAtual.getTime() - epochMs) / 1000;

    let M = (m0 + nRadS * deltaSec) % (2 * Math.PI);
    if (M < 0) M += 2 * Math.PI;

    let E = M;
    for (let iter = 0; iter < 5; iter++) {
      E = E - (E - ecc * Math.sin(E) - M) / (1 - ecc * Math.cos(E));
    }
    const theta = 2 * Math.atan2(Math.sqrt(1 + ecc) * Math.sin(E / 2), Math.sqrt(1 - ecc) * Math.cos(E / 2));
    const r = (a * (1 - ecc * ecc)) / (1 + ecc * Math.cos(theta));
    const u = argP + theta;

    const xEci = r * (Math.cos(raan) * Math.cos(u) - Math.sin(raan) * Math.sin(u) * Math.cos(inc));
    const yEci = r * (Math.sin(raan) * Math.cos(u) + Math.cos(raan) * Math.sin(u) * Math.cos(inc));
    const zEci = r * Math.sin(u) * Math.sin(inc);

    const gmst = satellite.gstime(dataAtual);
    const posGd = satellite.eciToGeodetic({ x: xEci, y: yEci, z: zEci }, gmst);
    const lon = satellite.degreesLong(posGd.longitude);
    const lat = satellite.degreesLat(posGd.latitude);
    const alt = Math.max(120000, posGd.height * 1000);

    return { lon, lat, alt };
  } catch {
    return null;
  }
}

/**
 * Classifica de forma ultra-rápida o regime orbital a partir das duas linhas TLE NORAD.
 * @param {string} linha1 - Primeira linha do TLE NORAD
 * @param {string} linha2 - Segunda linha do TLE NORAD
 * @returns {'LEO'|'MEO'|'GEO'|'HEO'} Código do regime orbital
 */
export function classificarRegimeOrbital(linha1, linha2) {
  if (!linha2 || linha2.length < 69) return 'LEO';

  try {
    const excentricidadeStr = '0.' + linha2.substring(26, 33).trim();
    const excentricidade = parseFloat(excentricidadeStr) || 0;

    // 1. Órbitas Altamente Elípticas (Molniya, Tundra, trajetórias com e > 0.25)
    if (excentricidade > 0.25) {
      return 'HEO';
    }

    const movimentoMedio = parseFloat(linha2.substring(52, 63).trim()) || 1;
    const nRadS = (movimentoMedio * 2 * Math.PI) / 86400;
    const semiEixoMaior = Math.cbrt(MU_TERRA / (nRadS * nRadS));
    const altitudeMediaKm = semiEixoMaior - RAIO_TERRA_KM;

    // 2. Regime GEO (~35.786 km de altitude)
    if (altitudeMediaKm >= 35000) {
      return 'GEO';
    }
    // 3. Regime MEO (entre 2.000 km e 35.000 km)
    else if (altitudeMediaKm >= 2000) {
      return 'MEO';
    }
    // 4. Regime LEO (abaixo de 2.000 km)
    else {
      return 'LEO';
    }
  } catch {
    return 'LEO';
  }
}

