import { useState, useEffect, useRef, useMemo, useLayoutEffect, Fragment } from 'react';
import {
  Globe,
  Search,
  Database,
  Info,
  X,
  Cpu,
  Zap,
  ChevronRight,
  ChevronLeft,
  Compass,
  Atom,
  ShieldAlert,
  AlertTriangle,
  Flame,
  BookOpen,
  Activity,
  RotateCw,
  Wind,
  Crosshair,
  Target,
  Orbit,
  Clock,
  Volume2,
  VolumeOff,
  Home,
  Radar
} from 'lucide-react';
import * as satellite from 'satellite.js';
import './App.css';
import { calcularParametrosOrbitais, gerarPontosOrbita, classificarRegimeOrbital, obterSatrec } from './utils/orbitalPhysics';
import { obterFichaFactual, GLOSSARIO_ORBITAL } from './data/orbitalEncyclopedia';
import SatelliteDetailTabs from './components/SatelliteDetailTabs';
import ScenarioSimulatorModal from './components/ScenarioSimulatorModal';
import ErrorBoundary from './components/ErrorBoundary';
import OrbitalMissionHub from './components/OrbitalMissionHub';
import OrbitalModePanel from './components/OrbitalModePanel';
import {
  criarGeometriasAreas3D,
  removerGeometriasAreas3D,
  criarMarcadoresEventos3D,
  removerMarcadoresEventos3D,
  posicionarCameraModoOrbital,
  destacarCamadaOrbital,
  destacarPinoHistorico
} from './utils/cesiumOrbitalAreas';
import { obterPinoHistorico, CAMADAS_ORBITAIS } from './data/orbitalModeData';

// Efeitos sonoros oficiais do sistema
import somAbreSlide from './assets/sons/abre-slide.mp3';
import somTrocaSlide from './assets/sons/troca-slide.mp3';
import somIniciar from './assets/sons/Iniciar.mp3';
import somFadeOut from './assets/sons/fade-out.MP3';
import somFadeIn from './assets/sons/fade-in.mp3';
import somConsoleButtons from './assets/sons/console-buttons.mp3';
import somVoltar from './assets/sons/voltar.mp3';
import somTemaPrincipal from './assets/sons/main-theme.mp3';
import somPainelLateral from './assets/sons/painel-lateral.mp3';
import somTopPainel from './assets/sons/top-painel.mp3';
import somRecarregarAmostragem from './assets/sons/recarregar-amostragem.mp3';

// Utilitário de reprodução ágil de áudio com clone e tratamento de permissão do navegador
function tocarEfeitoSonoro(audioSrc, volume = 0.5) {
  try {
    const audio = new Audio(audioSrc);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Ignora restrições silenciosamente caso o navegador exija interação prévia
      });
    }
  } catch {
    // Ambiente sem suporte a Audio
  }
}

// Formatação de data padrão brasileiro (DD/MM/AAAA) sem desvio de fuso horário UTC
function formatarDataBrasileira(dataStr) {
  if (!dataStr) return "Histórico";
  try {
    const limpa = String(dataStr).split('T')[0].trim();
    const partes = limpa.split('-');
    if (partes.length === 3) {
      const [ano, mes, dia] = partes;
      return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
    }
    return limpa;
  } catch {
    return String(dataStr);
  }
}

// Pré-carregamento dos áudios para resposta tátil instantânea
if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
  try {
    new Audio(somAbreSlide).load();
    new Audio(somTrocaSlide).load();
    new Audio(somIniciar).load();
    new Audio(somFadeOut).load();
    new Audio(somFadeIn).load();
    new Audio(somConsoleButtons).load();
    new Audio(somVoltar).load();
    new Audio(somPainelLateral).load();
    new Audio(somTopPainel).load();
    new Audio(somRecarregarAmostragem).load();
  } catch {}
}

// Configuração do host da API (aponta para o backend local ou de produção)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Cores neon oficiais para as categorias do sistema (conforme hierarquia oficial)
const CORES_CATEGORIAS = {
  1: '#00ff66', // Satélite Ativo (Verde Neon)
  2: '#FFAA00', // Satélite Inativo (Laranja Neon)
  3: '#ff0055', // Detrito Espacial (Vermelho Neon)
  4: '#00f0ff', // Estação Espacial (Ciano Neon)
  5: '#b026ff'  // Corpo de Foguete (Roxo Neon)
};

/**
 * Retorna os parâmetros de estilização de ponto no Cesium com suporte
 * à alternância dinâmica entre Modo Orbital e Modo Sustentabilidade ("A Terra em Risco").
 */
function obterEstiloPontoCesium(catId, modo = 'padrao', noradId = null) {
  if (typeof window === 'undefined' || !window.Cesium) {
    return {
      pixelSize: 6,
      outlineWidth: 1
    };
  }

  const isEstacaoPrincipal = String(noradId) === '25544' || String(noradId) === '48274';
  if (isEstacaoPrincipal) {
    return {
      pixelSize: 10,
      color: window.Cesium.Color.fromCssColorString('#00f0ff'),
      outlineColor: window.Cesium.Color.WHITE,
      outlineWidth: 1.5
    };
  }

  if (modo === 'sustentabilidade') {
    if (catId === 3) {
      // Detrito Espacial: Alerta Máximo hipervisível
      return {
        pixelSize: 9,
        color: window.Cesium.Color.fromCssColorString('#ff0055'),
        outlineColor: window.Cesium.Color.WHITE,
        outlineWidth: 1.5
      };
    }
    if (catId === 5) {
      // Corpo de Foguete Abandonado: Grande Massa Inerte
      return {
        pixelSize: 8,
        color: window.Cesium.Color.fromCssColorString('#ff2a85'),
        outlineColor: window.Cesium.Color.fromCssColorString('#ffaa00'),
        outlineWidth: 1.5
      };
    }
    if (catId === 2) {
      // Satélite Inativo Desativado
      return {
        pixelSize: 7,
        color: window.Cesium.Color.fromCssColorString('#ffaa00'),
        outlineColor: window.Cesium.Color.BLACK,
        outlineWidth: 1
      };
    }
    if (catId === 4) {
      // Estação Espacial Tripulada
      return {
        pixelSize: 14,
        color: window.Cesium.Color.fromCssColorString('#00f0ff'),
        outlineColor: window.Cesium.Color.WHITE,
        outlineWidth: 2
      };
    }
    // Satélite Ativo Operacional: Atenuado suavemente para evidenciar a poluição e os detritos
    return {
      pixelSize: 4,
      color: window.Cesium.Color.fromCssColorString('rgba(0, 255, 102, 0.22)'),
      outlineColor: window.Cesium.Color.TRANSPARENT,
      outlineWidth: 0
    };
  }

  // Modo Orbital Padrão: Cores sólidas por categoria
  const corHex = CORES_CATEGORIAS[catId] || '#00ff66';
  return {
    pixelSize: catId === 4 ? 14 : catId === 5 ? 7 : catId === 2 ? 6 : catId === 3 ? 5 : 7,
    color: window.Cesium.Color.fromCssColorString(corHex),
    outlineColor: window.Cesium.Color.BLACK,
    outlineWidth: catId === 4 ? 2 : 1.5
  };
}

// Ponto fixo oficial de visão inicial e retorno da câmera (América do Sul / Brasil)
const POSICAO_ORBITAL_PADRAO = {
  longitude: -49.0,
  latitude: -12.0,
  altitude: 24500000.0,
  heading: 0.0,
  pitch: -90.0,
  roll: 0.0
};

// Componente de efeito cibernético de digitação tática com cursor terminal (para títulos)
function CyberTypewriter({ text, active, delay = 0, speed = 42, cursorColor = 'cyan' }) {
  const [displayed, setDisplayed] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!active) {
      setDisplayed('');
      setIsDone(false);
      return;
    }

    let timer = null;
    let index = 0;
    setDisplayed('');
    setIsDone(false);

    const startTimeout = setTimeout(() => {
      timer = setInterval(() => {
        index += 1;
        if (index >= text.length) {
          setDisplayed(text);
          setIsDone(true);
          clearInterval(timer);
        } else {
          setDisplayed(text.slice(0, index));
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (timer) clearInterval(timer);
    };
  }, [text, active, delay, speed]);

  return (
    <span className="cyber-typewriter-text">
      {displayed}
      {!isDone && active && (
        <span className={`cyber-cursor ${cursorColor === 'green' ? 'cursor-green' : ''}`}>▌</span>
      )}
    </span>
  );
}

// Componente resiliente para fotografia de missão orbital:
// Garante que containers vazios ou com falha de carregamento nunca deixem bordas ou linhas fantasmas no HUD
function FicheImage({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setHasError(false);
  }, [src]);

  if (hasError || !src) return null;

  return (
    <div
      className="fiche-image-container"
      style={{ display: loaded ? 'block' : 'none' }}
    >
      <img
        src={src}
        alt={alt}
        className="fiche-image"
        onLoad={() => setLoaded(true)}
        onError={() => setHasError(true)}
        referrerPolicy="no-referrer"
      />
      {loaded && (
        <div className="fiche-image-badge">Fotografia Oficial da Missão</div>
      )}
    </div>
  );
}

// Dados e textos oficiais da seção SOBRE A PLATAFORMA
const SOBRE_PLATAFORMA_SECOES = [
  {
    id: 'missao',
    title: 'MISSÃO',
    text: (
      <>
        A <span className="brand-logo-text"><span className="brand-logo-white">Orbital</span><span className="brand-logo-cyan">ED</span></span> foi criada para desmistificar a mecânica celeste para estudantes, professores e entusiastas. A plataforma substitui coordenadas numéricas abstratas por representações espaciais em 3D intuitivas, tornando o aprendizado visual e conscientizando sobre o tráfego de satélites e a sustentabilidade orbital.
      </>
    )
  },
  {
    id: 'engenharia',
    title: 'ENGENHARIA',
    text: 'Ele opera de forma instantânea via web, sem necessidade de plugins ou cadastros, combinando renderização 3D em WebGL com alta precisão geográfica. Toda a física orbital é processada diretamente no dispositivo do usuário, garantindo cálculo de posições em tempo real com máxima fluidez e sem gargalos de servidor.'
  },
  {
    id: 'fontes',
    title: 'FONTES',
    text: 'Os dados são extraídos diretamente dos maiores catálogos astronômicos e redes de monitoramento global, como o CelesTrak (parâmetros orbitais diários) e o Space-Track (rastreamento contínuo por sensores e radares internacionais), garantindo transparência científica com informações públicas.'
  }
];

