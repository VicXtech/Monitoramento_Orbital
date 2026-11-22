export const PERFIS_GRAFICOS = {
  alto: {
    nivel: 'alto',
    maxResolutionScale: 1.5,
    msaaSamples: 4,
    maximumScreenSpaceError: 2.5,
    tileCacheSize: 200,
    segmentosTrilha: 180,
    intervaloWorkerTempoRealMs: 1000,
    fatorBackpressureWorker: 2.2,
    reduzirBlurCss: false
  },
  equilibrado: {
    nivel: 'equilibrado',
    maxResolutionScale: 1.15,
    msaaSamples: 2,
    maximumScreenSpaceError: 3.5,
    tileCacheSize: 120,
    segmentosTrilha: 180,
    intervaloWorkerTempoRealMs: 1000,
    fatorBackpressureWorker: 2.5,
    reduzirBlurCss: false
  },
  eco: {
    nivel: 'eco',
    maxResolutionScale: 1.0,
    msaaSamples: 1,
    maximumScreenSpaceError: 4.0,
    tileCacheSize: 80,
    segmentosTrilha: 120,
    intervaloWorkerTempoRealMs: 1200,
    fatorBackpressureWorker: 3.0,
    reduzirBlurCss: true
  }
};

const REGEX_GPU_SOFTWARE = /swiftshader|llvmpipe|software|microsoft basic render|mesa offscreen|virtualbox|vmware/i;
const REGEX_GPU_ENTRADA = /intel.*(hd graphics [2345]\d{2}|uhd graphics 6\d{2}|gma)|mali-4|mali-t|adreno \(tm\) [2345]\d{2}|powervr|apple a[789]\b|apple a1[01]\b/i;

// Retorna copia imutavel de um perfil grafico
export function obterPerfilPorNivel(nivel) {
  const base = PERFIS_GRAFICOS[nivel] || PERFIS_GRAFICOS.equilibrado;
  return { ...base };
}

// Detecta o perfil inicial a partir de CPU, RAM e tela
export function detectarPerfilInicial(env = null) {
  const nav = env?.navigator ?? (typeof navigator !== 'undefined' ? navigator : {});
  const win = env?.window ?? (typeof window !== 'undefined' ? window : null);

  const cores = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency > 0
    ? nav.hardwareConcurrency
    : 4;
  const memoriaGb = typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0
    ? nav.deviceMemory
    : null;

  const matchCoarse = typeof env?.isTouch === 'boolean'
    ? env.isTouch
    : Boolean(win && typeof win.matchMedia === 'function' && win.matchMedia('(pointer: coarse)').matches);
  const larguraViewport = typeof env?.innerWidth === 'number'
    ? env.innerWidth
    : (win && typeof win.innerWidth === 'number' ? win.innerWidth : 1280);
  const isMobile = matchCoarse || larguraViewport < 768;

  const prefersReducedMotion = typeof env?.prefersReducedMotion === 'boolean'
    ? env.prefersReducedMotion
    : Boolean(win && typeof win.matchMedia === 'function' && win.matchMedia('(prefers-reduced-motion: reduce)').matches);

  if (cores <= 2 || (memoriaGb !== null && memoriaGb <= 2)) {
    return obterPerfilPorNivel('eco');
  }

  if (isMobile || cores <= 4 || (memoriaGb !== null && memoriaGb <= 4) || prefersReducedMotion) {
    return obterPerfilPorNivel('equilibrado');
  }

  return obterPerfilPorNivel('alto');
}

// Refina o perfil usando o nome do renderizador WebGL
export function refinarPerfilComWebGL(perfilAtual, gl, rendererOverride = null) {
  let rendererStr = typeof rendererOverride === 'string' ? rendererOverride : '';

  if (!rendererStr && gl) {
    try {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        rendererStr = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '');
      }
    } catch {
      rendererStr = '';
    }
  }

  if (!rendererStr) {
    return perfilAtual || obterPerfilPorNivel('equilibrado');
  }

  if (REGEX_GPU_SOFTWARE.test(rendererStr)) {
    return obterPerfilPorNivel('eco');
  }

  if (REGEX_GPU_ENTRADA.test(rendererStr) && (!perfilAtual || perfilAtual.nivel === 'alto')) {
    return obterPerfilPorNivel('equilibrado');
  }

  return perfilAtual || obterPerfilPorNivel('equilibrado');
}

// Rebaixa o perfil grafico em um degrau
export function rebaixarPerfilGrafico(perfilAtual) {
  const nivelAtual = perfilAtual?.nivel || 'equilibrado';
  if (nivelAtual === 'alto') return obterPerfilPorNivel('equilibrado');
  if (nivelAtual === 'equilibrado') return obterPerfilPorNivel('eco');
  return null;
}

// Aplica parametros do perfil no Cesium e no container DOM
export function aplicarPerfilGrafico(viewer, perfil, containerEl = null) {
  if (!perfil) return;

  if (viewer && !viewer.isDestroyed()) {
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1.0) : 1.0;
    viewer.resolutionScale = Math.min(dpr, perfil.maxResolutionScale);

    if (viewer.scene) {
      if ('msaaSamples' in viewer.scene && viewer.scene.context?.webgl2) {
        viewer.scene.msaaSamples = perfil.msaaSamples;
      }
      if (viewer.scene.globe) {
        viewer.scene.globe.maximumScreenSpaceError = perfil.maximumScreenSpaceError;
        viewer.scene.globe.tileCacheSize = perfil.tileCacheSize;
      }
      if (viewer.scene.requestRenderMode && typeof viewer.scene.requestRender === 'function') {
        viewer.scene.requestRender();
      }
    }
  }

  const alvoDom = containerEl || (typeof document !== 'undefined' ? document.documentElement : null);
  if (alvoDom && alvoDom.classList) {
    alvoDom.classList.toggle('perf-eco', Boolean(perfil.reduzirBlurCss));
  }
}
