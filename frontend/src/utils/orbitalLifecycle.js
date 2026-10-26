/**
 * Módulo de Lógica Astrodinâmica do Ciclo de Vida do Objeto (Passo 3.3)
 * 
 * Modela as fases de ciclo de vida de satélites e detritos espaciais
 * de acordo com os padrões técnicos do IADC (IADC-02-01) e NASA Safety Standard.
 * 
 * Regra: Ausência estrita de emojis nos textos educativos para garantir conformidade acadêmica.
 */

export const ESTAGIOS_CICLO_VIDA = {
  LANCAMENTO: 'lancamento',
  OPERACAO: 'operacao',
  FIM_MISSAO: 'fim_missao',
  DESATIVACAO: 'desativacao',
  REENTRADA: 'reentrada',
  CEMITERIO: 'cemiterio',
  DETRITO: 'detrito'
};

/**
 * Determina o estágio operacional atual do objeto com base na categoria e parâmetros orbitais.
 * @param {object} sat - Objeto orbital catalogado
 * @param {object} parametros - Parâmetros físicos calculados
 * @returns {string} ID do estágio atual
 */
export function determinarEstagioAtual(sat, parametros) {
  if (!sat) return ESTAGIOS_CICLO_VIDA.OPERACAO;

  const categoriaId = Number(sat.categoria_id) || 1;

  // Categoria 1: Satélite Ativo | Categoria 4: Estação Espacial
  if (categoriaId === 1 || categoriaId === 4) {
    return ESTAGIOS_CICLO_VIDA.OPERACAO;
  }

  // Categoria 2: Satélite Inativo
  if (categoriaId === 2) {
    // Se o perigeu é muito baixo (< 300 km), está em reentrada iminente
    if (parametros && parametros.perigeuKm < 300) {
      return ESTAGIOS_CICLO_VIDA.REENTRADA;
    }
    // Se está em GEO (> 35.000 km), verificar se já foi movido para o cemitério
    if (parametros && parametros.perigeuKm > 36000) {
      return ESTAGIOS_CICLO_VIDA.CEMITERIO;
    }
    return ESTAGIOS_CICLO_VIDA.DESATIVACAO;
  }

  // Categoria 5: Corpo de Foguete (Rocket Body)
  if (categoriaId === 5) {
    if (parametros && parametros.perigeuKm < 250) {
      return ESTAGIOS_CICLO_VIDA.REENTRADA;
    }
    return ESTAGIOS_CICLO_VIDA.DETRITO;
  }

  // Categoria 3: Detrito Espacial (Debris)
  if (categoriaId === 3) {
    if (parametros && parametros.perigeuKm < 200) {
      return ESTAGIOS_CICLO_VIDA.REENTRADA;
    }
    return ESTAGIOS_CICLO_VIDA.DETRITO;
  }

  return ESTAGIOS_CICLO_VIDA.OPERACAO;
}

/**
 * Avalia qual rota de destino final é mais compatível com a física do objeto.
 * @param {object} sat
 * @param {object} parametros
 * @returns {{ rotaRecomendada: string, justificativa: string }}
 */
export function avaliarDestinoProjetado(sat, parametros) {
  if (!parametros) {
    return {
      rotaRecomendada: ESTAGIOS_CICLO_VIDA.REENTRADA,
      justificativa: 'Órbita baixa sujeita a arrasto atmosférico gradual.'
    };
  }

  const { perigeuKm, apogeuKm, altitudeInstantaneaKm } = parametros;
  const categoriaId = Number(sat?.categoria_id) || 1;

  // Órbitas Geoestacionárias (GEO) -> Cemitério Super-GEO (+300 km)
  if (altitudeInstantaneaKm >= 35000 || apogeuKm >= 35500) {
    return {
      rotaRecomendada: ESTAGIOS_CICLO_VIDA.CEMITERIO,
      justificativa: 'Altitude muito elevada para reentrada viável; o descarte regulamentar IADC exige propulsão até a órbita cemitério a +300 km acima do anel GEO.'
    };
  }

  // LEO Baixo (< 600 km) -> Reentrada atmosférica passiva ou controlada rápida
  if (perigeuKm < 600) {
    return {
      rotaRecomendada: ESTAGIOS_CICLO_VIDA.REENTRADA,
      justificativa: 'Densidade da termosfera permite decaimento natural e incineração atmosférica em prazos compatíveis com a regra de 5 a 25 anos.'
    };
  }

  // LEO Alto / MEO sem propulsão residual (600 a 2.000 km) -> Risco de virar detrito persistente
  if (categoriaId === 2 || categoriaId === 3 || categoriaId === 5) {
    return {
      rotaRecomendada: ESTAGIOS_CICLO_VIDA.DETRITO,
      justificativa: 'Objeto inerte localizado acima de 600 km sem capacidade de desorbitagem ativa; permanecerá por séculos como detrito inerte em LEO.'
    };
  }

  // Satélites ativos entre 600 e 2000 km precisam de desorbitagem deliberada
  return {
    rotaRecomendada: ESTAGIOS_CICLO_VIDA.REENTRADA,
    justificativa: 'Requer manobra de desorbitagem ativa com queima retrógrada para rebaixar o perigeu e forçar reentrada controlada no oceano.'
  };
}

/**
 * Retorna os dados conceituais e o diagnóstico específico do objeto para um estágio clicado.
 * @param {string} estagioId - ID do estágio
 * @param {object} sat - Objeto orbital
 * @param {object} parametros - Parâmetros físicos
 * @returns {object} Dossiê educativo da etapa
 */
