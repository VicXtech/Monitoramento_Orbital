import * as satellite from 'satellite.js';

// Raio médio da Terra em quilômetros (WGS-84)
const RAIO_TERRA_KM = 6378.137;
// Parâmetro gravitacional padrão da Terra mu (km^3 / s^2)
const MU_TERRA = 398600.4418;

/**
 * Converte satélite, registro OMM ou linhas TLE em registro satrec do satellite.js.
 * @param {object|string} satOuLinha1 - Objeto com dados OMM/TLE ou primeira linha TLE
 * @param {string} [linha2] - Segunda linha TLE caso satOuLinha1 seja string
 * @returns {object|null} Instância satrec ou null
 */
export function obterSatrec(satOuLinha1, linha2 = null) {
  if (!satOuLinha1) return null;

  try {
    if (typeof satOuLinha1 === 'object') {
      const omm = satOuLinha1.omm || satOuLinha1.dados_omm || (satOuLinha1.OBJECT_NAME ? satOuLinha1 : null);
      if (omm && typeof omm === 'object') {
        return satellite.json2satrec(omm);
      }
      if (satOuLinha1.ultimo_tle?.linha1 && satOuLinha1.ultimo_tle?.linha2) {
        return satellite.twoline2satrec(satOuLinha1.ultimo_tle.linha1, satOuLinha1.ultimo_tle.linha2);
      }
      if (satOuLinha1.linha1 && satOuLinha1.linha2) {
        return satellite.twoline2satrec(satOuLinha1.linha1, satOuLinha1.linha2);
      }
    }

    if (typeof satOuLinha1 === 'string' && typeof linha2 === 'string') {
      if (satOuLinha1.length >= 69 && linha2.length >= 69) {
        return satellite.twoline2satrec(satOuLinha1, linha2);
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Calcula elementos orbitais e parâmetros físicos a partir de OMM ou TLE.
 * @param {object|string} satOuLinha1 - Satélite, objeto OMM ou linha 1 do TLE
 * @param {string|Date} [linha2OuData] - Linha 2 do TLE ou data de referência
 * @param {Date} [dataReferencia] - Data atual para cálculo de posição instantânea
 * @returns {object|null} Metadados físicos calculados
 */
export function calcularParametrosOrbitais(satOuLinha1, linha2OuData = null, dataReferencia = new Date()) {
  let linha1 = null;
  let linha2 = null;
  let dataRef = dataReferencia;
  let omm = null;

  if (typeof satOuLinha1 === 'object' && satOuLinha1 !== null) {
    if (linha2OuData instanceof Date) {
      dataRef = linha2OuData;
    }
    omm = satOuLinha1.omm || satOuLinha1.dados_omm || (satOuLinha1.OBJECT_NAME ? satOuLinha1 : null);
    if (!omm) {
      if (satOuLinha1.ultimo_tle?.linha1 && satOuLinha1.ultimo_tle?.linha2) {
        linha1 = satOuLinha1.ultimo_tle.linha1;
        linha2 = satOuLinha1.ultimo_tle.linha2;
      } else if (satOuLinha1.linha1 && satOuLinha1.linha2) {
        linha1 = satOuLinha1.linha1;
        linha2 = satOuLinha1.linha2;
      }
    }
  } else if (typeof satOuLinha1 === 'string' && typeof linha2OuData === 'string') {
    linha1 = satOuLinha1;
    linha2 = linha2OuData;
  }

  const satrec = obterSatrec(omm || (linha1 && linha2 ? { linha1, linha2 } : satOuLinha1), linha2);
  if (!satrec) return null;

  try {
    let inclinacaoGraus = 0;
    let excentricidade = 0;
    let movimentoMedio = 1;
    let bstar = 0;

    if (omm) {
      inclinacaoGraus = parseFloat(omm.INCLINATION) || 0;
      excentricidade = parseFloat(omm.ECCENTRICITY) || 0;
      movimentoMedio = parseFloat(omm.MEAN_MOTION) || 1;
      bstar = parseFloat(omm.BSTAR) || 0;
    } else if (linha2 && linha2.length >= 69) {
      inclinacaoGraus = parseFloat(linha2.substring(8, 16).trim()) || 0;
      const excentricidadeStr = '0.' + linha2.substring(26, 33).trim();
      excentricidade = parseFloat(excentricidadeStr) || 0;
      movimentoMedio = parseFloat(linha2.substring(52, 63).trim()) || 1;

      if (linha1 && linha1.length >= 69) {
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
      }
    } else {
      inclinacaoGraus = (satrec.inclo * 180) / Math.PI;
      excentricidade = satrec.ecco || 0;
      movimentoMedio = (satrec.no_kozai * 1440) / (2 * Math.PI) || 1;
      bstar = satrec.bstar || 0;
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
    let regimeCodigo = 'HEO';
    let regimeNome = 'Órbita Altamente Elíptica (HEO)';
    let regimeDescricao = 'Trajetória com formato oval ou alongado (GTO, Molniya), alternando passagens rápidas no perigeu e permanência prolongada no apogeu.';

    if (((periodoMinutos >= 1350 && periodoMinutos <= 1650) || (perigeuKm >= 34000 && apogeuKm <= 50000)) && excentricidade < 0.25) {
      regimeCodigo = 'GEO';
      regimeNome = 'Órbita Geoestacionária (GEO)';
      regimeDescricao = 'Altitude de ~35.786 km ou anel cemitério. O satélite acompanha a rotação da Terra ou deriva no cinturão geoestacionário.';
    } else if (perigeuKm < 2000 && apogeuKm <= 2000 && excentricidade < 0.25) {
      regimeCodigo = 'LEO';
      regimeNome = 'Órbita Terrestre Baixa (LEO)';
      regimeDescricao = 'Altitude inferior a 2.000 km. Região de maior concentração operacional e maior densidade de lixo espacial.';
    } else if (perigeuKm >= 2000 && apogeuKm < 35500 && excentricidade < 0.25) {
      regimeCodigo = 'MEO';
      regimeNome = 'Órbita Terrestre Média (MEO)';
      regimeDescricao = 'Altitude entre 2.000 km e 35.500 km. Região estratégica utilizada por constelações de posicionamento global (GPS, Galileo, Glonass).';
    }

    // 7. Descrição Didática da Inclinação
    let classeInclinacao = 'Órbita de Média Inclinação';
    let classeRotaCurta = 'Média Inclinação';
    let descricaoInclinacao = 'Trajetória com ângulo intermediário em relação ao equador, cobrindo latitudes médias povoadas da Terra.';

    if (inclinacaoGraus >= 85 && inclinacaoGraus <= 95) {
      classeInclinacao = 'Órbita Polar';
      classeRotaCurta = 'Polar';
      descricaoInclinacao = 'Cruza os polos Norte e Sul a cada volta, permitindo escanear a superfície do planeta inteiro conforme a Terra gira sob sua rota.';
    } else if (inclinacaoGraus > 95 && inclinacaoGraus <= 105) {
      classeInclinacao = 'Órbita Heliossíncrona (SSO)';
      classeRotaCurta = 'Heliossíncrona (SSO)';
      descricaoInclinacao = 'Trajetória retrógrada cujo plano mantém o mesmo ângulo em relação à luz solar, ideal para satélites de imageamento e monitoramento climático.';
    } else if (inclinacaoGraus > 105) {
      classeInclinacao = 'Órbita Retrógrada';
      classeRotaCurta = 'Retrógrada';
      descricaoInclinacao = 'Trajetória retrógrada que se desloca no sentido oposto ao movimento natural de rotação da Terra.';
    } else if (inclinacaoGraus >= 60 && inclinacaoGraus < 85) {
      classeInclinacao = 'Órbita de Alta Inclinação';
      classeRotaCurta = 'Alta Inclinação';
      descricaoInclinacao = 'Trajetória de ângulo acentuado em relação ao equador, permitindo ampla cobertura de altas latitudes e regiões subpolares.';
    } else if (inclinacaoGraus < 20) {
      classeInclinacao = 'Órbita Quase-Equatorial';
      classeRotaCurta = 'Quase-Equatorial';
      descricaoInclinacao = 'Trajetória de baixo ângulo que acompanha de perto a linha do equador da Terra.';
    } else if (Math.abs(inclinacaoGraus - 51.6) < 2) {
      classeInclinacao = 'Órbita Padrão ISS';
      classeRotaCurta = 'Padrão ISS';
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
      classeRotaCurta,
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
 * Deriva a elipse orbital osculadora instantânea a partir do estado inercial exato (posição e velocidade)
 * propagado pelo SGP4 para o instante de referência.
 * 
 * @param {object|string} satOuLinha1 - Satélite, objeto OMM ou linha 1 do TLE
 * @param {string|Date} [linha2OuDataBase] - Linha 2 do TLE ou data inicial de referência
 * @param {Date|number} [dataBaseOuAmostras] - Data inicial de referência ou quantidade de amostras
 * @param {number} [amostrasNum=120] - Quantidade de pontos na elipse
 * @returns {Array<object>|null} Array de Cesium.Cartesian3 ou null
 */
export function gerarPontosOrbita(satOuLinha1, linha2OuDataBase = null, dataBaseOuAmostras = new Date(), amostrasNum = 120) {
  if (!window.Cesium || !satOuLinha1) return null;

  let linha1 = null;
  let linha2 = null;
  let dataBase = new Date();
  let amostras = 120;
  let omm = null;

  if (typeof satOuLinha1 === 'object' && satOuLinha1 !== null) {
    omm = satOuLinha1.omm || satOuLinha1.dados_omm || (satOuLinha1.OBJECT_NAME ? satOuLinha1 : null);
    if (linha2OuDataBase instanceof Date) {
      dataBase = linha2OuDataBase;
    }
    if (typeof dataBaseOuAmostras === 'number') {
      amostras = dataBaseOuAmostras;
    }
    if (!omm) {
      if (satOuLinha1.ultimo_tle?.linha1 && satOuLinha1.ultimo_tle?.linha2) {
        linha1 = satOuLinha1.ultimo_tle.linha1;
        linha2 = satOuLinha1.ultimo_tle.linha2;
      } else if (satOuLinha1.linha1 && satOuLinha1.linha2) {
        linha1 = satOuLinha1.linha1;
        linha2 = satOuLinha1.linha2;
      }
    }
  } else if (typeof satOuLinha1 === 'string' && typeof linha2OuDataBase === 'string') {
    linha1 = satOuLinha1;
    linha2 = linha2OuDataBase;
    if (dataBaseOuAmostras instanceof Date) {
      dataBase = dataBaseOuAmostras;
    }
    if (typeof amostrasNum === 'number') {
      amostras = amostrasNum;
    }
  }

  const satrec = obterSatrec(omm || (linha1 && linha2 ? { linha1, linha2 } : satOuLinha1), linha2);
  if (!satrec) return null;

  try {
    let pv = satellite.propagate(satrec, dataBase);
    let r0 = pv?.position;
    let v0 = pv?.velocity;
    let rMagCheck = r0 ? Math.sqrt(r0.x * r0.x + r0.y * r0.y + r0.z * r0.z) : 0;
    let altKmCheck = rMagCheck - RAIO_TERRA_KM;

    const satRegime = typeof satOuLinha1 === 'object' ? satOuLinha1.regime : null;
    const isLeoinvalido = satRegime === 'LEO' && (altKmCheck > 2000 || altKmCheck < 60);
    const isGeralInvalido = altKmCheck < 60 || altKmCheck > 100000;

    if (!pv || !r0 || !v0 || isLeoinvalido || isGeralInvalido) {
      try {
        let mm = 15;
        if (omm && omm.MEAN_MOTION) mm = parseFloat(omm.MEAN_MOTION) || 15;
        else if (linha2) mm = parseFloat(linha2.substring(52, 63).trim()) || 15;
        const periodMs = (1440 / Math.max(0.1, mm)) * 60000;
        const epochyr = satrec.epochyr < 57 ? 2000 + satrec.epochyr : 1900 + satrec.epochyr;
        const epochDate = new Date(Date.UTC(epochyr, 0, 1) + (satrec.epochdays - 1) * 86400000);
        const elapsedMs = dataBase.getTime() - epochDate.getTime();
        const modDate = new Date(epochDate.getTime() + (Math.abs(elapsedMs) % periodMs));
        const freshSatrec = obterSatrec(omm || (linha1 && linha2 ? { linha1, linha2 } : satOuLinha1), linha2);
        if (freshSatrec) {
          pv = satellite.propagate(freshSatrec, modDate);
        }
      } catch {
        // Fallback
      }
    }

    // Se o SGP4 propagou o estado inercial com sucesso (posição e velocidade no instante dataBase)
    if (pv && pv.position && pv.velocity) {
      const r0 = pv.position; // km
      const v0 = pv.velocity; // km/s
      const gmstFixo = satellite.gstime(dataBase);

      // 1. Momento angular específico vetorial h = r0 x v0
      const hx = r0.y * v0.z - r0.z * v0.y;
      const hy = r0.z * v0.x - r0.x * v0.z;
      const hz = r0.x * v0.y - r0.y * v0.x;
      const h = Math.sqrt(hx * hx + hy * hy + hz * hz);

      if (h > 1e-4) {
        // 2. Vetor excentricidade e = ((v^2 - mu/r)*r - (r.v)*v) / mu
        const rMag = Math.sqrt(r0.x * r0.x + r0.y * r0.y + r0.z * r0.z);
        const vMag2 = v0.x * v0.x + v0.y * v0.y + v0.z * v0.z;
        const rDotV = r0.x * v0.x + r0.y * v0.y + r0.z * v0.z;

        const ex = ((vMag2 - MU_TERRA / rMag) * r0.x - rDotV * v0.x) / MU_TERRA;
        const ey = ((vMag2 - MU_TERRA / rMag) * r0.y - rDotV * v0.y) / MU_TERRA;
        const ez = ((vMag2 - MU_TERRA / rMag) * r0.z - rDotV * v0.z) / MU_TERRA;
        const eMag = Math.sqrt(ex * ex + ey * ey + ez * ez);

        // 3. Base ortonormal no plano orbital (P, Q, W)
        let Px, Py, Pz;
        if (eMag < 1e-5) {
          Px = r0.x / rMag;
          Py = r0.y / rMag;
          Pz = r0.z / rMag;
        } else {
          Px = ex / eMag;
          Py = ey / eMag;
          Pz = ez / eMag;
        }

        const Wx = hx / h;
        const Wy = hy / h;
        const Wz = hz / h;

        // Q = W x P
        const Qx = Wy * Pz - Wz * Py;
        const Qy = Wz * Px - Wx * Pz;
        const Qz = Wx * Py - Wy * Px;

        // Semilatus rectum p = h^2 / mu
        const p = (h * h) / MU_TERRA;

        // Anomalia verdadeira nu0 no instante de referência
        const cosNu0 = (r0.x * Px + r0.y * Py + r0.z * Pz) / rMag;
        const sinNu0 = (r0.x * Qx + r0.y * Qy + r0.z * Qz) / rMag;
        const nu0 = Math.atan2(sinNu0, cosNu0);

        const pontosCartesianos = [];
        for (let i = 0; i <= amostras; i++) {
          const nu = nu0 + (i / amostras) * 2 * Math.PI;
          const r = p / (1 + eMag * Math.cos(nu - (eMag < 1e-5 ? nu0 : 0)));

          // Posição inercial ECI
          const xEci = r * (Math.cos(nu) * Px + Math.sin(nu) * Qx);
          const yEci = r * (Math.cos(nu) * Py + Math.sin(nu) * Qy);
          const zEci = r * (Math.cos(nu) * Pz + Math.sin(nu) * Qz);

          // Conversão geodésica fiel ao elipsoide WGS-84 congelada no instante dataBase
          const posGd = satellite.eciToGeodetic({ x: xEci, y: yEci, z: zEci }, gmstFixo);
          const lon = satellite.degreesLong(posGd.longitude);
          const lat = satellite.degreesLat(posGd.latitude);
          const alt = Math.max(0, posGd.height * 1000);

          pontosCartesianos.push(window.Cesium.Cartesian3.fromDegrees(lon, lat, alt));
        }

        if (pontosCartesianos.length > 10) {
          return pontosCartesianos;
        }
      }
    }

    // Fallback kepleriano analítico clássico
    let inc = 0;
    let raan = 0;
    let ecc = 0;
    let argP = 0;
    let mm = 15;

    if (omm) {
      inc = ((parseFloat(omm.INCLINATION) || 0) * Math.PI) / 180;
      raan = ((parseFloat(omm.RA_OF_ASC_NODE) || 0) * Math.PI) / 180;
      ecc = parseFloat(omm.ECCENTRICITY) || 0;
      argP = ((parseFloat(omm.ARG_OF_PERICENTER) || 0) * Math.PI) / 180;
      mm = parseFloat(omm.MEAN_MOTION) || 15;
    } else if (linha2 && linha2.length >= 69) {
      inc = (parseFloat(linha2.substring(8, 16)) || 0) * Math.PI / 180;
      raan = (parseFloat(linha2.substring(17, 25)) || 0) * Math.PI / 180;
      const eccStr = '0.' + linha2.substring(26, 33).trim();
      ecc = parseFloat(eccStr) || 0;
      argP = (parseFloat(linha2.substring(34, 42)) || 0) * Math.PI / 180;
      mm = parseFloat(linha2.substring(52, 63).trim()) || 15;
    } else {
      inc = satrec.inclo || 0;
      raan = satrec.nodeo || 0;
      ecc = satrec.ecco || 0;
      argP = satrec.argpo || 0;
      mm = (satrec.no_kozai * 1440) / (2 * Math.PI) || 15;
    }

    const nRadS = (mm * 2 * Math.PI) / 86400;
    const a = Math.cbrt(MU_TERRA / (nRadS * nRadS));

    const pontosCartesianos = [];
    const gmstFixo = satellite.gstime(dataBase);

    for (let i = 0; i <= amostras; i++) {
      const theta = (i / amostras) * 2 * Math.PI;
      const r = (a * (1 - ecc * ecc)) / (1 + ecc * Math.cos(theta));
      const u = argP + theta;

      const xEci = r * (Math.cos(raan) * Math.cos(u) - Math.sin(raan) * Math.sin(u) * Math.cos(inc));
      const yEci = r * (Math.sin(raan) * Math.cos(u) + Math.cos(raan) * Math.sin(u) * Math.cos(inc));
      const zEci = r * Math.sin(u) * Math.sin(inc);

      const posGd = satellite.eciToGeodetic({ x: xEci, y: yEci, z: zEci }, gmstFixo);
      const lon = satellite.degreesLong(posGd.longitude);
      const lat = satellite.degreesLat(posGd.latitude);
      const alt = Math.max(0, posGd.height * 1000);

      pontosCartesianos.push(window.Cesium.Cartesian3.fromDegrees(lon, lat, alt));
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
 * Classifica o regime orbital a partir de objeto orbital, OMM ou linhas TLE.
 * @param {object|string} satOuLinha1 - Objeto orbital, registro OMM ou primeira linha TLE
 * @param {string} [linha2] - Segunda linha TLE
 * @returns {'LEO'|'MEO'|'GEO'|'HEO'} Código do regime orbital
 */
export function classificarRegimeOrbital(satOuLinha1, linha2 = null) {
  if (!satOuLinha1) return 'LEO';

  try {
    if (typeof satOuLinha1 === 'object') {
      if (satOuLinha1.regime) {
        return satOuLinha1.regime;
      }
      const omm = satOuLinha1.omm || satOuLinha1.dados_omm || (satOuLinha1.OBJECT_NAME ? satOuLinha1 : null);
      if (omm) {
        const ecc = parseFloat(omm.ECCENTRICITY) || 0;
        const mm = parseFloat(omm.MEAN_MOTION) || 1;
        if (mm <= 0) return 'LEO';

        const nRadS = (mm * 2 * Math.PI) / 86400;
        const semiEixoMaior = Math.cbrt(MU_TERRA / (nRadS * nRadS));
        const hp = semiEixoMaior * (1 - ecc) - RAIO_TERRA_KM;
        const ha = semiEixoMaior * (1 + ecc) - RAIO_TERRA_KM;
        const periodMin = 1440 / mm;

        if (((periodMin >= 1350 && periodMin <= 1650) || (hp >= 34000 && ha <= 50000)) && ecc < 0.25) return 'GEO';
        if (hp < 2000 && ha <= 2000 && ecc < 0.25) return 'LEO';
        if (hp >= 2000 && ha < 35500 && ecc < 0.25) return 'MEO';
        return 'HEO';
      }
      if (satOuLinha1.ultimo_tle?.linha2) {
        return classificarRegimeOrbital(satOuLinha1.ultimo_tle.linha1, satOuLinha1.ultimo_tle.linha2);
      }
    }

    if (typeof satOuLinha1 === 'string' && typeof linha2 === 'string') {
      if (linha2.length < 69) return 'LEO';
      const excentricidadeStr = '0.' + linha2.substring(26, 33).trim();
      const ecc = parseFloat(excentricidadeStr) || 0;
      const mm = parseFloat(linha2.substring(52, 63).trim()) || 1;
      if (mm <= 0) return 'LEO';

      const nRadS = (mm * 2 * Math.PI) / 86400;
      const semiEixoMaior = Math.cbrt(MU_TERRA / (nRadS * nRadS));
      const hp = semiEixoMaior * (1 - ecc) - RAIO_TERRA_KM;
      const ha = semiEixoMaior * (1 + ecc) - RAIO_TERRA_KM;
      const periodMin = 1440 / mm;

      if (((periodMin >= 1350 && periodMin <= 1650) || (hp >= 34000 && ha <= 50000)) && ecc < 0.25) return 'GEO';
      if (hp < 2000 && ha <= 2000 && ecc < 0.25) return 'LEO';
      if (hp >= 2000 && ha < 35500 && ecc < 0.25) return 'MEO';
      return 'HEO';
    }
  } catch {
    return 'LEO';
  }
  return 'LEO';
}