// Bloco Sobre a Plataforma: Títulos com digitação tática e textos 100% estáticos (sem fade-in)
function AboutSectionCard({ active }) {
  return (
    <div className="tactical-about-single-card">
      {SOBRE_PLATAFORMA_SECOES.map((sec, idx) => (
        <Fragment key={sec.id}>
          {idx > 0 && <div className="about-single-divider" />}
          <div className="about-single-section">
            <h3 className="about-single-title">
              <CyberTypewriter
                text={sec.title}
                active={active}
                delay={idx * 110}
                speed={45}
              />
            </h3>
            <p className="about-single-text">
              {sec.text}
            </p>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

function App() {
  const [viewer, setViewer] = useState(null);
  const viewerRef = useRef(null);
  const containerRef = useRef(null);
  const pointCollectionRef = useRef(null);
  const pointsRef = useRef(new Map());
  const objetoFocadoRef = useRef(null);
  const workerRef = useRef(null);
  const satelitesIndicesRef = useRef([]);
  const entitiesRef = useRef(new Map());
  const entidadeFocadaRef = useRef(null);
  const orbitaEntidadeRef = useRef(null);
  const satHoverIdRef = useRef(null);
  const satSelecionadoRef = useRef(null);
  const cameraInicialRef = useRef(null);
  const cameraSeguindoObjetoRef = useRef(null);
  const posicaoAnteriorSatRef = useRef(null);
  const scratchCartesianRef = useRef(null);
  const scratchSelectedPosRef = useRef(null);
  const scratchAxisRef = useRef(null);
  const scratchQuatRef = useRef(null);
  const scratchRotMatRef = useRef(null);

  // Estados de Navegação e Seções
  const [telaAtiva, setTelaAtiva] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tela') || 'inicio';
  });
  const telaAtivaRef = useRef(telaAtiva);
  useEffect(() => {
    telaAtivaRef.current = telaAtiva;
  }, [telaAtiva]);
  const [transicaoCyber, setTransicaoCyber] = useState(null); // 'para-simulador' | 'para-inicio' | null

  // Inicialização e gerenciamento do Web Worker SGP4
  useEffect(() => {
    try {
      const worker = new Worker(new URL('./workers/sgp4Worker.js', import.meta.url), { type: 'module' });
      workerRef.current = worker;

      worker.onmessage = (e) => {
        const { tipo, posicoes } = e.data;
        if (tipo === 'POSICOES' && posicoes && window.Cesium) {
          const indices = satelitesIndicesRef.current;
          const total = indices.length;
          if (!scratchCartesianRef.current) {
            scratchCartesianRef.current = new window.Cesium.Cartesian3();
          }
          const scratch = scratchCartesianRef.current;
          const satSelecionadoId = satSelecionadoRef.current ? String(satSelecionadoRef.current.norad_id) : null;

          for (let i = 0; i < total; i++) {
            const offset = i * 3;
            const lon = posicoes[offset];
            if (isNaN(lon)) continue;

            const noradId = indices[i];
            if (noradId === satSelecionadoId) continue;

            const entry = pointsRef.current.get(noradId);
            if (entry && entry.point && entry.point.show) {
              const lat = posicoes[offset + 1];
              const alt = posicoes[offset + 2];
              const novoPos = window.Cesium.Cartesian3.fromDegrees(lon, lat, alt, undefined, scratch);
              entry.point.position = novoPos;
            }
          }

          // Atualiza a trilha orbital do satélite selecionado a cada segundo
          const satAtivo = satSelecionadoRef.current;
          const v = viewerRef.current;
          if (satAtivo && satAtivo.ultimo_tle && v && !v.isDestroyed() && !satHoverIdRef.current) {
            desenharTrilhaOrbital(v, satAtivo.ultimo_tle);
          }
        }
      };

      return () => {
        worker.terminate();
        workerRef.current = null;
      };
    } catch (err) {
      console.warn("Falha ao inicializar Web Worker SGP4:", err);
    }
  }, []);
  const [secaoAtiva, setSecaoAtiva] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('secao');
    return s !== null ? parseInt(s, 10) : 0;
  }); // 0: Visão Geral, 1: Diferenciais, 2: Sustentabilidade, 3: Glossário

  // Trilha sonora principal (main-theme.mp3) em loop e volume 0.5
  const [musicaMutada, setMusicaMutada] = useState(false);
  const musicaRef = useRef(null);
  const musicaMutadaRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(somTemaPrincipal);
    audio.loop = true;
    audio.volume = 0.5;
    musicaRef.current = audio;

    const eventosAtivacao = ['click', 'pointerdown', 'mousedown', 'touchstart', 'keydown'];

    const removerListeners = () => {
      eventosAtivacao.forEach(evento => {
        window.removeEventListener(evento, desbloquearAutoplay, true);
        document.removeEventListener(evento, desbloquearAutoplay, true);
      });
    };

    // Inicia a reprodução na primeira interação física em fase de captura (evita consumo por Cesium)
    function desbloquearAutoplay() {
      if (musicaMutadaRef.current) return;
      const a = musicaRef.current;
      if (a && a.paused) {
        a.muted = false;
        a.play().then(() => {
          removerListeners();
        }).catch(() => {
          // Permanece ouvindo caso o navegador ainda exija um gesto mais explícito
        });
      }
    }

    // Tentativa inicial imediata (funciona caso o navegador já tenha política de engajamento favorável)
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Autoplay aceito de imediato pelo navegador
      }).catch(() => {
        // Autoplay bloqueado pelo navegador até primeira interação: registra listeners globais de captura
        eventosAtivacao.forEach(evento => {
          window.addEventListener(evento, desbloquearAutoplay, { capture: true, passive: true });
          document.addEventListener(evento, desbloquearAutoplay, { capture: true, passive: true });
        });
      });
    }

    return () => {
      removerListeners();
      if (musicaRef.current) {
        musicaRef.current.pause();
        musicaRef.current.src = '';
      }
    };
  }, []);

  const handleAlternarMusicaPrincipal = () => {
    const audio = musicaRef.current;
    if (!audio) return;

    // Se estiver mutado ou se estiver pausado (ex: bloqueio inicial de autoplay do navegador),
    // o primeiro clique do usuário inicia a música imediatamente sem exigir mutar/desmutar
    if (musicaMutada || audio.paused) {
      audio.muted = false;
      audio.volume = 0.5;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
      setMusicaMutada(false);
      musicaMutadaRef.current = false;
    } else {
      audio.muted = true;
      audio.pause();
      setMusicaMutada(true);
      musicaMutadaRef.current = true;
    }
  };

  // Transições entre slides: abertura e fechamento pelo centro (Visão Geral <-> Diferenciais) e redimensionamento fluido
  const secaoAnteriorRef = useRef(secaoAtiva);
  const [aberturaCentro, setAberturaCentro] = useState(false);
  const aberturaTimerRef = useRef(null);
  const [fechandoVisor, setFechandoVisor] = useState(false);
  const fechandoTimerRef = useRef(null);
  const [saindoVisaoGeral, setSaindoVisaoGeral] = useState(false);
  const saindoHeroTimerRef = useRef(null);
  const [secaoVisorExibida, setSecaoVisorExibida] = useState(secaoAtiva > 0 ? secaoAtiva : 1);
  const visorInnerRef = useRef(null);
  const [visorHeight, setVisorHeight] = useState(null);
  const [emTransicao, setEmTransicao] = useState(false);
  const transicaoTimerRef = useRef(null);

  useEffect(() => {
    if (secaoAtiva > 0) {
      setSecaoVisorExibida(secaoAtiva);
    }
  }, [secaoAtiva]);


  const handleMudarSecao = (novaSecao) => {
    if (novaSecao === secaoAtiva) return;

    if (novaSecao > 0) {
      setSecaoVisorExibida(novaSecao);
    }

    // Se estiver saindo da Visão Geral (0) para o visor (1, 2, 3 ou 4)
    if (secaoAtiva === 0 && novaSecao > 0) {
      tocarEfeitoSonoro(somAbreSlide, 0.55);
      setSaindoVisaoGeral(true);
      setSecaoAtiva(novaSecao);
      if (saindoHeroTimerRef.current) clearTimeout(saindoHeroTimerRef.current);
      saindoHeroTimerRef.current = setTimeout(() => {
        setSaindoVisaoGeral(false);
      }, 450);
      return;
    }

    // Se estiver saindo do visor (1, 2, 3 ou 4) de volta para a Visão Geral (0)
    if (secaoAtiva > 0 && novaSecao === 0) {
      tocarEfeitoSonoro(somAbreSlide, 0.55);
      setFechandoVisor(true);
      setSecaoAtiva(0);
      if (fechandoTimerRef.current) clearTimeout(fechandoTimerRef.current);
      fechandoTimerRef.current = setTimeout(() => {
        setFechandoVisor(false);
      }, 520);
      return;
    }

    // Se estava fechando ou saindo e o usuário navegou antes do fim dos timers
    if (fechandoVisor) {
      setFechandoVisor(false);
      if (fechandoTimerRef.current) clearTimeout(fechandoTimerRef.current);
    }
    if (saindoVisaoGeral) {
      setSaindoVisaoGeral(false);
      if (saindoHeroTimerRef.current) clearTimeout(saindoHeroTimerRef.current);
    }

    // Troca direta entre slides / seções do visor (ex: 1 -> 2, 2 -> 3, etc.)
    if (secaoAtiva > 0 && novaSecao > 0) {
      tocarEfeitoSonoro(somTrocaSlide, 0.5);
    }

    setSecaoAtiva(novaSecao);
  };

  useLayoutEffect(() => {
    if (secaoAtiva === 0) {
      secaoAnteriorRef.current = 0;
      if (aberturaTimerRef.current) clearTimeout(aberturaTimerRef.current);
      if (transicaoTimerRef.current) clearTimeout(transicaoTimerRef.current);
      setAberturaCentro(false);
      setEmTransicao(false);
      return;
    }

    // Suprime scrollbars temporários durante a interpolação de altura entre seções
    setEmTransicao(true);
    if (transicaoTimerRef.current) clearTimeout(transicaoTimerRef.current);
    transicaoTimerRef.current = setTimeout(() => {
      setEmTransicao(false);
    }, 520);

    // Se a transição veio da Visão Geral (seção 0), ativa a abertura a partir do centro como placa holográfica
    if (secaoAnteriorRef.current === 0) {
      setAberturaCentro(true);
      if (aberturaTimerRef.current) clearTimeout(aberturaTimerRef.current);
      aberturaTimerRef.current = setTimeout(() => {
        setAberturaCentro(false);
      }, 650);
    }

    secaoAnteriorRef.current = secaoAtiva;

    // Sistema 100% auto-adaptativo: calcula a altura exata necessária a partir do DOM real
    // sem tabelas estáticas de altura, adaptando-se instantaneamente a qualquer alteração de conteúdo
    const calcularAltura = () => {
      if (!visorInnerRef.current) return;
      const innerEl = visorInnerRef.current;
      const headerEl = innerEl.querySelector('.tactical-visor-header');
      const bodyEl = innerEl.querySelector('.tactical-visor-body');
      const contentEl = bodyEl ? bodyEl.querySelector(':scope > div') : null;

      if (!contentEl) return;

      const headerStyle = headerEl ? window.getComputedStyle(headerEl) : null;
      const bodyStyle = bodyEl ? window.getComputedStyle(bodyEl) : null;
      const innerStyle = window.getComputedStyle(innerEl);

      const headerH = headerEl ? headerEl.offsetHeight : 0;
      const headerMargin = headerStyle ? (parseFloat(headerStyle.marginTop) || 0) + (parseFloat(headerStyle.marginBottom) || 0) : 0;

      // scrollHeight captura a extensão vertical exata e irrestrita do conteúdo real
      const contentH = Math.max(contentEl.scrollHeight, contentEl.offsetHeight);
      const bodyPadding = bodyStyle ? (parseFloat(bodyStyle.paddingTop) || 0) + (parseFloat(bodyStyle.paddingBottom) || 0) : 0;
      const innerPadding = (parseFloat(innerStyle.paddingTop) || 0) + (parseFloat(innerStyle.paddingBottom) || 0);

      // Soma dinâmica real dos elementos computados no navegador + margem de segurança de 6px contra rounding subpixel
      const alturaExata = Math.ceil(headerH + headerMargin + contentH + bodyPadding + innerPadding + 6);

      const isMobile = window.innerWidth <= 900;
      // Delimitador de segurança externa: impede que o container colida com a barra superior (72px)
      const delimitadorTopo = isMobile ? 84 : 108;
      const delimitadorBase = isMobile ? 24 : 36;
      const maxPermitido = Math.max(300, window.innerHeight - (delimitadorTopo + delimitadorBase));
      const finalH = Math.min(alturaExata, maxPermitido);

      setVisorHeight((prevH) => {
        if (prevH && Math.abs(prevH - finalH) < 2) return prevH;
        return finalH;
      });
    };

    calcularAltura();
    const rafId = requestAnimationFrame(calcularAltura);
    const t1 = setTimeout(calcularAltura, 40);
    const t2 = setTimeout(calcularAltura, 150);
    const t3 = setTimeout(calcularAltura, 400);

    let ro = null;
    if (typeof ResizeObserver !== 'undefined' && visorInnerRef.current) {
      ro = new ResizeObserver(() => {
        calcularAltura();
      });
      const contentEl = visorInnerRef.current.querySelector('.tactical-visor-body > div');
      if (contentEl) ro.observe(contentEl);
      ro.observe(visorInnerRef.current);
    }

    window.addEventListener('resize', calcularAltura);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', calcularAltura);
    };
  }, [secaoAtiva, secaoVisorExibida]);

  // Controladores de estado dos painéis laterais colapsáveis
  const [painelEsquerdoAberto, setPainelEsquerdoAberto] = useState(false);
  const [painelDireitoAberto, setPainelDireitoAberto] = useState(false);

  // Modais de Aprofundamento no Console com controle de animação suave
  const [modalGlossarioAberto, setModalGlossarioAberto] = useState(false);
  const [modalTutorialAberto, setModalTutorialAberto] = useState(false);
  const [modalCenariosAberto, setModalCenariosAberto] = useState(false);
  const [modalFechando, setModalFechando] = useState(false);

  // MODO ORBITAL UNIFICADO (RADAR 3D FIGURATIVO)
  const [modoOrbitalAtivo, setModoOrbitalAtivo] = useState(false);
  const modoOrbitalAtivoRef = useRef(false);
  useEffect(() => {
    modoOrbitalAtivoRef.current = modoOrbitalAtivo;
  }, [modoOrbitalAtivo]);

  const [camadaOrbitalAtiva, setCamadaOrbitalAtiva] = useState(null);
  const [pinoOrbitalAtivo, setPinoOrbitalAtivo] = useState(null);
  const entidadesAreas3DRef = useRef(null);
  const entidadesEventos3DRef = useRef([]);

  const handleAlternarModoOrbital = () => {
    const v = viewerRef.current;
    if (!v || !window.Cesium) return;

    if (!modoOrbitalAtivo) {
      tocarEfeitoSonoro(somIniciar, 0.7);
      setModoOrbitalAtivo(true);
      setCamadaOrbitalAtiva(null);
      setPinoOrbitalAtivo(null);
      setSatSelecionado(null);
      setParametrosOrbitaisSat(null);
      limparTrilhaOrbital(v);

      // Oculta todos os satélites individuais
      pointsRef.current.forEach(({ point }) => {
        point.show = false;
      });

      // Recolhe ambos os painéis laterais
      setPainelEsquerdoAberto(false);
      setPainelDireitoAberto(false);

      // Posiciona câmera em perspectiva 3D com planeta à esquerda conforme o esboço
      posicionarCameraModoOrbital(v);

      // Cria as geometrias figurativas das órbitas e marcadores dos eventos
      removerGeometriasAreas3D(v, entidadesAreas3DRef.current);
      entidadesAreas3DRef.current = criarGeometriasAreas3D(v);

      removerMarcadoresEventos3D(v, entidadesEventos3DRef.current);
      entidadesEventos3DRef.current = criarMarcadoresEventos3D(v);
    } else {
      tocarEfeitoSonoro(somFadeOut, 0.65);
      setModoOrbitalAtivo(false);
      setCamadaOrbitalAtiva(null);
      setPinoOrbitalAtivo(null);

      // Reativa controles do mouse no Cesium com foco central no planeta
      const ctrl = v.scene.screenSpaceCameraController;
      ctrl.enableRotate = true;
      ctrl.enableZoom = true;
      ctrl.enableTranslate = false;
      ctrl.enableTilt = false;
      ctrl.enableLook = false;

      // Remove geometrias das faixas orbitais e pinos
      removerGeometriasAreas3D(v, entidadesAreas3DRef.current);
      entidadesAreas3DRef.current = null;
      removerMarcadoresEventos3D(v, entidadesEventos3DRef.current);
      entidadesEventos3DRef.current = [];

      // Reexibe todos os satélites individuais
      pointsRef.current.forEach(({ point, sat }) => {
        const catId = Number(sat.categoria_id);
        const isAtiva = (catId in categoriasAtivas) ? categoriasAtivas[catId] : true;
        point.show = isAtiva;
      });

      // Restaura câmera inicial
      v.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
      const camTarget = cameraInicialRef.current || {
        destination: window.Cesium.Cartesian3.fromDegrees(
          POSICAO_ORBITAL_PADRAO.longitude,
          POSICAO_ORBITAL_PADRAO.latitude,
          POSICAO_ORBITAL_PADRAO.altitude
        ),
        orientation: {
          heading: window.Cesium.Math.toRadians(POSICAO_ORBITAL_PADRAO.heading),
          pitch: window.Cesium.Math.toRadians(POSICAO_ORBITAL_PADRAO.pitch),
          roll: POSICAO_ORBITAL_PADRAO.roll
        }
      };
      v.camera.flyTo({
        destination: camTarget.destination.clone(),
        orientation: {
          heading: camTarget.orientation.heading,
          pitch: camTarget.orientation.pitch,
          roll: camTarget.orientation.roll
        },
        duration: 1.5
      });
    }
  };

  const handleSelecionarCamadaOrbital = (camadaId) => {
    setCamadaOrbitalAtiva(camadaId);
    setPinoOrbitalAtivo(null);
    tocarEfeitoSonoro(somTrocaSlide, 0.45);
    destacarCamadaOrbital(entidadesAreas3DRef.current, camadaId);
    if (entidadesEventos3DRef.current) {
      entidadesEventos3DRef.current.forEach((ent) => {
        destacarPinoHistorico(ent, false);
      });
    }
  };

  const handleSelecionarPinoOrbital = (pinoId) => {
    setPinoOrbitalAtivo(pinoId);
    setCamadaOrbitalAtiva(null);
    tocarEfeitoSonoro(somIniciar, 0.7);
    const pinoObj = obterPinoHistorico(pinoId);
    if (pinoObj) {
      destacarCamadaOrbital(entidadesAreas3DRef.current, pinoObj.camadaId);
    }
    if (entidadesEventos3DRef.current) {
      entidadesEventos3DRef.current.forEach((ent) => {
        const pId = ent.properties?.pinoId?.getValue();
        destacarPinoHistorico(ent, pId === pinoId);
      });
    }
  };

  const handleResetarModoOrbital = () => {
    setCamadaOrbitalAtiva(null);
    setPinoOrbitalAtivo(null);
    tocarEfeitoSonoro(somFadeOut, 0.5);
    destacarCamadaOrbital(entidadesAreas3DRef.current, null);
    if (entidadesEventos3DRef.current) {
      entidadesEventos3DRef.current.forEach((ent) => {
        destacarPinoHistorico(ent, false);
      });
    }
  };

  const handleAbrirCenarios = () => {
    tocarEfeitoSonoro(somTopPainel, 0.65);
    setModalFechando(false);
    setModalCenariosAberto(true);
  };

  const handleFecharModais = () => {
    setModalFechando(true);
    setTimeout(() => {
      setModalGlossarioAberto(false);
      setModalTutorialAberto(false);
      setModalCenariosAberto(false);
      setModalFechando(false);
    }, 220);
  };

  const handleAbrirGlossario = () => {
    tocarEfeitoSonoro(somTopPainel, 0.65);
    setModalFechando(false);
    setModalTutorialAberto(false);
    setModalGlossarioAberto(true);
  };

  const handleAbrirTutorial = () => {
    tocarEfeitoSonoro(somTopPainel, 0.65);
    setModalFechando(false);
    setModalGlossarioAberto(false);
    setModalTutorialAberto(true);
  };

  const handleAlternarPainelEsquerdo = (abrir) => {
    tocarEfeitoSonoro(somPainelLateral, 0.65);
    setPainelEsquerdoAberto(abrir);
    if (abrir && window.innerWidth < 950) {
      setPainelDireitoAberto(false);
    }
  };

  const handleAlternarPainelDireito = (abrir) => {
    tocarEfeitoSonoro(somPainelLateral, 0.65);
    setPainelDireitoAberto(abrir);
    if (abrir && window.innerWidth < 950) {
      setPainelEsquerdoAberto(false);
    }
  };

  // Referência para controlar redimensionamento de painéis
  const eraCompactoRef = useRef(window.innerWidth < 950);

  // Estados de dados da API
  const [objetos, setObjetos] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados de Interação
  const [busca, setBusca] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [satSelecionado, setSatSelecionado] = useState(null);
  const [parametrosOrbitaisSat, setParametrosOrbitaisSat] = useState(null);
  const [recarregandoAmostra, setRecarregandoAmostra] = useState(false);
  const [amostraSeed, setAmostraSeed] = useState(0);
  const [densidadeCatalogo, setDensidadeCatalogo] = useState('tatica'); // 'tatica' (3000) | 'completo' (10000)
  const [regimeAtivo, setRegimeAtivo] = useState(null); // null | 'LEO' | 'MEO' | 'GEO' | 'HEO'

  // Filtros de Categoria do Radar (4 categorias clicáveis, Estações Espaciais são 100% permanentes)
  const [categoriasAtivas, setCategoriasAtivas] = useState({
    1: true, // Satélite Ativo
    2: true, // Satélite Inativo
    5: true, // Corpo de Foguete
    3: true, // Detrito Espacial
    4: true  // Estações Espaciais Principais
  });
  const [modulosEstacao, setModulosEstacao] = useState([]);
  const [carregandoModulos, setCarregandoModulos] = useState(false);

  // Efeito para carregar ecossistema e naves acopladas quando uma estação principal for inspecionada
  useEffect(() => {
    if (!satSelecionado) {
      setModulosEstacao([]);
      return;
    }
    const norad = String(satSelecionado.norad_id || '').trim();
    if (norad === '25544' || norad === '48274') {
      setCarregandoModulos(true);
      fetch(`${API_URL}/api/estacoes/${norad}/modulos`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setModulosEstacao(data);
        })
        .catch(err => {
          console.error("Erro ao carregar módulos acoplados:", err);
          setModulosEstacao([]);
        })
        .finally(() => {
          setCarregandoModulos(false);
        });
    } else {
      setModulosEstacao([]);
    }
  }, [satSelecionado]);

  // Ajuste inicial e dinâmico de visibilidade dos painéis HUD
  useEffect(() => {
    if (telaAtiva !== 'simulador') return;

    const eCompactoInicial = window.innerWidth < 950;
    eraCompactoRef.current = eCompactoInicial;

    const timer = setTimeout(() => {
      if (eCompactoInicial) {
        setPainelDireitoAberto(false);
        setPainelEsquerdoAberto(true);
      } else {
        setPainelEsquerdoAberto(true);
        setPainelDireitoAberto(true);
      }
    }, 100);

    const handleResizePaineis = () => {
      const eCompacto = window.innerWidth < 950;
      if (eCompacto !== eraCompactoRef.current) {
        eraCompactoRef.current = eCompacto;
        if (eCompacto) {
          setPainelDireitoAberto(false);
          setPainelEsquerdoAberto(true);
        } else {
          setPainelEsquerdoAberto(true);
          setPainelDireitoAberto(true);
        }
      }
    };

    window.addEventListener('resize', handleResizePaineis);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResizePaineis);
    };
  }, [telaAtiva]);

  // Fechamento suave de modais com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleFecharModais();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);



  // 1. CARREGAMENTO INICIAL DE ESTATÍSTICAS
  useEffect(() => {
    const carregarEstatisticas = async () => {
      try {
        const resStats = await fetch(`${API_URL}/api/estatisticas`);
        if (resStats.ok) {
          const dataStats = await resStats.json();
          setEstatisticas(dataStats);
        }
      } catch (err) {
        console.error("Erro ao carregar estatísticas orbitais:", err);
      }
    };
    carregarEstatisticas();
  }, []);

  // 2. CARREGAMENTO REATIVO DE OBJETOS COM BASE NAS 4 CATEGORIAS
  useEffect(() => {
    const carregarObjetosFiltrados = async () => {
      if (objetos.length === 0) {
        setLoading(true);
      }
      try {
        const ativas = Array.from(new Set([
          ...Object.entries(categoriasAtivas).filter(([, ativa]) => ativa).map(([k]) => Number(k)),
          4
        ]));

        const limite = densidadeCatalogo === 'tatica' ? 3000 : 10000;
        let url = `${API_URL}/api/objetos?limit=${limite}&seed=${amostraSeed || Date.now()}`;
        if (regimeAtivo) {
          url += `&regime=${regimeAtivo}`;
        }
        if (ativas.length > 0) {
          url += `&categoria_ids=${ativas.join(',')}`;
        } else {
          url += `&categoria_ids=none`;
        }

        const resObjs = await fetch(url);
        if (resObjs.ok) {
          const dataObjs = await resObjs.json();
          setObjetos(dataObjs);
        }
      } catch (err) {
        console.error("Erro ao carregar objetos orbitais:", err);
      } finally {
        setLoading(false);
        setTimeout(() => {
          setRecarregandoAmostra(false);
        }, 400);
      }
    };

    carregarObjetosFiltrados();
  }, [categoriasAtivas, amostraSeed, densidadeCatalogo, regimeAtivo]);

  const handleRecarregarAmostra = () => {
    if (recarregandoAmostra || loading) return;
    tocarEfeitoSonoro(somRecarregarAmostragem, 0.65);
    setRecarregandoAmostra(true);
    setAmostraSeed(Date.now());
  };

  const handleAlternarDensidade = (novoModo) => {
    if (novoModo === densidadeCatalogo) return;
    tocarEfeitoSonoro(somConsoleButtons, 0.5);
    setDensidadeCatalogo(novoModo);
    setAmostraSeed(Date.now());
  };

  const handleAlternarRegime = (regime) => {
    tocarEfeitoSonoro(somConsoleButtons, 0.5);
    const novoRegime = regimeAtivo === regime ? null : regime;
    setRegimeAtivo(novoRegime);
  };

  // 3. BUSCA DE SATÉLITES COM DEBOUNCE
  useEffect(() => {
    if (busca.trim().length < 2) {
      setSugestoes([]);
      return;
    }

    const buscarObjetosAPI = async () => {
      try {
        const res = await fetch(`${API_URL}/api/objetos?busca=${encodeURIComponent(busca)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setSugestoes(data);
        }
      } catch (err) {
        console.error("Erro na busca de satélites:", err);
      }
    };

    const delayDebounce = setTimeout(buscarObjetosAPI, 300);
    return () => clearTimeout(delayDebounce);
  }, [busca]);

  // Renderização da trilha orbital em cinza
  // Traça ou atualiza a rota orbital em cinza prateado
  const desenharTrilhaOrbital = (viewerInstance, tleOuSat) => {
    if (!viewerInstance || !tleOuSat || telaAtivaRef.current !== 'simulador' || !window.Cesium) return;

    try {
      const tempoBase = viewerInstance.clock ? window.Cesium.JulianDate.toDate(viewerInstance.clock.currentTime) : new Date();
      const pontos = gerarPontosOrbita(tleOuSat, tempoBase, 180);
      if (!pontos || pontos.length < 10) return;

      const entidadeExistente = viewerInstance.entities.getById('trilha-orbital-dinamica');
      if (entidadeExistente) {
        entidadeExistente.polyline.positions = pontos;
        orbitaEntidadeRef.current = entidadeExistente;
      } else {
        const entidadeOrbita = viewerInstance.entities.add({
          id: 'trilha-orbital-dinamica',
          polyline: {
            positions: pontos,
            width: 2.0,
            material: new window.Cesium.Color(0.82, 0.86, 0.92, 0.75),
            arcType: window.Cesium.ArcType.NONE,
            loop: true
          }
        });
        orbitaEntidadeRef.current = entidadeOrbita;
      }
    } catch (e) {
      console.warn("Falha ao traçar polilinha da órbita:", e);
    }
  };

  const limparTrilhaOrbital = (viewerInstance) => {
    if (!viewerInstance || !window.Cesium) return;
    try {
      const entidade = viewerInstance.entities.getById('trilha-orbital-dinamica');
      if (entidade) {
        viewerInstance.entities.remove(entidade);
      }
      orbitaEntidadeRef.current = null;
    } catch {
      // Ignora exceções de remoção assíncrona
    }
  };

  // Cria ou recupera ponto de satélite no Cesium sob demanda
  const obterOuCriarPontoSatelite = (sat, v) => {
    if (!sat || !v || !window.Cesium) return null;
    const noradStr = String(sat.norad_id);

    if (pointsRef.current.has(noradStr)) {
      return pointsRef.current.get(noradStr);
    }

    if (sat.estacao_pai_norad && pointsRef.current.has(String(sat.estacao_pai_norad))) {
      return pointsRef.current.get(String(sat.estacao_pai_norad));
    }

    const satrec = obterSatrec(sat);
    if (!satrec) return null;

    try {
      const dataBase = new Date();
      const gmstBase = satellite.gstime(dataBase);
      const posAndVel = satellite.propagate(satrec, dataBase);
      if (!posAndVel || !posAndVel.position) return null;

      const posGd = satellite.eciToGeodetic(posAndVel.position, gmstBase);
      const longitude = satellite.degreesLong(posGd.longitude);
      const latitude = satellite.degreesLat(posGd.latitude);
      const altitude = posGd.height * 1000;
      const initialPos = window.Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude);

      if (!pointCollectionRef.current || pointCollectionRef.current.isDestroyed()) {
        pointCollectionRef.current = v.scene.primitives.add(new window.Cesium.PointPrimitiveCollection());
      }
      const colecao = pointCollectionRef.current;
      const catId = Number(sat.categoria_id) || 1;
      const estilo = obterEstiloPontoCesium(catId, 'padrao', sat.norad_id);

      const point = colecao.add({
        id: noradStr,
        position: initialPos,
        pixelSize: Math.max(estilo.pixelSize || 6, 7),
        color: estilo.color,
        outlineColor: estilo.outlineColor,
        outlineWidth: estilo.outlineWidth,
        show: true
      });

      point._satCategoriaId = catId;
      point._noradId = noradStr;
      const entry = { point, sat, satrec };
      pointsRef.current.set(noradStr, entry);
      return entry;
    } catch (err) {
      console.warn("Aviso ao instanciar ponto sob demanda:", err);
      return null;
    }
  };

  // Centraliza e acompanha o satélite na câmera do Cesium
  const centralizarCameraNoObjeto = (sat) => {
    const v = viewerRef.current;
    if (!v || !window.Cesium || !sat || modoOrbitalAtivoRef.current) return;

    let entry = pointsRef.current.get(String(sat.norad_id));
    if (!entry || !entry.point) {
      entry = obterOuCriarPontoSatelite(sat, v);
    }
    if (!entry || !entry.point) return;

    objetoFocadoRef.current = null;
    entidadeFocadaRef.current = null;
    cameraSeguindoObjetoRef.current = null;
    v.camera.cancelFlight();
    v.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
    v.trackedEntity = undefined;

    let rangeDist = 3200000.0;
    const noradStr = String(sat.norad_id);
    const altSatKm = Number(sat.perigeu_km || sat.apogeu_km) || 500;
    if (altSatKm > 30000 || sat.regime === 'GEO') {
      rangeDist = 18000000.0;
    } else if (altSatKm > 5000 || sat.regime === 'MEO') {
      rangeDist = 7500000.0;
    } else if (noradStr === '25544' || noradStr === '48274') {
      rangeDist = 2400000.0;
    }

    const currentEntry = entry;
    const targetPos = currentEntry.point.position.clone();

    v.camera.flyToBoundingSphere(new window.Cesium.BoundingSphere(targetPos, 1000), {
      duration: 1.2,
      offset: new window.Cesium.HeadingPitchRange(
        window.Cesium.Math.toRadians(0.0),
        window.Cesium.Math.toRadians(-65.0),
        rangeDist
      ),
      complete: () => {
        cameraSeguindoObjetoRef.current = noradStr;
        const e = pointsRef.current.get(noradStr);
        posicaoAnteriorSatRef.current = e ? e.point.position.clone() : targetPos;
      }
    });
  };

  // 4. SELEÇÃO E CÁLCULO FÍSICO DO SATÉLITE
  const handleSelecionarSat = (sat, reproduzirSom = true, focarCamera = true) => {
    if (reproduzirSom) {
      tocarEfeitoSonoro(somFadeIn, 0.65);
    }
    satSelecionadoRef.current = sat;
    setSatSelecionado(sat);
    setPainelDireitoAberto(true);

    if (window.innerWidth < 950) {
      setPainelEsquerdoAberto(false);
    }

    const v = viewerRef.current;
    if (sat && sat.ultimo_tle) {
      const params = calcularParametrosOrbitais(sat.ultimo_tle.linha1, sat.ultimo_tle.linha2);
      setParametrosOrbitaisSat(params);
      if (v) {
        desenharTrilhaOrbital(v, sat.ultimo_tle);
      }
    } else {
      setParametrosOrbitaisSat(null);
    }

    // Foca câmera no objeto selecionado
    if (focarCamera && v) {
      centralizarCameraNoObjeto(sat);
    }

    // Busca dados enriquecidos sob demanda (COSPAR, local de lançamento, status e histórico SATCAT)
    if (sat && sat.norad_id) {
      fetch(`${API_URL}/api/objetos/${sat.norad_id}`)
        .then(res => res.ok ? res.json() : null)
        .then(dadosCompletos => {
          if (dadosCompletos && satSelecionadoRef.current && String(satSelecionadoRef.current.norad_id) === String(sat.norad_id)) {
            setSatSelecionado(prev => ({
              ...prev,
              ...dadosCompletos,
              ultimo_tle: dadosCompletos.ultimo_tle || prev?.ultimo_tle
            }));
          }
        })
        .catch(err => {
          console.warn("Aviso ao buscar detalhes atualizados do satélite:", err);
        });
    }
  };

  const handleDesfocarCamera = (reproduzirSom = true) => {
    const v = viewerRef.current;
    if (!v) return;

    if (reproduzirSom && satSelecionadoRef.current) {
      tocarEfeitoSonoro(somFadeOut, 0.65);
    }

    cameraSeguindoObjetoRef.current = null;
    posicaoAnteriorSatRef.current = null;
    objetoFocadoRef.current = null;
    entidadeFocadaRef.current = null;
    satHoverIdRef.current = null;
    v.camera.cancelFlight();
    v.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
    v.trackedEntity = undefined;
    satSelecionadoRef.current = null;
    setSatSelecionado(null);
    setParametrosOrbitaisSat(null);
    limparTrilhaOrbital(v);

    // Em telas compactas, fecha o painel de telemetria e restaura o painel de dados
    if (window.innerWidth < 950) {
      setPainelDireitoAberto(false);
      setPainelEsquerdoAberto(true);
    }

    const camTarget = cameraInicialRef.current;
    if (camTarget && camTarget.direction && camTarget.up) {
      v.camera.flyTo({
        destination: camTarget.destination.clone(),
        orientation: {
          direction: camTarget.direction.clone(),
          up: camTarget.up.clone()
        },
        duration: 1.2
      });
    } else {
      v.camera.flyTo({
        destination: window.Cesium.Cartesian3.fromDegrees(
          POSICAO_ORBITAL_PADRAO.longitude,
          POSICAO_ORBITAL_PADRAO.latitude,
          POSICAO_ORBITAL_PADRAO.altitude
        ),
        orientation: {
          heading: window.Cesium.Math.toRadians(POSICAO_ORBITAL_PADRAO.heading),
          pitch: window.Cesium.Math.toRadians(-89.5),
          roll: 0.0
        },
        duration: 1.2
      });
    }
  };

  // Funções de Descoberta Rápida e Investigação Guiada (Passo 2.1)
  const focarEntidadeNoCesium = (noradId) => {
    let sat = objetos.find(o => String(o.norad_id) === String(noradId));
    if (!sat && pointsRef.current.has(String(noradId))) {
      sat = pointsRef.current.get(String(noradId)).sat;
    }
    if (sat) {
      centralizarCameraNoObjeto(sat);
    }
  };

  const handleInvestigarObjeto = async (noradId) => {
    const noradStr = String(noradId).trim();
    tocarEfeitoSonoro(somFadeIn, 0.65);

    let sat = objetos.find(o => String(o.norad_id) === noradStr);

    if (!sat) {
      try {
        const res = await fetch(`${API_URL}/api/objetos/${noradStr}`);
        if (res.ok) {
          sat = await res.json();
        }
      } catch (err) {
        console.warn("Erro ao buscar objeto para investigação:", err);
      }
    }

    if (sat) {
      const catId = Number(sat.categoria_id) || 1;
      setCategoriasAtivas(prev => ({ ...prev, [catId]: true }));
      handleSelecionarSat(sat, true);
      focarEntidadeNoCesium(sat.norad_id);
    }
  };

  const handleAplicarFiltroCategorias = (novasCategorias) => {
    tocarEfeitoSonoro(somConsoleButtons, 0.5);
    setCategoriasAtivas(prev => ({
      ...prev,
      ...novasCategorias
    }));
  };

  const handleLocalizarGeo = async () => {
    tocarEfeitoSonoro(somFadeIn, 0.65);
    let satGeo = objetos.find(o => {
      if (!o.ultimo_tle) return false;
      const p = calcularParametrosOrbitais(o.ultimo_tle.linha1, o.ultimo_tle.linha2);
      return p && p.regimeCodigo === 'GEO';
    });

    if (!satGeo) {
      try {
        const res = await fetch(`${API_URL}/api/objetos/42698`);
        if (res.ok) {
          satGeo = await res.json();
        }
      } catch {
        // fallback
      }
    }

    if (satGeo) {
      setCategoriasAtivas(prev => ({ ...prev, 1: true }));
      handleSelecionarSat(satGeo, true);
      focarEntidadeNoCesium(satGeo.norad_id);
    }
  };

  const handleVoltarInicio = () => {
    tocarEfeitoSonoro(somVoltar, 0.65);
    handleFecharModais();
    handleDesfocarCamera(false);
    setTransicaoCyber('para-inicio');
    setTimeout(() => {
      setTelaAtiva('inicio');
      setSecaoAtiva(0);
      setTransicaoCyber(null);
    }, 600);
  };

  // 5. INICIALIZAÇÃO DO GLOBO CESIUM 3D E EVENTOS DE HOVER COM TRILHA
  useEffect(() => {
    if (!window.Cesium) return;

    const viewerInstance = new window.Cesium.Viewer('cesium-container', {
      animation: false,
      timeline: false,
      navigationHelpButton: false,
      infoBox: false,
      selectionIndicator: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      fullscreenButton: false,
      vrButton: false,
      baseLayer: false
    });

    viewerInstance.scene.globe.enableLighting = true;
    viewerInstance.scene.globe.showAtmosphere = true;
    viewerInstance.scene.globe.atmosphereLightIntensity = 1.3;
    viewerInstance.scene.globe.depthTestAgainstTerrain = true;

    // Configurações da câmera: trava a rotação e o foco no centro do planeta
    const ctrl = viewerInstance.scene.screenSpaceCameraController;
    ctrl.enableRotate = true;
    ctrl.enableZoom = true;
    ctrl.enableTranslate = false;
    ctrl.enableTilt = false;
    ctrl.enableLook = false;
    ctrl.minimumZoomDistance = 6378137 + 150000;
    ctrl.maximumZoomDistance = 150000000;
    ctrl.inertiaSpin = 0.85;
    ctrl.inertiaZoom = 0.8;

    // Provedor ArcGIS fotorrealista com fallback NaturalEarthII
    if (window.Cesium.ArcGisMapServerImageryProvider && window.Cesium.ArcGisMapServerImageryProvider.fromUrl) {
      window.Cesium.ArcGisMapServerImageryProvider.fromUrl(
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
      ).then(provider => {
        if (viewerInstance && !viewerInstance.isDestroyed()) {
          viewerInstance.imageryLayers.addImageryProvider(provider);
        }
      }).catch(() => {
        try {
          const provider = new window.Cesium.TileMapServiceImageryProvider({
            url: window.Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
          });
          viewerInstance.imageryLayers.addImageryProvider(provider);
        } catch {
          // Fallback para mapa base silencioso
        }
      });
    }

    viewerRef.current = viewerInstance;
    setViewer(viewerInstance);

    // Define a posição inicial padrão imediatamente no ponto desejado (América do Sul / Brasil)
    const destinoInicial = window.Cesium.Cartesian3.fromDegrees(
      POSICAO_ORBITAL_PADRAO.longitude,
      POSICAO_ORBITAL_PADRAO.latitude,
      POSICAO_ORBITAL_PADRAO.altitude
    );
    const orientacaoInicial = {
      heading: window.Cesium.Math.toRadians(POSICAO_ORBITAL_PADRAO.heading),
      pitch: window.Cesium.Math.toRadians(-89.5),
      roll: 0.0
    };

    viewerInstance.camera.setView({
      destination: destinoInicial,
      orientation: orientacaoInicial
    });

    cameraInicialRef.current = {
      destination: viewerInstance.camera.position.clone(),
      direction: viewerInstance.camera.direction.clone(),
      up: viewerInstance.camera.up.clone()
    };

    // Manipulador de Clique no Globo (Seleção)
    const clickHandler = new window.Cesium.ScreenSpaceEventHandler(viewerInstance.scene.canvas);
    clickHandler.setInputAction((click) => {
      if (telaAtivaRef.current !== 'simulador') return;

      // Interação 3D específica do MODO ORBITAL FIGURATIVO
      if (modoOrbitalAtivoRef.current) {
        let pickedObject = viewerInstance.scene.pick(click.position);
        if (!window.Cesium.defined(pickedObject)) {
          const drillList = viewerInstance.scene.drillPick(click.position);
          if (drillList && drillList.length > 0) pickedObject = drillList[0];
        }

        if (window.Cesium.defined(pickedObject)) {
          if (pickedObject.id?.properties) {
            const tipo = pickedObject.id.properties.tipo?.getValue();
            if (tipo === 'pino_historico') {
              const pinoId = pickedObject.id.properties.pinoId?.getValue();
              handleSelecionarPinoOrbital(pinoId);
              return;
            }
            if (pickedObject.id.properties.areaId) {
              const areaId = pickedObject.id.properties.areaId.getValue();
              handleSelecionarCamadaOrbital(areaId);
              return;
            }
          }
          if (typeof pickedObject.id === 'string' && pickedObject.id.startsWith('area_')) {
            const areaId = pickedObject.id.replace('area_', '');
            handleSelecionarCamadaOrbital(areaId);
            return;
          }
        }

        // Clicar fora desmarca seleção mantendo câmera na visão figurativa
        handleResetarModoOrbital();
        return;
      }

      // 1. Tentar pegar o objeto via drillPick no pixel exato
      let satEntryClique = null;
      const pickedList = viewerInstance.scene.drillPick(click.position);
      if (pickedList && pickedList.length > 0) {
        for (let i = 0; i < pickedList.length; i++) {
          const item = pickedList[i];
          const noradId = typeof item.id === 'string' ? item.id : (item.primitive?.id || null);
          if (noradId && pointsRef.current.has(String(noradId))) {
            satEntryClique = pointsRef.current.get(String(noradId));
            break;
          }
        }
      }

      // 2. Tolerância sutil de até 4px via drillPick na GPU
      if (!satEntryClique) {
        const offsets = [
          [-2, 0], [2, 0], [0, -2], [0, 2],
          [-3, -3], [3, -3], [-3, 3], [3, 3],
          [-4, 0], [4, 0], [0, -4], [0, 4]
        ];
        for (let i = 0; i < offsets.length; i++) {
          const p = new window.Cesium.Cartesian2(
            click.position.x + offsets[i][0],
            click.position.y + offsets[i][1]
          );
          const vizList = viewerInstance.scene.drillPick(p);
          if (vizList && vizList.length > 0) {
            for (let j = 0; j < vizList.length; j++) {
              const item = vizList[j];
              const noradId = typeof item.id === 'string' ? item.id : (item.primitive?.id || null);
              if (noradId && pointsRef.current.has(String(noradId))) {
                satEntryClique = pointsRef.current.get(String(noradId));
                break;
              }
            }
          }
          if (satEntryClique) break;
        }
      }

      if (satEntryClique) {
        handleSelecionarSat(satEntryClique.sat, true, true);
      } else {
        satHoverIdRef.current = null;
        handleDesfocarCamera(true);
      }
    }, window.Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Manipulador de Hover do Mouse (Gera trilha orbital dinamicamente sob o cursor)
    let lastHoveredEntity = null;
    let lastHoveredEventoEntity = null;
    const hoverHandler = new window.Cesium.ScreenSpaceEventHandler(viewerInstance.scene.canvas);
    const tooltipEl = document.getElementById('hud-tooltip');

    hoverHandler.setInputAction((movement) => {
      if (telaAtivaRef.current !== 'simulador') {
        viewerInstance.scene.canvas.style.cursor = 'default';
        if (tooltipEl) tooltipEl.style.display = 'none';
        return;
      }

      // Interação 3D sob o cursor no MODO ORBITAL FIGURATIVO
      if (modoOrbitalAtivoRef.current) {
        let pickedObject = viewerInstance.scene.pick(movement.endPosition);
        if (!window.Cesium.defined(pickedObject)) {
          const drillList = viewerInstance.scene.drillPick(movement.endPosition);
          if (drillList && drillList.length > 0) pickedObject = drillList[0];
        }

        let novoPinoHover = null;
        let novaCamadaHover = null;

        if (window.Cesium.defined(pickedObject)) {
          if (pickedObject.id?.properties) {
            const tipo = pickedObject.id.properties.tipo?.getValue();

            if (tipo === 'pino_historico') {
              novoPinoHover = pickedObject.id;
              const pinoData = pickedObject.id.properties.pinoData?.getValue();

              if (tooltipEl && pinoData) {
                tooltipEl.innerHTML = `
                  <div class="tooltip-header" style="border-color: rgba(255, 0, 85, 0.4); padding-bottom: 4px; margin-bottom: 4px;">
                    <span class="tooltip-name" style="color:#ff0055; font-size: 10px; font-weight:800;">[${pinoData.ano}] ${pinoData.localNome}</span>
                  </div>
                  <div style="font-size: 12px; font-weight: 700; color: #ffffff; letter-spacing: 0.4px;">
                    ${pinoData.nome}
                  </div>
                  <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">
                    Altitude: ${pinoData.posicao.altKm} km
                  </div>
                `;
                tooltipEl.style.display = 'block';
                tooltipEl.style.left = `${movement.endPosition.x + 14}px`;
                tooltipEl.style.top = `${movement.endPosition.y + 14}px`;
              }
            } else if (pickedObject.id.properties.areaId) {
              novaCamadaHover = pickedObject.id.properties.areaId.getValue();
            }
          } else if (typeof pickedObject.id === 'string' && pickedObject.id.startsWith('area_')) {
            novaCamadaHover = pickedObject.id.replace('area_', '');
          }
        }

        // Tooltip e cursor para faixa orbital sob hover
        if (novaCamadaHover && !novoPinoHover) {
          const infoCamada = CAMADAS_ORBITAIS[novaCamadaHover];
          if (tooltipEl && infoCamada) {
            tooltipEl.innerHTML = `
              <div class="tooltip-header" style="border-color: ${infoCamada.cor}66; padding-bottom: 4px; margin-bottom: 4px;">
                <span class="tooltip-name" style="color:${infoCamada.cor}; font-size: 10px; font-weight:800;">ÓRBITA ${infoCamada.sigla}</span>
              </div>
              <div style="font-size: 12px; font-weight: 700; color: #ffffff;">
                ${infoCamada.nome}
              </div>
              <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">
                Faixa: ${infoCamada.altitude}
              </div>
            `;
            tooltipEl.style.display = 'block';
            tooltipEl.style.left = `${movement.endPosition.x + 14}px`;
            tooltipEl.style.top = `${movement.endPosition.y + 14}px`;
          }
        }

        // Atualização de hover no marcador de pino
        if (lastHoveredEventoEntity !== novoPinoHover) {
          if (lastHoveredEventoEntity) {
            destacarPinoHistorico(lastHoveredEventoEntity, false);
          }
          if (novoPinoHover) {
            destacarPinoHistorico(novoPinoHover, true);
          }
          lastHoveredEventoEntity = novoPinoHover;
        }

        if (novoPinoHover || novaCamadaHover) {
          viewerInstance.scene.canvas.style.cursor = 'pointer';
        } else {
          viewerInstance.scene.canvas.style.cursor = 'default';
          if (tooltipEl) tooltipEl.style.display = 'none';
        }
        return;
      }

      let satEntryHover = null;
      const pickedListHover = viewerInstance.scene.drillPick(movement.endPosition);
      if (pickedListHover && pickedListHover.length > 0) {
        for (let i = 0; i < pickedListHover.length; i++) {
          const item = pickedListHover[i];
          const noradId = typeof item.id === 'string' ? item.id : (item.primitive?.id || null);
          if (noradId && pointsRef.current.has(String(noradId))) {
            satEntryHover = pointsRef.current.get(String(noradId));
            break;
          }
        }
      }

      if (satEntryHover) {
        const { point: hoveredPoint, sat: satData } = satEntryHover;
        viewerInstance.scene.canvas.style.cursor = 'pointer';

        if (lastHoveredEntity !== hoveredPoint) {
          // Restaurar estilo anterior
          if (lastHoveredEntity) {
            try {
              const lastCatId = Number(lastHoveredEntity._satCategoriaId) || 1;
              const lastNoradId = lastHoveredEntity._noradId;
              const estiloPadrao = obterEstiloPontoCesium(lastCatId, 'padrao', lastNoradId);
              lastHoveredEntity.pixelSize = estiloPadrao.pixelSize;
              lastHoveredEntity.outlineColor = estiloPadrao.outlineColor;
              lastHoveredEntity.outlineWidth = estiloPadrao.outlineWidth;
            } catch {
              // Ponto indisponível
            }
          }

          lastHoveredEntity = hoveredPoint;
          satHoverIdRef.current = satData.norad_id;

          // Realçar ponto sob hover
          try {
            hoveredPoint._satCategoriaId = Number(satData.categoria_id) || 1;
            hoveredPoint._noradId = String(satData.norad_id);
            const isEstacao = String(satData.norad_id) === '25544' || String(satData.norad_id) === '48274';
            hoveredPoint.pixelSize = isEstacao ? 13 : (hoveredPoint.pixelSize || 6) + 3;
            hoveredPoint.outlineColor = window.Cesium.Color.WHITE;
            hoveredPoint.outlineWidth = isEstacao ? 2 : 2.5;
          } catch {
            // Ponto indisponível
          }

          // Traçar a órbita no Cesium sob hover caso o satélite não seja o já selecionado
          if (satData && satData.ultimo_tle) {
            desenharTrilhaOrbital(viewerInstance, satData.ultimo_tle);
          }
        }

        // Construir Tooltip Didático Completo no DOM sem innerHTML
        if (tooltipEl && satData) {
          const catId = Number(satData.categoria_id);
          const corCat = CORES_CATEGORIAS[catId] || '#00ff66';

          // Calcular parâmetros astrodinâmicos em tempo real para o tooltip
          let paramsHover = null;
          if (satData.ultimo_tle) {
            paramsHover = calcularParametrosOrbitais(satData.ultimo_tle.linha1, satData.ultimo_tle.linha2);
          }

          tooltipEl.textContent = '';

          // Cabeçalho
          const headerDiv = document.createElement('div');
          headerDiv.className = 'tooltip-header';
          headerDiv.style.borderLeft = `3px solid ${corCat}`;

          const dotSpan = document.createElement('span');
          dotSpan.className = 'tooltip-dot';
          dotSpan.style.backgroundColor = corCat;

          const nameSpan = document.createElement('span');
          nameSpan.className = 'tooltip-name';
          nameSpan.textContent = satData.nome;

          headerDiv.appendChild(dotSpan);
          headerDiv.appendChild(nameSpan);

          // Corpo com telemetria
          const bodyDiv = document.createElement('div');
          bodyDiv.className = 'tooltip-body';

          const criarLinha = (rotulo, valor, corDestaque = null) => {
            const linha = document.createElement('div');
            linha.className = 'tooltip-line';
            const labelSpan = document.createElement('span');
            labelSpan.className = 'tooltip-label';
            labelSpan.textContent = rotulo;
            const valSpan = document.createElement('span');
            valSpan.className = 'tooltip-value';
            if (corDestaque) valSpan.style.color = corDestaque;
            valSpan.textContent = valor;
            linha.appendChild(labelSpan);
            linha.appendChild(valSpan);
            return linha;
          };

          bodyDiv.appendChild(criarLinha('NORAD ID: ', `#${satData.norad_id}`));
          bodyDiv.appendChild(criarLinha('PAÍS: ', satData.pais || 'Desconhecido'));
          bodyDiv.appendChild(criarLinha('CATEGORIA: ', satData.categoria?.nome || 'Satélite', corCat));

          if (paramsHover) {
            bodyDiv.appendChild(criarLinha('ALTITUDE: ', `${paramsHover.altitudeInstantaneaKm.toLocaleString('pt-BR')} km (${paramsHover.regimeCodigo})`, '#00f0ff'));
            bodyDiv.appendChild(criarLinha('VELOCIDADE: ', `${paramsHover.velocidadeKmH.toLocaleString('pt-BR')} km/h`));
            bodyDiv.appendChild(criarLinha('PERÍODO: ', `${paramsHover.periodoMinutos} min / volta`));
          }

          tooltipEl.appendChild(headerDiv);
          tooltipEl.appendChild(bodyDiv);

          tooltipEl.style.display = 'block';
          tooltipEl.style.left = `${movement.endPosition.x + 15}px`;
          tooltipEl.style.top = `${movement.endPosition.y + 15}px`;
        }

      } else {
        viewerInstance.scene.canvas.style.cursor = 'default';

        if (lastHoveredEntity) {
          try {
            const lastCatId = Number(lastHoveredEntity._satCategoriaId) || 1;
            const lastNoradId = lastHoveredEntity._noradId;
            const estiloPadrao = obterEstiloPontoCesium(lastCatId, 'padrao', lastNoradId);
            lastHoveredEntity.pixelSize = estiloPadrao.pixelSize;
            lastHoveredEntity.outlineColor = estiloPadrao.outlineColor;
            lastHoveredEntity.outlineWidth = estiloPadrao.outlineWidth;
          } catch {
            // Ponto indisponível
          }
          lastHoveredEntity = null;
          satHoverIdRef.current = null;

          // Restaura a órbita do satélite selecionado se houver, senão remove a trilha
          const satAtivo = satSelecionadoRef.current;
          if (satAtivo && satAtivo.ultimo_tle) {
            desenharTrilhaOrbital(viewerInstance, satAtivo.ultimo_tle);
          } else {
            limparTrilhaOrbital(viewerInstance);
          }
        }

        if (tooltipEl) {
          tooltipEl.style.display = 'none';
        }
      }
    }, window.Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Acompanhamento do objeto focado no preRender
    const removerPreRender = viewerInstance.scene.preRender.addEventListener(() => {
      if (!viewerRef.current || viewerRef.current.isDestroyed() || !window.Cesium) return;

      const satAtivo = satSelecionadoRef.current;
      if (satAtivo) {
        const noradStr = String(satAtivo.norad_id);
        const entry = pointsRef.current.get(noradStr);
        if (entry && entry.satrec && entry.point && entry.point.show) {
          try {
            const agora = new Date();
            const gmst = satellite.gstime(agora);
            const pv = satellite.propagate(entry.satrec, agora);
            if (pv && pv.position && !isNaN(pv.position.x)) {
              const gd = satellite.eciToGeodetic(pv.position, gmst);
              const lon = satellite.degreesLong(gd.longitude);
              const lat = satellite.degreesLat(gd.latitude);
              const alt = Math.max(0, gd.height * 1000);

              if (!scratchSelectedPosRef.current) {
                scratchSelectedPosRef.current = new window.Cesium.Cartesian3();
              }
              const posAtual = window.Cesium.Cartesian3.fromDegrees(lon, lat, alt, undefined, scratchSelectedPosRef.current);
              entry.point.position = posAtual;

              // Acompanhamento orbital suave da câmera
              if (cameraSeguindoObjetoRef.current === noradStr) {
                const posAnt = posicaoAnteriorSatRef.current;
                if (posAnt && viewerRef.current) {
                  const magAnt = window.Cesium.Cartesian3.magnitude(posAnt);
                  const magAtual = window.Cesium.Cartesian3.magnitude(posAtual);
                  if (magAnt > 1000 && magAtual > 1000) {
                    const cosA = window.Cesium.Cartesian3.dot(posAnt, posAtual) / (magAnt * magAtual);
                    const angle = Math.acos(Math.max(-1, Math.min(1, cosA)));

                    if (angle > 1e-8 && !isNaN(angle)) {
                      if (!scratchAxisRef.current) scratchAxisRef.current = new window.Cesium.Cartesian3();
                      if (!scratchQuatRef.current) scratchQuatRef.current = new window.Cesium.Quaternion();
                      if (!scratchRotMatRef.current) scratchRotMatRef.current = new window.Cesium.Matrix3();

                      window.Cesium.Cartesian3.cross(posAnt, posAtual, scratchAxisRef.current);
                      const magAxis = window.Cesium.Cartesian3.magnitude(scratchAxisRef.current);
                      if (magAxis > 1e-6) {
                        window.Cesium.Cartesian3.normalize(scratchAxisRef.current, scratchAxisRef.current);
                        window.Cesium.Quaternion.fromAxisAngle(scratchAxisRef.current, angle, scratchQuatRef.current);
                        window.Cesium.Matrix3.fromQuaternion(scratchQuatRef.current, scratchRotMatRef.current);

                        const cam = viewerRef.current.camera;
                        window.Cesium.Matrix3.multiplyByVector(scratchRotMatRef.current, cam.position, cam.position);
                        window.Cesium.Matrix3.multiplyByVector(scratchRotMatRef.current, cam.direction, cam.direction);
                        window.Cesium.Matrix3.multiplyByVector(scratchRotMatRef.current, cam.up, cam.up);
                        window.Cesium.Cartesian3.cross(cam.direction, cam.up, cam.right);
                      }
                    }
                  }
                }
                posicaoAnteriorSatRef.current = window.Cesium.Cartesian3.clone(posAtual, posicaoAnteriorSatRef.current || new window.Cesium.Cartesian3());
              }
            }
          } catch {
            // Falha silenciosa de propagação no frame
          }
        }
      }
    });

    return () => {
      removerPreRender();
      clickHandler.destroy();
      hoverHandler.destroy();
      if (viewerInstance && !viewerInstance.isDestroyed()) {
        viewerInstance.destroy();
      }
      viewerRef.current = null;
      setViewer(null);
    };
  }, []);

  // Redimensionamento responsivo do Cesium
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    const handleResize = () => {
      try {
        if (viewer && !viewer.isDestroyed()) {
          viewer.resize();
        }
      } catch {
        // Redimensionamento silencioso
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewer]);

  // 5. PROPAGAÇÃO E PLOTAGEM DE SATÉLITES COM POINT PRIMITIVE COLLECTION
  useEffect(() => {
    if (!viewer || objetos.length === 0 || !window.Cesium) return;

    if (!pointCollectionRef.current || pointCollectionRef.current.isDestroyed()) {
      pointCollectionRef.current = viewer.scene.primitives.add(new window.Cesium.PointPrimitiveCollection());
    }

    const colecao = pointCollectionRef.current;
    colecao.removeAll();
    pointsRef.current.clear();

    const satelitesFiltrados = objetos.filter(sat => {
      const catId = Number(sat.categoria_id);
      // Se houver regime orbital isolado, filtra estritamente por esse regime
      if (regimeAtivo && sat.regime !== regimeAtivo) return false;

      // Estações Espaciais Principais: apenas ISS e Tiangong permanecem renderizadas e fixas
      if (catId === 4) {
        return (sat.norad_id === '25544' || sat.norad_id === '48274') && Boolean(sat.ultimo_tle);
      }
      // Nunca renderiza módulos acoplados nem componentes de estações no globo
      if (sat.estacao_pai_norad) return false;
      const nomeUpper = String(sat.nome || '').toUpperCase();
      if (nomeUpper.startsWith('ISS (') && sat.norad_id !== '25544') return false;
      if (nomeUpper.startsWith('CSS (') && sat.norad_id !== '48274') return false;

      const isAtiva = (catId in categoriasAtivas) && categoriasAtivas[catId];
      return isAtiva && Boolean(sat.omm || sat.ultimo_tle);
    });

    const dataBase = new Date();
    const gmstBase = satellite.gstime(dataBase);

    satelitesFiltrados.forEach(sat => {
      try {
        const catId = Number(sat.categoria_id);
        const satrec = obterSatrec(sat);
        if (!satrec) return;

        let posAndVel = satellite.propagate(satrec, dataBase);
        let rMag = posAndVel && posAndVel.position ? Math.sqrt(posAndVel.position.x * posAndVel.position.x + posAndVel.position.y * posAndVel.position.y + posAndVel.position.z * posAndVel.position.z) : 0;
        let altKm = rMag - 6378.137;

        const isLeoinvalido = sat.regime === 'LEO' && (altKm > 2000 || altKm < 60);
        const isGeralInvalido = altKm < 60 || altKm > 100000;

        if (!posAndVel || !posAndVel.position || isLeoinvalido || isGeralInvalido) {
          try {
            const line2 = sat.ultimo_tle?.linha2 || '';
            let mm = parseFloat(line2.substring(52, 63).trim()) || sat.omm?.MEAN_MOTION || 15;
            if (mm <= 0) mm = 15;
            const periodMs = (1440 / mm) * 60000;
            const epochyr = satrec.epochyr < 57 ? 2000 + satrec.epochyr : 1900 + satrec.epochyr;
            const epochDate = new Date(Date.UTC(epochyr, 0, 1) + (satrec.epochdays - 1) * 86400000);
            const elapsedMs = dataBase.getTime() - epochDate.getTime();
            const modDate = new Date(epochDate.getTime() + (Math.abs(elapsedMs) % periodMs));
            const freshSatrec = obterSatrec(sat);
            if (freshSatrec) {
              posAndVel = satellite.propagate(freshSatrec, modDate);
            }
          } catch {
            // Mantém cálculo original
          }
        }

        if (!posAndVel || !posAndVel.position) return;

        const posGd = satellite.eciToGeodetic(posAndVel.position, gmstBase);
        const longitude = satellite.degreesLong(posGd.longitude);
        const latitude = satellite.degreesLat(posGd.latitude);
        const altitude = posGd.height * 1000;
        const initialPos = window.Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude);

        const isEstacaoPrincipal = String(sat.norad_id) === '25544' || String(sat.norad_id) === '48274';
        const estilo = obterEstiloPontoCesium(catId, 'padrao', sat.norad_id);
        const point = colecao.add({
          id: String(sat.norad_id),
          position: initialPos,
          pixelSize: estilo.pixelSize,
          color: estilo.color,
          outlineColor: estilo.outlineColor,
          outlineWidth: estilo.outlineWidth,
          scaleByDistance: isEstacaoPrincipal
            ? new window.Cesium.NearFarScalar(1.5e6, 1.25, 8.0e7, 0.65)
            : new window.Cesium.NearFarScalar(1.5e6, 1.2, 8.0e7, 0.35),
          show: (telaAtivaRef.current === 'simulador') && (catId in categoriasAtivas ? categoriasAtivas[catId] : true) && (!regimeAtivo || sat.regime === regimeAtivo)
        });

        point._satCategoriaId = catId;
        point._noradId = String(sat.norad_id);
        pointsRef.current.set(String(sat.norad_id), { point, sat, satrec });
      } catch (err) {
        // Ignora objeto com TLE instável
      }
    });

    // Inicializa lista de satélites no Web Worker
    satelitesIndicesRef.current = satelitesFiltrados.map(s => String(s.norad_id));
    if (workerRef.current) {
      workerRef.current.postMessage({
        tipo: 'INICIALIZAR',
        satelites: satelitesFiltrados.map(s => ({
          norad_id: s.norad_id,
          regime: s.regime,
          ultimo_tle: s.ultimo_tle,
          omm: s.omm
        }))
      });

      if (telaAtivaRef.current === 'simulador' && !modoOrbitalAtivoRef.current) {
        workerRef.current.postMessage({ tipo: 'INICIAR', intervaloMs: 1000 });
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ tipo: 'PARAR' });
      }
      colecao.removeAll();
      pointsRef.current.clear();
    };
  }, [objetos, categoriasAtivas, regimeAtivo, viewer]);

  // Sincroniza a visibilidade dos pontos e atividade do Web Worker com a tela ativa
  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || !pointCollectionRef.current) return;
    const mostrarObjetos = (telaAtiva === 'simulador') && !modoOrbitalAtivo;
    pointsRef.current.forEach(({ point, sat }) => {
      const catId = Number(sat.categoria_id);
      const isAtiva = (catId in categoriasAtivas) ? categoriasAtivas[catId] : true;
      const matchRegime = !regimeAtivo || (sat.regime === regimeAtivo);
      point.show = mostrarObjetos && isAtiva && matchRegime;
    });

    if (workerRef.current) {
      if (mostrarObjetos) {
        workerRef.current.postMessage({ tipo: 'INICIAR', intervaloMs: 1000 });
      } else {
        workerRef.current.postMessage({ tipo: 'PARAR' });
      }
    }

    if (!mostrarObjetos) {
      limparTrilhaOrbital(viewer);
      const tooltipEl = document.getElementById('hud-tooltip');
      if (tooltipEl) tooltipEl.style.display = 'none';
    }
  }, [telaAtiva, categoriasAtivas, modoOrbitalAtivo, regimeAtivo, viewer]);


  const handleAlternarCategoria = (catId) => {
    setCategoriasAtivas(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const handleIniciarMonitoramento = () => {
    tocarEfeitoSonoro(somIniciar, 0.65);
    setTransicaoCyber('para-simulador');
    try {
      const v = viewerRef.current;
      if (v && window.Cesium) {
        objetoFocadoRef.current = null;
        entidadeFocadaRef.current = null;
        try {
          v.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
        } catch {
          // Mantém integridade do transform da câmera
        }
        v.trackedEntity = undefined;
        const destino = window.Cesium.Cartesian3.fromDegrees(
          POSICAO_ORBITAL_PADRAO.longitude,
          POSICAO_ORBITAL_PADRAO.latitude,
          POSICAO_ORBITAL_PADRAO.altitude
        );
        v.camera.setView({
          destination: destino,
          orientation: {
            heading: window.Cesium.Math.toRadians(POSICAO_ORBITAL_PADRAO.heading),
            pitch: window.Cesium.Math.toRadians(POSICAO_ORBITAL_PADRAO.pitch),
            roll: POSICAO_ORBITAL_PADRAO.roll
          }
        });
      }
    } catch (err) {
      console.warn("Aviso ao definir posição inicial do Cesium:", err);
    }
    setTimeout(() => {
      setTelaAtiva('simulador');
      setTransicaoCyber(null);
    }, 600);
  };

  // Contadores dinâmicos de categorias para os dashboards e filtros
  const obterContadoresCategorias = () => {
    if (estatisticas && estatisticas.totais_oficiais) {
      return estatisticas.totais_oficiais;
    }
    return {
      ativos: 15651,
      inativos: 3530,
      foguetes: 3468,
      detritos: 9167,
      estacoes: 2,
      total: 31842,
      total_em_orbita: 31841,
      total_console: 31818,
      celestrak_catalogados: 34729,
      celestrak_rastreados: 31818,
      nao_catalogados_estimativa: "Mais de 140 milhões"
    };
  };

  const calcularObjetosNoRadar = () => {
    return objetos.length || 1002;
  };

  // Totais catalogados de cada regime orbital na base de dados
  const obterTotaisRegimes = () => {
    if (estatisticas && estatisticas.distribuicao_regimes) {
      return estatisticas.distribuicao_regimes;
    }
    return {
      leo: 26180,
      meo: 637,
      geo: 1830,
      heo: 3171
    };
  };

  // Contadores dinâmicos de objetos atualmente visíveis/plotados no console para cada categoria
  const contadoresVisiveisCategorias = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (!objetos || objetos.length === 0) return counts;

    objetos.forEach(sat => {
      const catId = Number(sat.categoria_id);
      if (sat.estacao_pai_norad) return;
      const nomeUpper = String(sat.nome || '').toUpperCase();
      if (nomeUpper.startsWith('ISS (') && sat.norad_id !== '25544') return;
      if (nomeUpper.startsWith('CSS (') && sat.norad_id !== '48274') return;

      if (sat.ultimo_tle) {
        if (catId === 4) {
          if (sat.norad_id === '25544' || sat.norad_id === '48274') {
            counts[4]++;
          }
        } else if (counts[catId] !== undefined) {
          counts[catId]++;
        }
      }
    });

    return counts;
  }, [objetos]);

  // Distribuição em tempo real por regime orbital (LEO, MEO, GEO, HEO) dos objetos visíveis
  const distribuicaoRegimes = useMemo(() => {
    const regimes = {
      leo: 0,
      meo: 0,
      geo: 0,
      heo: 0,
      total: 0
    };

    if (!objetos || objetos.length === 0) return regimes;

    objetos.forEach(sat => {
      const catId = Number(sat.categoria_id);
      if (catId === 4 && sat.norad_id !== '25544' && sat.norad_id !== '48274') return;
      if (sat.estacao_pai_norad) return;
      const nomeUpper = String(sat.nome || '').toUpperCase();
      if (nomeUpper.startsWith('ISS (') && sat.norad_id !== '25544') return;
      if (nomeUpper.startsWith('CSS (') && sat.norad_id !== '48274') return;

      if (categoriasAtivas[catId] && sat.ultimo_tle && sat.ultimo_tle.linha1 && sat.ultimo_tle.linha2) {
        const regime = sat.regime || classificarRegimeOrbital(sat.ultimo_tle.linha1, sat.ultimo_tle.linha2);
        if (regime === 'LEO') regimes.leo++;
        else if (regime === 'MEO') regimes.meo++;
        else if (regime === 'GEO') regimes.geo++;
        else if (regime === 'HEO') regimes.heo++;
        regimes.total++;
      }
    });

    return regimes;
  }, [objetos, categoriasAtivas]);

  // Ficha factual do satélite selecionado
  const fichaFactual = useMemo(() => {
    if (!satSelecionado) return null;
    return obterFichaFactual(satSelecionado, parametrosOrbitaisSat);
  }, [satSelecionado, parametrosOrbitaisSat]);

  return (
    <div className="app-container" ref={containerRef}>
      {/* 3D GLOBE BACKDROP (CESIUM) */}
      <div id="cesium-container" className="cesium-container"></div>

      {/* TELA INICIAL CINEMATOGRÁFICA (ESTÉTICA EDOLUS & MOONSWORTH) */}
      {(telaAtiva === 'inicio' || transicaoCyber) && (
        <div
          className={`welcome-screen ${
            transicaoCyber === 'para-simulador'
              ? 'fade-out-cyber'
              : transicaoCyber === 'para-inicio'
              ? 'fade-in-cyber'
              : ''
          }`}
        >
          {/* BARRA SUPERIOR MINIMALISTA (ESTILO MOONSWORTH) */}
          <nav className="cinema-navbar">
            <div className="cinema-nav-left">
              <h1 className="cinema-brand">
                ORBITAL<span>ED</span>
              </h1>
            </div>

            <div className="cinema-nav-center">
              <button
                type="button"
                className={`cinema-nav-link ${secaoAtiva === 0 ? 'active' : ''}`}
                onClick={() => handleMudarSecao(0)}
              >
                INÍCIO
              </button>
              <button
                type="button"
                className={`cinema-nav-link ${secaoAtiva === 1 ? 'active' : ''}`}
                onClick={() => handleMudarSecao(1)}
              >
                SOBRE
              </button>
              <button
                type="button"
                className={`cinema-nav-link ${secaoAtiva === 2 ? 'active' : ''}`}
                onClick={() => handleMudarSecao(2)}
              >
                RECURSOS
              </button>
              <button
                type="button"
                className={`cinema-nav-link ${secaoAtiva === 3 ? 'active' : ''}`}
                onClick={() => handleMudarSecao(3)}
              >
                SUSTENTABILIDADE
              </button>
              <button
                type="button"
                className={`cinema-nav-link ${secaoAtiva === 4 ? 'active' : ''}`}
                onClick={() => handleMudarSecao(4)}
              >
                GLOSSÁRIO
              </button>
            </div>

            <div className="cinema-nav-right">
              <button
                type="button"
                className={`cinema-planet-btn cinema-sound-btn ${musicaMutada ? 'muted' : 'active'}`}
                onClick={handleAlternarMusicaPrincipal}
                aria-label={musicaMutada ? "Desmutar trilha sonora" : "Mutar trilha sonora"}
                title={musicaMutada ? "Desmutar trilha sonora (Ativar áudio)" : "Mutar trilha sonora (Silenciar)"}
              >
                {musicaMutada ? (
                  <VolumeOff size={20} className="cinema-planet-icon cinema-sound-icon muted" />
                ) : (
                  <Volume2 size={20} className="cinema-planet-icon cinema-sound-icon" />
                )}
                <span className="planet-btn-halo sound-btn-halo"></span>
              </button>
            </div>
          </nav>

          {/* SETAS LATERAIS MINIMALISTAS DIGITAIS */}
          <button
            type="button"
            className="cinema-side-nav prev"
            onClick={() => handleMudarSecao((secaoAtiva - 1 + 5) % 5)}
            aria-label="Anterior"
            title="Seção anterior"
          >
            <ChevronLeft size={46} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="cinema-side-nav next"
            onClick={() => handleMudarSecao((secaoAtiva + 1) % 5)}
            aria-label="Próximo"
            title="Próxima seção"
          >
            <ChevronRight size={46} strokeWidth={2.2} />
          </button>

          {/* CONTEÚDO PRINCIPAL DINÂMICO */}
          {(secaoAtiva === 0 || saindoVisaoGeral) && (
            /* SEÇÃO 0: HERO CINEMATOGRÁFICO ABERTO (FOTO 1 - EDOLUS) */
            <div className={`cinema-hero-view ${saindoVisaoGeral ? 'fade-out-hero' : ''}`}>
              <div className="cinema-cross c-tl">+</div>
              <div className="cinema-cross c-tr">+</div>
              <div className="cinema-cross c-bl">+</div>
              <div className="cinema-cross c-br">+</div>

              <div className="cinema-hero-center">
                <h1 className="cinema-hero-title">
                  MONITORAMENTO ORBITAL<br />
                  EM ESCALA PLANETÁRIA
                </h1>

                <p className="cinema-hero-subtitle">
                  PLATAFORMA EDUCACIONAL DE ANÁLISE ORBITAL, VISUALIZAÇÃO 3D E SUSTENTABILIDADE ESPACIAL.
                </p>

                <div className="cinema-btn-container">
                  <button
                    type="button"
                    className="cinema-bracket-btn"
                    onClick={handleIniciarMonitoramento}
                  >
                    <span className="bracket-mark b-tl"></span>
                    <span className="bracket-mark b-tr"></span>
                    <span className="bracket-mark b-bl"></span>
                    <span className="bracket-mark b-br"></span>
                    <span className="bracket-btn-label">INICIAR EXPLORAÇÃO</span>
                  </button>
                </div>
              </div>

              <div className="cinema-hero-footer">
                <span className="cinema-footer-indicator">CELESTRAK · SPACE-TRACK · SGP4 · TLE</span>
              </div>
            </div>
          )}

          {(secaoAtiva > 0 || fechandoVisor) && (
            /* SEÇÕES 1, 2, 3 e 4: VISOR TÁTICO ESTILO GLASS PAD */
            <div className={`cinema-tactical-view ${fechandoVisor ? 'fechando' : ''}`}>
              {/* Delimitadores ópticos de enquadramento tático nos 4 cantos */}
              <div className="cinema-cross c-tl">+</div>
              <div className="cinema-cross c-tr">+</div>
              <div className="cinema-cross c-bl">+</div>
              <div className="cinema-cross c-br">+</div>

              <div
                className={`tactical-visor-frame ${aberturaCentro ? 'anim-abertura-centro' : ''} ${fechandoVisor ? 'anim-fechamento-centro' : ''}`}
                style={{ height: visorHeight ? `${visorHeight}px` : undefined }}
              >
                <div ref={visorInnerRef} className="tactical-visor-inner">
                  {/* Título Centralizado e Limpo */}
                  <div className="tactical-visor-header">
                    <h2 className="tactical-tag-title" key={secaoVisorExibida}>
                      {secaoVisorExibida === 1 && "SOBRE A PLATAFORMA"}
                      {secaoVisorExibida === 2 && "RECURSOS TECNOLÓGICOS DO SISTEMA"}
                      {secaoVisorExibida === 3 && "SUSTENTABILIDADE ESPACIAL & IMPACTO PLANETÁRIO"}
                      {secaoVisorExibida === 4 && "GLOSSÁRIO ASTRODINÂMICO DIDÁTICO"}
                    </h2>
                  </div>

                  {/* Corpo do Visor Aberto com Conteúdo Reativo */}
                  <div className={`tactical-visor-body ${emTransicao ? 'em-transicao' : ''}`} key={secaoVisorExibida}>
                    {secaoVisorExibida === 1 && (
                      <div className="tactical-about-container">
                        {/* Bloco Único Consolidado com Digitação Tática nos Títulos e Textos Imediatos */}
                        <AboutSectionCard
                          active={secaoVisorExibida === 1 && secaoAtiva === 1}
                        />

                        {/* Barra Inferior com Métricas Chave do Projeto: Imediatamente visível sem fade-in */}
                        <div className="tactical-about-metrics-bar">
                          <div className="about-metric-item">
                            <span className="about-metric-val">35.000+</span>
                            <span className="about-metric-lbl">Censo Global em Órbita</span>
                            <span className="about-metric-sub">Fonte: NORAD / Space-Track</span>
                          </div>
                          <div className="about-metric-divider"></div>
                          <div className="about-metric-item">
                            <span className="about-metric-val">11.000+</span>
                            <span className="about-metric-lbl">Catálogo no Banco Local</span>
                            <span className="about-metric-sub">Sincronizado via CelesTrak</span>
                          </div>
                          <div className="about-metric-divider"></div>
                          <div className="about-metric-item">
                            <span className="about-metric-val">1.000</span>
                            <span className="about-metric-lbl">Amostragem Vetorial 3D</span>
                            <span className="about-metric-sub">Propagação SGP4 a 60 FPS</span>
                          </div>
                          <div className="about-metric-divider"></div>
                          <div className="about-metric-item">
                            <span className="about-metric-val">24h</span>
                            <span className="about-metric-lbl">Ciclo de Atualização</span>
                            <span className="about-metric-sub">Sincronização Diária de TLEs</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {secaoVisorExibida === 2 && (
                      <div className="tactical-features-container">
                        {/* GRADE HORIZONTAL: ÍCONES ANIMADOS EM CIMA DE CADA BLOCO DO LADO DE FORA */}
                        <div className="tactical-features-grid">
                          {/* BLOCO 1: TRAJETÓRIAS */}
                          <div className="tactical-feature-column">
                            <div className="feature-column-external-icon">
                              <Orbit size={46} className="resource-icon-anim anim-orbit-spin" />
                            </div>
                            <div className="tactical-feature-card">
                              <div className="feature-card-header">
                                <h3 className="tactical-feature-title">
                                  <CyberTypewriter
                                    text="TRAJETÓRIAS"
                                    active={secaoVisorExibida === 2}
                                    delay={70}
                                    speed={40}
                                  />
                                </h3>
                              </div>
                              <p className="tactical-feature-desc">
                                Explore planos e altitudes orbitais livremente pelo globo, aponte para qualquer objeto para traçar seu circuito completo ou fixe a câmera em um satélite para acompanhá-lo em tempo real.
                              </p>
                            </div>
                          </div>

                          {/* BLOCO 2: FÍSICA */}
                          <div className="tactical-feature-column">
                            <div className="feature-column-external-icon">
                              <Atom size={46} className="resource-icon-anim anim-physics-atom" />
                            </div>
                            <div className="tactical-feature-card">
                              <div className="feature-card-header">
                                <h3 className="tactical-feature-title">
                                  <CyberTypewriter
                                    text="FÍSICA"
                                    active={secaoVisorExibida === 2}
                                    delay={200}
                                    speed={50}
                                  />
                                </h3>
                              </div>
                              <p className="tactical-feature-desc">
                                Monitore dados instantâneos de altitude, velocidade e tempo de órbita, observando na prática a variação gravitacional e os pontos de maior e menor aproximação da Terra.
                              </p>
                            </div>
                          </div>

                          {/* BLOCO 3: EXPLORAÇÃO */}
                          <div className="tactical-feature-column">
                            <div className="feature-column-external-icon">
                              <Compass size={46} className="resource-icon-anim anim-compass-nav" />
                            </div>
                            <div className="tactical-feature-card">
                              <div className="feature-card-header">
                                <h3 className="tactical-feature-title">
                                  <CyberTypewriter
                                    text="EXPLORAÇÃO"
                                    active={secaoVisorExibida === 2}
                                    delay={330}
                                    speed={40}
                                  />
                                </h3>
                              </div>
                              <p className="tactical-feature-desc">
                                Consulte histórico, país de origem e objetivos de cada missão por meio de busca rápida ou catálogo, filtrando a visualização entre satélites operacionais, inativos e fragmentos espaciais.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* CARTÃO FULL-WIDTH: STACK TECNOLÓGICA COMPLETA DO SISTEMA */}
                        <div className="tactical-stack-card">
                          <div className="tactical-stack-header">
                            <div className="stack-header-left">
                              <Cpu size={18} className="stack-icon" />
                              <h3 className="tactical-stack-title">ARQUITETURA & STACK TECNOLÓGICA DO PROJETO</h3>
                            </div>
                            <span className="tactical-stack-badge">SISTEMA FULL-STACK INTEGRADO</span>
                          </div>

                          <div className="tactical-stack-grid">
                            <div className="stack-category-pod">
                              <div className="pod-header">
                                <span className="pod-indicator pod-cyan"></span>
                                <h4 className="pod-title">FRONTEND & MOTOR 3D</h4>
                              </div>
                              <div className="pod-tech-line">
                                <span>React 19</span> · <span>Vite 8</span> · <span>CesiumJS</span> · <span>Satellite.js</span>
                              </div>
                              <p className="pod-desc">Interface reativa de alto desempenho, renderização geoespacial 3D e cálculo vetorial propagado no navegador.</p>
                            </div>

                            <div className="stack-category-pod">
                              <div className="pod-header">
                                <span className="pod-indicator pod-cyan"></span>
                                <h4 className="pod-title">BACKEND & APIs</h4>
                              </div>
                              <div className="pod-tech-line">
                                <span>Python 3.11</span> · <span>FastAPI</span> · <span>SQLAlchemy 2.0</span> · <span>APScheduler</span>
                              </div>
                              <p className="pod-desc">API REST assíncrona de baixa latência, responsável pela ingestão de catálogos e orquestração de tarefas em background.</p>
                            </div>

                            <div className="stack-category-pod">
                              <div className="pod-header">
                                <span className="pod-indicator pod-cyan"></span>
                                <h4 className="pod-title">DADOS & EFEMÉRIDES</h4>
                              </div>
                              <div className="pod-tech-line">
                                <span>PostgreSQL 16</span> · <span>CelesTrak</span> · <span>Space-Track</span> · <span>TLE / SGP4</span>
                              </div>
                              <p className="pod-desc">Persistência relacional de efemérides com sincronização contínua de catálogos orbitais oficiais do USSPACECOM/NORAD.</p>
                            </div>

                            <div className="stack-category-pod">
                              <div className="pod-header">
                                <span className="pod-indicator pod-cyan"></span>
                                <h4 className="pod-title">DEVOPS & INFRAESTRUTURA</h4>
                              </div>
                              <div className="pod-tech-line">
                                <span>Docker</span> · <span>Docker Compose</span> · <span>Nginx Proxy</span> · <span>Healthchecks</span>
                              </div>
                              <p className="pod-desc">Arquitetura modular conteinerizada com isolamento de serviços, rede interna dedicada e alta reprodutibilidade.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {secaoVisorExibida === 3 && (
                      <div className="tactical-sustainability-section">
                        <div className="sustainability-pillars-grid">
                          <div className="sustainability-card card-kessler">
                            <div className="s-card-title-group">
                              <div className="s-icon-box s-icon-kessler">
                                <ShieldAlert size={18} />
                              </div>
                              <h4 className="s-card-title">Risco de Colisão</h4>
                            </div>
                            <p className="s-card-text">
                              A 27.000 km/h, um fragmento de apenas 1 cm tem a energia de uma granada, perfurando qualquer blindagem aeroespacial moderna.
                            </p>
                            <span className="s-stat-badge badge-kessler">Faixa Crítica: 750 a 950 km de altitude</span>
                            <div className="s-card-subtext-box">
                              <span className="s-subtext-dot dot-red"></span>
                              <p className="s-card-subtext">
                                A colisão histórica entre os satélites Iridium e Cosmos (2009) gerou mais de 2.000 fragmentos que até hoje forçam a Estação Espacial Internacional a desvios de rota.
                              </p>
                            </div>
                          </div>

                          <div className="sustainability-card card-reentry">
                            <div className="s-card-title-group">
                              <div className="s-icon-box s-icon-reentry">
                                <Flame size={18} />
                              </div>
                              <h4 className="s-card-title">Queda na Atmosfera</h4>
                            </div>
                            <p className="s-card-text">
                              Embora fuselagens vaporizem, tanques de titânio e blocos maciços de aço resistem a 2.000 °C e atingem a superfície.
                            </p>
                            <span className="s-stat-badge badge-reentry">Sobrevivência: 10% a 40% de peças pesadas</span>
                            <div className="s-card-subtext-box">
                              <span className="s-subtext-dot dot-orange"></span>
                              <p className="s-card-subtext">
                                Quedas controladas miram o Ponto Nemo no Pacífico Sul, mas satélites abandonados e desativados reentram de forma imprevisível sobre o planeta.
                              </p>
                            </div>
                          </div>

                          <div className="sustainability-card card-magneto">
                            <div className="s-card-title-group">
                              <div className="s-icon-box s-icon-magneto">
                                <Zap size={18} />
                              </div>
                              <h4 className="s-card-title">Interferência Eletromagnética</h4>
                            </div>
                            <p className="s-card-text">
                              A queima contínua de frotas de satélites injeta toneladas de óxido de alumínio e nanopartículas condutoras na alta atmosfera.
                            </p>
                            <div className="s-badge-stack">
                              <span className="badge-peer-reviewed">Dado Confirmado: Evidência de metais na estratosfera (PNAS)</span>
                              <span className="badge-hypothesis">Hipótese em Estudo: Modelagem de blindagem condutora (arXiv)</span>
                            </div>
                            <div className="s-card-subtext-box">
                              <span className="s-subtext-dot dot-cyan"></span>
                              <p className="s-card-subtext">
                                Cientistas investigam se essa camada artificial de poeira condutora pode interferir no funcionamento do escudo magnético natural da Terra.
                              </p>
                            </div>
                          </div>

                          <div className="sustainability-card card-climate">
                            <div className="s-card-title-group">
                              <div className="s-icon-box s-icon-climate">
                                <Wind size={18} />
                              </div>
                              <h4 className="s-card-title">Danos na Camada de Ozônio</h4>
                            </div>
                            <p className="s-card-text">
                              A poeira de alumínio liberada na queima de satélites catalisa reações de cloro, podendo atrasar a regeneração do ozônio por décadas.
                            </p>
                            <span className="s-stat-badge badge-climate">Impacto Químico: Poeira de alumínio e fuligem fóssil</span>
                            <div className="s-card-subtext-box">
                              <span className="s-subtext-dot dot-purple"></span>
                              <p className="s-card-subtext">
                                A fuligem liberada pelos motores de foguetes permanece acumulada por anos no topo da atmosfera, intensificando o aquecimento do planeta.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="tactical-table-box">
                          <div className="tactical-table-header">
                            <div className="tactical-table-title-group">
                              <AlertTriangle size={14} className="tactical-table-icon" />
                              <span>CENSO DE RESPONSABILIDADE GEOPOLÍTICA E DETRITOS CATALOGADOS</span>
                            </div>
                            <span className="tactical-table-source">CATÁLOGO SPACE-TRACK / NASA ODPO (SNAPSHOT: Q1/2026)</span>
                          </div>

                          <table className="tactical-table">
                            <thead>
                              <tr>
                                <th className="th-nation">NAÇÃO / BLOCO</th>
                                <th className="th-debris">DETRITOS OFICIAIS</th>
                                <th className="th-inactive">INATIVOS</th>
                                <th className="th-active">ATIVOS</th>
                                <th className="th-risk">RISCO AMBIENTAL</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="nation-cell"><span>Rússia</span></td>
                                <td className="cell-num-debris">4.961</td>
                                <td className="cell-num-inactive">1.328</td>
                                <td className="cell-num-active">386</td>
                                <td><span className="risk-badge risk-extreme"><span className="risk-dot"></span>RISCO EXTREMO (KESSLER)</span></td>
                              </tr>
                              <tr>
                                <td className="nation-cell"><span>Estados Unidos</span></td>
                                <td className="cell-num-debris">4.686</td>
                                <td className="cell-num-inactive">853</td>
                                <td className="cell-num-active cell-num-highlight">12.874</td>
                                <td><span className="risk-badge risk-critical"><span className="risk-dot"></span>RISCO CRÍTICO (DENSIDADE)</span></td>
                              </tr>
                              <tr>
                                <td className="nation-cell"><span>China</span></td>
                                <td className="cell-num-debris">4.525</td>
                                <td className="cell-num-inactive">77</td>
                                <td className="cell-num-active">1.500</td>
                                <td><span className="risk-badge risk-moderate"><span className="risk-dot"></span>RISCO ELEVADO</span></td>
                              </tr>
                              <tr>
                                <td className="nation-cell"><span>Reino Unido / Europa</span></td>
                                <td className="cell-num-debris">539</td>
                                <td className="cell-num-inactive">189</td>
                                <td className="cell-num-active">1.033</td>
                                <td><span className="risk-badge risk-controlled"><span className="risk-dot"></span>RISCO CONTROLADO</span></td>
                              </tr>
                              <tr>
                                <td className="nation-cell"><span>Brasil / Outros</span></td>
                                <td className="cell-num-debris cell-num-zero">0</td>
                                <td className="cell-num-inactive">9</td>
                                <td className="cell-num-active">14</td>
                                <td><span className="risk-badge risk-low"><span className="risk-dot"></span>SUSTENTÁVEL</span></td>
                              </tr>
                            </tbody>
                          </table>
                          <div className="tactical-table-footer">
                            <Info size={14} className="tactical-table-footer-icon" />
                            <div className="tactical-table-footer-text">
                              <span className="tactical-table-footer-highlight">CENSO GLOBAL:</span> Totalidade de objetos catalogados em órbita terrestre.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {secaoVisorExibida === 4 && (
                      <div className="tactical-glossary-section">
                        <div className="tactical-glossary-grid">
                          {GLOSSARIO_ORBITAL.map((categoria, idx) => (
                            <div key={idx} className="tactical-glossary-group">
                              <h3 className="tactical-group-title">{categoria.categoria}</h3>
                              <div className="tactical-terms-grid">
                                {categoria.itens.map((item, itemIdx) => (
                                  <div key={itemIdx} className="tactical-term-card">
                                    <div className="tactical-term-header">
                                      <span className="tactical-term-name">{item.termo}</span>
                                      <span className="tactical-term-sub">{item.titulo}</span>
                                    </div>
                                    <p className="tactical-term-desc">{item.definicao}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      )}

      {/* CONSOLE INTERATIVO DO SIMULADOR (HUD OVERLAY) */}
      {(telaAtiva === 'simulador' || transicaoCyber === 'para-inicio') && (
        <div className={`hud-overlay ${transicaoCyber === 'para-inicio' ? 'fade-out-hud' : ''}`}>

          {/* BARRA SUPERIOR (HEADER) */}
          <header className="hud-header">
            <div className="brand-section">
              <h1 className="brand-title">
                Orbital<span>ED</span>
              </h1>
              <button
                type="button"
                className={`cinema-planet-btn cinema-sound-btn ${musicaMutada ? 'muted' : 'active'}`}
                onClick={handleAlternarMusicaPrincipal}
                aria-label={musicaMutada ? "Desmutar trilha sonora" : "Mutar trilha sonora"}
                title={musicaMutada ? "Desmutar trilha sonora (Ativar áudio)" : "Mutar trilha sonora (Silenciar)"}
              >
                {musicaMutada ? (
                  <VolumeOff size={18} className="cinema-planet-icon cinema-sound-icon muted" />
                ) : (
                  <Volume2 size={18} className="cinema-planet-icon cinema-sound-icon" />
                )}
                <span className="planet-btn-halo sound-btn-halo"></span>
              </button>
            </div>

            {/* PAINEL TÁTICO CENTRAL TRAPEZOIDAL DE FERRAMENTAS NO HUD */}
            <div className="hud-tools-panel">
              <svg
                className="hud-trapezoid-svg"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {/* Fundo do painel em vidro escuro idêntico aos painéis laterais */}
                <polygon
                  points="0,0 100,0 95.5,100 4.5,100"
                  className="hud-trapezoid-bg"
                />
                {/* Borda perimetral tática contínua idêntica aos painéis laterais */}
                <polygon
                  points="0.5,0.5 99.5,0.5 95.2,99.5 4.8,99.5"
                  className="hud-trapezoid-stroke"
                  vectorEffect="non-scaling-stroke"
                />
                {/* Borda superior em azul mais claro idêntica aos painéis laterais */}
                <line
                  x1="0"
                  y1="1"
                  x2="100"
                  y2="1"
                  className="hud-trapezoid-top-accent"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              <div className="hud-tools-section">
                <button
                  type="button"
                  className="hud-tool-btn"
                  onClick={handleVoltarInicio}
                  title="Voltar para a Página Inicial"
                >
                  <Home size={15} className="hud-tool-icon" />
                  <span>INÍCIO</span>
                </button>

                <button
                  type="button"
                  className={`hud-tool-btn ${modoOrbitalAtivo ? 'active' : ''}`}
                  onClick={handleAlternarModoOrbital}
                  title={modoOrbitalAtivo ? "Retornar para a exploração livre do catálogo" : "Ativar visualização tridimensional de camadas e áreas da Terra"}
                >
                  <Orbit size={15} className="hud-tool-icon" />
                  <span>MODO ORBITAL</span>
                </button>

                <button
                  type="button"
                  className={`hud-tool-btn ${modalTutorialAberto ? 'active' : ''}`}
                  onClick={handleAbrirTutorial}
                  title="Abrir Guia Rápido do Operador"
                >
                  <Compass size={15} className="hud-tool-icon" />
                  <span>GUIA</span>
                </button>

                <button
                  type="button"
                  className={`hud-tool-btn ${modalGlossarioAberto ? 'active' : ''}`}
                  onClick={handleAbrirGlossario}
                >
                  <BookOpen size={15} className="hud-tool-icon" />
                  <span>GLOSSÁRIO</span>
                </button>
              </div>
            </div>

            {/* BUSCADOR DE SATÉLITES TÁTICO (OMITIDO NO MODO ORBITAL) */}
            {!modoOrbitalAtivo && (
              <div className="search-section">
                <div className="search-bar-container">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="BUSCAR SATÉLITE OU NORAD ID..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                  {busca && (
                    <X
                      size={16}
                      style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                      onClick={() => { setBusca(''); setSugestoes([]); }}
                    />
                  )}
                </div>

                {sugestoes.length > 0 && (
                  <div className="search-suggestions">
                    {sugestoes.map((sat) => (
                      <div
                        key={sat.norad_id}
                        className="suggestion-item"
                        onClick={() => {
                          handleSelecionarSat(sat);
                          setBusca('');
                          setSugestoes([]);
                        }}
                      >
                        <span>{sat.nome}</span>
                        <span className="suggestion-norad">#{sat.norad_id}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </header>

          {/* PAINÉIS LATERAIS FLUTUANTES (HUD - OMITIDOS NO MODO ORBITAL) */}
          {!modoOrbitalAtivo && (
            <>
              <div className="panels-container">

            {/* PAINEL ESQUERDO: MÉTRICAS E FILTROS */}
            <aside className={`hud-panel left-panel ${!painelEsquerdoAberto ? 'collapsed' : ''}`}>
              <div className="panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={16} className="panel-header-icon" />
                  <h2 className="panel-title">Métricas de Órbita</h2>
                </div>
                <button
                  type="button"
                  className="hud-toggle-btn-inline"
                  onClick={() => handleAlternarPainelEsquerdo(false)}
                  title="Recolher Painel"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>

              <div className="panel-content">
                {/* Métricas principais: console, catalogados e não catalogados */}
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '128px', flexShrink: 0, padding: '14px 16px', boxSizing: 'border-box' }}>
                  <div className="stat-label">Objetos no console</div>
                  <div className="stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '6px', fontSize: '28px', fontWeight: 700, color: '#ffffff', marginTop: '6px', lineHeight: 1 }}>
                    {loading && objetos.length === 0 ? "---" : (obterContadoresCategorias().total_console || 31818).toLocaleString('pt-BR')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed rgba(0, 240, 255, 0.15)', fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Objetos catalogados:</span>
                      <strong style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>
                        {(obterContadoresCategorias().celestrak_catalogados || 34729).toLocaleString('pt-BR')}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Objetos não catalogados:</span>
                      <strong style={{ color: '#ffb300', fontWeight: 600 }}>
                        {obterContadoresCategorias().nao_catalogados_estimativa || "Mais de 140 milhões"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* SELETOR DE DENSIDADE E BOTÃO DE RECARREGAMENTO */}
                <div className="resample-section">
                  <div className="density-toggle-group">
                    <button
                      type="button"
                      className={`density-toggle-btn ${densidadeCatalogo === 'tatica' ? 'active' : ''}`}
                      onClick={() => handleAlternarDensidade('tatica')}
                      title="Amostra Tática: 3.000 objetos calibrados na proporção oficial da ESA"
                    >
                      <span>TÁTICA (3.000)</span>
                    </button>
                    <button
                      type="button"
                      className={`density-toggle-btn ${densidadeCatalogo === 'completo' ? 'active' : ''}`}
                      onClick={() => handleAlternarDensidade('completo')}
                      title="Amostra Expandida: 10.000 objetos distribuídos na proporção oficial da ESA"
                    >
                      <span>EXPANDIDA (10.000)</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    className={`resample-btn ${recarregandoAmostra ? 'loading' : ''}`}
                    onClick={handleRecarregarAmostra}
                    disabled={loading || recarregandoAmostra}
                    title="Sortear nova amostragem proporcional de objetos"
                  >
                    <RotateCw size={13} className={`resample-icon ${recarregandoAmostra ? 'spin-anim' : ''}`} />
                    <span>{recarregandoAmostra ? 'SORTEANDO OBJETOS...' : 'RECARREGAR AMOSTRAGEM'}</span>
                  </button>
                </div>

                {/* Divisor Cibernético */}
                <div className="hud-cyber-divider" />

                {/* Filtros e Legenda das 4 Categorias */}
                <div className="legend-section">
                  <div className="legend-title">Filtros por Categoria</div>

                  {/* 1. Satélites Ativos */}
                  <div
                    className={`legend-item cat-ativos ${categoriasAtivas[1] ? 'active' : ''}`}
                    onClick={() => handleAlternarCategoria(1)}
                  >
                    <div className="legend-info">
                      <span className="category-dot" style={{ backgroundColor: CORES_CATEGORIAS[1] }}></span>
                      <span className="category-name">Satélites Ativos</span>
                    </div>
                    <span className="category-count">
                      {loading && objetos.length === 0
                        ? "---"
                        : `${(contadoresVisiveisCategorias[1] || 0).toLocaleString('pt-BR')} / ${obterContadoresCategorias().ativos.toLocaleString('pt-BR')}`}
                    </span>
                  </div>

                  {/* 2. Satélites Inativos */}
                  <div
                    className={`legend-item cat-inativos ${categoriasAtivas[2] ? 'active' : ''}`}
                    onClick={() => handleAlternarCategoria(2)}
                  >
                    <div className="legend-info">
                      <span className="category-dot" style={{ backgroundColor: CORES_CATEGORIAS[2] }}></span>
                      <span className="category-name">Satélites Inativos</span>
                    </div>
                    <span className="category-count">
                      {loading && objetos.length === 0
                        ? "---"
                        : `${(contadoresVisiveisCategorias[2] || 0).toLocaleString('pt-BR')} / ${obterContadoresCategorias().inativos.toLocaleString('pt-BR')}`}
                    </span>
                  </div>

                  {/* 3. Corpos de Foguetes (R/B) */}
                  <div
                    className={`legend-item cat-foguetes ${categoriasAtivas[5] ? 'active' : ''}`}
                    onClick={() => handleAlternarCategoria(5)}
                  >
                    <div className="legend-info">
                      <span className="category-dot" style={{ backgroundColor: CORES_CATEGORIAS[5] }}></span>
                      <span className="category-name">Corpos de Foguetes</span>
                    </div>
                    <span className="category-count">
                      {loading && objetos.length === 0
                        ? "---"
                        : `${(contadoresVisiveisCategorias[5] || 0).toLocaleString('pt-BR')} / ${(obterContadoresCategorias().foguetes || 2283).toLocaleString('pt-BR')}`}
                    </span>
                  </div>

                  {/* 4. Detritos Espaciais */}
                  <div
                    className={`legend-item cat-detritos ${categoriasAtivas[3] ? 'active' : ''}`}
                    onClick={() => handleAlternarCategoria(3)}
                  >
                    <div className="legend-info">
                      <span className="category-dot" style={{ backgroundColor: CORES_CATEGORIAS[3] }}></span>
                      <span className="category-name">Detritos Espaciais</span>
                    </div>
                    <span className="category-count">
                      {loading && objetos.length === 0
                        ? "---"
                        : `${(contadoresVisiveisCategorias[3] || 0).toLocaleString('pt-BR')} / ${obterContadoresCategorias().detritos.toLocaleString('pt-BR')}`}
                    </span>
                  </div>

                  {/* 5. Estações Espaciais Permanentes (Fixas no globo terrestre) */}
                  <div
                    className="legend-item cat-estacoes permanent-station-badge"
                    style={{
                      cursor: 'default',
                      background: 'rgba(0, 240, 255, 0.05)',
                      borderColor: 'rgba(0, 240, 255, 0.35)'
                    }}
                    title="As Estações Espaciais Principais (ISS e Tiangong) permanecem fixas e operacionais no cinturão do simulador"
                  >
                    <div className="legend-info">
                      <span className="category-dot" style={{ backgroundColor: CORES_CATEGORIAS[4], boxShadow: '0 0 8px #00f0ff' }}></span>
                      <span className="category-name" style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>Estações Espaciais</span>
                    </div>
                    <span className="category-count" style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>
                      2 / 2
                    </span>
                  </div>
                </div>

                {/* Divisor Cibernético */}
                <div className="hud-cyber-divider" />

                {/* DISTRIBUIÇÃO POR REGIME ORBITAL (LEO / MEO / GEO / HEO) - BOTÕES INTERATIVOS */}
                <div className="legend-section regimes-section">
                  <div className="legend-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Distribuição por Camada</span>
                    {regimeAtivo && (
                      <span
                        onClick={() => handleAlternarRegime(regimeAtivo)}
                        style={{ fontSize: '8.5px', color: 'var(--neon-cyan)', cursor: 'pointer', textDecoration: 'underline' }}
                        title="Limpar filtro de camada"
                      >
                        LIMPAR FILTRO
                      </span>
                    )}
                  </div>

                  {/* LEO */}
                  <div
                    className={`regime-bar-item clickable ${regimeAtivo === 'LEO' ? 'active' : ''}`}
                    onClick={() => handleAlternarRegime('LEO')}
                    title="Isolar Órbita Baixa (LEO)"
                  >
                    <div className="regime-bar-info">
                      <span className="regime-tag leo-tag">LEO</span>
                      <span className="regime-name">Órbita Baixa (&lt; 2.000 km)</span>
                      <span className="regime-pct">
                        {loading && objetos.length === 0
                          ? "---"
                          : `${distribuicaoRegimes.leo.toLocaleString('pt-BR')} / ${(estatisticas?.distribuicao_regimes?.leo || estatisticas?.regimes?.leo || 8832).toLocaleString('pt-BR')}`}
                      </span>
                    </div>
                    <div className="regime-progress-track">
                      <div
                        className="regime-progress-fill leo-fill"
                        style={{ width: `${distribuicaoRegimes.total > 0 ? ((distribuicaoRegimes.leo / distribuicaoRegimes.total) * 100).toFixed(1) : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* MEO */}
                  <div
                    className={`regime-bar-item clickable ${regimeAtivo === 'MEO' ? 'active' : ''}`}
                    onClick={() => handleAlternarRegime('MEO')}
                    title="Isolar Órbita Média (MEO)"
                  >
                    <div className="regime-bar-info">
                      <span className="regime-tag meo-tag">MEO</span>
                      <span className="regime-name">Órbita Média (2.000 - 35.786 km)</span>
                      <span className="regime-pct">
                        {loading && objetos.length === 0
                          ? "---"
                          : `${distribuicaoRegimes.meo.toLocaleString('pt-BR')} / ${(estatisticas?.distribuicao_regimes?.meo || estatisticas?.regimes?.meo || 290).toLocaleString('pt-BR')}`}
                      </span>
                    </div>
                    <div className="regime-progress-track">
                      <div
                        className="regime-progress-fill meo-fill"
                        style={{ width: `${distribuicaoRegimes.total > 0 ? ((distribuicaoRegimes.meo / distribuicaoRegimes.total) * 100).toFixed(1) : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* GEO */}
                  <div
                    className={`regime-bar-item clickable ${regimeAtivo === 'GEO' ? 'active' : ''}`}
                    onClick={() => handleAlternarRegime('GEO')}
                    title="Isolar Órbita Geoestacionária (GEO)"
                  >
                    <div className="regime-bar-info">
                      <span className="regime-tag geo-tag">GEO</span>
                      <span className="regime-name">Geoestacionária (~35.786 km)</span>
                      <span className="regime-pct">
                        {loading && objetos.length === 0
                          ? "---"
                          : `${distribuicaoRegimes.geo.toLocaleString('pt-BR')} / ${(estatisticas?.distribuicao_regimes?.geo || estatisticas?.regimes?.geo || 1282).toLocaleString('pt-BR')}`}
                      </span>
                    </div>
                    <div className="regime-progress-track">
                      <div
                        className="regime-progress-fill geo-fill"
                        style={{ width: `${distribuicaoRegimes.total > 0 ? ((distribuicaoRegimes.geo / distribuicaoRegimes.total) * 100).toFixed(1) : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* HEO */}
                  <div
                    className={`regime-bar-item clickable ${regimeAtivo === 'HEO' ? 'active' : ''}`}
                    onClick={() => handleAlternarRegime('HEO')}
                    title="Isolar Órbita Altamente Elíptica (HEO)"
                  >
                    <div className="regime-bar-info">
                      <span className="regime-tag heo-tag">HEO</span>
                      <span className="regime-name">Altamente Elíptica</span>
                      <span className="regime-pct">
                        {loading && objetos.length === 0
                          ? "---"
                          : `${distribuicaoRegimes.heo.toLocaleString('pt-BR')} / ${(estatisticas?.distribuicao_regimes?.heo || estatisticas?.regimes?.heo || 1132).toLocaleString('pt-BR')}`}
                      </span>
                    </div>
                    <div className="regime-progress-track">
                      <div
                        className="regime-progress-fill heo-fill"
                        style={{ width: `${distribuicaoRegimes.total > 0 ? ((distribuicaoRegimes.heo / distribuicaoRegimes.total) * 100).toFixed(1) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* PAINEL DIREITO: FICHA FACTUAL E TELEMETRIA DIDÁTICA */}
            <aside className={`hud-panel right-panel ${!painelDireitoAberto ? 'collapsed' : ''} ${!satSelecionado ? 'empty-state' : ''}`}>
              <div className="panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <button
                    type="button"
                    className="hud-toggle-btn-inline"
                    onClick={() => handleAlternarPainelDireito(false)}
                    title="Recolher Painel"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 className="panel-title">Diagnóstico Orbital</h2>
                    <Compass size={16} className="panel-header-icon" />
                  </div>
                </div>
                {satSelecionado && (
                  <button
                    type="button"
                    className="hud-toggle-btn-inline"
                    onClick={() => handleDesfocarCamera(true)}
                    title="Desfocar e resetar câmera"
                    style={{ marginLeft: 'auto' }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="panel-content">
                {satSelecionado ? (
                  <div className="satellite-fiche">

                    {/* Alerta de Objeto Fora de Órbita / Reentrada Atmosférica */}
                    {satSelecionado.data_decaimento && (
                      <div className="decay-warning-card">
                        <AlertTriangle size={16} color="#ff0055" style={{ flexShrink: 0 }} />
                        <div>
                          <div className="decay-warning-badge">OBJETO FORA DE ÓRBITA</div>
                          <div className="decay-warning-text">
                            Reentrou na atmosfera terrestre em <strong>{formatarDataBrasileira(satSelecionado.data_decaimento)}</strong>. Removido da telemetria de voo 3D.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fotografia Real da Missão (Renderizada com resiliência total a falhas) */}
                    {satSelecionado.missao?.imagem_url && (
                      <FicheImage
                        key={`fiche-img-${satSelecionado.norad_id}`}
                        src={satSelecionado.missao.imagem_url}
                        alt={satSelecionado.nome}
                      />
                    )}

                    {/* DIAGNÓSTICO ORBITAL EM 3 ABAS ENXUTAS */}
                    <SatelliteDetailTabs
                      satSelecionado={satSelecionado}
                      parametrosOrbitaisSat={parametrosOrbitaisSat}
                      fichaFactual={fichaFactual}
                      formatarDataBrasileira={formatarDataBrasileira}
                      CORES_CATEGORIAS={CORES_CATEGORIAS}
                      modulosEstacao={modulosEstacao}
                      carregandoModulos={carregandoModulos}
                      handleSelecionarSat={handleSelecionarSat}
                      onFocarObjeto={() => centralizarCameraNoObjeto(satSelecionado)}
                    />

                  </div>
                ) : (
                  <div className="empty-details">
                    <Globe size={48} className="empty-details-icon" style={{ color: 'var(--neon-cyan)' }} />
                    <p>
                      Aguardando seleção de objeto orbital...
                      <span className="cursor-blink"></span>
                    </p>
                  </div>
                )}
              </div>
            </aside>

          </div>

          {/* GATILHOS FLUTUANTES PARA REABRIR PAINÉIS */}
          {!painelEsquerdoAberto && (
            <button
              type="button"
              className="hud-trigger-float-btn left-trigger"
              onClick={() => handleAlternarPainelEsquerdo(true)}
              title="Abrir Métricas de Órbita"
            >
              <Database size={16} />
              <ChevronRight size={14} className="trigger-arrow" />
            </button>
          )}

          {!painelDireitoAberto && (
            <button
              type="button"
              className="hud-trigger-float-btn right-trigger"
              onClick={() => handleAlternarPainelDireito(true)}
              title="Abrir Diagnóstico do Satélite"
            >
              <Compass size={16} />
              <ChevronLeft size={14} className="trigger-arrow" />
            </button>
          )}
            </>
          )}

          {/* MODAL CONSOLE: GUIA RÁPIDO DO OPERADOR (TUTORIAL DE ENTRADA) */}
          {modalTutorialAberto && (
            <div
              className={`hud-modal-backdrop ${modalFechando ? 'modal-closing' : 'modal-opening'}`}
              onClick={handleFecharModais}
            >
              <div className={`hud-modal-card tutorial-modal-card ${modalFechando ? 'card-closing' : 'card-opening'}`} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Compass size={20} style={{ color: 'var(--neon-cyan)' }} />
                    <h3>GUIA RÁPIDO DO OPERADOR</h3>
                  </div>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={handleFecharModais}
                    title="Fechar Guia"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body-scrollable tutorial-body">
                  <p className="tutorial-intro-lead">
                    Bem-vindo ao <strong>OrbitalED</strong>. Conheça os comandos principais para explorar, rastrear e analisar os objetos ao redor da Terra em tempo real:
                  </p>

                  <div className="tutorial-steps-grid">
                    {/* 1. Navegação 3D */}
                    <div className="tutorial-step-card">
                      <div className="step-icon-box">
                        <Globe size={22} className="step-icon cyan" />
                      </div>
                      <h4 className="step-title">1. Navegação 3D</h4>
                      <div className="step-points-list compact-list">
                        <div className="step-point-item">
                          <kbd className="tutorial-kbd cyan">Clique + Arrastar</kbd>
                          <span className="step-point-text">Girar o globo</span>
                        </div>
                        <div className="step-point-item">
                          <kbd className="tutorial-kbd cyan">Scroll do Mouse</kbd>
                          <span className="step-point-text">Zoom in / out</span>
                        </div>
                        <div className="step-point-item">
                          <kbd className="tutorial-kbd cyan">Passar o Cursor</kbd>
                          <span className="step-point-text">Revelar traçado orbital</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Rastreamento */}
                    <div className="tutorial-step-card">
                      <div className="step-icon-box">
                        <Crosshair size={22} className="step-icon green" />
                      </div>
                      <h4 className="step-title">2. Rastreamento</h4>
                      <div className="step-points-list">
                        <div className="step-point-item">
                          <kbd className="tutorial-kbd green">Clique no Objeto</kbd>
                          <span className="step-point-text">Fixa câmera e abre telemetria</span>
                        </div>
                        <div className="step-point-item">
                          <kbd className="tutorial-kbd green">Painel Direito</kbd>
                          <span className="step-point-text">Dossiê com país, altitude, velocidade e missão</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Busca e Filtros */}
                    <div className="tutorial-step-card">
                      <div className="step-icon-box">
                        <Search size={22} className="step-icon amber" />
                      </div>
                      <h4 className="step-title">3. Busca e Filtros</h4>
                      <div className="step-points-list">
                        <div className="step-point-item">
                          <kbd className="tutorial-kbd amber">Pesquisa Direta</kbd>
                          <span className="step-point-text">Localize satélites ou estações por nome ou NORAD</span>
                        </div>
                        <div className="step-point-item">
                          <kbd className="tutorial-kbd amber">Painel Esquerdo</kbd>
                          <span className="step-point-text">Filtragem por tipo de objeto</span>
                        </div>
                      </div>
                    </div>

                    {/* 4. Módulos Educativos */}
                    <div className="tutorial-step-card">
                      <div className="step-icon-box">
                        <BookOpen size={22} className="step-icon purple" />
                      </div>
                      <h4 className="step-title">4. Módulos Educativos</h4>
                      <div className="step-points-list">
                        <div className="step-point-item">
                          <kbd className="tutorial-kbd purple">Sustentabilidade</kbd>
                          <span className="step-point-text">Riscos de colisão e impacto do lixo em órbita</span>
                        </div>
                        <div className="step-point-item">
                          <kbd className="tutorial-kbd purple">Glossário Didático</kbd>
                          <span className="step-point-text">Explicações simplificadas sobre a física espacial</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="tutorial-footer-hint">
                    <span className="tutorial-hint-text">
                      * Você pode reabrir este guia quando quiser clicando em <strong>GUIA</strong> na barra superior.
                    </span>
                    <button
                      type="button"
                      className="tutorial-ack-btn"
                      onClick={handleFecharModais}
                    >
                      ENTENDIDO
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL CONSOLE: GLOSSÁRIO DIDÁTICO */}
          {modalGlossarioAberto && (
            <div
              className={`hud-modal-backdrop ${modalFechando ? 'modal-closing' : 'modal-opening'}`}
              onClick={handleFecharModais}
            >
              <div className={`hud-modal-card ${modalFechando ? 'card-closing' : 'card-opening'}`} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BookOpen size={20} style={{ color: 'var(--neon-cyan)' }} />
                    <h3>GLOSSÁRIO TÉCNICO DE ASTRODINÂMICA</h3>
                  </div>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={handleFecharModais}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body-scrollable">
                  {GLOSSARIO_ORBITAL.map((categoria, idx) => (
                    <div key={idx} className="modal-glossary-section">
                      <h4 className="modal-section-title">{categoria.categoria}</h4>
                      <div className="modal-glossary-grid">
                        {categoria.itens.map((item, itemIdx) => (
                          <div key={itemIdx} className="modal-glossary-item">
                            <div className="modal-glossary-header">
                              <span className="modal-glossary-term">{item.termo}</span>
                              {item.titulo && <span className="modal-glossary-sub">{item.titulo}</span>}
                            </div>
                            <p className="modal-glossary-def">{item.definicao}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODAL DO SIMULADOR DE CENÁRIOS "E SE...?" (PASSO 3.2) */}
          <ErrorBoundary nomeModulo="Simulador de Cenários 2050">
            <ScenarioSimulatorModal
              aberto={modalCenariosAberto}
              onFechar={handleFecharModais}
              onTocarSom={(tipo) => {
                if (tipo === 'iniciar') tocarEfeitoSonoro(somIniciar, 0.65);
                else if (tipo === 'slide') tocarEfeitoSonoro(somTrocaSlide, 0.55);
              }}
            />
          </ErrorBoundary>

          {/* MISSÕES TÁTICAS PERIÓDICAS NO CENTRO INFERIOR (MODO LIVRE) */}
          <OrbitalMissionHub
            ativo={!modoOrbitalAtivo && telaAtiva === 'simulador'}
            satSelecionado={satSelecionado}
            parametrosOrbitaisSat={parametrosOrbitaisSat}
            pausado={modalTutorialAberto || modalGlossarioAberto || modalCenariosAberto}
            onInvestigarObjeto={handleInvestigarObjeto}
            onAplicarFiltroCategorias={handleAplicarFiltroCategorias}
            onLocalizarGeo={handleLocalizarGeo}
            onTocarSom={(tipo) => {
              if (tipo === 'sucesso' || tipo === 'iniciar') tocarEfeitoSonoro(somIniciar, 0.7);
              else if (tipo === 'falha') tocarEfeitoSonoro(somFadeOut, 0.65);
              else if (tipo === 'slide') tocarEfeitoSonoro(somTrocaSlide, 0.5);
            }}
          />

          {/* ELEMENTO EXCLUSIVO DO MODO ORBITAL (CONTAINER FLEX-BOX BALANCADO OPOSTO AO PLANETA) */}
          {modoOrbitalAtivo && telaAtiva === 'simulador' && (
            <div className="orbital-mode-stage-container">
              <div className="orbital-mode-stage-left" />
              <div className="orbital-mode-stage-right">
                <OrbitalModePanel
                  camadaSelecionadaId={camadaOrbitalAtiva}
                  pinoSelecionadoId={pinoOrbitalAtivo}
                  onSelecionarCamada={handleSelecionarCamadaOrbital}
                  onSelecionarPino={handleSelecionarPinoOrbital}
                  onFechar={handleResetarModoOrbital}
                  onTocarSom={(tipo) => {
                    if (tipo === 'slide') tocarEfeitoSonoro(somTrocaSlide, 0.45);
                    else if (tipo === 'iniciar') tocarEfeitoSonoro(somIniciar, 0.7);
                    else if (tipo === 'fechar') tocarEfeitoSonoro(somFadeOut, 0.5);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOOLTIP HUD FLUTUANTE VIA DOM DIRETO (60 FPS) */}
      <div id="hud-tooltip" className="hud-tooltip" style={{ display: 'none', position: 'absolute', pointerEvents: 'none', zIndex: 9999 }}></div>
    </div>
  );
}

export default App;
