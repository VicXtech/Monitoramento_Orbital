import React, { useState } from 'react';
import {
  ShieldAlert,
  X,
  TrendingUp,
  AlertTriangle,
  Info,
  Layers,
  Flame,
  Clock,
  Sparkles,
  Calculator,
  ChevronDown,
  ChevronUp,
  Activity
} from 'lucide-react';

/**
 * Modal Completo de Diagnóstico do Índice Global de Sustentabilidade Orbital (ISO) — Passo 1.3
 * Apresenta a memória de cálculo macroscópica, os 5 subindicadores,
 * a evolução comparativa temporal e a fundamentação acadêmica para o TCC.
 */
export default function GlobalSustainabilityModal({
  aberto,
  onFechar,
  dadosIso
}) {
  const [mostrarFormula, setMostrarFormula] = useState(false);

  if (!aberto || !dadosIso) return null;

  const { scoreGlobal, classificacao, cor, nivelDescricao, tendencia, subindicadores, projecoes, metodologia } = dadosIso;

  return (
    <div className="hud-modal-backdrop modal-opening" onClick={onFechar}>
      <div
        className="hud-modal-card global-sustainability-modal-card card-opening"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABEÇALHO */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={20} style={{ color: cor }} />
            <h3>ÍNDICE DE SUSTENTABILIDADE ORBITAL (ISO)</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onFechar}
            title="Fechar Modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-scrollable global-iso-modal-body">
          {/* PAINEL CENTRAL DO SCORE */}
          <div className="iso-score-hero">
            <div className="iso-score-display">
              <span className="iso-number" style={{ color: cor }}>{scoreGlobal}</span>
              <div className="iso-scale-sub">/ 100</div>
            </div>

            <div className="iso-badge-wrap">
              <span className="iso-classification-badge" style={{ borderColor: cor, color: cor, backgroundColor: `${cor}15` }}>
                {classificacao}
              </span>
              <span className="iso-trend-badge">
                <TrendingUp size={12} />
                {tendencia}
              </span>
            </div>

            <p className="iso-hero-desc">{nivelDescricao}</p>

            {/* AVISO ACADÊMICO OBRIGATÓRIO */}
            <div className="iso-academic-disclaimer">
              <Info size={14} className="disclaimer-icon" />
              <span>
                Este índice é uma <strong>estimativa educacional e multicritério</strong> baseada em dados dinâmicos do CelesTrak, diretrizes de mitigação do <strong>IADC</strong> e relatórios de ambiente espacial da <strong>ESA</strong>.
              </span>
            </div>
          </div>

          {/* OS 5 SUBINDICADORES MACROSCÓPICOS */}
          <div className="iso-subindicators-section">
            <div className="section-title-sub">
              <span>PILAREs DE PRESSÃO AMBIENTAL (MODELO ISO)</span>
              <span className="section-hint">Ponderação Multicritério</span>
            </div>

            <div className="iso-bars-grid">
              {subindicadores.map((sub) => (
                <div key={sub.id} className="iso-bar-card">
                  <div className="iso-bar-header">
                    <span className="iso-bar-name">{sub.nome}</span>
                    <div className="iso-bar-values">
                      <span className="iso-bar-weight">({sub.peso})</span>
                      <strong className="iso-bar-val" style={{ color: sub.cor }}>{sub.valor}%</strong>
                    </div>
                  </div>

                  {/* Barra Segmentada Tática */}
                  <div className="iso-progress-track">
                    <div
                      className="iso-progress-fill"
                      style={{
                        width: `${sub.valor}%`,
                        backgroundColor: sub.cor
                      }}
                    />
                  </div>

                  <p className="iso-bar-desc">{sub.descricao}</p>
                </div>
              ))}
            </div>
          </div>

          {/* COMPARAÇÃO TEMPORAL: HOJE -> 2035 -> 2050 */}
          <div className="iso-projections-section">
            <div className="section-title-sub">
              <span>TRAJETÓRIA TEMPORAL DO AMBIENTE ORBITAL</span>
              <span className="section-hint">Modelos de Projeção</span>
            </div>

            <div className="iso-timeline-cards">
              {/* HOJE */}
              <div className="timeline-proj-card current">
                <div className="timeline-proj-tag">ATUAL</div>
                <div className="timeline-proj-year">Hoje (2026)</div>
                <div className="timeline-proj-score" style={{ color: cor }}>{projecoes.hoje} / 100</div>
                <div className="timeline-proj-status">Pressão Moderada</div>
              </div>

              <div className="timeline-proj-arrow">→</div>

              {/* 2035 */}
              <div className="timeline-proj-card future-medium">
                <div className="timeline-proj-tag">PROJEÇÃO</div>
                <div className="timeline-proj-year">2035</div>
                <div className="timeline-proj-score" style={{ color: 'var(--neon-amber)' }}>{projecoes.ano2035} / 100</div>
                <div className="timeline-proj-status">+45.000 satélites LEO</div>
              </div>

              <div className="timeline-proj-arrow">→</div>

              {/* 2050 */}
              <div className="timeline-proj-card future-high">
                <div className="timeline-proj-tag warning">ALERTA KESSLER</div>
                <div className="timeline-proj-year">2050</div>
                <div className="timeline-proj-score" style={{ color: 'var(--neon-red)' }}>{projecoes.ano2050} / 100</div>
                <div className="timeline-proj-status">Risco Crítico de Cascata</div>
              </div>
            </div>

            <div className="iso-inquiry-box">
              <span className="inquiry-title">💡 O que está fazendo esse índice piorar?</span>
              <p className="inquiry-text">
                O lançamento em massa de megaconstelações comerciais sem taxas de desorbitagem controlada superiores a 90% aumenta a densidade de objetos na órbita baixa da Terra, elevando a probabilidade estatística de colisões catastróficas.
              </p>
            </div>
          </div>

          {/* AUDITORIA DA MEMÓRIA DE CÁLCULO */}
          <div className="iso-audit-section">
            <button
              type="button"
              className="btn-toggle-methodology"
              onClick={() => setMostrarFormula(!mostrarFormula)}
            >
              <Calculator size={13} />
              <span>{mostrarFormula ? 'OCULTAR MEMÓRIA DE CÁLCULO DO ISO' : 'VER FORMULAÇÃO MATEMÁTICA (ISO)'}</span>
              {mostrarFormula ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {mostrarFormula && (
              <div className="methodology-audit-box" style={{ marginTop: '8px' }}>
                <div className="audit-box-header">
                  <Activity size={13} style={{ color: 'var(--neon-cyan)' }} />
                  <span>{metodologia.nome}</span>
                </div>
                <div className="audit-box-equation">
                  {metodologia.equacao}
                </div>
                <div className="audit-box-weights">
                  <div>• <strong>C (30%)</strong>: Congestionamento e densidade espacial em LEO</div>
                  <div>• <strong>D (25%)</strong>: Fração de detritos e objetos descontrolados no catálogo</div>
                  <div>• <strong>P (20%)</strong>: Proporção de objetos em altitudes com permanência superior a 25 anos</div>
                  <div>• <strong>R (10%)</strong>: Frequência estimada de reentradas não monitoradas</div>
                  <div>• <strong>G (15%)</strong>: Taxa de aceleração anual de novos lançamentos de constelações</div>
                </div>
                <div className="audit-box-footer">
                  Fontes: {metodologia.fontes}.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
