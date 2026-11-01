import React from 'react';
import { motion } from 'motion/react';
import TypewriterHeading from '../TypewriterHeading';

export default function OrbitalVelocityRacetrack({ camadaAtual }) {
  if (!camadaAtual?.velocimetro) return null;

  const { multiplicador, duracaoSegundos } = camadaAtual.velocimetro;
  const cor = camadaAtual.cor || '#00f0ff';

  return (
    <div className="orbital-widget-box velocity-racetrack">
      <span className="orbital-widget-heading" style={{ color: cor, textAlign: 'center', display: 'block', width: '100%' }}>
        <TypewriterHeading text="VELOCIDADE COMPARADA" triggerKey={camadaAtual?.id} delay={40} />
      </span>

      <div className="racetrack-lanes">
        {/* Faixa 1: Aviao Comercial */}
        <div className="racetrack-lane">
          <div className="racetrack-lane-header">
            <span className="lane-label">Avião Comercial</span>
            <span className="lane-val">0,25 km/s (900 km/h)</span>
          </div>
          <div className="racetrack-track">
            <motion.div
              className="racetrack-runner plane"
              animate={{ x: ['0%', '100%'] }}
              transition={{ duration: 7, ease: 'linear', repeat: Infinity }}
            >
              <div className="runner-dot plane" />
            </motion.div>
          </div>
        </div>

        {/* Faixa 2: Projetil de Rifle */}
        <div className="racetrack-lane">
          <div className="racetrack-lane-header">
            <span className="lane-label">Projétil de Rifle</span>
            <span className="lane-val">1,0 km/s (3.600 km/h)</span>
          </div>
          <div className="racetrack-track">
            <motion.div
              className="racetrack-runner bullet"
              animate={{ x: ['0%', '100%'] }}
              transition={{ duration: 2.2, ease: 'linear', repeat: Infinity }}
            >
              <div className="runner-dot bullet" />
            </motion.div>
          </div>
        </div>

        {/* Faixa 3: Objeto nesta Orbita */}
        <div className="racetrack-lane active">
          <div className="racetrack-lane-header">
            <span className="lane-label" style={{ color: camadaAtual.cor }}>Nesta Órbita</span>
            <span className="lane-val" style={{ color: camadaAtual.cor }}>
              {camadaAtual.velocidadeFicha}
            </span>
          </div>
          <div className="racetrack-track active" style={{ borderColor: `${camadaAtual.cor}40` }}>
            <motion.div
              className="racetrack-runner orbit"
              animate={{ x: ['0%', '100%'] }}
              transition={{ duration: duracaoSegundos, ease: 'linear', repeat: Infinity }}
            >
              <div
                className="runner-dot orbit"
                style={{
                  backgroundColor: camadaAtual.cor,
                  boxShadow: `0 0 8px ${camadaAtual.cor}`
                }}
              />
            </motion.div>
          </div>
          <div className="racetrack-multiplier-tag" style={{ color: camadaAtual.cor }}>
            {multiplicador}
          </div>
        </div>
      </div>
    </div>
  );
}
