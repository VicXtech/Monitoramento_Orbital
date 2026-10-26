import { X, RotateCcw, Radio } from 'lucide-react';

export default function OrbitalEventDetailCard({
  evento,
  onFechar,
  onResetarCamera
}) {
  if (!evento) return null;

  return (
    <aside className="orbital-area-detail-panel orbital-event-detail-panel" role="region" aria-label="Estudo de Caso Orbital">
      <div className="orbital-area-header">
        <div className="orbital-area-title-group">
          <span className="orbital-area-badge" style={{ borderColor: '#00f0ff', color: '#00f0ff' }}>
            {evento.ano}
          </span>
          <h3 className="orbital-area-title">{evento.nome}</h3>
        </div>
        <button
          type="button"
          className="orbital-area-close-btn"
          onClick={onFechar}
          title="Fechar"
          aria-label="Fechar"
        >
          <X size={15} />
        </button>
      </div>

      <div className="orbital-area-meta-row">
        <span className="orbital-area-meta-item">
          <strong>Data:</strong> {evento.data}
        </span>
      </div>

      <div className="orbital-area-metrics-grid">
        <div className="orbital-area-metric-box">
          <span className="metric-box-label">Altitude</span>
          <span className="metric-box-value" style={{ color: '#00f0ff' }}>
            {evento.altitudeKm} km
          </span>
        </div>

        <div className="orbital-area-metric-box">
          <span className="metric-box-label">Fragmentos</span>
          <span className="metric-box-value" style={{ color: evento.fragmentosGerados > 0 ? '#ffaa00' : '#00ffcc' }}>
            {evento.fragmentosGerados.toLocaleString('pt-BR')}
          </span>
        </div>

        <div className="orbital-area-metric-box">
          <span className="metric-box-label">Registro</span>
          <span className="metric-box-value" style={{ color: '#ffffff', fontSize: '12px' }}>
            Oficial
          </span>
        </div>
      </div>

      <div className="orbital-subdivisions-section">
        <div className="subdivisions-header">
          <Radio size={13} style={{ color: '#00f0ff' }} />
          <span>Fatos Documentados</span>
        </div>
        <ul className="subdivisions-list">
          <li className="subdivision-item">
            <strong className="subdivision-name">Objetos</strong>
            <span className="subdivision-desc">{evento.objetos}</span>
          </li>
          <li className="subdivision-item">
            <strong className="subdivision-name">Causa</strong>
            <span className="subdivision-desc">{evento.causa}</span>
          </li>
          <li className="subdivision-item">
            <strong className="subdivision-name">Consequências</strong>
            <span className="subdivision-desc">{evento.consequencias}</span>
          </li>
        </ul>
      </div>

      <div className="orbital-area-footer">
        <button
          type="button"
          className="orbital-area-reset-btn"
          onClick={onResetarCamera}
        >
          <RotateCcw size={13} />
          <span>Visão Geral</span>
        </button>
      </div>
    </aside>
  );
}
