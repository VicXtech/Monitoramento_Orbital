import React from 'react';
import { motion } from 'motion/react';

export default function OrbitalDensityChamber({ camadaAtual }) {
  if (!camadaAtual?.camaraDensidade) return null;

  const { rotulo, alerta, nivel, particulasCount } = camadaAtual.camaraDensidade;
  const cor = camadaAtual.cor || '#00f0ff';

  // Gera pontos com angulos e raios estaveis para a simulacao visual
  const particulas = Array.from({ length: particulasCount }).map((_, i) => ({
    id: i,
    angle: (i * 360) / particulasCount,
    r: 15 + ((i * 7) % 24),
    dur: 2 + ((i * 3) % 4)
  }));

  return (
    <div className="orbital-widget-box density-chamber">
      <span className="orbital-widget-heading">Densidade de Tráfego</span>

      <div className="density-chamber-body">
        {/* Visor Circular HUD */}
        <div className="density-scope-wrapper">
          <svg viewBox="0 0 90 90" className="density-scope-svg">
            {/* Aneis de alcance */}
            <circle cx="45" cy="45" r="40" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
            <circle cx="45" cy="45" r="25" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.8" />
            <circle cx="45" cy="45" r="10" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.8" />
            <line x1="45" y1="5" x2="45" y2="85" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.8" />
            <line x1="5" y1="45" x2="85" y2="45" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.8" />

            {/* Linha de varredura do radar */}
            <motion.line
              x1="45"
              y1="45"
              x2="85"
              y2="45"
              stroke={cor}
              strokeWidth="1.2"
              opacity="0.6"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '45px 45px' }}
            />

            {/* Particulas em movimento circular/cruzado */}
            {particulas.map((p) => (
              <motion.circle
                key={p.id}
                r={p.id % 4 === 0 ? 2 : 1.5}
                fill={p.id % 5 === 0 ? '#ff0055' : cor}
                animate={{
                  cx: [
                    45 + Math.cos((p.angle * Math.PI) / 180) * p.r,
                    45 + Math.cos(((p.angle + 180) * Math.PI) / 180) * p.r,
                    45 + Math.cos((p.angle * Math.PI) / 180) * p.r
                  ],
                  cy: [
                    45 + Math.sin((p.angle * Math.PI) / 180) * p.r,
                    45 + Math.sin(((p.angle + 180) * Math.PI) / 180) * p.r,
                    45 + Math.sin((p.angle * Math.PI) / 180) * p.r
                  ]
                }}
                transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}

            {/* Alerta de conjuncao pulsante no centro para LEO e HEO */}
            {(nivel === 'critico' || nivel === 'elevado') && (
              <motion.circle
                cx="45"
                cy="45"
                fill="none"
                stroke="#ff0055"
                strokeWidth="1.5"
                animate={{ r: [2, 18], opacity: [0.9, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
          </svg>
        </div>

        {/* Informacoes de Densidade ao Lado */}
        <div className="density-info-col">
          <div className="density-kpi-row">
            <span className="density-kpi-val">{rotulo}</span>
            <span className={`density-badge ${nivel}`}>{nivel.toUpperCase()}</span>
          </div>
          <p className={`density-alert-text ${nivel}`}>{alerta}</p>
        </div>
      </div>
    </div>
  );
}
