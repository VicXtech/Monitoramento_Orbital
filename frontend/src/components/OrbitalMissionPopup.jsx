import { useState, useEffect, useRef } from 'react';
import {
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  HelpCircle,
  Sparkles
} from 'lucide-react';

/**
 * Pop-up Flutuante de Missão Educacional Relâmpago (Passo 2.2 — Fase 2)
 * Surge de forma programada/aleatória no canto da tela com cronômetro regressivo.
 * Valida ações do usuário em tempo real e auto-destrói após sucesso ou tempo esgotado.
 */
export default function OrbitalMissionPopup({
  missao,
  onFechar,
  satSelecionado,
  parametrosOrbitaisSat,
  abaAtiva,
  onTocarSom
}) {
  const [prevMissaoId, setPrevMissaoId] = useState(missao?.id);
  const [tempoRestante, setTempoRestante] = useState(missao ? missao.tempoSegundos : 45);
  const [statusMissao, setStatusMissao] = useState('em_andamento'); // 'em_andamento' | 'sucesso' | 'falhou'
  const [mostrarDica, setMostrarDica] = useState(false);
  const timerRef = useRef(null);
  const autoCloseRef = useRef(null);

  // Sincroniza estado de forma recomendada pelo React ao trocar de missão
  if (missao && missao.id !== prevMissaoId) {
    setPrevMissaoId(missao.id);
    setTempoRestante(missao.tempoSegundos);
    setStatusMissao('em_andamento');
    setMostrarDica(false);
  }

  // Cronômetro decrescente
  useEffect(() => {
    if (!missao || statusMissao !== 'em_andamento') return;

    timerRef.current = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setStatusMissao('falhou');
          if (onTocarSom) onTocarSom('falha');

          // Auto-fecha após 3.5 segundos exibindo que falhou
          autoCloseRef.current = setTimeout(() => {
            onFechar();
          }, 3500);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [missao, statusMissao, onFechar, onTocarSom]);

  // Verificação contínua das ações do usuário no simulador
  useEffect(() => {
    if (!missao || statusMissao !== 'em_andamento') return;

    const completou = missao.verificar({
      satSelecionado,
      parametrosOrbitaisSat,
      abaAtiva
    });

    if (completou) {
      if (timerRef.current) clearInterval(timerRef.current);
      const timerSucesso = setTimeout(() => {
        setStatusMissao('sucesso');
        if (onTocarSom) onTocarSom('sucesso');
      }, 0);

      // Auto-fecha após 3.8 segundos exibindo a síntese de missão cumprida
      autoCloseRef.current = setTimeout(() => {
        onFechar();
      }, 3800);

      return () => clearTimeout(timerSucesso);
    }
  }, [missao, statusMissao, satSelecionado, parametrosOrbitaisSat, abaAtiva, onFechar, onTocarSom]);

  // Limpeza de timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
    };
  }, []);

  if (!missao) return null;

  const pctTempo = Math.max(0, Math.min(100, (tempoRestante / missao.tempoSegundos) * 100));
  const corProgresso = pctTempo > 45 ? 'var(--neon-cyan)' : pctTempo > 20 ? 'var(--neon-amber)' : 'var(--neon-red)';

  const formatarTempo = (seg) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`orbital-mission-popup status-${statusMissao}`} role="alert" aria-live="polite">
      {/* BARRA SUPERIOR DE CRONÔMETRO PROGRESSIVO */}
      {statusMissao === 'em_andamento' && (
        <div className="mission-progress-track">
          <div
            className="mission-progress-fill"
            style={{ width: `${pctTempo}%`, backgroundColor: corProgresso }}
          />
        </div>
      )}

      {/* CABEÇALHO DA MISSÃO */}
      <div className="mission-popup-header">
        <div className="mission-popup-title-group">
          {statusMissao === 'sucesso' ? (
            <CheckCircle2 size={16} className="mission-header-icon success-icon" />
          ) : statusMissao === 'falhou' ? (
            <AlertTriangle size={16} className="mission-header-icon fail-icon" />
          ) : (
            <Target size={16} className="mission-header-icon target-icon" />
          )}

          <div>
            <div className="mission-popup-tag">
              {statusMissao === 'sucesso'
                ? 'Cumprida'
                : statusMissao === 'falhou'
                ? 'Esgotado'
                : 'Missão'}
            </div>
            <h4 className="mission-popup-title">{missao.titulo}</h4>
          </div>
        </div>

        <div className="mission-popup-actions-top">
          {statusMissao === 'em_andamento' && (
            <div className={`mission-timer-badge ${pctTempo < 25 ? 'urgent' : ''}`} style={{ borderColor: corProgresso, color: corProgresso }}>
              <Clock size={11} />
              <span>{formatarTempo(tempoRestante)}</span>
            </div>
          )}
          <button
            type="button"
            className="mission-popup-close-btn"
            onClick={onFechar}
            title="Fechar"
            aria-label="Fechar"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* CORPO DA MISSÃO (DINÂMICO CONFORME STATUS) */}
      <div className="mission-popup-body">
        {statusMissao === 'em_andamento' && (
          <>
            <p className="mission-popup-desc">{missao.descricao}</p>

            {mostrarDica && (
              <div className="mission-popup-tip-box">
                <HelpCircle size={12} style={{ color: 'var(--neon-amber)', flexShrink: 0 }} />
                <span>{missao.dica}</span>
              </div>
            )}
          </>
        )}

        {statusMissao === 'sucesso' && (
          <div className="mission-result-box success">
            <div className="result-headline">
              <Sparkles size={14} style={{ color: 'var(--neon-green)' }} />
              <strong>Missão Concluída!</strong>
            </div>
            <p className="result-text">{missao.explicacaoConclusao}</p>
          </div>
        )}

        {statusMissao === 'falhou' && (
          <div className="mission-result-box fail">
            <div className="result-headline">
              <AlertTriangle size={14} style={{ color: 'var(--neon-red)' }} />
              <strong>Tempo Esgotado</strong>
            </div>
            <p className="result-text">{missao.dica}</p>
          </div>
        )}
      </div>

      {/* RODAPÉ COM DICA OU STATUS */}
      {statusMissao === 'em_andamento' && (
        <div className="mission-popup-footer">
          <button
            type="button"
            className="mission-tip-toggle-btn"
            onClick={() => setMostrarDica(!mostrarDica)}
          >
            <HelpCircle size={11} />
            <span>{mostrarDica ? 'Ocultar dica' : 'Dica'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
