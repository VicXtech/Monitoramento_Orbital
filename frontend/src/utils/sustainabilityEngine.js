// Motor de sustentabilidade orbital e calculo do Score de Impacto Orbital (SIO)

// Converte valor numerico em classificacao qualitativa e cor
export function classificarNivelImpacto(valor) {
  if (valor >= 75) return { label: 'CRÍTICO', cor: 'var(--neon-red, #ff0055)', classe: 'badge-critico' };
  if (valor >= 50) return { label: 'ALTO', cor: 'var(--neon-orange, #ff6600)', classe: 'badge-alto' };
  if (valor >= 30) return { label: 'MÉDIO', cor: 'var(--neon-amber, #ffaa00)', classe: 'badge-medio' };
  return { label: 'BAIXO', cor: 'var(--neon-green, #00ff66)', classe: 'badge-baixo' };
}

// Retorna cor e classe semantica alinhada ao nivel textual
export function obterEstiloPorNivel(nivel) {
  if (nivel === 'CRÍTICO') return { cor: 'var(--neon-red, #ff0055)', classe: 'badge-critico' };
  if (nivel === 'ALTO') return { cor: 'var(--neon-orange, #ff6600)', classe: 'badge-alto' };
  if (nivel === 'MÉDIO') return { cor: 'var(--neon-amber, #ffaa00)', classe: 'badge-medio' };
  return { cor: 'var(--neon-green, #00ff66)', classe: 'badge-baixo' };
}

// Normaliza categoria do objeto para o modelo de auditoria
function normalizarCategoria(sat) {
  const catId = Number(sat?.categoria_id);
  if (catId === 4) return 'STATION';
  if (catId === 1) return 'ACTIVE';
  if (catId === 2) return 'INACTIVE';
  if (catId === 5) return 'ROCKET_BODY';
  if (catId === 3) return 'DEBRIS';

  const catNome = (sat?.categoria?.nome || sat?.tipo_objeto || '').toUpperCase();
  if (catNome.includes('ESTAÇÃO') || catNome.includes('STATION')) return 'STATION';
  if (catNome.includes('CORPO') || catNome.includes('ROCKET') || catNome.includes('FOGUETE')) return 'ROCKET_BODY';
  if (catNome.includes('DETRITO') || catNome.includes('DEBRIS')) return 'DEBRIS';
  if (catNome.includes('INATIVO') || catNome.includes('INACTIVE')) return 'INACTIVE';
  return 'ACTIVE';
}

