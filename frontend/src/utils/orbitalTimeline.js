/**
 * Motor da Linha do Tempo Histórica do Ambiente Orbital (1957–2026)
 * Base de dados: Séries históricas consolidadas do ESA Space Environment Report
 */

import { SERIE_HISTORICA_ESA } from '../data/esaSpaceEnvironmentData';

export const MARCOS_HISTORICOS_ORBITAIS = SERIE_HISTORICA_ESA.map((item) => ({
  ano: item.ano,
  label: item.rotulo,
  titulo: item.evento,
  descricao: item.evento,
  totalObjetos: item.totalCatalogado,
  cargasAtivas: item.cargasAtivas,
  cargasInativas: item.cargasInativas,
  corposFoguete: item.corposFoguete,
  detritos: item.detritos,
  satelitesAtivosPct: Math.round((item.cargasAtivas / item.totalCatalogado) * 100),
  detritosPct: Math.round(((item.detritos + item.corposFoguete + item.cargasInativas) / item.totalCatalogado) * 100),
  reentradasAcumuladas: item.reentradasAcumuladas,
  fonte: item.fonte
}));

/**
 * Retorna os dados oficiais ou interpolados para qualquer ano entre 1957 e 2026.
 * @param {number} ano - Ano de 1957 a 2026
 * @returns {object} Métricas reais e evento documentado
 */
export function obterDadosAno(ano) {
  const clampedAno = Math.max(1957, Math.min(2026, Math.round(ano)));

  // Procura marco exato
  const marcoExato = MARCOS_HISTORICOS_ORBITAIS.find((m) => m.ano === clampedAno);
  if (marcoExato) {
    return {
      ano: clampedAno,
      totalObjetos: marcoExato.totalObjetos,
      cargasAtivas: marcoExato.cargasAtivas,
      cargasInativas: marcoExato.cargasInativas,
      corposFoguete: marcoExato.corposFoguete,
      detritos: marcoExato.detritos,
      satelitesAtivosPct: marcoExato.satelitesAtivosPct,
      detritosPct: marcoExato.detritosPct,
      reentradasAcumuladas: marcoExato.reentradasAcumuladas,
      titulo: marcoExato.titulo,
      descricao: marcoExato.descricao,
      fonte: marcoExato.fonte,
      isPassado: clampedAno < 2026,
      isAtual: clampedAno === 2026
    };
  }

  // Interpolação linear entre os dois marcos históricos adjacentes mais próximos
  let anterior = MARCOS_HISTORICOS_ORBITAIS[0];
  let posterior = MARCOS_HISTORICOS_ORBITAIS[MARCOS_HISTORICOS_ORBITAIS.length - 1];

  for (let i = 0; i < MARCOS_HISTORICOS_ORBITAIS.length - 1; i++) {
    if (clampedAno >= MARCOS_HISTORICOS_ORBITAIS[i].ano && clampedAno <= MARCOS_HISTORICOS_ORBITAIS[i + 1].ano) {
      anterior = MARCOS_HISTORICOS_ORBITAIS[i];
      posterior = MARCOS_HISTORICOS_ORBITAIS[i + 1];
      break;
    }
  }

  const t = (clampedAno - anterior.ano) / (posterior.ano - anterior.ano);
  const lerp = (a, b) => Math.round(a + (b - a) * t);

  const totalObjetos = lerp(anterior.totalObjetos, posterior.totalObjetos);
  const cargasAtivas = lerp(anterior.cargasAtivas, posterior.cargasAtivas);
  const cargasInativas = lerp(anterior.cargasInativas, posterior.cargasInativas);
  const corposFoguete = lerp(anterior.corposFoguete, posterior.corposFoguete);
  const detritos = lerp(anterior.detritos, posterior.detritos);
  const reentradasAcumuladas = lerp(anterior.reentradasAcumuladas, posterior.reentradasAcumuladas);

  const satelitesAtivosPct = Math.round((cargasAtivas / totalObjetos) * 100);
  const detritosPct = 100 - satelitesAtivosPct;

  const marcoMaisProximo = Math.abs(clampedAno - anterior.ano) <= Math.abs(clampedAno - posterior.ano)
    ? anterior
    : posterior;

  return {
    ano: clampedAno,
    totalObjetos,
    cargasAtivas,
    cargasInativas,
    corposFoguete,
    detritos,
    satelitesAtivosPct,
    detritosPct,
    reentradasAcumuladas,
    titulo: marcoMaisProximo.titulo,
    descricao: marcoMaisProximo.descricao,
    fonte: 'ESA Space Environment Report',
    isPassado: clampedAno < 2026,
    isAtual: clampedAno === 2026
  };
}
