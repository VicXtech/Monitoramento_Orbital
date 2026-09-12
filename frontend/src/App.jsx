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
  Volume2,
  VolumeOff,
  Home
} from 'lucide-react';
import * as satellite from 'satellite.js';
import './App.css';
import { calcularParametrosOrbitais, gerarPontosOrbita, classificarRegimeOrbital } from './utils/orbitalPhysics';
import { obterFichaFactual, GLOSSARIO_ORBITAL } from './data/orbitalEncyclopedia';

// Efeitos sonoros oficiais do sistema
import somAbreSlide from './assets/sons/abre-slide.mp3';
import somTrocaSlide from './assets/sons/troca-slide.mp3';
import somIniciar from './assets/sons/Iniciar.mp3';
import somFadeOut from './assets/sons/fade-out.MP3';
import somFadeIn from './assets/sons/fade-in.MP3';
import somConsoleButtons from './assets/sons/console-buttons.mp3';
import somVoltar from './assets/sons/voltar.mp3';
import somTemaPrincipal from './assets/sons/main-theme.mp3';

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

// Dados e textos oficiais da seção SOBRE A PLATAFORMA
const SOBRE_PLATAFORMA_SECOES = [
  {
    id: 'missao',
    title: 'MISSÃO',
    text: 'O OrbitalED foi criado para desmistificar a mecânica celeste para estudantes, professores e entusiastas. A plataforma substitui coordenadas numéricas abstratas por representações espaciais em 3D intuitivas, tornando o aprendizado visual e conscientizando sobre o tráfego de satélites e a sustentabilidade orbital.'
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
  const entitiesRef = useRef(new Map());
  const entidadeFocadaRef = useRef(null);
  const orbitaEntidadeRef = useRef(null);
  const satHoverIdRef = useRef(null);
  const satSelecionadoRef = useRef(null);
  const cameraInicialRef = useRef(null);

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
  const [modalSustentabilidadeAberto, setModalSustentabilidadeAberto] = useState(false);
  const [modalGlossarioAberto, setModalGlossarioAberto] = useState(false);
  const [modalTutorialAberto, setModalTutorialAberto] = useState(false);
  const [modalFechando, setModalFechando] = useState(false);

  const handleFecharModais = () => {
    setModalFechando(true);
    setTimeout(() => {
      setModalSustentabilidadeAberto(false);
      setModalGlossarioAberto(false);
      setModalTutorialAberto(false);
      setModalFechando(false);
    }, 220);
  };

  const handleAbrirSustentabilidade = () => {
    tocarEfeitoSonoro(somConsoleButtons, 0.65);
    setModalFechando(false);
    setModalGlossarioAberto(false);
    setModalTutorialAberto(false);
    setModalSustentabilidadeAberto(true);
  };

  const handleAbrirGlossario = () => {
    tocarEfeitoSonoro(somConsoleButtons, 0.65);
    setModalFechando(false);
    setModalSustentabilidadeAberto(false);
    setModalTutorialAberto(false);
    setModalGlossarioAberto(true);
  };

  const handleAbrirTutorial = () => {
    tocarEfeitoSonoro(somConsoleButtons, 0.65);
    setModalFechando(false);
    setModalSustentabilidadeAberto(false);
    setModalGlossarioAberto(false);
    setModalTutorialAberto(true);
  };

  const handleAlternarPainelEsquerdo = (abrir) => {
    tocarEfeitoSonoro(somFadeIn, 0.65);
    setPainelEsquerdoAberto(abrir);
    if (abrir && window.innerWidth < 950) {
      setPainelDireitoAberto(false);
    }
  };

  const handleAlternarPainelDireito = (abrir) => {
    tocarEfeitoSonoro(somFadeIn, 0.65);
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

  // Filtros de Categoria do Radar (4 categorias clicáveis, Estações Espaciais são 100% permanentes)
  const [categoriasAtivas, setCategoriasAtivas] = useState({
    1: true, // Satélite Ativo
    2: true, // Satélite Inativo
    5: true, // Corpo de Foguete
    3: true  // Detrito Espacial
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
        const ativas = Object.entries(categoriasAtivas)
          .filter(([, ativa]) => ativa)
          .map(([k]) => Number(k));

        // Carga padrão calibrada para 1.000 objetos (+ 2 estações permanentes = 1.002 objetos)
        let url = `${API_URL}/api/objetos?limit=1000&seed=${amostraSeed || Date.now()}`;
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
  }, [categoriasAtivas, amostraSeed]);

  const handleRecarregarAmostra = () => {
    if (recarregandoAmostra || loading) return;
    tocarEfeitoSonoro(somConsoleButtons, 0.65);
    setRecarregandoAmostra(true);
    setAmostraSeed(Date.now());
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

  // FUNÇÕES AUXILIARES DE RENDERIZAÇÃO DA TRILHA ORBITAL EM CINZA
  const desenharTrilhaOrbital = (viewerInstance, tle) => {
    if (!viewerInstance || !tle || !tle.linha1 || !tle.linha2 || telaAtivaRef.current !== 'simulador') return;

    try {
      // Remover órbita anterior se existente
      if (orbitaEntidadeRef.current) {
        viewerInstance.entities.remove(orbitaEntidadeRef.current);
        orbitaEntidadeRef.current = null;
      }

      const pontos = gerarPontosOrbita(tle.linha1, tle.linha2, new Date(), 120);
      if (!pontos || pontos.length < 10) return;

      const entidadeOrbita = viewerInstance.entities.add({
        id: 'trilha-orbital-dinamica',
        polyline: {
          positions: pontos,
          width: 2.0,
          material: new window.Cesium.Color(0.82, 0.86, 0.92, 0.75), // Cinza prateado translúcido
          arcType: window.Cesium.ArcType.NONE,
          loop: true
        }
      });

      orbitaEntidadeRef.current = entidadeOrbita;
    } catch (e) {
      console.warn("Falha ao traçar polilinha da órbita:", e);
    }
  };

  const limparTrilhaOrbital = (viewerInstance) => {
    if (!viewerInstance) return;
    try {
      if (orbitaEntidadeRef.current) {
        viewerInstance.entities.remove(orbitaEntidadeRef.current);
        orbitaEntidadeRef.current = null;
      }
    } catch {
      // Ignorar exceções de remoção assíncrona
    }
  };

  // 4. SELEÇÃO E CÁLCULO FÍSICO DO SATÉLITE
  const handleSelecionarSat = (sat, reproduzirSom = true) => {
    if (reproduzirSom) {
      tocarEfeitoSonoro(somFadeIn, 0.65);
    }
    satSelecionadoRef.current = sat;
    setSatSelecionado(sat);
    setPainelDireitoAberto(true);

    if (window.innerWidth < 950) {
      setPainelEsquerdoAberto(false);
    }

    if (sat && sat.ultimo_tle) {
      const params = calcularParametrosOrbitais(sat.ultimo_tle.linha1, sat.ultimo_tle.linha2);
      setParametrosOrbitaisSat(params);
      const v = viewerRef.current;
      if (v) {
        desenharTrilhaOrbital(v, sat.ultimo_tle);
      }
    } else {
      setParametrosOrbitaisSat(null);
    }
  };

  const handleDesfocarCamera = (reproduzirSom = true) => {
    const v = viewerRef.current;
    if (!v) return;

    if (reproduzirSom && satSelecionadoRef.current) {
      tocarEfeitoSonoro(somFadeOut, 0.65);
    }

    entidadeFocadaRef.current = null;
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
      pitch: window.Cesium.Math.toRadians(POSICAO_ORBITAL_PADRAO.pitch),
      roll: POSICAO_ORBITAL_PADRAO.roll
    };

    viewerInstance.camera.setView({
      destination: destinoInicial,
      orientation: orientacaoInicial
    });

    cameraInicialRef.current = {
      destination: destinoInicial,
      orientation: orientacaoInicial
    };

    // Manipulador de Clique no Globo (Seleção)
    const clickHandler = new window.Cesium.ScreenSpaceEventHandler(viewerInstance.scene.canvas);
    clickHandler.setInputAction((click) => {
      if (telaAtivaRef.current !== 'simulador') return;
      const pickedObject = viewerInstance.scene.pick(click.position);
      if (window.Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.properties) {
        const entity = pickedObject.id;
        const satData = entity.properties.getValue(window.Cesium.JulianDate.now());
        satSelecionadoRef.current = satData;
        handleSelecionarSat(satData);

        // Traçar e fixar a órbita no Cesium
        if (satData && satData.ultimo_tle) {
          desenharTrilhaOrbital(viewerInstance, satData.ultimo_tle);
        }

        // Focar a câmera
        const rangeDist = 3500000.0; // 3.500 km
        entidadeFocadaRef.current = null;
        viewerInstance.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
        viewerInstance.trackedEntity = undefined;

        viewerInstance.flyTo(entity, {
          duration: 1.5,
          offset: new window.Cesium.HeadingPitchRange(
            window.Cesium.Math.toRadians(0.0),
            window.Cesium.Math.toRadians(-72.0),
            rangeDist
          )
        }).then((completed) => {
          if (completed && viewerInstance && !viewerInstance.isDestroyed()) {
            const time = viewerInstance.clock.currentTime;
            const position = entity.position.getValue(time);
            if (position) {
              const transform = window.Cesium.Transforms.eastNorthUpToFixedFrame(position);
              const initialOffset = new window.Cesium.HeadingPitchRange(
                window.Cesium.Math.toRadians(0.0),
                window.Cesium.Math.toRadians(-72.0),
                rangeDist
              );
              viewerInstance.camera.lookAtTransform(transform, initialOffset);
              entidadeFocadaRef.current = entity;
            }
          }
        });
      } else {
        // Clicar no espaço vazio deseleciona
        if (satSelecionadoRef.current) {
          tocarEfeitoSonoro(somFadeOut, 0.65);
        }
        satSelecionadoRef.current = null;
        setSatSelecionado(null);
        setParametrosOrbitaisSat(null);
        limparTrilhaOrbital(viewerInstance);

        // Em telas compactas, fecha o painel de telemetria e restaura o painel de dados
        if (window.innerWidth < 950) {
          setPainelDireitoAberto(false);
          setPainelEsquerdoAberto(true);
        }

        if (viewerInstance) {
          entidadeFocadaRef.current = null;
          viewerInstance.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
          viewerInstance.trackedEntity = undefined;

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

          viewerInstance.camera.flyTo({
            destination: camTarget.destination.clone(),
            orientation: {
              heading: camTarget.orientation.heading,
              pitch: camTarget.orientation.pitch,
              roll: camTarget.orientation.roll
            },
            duration: 1.5
          });
        }
      }
    }, window.Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Manipulador de Hover do Mouse (Gera trilha orbital dinamicamente sob o cursor)
    let lastHoveredEntity = null;
    const hoverHandler = new window.Cesium.ScreenSpaceEventHandler(viewerInstance.scene.canvas);
    const tooltipEl = document.getElementById('hud-tooltip');

    hoverHandler.setInputAction((movement) => {
      if (telaAtivaRef.current !== 'simulador') {
        viewerInstance.scene.canvas.style.cursor = 'default';
        if (tooltipEl) tooltipEl.style.display = 'none';
        return;
      }
      const pickedObject = viewerInstance.scene.pick(movement.endPosition);

      if (window.Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.properties) {
        const entity = pickedObject.id;
        const satData = entity.properties.getValue(window.Cesium.JulianDate.now());
        viewerInstance.scene.canvas.style.cursor = 'pointer';

        if (lastHoveredEntity !== entity) {
          // Restaurar estilo anterior
          if (lastHoveredEntity) {
            try {
              const lastSat = lastHoveredEntity.properties.getValue(window.Cesium.JulianDate.now());
              const catId = Number(lastSat.categoria_id);
              lastHoveredEntity.point.pixelSize = catId === 4 ? 10 : 7;
              lastHoveredEntity.point.outlineColor = window.Cesium.Color.BLACK;
              lastHoveredEntity.point.outlineWidth = 1.5;
            } catch {
              // Objeto fora de visibilidade
            }
          }

          lastHoveredEntity = entity;
          satHoverIdRef.current = satData.norad_id;

          // Realçar ponto sob hover
          try {
            const currentSize = entity.point.pixelSize.getValue();
            entity.point.pixelSize = currentSize + 4;
            entity.point.outlineColor = window.Cesium.Color.WHITE;
            entity.point.outlineWidth = 2.5;
          } catch {
            // Frame ignorado
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
            const lastSat = lastHoveredEntity.properties.getValue(window.Cesium.JulianDate.now());
            const catId = Number(lastSat.categoria_id);
            lastHoveredEntity.point.pixelSize = catId === 4 ? 10 : 7;
            lastHoveredEntity.point.outlineColor = window.Cesium.Color.BLACK;
            lastHoveredEntity.point.outlineWidth = 1.5;
          } catch {
            // Frame ignorado
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
    const removerPreRender = viewerInstance.scene.preRender.addEventListener((scene, time) => {
      if (entidadeFocadaRef.current && viewerInstance && !viewerInstance.isDestroyed()) {
        try {
          const entity = entidadeFocadaRef.current;
          const position = entity.position.getValue(time);
          if (position) {
            const transform = window.Cesium.Transforms.eastNorthUpToFixedFrame(position);
            viewerInstance.camera.lookAtTransform(transform);
          }
        } catch {
          // Render loop silencioso
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

  // 5. PROPAGAÇÃO EM TEMPO REAL SGP4 E PLOTAGEM DAS 4 CATEGORIAS NO CESIUM
  useEffect(() => {
    if (!viewer || objetos.length === 0) return;

    const limparEntidades = () => {
      try {
        if (viewer && !viewer.isDestroyed() && viewer.entities) {
          entitiesRef.current.forEach((entity) => {
            try {
              viewer.entities.remove(entity);
            } catch {
              // Entidade desanexada
            }
          });
        }
      } catch {
        // Limpeza concluída
      }
      entitiesRef.current.clear();
    };

    limparEntidades();

    const satelitesFiltrados = objetos.filter(sat => {
      const catId = Number(sat.categoria_id);
      // Estações Espaciais Principais: apenas ISS e Tiangong permanecem renderizadas e fixas
      if (catId === 4) {
        return (sat.norad_id === '25544' || sat.norad_id === '48274') && Boolean(sat.ultimo_tle);
      }
      // Nunca renderiza módulos acoplados como satélites avulsos no radar
      if (sat.estacao_pai_norad) return false;

      const isAtiva = (catId in categoriasAtivas) && categoriasAtivas[catId];
      return isAtiva && Boolean(sat.ultimo_tle);
    });

    satelitesFiltrados.forEach(sat => {
      try {
        const catId = Number(sat.categoria_id);
        const corHex = CORES_CATEGORIAS[catId] || '#00ff66';

        if (viewer.entities.getById(sat.norad_id)) return;

        const entity = viewer.entities.add({
          id: sat.norad_id,
          name: sat.nome,
          show: telaAtivaRef.current === 'simulador',
          position: new window.Cesium.CallbackProperty((time, result) => {
            try {
              const tle = sat.ultimo_tle;
              if (!tle) return undefined;

              const dataAtual = window.Cesium.JulianDate.toDate(time);
              const gmst = satellite.gstime(dataAtual);

              const satrec = satellite.twoline2satrec(tle.linha1, tle.linha2);
              const posAndVel = satellite.propagate(satrec, dataAtual);
              const posEci = posAndVel.position;

              if (posEci) {
                const posGd = satellite.eciToGeodetic(posEci, gmst);
                let longitude = satellite.degreesLong(posGd.longitude);
                let latitude = satellite.degreesLat(posGd.latitude);
                let altitude = posGd.height * 1000;

                // Jitter determinístico para evitar sobreposição perfeita
                const idNum = parseInt(sat.norad_id, 10) || 0;
                const desvioRaio = 0.06;
                const angulo = idNum * 1.7;
                longitude += Math.cos(angulo) * desvioRaio;
                latitude += Math.sin(angulo) * desvioRaio;
                altitude += (idNum % 7) * 3000;

                return window.Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude, undefined, result);
              }
            } catch {
              // Posição orbital indisponível para o frame
            }
            return undefined;
          }, false),
          point: {
            pixelSize: catId === 4 ? 12 : catId === 5 ? 7 : catId === 2 ? 6 : catId === 3 ? 5 : 7,
            color: window.Cesium.Color.fromCssColorString(corHex),
            outlineColor: window.Cesium.Color.BLACK,
            outlineWidth: catId === 4 ? 2 : 1.5
          },
          properties: sat
        });

        entitiesRef.current.set(sat.norad_id, entity);
      } catch (err) {
        console.warn("Erro ao plotar satélite:", sat.nome, err);
      }
    });

    return () => limparEntidades();
  }, [objetos, categoriasAtivas, viewer]);

  // Sincroniza a visibilidade de todos os objetos orbitais com a tela ativa:
  // - Ocultos na tela principal (deixando apenas o globo terrestre puro no fundo)
  // - Visíveis apenas quando o simulador de monitoramento é acionado
  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || !viewer.entities) return;
    const mostrarObjetos = (telaAtiva === 'simulador');
    entitiesRef.current.forEach((entity) => {
      try {
        entity.show = mostrarObjetos;
      } catch {
        // Atualização de visibilidade
      }
    });
    if (!mostrarObjetos) {
      limparTrilhaOrbital(viewer);
      const tooltipEl = document.getElementById('hud-tooltip');
      if (tooltipEl) tooltipEl.style.display = 'none';
    }
  }, [telaAtiva, viewer]);


  const handleAlternarCategoria = (catId) => {
    setCategoriasAtivas(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const handleIniciarMonitoramento = () => {
    tocarEfeitoSonoro(somIniciar, 0.65);
    setTransicaoCyber('para-simulador');
    const v = viewerRef.current;
    if (v && window.Cesium) {
      entidadeFocadaRef.current = null;
      v.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
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
    setTimeout(() => {
      setTelaAtiva('simulador');
      setTransicaoCyber(null);
      setModalTutorialAberto(true);
    }, 600);
  };

  // Contadores dinâmicos de categorias para os dashboards e filtros
  const obterContadoresCategorias = () => {
    if (estatisticas && estatisticas.totais_oficiais) {
      return estatisticas.totais_oficiais;
    }
    return {
      ativos: 16503,
      inativos: 2782,
      foguetes: 2295,
      detritos: 12522,
      estacoes: 2,
      total: 34104
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
      leo: 5519,
      meo: 183,
      geo: 590,
      heo: 44
    };
  };

  // Contadores dinâmicos de objetos atualmente visíveis/plotados no console para cada categoria
  const contadoresVisiveisCategorias = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (!objetos || objetos.length === 0) return counts;

    objetos.forEach(sat => {
      const catId = Number(sat.categoria_id);
      if (sat.ultimo_tle) {
        if (catId === 4) {
          if (sat.norad_id === '25544' || sat.norad_id === '48274') {
            counts[4]++;
          }
        } else if (!sat.estacao_pai_norad && counts[catId] !== undefined) {
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

      if (categoriasAtivas[catId] && sat.ultimo_tle && sat.ultimo_tle.linha1 && sat.ultimo_tle.linha2) {
        const regime = classificarRegimeOrbital(sat.ultimo_tle.linha1, sat.ultimo_tle.linha2);
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
                            <span className="about-metric-val">~6.300</span>
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
                              <span className="tactical-table-footer-highlight">CENSO GLOBAL OFICIAL (35.000+ OBJETOS):</span> Dados consolidados via <strong>SATCAT Boxscore (CelesTrak / Space-Track / 18th Space Defense Squadron - US Space Force)</strong>. Representa a totalidade de objetos catalogados por radar em órbita terrestre.
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
                <span>Orbital</span>ED
              </h1>
              <div className="system-status">
                <span className="status-dot"></span>
                STATUS: RASTREIO SGP4 EM TEMPO REAL
              </div>
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
                  className={`hud-tool-btn ${modalSustentabilidadeAberto ? 'active' : ''}`}
                  onClick={handleAbrirSustentabilidade}
                  title="Monitor de Sustentabilidade Espacial"
                >
                  <ShieldAlert size={15} className="hud-tool-icon" />
                  <span>SUSTENTABILIDADE</span>
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

                <button
                  type="button"
                  className={`hud-tool-btn sound-tool-btn ${musicaMutada ? 'muted' : 'active'}`}
                  onClick={handleAlternarMusicaPrincipal}
                  title={musicaMutada ? "Desmutar música principal" : "Mutar música principal"}
                >
                  {musicaMutada ? (
                    <VolumeOff size={15} className="hud-tool-icon" />
                  ) : (
                    <Volume2 size={15} className="hud-tool-icon" />
                  )}
                  <span>{musicaMutada ? "MUDO" : "ÁUDIO"}</span>
                </button>
              </div>
            </div>

            {/* BUSCADOR DE SATÉLITES TÁTICO */}
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
          </header>

          {/* PAINÉIS LATERAIS FLUTUANTES (HUD) */}
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
                {/* Total no Radar com distinção Catalogado vs Propagado 3D */}
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '105px', flexShrink: 0, padding: '14px 16px', boxSizing: 'border-box' }}>
                  <div className="stat-label">Catálogo Orbital Monitorado</div>
                  <div className="stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '6px', fontSize: '30px', fontWeight: 700, color: '#ffffff', marginTop: '8px', lineHeight: 1 }}>
                    {loading ? "---" : (obterContadoresCategorias().total || 34104).toLocaleString('pt-BR')}
                    <span style={{ color: 'var(--neon-cyan)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.8px' }}>OBJETOS</span>
                  </div>
                  <div className="stat-sublabel" style={{ display: 'block', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(0, 240, 255, 0.15)', fontSize: '9.5px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    Amostragem ativa: <strong style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>{loading ? '...' : (objetos.length || 1002).toLocaleString('pt-BR')}</strong> no radar
                  </div>
                </div>

                {/* BOTÃO DE RECARREGAMENTO DE AMOSTRAGEM ORBITAL */}
                <div className="resample-section">
                  <button
                    type="button"
                    className={`resample-btn ${recarregandoAmostra ? 'loading' : ''}`}
                    onClick={handleRecarregarAmostra}
                    disabled={loading || recarregandoAmostra}
                    title="Sortear nova amostragem proporcional de 1.000 objetos"
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
                        : `${(contadoresVisiveisCategorias[5] || 0).toLocaleString('pt-BR')} / ${(obterContadoresCategorias().foguetes || 2295).toLocaleString('pt-BR')}`}
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

                {/* DISTRIBUIÇÃO POR REGIME ORBITAL (LEO / MEO / GEO / HEO) */}
                <div className="legend-section regimes-section">
                  <div className="legend-title">Distribuição por Camada Orbital</div>

                  {/* LEO */}
                  <div className="regime-bar-item">
                    <div className="regime-bar-info">
                      <span className="regime-tag leo-tag">LEO</span>
                      <span className="regime-name">Órbita Baixa (&lt; 2.000 km)</span>
                      <span
                        className="regime-pct"
                        title={distribuicaoRegimes.total > 0 ? `${distribuicaoRegimes.leo.toLocaleString('pt-BR')} objetos no console (${((distribuicaoRegimes.leo / distribuicaoRegimes.total) * 100).toFixed(1)}% do total visível)` : ''}
                      >
                        {loading && objetos.length === 0
                          ? "---"
                          : distribuicaoRegimes.leo.toLocaleString('pt-BR')}
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
                  <div className="regime-bar-item">
                    <div className="regime-bar-info">
                      <span className="regime-tag meo-tag">MEO</span>
                      <span className="regime-name">Órbita Média (2.000 - 35.786 km)</span>
                      <span
                        className="regime-pct"
                        title={distribuicaoRegimes.total > 0 ? `${distribuicaoRegimes.meo.toLocaleString('pt-BR')} objetos no console (${((distribuicaoRegimes.meo / distribuicaoRegimes.total) * 100).toFixed(1)}% do total visível)` : ''}
                      >
                        {loading && objetos.length === 0
                          ? "---"
                          : distribuicaoRegimes.meo.toLocaleString('pt-BR')}
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
                  <div className="regime-bar-item">
                    <div className="regime-bar-info">
                      <span className="regime-tag geo-tag">GEO</span>
                      <span className="regime-name">Geoestacionária (~35.786 km)</span>
                      <span
                        className="regime-pct"
                        title={distribuicaoRegimes.total > 0 ? `${distribuicaoRegimes.geo.toLocaleString('pt-BR')} objetos no console (${((distribuicaoRegimes.geo / distribuicaoRegimes.total) * 100).toFixed(1)}% do total visível)` : ''}
                      >
                        {loading && objetos.length === 0
                          ? "---"
                          : distribuicaoRegimes.geo.toLocaleString('pt-BR')}
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
                  <div className="regime-bar-item">
                    <div className="regime-bar-info">
                      <span className="regime-tag heo-tag">HEO</span>
                      <span className="regime-name">Altamente Elíptica (Órbita Alongada)</span>
                      <span
                        className="regime-pct"
                        title={distribuicaoRegimes.total > 0 ? `${distribuicaoRegimes.heo.toLocaleString('pt-BR')} objetos no console (${((distribuicaoRegimes.heo / distribuicaoRegimes.total) * 100).toFixed(1)}% do total visível)` : ''}
                      >
                        {loading && objetos.length === 0
                          ? "---"
                          : distribuicaoRegimes.heo.toLocaleString('pt-BR')}
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

              <div className="panel-content">
                {satSelecionado ? (
                  <div className="satellite-fiche">

                    {/* Cabeçalho da Ficha */}
                    <div className="fiche-header">
                      <h3 className="sat-title">{satSelecionado.nome}</h3>
                      <div className="sat-subtitle">NORAD CATALOG: #{satSelecionado.norad_id}</div>
                    </div>

                    {/* Fotografia Real da Missão (Wikimedia Commons / Wikidata) */}
                    {satSelecionado.missao?.imagem_url && (
                      <div className="fiche-image-container">
                        <img
                          src={satSelecionado.missao.imagem_url}
                          alt={satSelecionado.nome}
                          className="fiche-image"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div className="fiche-image-badge">Fotografia Oficial / Wikidata</div>
                      </div>
                    )}

                    {/* Badge da Categoria */}
                    <div className="mission-badge-container">
                      <div className="mission-badge" style={{
                        borderColor: CORES_CATEGORIAS[Number(satSelecionado.categoria_id)] || 'var(--neon-green)',
                        color: CORES_CATEGORIAS[Number(satSelecionado.categoria_id)] || 'var(--neon-green)',
                        backgroundColor: `${CORES_CATEGORIAS[Number(satSelecionado.categoria_id)] || '#00ff66'}15`
                      }}>
                        {satSelecionado.categoria?.nome || 'Objeto Orbital'}
                      </div>
                    </div>

                    {/* Grid de Metadados Básicos: [País] - [Operador] / [Lançamento] - [Massa] */}
                    <div className="fiche-grid">
                      <div className="grid-cell">
                        <span className="cell-label">País</span>
                        <span className="cell-value" title={satSelecionado.pais || "Internacional"}>
                          {satSelecionado.pais || "Internacional"}
                        </span>
                      </div>
                      <div className="grid-cell">
                        <span className="cell-label">Operador</span>
                        <span className="cell-value" title={satSelecionado.missao?.operador || satSelecionado.pais || "Agência Não Informada"}>
                          {satSelecionado.missao?.operador || satSelecionado.pais || "Não Informado"}
                        </span>
                      </div>
                      <div className="grid-cell">
                        <span className="cell-label">Lançamento</span>
                        <span className="cell-value">
                          {satSelecionado.data_lancamento
                            ? new Date(satSelecionado.data_lancamento).getFullYear()
                            : "Histórico"}
                        </span>
                      </div>
                      <div className="grid-cell">
                        <span className="cell-label">Massa</span>
                        <span className="cell-value">
                          {satSelecionado.missao?.massa_kg
                            ? `${Number(satSelecionado.missao.massa_kg).toLocaleString('pt-BR')} kg`
                            : (Number(satSelecionado.categoria_id) === 3 ? "Fragmento Irregular" : (Number(satSelecionado.categoria_id) === 5 ? "Estágio Inerte" : "Não Informada"))}
                        </span>
                      </div>
                    </div>

                    {/* ECOSSISTEMA & NAVES ACOPLADAS (Para ISS e Tiangong) */}
                    {(satSelecionado.norad_id === '25544' || satSelecionado.norad_id === '48274') && (
                      <div className="station-ecosystem-card">
                        <div className="station-ecosystem-header">
                          <div className="station-ecosystem-title">
                            <Cpu size={13} style={{ color: 'var(--neon-cyan)' }} />
                            <span>Ecossistema & Naves Acopladas</span>
                          </div>
                          <span className="station-ecosystem-count">
                            {carregandoModulos ? '...' : `${modulosEstacao.length} acoplados`}
                          </span>
                        </div>

                        {carregandoModulos ? (
                          <div style={{ color: 'var(--text-muted)', fontSize: '11px', padding: '8px' }}>Carregando telemetria dos módulos...</div>
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
                                <div className="module-desc">
                                  {mod.missao?.descricao || `Módulo operacional acoplado (#${mod.norad_id})`}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Nenhum módulo auxiliar conectado no momento.</div>
                        )}
                      </div>
                    )}

                    {/* MÓDULO DIDÁTICO: DINÂMICA ORBITAL */}
                    {parametrosOrbitaisSat && (
                      <div className="telemetry-dashboard-card">
                        <div className="telemetry-card-title">
                          <Activity size={14} className="telemetry-icon" />
                          <span>DINÂMICA ORBITAL</span>
                        </div>

                        <div className="telemetry-metrics-grid">
                          {/* Altitude Instantânea */}
                          <div className="telemetry-metric-box highlight-metric">
                            <div className="metric-box-top-row">
                              <span className="metric-box-label">ALTITUDE INSTANTÂNEA</span>
                              <span className="metric-box-tag">{parametrosOrbitaisSat.regimeCodigo}</span>
                            </div>
                            <span className="metric-box-val">
                              {parametrosOrbitaisSat.altitudeInstantaneaKm.toLocaleString('pt-BR')} km
                            </span>
                          </div>

                          {/* Velocidade Orbital */}
                          <div className="telemetry-metric-box">
                            <span className="metric-box-label">VELOCIDADE ORBITAL</span>
                            <span className="metric-box-val">
                              {parametrosOrbitaisSat.velocidadeKmH.toLocaleString('pt-BR')} km/h
                            </span>
                            <span className="metric-box-sub">({parametrosOrbitaisSat.velocidadeKmS} km/s)</span>
                          </div>

                          {/* Apogeu / Perigeu */}
                          <div className="telemetry-metric-box">
                            <span className="metric-box-label">APOGEU / PERIGEU</span>
                            <span className="metric-box-val compact-val">
                              {parametrosOrbitaisSat.apogeuKm.toLocaleString('pt-BR')} / {parametrosOrbitaisSat.perigeuKm.toLocaleString('pt-BR')} km
                            </span>
                            <span className="metric-box-sub">
                              {parametrosOrbitaisSat.excentricidade < 0.01 ? "Órbita Circular" : "Órbita Elíptica"}
                            </span>
                          </div>

                          {/* Período Orbital */}
                          <div className="telemetry-metric-box">
                            <span className="metric-box-label">VOLTA COMPLETA</span>
                            <span className="metric-box-val">
                              {parametrosOrbitaisSat.periodoMinutos} min
                            </span>
                            <span className="metric-box-sub">{parametrosOrbitaisSat.voltasPorDia} voltas / dia</span>
                          </div>
                        </div>

                        {/* Classificação da Rota */}
                        <div className="telemetry-detail-row">
                          <span className="detail-row-title">
                            CLASSIFICAÇÃO DA ROTA: {parametrosOrbitaisSat.classeInclinacao} — Inclinação: {parametrosOrbitaisSat.inclinacaoGraus.toFixed(1)}°
                          </span>
                          <p className="detail-row-desc">{parametrosOrbitaisSat.descricaoInclinacao}</p>
                        </div>

                        {/* Vida Útil & Sustentabilidade */}
                        <div className="telemetry-detail-row environmental-row">
                          <span className="detail-row-title">VIDA ÚTIL & SUSTENTABILIDADE</span>
                          <p className="detail-row-desc">
                            Permanência estimada: <strong>{parametrosOrbitaisSat.estimativaVida}</strong>. {parametrosOrbitaisSat.impactoAmbientalReentrada}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* CONTEXTO DA MISSÃO & DIAGNÓSTICO FACTUAL */}
                    {(satSelecionado.missao?.descricao || (fichaFactual && fichaFactual.contextoMissao)) && (
                      <div className="mission-context-card">
                        <div className="mission-context-header">
                          <Target size={14} className="mission-context-icon" />
                          <span className="mission-context-title">Contexto da Missão & Diagnóstico</span>
                        </div>
                        <blockquote className="mission-context-quote">
                          "{satSelecionado.missao?.descricao || fichaFactual?.contextoMissao}"
                        </blockquote>
                        {satSelecionado.missao?.artigo_url && (
                          <a
                            href={satSelecionado.missao.artigo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="wikidata-source-link"
                          >
                            <span>Ver registro oficial na Wikidata ({satSelecionado.missao.wikidata_id || `NORAD #${satSelecionado.norad_id}`})</span>
                            <ChevronRight size={12} />
                          </a>
                        )}
                      </div>
                    )}

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

          {/* MODAL CONSOLE: MONITOR DE SUSTENTABILIDADE ESPACIAL */}
          {modalSustentabilidadeAberto && (
            <div
              className={`hud-modal-backdrop ${modalFechando ? 'modal-closing' : 'modal-opening'}`}
              onClick={handleFecharModais}
            >
              <div className={`hud-modal-card sustainability-modal-card ${modalFechando ? 'card-closing' : 'card-opening'}`} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldAlert size={20} style={{ color: 'var(--neon-red)' }} />
                    <h3>MONITOR DE SUSTENTABILIDADE ORBITAL & RISCO PLANETÁRIO</h3>
                  </div>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={handleFecharModais}
                    title="Fechar Monitor"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body-scrollable sustainability-modal-body">
                  <p className="sustainability-intro-lead">
                    Avaliação científica de impacto ambiental orbital baseada em dados da <strong>NASA ODPO</strong> e <strong>ESA</strong>. Monitore os fatores críticos de perturbação antropogênica no espaço circunsterrestre:
                  </p>

                  <div className="sustainability-pillars-grid">
                    {/* CARD 1: RISCO DE COLISÃO */}
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

                    {/* CARD 2: QUEDA NA ATMOSFERA */}
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

                    {/* CARD 3: INTERFERÊNCIA ELETROMAGNÉTICA */}
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

                    {/* CARD 4: DANOS NA CAMADA DE OZÔNIO */}
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

                  <div className="sustainability-footer-note">
                    <span className="sustainability-note-text">
                      * Dados compilados de modelos científicos da <strong>NASA Orbital Debris Program Office</strong>, <strong>ESA Space Debris Office</strong> e literatura peer-reviewed.
                    </span>
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

        </div>
      )}

      {/* TOOLTIP HUD FLUTUANTE VIA DOM DIRETO (60 FPS) */}
      <div id="hud-tooltip" className="hud-tooltip" style={{ display: 'none', position: 'absolute', pointerEvents: 'none', zIndex: 9999 }}></div>
    </div>
  );
}

export default App;
