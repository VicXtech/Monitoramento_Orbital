import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Globe,
  ShieldAlert,
  Compass,
  Flame,
  Target,
  Clock,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { GATILHOS_DESCOBERTA, obterGatilhoPorIndice } from '../utils/orbitalDiscovery';

const ICONES_MAP = {
  AlertTriangle,
  Globe,
  ShieldAlert,
  Compass,
  Sparkles,
  Flame,
  Target,
  Clock
};

/**
 * Card Interativo de Descobertas Rápidas e Desafios Didáticos (Passo 2.1 — Fase 2)
 * Localizado no HUD tático para instigar a curiosidade e exploração ativa do usuário.
 */
export default function OrbitalDiscoveryCard({
  onInvestigarObjeto,
  onAplicarFiltroCategorias,
  onLocalizarGeo
}) {
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [statusAcao, setStatusAcao] = useState(null); // null | 'sucesso'

  const gatilho = obterGatilhoPorIndice(indiceAtual);
  const IconeComponente = ICONES_MAP[gatilho.icone] || Sparkles;

  const handleProximo = () => {
    setStatusAcao(null);
    setIndiceAtual(prev => (prev + 1) % GATILHOS_DESCOBERTA.length);
  };

  const handleAnterior = () => {
    setStatusAcao(null);
    setIndiceAtual(prev => (prev - 1 + GATILHOS_DESCOBERTA.length) % GATILHOS_DESCOBERTA.length);
  };

  const handleSortear = () => {
    setStatusAcao(null);
    let novoIndice = Math.floor(Math.random() * GATILHOS_DESCOBERTA.length);
    if (novoIndice === indiceAtual) {
      novoIndice = (novoIndice + 1) % GATILHOS_DESCOBERTA.length;
    }
    setIndiceAtual(novoIndice);
  };

  const handleExecutarAcao = async () => {
    setStatusAcao('executando');

    if (gatilho.alvoNorad && onInvestigarObjeto) {
      await onInvestigarObjeto(gatilho.alvoNorad);
      setStatusAcao('sucesso');
    } else if (gatilho.filtroCategorias && onAplicarFiltroCategorias) {
      onAplicarFiltroCategorias(gatilho.filtroCategorias);
      setStatusAcao('sucesso');
    } else if (gatilho.acaoTipo === 'filtrar_geo' && onLocalizarGeo) {
      await onLocalizarGeo();
      setStatusAcao('sucesso');
    }

    setTimeout(() => {
      setStatusAcao(null);
    }, 2800);
  };

  return (
    <div className={`orbital-discovery-card tipo-${gatilho.tipo}`}>
      {/* CABEÇALHO COM CONTROLES */}
      <div className="discovery-header">
        <div className="discovery-title-group">
          <IconeComponente size={14} style={{ color: gatilho.corIcone, flexShrink: 0 }} />
          <span className="discovery-label">Descubra</span>
          <span className="discovery-tag" style={{ borderColor: gatilho.corIcone, color: gatilho.corIcone }}>
            {gatilho.tagTipo}
          </span>
        </div>

        <div className="discovery-nav-controls">
          <button
            type="button"
            className="discovery-nav-btn"
            onClick={handleAnterior}
            title="Anterior"
            aria-label="Anterior"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            type="button"
            className="discovery-nav-btn shuffle-btn"
            onClick={handleSortear}
            title="Sortear"
            aria-label="Sortear"
          >
            <Shuffle size={11} />
          </button>
          <button
            type="button"
            className="discovery-nav-btn"
            onClick={handleProximo}
            title="Próximo"
            aria-label="Próximo"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* CORPO INFORMATIVO */}
      <div className="discovery-body">
        <div className="discovery-headline">
          <h4 className="discovery-title">{gatilho.titulo}</h4>
          <span className="discovery-regime-badge">{gatilho.badgeRegime}</span>
        </div>

        <p className="discovery-text">{gatilho.texto}</p>
      </div>

      {/* BOTÃO DE AÇÃO DIRETA NO GLOBO 3D */}
      <div className="discovery-footer">
        <button
          type="button"
          className={`discovery-action-btn ${statusAcao === 'sucesso' ? 'success' : ''}`}
          onClick={handleExecutarAcao}
          title={gatilho.acaoLabel}
        >
          {statusAcao === 'sucesso' ? (
            <>
              <CheckCircle2 size={13} className="btn-icon-check" />
              <span>✓ Localizado</span>
            </>
          ) : (
            <>
              <ExternalLink size={12} className="btn-icon-action" />
              <span>{gatilho.acaoLabel}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
