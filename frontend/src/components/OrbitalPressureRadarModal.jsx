import { useState, useMemo } from 'react';
import {
  X,
  Radar,
  Layers,
  AlertTriangle,
  ShieldAlert,
  Compass,
  Activity,
  Flame,
  Globe,
  Radio,
  ExternalLink,
  Info
} from 'lucide-react';
import {
  calcularPressaoOrbitalPorCamadas
} from '../utils/orbitalPressureRadar';

/**
 * Modal Tático: Radar de Pressão Orbital & Densidade por Camadas (Passo 5.1)
 * Permite auditar a saturação e concentração de objetos em LEO, MEO e GEO.
 * 
 * Regra: Ausência estrita de emojis em textos conforme diretrizes acadêmicas.
 */
export default function OrbitalPressureRadarModal({
  aberto,
  onFechar,
  objetos = [],
  onFocarCamadaNoGlobo
}) {
  const [metricaAtiva, setMetricaAtiva] = useState('pressao'); // 'pressao' | 'densidade' | 'detritos' | 'ativos'
  const [camadaSelecionadaId, setCamadaSelecionadaId] = useState('leo_critico');

  // Processa as métricas de pressão para cada camada em tempo real
  const camadasProcessadas = useMemo(() => {
    if (!aberto) return [];
    return calcularPressaoOrbitalPorCamadas(objetos);
  }, [aberto, objetos]);

  const camadaAtiva = useMemo(() => {
    return camadasProcessadas.find((c) => c.id === camadaSelecionadaId) || camadasProcessadas[0] || null;
  }, [camadasProcessadas, camadaSelecionadaId]);

  if (!aberto) return null;

  const handleSelecionarCamada = (id) => {
    setCamadaSelecionadaId(id);
  };

  const handleFocarCamada = (camada) => {
    if (onFocarCamadaNoGlobo && camada) {
      onFocarCamadaNoGlobo(camada);
      onFechar();
    }
  };

  // Cores dinâmicas para os anéis de radar
  const obterValorMetrica = (camada) => {
    switch (metricaAtiva) {
      case 'densidade':
        return `${camada.densidadeEspacial} obj/10⁹ km³`;
      case 'detritos':
        return `${camada.taxaDetritosPct}% detritos`;
      case 'ativos':
        return `${camada.taxaAtivosPct}% ativos`;
      case 'pressao':
      default:
        return `${camada.pontuacaoPressao}/100`;
    }
  };

  return (
    <div className="hud-modal-backdrop modal-opening" onClick={onFechar}>
      <div
        className="hud-modal-card orbital-pressure-modal-card card-opening"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* CABEÇALHO DO RADAR DE PRESSÃO */}
        <div className="modal-header pressure-modal-header">
          <div className="pressure-header-left">
            <div className="pressure-header-badge">
              <Radar size={16} className="radar-sweep-icon" />
              <span>RADAR DE PRESSÃO</span>
            </div>
            <h3 className="pressure-modal-title">
              Pressão Orbital por Altitude
            </h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onFechar}
            title="Fechar Radar de Pressão"
          >
            <X size={18} />
          </button>
        </div>

        {/* CORPO DO RADAR */}
        <div className="modal-body-scrollable pressure-modal-body">
          {/* BARRA DE CONTROLE: SELETOR DE MÉTRICA DE VISUALIZAÇÃO */}
          <div className="pressure-metric-selector-bar">
            <span className="pressure-metric-label">
              <Layers size={13} />
              MÉTRICA:
            </span>
            <div className="pressure-pills-wrap">
              {[
                { id: 'pressao', rotulo: 'Pressão', desc: 'Saturação e risco' },
                { id: 'densidade', rotulo: 'Densidade', desc: 'Objetos / 10⁹ km³' },
                { id: 'detritos', rotulo: 'Detritos', desc: 'Percentual de inertes' },
                { id: 'ativos', rotulo: 'Ativos', desc: 'Percentual operacional' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`pressure-pill-btn ${metricaAtiva === m.id ? 'active' : ''}`}
                  onClick={() => setMetricaAtiva(m.id)}
                  title={m.desc}
                >
                  {m.rotulo}
                </button>
              ))}
            </div>
          </div>

          <div className="pressure-main-grid">
            {/* COLUNA ESQUERDA: DISPLAY GRÁFICO POLAR DO RADAR */}
            <div className="pressure-radar-display-column">
              <div className="pressure-radar-circle-wrap">
                <svg
                  className="pressure-polar-svg"
                  viewBox="-160 -160 320 320"
                  aria-hidden="true"
                >
                  {/* Gradientes e Filtros de Brilho */}
                  <defs>
                    <radialGradient id="earthGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.4" />
                      <stop offset="65%" stopColor="#003366" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#020817" stopOpacity="1" />
                    </radialGradient>
                    <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Linhas de Mira Cruzada / Eixos Cardeais */}
                  <line x1="-155" y1="0" x2="155" y2="0" stroke="rgba(0, 240, 255, 0.15)" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="0" y1="-155" x2="0" y2="155" stroke="rgba(0, 240, 255, 0.15)" strokeWidth="1" strokeDasharray="3,3" />

                  {/* 5 Cascas Orbitais Concêntricas com Raios Proporcionais Didáticos */}
                  {/* 1. LEO Inferior (r = 45) */}
                  <circle
                    cx="0"
                    cy="0"
                    r="46"
                    fill="none"
                    stroke={camadasProcessadas[0]?.corRisco || 'var(--neon-cyan)'}
                    strokeWidth={camadaSelecionadaId === 'leo_baixo' ? '3.5' : '1.8'}
                    strokeDasharray={camadaSelecionadaId === 'leo_baixo' ? 'none' : '4,2'}
                    className="radar-ring-interactive"
                    onClick={() => handleSelecionarCamada('leo_baixo')}
                  />

                  {/* 2. LEO Médio-Crítico (r = 72) */}
                  <circle
                    cx="0"
                    cy="0"
                    r="72"
                    fill="none"
                    stroke={camadasProcessadas[1]?.corRisco || 'var(--neon-red)'}
                    strokeWidth={camadaSelecionadaId === 'leo_critico' ? '3.8' : '2'}
                    strokeDasharray={camadaSelecionadaId === 'leo_critico' ? 'none' : '5,3'}
                    className="radar-ring-interactive"
                    onClick={() => handleSelecionarCamada('leo_critico')}
                  />

                  {/* 3. LEO Superior (r = 98) */}
                  <circle
                    cx="0"
                    cy="0"
                    r="98"
                    fill="none"
                    stroke={camadasProcessadas[2]?.corRisco || 'var(--neon-amber)'}
                    strokeWidth={camadaSelecionadaId === 'leo_alto' ? '3.5' : '1.6'}
                    strokeDasharray={camadaSelecionadaId === 'leo_alto' ? 'none' : '6,3'}
                    className="radar-ring-interactive"
                    onClick={() => handleSelecionarCamada('leo_alto')}
                  />

                  {/* 4. MEO (r = 126) */}
                  <circle
                    cx="0"
                    cy="0"
                    r="126"
                    fill="none"
                    stroke={camadasProcessadas[3]?.corRisco || 'var(--neon-green)'}
                    strokeWidth={camadaSelecionadaId === 'meo' ? '3.5' : '1.4'}
                    strokeDasharray={camadaSelecionadaId === 'meo' ? 'none' : '7,4'}
                    className="radar-ring-interactive"
                    onClick={() => handleSelecionarCamada('meo')}
                  />

                  {/* 5. GEO (r = 150) */}
                  <circle
                    cx="0"
                    cy="0"
                    r="150"
                    fill="none"
                    stroke={camadasProcessadas[4]?.corRisco || 'var(--neon-cyan)'}
                    strokeWidth={camadaSelecionadaId === 'geo' ? '3.5' : '1.6'}
                    strokeDasharray={camadaSelecionadaId === 'geo' ? 'none' : '3,3'}
                    className="radar-ring-interactive"
                    onClick={() => handleSelecionarCamada('geo')}
                  />

                  {/* Varredura Laser de Radar (Animação Circular Contínua) */}
                  <path
                    d="M 0 0 L 150 0 A 150 150 0 0 0 106 -106 Z"
                    fill="url(#radarSweepGradient)"
                    className="radar-beam-sweep"
                    opacity="0.25"
                  />
                  <line
                    x1="0"
                    y1="0"
                    x2="150"
                    y2="0"
                    stroke="var(--neon-cyan)"
                    strokeWidth="1.5"
                    className="radar-beam-line"
                  />

                  {/* Terra Central com Atmosfera Holográfica */}
                  <circle cx="0" cy="0" r="26" fill="url(#earthGlow)" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="1.2" />
                  <circle cx="0" cy="0" r="23" fill="#030c1e" />
                  <text x="0" y="3.5" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontFamily="var(--mono-font)" fontWeight="700" letterSpacing="0.6">
                    TERRA
                  </text>
                </svg>

                <div className="radar-legend-tag">
                  <Radio size={12} className="radar-pulse-anim" />
                  <span>VARREDURA RADIAL MULTICAMADA</span>
                </div>
              </div>

              {/* LISTA RÁPIDA DE ANÉIS COM SELEÇÃO DIRETA */}
              <div className="pressure-rings-quicklist">
                {camadasProcessadas.map((c) => {
                  const isSel = c.id === camadaSelecionadaId;
                  return (
                    <div
                      key={c.id}
                      className={`pressure-quick-item ${isSel ? 'active' : ''}`}
                      onClick={() => handleSelecionarCamada(c.id)}
                    >
                      <span className="pressure-dot-indicator" style={{ backgroundColor: c.corRisco }}></span>
                      <div className="pressure-quick-info">
                        <strong className="pressure-quick-sigla">{c.sigla}</strong>
                        <span className="pressure-quick-faixa">{c.faixaAltitudeKm[0]}–{c.faixaAltitudeKm[1]} km</span>
                      </div>
                      <span className="pressure-quick-metric" style={{ color: c.corRisco }}>
                        {obterValorMetrica(c)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLUNA DIREITA: DOSSIÊ DETALHADO DA CAMADA SELECIONADA */}
            {camadaAtiva && (
              <div className="pressure-layer-detail-column">
                <div className="pressure-card-header-group">
                  <div className="pressure-title-row">
                    <div>
                      <span className="pressure-badge-sigla" style={{ color: camadaAtiva.corRisco, borderColor: camadaAtiva.corRisco }}>
                        CAMADA {camadaAtiva.sigla} ({camadaAtiva.regime})
                      </span>
                      <h4 className="pressure-layer-name">{camadaAtiva.nome}</h4>
                      <span className="pressure-layer-altitude">
                        Altitude: {camadaAtiva.faixaAltitudeKm[0].toLocaleString('pt-BR')}–{camadaAtiva.faixaAltitudeKm[1].toLocaleString('pt-BR')} km (Média {camadaAtiva.altitudeMediaKm.toLocaleString('pt-BR')} km)
                      </span>
                    </div>

                    <div className="pressure-score-box" style={{ borderColor: camadaAtiva.corRisco }}>
                      <span className="pressure-score-lbl">PRESSÃO</span>
                      <div className="pressure-score-val" style={{ color: camadaAtiva.corRisco }}>
                        {camadaAtiva.pontuacaoPressao}
                        <span className="pressure-score-scale">/100</span>
                      </div>
                      <span className="pressure-risk-tag" style={{ backgroundColor: `${camadaAtiva.corRisco}22`, color: camadaAtiva.corRisco }}>
                        {camadaAtiva.nivelRisco}
                      </span>
                    </div>
                  </div>

                  {/* BARRA DE SATURAÇÃO GRÁFICA */}
                  <div className="pressure-gauge-track">
                    <div
                      className="pressure-gauge-fill"
                      style={{
                        width: `${camadaAtiva.pontuacaoPressao}%`,
                        backgroundColor: camadaAtiva.corRisco,
                        boxShadow: `0 0 12px ${camadaAtiva.corRisco}`
                      }}
                    />
                  </div>
                </div>

                {/* MÉTRICAS DE DENSIDADE E POPULAÇÃO NA CAMADA */}
                <div className="pressure-stats-grid">
                  <div className="pressure-stat-item">
                    <span className="p-stat-lbl">OBJETOS</span>
                    <strong className="p-stat-num" style={{ color: '#ffffff' }}>
                      {camadaAtiva.totalObjetos.toLocaleString('pt-BR')}
                    </strong>
                    <span className="p-stat-sub">Na camada</span>
                  </div>

                  <div className="pressure-stat-item">
                    <span className="p-stat-lbl">DENSIDADE</span>
                    <strong className="p-stat-num" style={{ color: 'var(--neon-cyan)' }}>
                      {camadaAtiva.densidadeEspacial}
                    </strong>
                    <span className="p-stat-sub">Obj / 10⁹ km³</span>
                  </div>

                  <div className="pressure-stat-item">
                    <span className="p-stat-lbl">ATIVOS</span>
                    <strong className="p-stat-num" style={{ color: 'var(--neon-green)' }}>
                      {camadaAtiva.ativos.toLocaleString('pt-BR')}
                    </strong>
                    <span className="p-stat-sub">{camadaAtiva.taxaAtivosPct}%</span>
                  </div>

                  <div className="pressure-stat-item">
                    <span className="p-stat-lbl">DETRITOS</span>
                    <strong className="p-stat-num" style={{ color: 'var(--neon-red)' }}>
                      {camadaAtiva.inertesTotal.toLocaleString('pt-BR')}
                    </strong>
                    <span className="p-stat-sub">{camadaAtiva.taxaDetritosPct}%</span>
                  </div>
                </div>

                {/* DOSSIÊ CONTEXTUAL DA CAMADA */}
                <div className="pressure-narrative-card">
                  <div className="p-narrative-header">
                    <Info size={14} style={{ color: 'var(--neon-cyan)' }} />
                    <h5>DIAGNÓSTICO</h5>
                  </div>
                  <p className="p-narrative-desc">{camadaAtiva.descricao}</p>
                  
                  <div className="p-narrative-extra">
                    <span className="p-extra-lbl">PRINCIPAIS:</span>
                    <span className="p-extra-val">{camadaAtiva.principaisHabitantes}</span>
                  </div>
                </div>

                {/* AÇÃO PRINCIPAL: FOCAR CÂMERA DO GLOBO CESIUM NA CAMADA */}
                <div className="pressure-actions-bottom">
                  <button
                    type="button"
                    className="pressure-fly-btn"
                    onClick={() => handleFocarCamada(camadaAtiva)}
                    title={`Ajustar visão 3D para ${camadaAtiva.nome}`}
                  >
                    <Compass size={16} />
                    <span>FOCAR CÂMERA ({camadaAtiva.sigla})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
