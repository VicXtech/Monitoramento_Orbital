import React from 'react';
import { X, Layers, Radio, Sparkles } from 'lucide-react';
import { SERIE_HISTORICA_ESA } from '../data/esaSpaceEnvironmentData';
import { DEFINICOES_AREAS_ORBITAIS } from '../utils/orbitalAreas3D';

export default function OrbitalTacticalVisor({
  ano,
  eventoSelecionado,
  areaSelecionadaInfo,
  onSelecionarArea,
  onFechar
}) {
  const dadosAno = SERIE_HISTORICA_ESA.find(d => d.ano === ano) || SERIE_HISTORICA_ESA[SERIE_HISTORICA_ESA.length - 1];

  return (
    <div className="tactical-visor-frame orbital-tactical-frame">
      <div className="tactical-visor-inner">
        {/* CASO 1: EVENTO HISTÓRICO SELECIONADO */}
        {eventoSelecionado && (
          <>
            <div className="tactical-visor-header orbital-visor-header">
              <div className="orbital-visor-title-group">
                <span className="orbital-area-badge" style={{ borderColor: '#00f0ff', color: '#00f0ff' }}>
                  {eventoSelecionado.ano}
                </span>
                <h3 className="tactical-tag-title">{eventoSelecionado.nome}</h3>
              </div>
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

            <div className="tactical-visor-body">
              <div className="orbital-area-meta-row">
                <span className="orbital-area-meta-item">
                  <strong>Data:</strong> {eventoSelecionado.data}
                </span>
              </div>

              <div className="orbital-area-metrics-grid">
                <div className="orbital-area-metric-box">
                  <span className="metric-box-label">Altitude</span>
                  <span className="metric-box-value" style={{ color: '#00f0ff' }}>
                    {eventoSelecionado.altitudeKm} km
                  </span>
                </div>
                <div className="orbital-area-metric-box">
                  <span className="metric-box-label">Fragmentos</span>
                  <span className="metric-box-value" style={{ color: eventoSelecionado.fragmentosGerados > 0 ? '#ffaa00' : '#00ffcc' }}>
                    {eventoSelecionado.fragmentosGerados.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="orbital-area-metric-box">
                  <span className="metric-box-label">Registro</span>
                  <span className="metric-box-value" style={{ color: '#ffffff', fontSize: '12px' }}>
                    Oficial ESA
                  </span>
                </div>
              </div>

              <div className="orbital-subdivisions-section">
                <div className="subdivisions-header">
                  <Radio size={13} style={{ color: '#00f0ff' }} />
                  <span>Fatos Documentados</span>
                </div>
                <ul className="subdivisions-list">
                  <li className="subdivision-item">
                    <strong className="subdivision-name">Objetos</strong>
                    <span className="subdivision-desc">{eventoSelecionado.objetos}</span>
                  </li>
                  <li className="subdivision-item">
                    <strong className="subdivision-name">Causa</strong>
                    <span className="subdivision-desc">{eventoSelecionado.causa}</span>
                  </li>
                  <li className="subdivision-item">
                    <strong className="subdivision-name">Consequências</strong>
                    <span className="subdivision-desc">{eventoSelecionado.consequencias}</span>
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}

        {/* CASO 2: ÁREA ORBITAL SELECIONADA */}
        {!eventoSelecionado && areaSelecionadaInfo && (
          <>
            <div className="tactical-visor-header orbital-visor-header">
              <div className="orbital-visor-title-group">
                <span
                  className="orbital-area-badge"
                  style={{
                    borderColor: areaSelecionadaInfo.corPadrao,
                    color: areaSelecionadaInfo.corPadrao
                  }}
                >
                  {areaSelecionadaInfo.sigla}
                </span>
                <h3 className="tactical-tag-title">{areaSelecionadaInfo.nome}</h3>
              </div>
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

            <div className="tactical-visor-body">
              <div className="orbital-area-meta-row">
                <span className="orbital-area-meta-item">
                  <strong>Altitude:</strong> {areaSelecionadaInfo.faixaFormatada}
                </span>
              </div>

              <div className="orbital-area-metrics-grid">
                <div className="orbital-area-metric-box">
                  <span className="metric-box-label">Objetos</span>
                  <span className="metric-box-value">
                    {areaSelecionadaInfo.totalObjetos.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="orbital-area-metric-box">
                  <span className="metric-box-label">Ativos</span>
                  <span className="metric-box-value" style={{ color: '#00ffcc' }}>
                    {areaSelecionadaInfo.taxaAtivosPct}%
                  </span>
                </div>
                <div className="orbital-area-metric-box">
                  <span className="metric-box-label">Detritos</span>
                  <span className="metric-box-value" style={{ color: '#ffaa00' }}>
                    {areaSelecionadaInfo.taxaDetritosPct}%
                  </span>
                </div>
              </div>

              <div className="orbital-subdivisions-section">
                <div className="subdivisions-header">
                  <Layers size={13} style={{ color: areaSelecionadaInfo.corPadrao }} />
                  <span>Subdivisões</span>
                </div>
                <ul className="subdivisions-list">
                  {areaSelecionadaInfo.subdivisoes.map((sub, idx) => (
                    <li key={idx} className="subdivision-item">
                      <strong className="subdivision-name">{sub.nome}</strong>
                      <span className="subdivision-desc">{sub.descricao}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}

        {/* CASO 3: VISÃO GERAL DO AMBIENTE ORBITAL (PADRÃO) */}
        {!eventoSelecionado && !areaSelecionadaInfo && (
          <>
            <div className="tactical-visor-header orbital-visor-header">
              <div className="orbital-visor-title-group">
                <span className="orbital-area-badge" style={{ borderColor: '#00f0ff', color: '#00f0ff' }}>
                  {ano}
                </span>
                <h3 className="tactical-tag-title">AMBIENTE ORBITAL · {ano}</h3>
              </div>
            </div>

            <div className="tactical-visor-body">
              <div className="orbital-area-meta-row">
                <span className="orbital-area-meta-item">
                  <strong>Registro:</strong> ESA Space Environment Report
                </span>
              </div>

              <div className="orbital-area-metrics-grid">
                <div className="orbital-area-metric-box">
                  <span className="metric-box-label">Cargas Ativas</span>
                  <span className="metric-box-value" style={{ color: '#00ffcc' }}>
                    {dadosAno.cargasAtivas.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="orbital-area-metric-box">
                  <span className="metric-box-label">Detritos</span>
                  <span className="metric-box-value" style={{ color: '#ffaa00' }}>
                    {dadosAno.detritos.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="orbital-area-metric-box">
                  <span className="metric-box-label">Reentradas</span>
                  <span className="metric-box-value" style={{ color: '#38bdf8' }}>
                    {dadosAno.reentradasAcumuladas.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="orbital-subdivisions-section">
                <div className="subdivisions-header">
                  <Sparkles size={13} style={{ color: '#00f0ff' }} />
                  <span>Marco Histórico</span>
                </div>
                <div className="subdivision-item" style={{ padding: '8px 10px', marginTop: '6px' }}>
                  <span className="subdivision-desc" style={{ color: '#cbd5e1' }}>
                    {dadosAno.evento}
                  </span>
                </div>
              </div>

              <div className="orbital-quick-orbits-section">
                <span className="quick-orbits-label">Inspecionar Órbita:</span>
                <div className="quick-orbits-grid">
                  {DEFINICOES_AREAS_ORBITAIS.map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      className="quick-orbit-btn"
                      style={{ borderColor: area.corPadrao }}
                      onClick={() => onSelecionarArea(area.id)}
                    >
                      <span className="quick-orbit-dot" style={{ backgroundColor: area.corPadrao }} />
                      <span>{area.sigla}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
