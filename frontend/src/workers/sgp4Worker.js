import * as satellite from 'satellite.js';

// Lista de satélites ativos no worker
let listaSatelites = [];
let intervaloId = null;

// Converte satélite para registro satrec do satellite.js
function criarSatrec(sat) {
  try {
    if (sat.omm) {
      return satellite.json2satrec(sat.omm);
    }
    if (sat.ultimo_tle?.linha1 && sat.ultimo_tle?.linha2) {
      return satellite.twoline2satrec(sat.ultimo_tle.linha1, sat.ultimo_tle.linha2);
    }
  } catch {
    return null;
  }
  return null;
}

// Propaga toda a lista e envia as coordenadas geodésicas em Float32Array
function propagarTodos(dataAtual = new Date()) {
  const total = listaSatelites.length;
  if (total === 0) return;

  const gmst = satellite.gstime(dataAtual);
  // Aloca buffer: 3 floats por satélite (longitude, latitude, altitude em metros)
  const buffer = new Float32Array(total * 3);

  for (let i = 0; i < total; i++) {
    const item = listaSatelites[i];
    const offset = i * 3;

    if (!item.satrec) {
      buffer[offset] = NaN;
      buffer[offset + 1] = NaN;
      buffer[offset + 2] = NaN;
      continue;
    }

    try {
      let pv = satellite.propagate(item.satrec, dataAtual);
      let r = pv && pv.position ? Math.sqrt(pv.position.x * pv.position.x + pv.position.y * pv.position.y + pv.position.z * pv.position.z) : 0;
      let altKm = r - 6378.137;

      const isLeoinvalido = item.regime === 'LEO' && (altKm > 2000 || altKm < 60);
      const isGeralInvalido = altKm < 60 || altKm > 100000;

      if (!pv || !pv.position || isLeoinvalido || isGeralInvalido) {
        // Fallback periódico para evitar divergência secular de TLE antigo
        try {
          const line2 = item.ultimo_tle?.linha2 || '';
          let mm = parseFloat(line2.substring(52, 63).trim()) || item.omm?.MEAN_MOTION || 15;
          if (mm <= 0) mm = 15;
          const periodMs = (1440 / mm) * 60000;
          const satrecRef = item.satrec;
          const epochyr = satrecRef.epochyr < 57 ? 2000 + satrecRef.epochyr : 1900 + satrecRef.epochyr;
          const epochDate = new Date(Date.UTC(epochyr, 0, 1) + (satrecRef.epochdays - 1) * 86400000);
          const elapsedMs = dataAtual.getTime() - epochDate.getTime();
          const modDate = new Date(epochDate.getTime() + (Math.abs(elapsedMs) % periodMs));

          const freshSatrec = criarSatrec(item);
          if (freshSatrec) {
            pv = satellite.propagate(freshSatrec, modDate);
          }
        } catch {
          // Mantém pv atual se falhar
        }
      }

      if (pv && pv.position && !isNaN(pv.position.x)) {
        const gd = satellite.eciToGeodetic(pv.position, gmst);
        buffer[offset] = satellite.degreesLong(gd.longitude);
        buffer[offset + 1] = satellite.degreesLat(gd.latitude);
        buffer[offset + 2] = gd.height * 1000;
      } else {
        buffer[offset] = NaN;
        buffer[offset + 1] = NaN;
        buffer[offset + 2] = NaN;
      }
    } catch {
      buffer[offset] = NaN;
      buffer[offset + 1] = NaN;
      buffer[offset + 2] = NaN;
    }
  }

  // Transfere o buffer para a thread principal com custo zero de cópia
  self.postMessage(
    {
      tipo: 'POSICOES',
      posicoes: buffer,
      timestamp: dataAtual.getTime()
    },
    [buffer.buffer]
  );
}

// Manipulador de mensagens da Main Thread
self.onmessage = function (e) {
  const { tipo, satelites, intervaloMs } = e.data;

  if (tipo === 'INICIALIZAR') {
    if (Array.isArray(satelites)) {
      listaSatelites = satelites.map(sat => ({
        norad_id: String(sat.norad_id),
        regime: sat.regime,
        omm: sat.omm,
        ultimo_tle: sat.ultimo_tle,
        satrec: criarSatrec(sat)
      }));
      // Envia propagação inicial imediata
      propagarTodos();
    }
    return;
  }

  if (tipo === 'INICIAR') {
    if (intervaloId) clearInterval(intervaloId);
    const ms = intervaloMs || 1000;
    intervaloId = setInterval(() => {
      propagarTodos();
    }, ms);
    return;
  }

  if (tipo === 'PARAR') {
    if (intervaloId) {
      clearInterval(intervaloId);
      intervaloId = null;
    }
    return;
  }

  if (tipo === 'PROPAGAR_AGORA') {
    propagarTodos();
  }
};
