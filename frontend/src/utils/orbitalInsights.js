/**
 * Motor de Interpretação Científica e Didática Orbital — OrbitalED
 * 
 * Traduz parâmetros astrodinâmicos brutos (calculados via SGP4) em significado,
 * narrativa educacional e conscientização sobre sustentabilidade espacial.
 * 
 * Regra Acadêmica: Todas as explicações e curiosidades são 100% ancoradas
 * em fontes oficiais (IADC, ESA, NASA ODPO, Leis de Kepler/Newton).
 */

/**
 * Gera insights didáticos contextuais para um objeto orbital selecionado.
 * @param {object} sat - Objeto orbital com metadados do catálogo
 * @param {object} params - Parâmetros calculados em orbitalPhysics.js
 * @returns {object} Pacote de insights estruturados em 4 dimensões
 */
export function obterInsightsDidaticos(sat, params) {
  if (!sat || !params) return null;

  const categoriaId = Number(sat.categoria_id) || 1;
  const altitude = params.altitudeInstantaneaKm || 400;
  const velocidadeKmH = params.velocidadeKmH || 27000;
  const regime = params.regimeCodigo || 'LEO';
  const inclinacao = params.inclinacaoGraus || 0;

  // 1. INSIGHTS DA TELEMETRIA FÍSICA (ABA DADOS)
  let insightAltitude = {
    porQueImporta: `A ${altitude.toLocaleString('pt-BR')} km de altitude, o objeto se encontra na região de ${params.regimeNome}. Nesta faixa, a densidade da atmosfera residual determina se o objeto decairá por atrito ou permanecerá por séculos.`,
    voceSabia: "Quanto mais próximo da Terra um satélite orbita, mais rápida precisa ser sua velocidade para não cair, pois a atração gravitacional é mais intensa.",
    fonte: "IADC Space Debris Mitigation Guidelines / Mecânica Newtoniana"
  };

  if (regime === 'LEO') {
    if (altitude < 450) {
      insightAltitude = {
        porQueImporta: `Em órbita muito baixa (${altitude.toLocaleString('pt-BR')} km), as moléculas de gás da termosfera causam arrasto aerodinâmico contínuo. Sem queima periódica de propulsores, a reentrada natural ocorreria em poucos meses.`,
        voceSabia: `A Estação Espacial Internacional (ISS) perde cerca de 100 metros de altitude por dia devido a esse atrito e precisa acionar seus motores periodicamente para subir de volta.`,
        fonte: "NASA Flight Dynamics Facility / SGP4 Drag Model"
      };
    } else if (altitude >= 700 && altitude <= 1000) {
      insightAltitude = {
        porQueImporta: `Esta faixa (${altitude.toLocaleString('pt-BR')} km) é a zona de maior densidade de satélites e fragmentos da história espacial. O ar aqui é rarefeito demais para limpar o objeto naturalmente, acumulando lixo espacial por séculos.`,
        voceSabia: "Foi exatamente nesta faixa de altitude (789 km) que ocorreu a histórica colisão entre o Iridium 33 e o Cosmos 2251 em 2009, gerando mais de 2.000 fragmentos perigosos.",
        fonte: "NASA ODPO / ESA Space Debris Office"
      };
    }
  } else if (regime === 'GEO') {
    insightAltitude = {
      porQueImporta: `A 35.786 km de altitude, a velocidade orbital se iguala com exatidão ao período de rotação da Terra (23h 56m 4s). Isso faz o satélite parecer imóvel no céu visto do solo, sendo um recurso finito e protegido por tratados da ONU.`,
      voceSabia: "Satélites geoestacionários não caem na atmosfera quando são desativados. Eles são empurrados para cima, para uma 'órbita cemitério' 300 km acima do anel GEO.",
      fonte: "Diretrizes IADC-02-01 / ITU Radio Regulations"
    };
  } else if (regime === 'MEO') {
    insightAltitude = {
      porQueImporta: `A órbita média (${altitude.toLocaleString('pt-BR')} km) atravessa os cinturões de radiação de Van Allen. Abriga constelações de posicionamento global (GPS, Galileo, BeiDou) com períodos de cerca de 12 horas.`,
      voceSabia: "Relógios atômicos a bordo de satélites em MEO experimentam efeitos de dilatação temporal previstos pela Teoria da Relatividade de Einstein, precisando de correção contínua.",
      fonte: "US Space Force / GPS Standard Positioning Service"
    };
  }

  const insightVelocidade = {
    porQueImporta: `Viajando a ${velocidadeKmH.toLocaleString('pt-BR')} km/h (${params.velocidadeKmS} km/s), o objeto não está 'voando' com propulsores ligados. Ele está em queda livre perpétua em torno da curvatura do planeta.`,
    voceSabia: "Nessa velocidade, um minúsculo fragmento de tinta de 1 milímetro possui a energia cinética de uma bala disparada, sendo capaz de perfurar painéis solares e trajes espaciais.",
    fonte: "Equação de Vis-Viva / KESSLER & COUR-PALAIS (1978)"
  };

  // 2. INSIGHTS DE SUSTENTABILIDADE E RISCO (ABA IMPACTO)
  let statusFimDeVida = "Operacional Ativo";
  let riscoDetrito = "BAIXO";
  let ocupacaoOrbital = "MÉDIO";
  let permanenciaOrbital = "CONTROLADO";
  let reentradaImpacto = "BAIXO";
  let scoreImpacto = 45; // 0 (sem impacto) a 100 (impacto severo)

  if (categoriaId === 3) {
    // Detrito
    statusFimDeVida = "Detrito Abandonado (Inerte)";
    riscoDetrito = "CRÍTICO";
    scoreImpacto = altitude >= 700 && altitude <= 1000 ? 92 : 78;
    ocupacaoOrbital = "ALTO";
    permanenciaOrbital = altitude > 600 ? "MILÊNIO" : "MODERADO";
  } else if (categoriaId === 5) {
    // Corpo de Foguete
    statusFimDeVida = "Estágio Inerte (Sem Propulsão)";
    riscoDetrito = "ELEVADO";
    scoreImpacto = 82;
    ocupacaoOrbital = "ALTO";
    permanenciaOrbital = altitude > 600 ? "ALTO" : "MÉDIO";
  } else if (categoriaId === 2) {
    // Satélite Inativo
    statusFimDeVida = "Desativado / Sem Controle";
    riscoDetrito = "MÉDIO";
    scoreImpacto = 68;
    ocupacaoOrbital = "MÉDIO";
    permanenciaOrbital = altitude > 600 ? "ALTO" : "BAIXO";
  } else if (categoriaId === 4) {
    // Estação Espacial
    statusFimDeVida = "Habitado / Manobras Ativas";
    riscoDetrito = "MUITO BAIXO";
    scoreImpacto = 38;
    ocupacaoOrbital = "MÉDIO";
    permanenciaOrbital = "CONTROLADO (Ativo)";
  } else {
    // Satélite Ativo
    statusFimDeVida = "Operacional / Monitorado";
    riscoDetrito = "BAIXO";
    ocupacaoOrbital = altitude < 600 ? "ALTO (Megaconstelação)" : "MÉDIO";
    scoreImpacto = altitude < 600 ? 58 : 65;
    permanenciaOrbital = altitude < 600 ? "CONFORME IADC (<25 anos)" : "EXTERNO";
  }

  const explicacaoImpacto = {
    resumo: categoriaId === 3
      ? "Fragmento inerte sem manobra evasiva; risco contínuo de colisão na órbita."
      : categoriaId === 5
      ? "Estágio pesado com risco de explosão por pressão residual em tanques."
      : categoriaId === 2
      ? "Satélite desativado sem propulsão para manobras de prevenção de colisão."
      : "Espaçonave ativa; requer plano de descarte seguro ao final da missão."
  };

  // 3. INSIGHTS DE CONTEXTO E PROPÓSITO (ABA CONTEXTO)
  let explicacaoProposito = "Espaçonave voltada para telecomunicações, observação da Terra ou pesquisa científica.";
  if (categoriaId === 3) {
    explicacaoProposito = "Fragmento resultante de fragmentação ou colisão em missões anteriores.";
  } else if (categoriaId === 5) {
    explicacaoProposito = "Estágio propulsor descartado após inserção da carga útil em órbita.";
  } else if (categoriaId === 4) {
    explicacaoProposito = "Estação habitada para pesquisa em microgravidade e ciência espacial.";
  }

  // 4. INSIGHTS DE FUTURO E DESCARTE (ABA FUTURO)
  let cenarioFuturo = {
    etapaAtual: categoriaId === 1 ? "Operação Nominal" : (categoriaId === 4 ? "Laboratório Ativo" : "Deriva Orbital"),
    desfechoEsperado: altitude < 600
      ? "Reentrada e incineração aerodinâmica natural nas camadas densas da mesosfera em horizonte inferior a 25 anos."
      : (regime === 'GEO'
      ? "Manobra de empurrão para a Órbita Cemitério (300 km acima do arco geoestacionário)."
      : "Permanência inerte de longo prazo (séculos a milênios) sem arrasto atmosférico suficiente para desorbitagem natural."),
    diretrizAplicavel: altitude < 600
      ? "Atende à Regra dos 25 Anos do IADC (IADC-02-01)."
      : (regime === 'GEO'
      ? "Regulamentado pelo IADC e União Internacional de Telecomunicações (UIT) para descarte em supersíncrona."
      : "Requer tecnologias ativas de remoção de detritos (Active Debris Removal - ADR) para evitar risco de colisão.")
  };

  return {
    dados: {
      altitude: insightAltitude,
      velocidade: insightVelocidade,
      rota: {
        porQueImporta: `Com inclinação de ${Number(inclinacao.toFixed(1))}°, a trajetória cobre latitudes proporcionais ao seu ângulo orbital, determinando quais regiões e países da Terra o objeto sobrevoa a cada 90 minutos.`,
        voceSabia: "Órbitas polares (próximas a 90°) permitem que o satélite visualize o globo terrestre por completo, pois o planeta gira continuamente por baixo do plano orbital.",
        fonte: "Astrodinâmica Kepleriana / WGS-84"
      }
    },
    impacto: {
      score: scoreImpacto,
      statusFimDeVida,
      riscoDetrito,
      ocupacaoOrbital,
      permanenciaOrbital,
      reentradaImpacto,
      explicacao: explicacaoImpacto.resumo,
      fonte: "IADC Guidelines IADC-02-01 / ESA Space Debris Office"
    },
    contexto: {
      proposito: explicacaoProposito,
      nacionalidade: sat.pais || "Internacional",
      cosmodromo: sat.local_lancamento || "Cosmódromo Oficial",
      fonte: "Catálogo CelesTrak SATCAT / Registro UNOOSA"
    },
    futuro: {
      etapa: cenarioFuturo.etapaAtual,
      desfecho: cenarioFuturo.desfechoEsperado,
      diretriz: cenarioFuturo.diretrizAplicavel,
      fonte: "Modelos de Arrasto SGP4 / NASA-STD-8719.14"
    }
  };
}
