import React from 'react';
import { motion } from 'motion/react';
import TypewriterHeading from '../TypewriterHeading';

export default function OrbitalCoverageRadar({ camadaAtual }) {
  if (!camadaAtual?.radarCobertura) return null;

  const { tipo, desc } = camadaAtual.radarCobertura;
  const cor = camadaAtual.cor || '#00f0ff';

  return (
    <div className="orbital-widget-box coverage-radar">
      <div className="coverage-header" style={{ justifyContent: 'center' }}>
        <span className="orbital-widget-heading" style={{ color: cor, textAlign: 'center', width: '100%' }}>
          <TypewriterHeading text="GEOMETRIA E COBERTURA" triggerKey={camadaAtual?.id} delay={0} />
        </span>
      </div>
      <p className="coverage-desc">{desc}</p>

      <div className="coverage-diagram-wrapper">
        <svg viewBox="0 0 200 120" className="coverage-svg">
          <defs>
            {/* Gradiente da Terra */}
            <radialGradient id="earthGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="70%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
            {/* Feixe de varredura LEO */}
            <linearGradient id="scanBeamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={cor} stopOpacity="0.6" />
              <stop offset="100%" stopColor={cor} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Globo Terrestre no Centro */}
          <circle cx="100" cy="60" r="22" fill="url(#earthGrad)" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="1" />
          <path
            d="M 92 50 Q 98 48 102 54 T 96 66 T 90 60 Z"
            fill="rgba(16, 185, 129, 0.45)"
          />
          <path
            d="M 104 60 Q 110 56 112 64 T 106 72 Z"
            fill="rgba(16, 185, 129, 0.35)"
          />

          {/* DIAGRAMA 1: LEO (Varredura Polar) */}
          {tipo === 'polar' && (
            <g>
              {/* Orbita polar vertical */}
              <ellipse cx="100" cy="60" rx="30" ry="50" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeDasharray="3 3" />
              {/* Feixe conico de escaneamento */}
              <motion.polygon
                points="100,10 88,52 112,52"
                fill="url(#scanBeamGrad)"
                animate={{
                  points: [
                    '100,10 88,52 112,52',
                    '100,110 88,68 112,68',
                    '100,10 88,52 112,52'
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Satelite orbitando em Y */}
              <motion.circle
                cx="100"
                r="3.5"
                fill={cor}
                animate={{ cy: [10, 110, 10] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ filter: `drop-shadow(0 0 5px ${cor})` }}
              />
            </g>
          )}

          {/* DIAGRAMA 2: MEO (Triangulacao GNSS) */}
          {tipo === 'constelacao' && (
            <g>
              {/* Anel inclinado 1 */}
              <ellipse cx="100" cy="60" rx="55" ry="32" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeDasharray="3 3" transform="rotate(-15 100 60)" />
              {/* Anel inclinado 2 */}
              <ellipse cx="100" cy="60" rx="55" ry="32" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeDasharray="3 3" transform="rotate(25 100 60)" />
              {/* Ondas pulsantes de triangulacao */}
              <motion.circle
                cx="100"
                cy="60"
                fill="none"
                stroke={cor}
                strokeWidth="1.2"
                initial={{ r: 4, opacity: 0.8 }}
                animate={{ r: [6, 32], opacity: [0.8, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />
              {/* Satelites em MEO */}
              <circle cx="50" cy="40" r="3" fill={cor} style={{ filter: `drop-shadow(0 0 4px ${cor})` }} />
              <line x1="50" y1="40" x2="100" y2="60" stroke={cor} strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
              <circle cx="150" cy="45" r="3" fill={cor} style={{ filter: `drop-shadow(0 0 4px ${cor})` }} />
              <line x1="150" y1="45" x2="100" y2="60" stroke={cor} strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
              <circle cx="90" cy="92" r="3" fill={cor} style={{ filter: `drop-shadow(0 0 4px ${cor})` }} />
              <line x1="90" y1="92" x2="100" y2="60" stroke={cor} strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
            </g>
          )}

          {/* DIAGRAMA 3: GEO (Satelite Travado) */}
          {tipo === 'geo' && (
            <g>
              {/* Anel equatorial largo */}
              <ellipse cx="100" cy="60" rx="72" ry="20" fill="none" stroke="rgba(255, 255, 255, 0.18)" strokeDasharray="3 3" />
              {/* Feixe direcional cobrindo meio globo */}
              <polygon points="172,60 100,42 100,78" fill="url(#scanBeamGrad)" />
              {/* Satelite geoestacionario fixo no anel */}
              <circle cx="172" cy="60" r="4" fill={cor} style={{ filter: `drop-shadow(0 0 6px ${cor})` }} />
              {/* Pulso de transmissao continua */}
              <motion.circle
                cx="172"
                cy="60"
                fill="none"
                stroke={cor}
                strokeWidth="1"
                animate={{ r: [2, 14], opacity: [0.9, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
              />
            </g>
          )}

          {/* DIAGRAMA 4: HEO (Elipse Alongada Molniya) */}
          {tipo === 'eliptica' && (
            <g>
              {/* Trajetoria eliptica com perigeu rasante e apogeu alto */}
              <path
                d="M 98 83 C 70 83, 50 35, 95 12 C 140 -8, 160 40, 102 83"
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeDasharray="3 3"
              />
              {/* Satelite com velocidade variavel (lento no apogeu, rapido no perigeu) */}
              <motion.circle
                r="3.5"
                fill={cor}
                animate={{
                  cx: [100, 75, 95, 140, 100],
                  cy: [82, 50, 14, 45, 82]
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: [0.1, 0.8, 0.2, 1.0],
                  times: [0, 0.15, 0.6, 0.9, 1]
                }}
                style={{ filter: `drop-shadow(0 0 6px ${cor})` }}
              />
              <text x="100" y="8" fill="rgba(255,255,255,0.6)" fontSize="7" textAnchor="middle" fontFamily="monospace">
                Apogeu Lento
              </text>
              <text x="100" y="96" fill={cor} fontSize="7" textAnchor="middle" fontFamily="monospace">
                Perigeu Rasante
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
