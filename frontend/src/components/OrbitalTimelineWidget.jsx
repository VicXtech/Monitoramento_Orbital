import { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import {
  MARCOS_HISTORICOS_ORBITAIS,
  obterDadosAno
} from '../utils/orbitalTimeline';

/**
 * Componente da Linha do Tempo Macro (1957–2050) — OrbitalED (Passo 3.1)
 * Estruturado como uma Aba Inferior Central Interativa e recolhível.
 * Oferece exploração factual e analítica da evolução histórica e projeções de sustentabilidade.
 */
export default function OrbitalTimelineWidget({
  aberto,
  onAlternarAberto,
  onAbrirSimuladorCenarios
}) {
  const [ano, setAno] = useState(2026);
  const [reproduzindo, setReproduzindo] = useState(false);
  const playTimerRef = useRef(null);

  const dadosAno = obterDadosAno(ano);

  // Animação de reprodução temporal contínua (1957 -> 2050)
  useEffect(() => {
    if (!reproduzindo) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      return;
    }

    playTimerRef.current = setInterval(() => {
      setAno((prev) => {
        if (prev >= 2050) {
          setReproduzindo(false);
          return 2050;
        }
        return prev + 1;
      });
    }, 180);

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [reproduzindo]);

  const handleTogglePlay = () => {
    if (ano >= 2050 && !reproduzindo) {
      setAno(1957);
      setReproduzindo(true);
    } else {
      setReproduzindo(!reproduzindo);
    }
  };

  const handleResetHoje = () => {
    setReproduzindo(false);
    setAno(2026);
  };

  return (
    <div className={`orbital-timeline-tab-dock ${aberto ? 'expanded' : 'collapsed'}`}>
      {/* 1. ESTADO RECOLHIDO: ABA INFERIOR CENTRAL CLICÁVEL */}
      {!aberto ? (
        <button
          type="button"
          className="timeline-bottom-tab-trigger"
          onClick={onAlternarAberto}
          title="Abrir Linha do Tempo Macro (1957–2050)"
          aria-expanded={false}
        >
          <div className="tab-pulse-dot" />
          <Clock size={14} className="tab-clock-icon" />
          <span className="tab-title">Evolução Orbital (1957–2050)</span>
          <span className="tab-badge-year">{ano}</span>
          <ChevronUp size={14} className="tab-chevron" />
        </button>
      ) : (
        /* 2. ESTADO EXPANDIDO: DRAWER INFORMATIVO COMPLETO NO CENTRO INFERIOR */
        <div className="timeline-expanded-drawer-wrapper">
          {/* PUXADOR / ALÇA DE FECHAMENTO RÁPIDO NO TOPO DO DRAWER */}
          <div
            className="timeline-drawer-top-handle"
            onClick={onAlternarAberto}
            title="Recolher"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onAlternarAberto(); }}
          >
            <ChevronDown size={14} className="handle-chevron" />
            <span>Recolher</span>
            <ChevronDown size={14} className="handle-chevron" />
          </div>

          <div className="timeline-expanded-drawer">
            {/* CABEÇALHO COM TÍTULO E AÇÕES */}
            <div className="timeline-drawer-header">
              <div className="timeline-header-title-box">
                <Clock size={18} className="timeline-drawer-icon" />
                <h3 className="timeline-title">Evolução Orbital</h3>
              </div>

              <div className="timeline-drawer-actions">
                {onAbrirSimuladorCenarios && (
                  <button
                    type="button"
                    className="timeline-action-btn scenario-trigger-btn"
                    onClick={onAbrirSimuladorCenarios}
                    title="Simulador de Cenários"
                  >
                    <Sparkles size={13} style={{ color: 'var(--neon-amber)' }} />
                    <span>Cenários</span>
                  </button>
                )}

                <button
                  type="button"
                  className={`timeline-action-btn ${reproduzindo ? 'playing' : ''}`}
                  onClick={handleTogglePlay}
                  title={reproduzindo ? "Pausar" : "Reproduzir"}
                >
                  {reproduzindo ? <Pause size={13} /> : <Play size={13} />}
                  <span>{reproduzindo ? "Pausar" : "Reproduzir"}</span>
                </button>

                <button
                  type="button"
                  className={`timeline-action-btn reset-btn ${ano === 2026 ? 'is-today' : ''}`}
                  onClick={handleResetHoje}
                  title="Voltar para o presente"
                >
                  <RotateCcw size={12} />
                  <span>Hoje</span>
                </button>

                <button
                  type="button"
                  className="timeline-action-btn close-btn"
                  onClick={onAlternarAberto}
                  title="Fechar"
                >
                  <ChevronDown size={14} />
                  <span>Fechar</span>
                </button>
              </div>
            </div>

            {/* SEÇÃO DA RÉGUA SLIDER & MARCOS HISTÓRICOS */}
            <div className="timeline-slider-section">
              <div className="timeline-slider-track-box">
                <input
                  type="range"
                  min="1957"
                  max="2050"
                  step="1"
                  value={ano}
                  onChange={(e) => {
                    setReproduzindo(false);
                    setAno(parseInt(e.target.value, 10));
                  }}
                  className="timeline-slider-input"
                  aria-label="Ano da linha do tempo orbital"
                />
              </div>

              {/* MARCOS TEMPORAIS INTERATIVOS */}
              <div className="timeline-milestones-list">
                {MARCOS_HISTORICOS_ORBITAIS.map((marco) => {
                  const isSel = ano === marco.ano;
                  const isHoje = marco.ano === 2026;

                  return (
                    <button
                      key={marco.ano}
                      type="button"
                      className={`milestone-pill-btn ${isSel ? 'active' : ''} ${isHoje ? 'today' : ''}`}
                      onClick={() => {
                        setReproduzindo(false);
                        setAno(marco.ano);
                      }}
                      title={`${marco.titulo} (${marco.ano})`}
                    >
                      <span className="milestone-dot" />
                      <span className="milestone-label">{marco.label}</span>
                      {isHoje && <span className="milestone-now-tag">AGORA</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PAINEL INFORMATIVO DO ANO SELECIONADO */}
            <div className="timeline-info-grid">
              {/* HERÓI DO ANO */}
              <div className="timeline-year-hero">
                <span className="hero-status-tag">
                  {dadosAno.isPassado ? 'HISTÓRICO' : dadosAno.isAtual ? 'PRESENTE' : 'PROJEÇÃO'}
                </span>
                <span className={`hero-year-val ${dadosAno.isAtual ? 'cyan' : dadosAno.isFuturo ? 'amber' : ''}`}>
                  {dadosAno.ano}
                </span>
              </div>

              {/* 4 CARDS DE MÉTRICAS */}
              <div className="timeline-metrics-quad">
                {/* 1. Objetos */}
                <div className="timeline-metric-card">
                  <span className="m-card-title">OBJETOS</span>
                  <div className="m-card-val-row">
                    <span className="m-card-num">{dadosAno.totalObjetos.toLocaleString('pt-BR')}</span>
                    {dadosAno.ano !== 2026 && (
                      <span className={`m-card-delta ${dadosAno.deltaObjetosPct > 0 ? 'delta-up' : 'delta-down'}`}>
                        {dadosAno.deltaObjetosPct > 0 ? `+${dadosAno.deltaObjetosPct}%` : `${dadosAno.deltaObjetosPct}%`}
                      </span>
                    )}
                  </div>
                  <span className="m-card-hint">
                    {dadosAno.isPassado ? 'histórico' : dadosAno.isFuturo ? 'projeção' : 'em órbita'}
                  </span>
                </div>

                {/* 2. Composição */}
                <div className="timeline-metric-card">
                  <span className="m-card-title">COMPOSIÇÃO</span>
                  <div className="m-card-val-row">
                    <span className="m-card-num" style={{ color: 'var(--neon-green)' }}>
                      {dadosAno.satelitesAtivosPct}%
                    </span>
                    <span className="m-card-sep">/</span>
                    <span className="m-card-num" style={{ color: 'var(--neon-red)' }}>
                      {dadosAno.detritosPct}%
                    </span>
                  </div>
                  <span className="m-card-hint">Ativos / Detritos</span>
                </div>

                {/* 3. Congestionamento LEO */}
                <div className="timeline-metric-card">
                  <span className="m-card-title">CONGESTIONAMENTO</span>
                  <div className="m-card-val-row">
                    <span className="m-card-num">{dadosAno.congestionamentoLeoPct}%</span>
                  </div>
                  <div className="m-card-bar-track">
                    <div
                      className="m-card-bar-fill"
                      style={{
                        width: `${dadosAno.congestionamentoLeoPct}%`,
                        backgroundColor: dadosAno.congestionamentoLeoPct > 80 ? 'var(--neon-red)' : 'var(--neon-cyan)'
                      }}
                    />
                  </div>
                </div>

                {/* 4. ISO */}
                <div className="timeline-metric-card iso-metric-card">
                  <span className="m-card-title">SUSTENTABILIDADE (ISO)</span>
                  <div className="m-card-val-row">
                    <span className="m-card-num" style={{ color: dadosAno.corIso }}>
                      {dadosAno.isoScore}
                    </span>
                    <span className="m-card-denom">/ 100</span>
                    <span
                      className="m-card-badge"
                      style={{ color: dadosAno.corIso, borderColor: dadosAno.corIso }}
                    >
                      {dadosAno.classificacaoIso}
                    </span>
                  </div>
                  <span className="m-card-hint">Pressão ambiental</span>
                </div>
              </div>

              {/* DOSSIÊ FACTUAL CIENTÍFICO */}
              <div className="timeline-dossier-card">
                <div className="dossier-title-row">
                  <Sparkles size={14} style={{ color: 'var(--neon-amber)', flexShrink: 0 }} />
                  <h4 className="dossier-heading">{dadosAno.titulo}</h4>
                </div>
                <p className="dossier-summary">{dadosAno.descricao}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
