// Utilitário para ajuste dinâmico do tamanho de fonte e prevenção de overflow

/**
 * Calcula o tamanho de fonte proporcional para que o texto ou número
 * caiba perfeitamente no container sem quebrar ou transbordar.
 *
 * @param {string|number} conteudo - Texto ou número exibido
 * @param {Object} opcoes
 * @param {number} opcoes.base - Tamanho base da fonte em px
 * @param {number} opcoes.min - Tamanho mínimo admissível em px
 * @param {number} opcoes.limiteSeguro - Quantidade máxima de caracteres que cabem com tamanho base
 * @param {number} [opcoes.fator] - Fator de compressão linear alternativo
 * @returns {string|undefined} String de fontSize em px ou undefined para usar o CSS padrão
 */
export function calcularTamanhoFonte(conteudo, { base = 14, min = 9, limiteSeguro = 12, fator = null } = {}) {
  if (conteudo === null || conteudo === undefined) return undefined;
  const texto = String(conteudo).trim();
  const tamanho = texto.length;
  if (tamanho <= limiteSeguro) return undefined;

  let tamanhoCalculado;
  if (fator !== null) {
    tamanhoCalculado = base - (tamanho - limiteSeguro) * fator;
  } else {
    // Escala harmônica proporcional ao excesso de caracteres
    tamanhoCalculado = (limiteSeguro / tamanho) * base;
  }

  const final = Math.max(min, Math.min(base, tamanhoCalculado));
  return `${final.toFixed(1)}px`;
}

/**
 * Componente que encapsula valores textuais ou numéricos e ajusta
 * dinamicamente seu fontSize caso o comprimento ultrapasse o suportado pela caixa.
 */
export function AutoFitValue({
  children,
  base = 14,
  min = 9,
  limiteSeguro = 12,
  fator = null,
  className = '',
  style = {},
  title
}) {
  const extrairTexto = (no) => {
    if (no === null || no === undefined || typeof no === 'boolean') return '';
    if (typeof no === 'string' || typeof no === 'number') return String(no);
    if (Array.isArray(no)) return no.map(extrairTexto).join('');
    if (no.props && no.props.children) return extrairTexto(no.props.children);
    return '';
  };

  const textoSimples = extrairTexto(children);
  const fontSize = textoSimples
    ? calcularTamanhoFonte(textoSimples, { base, min, limiteSeguro, fator })
    : undefined;

  const estiloFinal = fontSize ? { ...style, fontSize } : style;

  return (
    <span
      className={className}
      style={estiloFinal}
      title={title || (textoSimples || undefined)}
    >
      {children}
    </span>
  );
}

