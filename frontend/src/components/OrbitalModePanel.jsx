import React, { useState } from 'react';
import { X, Layers, ShieldAlert, Sparkles, MapPin, Globe } from 'lucide-react';
import {
  CAMADAS_ORBITAIS,
  obterCamadaOrbital,
  obterPinoHistorico,
  listarPinosPorCamada
} from '../data/orbitalModeData';

export default function OrbitalModePanel({
  camadaSelecionadaId,
  pinoSelecionadoId,
  onSelecionarCamada,
  onSelecionarPino,
  onFechar,
  onTocarSom
}) {
  const [abaAtiva, setAbaAtiva] = useState('tecnica'); // 'tecnica' | 'sustentabilidade'

  const camadaAtual = obterCamadaOrbital(camadaSelecionadaId);
  const pinoAtual = obterPinoHistorico(pinoSelecionadoId);

  // Manipulador de selecao de aba
  const handleTrocarAba = (aba) => {
    if (onTocarSom) onTocarSom('slide');
    setAbaAtiva(aba);
  };

  // Manipulador de clique em camada
  const handleSelecionarCamada = (id) => {
    if (onTocarSom) onTocarSom('slide');
    if (onSelecionarCamada) onSelecionarCamada(id);
  };

  // Manipulador de clique em pino
  const handleSelecionarPino = (id) => {
    if (onTocarSom) onTocarSom('slide');
    if (onSelecionarPino) onSelecionarPino(id);
  };

  return (
    <aside className="tactical-visor-frame orbital-mode-panel-frame" aria-label="Painel Modo Orbital">
      <div className="tactical-visor-inner">
        {/* Cabecalho tatico com titulo exclusivo */}
        <div className="tactical-visor-header orbital-visor-header">
          <div className="orbital-visor-title-group">
            <span className="orbital-area-badge">MODO ORBITAL</span>
          </div>
          {(camadaAtual || pinoAtual) && (
            <button
              type="button"
              className="orbital-area-close-btn"
              onClick={onFechar}
              title="Fechar"
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="tactical-visor-body orbital-mode-body">
          {/* CASO 1: ESTADO INICIAL VAZIO */}
          {!pinoAtual && !camadaAtual && (
            <div className="orbital-mode-initial-state">
              <div className="orbital-mode-instructions-box">
                <Globe size={28} className="orbital-mode-instructions-icon" />
                <h4 className="orbital-mode-instructions-title">MODO ORBITAL</h4>
                <p className="orbital-mode-instructions-desc">
                  Toque nas faixas e pontos para identificar as informações.
                </p>
              </div>
            </div>
          )}

          {/* CASO 2: EVENTO HISTORICO SELECIONADO */}
          {pinoAtual && (
            <div className="orbital-mode-event-view">
              <div className="orbital-area-meta-row">
                <span className="orbital-event-year-tag">[{pinoAtual.ano}]</span>
                <span className="orbital-event-location">{pinoAtual.localNome}</span>
                <span
                  className="orbital-event-layer-tag"
                  style={{
                    color: CAMADAS_ORBITAIS[pinoAtual.camadaId]?.cor || '#00f0ff'
                  }}
                >
                  {pinoAtual.posicao.altKm} km ({CAMADAS_ORBITAIS[pinoAtual.camadaId]?.sigla})
                </span>
              </div>

              <h3 className="orbital-event-main-title">{pinoAtual.nome}</h3>

              <div className="orbital-event-blocks-container">
                <div className="orbital-event-block technical">
                  <span className="event-block-label">Fato Técnico</span>
                  <p className="event-block-text">{pinoAtual.fatoTecnico}</p>
                </div>

                <div className="orbital-event-block sustainability">
                  <span className="event-block-label">Lição de Sustentabilidade</span>
                  <p className="event-block-text">{pinoAtual.licaoSustentabilidade}</p>
                </div>
              </div>

              <div className="orbital-event-actions">
                <button
                  type="button"
                  className="orbital-event-layer-action-btn"
                  onClick={() => handleSelecionarCamada(pinoAtual.camadaId)}
                >
                  <span>Inspecionar Órbita {CAMADAS_ORBITAIS[pinoAtual.camadaId]?.sigla}</span>
                </button>
                <button
                  type="button"
                  className="orbital-event-reset-action-btn"
                  onClick={() => handleSelecionarCamada(null)}
                >
                  <span>Visão Geral</span>
                </button>
              </div>
            </div>
          )}

          {/* CASO 3: CAMADA ORBITAL SELECIONADA */}
          {!pinoAtual && camadaAtual && (
            <div className="orbital-mode-layer-view">
              <div className="orbital-layer-header-row">
                <span
                  className="orbital-layer-sigla-tag"
                  style={{
                    borderColor: camadaAtual.cor,
                    color: camadaAtual.cor
                  }}
                >
                  {camadaAtual.sigla}
                </span>
                <h3 className="orbital-layer-title">{camadaAtual.nome}</h3>
              </div>

              {/* KPIs Rapidos */}
              <div className="orbital-area-metrics-grid">
                <div className="orbital-area-metric-box">
                  <span className="metric-box-label">Altitude</span>
                  <span className="metric-box-value" style={{ color: camadaAtual.cor }}>
                    {camadaAtual.altitude}
                  </span>
                </div>
                <div className="orbital-area-metric-box">
                  <span className="metric-box-label">Catálogo</span>
                  <span className="metric-box-value" style={{ color: '#ffffff' }}>
                    {camadaAtual.catalogoPct}
                  </span>
                </div>
                <div className="orbital-area-metric-box">
                  <span className="metric-box-label">Risco</span>
                  <span
                    className="metric-box-value"
                    style={{
                      color:
                        camadaAtual.risco === 'Crítico'
                          ? 'var(--neon-red, #ff0055)'
                          : camadaAtual.risco === 'Elevado'
                          ? 'var(--neon-amber, #ffaa00)'
                          : 'var(--neon-cyan, #00f0ff)'
                    }}
                  >
                    {camadaAtual.risco}
                  </span>
                </div>
              </div>

              {/* Seletor de 2 Abas */}
              <div className="orbital-mode-segmented-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={abaAtiva === 'tecnica'}
                  className={`orbital-segmented-tab-btn ${abaAtiva === 'tecnica' ? 'active' : ''}`}
                  onClick={() => handleTrocarAba('tecnica')}
                >
                  <Layers size={14} />
                  <span>Ficha Técnica</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={abaAtiva === 'sustentabilidade'}
                  className={`orbital-segmented-tab-btn ${abaAtiva === 'sustentabilidade' ? 'active' : ''}`}
                  onClick={() => handleTrocarAba('sustentabilidade')}
                >
                  <ShieldAlert size={14} />
                  <span>Sustentabilidade</span>
                </button>
              </div>

              {/* Conteudo Aba 1: Ficha Tecnica */}
              {abaAtiva === 'tecnica' && (
                <div className="orbital-tab-content active" role="tabpanel">
                  <div className="orbital-telemetry-banner">
                    <span className="telemetry-banner-item">
                      <strong>Velocidade:</strong> {camadaAtual.velocidade}
                    </span>
                    <span className="telemetry-banner-item">
                      <strong>Período:</strong> {camadaAtual.periodo}
                    </span>
                  </div>

                  <div className="orbital-subdivisions-section">
                    <span className="subdivisions-heading">Sub-regiões Operacionais</span>
                    <ul className="subdivisions-list">
                      {camadaAtual.subregioes.map((sub, idx) => (
                        <li key={idx} className="subdivision-item">
                          <strong className="subdivision-name" style={{ color: camadaAtual.cor }}>
                            {sub.nome}
                          </strong>
                          <span className="subdivision-desc">{sub.desc}</span>
                          <span className="subdivision-examples">Missões: {sub.satelites}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Conteudo Aba 2: Sustentabilidade */}
              {abaAtiva === 'sustentabilidade' && (
                <div className="orbital-tab-content active" role="tabpanel">
                  <div className="orbital-sustainability-section">
                    <span className="sustainability-heading danger">Impacto e Riscos</span>
                    <ul className="sustainability-list">
                      {camadaAtual.sustentabilidade.impactos.map((item, idx) => (
                        <li key={idx} className="sustainability-item danger">
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <span className="sustainability-heading mitigation">Ações de Mitigação</span>
                    <ul className="sustainability-list">
                      {camadaAtual.sustentabilidade.mitigacoes.map((item, idx) => (
                        <li key={idx} className="sustainability-item mitigation">
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Pinos Relacionados nesta Camada */}
              {listarPinosPorCamada(camadaAtual.id).length > 0 && (
                <div className="orbital-layer-linked-events">
                  <span className="linked-events-title">Pinos Históricos Nesta Camada</span>
                  <div className="linked-events-grid">
                    {listarPinosPorCamada(camadaAtual.id).map((pino) => (
                      <button
                        key={pino.id}
                        type="button"
                        className="linked-event-btn"
                        onClick={() => handleSelecionarPino(pino.id)}
                      >
                        <span className="linked-event-year">[{pino.ano}]</span>
                        <span className="linked-event-name">{pino.nome}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
