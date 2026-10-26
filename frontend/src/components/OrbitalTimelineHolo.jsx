import { useRef, useEffect } from 'react';

const ANOS_MARCO = [
  1957, 1965, 1970, 1980, 1990, 1996, 2000, 2002, 2007, 2009, 2015, 2020, 2021, 2024, 2026
];

function obterAnosAdjacentes(anoAtual) {
  const idx = ANOS_MARCO.indexOf(anoAtual);
  if (idx !== -1) {
    const prev2 = idx > 1 ? ANOS_MARCO[idx - 2] : null;
    const prev1 = idx > 0 ? ANOS_MARCO[idx - 1] : null;
    const next1 = idx < ANOS_MARCO.length - 1 ? ANOS_MARCO[idx + 1] : null;
    const next2 = idx < ANOS_MARCO.length - 2 ? ANOS_MARCO[idx + 2] : null;
    return { prev2, prev1, atual: anoAtual, next1, next2 };
  }

  return {
    prev2: anoAtual - 2 >= 1957 ? anoAtual - 2 : null,
    prev1: anoAtual - 1 >= 1957 ? anoAtual - 1 : null,
    atual: anoAtual,
    next1: anoAtual + 1 <= 2026 ? anoAtual + 1 : null,
    next2: anoAtual + 2 <= 2026 ? anoAtual + 2 : null
  };
}

export default function OrbitalTimelineHolo({
  ano,
  onAlterarAno
}) {
  const containerRef = useRef(null);
  const anoAnteriorRef = useRef(ano);
  const travaRodaRef = useRef(false);

  const direcaoTransicao = ano >= anoAnteriorRef.current ? 'forward' : 'backward';

  useEffect(() => {
    anoAnteriorRef.current = ano;
  }, [ano]);

  const { prev2, prev1, atual, next1, next2 } = obterAnosAdjacentes(ano);

  const handleWheel = (e) => {
    e.preventDefault();
    if (travaRodaRef.current) return;

    if (e.deltaY > 0 && next1) {
      travaRodaRef.current = true;
      onAlterarAno(next1);
      setTimeout(() => {
        travaRodaRef.current = false;
      }, 300);
    } else if (e.deltaY < 0 && prev1) {
      travaRodaRef.current = true;
      onAlterarAno(prev1);
      setTimeout(() => {
        travaRodaRef.current = false;
      }, 300);
    }
  };

  return (
    <div
      className="holo-timeline-dock"
      ref={containerRef}
      onWheel={handleWheel}
      role="region"
      aria-label="Linha do Tempo Holográfica"
    >
      <div className="holo-timeline-glass">
        <div className="holo-timeline-ribbon">
          {/* Slot 1: Marco anterior distante */}
          <div className="holo-slot far prev">
            {prev2 ? (
              <button
                type="button"
                className="holo-year-pill far"
                onClick={() => onAlterarAno(prev2)}
                title={`Ir para ${prev2}`}
              >
                {prev2}
              </button>
            ) : (
              <div className="holo-slot-spacer" />
            )}
          </div>

          {/* Slot 2: Marco anterior imediato */}
          <div className="holo-slot near prev">
            {prev1 ? (
              <button
                type="button"
                className="holo-year-pill near"
                onClick={() => onAlterarAno(prev1)}
                title={`Ir para ${prev1}`}
              >
                {prev1}
              </button>
            ) : (
              <div className="holo-slot-spacer" />
            )}
          </div>

          {/* Slot 3: Marco atual selecionado (sempre rigorosamente centralizado na tela) */}
          <div className="holo-slot center">
            <div
              key={atual}
              className={`holo-year-pill active holo-trans-${direcaoTransicao}`}
              aria-current="step"
            >
              <div className="holo-flare-star" />
              <span className="holo-year-glow">{atual}</span>
              <div className="holo-cursor-laser" />
            </div>
          </div>

          {/* Slot 4: Marco posterior imediato */}
          <div className="holo-slot near next">
            {next1 ? (
              <button
                type="button"
                className="holo-year-pill near"
                onClick={() => onAlterarAno(next1)}
                title={`Ir para ${next1}`}
              >
                {next1}
              </button>
            ) : (
              <div className="holo-slot-spacer" />
            )}
          </div>

          {/* Slot 5: Marco posterior distante */}
          <div className="holo-slot far next">
            {next2 ? (
              <button
                type="button"
                className="holo-year-pill far"
                onClick={() => onAlterarAno(next2)}
                title={`Ir para ${next2}`}
              >
                {next2}
              </button>
            ) : (
              <div className="holo-slot-spacer" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
