import { useState, useMemo } from 'react';
import {
  Sparkles,
  X,
  Play,
  RotateCcw,
  Sliders,
  ShieldAlert,
  Flame,
  Globe,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import {
  CENARIOS_PREDEFINIDOS,
  simularCenario2050
} from '../utils/scenarioSimulator';

/**
 * Modal Interativo: Simulador de Cenários "E Se...?" (Passo 3.2 — Fase 3)
 * Transforma a plataforma em um laboratório preditivo de astrodinâmica e sustentabilidade orbital.
 */
export default function ScenarioSimulatorModal({
  aberto,
  onFechar,
  onTocarSom
}) {
  const [cenarioAtivoId, setCenarioAtivoId] = useState('bau');
  const [lancamentosAno, setLancamentosAno] = useState(2400);
  const [taxaDesorbitagemPct, setTaxaDesorbitagemPct] = useState(65);
  const [vidaUtilAnos, setVidaUtilAnos] = useState(7);
  const [adesaoRegra5Anos, setAdesaoRegra5Anos] = useState(false);
  const [animandoSimulacao, setAnimandoSimulacao] = useState(false);

  // Seleciona um cenário pré-configurado
  const handleSelecionarCenario = (cenario) => {
    setCenarioAtivoId(cenario.id);
    setLancamentosAno(cenario.parametros.lancamentosAno);
    setTaxaDesorbitagemPct(cenario.parametros.taxaDesorbitagemPct);
    setVidaUtilAnos(cenario.parametros.vidaUtilAnos);
    setAdesaoRegra5Anos(cenario.parametros.adesaoRegra5Anos);
    if (onTocarSom) onTocarSom('slide');
  };

  // Restaura parâmetros para o padrão do cenário atual
  const handleResetarParametros = () => {
    const padrao = CENARIOS_PREDEFINIDOS.find(c => c.id === cenarioAtivoId) || CENARIOS_PREDEFINIDOS[0];
    handleSelecionarCenario(padrao);
  };

  // Dispara recálculo com efeito visual
  const handleExecutarSimulacao = () => {
    setAnimandoSimulacao(true);
    if (onTocarSom) onTocarSom('iniciar');
    setTimeout(() => {
      setAnimandoSimulacao(false);
    }, 400);
  };

  // Cálculo da simulação em tempo real (otimizado para rodar quando o modal estiver ativo)
  const resultadoSimulacao = useMemo(() => {
    if (!aberto) return null;
    try {
      return simularCenario2050({
        lancamentosAno,
        taxaDesorbitagemPct,
        vidaUtilAnos,
        adesaoRegra5Anos
      });
    } catch (err) {
      console.error('Erro ao simular cenário 2050:', err);
      return null;
    }
  }, [aberto, lancamentosAno, taxaDesorbitagemPct, vidaUtilAnos, adesaoRegra5Anos]);

  if (!aberto || !resultadoSimulacao) return null;

  const { resultados } = resultadoSimulacao;

  return (
    <div className="hud-modal-backdrop modal-opening" onClick={onFechar}>
      <div
        className="hud-modal-card scenario-simulator-modal-card card-opening"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* CABEÇALHO DO SIMULADOR */}
        {/* CABEÇALHO DO SIMULADOR */}
        <div className="modal-header">
          <div className="scenario-modal-title-group">
            <Sparkles size={20} className="scenario-title-icon" />
            <h3 className="scenario-main-title">Simulador de Cenários 2050</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onFechar}
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* CORPO PRINCIPAL COM CONTROLES E RESULTADOS */}
        <div className="modal-body-scrollable scenario-modal-body">

          {/* 1. SELETOR DE CENÁRIOS PRÉ-CONFIGURADOS */}
          <div className="scenario-preset-selector">
            <span className="scenario-section-badge">
              <Sliders size={12} />
              Cenários Pré-definidos
            </span>
            <div className="scenario-cards-grid">
              {CENARIOS_PREDEFINIDOS.map((cenario) => {
                const isAtivo = cenarioAtivoId === cenario.id;
                return (
                  <div
                    key={cenario.id}
                    className={`scenario-preset-card ${isAtivo ? 'active' : ''}`}
                    onClick={() => handleSelecionarCenario(cenario)}
                    style={{ borderColor: isAtivo ? cenario.cor : undefined }}
                  >
                    <div className="preset-card-top">
                      <span className="preset-tag" style={{ color: cenario.cor, borderColor: cenario.cor }}>
                        {cenario.tag}
                      </span>
                      {isAtivo && <CheckCircle2 size={14} style={{ color: cenario.cor }} />}
                    </div>
                    <h4 className="preset-title">{cenario.nome}</h4>
                    <p className="preset-desc">{cenario.descricao}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. LABORATÓRIO DE PARÂMETROS CUSTOMIZÁVEIS */}
          <div className="scenario-controls-panel">
            <div className="controls-panel-header">
              <span className="scenario-section-badge">
                <Sliders size={12} />
                Parâmetros
              </span>
              <button
                type="button"
                className="scenario-reset-btn"
                onClick={handleResetarParametros}
                title="Restaurar padrão"
              >
                <RotateCcw size={12} />
                <span>Padrão</span>
              </button>
            </div>

            <div className="scenario-sliders-grid">
              {/* SLIDER 1: LANÇAMENTOS POR ANO */}
              <div className="scenario-slider-box">
                <div className="slider-label-row">
                  <span className="slider-label">Lançamentos / Ano</span>
                  <span className="slider-value-display cyan">
                    {lancamentosAno.toLocaleString('pt-BR')} satélites
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="100"
                  value={lancamentosAno}
                  onChange={(e) => {
                    setCenarioAtivoId('customizado');
                    setLancamentosAno(parseInt(e.target.value, 10));
                  }}
                  className="scenario-range-input"
                  aria-label="Novos lançamentos por ano"
                />
                <div className="slider-range-hints">
                  <span>500</span>
                  <span className="highlight-hint">~2.400 (Atual)</span>
                  <span>5.000</span>
                </div>
              </div>

              {/* SLIDER 2: TAXA DE DESORBITAGEM PMD */}
              <div className="scenario-slider-box">
                <div className="slider-label-row">
                  <span className="slider-label">Desorbitagem (PMD)</span>
                  <span className={`slider-value-display ${taxaDesorbitagemPct >= 90 ? 'green' : taxaDesorbitagemPct >= 60 ? 'amber' : 'red'}`}>
                    {taxaDesorbitagemPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="99"
                  step="1"
                  value={taxaDesorbitagemPct}
                  onChange={(e) => {
                    setCenarioAtivoId('customizado');
                    setTaxaDesorbitagemPct(parseInt(e.target.value, 10));
                  }}
                  className="scenario-range-input"
                  aria-label="Taxa de desorbitagem"
                />
                <div className="slider-range-hints">
                  <span>20%</span>
                  <span>~65% (Atual)</span>
                  <span className="highlight-hint green-hint">95%+</span>
                </div>
              </div>

              {/* SLIDER 3: VIDA ÚTIL MÉDIA */}
              <div className="scenario-slider-box">
                <div className="slider-label-row">
                  <span className="slider-label">Vida Útil</span>
                  <span className="slider-value-display cyan">
                    {vidaUtilAnos} anos
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="1"
                  value={vidaUtilAnos}
                  onChange={(e) => {
                    setCenarioAtivoId('customizado');
                    setVidaUtilAnos(parseInt(e.target.value, 10));
                  }}
                  className="scenario-range-input"
                  aria-label="Vida útil dos satélites"
                />
                <div className="slider-range-hints">
                  <span>3 anos</span>
                  <span>~7 anos (LEO)</span>
                  <span>15 anos</span>
                </div>
              </div>

              {/* SWITCH: REGRA ESTRITA DOS 5 ANOS */}
              <div className="scenario-checkbox-box">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={adesaoRegra5Anos}
                    onChange={(e) => {
                      setCenarioAtivoId('customizado');
                      setAdesaoRegra5Anos(e.target.checked);
                    }}
                  />
                  <span className="custom-checkmark" />
                  <div className="checkbox-text-group">
                    <span className="checkbox-title">Regra dos 5 Anos (FCC / IADC)</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* 3. BOTÃO DE AÇÃO: DISPARAR SIMULAÇÃO */}
          <div className="scenario-trigger-bar">
            <button
              type="button"
              className={`scenario-run-btn ${animandoSimulacao ? 'running' : ''}`}
              onClick={handleExecutarSimulacao}
            >
              <Play size={16} />
              <span>{animandoSimulacao ? 'Calculando...' : 'Simular 2050'}</span>
            </button>
          </div>

          {/* 4. RESULTADOS PROJETADOS PARA 2050 */}
          <div className={`scenario-results-section ${animandoSimulacao ? 'pulse-calc' : ''}`}>
            <span className="scenario-section-badge">
              <TrendingUp size={12} />
              Resultados 2050
            </span>

            {/* QUADRO DE GRANDES NÚMEROS */}
            <div className="scenario-results-grid">

              {/* CARD 1: POPULAÇÃO TOTAL */}
              <div className="scenario-res-card">
                <div className="res-card-header">
                  <Globe size={16} className="res-card-icon cyan" />
                  <span className="res-card-label">OBJETOS EM 2050</span>
                </div>
                <div className="res-card-val-row">
                  <span className="res-card-main-val">
                    {resultados.totalObjetos2050.toLocaleString('pt-BR')}
                  </span>
                  <span className={`res-card-delta-badge ${resultados.variacaoObjetosPct > 0 ? 'up' : 'down'}`}>
                    {resultados.variacaoObjetosPct > 0 ? `+${resultados.variacaoObjetosPct}%` : `${resultados.variacaoObjetosPct}%`}
                  </span>
                </div>
                <div className="res-card-composition-bar">
                  <div
                    className="comp-segment ativ"
                    style={{ width: `${resultados.satelitesAtivosPct}%` }}
                    title={`${resultados.satelitesAtivos2050.toLocaleString('pt-BR')} Ativos (${resultados.satelitesAtivosPct}%)`}
                  />
                  <div
                    className="comp-segment inert"
                    style={{ width: `${resultados.detritosPct}%` }}
                    title={`${resultados.totalInertes2050.toLocaleString('pt-BR')} Detritos (${resultados.detritosPct}%)`}
                  />
                </div>
                <div className="res-card-sub-stats">
                  <span>Ativos: <strong style={{ color: 'var(--neon-green)' }}>{resultados.satelitesAtivosPct}%</strong></span>
                  <span>Detritos: <strong style={{ color: 'var(--neon-red)' }}>{resultados.detritosPct}%</strong></span>
                </div>
              </div>

              {/* CARD 2: OBJETOS INERTES E DETRITOS */}
              <div className="scenario-res-card highlight-border" style={{ borderColor: 'var(--neon-amber)' }}>
                <div className="res-card-header">
                  <ShieldAlert size={16} style={{ color: 'var(--neon-amber)' }} />
                  <span className="res-card-label">OBJETOS INERTES</span>
                </div>
                <div className="res-card-val-row">
                  <span className="res-card-main-val" style={{ color: 'var(--neon-amber)' }}>
                    {resultados.totalInertes2050.toLocaleString('pt-BR')}
                  </span>
                  <span className="res-card-unit">({resultados.detritosPct}%)</span>
                </div>
              </div>

              {/* CARD 3: RISCO DE CASCATA KESSLER */}
              <div className="scenario-res-card">
                <div className="res-card-header">
                  <ShieldAlert size={16} className={`res-card-icon ${resultados.alertaCascata ? 'red' : 'amber'}`} />
                  <span className="res-card-label">RISCO DE CASCATA</span>
                </div>
                <div className="res-card-val-row">
                  <span className={`res-card-main-val ${resultados.alertaCascata ? 'red' : 'amber'}`}>
                    {resultados.probabilidadeKesslerPct}%
                  </span>
                  <span className="res-card-unit">probabilidade</span>
                </div>
                <div className="res-card-kessler-bar">
                  <div
                    className="kessler-bar-fill"
                    style={{
                      width: `${resultados.probabilidadeKesslerPct}%`,
                      backgroundColor: resultados.alertaCascata ? 'var(--neon-red)' : 'var(--neon-amber)'
                    }}
                  />
                </div>
              </div>

              {/* CARD 4: POLUIÇÃO ESTRATOSFÉRICA */}
              <div className="scenario-res-card">
                <div className="res-card-header">
                  <Flame size={16} className="res-card-icon red" />
                  <span className="res-card-label">QUEIMA ATMOSFÉRICA</span>
                </div>
                <div className="res-card-val-row">
                  <span className="res-card-main-val">
                    {resultados.toneladasQueimadasAno}
                  </span>
                  <span className="res-card-unit">ton / ano</span>
                </div>
                <div className="res-card-sub-stats">
                  <span>Al₂O₃: <strong>~{resultados.toneladasAluminioOxidoAno} t/ano</strong></span>
                </div>
              </div>

            </div>

            {/* BOX DE SÍNTESE E ALERTA CIENTÍFICO */}
            <div className={`scenario-synthesis-box ${resultados.alertaCascata ? 'kessler-alert' : 'stable-mode'}`}>
              <div className="synthesis-header">
                {resultados.alertaCascata ? (
                  <ShieldAlert size={18} className="synthesis-icon red" />
                ) : (
                  <CheckCircle2 size={18} className="synthesis-icon green" />
                )}
                <h4 className="synthesis-title">Diagnóstico Numérico</h4>
              </div>
              <p className="synthesis-text">{resultados.diagnosticoTexto}</p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
