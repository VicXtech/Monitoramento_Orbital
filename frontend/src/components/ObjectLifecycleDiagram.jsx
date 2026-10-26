import { useState, useMemo } from 'react';
import {
  Rocket,
  Activity,
  AlertTriangle,
  PowerOff,
  Flame,
  Shield,
  Skull,
  Info,
  ChevronRight,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import {
  ESTAGIOS_CICLO_VIDA,
  determinarEstagioAtual,
  avaliarDestinoProjetado,
  obterDossieEstagio
} from '../utils/orbitalLifecycle';

/**
 * Componente do Ciclo de Vida do Satélite & Jornada Astrodinâmica (Passo 3.3)
 * Implementa o fluxograma ramificado interativo proposto na Seção 5 de Alterações OrbitalED.md:
 * LANÇAMENTO -> OPERAÇÃO -> FIM DA MISSÃO -> DESATIVAÇÃO -> [REENTRADA vs. ÓRBITA CEMITÉRIO vs. POSSÍVEL DETRITO]
 */
export default function ObjectLifecycleDiagram({
  satSelecionado,
  parametrosOrbitaisSat
}) {
  const estagioAtualId = useMemo(
    () => determinarEstagioAtual(satSelecionado, parametrosOrbitaisSat),
    [satSelecionado, parametrosOrbitaisSat]
  );

  const { rotaRecomendada, justificativa } = useMemo(
    () => avaliarDestinoProjetado(satSelecionado, parametrosOrbitaisSat),
    [satSelecionado, parametrosOrbitaisSat]
  );

  // O nó selecionado para inspeção didática (inicia no estágio atual do objeto)
  const [estagioInspecionadoId, setEstagioInspecionadoId] = useState(estagioAtualId);

  // Dados do dossiê educativo para o estágio clicado
  const dossie = useMemo(
    () => obterDossieEstagio(estagioInspecionadoId, satSelecionado, parametrosOrbitaisSat),
    [estagioInspecionadoId, satSelecionado, parametrosOrbitaisSat]
  );

  if (!satSelecionado || !dossie) return null;

  return (
    <div className="lifecycle-diagram-container">
      {/* CABEÇALHO TÁTICO DO FLUXOGRAMA */}
      <div className="lifecycle-header-bar">
        <div className="lifecycle-title-group">
          <Activity size={14} className="lifecycle-header-icon" />
          <span className="lifecycle-title">Ciclo de Vida</span>
        </div>
      </div>

      {/* FLUXOGRAMA RAMIFICADO INTERATIVO */}
      <div className="lifecycle-tree-wrapper">
        {/* TRONCO PRINCIPAL SEQUENCIAL */}
        <div className="lifecycle-sequential-trunk">
          {/* NÓ 1: LANÇAMENTO */}
          <button
            type="button"
            className={`lifecycle-node-btn ${estagioInspecionadoId === ESTAGIOS_CICLO_VIDA.LANCAMENTO ? 'selected' : ''} ${estagioAtualId === ESTAGIOS_CICLO_VIDA.LANCAMENTO ? 'current-phase' : 'completed-phase'}`}
            onClick={() => setEstagioInspecionadoId(ESTAGIOS_CICLO_VIDA.LANCAMENTO)}
            title="Lançamento"
          >
            <div className="node-icon-box">
              <Rocket size={14} />
            </div>
            <div className="node-text-group">
              <span className="node-label">1. Lançamento</span>
            </div>
            {estagioAtualId === ESTAGIOS_CICLO_VIDA.LANCAMENTO && (
              <span className="node-current-tag">ATUAL</span>
            )}
          </button>

          <div className="lifecycle-connector-line">
            <span className="connector-arrow">↓</span>
          </div>

          {/* NÓ 2: OPERAÇÃO */}
          <button
            type="button"
            className={`lifecycle-node-btn ${estagioInspecionadoId === ESTAGIOS_CICLO_VIDA.OPERACAO ? 'selected' : ''} ${estagioAtualId === ESTAGIOS_CICLO_VIDA.OPERACAO ? 'current-phase' : ''}`}
            onClick={() => setEstagioInspecionadoId(ESTAGIOS_CICLO_VIDA.OPERACAO)}
            title="Operação"
          >
            <div className="node-icon-box">
              <Activity size={14} />
            </div>
            <div className="node-text-group">
              <span className="node-label">2. Operação</span>
            </div>
            {estagioAtualId === ESTAGIOS_CICLO_VIDA.OPERACAO && (
              <span className="node-current-tag pulse">ATUAL</span>
            )}
          </button>

          <div className="lifecycle-connector-line">
            <span className="connector-arrow">↓</span>
          </div>

          {/* NÓ 3: FIM DA MISSÃO */}
          <button
            type="button"
            className={`lifecycle-node-btn ${estagioInspecionadoId === ESTAGIOS_CICLO_VIDA.FIM_MISSAO ? 'selected' : ''} ${estagioAtualId === ESTAGIOS_CICLO_VIDA.FIM_MISSAO ? 'current-phase' : ''}`}
            onClick={() => setEstagioInspecionadoId(ESTAGIOS_CICLO_VIDA.FIM_MISSAO)}
            title="Fim de Missão"
          >
            <div className="node-icon-box">
              <AlertTriangle size={14} />
            </div>
            <div className="node-text-group">
              <span className="node-label">3. Fim de Missão</span>
            </div>
            {estagioAtualId === ESTAGIOS_CICLO_VIDA.FIM_MISSAO && (
              <span className="node-current-tag warning">ATUAL</span>
            )}
          </button>

          <div className="lifecycle-connector-line">
            <span className="connector-arrow">↓</span>
          </div>

          {/* NÓ 4: DESATIVAÇÃO */}
          <button
            type="button"
            className={`lifecycle-node-btn ${estagioInspecionadoId === ESTAGIOS_CICLO_VIDA.DESATIVACAO ? 'selected' : ''} ${estagioAtualId === ESTAGIOS_CICLO_VIDA.DESATIVACAO ? 'current-phase' : ''}`}
            onClick={() => setEstagioInspecionadoId(ESTAGIOS_CICLO_VIDA.DESATIVACAO)}
            title="Desativação"
          >
            <div className="node-icon-box">
              <PowerOff size={14} />
            </div>
            <div className="node-text-group">
              <span className="node-label">4. Desativação</span>
            </div>
            {estagioAtualId === ESTAGIOS_CICLO_VIDA.DESATIVACAO && (
              <span className="node-current-tag warning">ATUAL</span>
            )}
          </button>
        </div>

        {/* BIFURCAÇÃO GRÁFICA DE DESCARTE (FORK) */}
        <div className="lifecycle-fork-connector">
          <div className="fork-horizontal-bar"></div>
          <div className="fork-branch-drops">
            <span className="branch-drop drop-left"></span>
            <span className="branch-drop drop-center"></span>
            <span className="branch-drop drop-right"></span>
          </div>
        </div>

        {/* RAMOS DE DESTINO FINAL (3 OPÇÕES REGULAMENTARES) */}
        <div className="lifecycle-branches-grid">
          {/* RAMO A: REENTRADA ATMOSFÉRICA */}
          <button
            type="button"
            className={`lifecycle-branch-card branch-reentry ${estagioInspecionadoId === ESTAGIOS_CICLO_VIDA.REENTRADA ? 'selected' : ''} ${rotaRecomendada === ESTAGIOS_CICLO_VIDA.REENTRADA ? 'recommended-route' : ''}`}
            onClick={() => setEstagioInspecionadoId(ESTAGIOS_CICLO_VIDA.REENTRADA)}
            title="Reentrada"
          >
            <div className="branch-header">
              <Flame size={14} className="branch-icon flame-icon" />
              <span className="branch-title">Reentrada</span>
            </div>
            {rotaRecomendada === ESTAGIOS_CICLO_VIDA.REENTRADA && (
              <span className="branch-badge recommended">PROJETADA</span>
            )}
          </button>

          {/* RAMO B: ÓRBITA CEMITÉRIO */}
          <button
            type="button"
            className={`lifecycle-branch-card branch-graveyard ${estagioInspecionadoId === ESTAGIOS_CICLO_VIDA.CEMITERIO ? 'selected' : ''} ${rotaRecomendada === ESTAGIOS_CICLO_VIDA.CEMITERIO ? 'recommended-route' : ''}`}
            onClick={() => setEstagioInspecionadoId(ESTAGIOS_CICLO_VIDA.CEMITERIO)}
            title="Órbita Cemitério"
          >
            <div className="branch-header">
              <Shield size={14} className="branch-icon graveyard-icon" />
              <span className="branch-title">Cemitério</span>
            </div>
            {rotaRecomendada === ESTAGIOS_CICLO_VIDA.CEMITERIO && (
              <span className="branch-badge recommended">PROJETADA</span>
            )}
          </button>

          {/* RAMO C: POSSÍVEL DETRITO (ALERTA KESSLER) */}
          <button
            type="button"
            className={`lifecycle-branch-card branch-debris ${estagioInspecionadoId === ESTAGIOS_CICLO_VIDA.DETRITO ? 'selected' : ''} ${rotaRecomendada === ESTAGIOS_CICLO_VIDA.DETRITO ? 'recommended-route' : ''}`}
            onClick={() => setEstagioInspecionadoId(ESTAGIOS_CICLO_VIDA.DETRITO)}
            title="Detrito Inerte"
          >
            <div className="branch-header">
              <AlertOctagon size={14} className="branch-icon alert-icon" />
              <span className="branch-title">Detrito</span>
            </div>
            {rotaRecomendada === ESTAGIOS_CICLO_VIDA.DETRITO && (
              <span className="branch-badge alert">CRÍTICO</span>
            )}
          </button>
        </div>
      </div>

      {/* DOSSIÊ DIDÁTICO DO ESTÁGIO SELECIONADO */}
      <div className="lifecycle-dossier-card">
        <div className="dossier-card-header">
          <div className="dossier-title-group">
            <h4 className="dossier-title">{dossie.titulo}</h4>
          </div>
          <span className={`dossier-status-pill status-${(dossie.statusNoObjeto || '').toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
            {dossie.statusNoObjeto}
          </span>
        </div>

        <div className="dossier-content-body">
          <div className="dossier-section">
            <div className="dossier-section-header">
              <Info size={12} className="section-icon cyan" />
              <span>Visão Geral</span>
            </div>
            <p className="dossier-text">{dossie.descricaoGeral}</p>
          </div>

          <div className="dossier-section highlight-target">
            <div className="dossier-section-header">
              <CheckCircle2 size={12} className="section-icon green" />
              <span>Diagnóstico do Objeto</span>
            </div>
            <p className="dossier-text specific-text">{dossie.situacaoDesteObjeto}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
