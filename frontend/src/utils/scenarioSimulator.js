/**
 * Motor Matemático e Algorítmico do Simulador de Cenários "E Se...?" — OrbitalED (Passo 3.2)
 * 
 * Implementa modelo de dinâmica populacional orbital baseado nas diretrizes do
 * Inter-Agency Space Debris Coordination Committee (IADC-02-01) e nos princípios
 * de equilíbrio populacional da NASA (modelo LEGEND) e ESA Space Debris Office.
 * 
 * Equação simplificada de evolução populacional até 2050 (t = 24 anos a partir de 2026):
 * N(t) = N_0 + ∫ [ L(t) - D_pmd(t) - D_arrasto(t) + F_colisao(t) ] dt
 * 
 * Onde:
 * - N_0: População catalogada em 2026 (~11.535 objetos)
 * - L(t): Taxa de injeção anual de satélites
 * - D_pmd(t): Taxa de desorbitagem pós-missão bem sucedida (Post-Mission Disposal - PMD)
 * - D_arrasto(t): Decaimento natural por arrasto atmosférico solar/geomagnético
 * - F_colisao(t): Fragmentação induzida por colisões mútuas (efeito não-linear da densidade)
 */

export const CENARIOS_PREDEFINIDOS = [
  {
    id: 'bau',
    nome: 'Crescimento Atual',
    tag: 'TENDÊNCIA',
    cor: 'var(--neon-amber, #ffaa00)',
    descricao: 'Mantém a taxa média recente de lançamentos sem metas rígidas.',
    parametros: {
      lancamentosAno: 2400,
      taxaDesorbitagemPct: 65,
      vidaUtilAnos: 7,
      adesaoRegra5Anos: false
    }
  },
  {
    id: 'acelerado',
    nome: 'Megaconstelações',
    tag: 'CRÍTICO',
    cor: 'var(--neon-red, #ff0055)',
    descricao: 'Expansão acelerada de frotas com baixa desorbitagem pós-missão.',
    parametros: {
      lancamentosAno: 4500,
      taxaDesorbitagemPct: 40,
      vidaUtilAnos: 5,
      adesaoRegra5Anos: false
    }
  },
  {
    id: 'sustentavel',
    nome: 'Zero Debris',
    tag: 'SUSTENTÁVEL',
    cor: 'var(--neon-green, #00ff66)',
    descricao: 'Desorbitagem acima de 95% e remoção ativa de detritos.',
    parametros: {
      lancamentosAno: 1600,
      taxaDesorbitagemPct: 95,
      vidaUtilAnos: 8,
      adesaoRegra5Anos: true
    }
  }
];

/**
 * Simula a evolução da população orbital e os indicadores de sustentabilidade para o ano de 2050.
 * 
 * @param {object} params - Parâmetros configurados pelo usuário
 * @param {number} params.lancamentosAno - Novos satélites/ano (500 a 5000)
 * @param {number} params.taxaDesorbitagemPct - Taxa de desorbitagem pós-missão (20% a 99%)
 * @param {number} params.vidaUtilAnos - Tempo médio de vida útil dos satélites em anos (3 a 15)
 * @param {boolean} [params.adesaoRegra5Anos] - Se aplica a regra estrita dos 5 anos
 * @returns {object} Resultados completos da projeção até 2050
 */
