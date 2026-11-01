import React from 'react';
import { motion } from 'motion/react';

export default function OrbitalAtmosphereCrossSection({ camadaAtual }) {
  if (!camadaAtual?.corteAtmosfera) return null;

  const { tipo, rotulo, desc, particulas } = camadaAtual.corteAtmosfera;
  const cor = camadaAtual.cor || '#00f0ff';

  return (
    <div className="orbital-widget-box atmosphere-cross-section">
      <div className="atmosphere-header">
        <span className="orbital-widget-heading">Destino na Reentrada</span>
        <span className={`reentry-type-pill ${tipo}`}>{rotulo}</span>
      </div>
      <p className="atmosphere-desc">{desc}</p>

      {/* Diagrama de Corte Vertical das Camadas */}
      <div className="atmosphere-layers-visual">
        <div className="atmosphere-layer-row space">
          <span className="layer-tag">Espaço (&gt;100 km)</span>
          <div className="layer-content">
            {tipo === 'sem_reentrada' && (
              <motion.div
                className="orbiting-dot-stay"
                animate={{ x: [0, 160, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ backgroundColor: cor }}
              />
            )}
          </div>
        </div>

        <div className="atmosphere-layer-row mesosphere">
          <span className="layer-tag">Mesosfera (85 km)</span>
          <div className="layer-content">
            {tipo === 'quimica' && (
              <motion.div
                className="falling-debris-burn"
                animate={{ y: [0, 24], opacity: [1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeIn' }}
              />
            )}
            {tipo === 'destrocos' && (
              <motion.div
                className="falling-heavy-stage"
                animate={{ y: [0, 48], opacity: [1, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeIn' }}
              />
            )}
          </div>
        </div>

        <div className="atmosphere-layer-row stratosphere">
          <span className="layer-tag">Estratosfera (50 km)</span>
          <div className="layer-content">
            {tipo === 'quimica' && (
              <div className="chemical-particles-cloud">
                <motion.div
                  className="chemical-particle al"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.9, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="chemical-particle li"
                  animate={{ scale: [1.2, 0.9, 1.2], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: 0.5 }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="atmosphere-layer-row ground">
          <span className="layer-tag">Solo / Mar (0 km)</span>
          <div className="layer-content">
            {tipo === 'destrocos' && (
              <motion.div
                className="splash-nemo"
                animate={{ scale: [0.8, 1.6, 0.8], opacity: [0.9, 0.2, 0.9] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Etiquetas dos poluentes ou caracteristicas */}
      {particulas && particulas.length > 0 && (
        <div className="atmosphere-tags-row">
          {particulas.map((p, idx) => (
            <span key={idx} className="atmosphere-particle-badge">
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
