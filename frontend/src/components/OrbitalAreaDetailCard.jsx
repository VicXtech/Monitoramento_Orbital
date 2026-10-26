import { X, RotateCcw, Layers } from 'lucide-react';

export default function OrbitalAreaDetailCard({
  areaInfo,
  onFechar,
  onResetarCamera
}) {
  if (!areaInfo) return null;

  return (
    <aside className="orbital-area-detail-panel" role="region" aria-label="Detalhes da Área Orbital">
      <div className="orbital-area-header">
        <div className="orbital-area-title-group">
          <span className="orbital-area-badge" style={{ borderColor: areaInfo.corPadrao, color: areaInfo.corPadrao }}>
            {areaInfo.sigla}
          </span>
          <h3 className="orbital-area-title">{areaInfo.nome}</h3>
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
          <strong>Altitude:</strong> {areaInfo.faixaFormatada}
        </span>
      </div>

      <div className="orbital-area-metrics-grid">
        <div className="orbital-area-metric-box">
          <span className="metric-box-label">Objetos</span>
          <span className="metric-box-value">
            {areaInfo.totalObjetos.toLocaleString('pt-BR')}
          </span>
        </div>

        <div className="orbital-area-metric-box">
          <span className="metric-box-label">Ativos</span>
          <span className="metric-box-value" style={{ color: '#00ffcc' }}>
            {areaInfo.taxaAtivosPct}%
          </span>
        </div>

        <div className="orbital-area-metric-box">
          <span className="metric-box-label">Detritos</span>
          <span className="metric-box-value" style={{ color: '#ffaa00' }}>
            {areaInfo.taxaDetritosPct}%
          </span>
        </div>
      </div>

      <div className="orbital-subdivisions-section">
        <div className="subdivisions-header">
          <Layers size={13} style={{ color: areaInfo.corPadrao }} />
          <span>Subdivisões</span>
        </div>
        <ul className="subdivisions-list">
          {areaInfo.subdivisoes.map((sub, idx) => (
            <li key={idx} className="subdivision-item">
              <strong className="subdivision-name">{sub.nome}</strong>
              <span className="subdivision-desc">{sub.descricao}</span>
            </li>
          ))}
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