export function simularCenario2050(params) {
  const {
    lancamentosAno = 2400,
    taxaDesorbitagemPct = 65,
    vidaUtilAnos = 7,
    adesaoRegra5Anos = false
  } = params;

  // Horizonte temporal: de 2026 a 2050 (24 anos)
  const deltaAnos = 24;
  const popInicial2026 = 11535; // População catalogada de referência em 2026 (~4.918 ativos + ~6.617 inertes)
  const inertesBase = 6617; // Inativos + foguetes + detritos

  // 1. Injeção acumulada de satélites no período
  const totalLancadosPeriodo = lancamentosAno * deltaAnos;

  // 2. Eficiência de desorbitagem
  const fatorPmd = taxaDesorbitagemPct / 100;
  const satelitesAbandonados = Math.round(totalLancadosPeriodo * (1 - fatorPmd));

  // 3. Satélites operacionais simultâneos em 2050
  // Lei de Little para satélites em regime permanente: N_ativo ≈ Lançamentos/ano * Vida Média
  const satelitesAtivos2050 = Math.round(lancamentosAno * Math.min(vidaUtilAnos, 12));

  // 4. Detritos e Carcaças acumuladas em 2050
  // Decaimento natural por arrasto atmosférico para objetos sem propulsão
  const anosArrastoMedio = adesaoRegra5Anos ? 5 : 25;
  const taxaDecaimentoNaturalAnual = 1 / anosArrastoMedio;
  const inertesDecaidosNaturalmente = Math.round(inertesBase * Math.min(0.65, taxaDecaimentoNaturalAnual * deltaAnos * 0.4));
  
  // Efeito não-linear colisional de Kessler:
  // Taxa de colisão mútua cresce com o quadrado da densidade espacial em LEO (~75% dos objetos)
  const densidadeFator = lancamentosAno / 2000;
  const falhaRemocaoFator = (100 - taxaDesorbitagemPct) / 35;
  const fragmentosColisaoKessler = Math.round(
    140 * deltaAnos * Math.pow(densidadeFator, 1.4) * Math.max(0.2, falhaRemocaoFator)
  );

  const totalInertes2050 = Math.max(
    1800,
    inertesBase - inertesDecaidosNaturalmente + satelitesAbandonados + fragmentosColisaoKessler
  );

  const totalObjetos2050 = satelitesAtivos2050 + totalInertes2050;
  const variacaoObjetosPct = Math.round(((totalObjetos2050 - popInicial2026) / popInicial2026) * 100);

  const satelitesAtivosPct = Math.round((satelitesAtivos2050 / totalObjetos2050) * 100);
  const detritosPct = 100 - satelitesAtivosPct;

  // 6. Risco de Cascata de Kessler (0 a 100%)
  const probabilidadeKesslerPct = Math.min(
    95,
    Math.max(8, Math.round((totalObjetos2050 / 45000) * 85 + (densidadeFator > 1.8 ? 15 : 0)))
  );

  // 7. Impacto na Alta Atmosfera (Massa de queima anual de satélites em toneladas de aerossóis)
  // Base empírica: Murphy et al., PNAS (2023) - ~300 kg a 800 kg de massa por satélite
  const massaMediaSatKg = 380;
  const satelitesDesorbitadosAno = Math.round(lancamentosAno * fatorPmd);
  const toneladasQueimadasAno = Number(((satelitesDesorbitadosAno * massaMediaSatKg) / 1000).toFixed(1));
  const toneladasAluminioOxidoAno = Number((toneladasQueimadasAno * 0.18).toFixed(1)); // ~18% converte em aerossóis de alumina

  // 8. Síntese didática e recomendações acadêmicas
  let diagnosticoTexto;
  let alertaCascata = false;

  if (probabilidadeKesslerPct >= 75) {
    alertaCascata = true;
    diagnosticoTexto = 'Saturação crítica: colisões superam a remoção natural, gerando efeito dominó.';
  } else if (probabilidadeKesslerPct >= 50) {
    diagnosticoTexto = 'Pressão elevada: concentração exige manobras frequentes de desvio.';
  } else {
    diagnosticoTexto = 'Ambiente estável: alta desorbitagem contém o acúmulo de detritos.';
  }

  return {
    parametrosUtilizados: {
      lancamentosAno,
      taxaDesorbitagemPct,
      vidaUtilAnos,
      adesaoRegra5Anos
    },
    resultados: {
      totalObjetos2050,
      variacaoObjetosPct,
      satelitesAtivos2050,
      satelitesAtivosPct,
      totalInertes2050,
      detritosPct,
      fragmentosColisaoKessler,
      probabilidadeKesslerPct,
      alertaCascata,
      toneladasQueimadasAno,
      toneladasAluminioOxidoAno,
      diagnosticoTexto
    }
  };
}
