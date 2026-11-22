import * as satellite from 'satellite.js';

// Lista de satélites ativos no worker
let listaSatelites = [];
let intervaloId = null;
let ultimoTimestampMs = Date.now();
let loteIdAtual = 0;

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

// Calcula epoca e periodo orbital uma unica vez na inicializacao
function extrairMetaPeriodo(sat, satrec) {
  let epochMs = Date.now();

  if (satrec) {
    const epochyr = satrec.epochyr < 57 ? 2000 + satrec.epochyr : 1900 + satrec.epochyr;
    epochMs = Date.UTC(epochyr, 0, 1) + (satrec.epochdays - 1) * 86400000;
  }

  const line2 = sat.ultimo_tle?.linha2 || '';
  let mm = parseFloat(line2.substring(52, 63).trim()) || parseFloat(sat.omm?.MEAN_MOTION) || 0;
  if ((!mm || mm <= 0) && satrec?.no_kozai) {
    mm = (satrec.no_kozai * 1440) / (2 * Math.PI);
  }
  if (!mm || mm <= 0 || Number.isNaN(mm)) {
    mm = 15;
  }

  const periodMs = (1440 / mm) * 60000;
  return { epochMs, periodMs };
}

// Propaga toda a lista e envia coordenadas ECEF em metros via Float64Array
function propagarTodos(dataAtual = new Date(), inicial = false) {
  const t0 = performance.now();
  const total = listaSatelites.length;
  if (total === 0) return;

  const gmst = satellite.gstime(dataAtual);
  const cosGmst = Math.cos(gmst);
  const sinGmst = Math.sin(gmst);
  const agoraMs = dataAtual.getTime();
  const buffer = new Float64Array(total * 3);

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
      item.satrec.error = 0;
      let pv = satellite.propagate(item.satrec, dataAtual);
      const pos = pv && pv.position;
      const r = pos ? Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z) : 0;
      const altKm = r - 6378.137;

      const isLeoinvalido = item.regime === 'LEO' && (altKm > 2000 || altKm < 60);
      const isGeralInvalido = altKm < 60 || altKm > 100000;

      if (!pos || isLeoinvalido || isGeralInvalido) {
        // Fallback periódico para evitar divergência secular de TLE antigo
        try {
          const elapsedMs = agoraMs - item.epochMs;
          const modDate = new Date(item.epochMs + (Math.abs(elapsedMs) % item.periodMs));
          item.satrec.error = 0;
          pv = satellite.propagate(item.satrec, modDate);
        } catch {
          // Mantém pv atual se falhar
        }
      }

      if (pv && pv.position && !Number.isNaN(pv.position.x)) {
        const xEci = pv.position.x;
        const yEci = pv.position.y;
        const zEci = pv.position.z;
        buffer[offset] = (xEci * cosGmst + yEci * sinGmst) * 1000;
        buffer[offset + 1] = (-xEci * sinGmst + yEci * cosGmst) * 1000;
        buffer[offset + 2] = zEci * 1000;
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

  const tempoCalculoMs = performance.now() - t0;

  // Transfere o buffer para a thread principal com custo zero de cópia
  self.postMessage(
    {
      tipo: 'POSICOES',
      inicial,
      loteId: loteIdAtual,
      posicoes: buffer,
      timestamp: agoraMs,
      tempoCalculoMs: parseFloat(tempoCalculoMs.toFixed(1)),
      totalSatelites: total
    },
    [buffer.buffer]
  );
}

// Manipulador de mensagens da Main Thread
self.onmessage = function (e) {
  const { tipo, satelites, intervaloMs, timestampMs, loteId } = e.data;

  if (typeof timestampMs === 'number' && !Number.isNaN(timestampMs)) {
    ultimoTimestampMs = timestampMs;
  }

  if (tipo === 'INICIALIZAR') {
    if (typeof loteId === 'number') {
      loteIdAtual = loteId;
    }
    if (Array.isArray(satelites)) {
      listaSatelites = satelites.map(sat => {
        const satrec = criarSatrec(sat);
        const { epochMs, periodMs } = extrairMetaPeriodo(sat, satrec);
        return {
          regime: sat.regime,
          satrec,
          epochMs,
          periodMs
        };
      });
      // Envia propagação inicial imediata
      propagarTodos(new Date(ultimoTimestampMs), true);
    }
    return;
  }

  if (tipo === 'INICIAR') {
    if (intervaloId) clearInterval(intervaloId);
    const ms = intervaloMs || 1000;
    intervaloId = setInterval(() => {
      ultimoTimestampMs += ms;
      propagarTodos(new Date(ultimoTimestampMs));
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
    propagarTodos(new Date(ultimoTimestampMs));
  }
};
