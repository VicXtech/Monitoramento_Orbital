import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Target,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Shuffle,
  ExternalLink
} from 'lucide-react';
import { MISSOES_ORBITAIS } from '../utils/orbitalMissions';
import { GATILHOS_DESCOBERTA } from '../utils/orbitalDiscovery';

export default function OrbitalMissionHub({
  visivel,
  onRemover,
  satSelecionado,
  parametrosOrbitaisSat,
  onInvestigarObjeto,
  onAplicarFiltroCategorias,
  onLocalizarGeo,
  onTocarSom
}) {
  // Lista unificada com missões e descobertas
  const poolItens = useMemo(() => {
    const missoes = MISSOES_ORBITAIS.map((m) => ({ ...m, categoriaTipo: 'missao' }));
    const descobertas = GATILHOS_DESCOBERTA.map((d) => ({ ...d, categoriaTipo: 'descubra' }));
    return [...missoes, ...descobertas];
  }, []);

  const [indiceAtual, setIndiceAtual] = useState(0);
  const itemAtual = poolItens[indiceAtual] || poolItens[0];

  // Estados de missão
  const [tempoRestante, setTempoRestante] = useState(itemAtual.tempoSegundos || 45);
  const [statusMissao, setStatusMissao] = useState('em_andamento'); // 'em_andamento' | 'sucesso' | 'falhou'
  const timerRef = useRef(null);
  const [statusAcaoDescubra, setStatusAcaoDescubra] = useState(null);

  // Sorteia novo item diferente do atual
  const handleTrocar = () => {
    if (onTocarSom) onTocarSom('slide');
    setStatusAcaoDescubra(null);
    let novo = Math.floor(Math.random() * poolItens.length);
    if (novo === indiceAtual) {
      novo = (novo + 1) % poolItens.length;
    }
    setIndiceAtual(novo);
    const itemNovo = poolItens[novo];
    if (itemNovo.categoriaTipo === 'missao') {
      setTempoRestante(itemNovo.tempoSegundos || 45);
      setStatusMissao('em_andamento');
    }
  };

  // Cronômetro decrescente para missões
  useEffect(() => {
    if (itemAtual.categoriaTipo !== 'missao' || statusMissao !== 'em_andamento') return;

    timerRef.current = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setStatusMissao('falhou');
          if (onTocarSom) onTocarSom('falha');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [itemAtual, statusMissao, onTocarSom]);

  // Validação contínua da missão
  useEffect(() => {
    if (itemAtual.categoriaTipo !== 'missao' || statusMissao !== 'em_andamento') return;

    const completou = itemAtual.verificar({
      satSelecionado,
      parametrosOrbitaisSat
    });

    if (completou) {
      if (timerRef.current) clearInterval(timerRef.current);
      const timerSucesso = setTimeout(() => {
        setStatusMissao('sucesso');
        if (onTocarSom) onTocarSom('sucesso');
      }, 0);
      return () => clearTimeout(timerSucesso);
    }
  }, [itemAtual, statusMissao, satSelecionado, parametrosOrbitaisSat, onTocarSom]);

  // Executa ação para itens de Descubra
  const handleExecutarAcaoDescubra = async () => {
    setStatusAcaoDescubra('executando');
    if (itemAtual.alvoNorad && onInvestigarObjeto) {
      await onInvestigarObjeto(itemAtual.alvoNorad);
      setStatusAcaoDescubra('sucesso');
    } else if (itemAtual.filtroCategorias && onAplicarFiltroCategorias) {
      onAplicarFiltroCategorias(itemAtual.filtroCategorias);
      setStatusAcaoDescubra('sucesso');
    } else if (itemAtual.acaoTipo === 'filtrar_geo' && onLocalizarGeo) {
      await onLocalizarGeo();
      setStatusAcaoDescubra('sucesso');
    }
    setTimeout(() => {
      setStatusAcaoDescubra(null);
    }, 2500);
  };

  if (!visivel) return null;

  const ehMissao = itemAtual.categoriaTipo === 'missao';

  return (
    <div className={`orbital-mission-hub-panel ${ehMissao ? `status-${statusMissao}` : 'tipo-descubra'}`}>
      <div className="hub-top-bar">
        <div className="hub-tag-group">
          {ehMissao ? (
            <>
              <Target size={13} className="hub-type-icon mission" />
              <span className="hub-type-label">Missão</span>
            </>
          ) : (
            <>
              <Sparkles size={13} className="hub-type-icon discovery" />
              <span className="hub-type-label">Descubra</span>
            </>
          )}
          <span className="hub-item-tag">
            {ehMissao ? (statusMissao === 'sucesso' ? 'Concluída' : 'Ativa') : (itemAtual.tagTipo || 'Fato')}
          </span>
        </div>

        <div className="hub-actions-group">
          {ehMissao && statusMissao === 'em_andamento' && (
            <div className="hub-timer-badge">
              <Clock size={11} />
              <span>{tempoRestante}s</span>
            </div>
          )}

          <button
            type="button"
            className="hub-btn-action swap"
            onClick={handleTrocar}
            title="Trocar"
          >
            <Shuffle size={12} />
            <span>Trocar</span>
          </button>

          <button
            type="button"
            className="hub-btn-action remove"
            onClick={onRemover}
            title="Remover"
          >
            <X size={13} />
            <span>Remover</span>
          </button>
        </div>
      </div>

      <div className="hub-main-body">
        <h4 className="hub-item-title">{itemAtual.titulo}</h4>
        <p className="hub-item-desc">
          {ehMissao ? itemAtual.descricao : itemAtual.texto}
        </p>

        {ehMissao && statusMissao === 'sucesso' && (
          <div className="hub-feedback-success">
            <CheckCircle2 size={13} />
            <span>Missão cumprida! {itemAtual.explicacaoConclusao}</span>
          </div>
        )}

        {ehMissao && statusMissao === 'falhou' && (
          <div className="hub-feedback-fail">
            <AlertTriangle size={13} />
            <span>Tempo esgotado. Dica: {itemAtual.dica}</span>
          </div>
        )}

        {!ehMissao && itemAtual.acaoLabel && (
          <button
            type="button"
            className={`hub-discover-action-btn ${statusAcaoDescubra === 'sucesso' ? 'success' : ''}`}
            onClick={handleExecutarAcaoDescubra}
          >
            <ExternalLink size={12} />
            <span>{statusAcaoDescubra === 'sucesso' ? 'Localizado' : itemAtual.acaoLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}
