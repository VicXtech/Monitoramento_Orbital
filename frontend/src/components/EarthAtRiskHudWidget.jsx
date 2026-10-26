import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Globe,
  Crosshair,
  Radar,
  RotateCw,
  ShieldAlert
} from 'lucide-react';
import { calcularPressaoOrbitalPorCamadas } from '../utils/orbitalPressureRadar';

/**
 * Widget Tático HUD: "A Terra em Risco" — Modo Sustentabilidade (Passo 6.1)
 * Aplica diretriz de /texto-enxuto: dados rápidos, métricas e zero parágrafos.
 */
export default function EarthAtRiskHudWidget({
  ativo,
  onAlternarModo,
  objetos = [],
  onFocarCamada,
  onResetarCamera,
  onAbrirRadarPressao,
  onAbrirInvestigacao
}) {
  const [minimizado, setMinimizado] = useState(false);

  const camadas = useMemo(() => {
    if (!ativo) return [];
    return calcularPressaoOrbitalPorCamadas(objetos);
  }, [ativo, objetos]);

  const totais = useMemo(() => {
    if (!objetos || objetos.length === 0) {
      return { total: 0, inertes: 0, taxaInertes: 0 };
    }

    let inertes = 0;
    objetos.forEach((obj) => {
      const cat = Number(obj.categoria_id);
      if (cat === 3 || cat === 5 || cat === 2 || obj.status_operacional === 'inativo') {
        inertes++;
      }
    });

    const taxaInertes = objetos.length > 0 ? Math.round((inertes / objetos.length) * 100) : 0;
    return { total: objetos.length, inertes, taxaInertes };
  }, [objetos]);

  const camadaLeoCritico = camadas.find(c => c.id === 'leo_critico');
  const camadaMeo = camadas.find(c => c.id === 'meo');
  const camadaGeo = camadas.find(c => c.id === 'geo');

  const pontuacaoLeo = camadaLeoCritico ? camadaLeoCritico.pontuacaoPressao : 86;
  const pontuacaoMeo = camadaMeo ? camadaMeo.pontuacaoPressao : 34;
  const pontuacaoGeo = camadaGeo ? camadaGeo.pontuacaoPressao : 41;

  if (!ativo) return null;

  if (minimizado) {
    return (
      <div className="earth-risk-minimized-pill" onClick={() => setMinimizado(false)}>
        <div className="earth-risk-pulse-dot" />
        <AlertTriangle size={14} className="risk-pill-icon" />
        <span className="risk-pill-title">TERRA EM RISCO</span>
        <span className="risk-pill-badge">{totais.taxaInertes}% INERTES</span>
        <button
          type="button"
          className="risk-pill-expand-btn"
          title="Expandir"
        >
          <ChevronUp size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="earth-risk-hud-widget" role="region" aria-label="Diagnóstico Terra em Risco">
      {/* CABEÇALHO */}
      <div className="earth-risk-header">
        <div className="earth-risk-header-title-box">
          <div className="earth-risk-pulse-dot" />
          <AlertTriangle size={15} className="risk-title-icon" />
          <h4 className="earth-risk-title">Terra em Risco</h4>
        </div>
        <div className="earth-risk-header-actions">
          <button
            type="button"
            className="earth-risk-icon-btn"
            onClick={() => setMinimizado(true)}
            title="Minimizar"
          >
            <ChevronDown size={15} />
          </button>
          <button
            type="button"
            className="earth-risk-exit-btn"
            onClick={onAlternarModo}
            title="Modo Orbital"
          >
            <Globe size={13} />
            <span>MODO ORBITAL</span>
          </button>
        </div>
      </div>

      {/* CORPO DO WIDGET */}
      <div className="earth-risk-body">
        {/* BANNER MACRO */}
        <div className="earth-risk-macro-banner">
          <div className="risk-stat-item highlight-red">
            <span className="risk-stat-label">OBJETOS INERTES</span>
            <span className="risk-stat-value">{totais.taxaInertes}%</span>
            <span className="risk-stat-sub">{totais.inertes.toLocaleString('pt-BR')} objetos sem controle</span>
          </div>
          <div className="risk-stat-item">
            <span className="risk-stat-label">AMEAÇA GLOBAL</span>
            <span className="risk-stat-status-badge">CRÍTICO EM LEO</span>
            <span className="risk-stat-sub">Faixa 600–1.000 km</span>
          </div>
        </div>

        {/* BARRAS DE CONGESTIONAMENTO */}
        <div className="earth-risk-layers-section">
          <div className="earth-risk-section-header">
            <span>CONGESTIONAMENTO</span>
          </div>

          {/* LEO */}
          <div className="risk-layer-bar-item">
            <div className="risk-layer-info">
              <span className="risk-layer-name">LEO (200–1.000 km)</span>
              <span className="risk-layer-pct danger">{pontuacaoLeo}%</span>
            </div>
            <div className="risk-layer-track">
              <div
                className="risk-layer-fill danger-fill"
                style={{ width: `${pontuacaoLeo}%` }}
              />
            </div>
            <div className="risk-layer-details">
              <span>{camadaLeoCritico?.densidadeEspacial || 1.82} obj/10⁹ km³</span>
              <span className="risk-tag-micro danger-tag">Crítico</span>
            </div>
          </div>

          {/* MEO */}
          <div className="risk-layer-bar-item">
            <div className="risk-layer-info">
              <span className="risk-layer-name">MEO (2.000–35.000 km)</span>
              <span className="risk-layer-pct warning">{pontuacaoMeo}%</span>
            </div>
            <div className="risk-layer-track">
              <div
                className="risk-layer-fill warning-fill"
                style={{ width: `${pontuacaoMeo}%` }}
              />
            </div>
            <div className="risk-layer-details">
              <span>Constelações GNSS</span>
              <span className="risk-tag-micro safe-tag">Moderado</span>
            </div>
          </div>

          {/* GEO */}
          <div className="risk-layer-bar-item">
            <div className="risk-layer-info">
              <span className="risk-layer-name">GEO (~35.786 km)</span>
              <span className="risk-layer-pct warning">{pontuacaoGeo}%</span>
            </div>
            <div className="risk-layer-track">
              <div
                className="risk-layer-fill warning-fill"
                style={{ width: `${pontuacaoGeo}%` }}
              />
            </div>
            <div className="risk-layer-details">
              <span>Anel equatorial</span>
              <span className="risk-tag-micro warning-tag">Saturado</span>
            </div>
          </div>
        </div>

        {/* CONTROLES DE CÂMERA */}
        <div className="earth-risk-camera-actions">
          <div className="earth-risk-section-header">
            <span>FOCAR CÂMERA</span>
          </div>
          <div className="risk-camera-btn-group">
            <button
              type="button"
              className="risk-camera-action-btn"
              onClick={() => onFocarCamada && onFocarCamada('leo_critico')}
            >
              <Crosshair size={13} />
              <span>LEO (800 km)</span>
            </button>
            <button
              type="button"
              className="risk-camera-action-btn"
              onClick={() => onFocarCamada && onFocarCamada('geo')}
            >
              <Crosshair size={13} />
              <span>GEO (36.000 km)</span>
            </button>
            <button
              type="button"
              className="risk-camera-action-btn reset-cam"
              onClick={onResetarCamera}
            >
              <RotateCw size={13} />
              <span>GLOBAL</span>
            </button>
          </div>
        </div>

        {/* LEGENDA CROMÁTICA ENXUTA */}
        <div className="earth-risk-legend-box">
          <div className="risk-legend-row">
            <span className="risk-legend-dot dot-red" />
            <span className="risk-legend-text">Detritos</span>
          </div>
          <div className="risk-legend-row">
            <span className="risk-legend-dot dot-magenta" />
            <span className="risk-legend-text">Foguetes</span>
          </div>
          <div className="risk-legend-row">
            <span className="risk-legend-dot dot-amber" />
            <span className="risk-legend-text">Inativos</span>
          </div>
          <div className="risk-legend-row">
            <span className="risk-legend-dot dot-faded" />
            <span className="risk-legend-text">Ativos (Atenuados)</span>
          </div>
        </div>

        {/* AÇÕES DE RODAPÉ */}
        <div className="earth-risk-footer-tools">
          {onAbrirRadarPressao && (
            <button
              type="button"
              className="risk-footer-btn radar-btn"
              onClick={onAbrirRadarPressao}
            >
              <Radar size={14} />
              <span>RADAR</span>
            </button>
          )}
          {onAbrirInvestigacao && (
            <button
              type="button"
              className="risk-footer-btn hub-btn"
              onClick={onAbrirInvestigacao}
            >
              <ShieldAlert size={14} />
              <span>INVESTIGAÇÃO</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
