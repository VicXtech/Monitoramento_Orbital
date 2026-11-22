import { CAMADAS_ORBITAIS } from '../data/orbitalModeData';

const ORDEM_CAMADAS = ['leo', 'meo', 'geo', 'heo'];

// Renderiza seletor rapido das camadas orbitais
export function OrbitalLayerDock({ camadaAtivaId, onSelecionarCamada }) {
  return (
    <div className="orbital-layer-dock" role="navigation" aria-label="Seletor de camadas orbitais">
      {ORDEM_CAMADAS.map((id) => {
        const cam = CAMADAS_ORBITAIS[id];
        if (!cam) return null;
        const ativo = camadaAtivaId?.toLowerCase() === id;
        const nomeCurto = cam.nome
          .replace('Órbita Terrestre ', '')
          .replace('Órbita ', '');

        return (
          <button
            key={id}
            type="button"
            className={`orbital-dock-btn ${ativo ? 'active' : ''}`}
            onClick={() => onSelecionarCamada(id)}
            style={
              ativo
                ? {
                    borderColor: cam.cor,
                    borderBottomColor: cam.cor,
                    background: `linear-gradient(180deg, ${cam.cor}1F 0%, ${cam.cor}08 100%)`
                  }
                : undefined
            }
          >
            <span
              className="dock-layer-sigla"
              style={{ color: ativo ? cam.cor : 'var(--text-primary)' }}
            >
              [{cam.sigla}]
            </span>
            <span className="dock-layer-name">{nomeCurto}</span>
          </button>
        );
      })}
    </div>
  );
}

export default OrbitalLayerDock;
