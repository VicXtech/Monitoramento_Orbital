import { useState, useEffect, useRef, useCallback } from 'react';
import { sortearProximaMissao } from '../utils/orbitalMissions';

export default function OrbitalMissionHub({
  ativo = true,
  satSelecionado,
  parametrosOrbitaisSat,
  pausado = false,
  multiplicadorTempo = 1,
  densidadeCatalogo = 'tatica',
  regimeAtivo = null,
  abaDetalheAtiva = 'telemetria',
  modoOrbitalAtivo = false,
  pinoOrbitalAtivo = null,
  painelEsquerdoAberto = true,
  onTocarSom
}) {
  const [historicoIds, setHistoricoIds] = useState([]);
  const [missaoAtual, setMissaoAtual] = useState(() => sortearProximaMissao([]));
  const [tempoRestante, setTempoRestante] = useState(missaoAtual.tempoSegundos || 45);
  const [estadoFase, setEstadoFase] = useState('ACTIVE');
  const [emCooldown, setEmCooldown] = useState(true);

  // Armazena callback de som em ref para evitar quebrar dependencias de timers
  const onTocarSomRef = useRef(onTocarSom);
  useEffect(() => {
    onTocarSomRef.current = onTocarSom;
  });

  const timerCronometroRef = useRef(null);
  const timerCooldownRef = useRef(null);
  const timerSucessoRef = useRef(null);
  const timerExpiradoRef = useRef(null);
  const spawnAgendadoRef = useRef(false);
  const estadoNoInicioRef = useRef({ satNorad: null, aba: null });

  // Inicia uma nova missao
  const iniciarMissao = useCallback((novaMissao) => {
    if (timerCronometroRef.current) clearInterval(timerCronometroRef.current);
    if (timerCooldownRef.current) clearTimeout(timerCooldownRef.current);
    if (timerSucessoRef.current) clearTimeout(timerSucessoRef.current);
    if (timerExpiradoRef.current) clearTimeout(timerExpiradoRef.current);

    estadoNoInicioRef.current = {
      satNorad: satSelecionado?.norad_id,
      aba: abaDetalheAtiva
    };

    setMissaoAtual(novaMissao);
    setTempoRestante(novaMissao.tempoSegundos || 45);
    setEstadoFase('ACTIVE');
    setEmCooldown(false);
  }, [satSelecionado?.norad_id, abaDetalheAtiva]);

  // Entra em estado de cooldown e agenda o proximo spawn silencioso
  const entrarEmCooldown = useCallback(() => {
    if (timerCronometroRef.current) clearInterval(timerCronometroRef.current);
    if (timerSucessoRef.current) clearTimeout(timerSucessoRef.current);
    if (timerExpiradoRef.current) clearTimeout(timerExpiradoRef.current);
    setEmCooldown(true);
    setEstadoFase('COOLDOWN');

    const tempoCooldownMs = Math.floor(Math.random() * 45000) + 45000;
    timerCooldownRef.current = setTimeout(() => {
      setHistoricoIds((prev) => {
        const prox = sortearProximaMissao(prev);
        iniciarMissao(prox);
        onTocarSomRef.current?.('iniciar');
        return [...prev, prox.id];
      });
    }, tempoCooldownMs);
  }, [iniciarMissao]);

  // Atraso inicial de 5 segundos para a primeira missao aparecer ao entrar no simulador
  useEffect(() => {
    if (!ativo) {
      spawnAgendadoRef.current = false;
      if (timerCooldownRef.current) clearTimeout(timerCooldownRef.current);
      return;
    }

    if (spawnAgendadoRef.current) return;

    timerCooldownRef.current = setTimeout(() => {
      spawnAgendadoRef.current = true;
      setHistoricoIds((prev) => {
        const primeira = sortearProximaMissao(prev);
        iniciarMissao(primeira);
        onTocarSomRef.current?.('iniciar');
        return [...prev, primeira.id];
      });
    }, 5000);

    return () => {
      if (timerCooldownRef.current) clearTimeout(timerCooldownRef.current);
    };
  }, [ativo, iniciarMissao]);

  // Troca manual de missao
  const handleTrocar = (e) => {
    if (e) e.stopPropagation();
    onTocarSomRef.current?.('slide');
    const prox = sortearProximaMissao([...historicoIds, missaoAtual.id]);
    setHistoricoIds((prev) => [...prev, prox.id]);
    iniciarMissao(prox);
  };

  // Botao de fechar recolhe o painel e entra em cooldown
  const handleFechar = (e) => {
    if (e) e.stopPropagation();
    if (timerExpiradoRef.current) clearTimeout(timerExpiradoRef.current);
    onTocarSomRef.current?.('slide');
    entrarEmCooldown();
  };

  // Cronometro regressivo continuo com suporte a pausa de modais
  useEffect(() => {
    if (!ativo || estadoFase !== 'ACTIVE' || emCooldown || pausado) return;

    const intervalId = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setEstadoFase('EXPIRED');

          // Permanece 5 segundos exibindo a dica antes de entrar em cooldown
          timerExpiradoRef.current = setTimeout(() => {
            entrarEmCooldown();
          }, 5000);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timerCronometroRef.current = intervalId;

    return () => {
      clearInterval(intervalId);
    };
  }, [ativo, estadoFase, emCooldown, pausado, entrarEmCooldown]);

  // Validacao continua da condicao da missao
  useEffect(() => {
    if (!ativo || estadoFase !== 'ACTIVE' || emCooldown) return;

    const vitoria = missaoAtual.verificar({
      satSelecionado,
      parametrosOrbitaisSat,
      multiplicadorTempo,
      densidadeCatalogo,
      regimeAtivo,
      abaDetalheAtiva,
      modoOrbitalAtivo,
      pinoOrbitalAtivo,
      satNoradNoInicio: estadoNoInicioRef.current.satNorad,
      abaNoInicio: estadoNoInicioRef.current.aba
    });

    if (vitoria) {
      if (timerCronometroRef.current) clearInterval(timerCronometroRef.current);
      setEstadoFase('SUCCESS');
      onTocarSomRef.current?.('sucesso');

      setHistoricoIds((prev) => (prev.includes(missaoAtual.id) ? prev : [...prev, missaoAtual.id]));

      // Permanece 4 segundos no estado de sucesso antes de entrar em cooldown
      timerSucessoRef.current = setTimeout(() => {
        entrarEmCooldown();
      }, 4000);
    }
  }, [
    ativo,
    satSelecionado,
    parametrosOrbitaisSat,
    multiplicadorTempo,
    densidadeCatalogo,
    regimeAtivo,
    abaDetalheAtiva,
    modoOrbitalAtivo,
    pinoOrbitalAtivo,
    estadoFase,
    emCooldown,
    missaoAtual,
    entrarEmCooldown
  ]);

  // Limpeza geral ao desmontar
  useEffect(() => {
    return () => {
      if (timerCronometroRef.current) clearInterval(timerCronometroRef.current);
      if (timerCooldownRef.current) clearTimeout(timerCooldownRef.current);
      if (timerSucessoRef.current) clearTimeout(timerSucessoRef.current);
      if (timerExpiradoRef.current) clearTimeout(timerExpiradoRef.current);
    };
  }, []);

  if (!ativo || emCooldown) return null;

  const totalSegundos = missaoAtual.tempoSegundos || 45;
  const pctTempo = Math.max(0, Math.min(100, (tempoRestante / totalSegundos) * 100));

  let corBarra = 'var(--cat-station, #38BDF8)';
  if (pctTempo <= 15) {
    corBarra = 'var(--cat-debris, #E05252)';
  } else if (pctTempo <= 35) {
    corBarra = 'var(--cat-inactive, #E5A93C)';
  }

  const minutos = Math.floor(tempoRestante / 60).toString().padStart(2, '0');
  const segundos = (tempoRestante % 60).toString().padStart(2, '0');
  const relogioFormatado = `${minutos}:${segundos}`;

  return (
    <div
      className={`orbital-mission-hub-panel status-${estadoFase.toLowerCase()} ${modoOrbitalAtivo ? 'in-orbital-mode' : (painelEsquerdoAberto ? 'docked-left-panel' : 'docked-screen-edge')}`}
      role="region"
      aria-label="Missão Tática"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Barra de progresso regressiva de 3px no topo do card */}
      <div className="mission-progress-track">
        <div
          className="mission-progress-bar"
          style={{
            width: `${pctTempo}%`,
            backgroundColor: corBarra
          }}
        />
      </div>

      {/* Cabecalho tatico com niveis e acoes */}
      <div className="hub-top-bar">
        <div className="hub-tag-group">
          <span className="hub-type-label">MISSÃO TÁTICA</span>
          <span className="hub-level-badge">{missaoAtual.nivelRotulo}</span>
          <span className={`hub-status-badge status-${estadoFase.toLowerCase()}`}>
            {estadoFase === 'SUCCESS' ? 'CONCLUÍDA' : estadoFase === 'EXPIRED' ? 'EXPIRADA' : 'ATIVA'}
          </span>
          {pausado && estadoFase === 'ACTIVE' && (
            <span className="hub-paused-badge">PAUSADA</span>
          )}
        </div>

        <div className="hub-actions-group">
          {estadoFase === 'ACTIVE' && (
            <div
              className={`hub-timer-badge ${pctTempo <= 20 ? 'urgent' : ''}`}
              style={{ color: corBarra, borderColor: `${corBarra}55` }}
            >
              <span>{relogioFormatado}</span>
            </div>
          )}

          {estadoFase === 'ACTIVE' && (
            <button
              type="button"
              className="hub-btn-action swap"
              onClick={handleTrocar}
              title="Trocar missão"
            >
              <span>Trocar</span>
            </button>
          )}

          <button
            type="button"
            className="hub-btn-action remove"
            onClick={handleFechar}
            title="Fechar missão"
          >
            <span>Fechar</span>
          </button>
        </div>
      </div>

      {/* Corpo principal da missao */}
      <div className="hub-main-body">
        <h4 className="hub-item-title">{missaoAtual.titulo}</h4>
        <p className="hub-item-desc">{missaoAtual.descricao}</p>

        {/* Feedback visual de sucesso */}
        {estadoFase === 'SUCCESS' && (
          <div className="hub-feedback-success">
            <span className="feedback-bold">MISSÃO CUMPRIDA</span>
            <span className="feedback-sub">Dados validados no Diagnóstico Orbital.</span>
          </div>
        )}

        {/* Feedback visual de expiracao */}
        {estadoFase === 'EXPIRED' && (
          <div className="hub-feedback-fail">
            <span className="feedback-bold">TEMPO ESGOTADO</span>
            <span className="feedback-sub">{missaoAtual.dica}</span>
          </div>
        )}
      </div>
    </div>
  );
}