// Calcula auditoria normativa e Score de Impacto Orbital (SIO 0-100)
export function calculateOrbitalAudit(sat, params = null) {
  if (!sat) {
    return {
      score: 50,
      overallRating: { label: 'MÉDIO', cor: 'var(--neon-amber)', classe: 'badge-medio' },
      decayEstimate: 'Dado indisponível',
      endOfLifeTarget: 'REENTRY',
      breakdown: []
    };
  }

  const perigee = Number(params?.perigeuKm ?? sat.perigeu ?? sat.altitude ?? 500);
  const apogee = Number(params?.apogeuKm ?? sat.apogeu ?? sat.altitude ?? 500);
  const meanAlt = (perigee + apogee) / 2;
  const category = normalizarCategoria(sat);
  const orbit = (params?.regimeCodigo || sat.regime || 'LEO').toUpperCase();

  // 1. Permanencia por altitude (peso 40%)
  let permanenceScore = 0;
  let decayEstimate = '';
  let permanenceLevel = 'BAIXO';

  if (perigee < 400) {
    permanenceScore = 8;
    decayEstimate = 'Meses a 2 anos (Conforme FCC)';
    permanenceLevel = 'BAIXO';
  } else if (perigee <= 550) {
    permanenceScore = 16;
    decayEstimate = 'Menos de 5 anos (Conforme FCC)';
    permanenceLevel = 'BAIXO';
  } else if (perigee <= 650) {
    permanenceScore = 24;
    decayEstimate = '10 a 25 anos (Conforme IADC)';
    permanenceLevel = 'MÉDIO';
  } else if (perigee <= 800) {
    permanenceScore = 32;
    decayEstimate = '50 a 150 anos (Excede 25 anos)';
    permanenceLevel = 'ALTO';
  } else if (perigee <= 2000) {
    permanenceScore = 40;
    decayEstimate = 'Séculos a milênios (Sem limpeza natural)';
    permanenceLevel = 'CRÍTICO';
  } else {
    permanenceScore = 38;
    decayEstimate = 'Permanência indefinida (> 10.000 anos)';
    permanenceLevel = 'CRÍTICO';
  }

  // 2. Trafego na mesma altitude (peso 35%)
  let densityScore = 0;
  let densityLevel = 'BAIXO';

  if (orbit === 'LEO') {
    if ((meanAlt >= 750 && meanAlt <= 950) || (meanAlt >= 500 && meanAlt <= 600)) {
      densityScore = 35;
      densityLevel = 'CRÍTICO';
    } else if ((meanAlt >= 600 && meanAlt < 750) || (meanAlt > 950 && meanAlt <= 1250)) {
      densityScore = 26;
      densityLevel = 'ALTO';
    } else {
      densityScore = 15;
      densityLevel = 'MÉDIO';
    }
  } else if (orbit === 'GEO') {
    densityScore = 25;
    densityLevel = 'ALTO';
  } else if (orbit === 'HEO') {
    densityScore = 22;
    densityLevel = 'MÉDIO';
  } else {
    densityScore = 10;
    densityLevel = 'BAIXO';
  }

  // 3. Capacidade de desvio e controle (peso 25%)
  let controlScore = 0;
  let controlLevel = 'BAIXO';

  switch (category) {
    case 'STATION':
      controlScore = 4;
      controlLevel = 'BAIXO';
      break;
    case 'ACTIVE':
      controlScore = 8;
      controlLevel = 'BAIXO';
      break;
    case 'INACTIVE':
      controlScore = 20;
      controlLevel = 'ALTO';
      break;
    case 'ROCKET_BODY':
      controlScore = 23;
      controlLevel = 'CRÍTICO';
      break;
    case 'DEBRIS':
    default:
      controlScore = 25;
      controlLevel = 'CRÍTICO';
      break;
  }

  // Calculo do total SIO
  const totalSio = Math.min(100, Math.round(permanenceScore + densityScore + controlScore));
  const overallRating = classificarNivelImpacto(totalSio);

  // Destino esperado de fim de vida
  let endOfLifeTarget = 'REENTRY';
  if (orbit === 'GEO') {
    endOfLifeTarget = 'GRAVEYARD';
  } else if ((category === 'DEBRIS' || category === 'INACTIVE' || category === 'ROCKET_BODY') && perigee > 650) {
    endOfLifeTarget = 'PERMANENT_DEBRIS';
  }

  // Frases explicativas concisas
  let explicacaoPermanencia = "Perde altitude sozinho em poucos anos pelo atrito do ar.";
  if (perigee > 800) {
    explicacaoPermanencia = "Sem ar suficiente para frear o objeto; séculos em órbita.";
  } else if (perigee > 550) {
    explicacaoPermanencia = "Decaimento lento em décadas por arrasto residual.";
  }

  let explicacaoTrafego = "Faixa orbital com tráfego moderado e disperso.";
  if (densityLevel === 'CRÍTICO' || densityLevel === 'ALTO') {
    explicacaoTrafego = "Faixa orbital com densidade elevada de objetos.";
  }

  const temControle = (category === 'STATION' || category === 'ACTIVE');
  const labelControle = temControle ? 'Ativo (Desvia)' : 'Sem Controle (Inerte)';
  const explicacaoControle = temControle
    ? "Satélite ativo com propulsão para evitar colisões."
    : "Sucata espacial sem motor; não consegue desviar.";

  const estiloPermanencia = obterEstiloPorNivel(permanenceLevel);
  const estiloDensidade = obterEstiloPorNivel(densityLevel);

  return {
    score: totalSio,
    scoreTotal: totalSio,
    overallRating,
    classificacaoGeral: overallRating,
    decayEstimate,
    endOfLifeTarget,
    breakdown: [
      {
        id: 'permanencia',
        label: 'Permanência por Altitude',
        peso: '40%',
        level: permanenceLevel,
        classe: estiloPermanencia.classe,
        cor: estiloPermanencia.cor,
        points: permanenceScore,
        maxPoints: 40,
        explicacao: explicacaoPermanencia
      },
      {
        id: 'concha',
        label: 'Tráfego na Mesma Altitude',
        peso: '35%',
        level: densityLevel,
        classe: estiloDensidade.classe,
        cor: estiloDensidade.cor,
        points: densityScore,
        maxPoints: 35,
        explicacao: explicacaoTrafego
      },
      {
        id: 'controle',
        label: 'Capacidade de Desvio (Controle)',
        peso: '25%',
        level: labelControle,
        classe: temControle ? 'badge-baixo' : 'badge-critico',
        cor: temControle ? 'var(--neon-green, #00ff66)' : 'var(--neon-red, #ff0055)',
        points: controlScore,
        maxPoints: 25,
        explicacao: explicacaoControle
      }
    ]
  };
}

// Mantem compatibilidade com chamadas legadas
export const calcularScoreImpactoObjeto = calculateOrbitalAudit;