export function obterDossieEstagio(estagioId, sat, parametros) {
  const nomeObjeto = sat?.nome || 'Objeto Orbital';
  const categoriaId = Number(sat?.categoria_id) || 1;
  const perigeu = parametros?.perigeuKm || 500;
  const apogeu = parametros?.apogeuKm || 550;

  switch (estagioId) {
    case ESTAGIOS_CICLO_VIDA.LANCAMENTO:
      return {
        id: ESTAGIOS_CICLO_VIDA.LANCAMENTO,
        titulo: 'Lançamento',
        descricaoGeral: 'Transporte da carga útil até a altitude e velocidade orbital requerida.',
        situacaoDesteObjeto: sat?.local_lancamento
          ? `Lançado de ${sat.local_lancamento} em ${sat.data_lancamento ? sat.data_lancamento.substring(0, 10) : 'data catalogada'}.`
          : `Lançado e inserido em órbita nominal.`,
        statusNoObjeto: 'Concluído'
      };

    case ESTAGIOS_CICLO_VIDA.OPERACAO:
      return {
        id: ESTAGIOS_CICLO_VIDA.OPERACAO,
        titulo: 'Operação Ativa',
        descricaoGeral: 'Período operacional com funções ativas e manobras periódicas de desvio.',
        situacaoDesteObjeto: categoriaId === 1 || categoriaId === 4
          ? `Operando a ${parametros?.altitudeInstantaneaKm || perigeu} km de altitude a ${(parametros?.velocidadeKmH || 27500).toLocaleString('pt-BR')} km/h.`
          : `Fase operacional encerrada sem manobras ativas.`,
        statusNoObjeto: categoriaId === 1 || categoriaId === 4 ? 'Ativo' : 'Concluído'
      };

    case ESTAGIOS_CICLO_VIDA.FIM_MISSAO:
      return {
        id: ESTAGIOS_CICLO_VIDA.FIM_MISSAO,
        titulo: 'Fim de Missão',
        descricaoGeral: 'Esgotamento da carga útil ou alcance da cota final de combustível.',
        situacaoDesteObjeto: categoriaId === 2
          ? `Atingiu o fim da vida útil; registrado como satélite inativo.`
          : categoriaId === 1 || categoriaId === 4
          ? `Operando com estimativa de vida residual baseada no arrasto.`
          : `Fragmento ou carcaça sem missão científica ativa.`,
        statusNoObjeto: categoriaId === 2 ? 'Fase Atual' : (categoriaId === 1 || categoriaId === 4 ? 'Previsto' : 'Passado')
      };

    case ESTAGIOS_CICLO_VIDA.DESATIVACAO:
      return {
        id: ESTAGIOS_CICLO_VIDA.DESATIVACAO,
        titulo: 'Desativação',
        descricaoGeral: 'Drenagem de baterias e purga de propelente para prevenir explosões.',
        situacaoDesteObjeto: categoriaId === 2
          ? `Em regime de desativação com neutralização de energia interna.`
          : `Exigência regulamentar ao término das atividades operacionais.`,
        statusNoObjeto: categoriaId === 2 ? 'Fase Atual' : 'Pendente'
      };

    case ESTAGIOS_CICLO_VIDA.REENTRADA:
      return {
        id: ESTAGIOS_CICLO_VIDA.REENTRADA,
        titulo: 'Reentrada',
        descricaoGeral: 'Decaimento até as camadas densas com vaporização pelo atrito atmosférico.',
        situacaoDesteObjeto: perigeu < 600
          ? `Perigeu em ${perigeu} km; decaimento em ${parametros?.estimativaVida || 'alguns anos'}.`
          : `Requer manobra retrógrada deliberada para forçar a reentrada.`,
        statusNoObjeto: perigeu < 600 ? 'Natural' : 'Com Manobra'
      };

    case ESTAGIOS_CICLO_VIDA.CEMITERIO:
      return {
        id: ESTAGIOS_CICLO_VIDA.CEMITERIO,
        titulo: 'Órbita Cemitério',
        descricaoGeral: 'Elevação de altitude (+300 km) para desocupar o cinturão geoestacionário.',
        situacaoDesteObjeto: apogeu > 34000
          ? `Regime GEO: descarte obrigatório em órbita cemitério supersíncrona.`
          : `Não aplicável para órbitas baixas ou médias.`,
        statusNoObjeto: apogeu > 34000 ? 'Obrigatório' : 'Não Aplicável'
      };

    case ESTAGIOS_CICLO_VIDA.DETRITO:
      return {
        id: ESTAGIOS_CICLO_VIDA.DETRITO,
        titulo: 'Detrito Inerte',
        descricaoGeral: 'Abandono sem propulsão em altitudes com arrasto insuficiente para decaimento.',
        situacaoDesteObjeto: categoriaId === 3 || categoriaId === 5 || (categoriaId === 2 && perigeu >= 600 && perigeu <= 2000)
          ? `Condição de risco: permanecerá inerte sem arrasto por décadas.`
          : `Controle ativo ou altitude baixa evitam o abandono permanente.`,
        statusNoObjeto: categoriaId === 3 || categoriaId === 5 || (categoriaId === 2 && perigeu >= 600 && perigeu <= 2000)
          ? 'Crítico'
          : 'Evitado'
      };

    default:
      return null;
  }
}
