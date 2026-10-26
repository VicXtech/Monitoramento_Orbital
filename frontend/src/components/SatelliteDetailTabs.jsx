import { useState, useEffect, useMemo } from 'react';
import * as satellite from 'satellite.js';
import {
  Activity,
  FileText,
  ShieldAlert,
  Crosshair,
  Cpu,
  Flame,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { formatLaunchSite, formatRcsSize } from '../utils/satcatDictionaries';
import { calculateOrbitalAudit } from '../utils/sustainabilityEngine';
import { obterSatrec } from '../utils/orbitalPhysics';

// Classifica freio atmosferico em linguagem acessivel
function formatarFreioAtmosferico(altKm) {
  const alt = Number(altKm) || 500;
  if (alt > 1000) return 'Quase Nulo';
  if (alt > 700) return 'Baixo';
  if (alt > 450) return 'Moderado';
  return 'Alto';
}

// Descreve formato da rota a partir da excentricidade
function formatarFormatoRota(excentricidade) {
  const e = Number(excentricidade) || 0;
  if (e < 0.03) return 'Quase Circular';
  if (e < 0.25) return 'Elíptica';
  return 'Altamente Elíptica';
}

// Formata tempo de volta em minutos e horas
function formatarTempoVolta(periodoMinutos) {
  const min = Number(periodoMinutos) || 90;
  const horas = (min / 60).toFixed(1).replace('.0', '');
  return `${min} min (~${horas}h)`;
}

// Formata data do satcat evitando datas genericas
function formatarDataRegistro(dataStr, cosparId, formatarDataBrasileira) {
  if (!dataStr) {
    if (cosparId) {
      const ano = cosparId.match(/^(\d{4})/);
      if (ano) return ano[1];
    }
    return 'Não informada';
  }
  if (dataStr.endsWith('-01-01') && cosparId && cosparId.startsWith(dataStr.substring(0, 4))) {
    return dataStr.substring(0, 4);
  }
  return formatarDataBrasileira ? formatarDataBrasileira(dataStr) : dataStr;
}

// Identifica agrupamento ou lote de lancamento
function obterAgrupamentoOrbital(sat) {
  const nome = (sat?.nome || '').toUpperCase();
  const cospar = sat?.cospar_id || '';
  const catId = Number(sat?.categoria_id);

  if (nome.includes('STARLINK')) return 'Constelação Starlink (SpaceX)';
  if (nome.includes('ONEWEB')) return 'Constelação OneWeb (Eutelsat)';
  if (nome.includes('IRIDIUM')) return 'Constelação Iridium NEXT';
  if (nome.includes('GLOBALSTAR')) return 'Constelação Globalstar';
  if (nome.includes('GPS') || nome.includes('NAVSTAR')) return 'Constelação GPS / Navstar';
  if (nome.includes('GLONASS')) return 'Constelação GLONASS';
  if (nome.includes('GALILEO')) return 'Constelação Galileo (União Europeia)';
  if (nome.includes('BEIDOU')) return 'Constelação BeiDou (China)';
  if (catId === 3 || nome.includes('DEB')) {
    return `Detrito orbital do evento ${cospar ? cospar.slice(0, 8) : 'catalogado'}`;
  }
  if (catId === 5 || nome.includes('R/B')) {
    return `Estágio de foguete do lançamento ${cospar ? cospar.slice(0, 8) : 'catalogado'}`;
  }
  if (cospar) {
    return `Lançamento orbital ${cospar.slice(0, 8)}`;
  }
  return 'Lançamento orbital independente';
}

// Painel de diagnostico orbital em 3 abas
export default function SatelliteDetailTabs({
  satSelecionado,
  parametrosOrbitaisSat,
  fichaFactual,
  formatarDataBrasileira,
  CORES_CATEGORIAS = {},
  modulosEstacao = [],
  carregandoModulos = false,
  handleSelecionarSat,
  onFocarObjeto
}) {
  const [abaAtiva, setAbaAtiva] = useState('telemetria');
  const [telemetriaAoVivo, setTelemetriaAoVivo] = useState(null);

  // Propagacao instantanea da posicao a cada 1 segundo
  useEffect(() => {
    if (!satSelecionado) return;
    const satrec = obterSatrec(satSelecionado);
    if (!satrec) return;

    const atualizar = () => {
      try {
        const agora = new Date();
        const gmst = satellite.gstime(agora);
        const posAndVel = satellite.propagate(satrec, agora);
        if (posAndVel && posAndVel.position && posAndVel.velocity) {
          const posGd = satellite.eciToGeodetic(posAndVel.position, gmst);
          const lat = satellite.degreesLat(posGd.latitude);
          const lon = satellite.degreesLong(posGd.longitude);
          const altKm = Math.round(posGd.height);
          const vx = posAndVel.velocity.x;
          const vy = posAndVel.velocity.y;
          const vz = posAndVel.velocity.z;
          const velKmS = Math.sqrt(vx * vx + vy * vy + vz * vz);
          const velKmH = Math.round(velKmS * 3600);

          setTelemetriaAoVivo({
            lat: lat.toFixed(2),
            lon: lon.toFixed(2),
            altKm,
            velKmS: velKmS.toFixed(2),
            velKmH
          });
        }
      } catch {
        // Falha silenciosa de propagacao
      }
    };

    atualizar();
    const timer = setInterval(atualizar, 1000);
    return () => clearInterval(timer);
  }, [satSelecionado]);

  // Auditoria normativa SIO calculada
  const auditoriaSio = useMemo(
    () => (satSelecionado ? calculateOrbitalAudit(satSelecionado, parametrosOrbitaisSat) : null),
    [satSelecionado, parametrosOrbitaisSat]
  );

  if (!satSelecionado) return null;

  const categoriaId = Number(satSelecionado.categoria_id) || 1;
  const corCategoria = CORES_CATEGORIAS[categoriaId] || 'var(--neon-green)';
  const rcsInfo = formatRcsSize(satSelecionado.rcs_size || satSelecionado.dados_omm?.RCS_SIZE, satSelecionado);
  const baseLancamento = formatLaunchSite(satSelecionado.local_lancamento || satSelecionado.site);
  const dataLancamentoFormatada = formatarDataRegistro(satSelecionado.data_lancamento, satSelecionado.cospar_id, formatarDataBrasileira);
  const agrupamentoTexto = obterAgrupamentoOrbital(satSelecionado);
  const temDossieOficial = Boolean(fichaFactual?.contextoMissao || satSelecionado.missao?.descricao);

  const altitudeExibida = telemetriaAoVivo?.altKm ?? parametrosOrbitaisSat?.altitudeInstantaneaKm ?? 500;
  const freioAtmosferico = formatarFreioAtmosferico(altitudeExibida);
  const formatoRota = formatarFormatoRota(parametrosOrbitaisSat?.excentricidade);

  return (
    <div className="satellite-fiche-modular">

      {/* CABECALHO FIXO DESAFOGADO */}
      <div className="telemetry-header-bar">
        {/* Linha 1: Nome a esquerda e NORAD a direita */}
        <div className="telemetry-id-row">
          <span className="telemetry-sat-name" title={satSelecionado.nome || 'OBJETO ORBITAL'}>
            {satSelecionado.nome || 'OBJETO ORBITAL'}
          </span>
          <span className="telemetry-sat-norad">#{satSelecionado.norad_id}</span>
        </div>

        {/* Linha 2: Tipo de objeto em largura total */}
        <div
          className="mission-badge"
          style={{
            borderColor: corCategoria,
            color: corCategoria,
            backgroundColor: `${corCategoria}15`,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxSizing: 'border-box'
          }}
        >
          ● {satSelecionado.categoria?.nome || 'Objeto Orbital'}
        </div>

        {/* Linha 3: Botao de acao rapida de focar camera */}
        <div className="telemetry-actions-row">
          <button
            type="button"
            className="resample-btn"
            onClick={onFocarObjeto}
            title="Centralizar e redirecionar câmera no objeto 3D"
          >
            <Crosshair size={13} className="resample-icon" />
            <span>FOCAR CÂMERA</span>
          </button>
        </div>
      </div>

      {/* NAVEGACAO EM 3 ABAS ENXUTAS */}
      <div className="fiche-tabs-nav" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'telemetria'}
          className={`fiche-tab-btn ${abaAtiva === 'telemetria' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('telemetria')}
        >
          <Activity size={13} className="tab-icon" />
          <span>TELEMETRIA</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'registro'}
          className={`fiche-tab-btn ${abaAtiva === 'registro' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('registro')}
        >
          <FileText size={13} className="tab-icon" />
          <span>REGISTRO</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'auditoria'}
          className={`fiche-tab-btn ${abaAtiva === 'auditoria' ? 'active tab-auditoria' : ''}`}
          onClick={() => setAbaAtiva('auditoria')}
        >
          <ShieldAlert size={13} className="tab-icon" />
          <span>AUDITORIA</span>
        </button>
      </div>

      {/* CONTEUDO DAS ABAS */}
      <div className="fiche-tab-content">

        {/* ABA 1: TELEMETRIA */}
        {abaAtiva === 'telemetria' && (
          <div className="tab-pane tab-pane-telemetria">
            {parametrosOrbitaisSat ? (
              <>
                {/* BLOCO 1: POSICAO E VELOCIDADE AGORA */}
                <div className="telemetry-section-title">Posição e Velocidade Agora</div>
                <div className="telemetry-metrics-grid">
                  <div className="telemetry-metric-box highlight-box">
                    <span className="metric-box-label">ALTITUDE</span>
                    <span className="metric-box-val val-cyan">
                      {(telemetriaAoVivo?.altKm ?? parametrosOrbitaisSat.altitudeInstantaneaKm).toLocaleString('pt-BR')} km
                    </span>
                    <span className="metric-box-sub">
                      {parametrosOrbitaisSat.regimeCodigo}
                    </span>
                  </div>

                  <div className="telemetry-metric-box highlight-box">
                    <span className="metric-box-label">VELOCIDADE</span>
                    <span className="metric-box-val val-cyan">
                      {telemetriaAoVivo?.velKmS ?? parametrosOrbitaisSat.velocidadeKmS} km/s
                    </span>
                    <span className="metric-box-sub">
                      {(telemetriaAoVivo?.velKmH ?? parametrosOrbitaisSat.velocidadeKmH).toLocaleString('pt-BR')} km/h
                    </span>
                  </div>

                  {/* Card em 100% da largura logo abaixo de Altitude e Velocidade */}
                  <div className="telemetry-metric-box full-width">
                    <span className="metric-box-label">SOBREVOANDO AGORA (LAT / LON)</span>
                    <span className="metric-box-val val-coordinates">
                      Lat: {telemetriaAoVivo?.lat ?? '---'}° | Lon: {telemetriaAoVivo?.lon ?? '---'}°
                    </span>
                    <span className="metric-box-sub">Ponto da Terra diretamente abaixo do objeto</span>
                  </div>
                </div>

                {/* BLOCO 2: FORMATO E ROTA DA ORBITA */}
                <div className="telemetry-section-title">Formato e Rota da Órbita</div>
                <div className="telemetry-metrics-grid">
                  <div className="telemetry-metric-box">
                    <span className="metric-box-label">ALTITUDE MÁX. / MÍN.</span>
                    <span className="metric-box-val compact-val">
                      {parametrosOrbitaisSat.apogeuKm.toLocaleString('pt-BR')} / {parametrosOrbitaisSat.perigeuKm.toLocaleString('pt-BR')} km
                    </span>
                    <span className="metric-box-sub">Apogeu (máx) e Perigeu (mín)</span>
                  </div>

                  <div className="telemetry-metric-box">
                    <span className="metric-box-label">INCLINAÇÃO</span>
                    <span className="metric-box-val compact-val">
                      {parametrosOrbitaisSat.inclinacaoGraus.toFixed(1)}°
                    </span>
                    <span className="metric-box-sub">{parametrosOrbitaisSat.classeRotaCurta}</span>
                  </div>

                  <div className="telemetry-metric-box">
                    <span className="metric-box-label">FORMATO DA ROTA</span>
                    <span className="metric-box-val compact-val val-cyan">
                      {formatoRota}
                    </span>
                    <span className="metric-box-sub">
                      (Excentricidade: {parametrosOrbitaisSat.excentricidade.toFixed(4)})
                    </span>
                  </div>

                  <div className="telemetry-metric-box">
                    <span className="metric-box-label">TEMPO DE 1 VOLTA</span>
                    <span className="metric-box-val compact-val">
                      {formatarTempoVolta(parametrosOrbitaisSat.periodoMinutos)}
                    </span>
                    <span className="metric-box-sub">
                      Completa {parametrosOrbitaisSat.voltasPorDia} voltas/dia
                    </span>
                  </div>
                </div>

                {/* BLOCO 3: FREIO ATMOSFERICO E ULTIMA ATUALIZACAO */}
                <div className="telemetry-footer-card">
                  <div className="telemetry-footer-row">
                    <span className="footer-label">Freio Atmosférico (Atrito):</span>
                    <span className="footer-value val-accent">{freioAtmosferico}</span>
                  </div>
                  <div className="telemetry-footer-row">
                    <span className="footer-label">Última atualização do radar:</span>
                    <span className="footer-value">
                      {satSelecionado.ultimo_tle?.epoch
                        ? new Date(satSelecionado.ultimo_tle.epoch).toLocaleDateString('pt-BR')
                        : 'Atualizada no catálogo'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="telemetry-waiting">
                <span>Calculando propagação física SGP4...</span>
              </div>
            )}
          </div>
        )}

        {/* ABA 2: REGISTRO */}
        {abaAtiva === 'registro' && (
          <div className="tab-pane tab-pane-registro">
            <div className="fiche-grid">
              <div className="grid-cell">
                <span className="cell-label">Operador / País</span>
                <span className="cell-value" title={satSelecionado.pais || 'Internacional'}>
                  {satSelecionado.pais || 'Internacional'}
                </span>
              </div>

              <div className="grid-cell">
                <span className="cell-label">CÓDIGO DA MISSÃO (COSPAR)</span>
                <span className="cell-value" title={satSelecionado.cospar_id || 'Não catalogado'}>
                  {satSelecionado.cospar_id || 'Não catalogado'}
                </span>
              </div>

              <div className="grid-cell">
                <span className="cell-label">Lançamento</span>
                <span className="cell-value">{dataLancamentoFormatada}</span>
              </div>

              <div className="grid-cell">
                <span className="cell-label">PORTE DO OBJETO (RADAR)</span>
                <span className="cell-value" title={rcsInfo.desc}>
                  {rcsInfo.label}
                </span>
              </div>

              <div className="grid-cell full-width">
                <span className="cell-label">Base de Lançamento</span>
                <span className="cell-value" title={baseLancamento}>
                  {baseLancamento}
                </span>
              </div>
            </div>

            {/* DOSSIE OFICIAL OU AGRUPAMENTO ORBITAL */}
            {temDossieOficial ? (
              <div className="mission-context-card">
                <div className="mission-context-header">
                  <span className="mission-context-title">Dossiê Oficial</span>
                </div>
                <blockquote className="mission-context-quote">
                  "{fichaFactual?.contextoMissao || satSelecionado.missao?.descricao}"
                </blockquote>
              </div>
            ) : (
              <div className="orbital-batch-card">
                <div className="orbital-batch-header">
                  <span className="orbital-batch-title">Agrupamento Orbital</span>
                </div>
                <p className="orbital-batch-desc">{agrupamentoTexto}</p>
              </div>
            )}

            {/* MODULOS ACOPLADOS (SE ESTACAO ESPACIAL) */}
            {(satSelecionado.norad_id === '25544' || satSelecionado.norad_id === '48274') && (
              <div className="station-ecosystem-card">
                <div className="station-ecosystem-header">
                  <div className="station-ecosystem-title">
                    <Cpu size={13} style={{ color: 'var(--neon-cyan)' }} />
                    <span>Módulos Acoplados</span>
                  </div>
                  <span className="station-ecosystem-count">
                    {carregandoModulos ? '...' : `${modulosEstacao.length} conectados`}
                  </span>
                </div>

                {carregandoModulos ? (
                  <div className="modules-loading">Carregando telemetria dos módulos...</div>
                ) : modulosEstacao.length > 0 ? (
                  <div className="modules-list">
                    {modulosEstacao.map(mod => (
                      <div
                        key={mod.norad_id}
                        className="module-item"
                        onClick={() => handleSelecionarSat(mod, false)}
                        title={`Clique para inspecionar ${mod.nome}`}
                      >
                        <div className="module-item-top">
                          <span className="module-name">{mod.nome}</span>
                          <span className="module-flag">{mod.pais}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="modules-empty">Nenhum módulo auxiliar conectado no momento.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ABA 3: AUDITORIA */}
        {abaAtiva === 'auditoria' && auditoriaSio && (
          <div className="tab-pane tab-pane-auditoria">

            {/* SCORE SIO */}
            <div className="impact-meter-card">
              <div className="impact-meter-top">
                <div className="impact-meter-label">SCORE DE IMPACTO ORBITAL (SIO)</div>
                <div className="impact-meter-score">
                  <span className="score-val" style={{ color: auditoriaSio.overallRating.cor }}>
                    {auditoriaSio.score}
                  </span>
                  <span className="score-max">/100</span>
                </div>
              </div>

              <div className="impact-meter-bar-track">
                <div
                  className="impact-meter-bar-fill"
                  style={{
                    width: `${Math.min(100, Math.max(5, auditoriaSio.score))}%`,
                    backgroundColor: auditoriaSio.overallRating.cor
                  }}
                />
              </div>

              <div className="impact-status-sub">
                AVALIAÇÃO GERAL: <strong style={{ color: auditoriaSio.overallRating.cor }}>
                  {auditoriaSio.overallRating.label}
                </strong>
              </div>
            </div>

            {/* CRITERIOS DE AVALIACAO COM RESPIRO E EXPLICACAO CURTA */}
            <div className="audit-factors-list">
              <div className="factors-header">
                <span>CRITÉRIOS DE AVALIAÇÃO</span>
              </div>

              {auditoriaSio.breakdown.map((fator) => (
                <div key={fator.id} className="audit-factor-item">
                  <div className="audit-factor-top">
                    <span className="audit-factor-label">{fator.label}</span>
                    <span className={`factor-badge ${fator.classe}`}>{fator.level}</span>
                  </div>
                  <div className="audit-factor-bar-track">
                    <div
                      className="audit-factor-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.round((fator.points / fator.maxPoints) * 100))}%`,
                        backgroundColor: fator.cor
                      }}
                    />
                  </div>
                  <div className="audit-factor-explanation">
                    {fator.explicacao}
                  </div>
                </div>
              ))}
            </div>

            {/* ENQUADRAMENTO NORMATIVO */}
            <div className="normative-framework-card">
              <div className="normative-card-title">Enquadramento Normativo</div>

              <div className="normative-row">
                <span className="normative-label">Tempo de queda natural:</span>
                <span className="normative-badge-value">{auditoriaSio.decayEstimate}</span>
              </div>

              <div className="normative-destinations-title">Destino de Fim de Vida</div>
              <div className="normative-destinations-grid">
                <div className={`destination-box ${auditoriaSio.endOfLifeTarget === 'REENTRY' ? 'active-reentry' : ''}`}>
                  <Flame size={16} className="dest-icon" />
                  <span className="dest-name">Reentrada Atmosférica</span>
                </div>

                <div className={`destination-box ${auditoriaSio.endOfLifeTarget === 'GRAVEYARD' ? 'active-graveyard' : ''}`}>
                  <Shield size={16} className="dest-icon" />
                  <span className="dest-name">Órbita Cemitério</span>
                </div>

                <div className={`destination-box ${auditoriaSio.endOfLifeTarget === 'PERMANENT_DEBRIS' ? 'active-debris' : ''}`}>
                  <AlertTriangle size={16} className="dest-icon" />
                  <span className="dest-name">Detrito Permanente</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
