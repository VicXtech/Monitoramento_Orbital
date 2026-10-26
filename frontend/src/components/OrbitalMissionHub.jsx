import { useState, useEffect, useRef, useCallback } from 'react';
import { MISSOES_ORBITAIS, sortearProximaMissao } from '../utils/orbitalMissions';

export default function OrbitalMissionHub({
  ativo = true,
  satSelecionado,
  parametrosOrbitaisSat,
  pausado = false,
  onTocarSom
}) {
  const [historicoIds, setHistoricoIds] = useState([]);
  const [missaoAtual, setMissaoAtual] = useState(() => sortearProximaMissao([]));
  const [tempoRestante, setTempoRestante] = useState(missaoAtual.tempoSegundos || 45);
  const [estadoFase, setEstadoFase] = useState('ACTIVE'); // 'ACTIVE' | 'SUCCESS' | 'EXPIRED' | 'COOLDOWN'
  const [emCooldown, setEmCooldown] = useState(false);
  const [notificacaoSpawn, setNotificacaoSpawn] = useState(false);

  const timerCronometroRef = useRef(null);
  const timerCooldownRef = useRef(null);
  const timerSucessoRef = useRef(null);
  const timerExpiradoRef = useRef(null);

  // Inicia uma nova missao
  const iniciarMissao = useCallback((novaMissao) => {
    if (timerCronometroRef.current) clearInterval(timerCronometroRef.current);
    if (timerCooldownRef.current) clearTimeout(timerCooldownRef.current);
    if (timerSucessoRef.current) clearTimeout(timerSucessoRef.current);
    if (timerExpiradoRef.current) clearTimeout(timerExpiradoRef.current);

    setMissaoAtual(novaMissao);
    setTempoRestante(novaMissao.tempoSegundos || 45);
    setEstadoFase('ACTIVE');
    setEmCooldown(false);
    setNotificacaoSpawn(true);
    setTimeout(() => setNotificacaoSpawn(false), 2500);
  }, []);

  // Entra em estado de cooldown e agenda o proximo spawn silencioso aleatorio (45s a 90s)
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
        if (onTocarSom) onTocarSom('iniciar');
        return [...prev, prox.id];
      });
    }, tempoCooldownMs);
  }, [iniciarMissao, onTocarSom]);

  // Troca manual de missao
  const handleTrocar = (e) => {
    if (e) e.stopPropagation();
    if (onTocarSom) onTocarSom('slide');
    const prox = sortearProximaMissao([...historicoIds, missaoAtual.id]);
    setHistoricoIds((prev) => [...prev, prox.id]);
    iniciarMissao(prox);
  };

  // Repete a mesma missao apos expirar
  const handleRepetir = (e) => {
    if (e) e.stopPropagation();
    if (timerExpiradoRef.current) clearTimeout(timerExpiradoRef.current);
    if (onTocarSom) onTocarSom('slide');
    iniciarMissao(missaoAtual);
  };

  // Botao de fechar recolhe o painel e entra em cooldown aleatorio
  const handleFechar = (e) => {
    if (e) e.stopPropagation();
    if (timerExpiradoRef.current) clearTimeout(timerExpiradoRef.current);
    if (onTocarSom) onTocarSom('slide');
    entrarEmCooldown();
  };

  // Cronometro regressivo com suporte a pausa
  useEffect(() => {
    if (!ativo || estadoFase !== 'ACTIVE' || emCooldown || pausado) return;

    timerCronometroRef.current = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timerCronometroRef.current);
          setEstadoFase('EXPIRED');
          if (onTocarSom) onTocarSom('falha');

          // Permanece 5 segundos exibindo a dica antes de entrar em cooldown
          timerExpiradoRef.current = setTimeout(() => {
            entrarEmCooldown();
          }, 5000);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerCronometroRef.current) clearInterval(timerCronometroRef.current);
    };
  }, [ativo, estadoFase, emCooldown, pausado, onTocarSom, entrarEmCooldown]);

  // Validacao continua da condicao astrodinamica
  useEffect(() => {
    if (!ativo || estadoFase !== 'ACTIVE' || emCooldown) return;

    const vitoria = missaoAtual.verificar({
      satSelecionado,
      parametrosOrbitaisSat
    });

    if (vitoria) {
      if (timerCronometroRef.current) clearInterval(timerCronometroRef.current);
      setEstadoFase('SUCCESS');
      if (onTocarSom) onTocarSom('sucesso');

      setHistoricoIds((prev) => (prev.includes(missaoAtual.id) ? prev : [...prev, missaoAtual.id]));

      // Permanece 4 segundos no estado de sucesso antes de entrar em cooldown
      timerSucessoRef.current = setTimeout(() => {
        entrarEmCooldown();
      }, 4000);
    }
  }, [ativo, satSelecionado, parametrosOrbitaisSat, estadoFase, emCooldown, missaoAtual, onTocarSom, entrarEmCooldown]);

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

  let corBarra = 'var(--neon-cyan, #00f0ff)';
  if (pctTempo <= 15) {
    corBarra = 'var(--neon-red, #ff0055)';
  } else if (pctTempo <= 35) {
    corBarra = 'var(--neon-amber, #ffaa00)';
  }

  const minutos = Math.floor(tempoRestante / 60).toString().padStart(2, '0');
  const segundos = (tempoRestante % 60).toString().padStart(2, '0');
  const relogioFormatado = `${minutos}:${segundos}`;

  return (
    <div
      className={`orbital-mission-hub-panel status-${estadoFase.toLowerCase()} ${notificacaoSpawn ? 'spawn-pulse' : ''}`}
      role="region"
      aria-label="Missão Tática"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Barra de progresso regressiva continua de 3px no topo do card */}
      <div className="mission-progress-track">
        <div
          className="mission-progress-bar"
          style={{
            width: `${pctTempo}%`,
            backgroundColor: corBarra,
            boxShadow: `0 0 8px ${corBarra}`
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
            <div className="hub-fail-actions">
              <button
                type="button"
                className="hub-btn-retry"
                onClick={handleRepetir}
              >
                Repetir
              </button>
              <button
                type="button"
                className="hub-btn-next"
                onClick={handleFechar}
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

