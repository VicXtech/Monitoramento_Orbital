import React from 'react';
import { motion } from 'motion/react';
import { Radio } from 'lucide-react';

export default function OrbitalRealWorldSignal({ camadaAtual }) {
  if (!camadaAtual?.impactoCotidiano || camadaAtual.impactoCotidiano.length === 0) return null;

  const cor = camadaAtual.cor || '#38BDF8';

  return (
    <div className="orbital-widget-box real-world-signal">
      <div className="signal-header">
        <span className="orbital-widget-heading">Impacto no Cotidiano</span>
        <div className="signal-source-badge">
          <Radio size={11} style={{ color: cor }} />
          <span>Sinal Orbital Ativo</span>
        </div>
      </div>

      <div className="signal-nodes-container">
        {/* Linha animada de fluxo de dados */}
        <div className="signal-pipeline-track">
          <svg className="pipeline-svg" width="100%" height="6">
            <motion.line
              x1="0"
              y1="3"
              x2="100%"
              y2="3"
              stroke={cor}
              strokeWidth="2"
              strokeDasharray="4 4"
              animate={{ strokeDashoffset: [-16, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </svg>
        </div>

        {/* Cards abertos com impacto direto */}
        <div className="signal-nodes-list">
          {camadaAtual.impactoCotidiano.map((no, idx) => (
            <div
              key={idx}
              className="signal-node-card open-card"
            >
              <div className="node-card-header">
                <div className="node-indicator-dot" style={{ backgroundColor: cor }} />
                <span className="node-card-title">{no.titulo}</span>
              </div>
              <p className="node-card-desc">{no.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
