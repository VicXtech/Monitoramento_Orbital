import { useState } from 'react';
import { X } from 'lucide-react';
import {
  CAMADAS_ORBITAIS,
  PINOS_HISTORICOS,
  obterCamadaOrbital,
  obterPinoHistorico,
  listarPinosPorCamada
} from '../data/orbitalModeData';

import OrbitalVelocityRacetrack from './orbital-widgets/OrbitalVelocityRacetrack';
import OrbitalCoverageRadar from './orbital-widgets/OrbitalCoverageRadar';
import OrbitalRealWorldSignal from './orbital-widgets/OrbitalRealWorldSignal';
import TypewriterHeading from './TypewriterHeading';

const ORDEM_CAMADAS = ['leo', 'meo', 'geo', 'heo'];

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

export default function OrbitalModePanel({
  camadaSelecionadaId,
  pinoSelecionadoId,
  onSelecionarCamada,
  onSelecionarPino,
  onFechar,
  onTocarSom
}) {
  const [abaAtiva, setAbaAtiva] = useState('engenharia'); // 'engenharia' | 'sustentabilidade' | 'aplicacoes'

  const camadaAtual = obterCamadaOrbital(camadaSelecionadaId);
  const pinoAtual = obterPinoHistorico(pinoSelecionadoId);

  // Define camada de referencia para o seletor superior e cor de destaque
  const camadaIdReferencia = pinoAtual ? pinoAtual.camadaId : camadaAtual?.id;
  const corTema = pinoAtual
    ? (CAMADAS_ORBITAIS[pinoAtual.camadaId]?.cor || '#38BDF8')
    : (camadaAtual?.cor || '#38BDF8');

  // Alterna entre as 3 abas do painel
  const handleTrocarAba = (aba) => {
    if (onTocarSom) onTocarSom('slide');
    setAbaAtiva(aba);
  };

  // Seleciona camada orbital na barra superior
  const handleSelecionarCamada = (id) => {
    if (onTocarSom) onTocarSom('slide');
    if (onSelecionarCamada) onSelecionarCamada(id);
  };

  // Seleciona pino historico no globo
  const handleSelecionarPino = (id) => {
    if (onTocarSom) onTocarSom('slide');
    if (onSelecionarPino) onSelecionarPino(id);
  };

  // Fecha o painel do modo orbital
  const handleFecharPainel = () => {
    if (onTocarSom) onTocarSom('fechar');
    if (onFechar) onFechar();
  };

  const pinosCamada = camadaAtual ? listarPinosPorCamada(camadaAtual.id) : [];
  const pinosExibidos = pinosCamada;

  return (
    <aside
      className="tactical-visor-frame orbital-mode-panel-frame anim-abertura-centro"
      aria-label="Painel Modo Orbital"
      style={{
        borderRightColor: corTema,
        '--layer-accent': corTema
      }}
    >
      <div className="tactical-visor-inner orbital-visor-inner">
        {/* Barra seletora rapida de camadas no topo do painel */}
        <OrbitalLayerDock
          camadaAtivaId={camadaIdReferencia}
          onSelecionarCamada={handleSelecionarCamada}
        />

        {/* Cabecalho da camada ou do evento com botao fechar */}
        <div className="tactical-visor-header orbital-visor-header">
          {pinoAtual ? (
            <div className="orbital-event-header-group">
              <span className="orbital-event-year-tag">[{pinoAtual.ano}]</span>
              <h3 className="orbital-layer-title">{pinoAtual.nome}</h3>
            </div>
          ) : (
            <div className="orbital-layer-header-row">
              <span
                className="orbital-layer-sigla-tag"
                style={{
                  borderColor: camadaAtual?.cor || '#38BDF8',
                  color: camadaAtual?.cor || '#38BDF8'
                }}
              >
                {camadaAtual?.sigla || ''}
              </span>
              <h3 className="orbital-layer-title">{camadaAtual?.nome || ''}</h3>
            </div>
          )}

          <button
            type="button"
            className="orbital-area-close-btn"
            onClick={handleFecharPainel}
            title="Fechar"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="tactical-visor-body orbital-mode-body">

          {/* VISAO 1: EVENTO HISTORICO SELECIONADO */}
          {pinoAtual && (
            <div className="orbital-mode-event-view">
              <div className="orbital-area-meta-row">
                <span className="orbital-event-location">{pinoAtual.localNome}</span>
                <span
                  className="orbital-event-layer-tag"
                  style={{
                    color: CAMADAS_ORBITAIS[pinoAtual.camadaId]?.cor || '#38BDF8'
                  }}
                >
                  {pinoAtual.posicao.altKm} km · {CAMADAS_ORBITAIS[pinoAtual.camadaId]?.sigla}
                </span>
              </div>

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
                {(() => {
                  const camadaPino = CAMADAS_ORBITAIS[pinoAtual.camadaId?.toLowerCase()];
                  const corPino = camadaPino?.cor || '#38BDF8';
                  return (
                    <button
                      type="button"
                      className="orbital-event-layer-action-btn"
                      style={{
                        borderColor: corPino,
                        color: corPino,
                        '--btn-sweep-border': corPino,
                        '--btn-sweep-bg': `${corPino}26`
                      }}
                      onClick={() => handleSelecionarCamada(pinoAtual.camadaId)}
                    >
                      <span>Inspecionar Órbita {camadaPino?.sigla || pinoAtual.camadaId?.toUpperCase()}</span>
                    </button>
                  );
                })()}
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

          {/* VISAO 2: CAMADA ORBITAL SELECIONADA */}
          {!pinoAtual && camadaAtual && (
            <div className="orbital-mode-layer-view">
              {/* Faixa compacta de 4 metricas no topo */}
              <div className="orbital-top-kpi-grid">
                <div className="orbital-kpi-card">
                  <span className="kpi-card-label">ALTITUDE DA CAMADA</span>
                  <span className="kpi-card-value">
                    {camadaAtual.altitudeCurta || camadaAtual.altitude}
                  </span>
                  {camadaAtual.altitudeSub && (
                    <span className="kpi-card-sub">{camadaAtual.altitudeSub}</span>
                  )}
                </div>

                <div className="orbital-kpi-card">
                  <span className="kpi-card-label">TRÁFEGO GLOBAL</span>
                  <span className="kpi-card-value">
                    {camadaAtual.trafegoGlobal || camadaAtual.catalogoPct}
                  </span>
                  {camadaAtual.trafegoSub && (
                    <span className="kpi-card-sub">{camadaAtual.trafegoSub}</span>
                  )}
                </div>

                <div className="orbital-kpi-card">
                  <span className="kpi-card-label">VELOCIDADE</span>
                  <span className="kpi-card-value">
                    {camadaAtual.velocidadeFicha || camadaAtual.velocidade}
                  </span>
                  {camadaAtual.velocidadeSub && (
                    <span className="kpi-card-sub">{camadaAtual.velocidadeSub}</span>
                  )}
                </div>

                <div className="orbital-kpi-card">
                  <span className="kpi-card-label">TEMPO DE VOLTA</span>
                  <span className="kpi-card-value">
                    {camadaAtual.periodoFicha || camadaAtual.periodo}
                  </span>
                  {camadaAtual.periodoSub && (
                    <span className="kpi-card-sub">{camadaAtual.periodoSub}</span>
                  )}
                </div>
              </div>

              {/* Sistema de 3 Abas */}
              <div className="orbital-mode-segmented-tabs three-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={abaAtiva === 'engenharia'}
                  className={`orbital-segmented-tab-btn ${abaAtiva === 'engenharia' ? 'active' : ''}`}
                  onClick={() => handleTrocarAba('engenharia')}
                  style={abaAtiva === 'engenharia' ? { borderColor: camadaAtual.cor, color: camadaAtual.cor } : {}}
                >
                  <span>Engenharia</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={abaAtiva === 'sustentabilidade'}
                  className={`orbital-segmented-tab-btn ${abaAtiva === 'sustentabilidade' ? 'active' : ''}`}
                  onClick={() => handleTrocarAba('sustentabilidade')}
                  style={abaAtiva === 'sustentabilidade' ? { borderColor: camadaAtual.cor, color: camadaAtual.cor } : {}}
                >
                  <span>Sustentabilidade</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={abaAtiva === 'aplicacoes'}
                  className={`orbital-segmented-tab-btn ${abaAtiva === 'aplicacoes' ? 'active' : ''}`}
                  onClick={() => handleTrocarAba('aplicacoes')}
                  style={abaAtiva === 'aplicacoes' ? { borderColor: camadaAtual.cor, color: camadaAtual.cor } : {}}
                >
                  <span>História</span>
                </button>
              </div>

              {/* ABA 1: ENGENHARIA & ORBITA */}
              {abaAtiva === 'engenharia' && (
                <div className="orbital-tab-content active" role="tabpanel">
                  {/* Grid de 2 colunas (40% / 60%): Geometria e Cobertura + Velocidade Comparada */}
                  <div className="orbital-engineering-grid">
                    <OrbitalCoverageRadar camadaAtual={camadaAtual} />
                    <OrbitalVelocityRacetrack camadaAtual={camadaAtual} />
                  </div>

                  {/* Sub-regioes Operacionais */}
                  <div className="orbital-subdivisions-section">
                    <span className="subdivisions-heading" style={{ color: camadaAtual.cor }}>
                      <TypewriterHeading text="Sub-regiões Operacionais" triggerKey={`${camadaAtual.id}-${abaAtiva}`} delay={0} />
                    </span>
                    <ul className="subdivisions-list">
                      {camadaAtual.subregioes?.map((sub, idx) => (
                        <li
                          key={idx}
                          className="subdivision-item"
                        >
                          <strong className="subdivision-name" style={{ color: camadaAtual.cor }}>
                            {sub.nome}
                          </strong>
                          <span className="subdivision-desc">{sub.desc}</span>
                          <span className="subdivision-examples">
                            Exemplos / Tráfego Comum: {sub.trafego || sub.satelites}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* ABA 2: SUSTENTABILIDADE & RISCO */}
              {abaAtiva === 'sustentabilidade' && (
                <div className="orbital-tab-content active" role="tabpanel">
                  {/* Matriz de Diagnostico Ambiental em Grid 2x2 */}
                  <div className="orbital-env-matrix-section">
                    <span className="sustainability-heading" style={{ color: camadaAtual.cor }}>
                      <TypewriterHeading text="Matriz de Diagnóstico Ambiental" triggerKey={`${camadaAtual.id}-${abaAtiva}`} delay={0} />
                    </span>
                    <div className="orbital-env-matrix-grid">
                      {camadaAtual.matrizDiagnostico?.map((item) => {
                        const cor = item.nivel === 'critico' ? '#E05252' : item.nivel === 'baixo' ? '#34D399' : '#E5A93C';
                        return (
                          <div key={item.id} className="orbital-env-matrix-card">
                            <div className="thermometer-item-header">
                              <span className="thermometer-label">{item.titulo}</span>
                              <span className={`thermometer-badge ${item.nivel}`}>
                                {item.badge}
                              </span>
                            </div>
                            <span
                              className="env-matrix-headline"
                              style={{ color: cor }}
                            >
                              {item.destaque}
                            </span>
                            <div className="thermometer-track">
                              <div
                                className={`thermometer-fill ${item.nivel}`}
                                style={{ width: `${item.pct}%` }}
                              />
                            </div>
                            <span className="thermometer-detail">{item.detalhe}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Impacto no Espaco vs Terra (2 colunas lado a lado) */}
                  {camadaAtual.matrizImpacto && (
                    <div className="orbital-impact-matrix-section">
                      <span className="sustainability-heading" style={{ color: camadaAtual.cor }}>
                        <TypewriterHeading text="Impacto no Espaço vs Terra" triggerKey={`${camadaAtual.id}-${abaAtiva}`} delay={80} />
                      </span>
                      <div className="orbital-impact-matrix-grid">
                        <div className="orbital-impact-card space">
                          <div className="impact-card-header">
                            <span className="impact-card-title">{camadaAtual.matrizImpacto.espaco.titulo || 'NO ESPAÇO'}</span>
                          </div>
                          <span className="impact-card-subtitle space">
                            {camadaAtual.matrizImpacto.espaco.subtitulo}
                          </span>
                          <p className="impact-card-text">{camadaAtual.matrizImpacto.espaco.desc}</p>
                          <div className="impact-card-consequence space">
                            <span>⚠ Consequência: {camadaAtual.matrizImpacto.espaco.consequencia || 'Inutilização de rotas orbitais'}</span>
                          </div>
                        </div>
                        <div className="orbital-impact-card earth">
                          <div className="impact-card-header">
                            <span className="impact-card-title">{camadaAtual.matrizImpacto.terra.titulo || 'NO PLANETA TERRA'}</span>
                          </div>
                          <span className="impact-card-subtitle earth">
                            {camadaAtual.matrizImpacto.terra.subtitulo}
                          </span>
                          <p className="impact-card-text">{camadaAtual.matrizImpacto.terra.desc}</p>
                          <div className="impact-card-consequence earth">
                            <span>⚠ Consequência: {camadaAtual.matrizImpacto.terra.consequencia || 'Dano químico e perda de serviços vitais'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Acoes e Normas de Mitigacao */}
                  {camadaAtual.acoesNormas && (
                    <div className="orbital-actions-normas-section">
                      <span className="sustainability-heading" style={{ color: camadaAtual.cor }}>
                        <TypewriterHeading text="Ações & Normas de Mitigação" triggerKey={`${camadaAtual.id}-${abaAtiva}`} delay={160} />
                      </span>
                      <div className="orbital-actions-list">
                        {camadaAtual.acoesNormas.map((norma, idx) => (
                          <div key={idx} className="orbital-action-card">
                            <div className="action-card-header">
                              <span className="action-title-line">
                                <span className="action-title-name">{norma.titulo}</span>
                                <span className="action-title-divider"> / </span>
                                <span className="action-title-agency">{norma.badge}</span>
                              </span>
                            </div>
                            <p className="action-desc">{norma.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ABA 3: APLICACOES & HISTORIA */}
              {abaAtiva === 'aplicacoes' && (
                <div className="orbital-tab-content active" role="tabpanel">
                  {/* Impacto no Cotidiano com cards abertos */}
                  <OrbitalRealWorldSignal camadaAtual={camadaAtual} />

                  {/* Pinos Historicos */}
                  <div className="orbital-layer-linked-events">
                    <span className="linked-events-title" style={{ color: camadaAtual.cor }}>
                      <TypewriterHeading text="Pinos Históricos Nesta Camada" triggerKey={`${camadaAtual.id}-${abaAtiva}`} delay={0} />
                    </span>
                    <div className="linked-events-grid">
                      {pinosExibidos.length === 0 ? (
                        <div className="linked-events-empty">
                          Nenhum pino histórico registrado para esta camada.
                        </div>
                      ) : (
                        pinosExibidos.map((pino) => (
                          <button
                            key={pino.id}
                            type="button"
                            className="linked-event-btn"
                            onClick={() => handleSelecionarPino(pino.id)}
                          >
                            <div className="linked-event-info">
                              <span className="linked-event-year">[{pino.ano}]</span>
                              <span className="linked-event-name">{pino.nome}</span>
                            </div>
                            <span className="linked-event-action-hint">Inspecionar</span>
                          </button>
                        ))
                      )}
                    </div>
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
