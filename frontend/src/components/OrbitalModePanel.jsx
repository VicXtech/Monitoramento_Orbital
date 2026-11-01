import React, { useState } from 'react';
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

  const limpezaItem = camadaAtual?.termometroAmbiental?.[0];
  const kesslerItem = camadaAtual?.termometroAmbiental?.[1];
  const fimVida = camadaAtual?.corteAtmosfera;
  const pinosCamada = camadaAtual ? listarPinosPorCamada(camadaAtual.id) : [];
  const pinosExibidos = pinosCamada.length > 0 ? pinosCamada : PINOS_HISTORICOS;

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
            onClick={onFechar}
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
                  {pinoAtual.posicao.altKm} km ({CAMADAS_ORBITAIS[pinoAtual.camadaId]?.sigla})
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

          {/* VISAO 2: CAMADA ORBITAL SELECIONADA */}
          {!pinoAtual && camadaAtual && (
            <div className="orbital-mode-layer-view">
              {/* Faixa compacta de 4 metricas no topo */}
              <div className="orbital-top-kpi-grid">
                <div className="orbital-kpi-card">
                  <span className="kpi-card-label">ALTITUDE DA CAMADA</span>
                  <span className="kpi-card-value" style={{ color: camadaAtual.cor }}>
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
                  <span className="kpi-card-value" style={{ color: camadaAtual.cor }}>
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
                    <span className="subdivisions-heading">Sub-regiões Operacionais</span>
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
                    <span className="sustainability-heading">Matriz de Diagnóstico Ambiental</span>
                    <div className="orbital-env-matrix-grid">
                      {/* Card 1: Densidade de Trafego */}
                      {camadaAtual.camaraDensidade && (
                        <div className="orbital-env-matrix-card">
                          <div className="thermometer-item-header">
                            <span className="thermometer-label">Densidade de Tráfego</span>
                            <span className={`density-badge ${camadaAtual.camaraDensidade.nivel}`}>
                              {camadaAtual.camaraDensidade.nivel.toUpperCase()}
                            </span>
                          </div>
                          <span
                            className="env-matrix-mono-val"
                            style={{
                              color: camadaAtual.camaraDensidade.nivel === 'critico' ? '#E05252' : '#F1F5F9'
                            }}
                          >
                            {camadaAtual.camaraDensidade.rotulo}
                          </span>
                          <span className="thermometer-detail">
                            {camadaAtual.camaraDensidade.alerta}
                          </span>
                        </div>
                      )}

                      {/* Card 2: Limpeza Natural / Arrasto */}
                      {limpezaItem && (
                        <div className="orbital-env-matrix-card">
                          <div className="thermometer-item-header">
                            <span className="thermometer-label">{limpezaItem.rotulo}</span>
                            <span className={`thermometer-badge ${limpezaItem.nivel}`}>
                              {limpezaItem.valor}
                            </span>
                          </div>
                          <div className="thermometer-track">
                            <div
                              className={`thermometer-fill ${limpezaItem.nivel}`}
                              style={{ width: `${limpezaItem.pct}%` }}
                            />
                          </div>
                          {limpezaItem.detalhe && (
                            <span className="thermometer-detail">{limpezaItem.detalhe}</span>
                          )}
                        </div>
                      )}

                      {/* Card 3: Risco Sindrome de Kessler */}
                      {kesslerItem && (
                        <div className="orbital-env-matrix-card">
                          <div className="thermometer-item-header">
                            <span className="thermometer-label">{kesslerItem.rotulo}</span>
                            <span className={`thermometer-badge ${kesslerItem.nivel}`}>
                              {kesslerItem.valor}
                            </span>
                          </div>
                          <div className="thermometer-track">
                            <div
                              className={`thermometer-fill ${kesslerItem.nivel}`}
                              style={{ width: `${kesslerItem.pct}%` }}
                            />
                          </div>
                          {kesslerItem.detalhe && (
                            <span className="thermometer-detail">{kesslerItem.detalhe}</span>
                          )}
                        </div>
                      )}

                      {/* Card 4: Destino na Reentrada */}
                      {fimVida && (
                        <div className="orbital-env-matrix-card">
                          <div className="thermometer-item-header">
                            <span className="thermometer-label">Destino na Reentrada</span>
                            <span className={`reentry-type-pill ${fimVida.tipo}`}>
                              {fimVida.badgeCurta || (fimVida.tipo === 'quimica' ? 'ATMOSFERA' : fimVida.tipo === 'sem_reentrada' ? 'CEMITÉRIO' : 'OCEANO')}
                            </span>
                          </div>
                          <span
                            className="env-matrix-headline"
                            style={{
                              color: fimVida.tipo === 'quimica' ? '#E05252' : '#E5A93C'
                            }}
                          >
                            {fimVida.rotulo}
                          </span>
                          <span className="thermometer-detail">{fimVida.desc}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Impacto no Espaco vs Terra (2 colunas lado a lado) */}
                  {camadaAtual.matrizImpacto && (
                    <div className="orbital-impact-matrix-section">
                      <span className="sustainability-heading">Impacto no Espaço vs Terra</span>
                      <div className="orbital-impact-matrix-grid">
                        <div className="orbital-impact-card space">
                          <span className="impact-card-badge space">NO ESPAÇO</span>
                          <strong className="impact-card-title">{camadaAtual.matrizImpacto.espaco.subtitulo}</strong>
                          <p className="impact-card-text">{camadaAtual.matrizImpacto.espaco.desc}</p>
                          <div className="impact-card-consequence space">
                            <span>⚠ Consequência: {camadaAtual.matrizImpacto.espaco.consequencia || 'Inutilização de rotas orbitais'}</span>
                          </div>
                        </div>
                        <div className="orbital-impact-card earth">
                          <span className="impact-card-badge earth">NO PLANETA TERRA</span>
                          <strong className="impact-card-title">{camadaAtual.matrizImpacto.terra.subtitulo}</strong>
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
                      <span className="sustainability-heading">Ações &amp; Normas de Mitigação</span>
                      <div className="orbital-actions-list">
                        {camadaAtual.acoesNormas.map((norma, idx) => (
                          <div key={idx} className="orbital-action-card">
                            <div className="action-card-header">
                              <span className="agency-badge">{norma.badge}</span>
                              <strong className="action-title">{norma.titulo}</strong>
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
                    <span className="linked-events-title">Pinos Históricos Nesta Camada</span>
                    <div className="linked-events-grid">
                      {pinosExibidos.map((pino) => (
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
                          <span className="linked-event-action-hint">Inspecionar no Globo</span>
                        </button>
                      ))}
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
