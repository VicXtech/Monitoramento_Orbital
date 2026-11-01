import { PINOS_HISTORICOS } from '../data/orbitalModeData';

export const RAIO_TERRA_METROS = 6371000;

// Cria geometria de anel plano equatorial
function criarGeometriaAnelPlano(raioInterno, raioExterno, segmentos = 96) {
  const numVertices = (segmentos + 1) * 2;
  const positions = new Float64Array(numVertices * 3);
  const indices = new Uint32Array(segmentos * 12);

  for (let i = 0; i <= segmentos; i++) {
    const angle = (i / segmentos) * 2.0 * Math.PI;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const idxIn = i * 2 * 3;
    positions[idxIn] = raioInterno * cos;
    positions[idxIn + 1] = raioInterno * sin;
    positions[idxIn + 2] = 0.0;

    const idxOut = (i * 2 + 1) * 3;
    positions[idxOut] = raioExterno * cos;
    positions[idxOut + 1] = raioExterno * sin;
    positions[idxOut + 2] = 0.0;
  }

  let indexOffset = 0;
  for (let i = 0; i < segmentos; i++) {
    const v0 = i * 2;
    const v1 = i * 2 + 1;
    const v2 = (i + 1) * 2;
    const v3 = (i + 1) * 2 + 1;

    indices[indexOffset++] = v0;
    indices[indexOffset++] = v1;
    indices[indexOffset++] = v2;

    indices[indexOffset++] = v2;
    indices[indexOffset++] = v1;
    indices[indexOffset++] = v3;

    indices[indexOffset++] = v0;
    indices[indexOffset++] = v2;
    indices[indexOffset++] = v1;

    indices[indexOffset++] = v2;
    indices[indexOffset++] = v3;
    indices[indexOffset++] = v1;
  }

  return new window.Cesium.Geometry({
    attributes: {
      position: new window.Cesium.GeometryAttribute({
        componentDatatype: window.Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: positions
      })
    },
    indices: indices,
    primitiveType: window.Cesium.PrimitiveType.TRIANGLES,
    boundingSphere: new window.Cesium.BoundingSphere(
      window.Cesium.Cartesian3.ZERO,
      raioExterno
    )
  });
}

// Gera pontos perimétricos para borda neon do anel
function gerarCirculoEquatorial(raioMetros, segmentos = 96) {
  const pontos = [];
  for (let i = 0; i <= segmentos; i++) {
    const angle = (i / segmentos) * 2.0 * Math.PI;
    const x = raioMetros * Math.cos(angle);
    const y = raioMetros * Math.sin(angle);
    pontos.push(new window.Cesium.Cartesian3(x, y, 0));
  }
  return pontos;
}

// Coordenadas e metadados para posicionamento dos aneis no plano equatorial
export const RAIO_CAMADAS = {
  leo: {
    in: 1.22 * RAIO_TERRA_METROS,
    out: 1.44 * RAIO_TERRA_METROS,
    cor: '#38BDF8',
    sigla: 'LEO'
  },
  meo: {
    in: 1.62 * RAIO_TERRA_METROS,
    out: 1.88 * RAIO_TERRA_METROS,
    cor: '#5B8DEF',
    sigla: 'MEO'
  },
  geo: {
    in: 2.08 * RAIO_TERRA_METROS,
    out: 2.32 * RAIO_TERRA_METROS,
    cor: '#7C69EF',
    sigla: 'GEO'
  },
  heo: {
    in: 2.52 * RAIO_TERRA_METROS,
    out: 2.80 * RAIO_TERRA_METROS,
    cor: '#A864E8',
    sigla: 'HEO'
  }
};

let texturaAnelPinoCache = null;

// Gera textura circular sutil para o anel externo dos pinos historicos
function obterTexturaAnelPino() {
  if (texturaAnelPinoCache) return texturaAnelPinoCache;
  if (typeof document === 'undefined') return null;

  const tamanho = 28;
  const canvas = document.createElement('canvas');
  canvas.width = tamanho;
  canvas.height = tamanho;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const centro = tamanho / 2;
  ctx.beginPath();
  ctx.arc(centro, centro, 11, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(224, 82, 82, 0.14)';
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = 'rgba(224, 82, 82, 0.65)';
  ctx.stroke();

  texturaAnelPinoCache = canvas.toDataURL();
  return texturaAnelPinoCache;
}

// Retorna posicoes cartesianas dos 4 badges
export function obterPosicoesBadgesOrbitais() {
  const anguloRad = window.Cesium ? window.Cesium.Math.toRadians(40.0) : (40 * Math.PI / 180);
  const cosAng = Math.cos(anguloRad);
  const sinAng = Math.sin(anguloRad);

  const posicoes = {};
  for (const [chave, dados] of Object.entries(RAIO_CAMADAS)) {
    const raioMedio = (dados.in + dados.out) / 2;
    if (window.Cesium) {
      posicoes[chave] = new window.Cesium.Cartesian3(raioMedio * cosAng, raioMedio * sinAng, 0);
    }
  }
  return posicoes;
}

// Cria as 4 faixas concentricas equatoriais, bordas finas e rotulos 3D
export function criarGeometriasAreas3D(viewer, camadaAtivaInicial = 'leo') {
  if (!viewer || !window.Cesium) return null;

  const colecao = {
    entidades: [],
    primitivos: [],
    primitivoDiscos: null
  };

  const instancias = Object.entries(RAIO_CAMADAS).map(([id, cfg]) => {
    const isAtiva = camadaAtivaInicial === id;
    const alphaFill = isAtiva ? 0.16 : 0.04;
    const segs = id === 'leo' ? 96 : 128;

    return new window.Cesium.GeometryInstance({
      geometry: criarGeometriaAnelPlano(cfg.in, cfg.out, segs),
      attributes: {
        color: window.Cesium.ColorGeometryInstanceAttribute.fromColor(
          window.Cesium.Color.fromCssColorString(cfg.cor).withAlpha(alphaFill)
        )
      },
      id: `area_${id}`
    });
  });

  // Primitivo translucido continuo das quatro camadas
  const primitivoDiscos = new window.Cesium.Primitive({
    geometryInstances: instancias,
    appearance: new window.Cesium.PerInstanceColorAppearance({
      flat: true,
      translucent: true,
      closed: false
    }),
    asynchronous: false
  });
  viewer.scene.primitives.add(primitivoDiscos);
  colecao.primitivos.push(primitivoDiscos);
  colecao.primitivoDiscos = primitivoDiscos;

  // Bordas perimetricas internas e externas de cada faixa
  Object.entries(RAIO_CAMADAS).forEach(([id, cfg]) => {
    const isAtiva = camadaAtivaInicial === id;
    const larguraBorda = isAtiva ? 2.0 : 1.0;
    const alphaBorda = isAtiva ? 0.9 : 0.25;

    [cfg.in, cfg.out].forEach((raio) => {
      const entBorda = viewer.entities.add({
        polyline: {
          positions: gerarCirculoEquatorial(raio, 128),
          width: larguraBorda,
          material: window.Cesium.Color.fromCssColorString(cfg.cor).withAlpha(alphaBorda)
        },
        properties: new window.Cesium.PropertyBag({
          tipo: 'borda_orbital',
          areaId: id,
          corHex: cfg.cor
        })
      });
      colecao.entidades.push(entBorda);
    });
  });

  return colecao;
}

// Cria os marcadores dos eventos históricos posicionados diretamente nos seus respectivos anéis orbitais
export function criarMarcadoresEventos3D(viewer) {
  if (!viewer || !window.Cesium) return [];

  const entidadesCriadas = [];
  const texturaAnel = obterTexturaAnelPino();

  // Distribuição angular estratégica nos anéis para evitar sobreposição
  const angulosPinos = {
    'iridium-cosmos-2009': 45,
    'fengyun-2007': 115,
    'inpe-brasil-1993': 185,
    'cerise-1996': 260,
    'vanguard-1958': 75,
    'navstar-gps-1978': 195,
    'galileo-resgate-2014': 315,
    'mev1-intelsat-2020': 30,
    'galaxy15-2010': 210,
    'salsa-cluster-2024': 140,
    'molniya-1965': 280
  };

  PINOS_HISTORICOS.forEach((pino) => {
    const cfgCamada = RAIO_CAMADAS[pino.camadaId?.toLowerCase()] || RAIO_CAMADAS.leo;
    const raioMedio = (cfgCamada.in + cfgCamada.out) / 2;

    const anguloGraus = angulosPinos[pino.id] !== undefined
      ? angulosPinos[pino.id]
      : (pino.posicao?.lon || 0);
    const rad = window.Cesium.Math.toRadians(anguloGraus);

    // Posição cartesiana plana diretamente no anel equatorial correspondente
    const posAnel = new window.Cesium.Cartesian3(
      raioMedio * Math.cos(rad),
      raioMedio * Math.sin(rad),
      0
    );

    // Marcador orbital com ponto e anel externo sutil
    const pinoEnt = viewer.entities.add({
      name: pino.nome,
      position: posAnel,
      point: {
        pixelSize: 8,
        color: window.Cesium.Color.fromCssColorString('#E05252'),
        outlineColor: window.Cesium.Color.WHITE,
        outlineWidth: 1.5,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      billboard: texturaAnel
        ? {
            image: texturaAnel,
            width: 22,
            height: 22,
            scale: 1.0,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        : undefined,
      properties: new window.Cesium.PropertyBag({
        tipo: 'pino_historico',
        pinoId: pino.id,
        camadaId: pino.camadaId,
        pinoData: pino
      })
    });
    entidadesCriadas.push(pinoEnt);
  });

  return entidadesCriadas;
}

const ESCALA_CAMERA_POR_CAMADA = {
  leo: 0.88,
  meo: 0.94,
  geo: 1.0,
  heo: 1.07
};

// Posiciona a camera para enquadramento com planeta totalmente iluminado a esquerda
export function posicionarCameraModoOrbital(viewer, camadaId = 'leo', duracao = 1.4) {
  if (!viewer || !window.Cesium) return;

  // Desativa sombra noturna para manter o planeta 100% iluminado e ativa atmosfera azulada
  viewer.scene.globe.enableLighting = false;
  viewer.scene.globe.showAtmosphere = true;
  viewer.scene.globe.showGroundAtmosphere = true;
  if (viewer.scene.skyAtmosphere) {
    viewer.scene.skyAtmosphere.show = true;
  }

  viewer.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
  viewer.trackedEntity = undefined;

  const escala = (camadaId && ESCALA_CAMERA_POR_CAMADA[camadaId]) || 1.0;

  // Enquadra a Terra no quadrante esquerdo com leve ajuste de zoom conforme a camada
  viewer.camera.flyTo({
    destination: new window.Cesium.Cartesian3(
      42000000 * escala,
      18000000 * escala,
      44000000 * escala
    ),
    orientation: {
      direction: new window.Cesium.Cartesian3(-0.694658, 0.0, -0.719340),
      up: new window.Cesium.Cartesian3(-0.719340, 0.0, 0.694658)
    },
    duration: duracao
  });

  const ctrl = viewer.scene.screenSpaceCameraController;
  ctrl.enableRotate = true;
  ctrl.enableZoom = true;
  ctrl.enableTranslate = false;
  ctrl.enableTilt = false;
  ctrl.enableLook = false;
}

// Realca visualmente o anel e as bordas da camada orbital selecionada
export function destacarCamadaOrbital(colecao, camadaIdAtiva) {
  if (!colecao || !window.Cesium) return;
  const idNormalizado = camadaIdAtiva ? String(camadaIdAtiva).toLowerCase() : null;
  const entidades = colecao.entidades || [];

  entidades.forEach((ent) => {
    if (!ent.properties || !ent.properties.areaId) return;
    const areaId = ent.properties.areaId.getValue();
    const tipo = ent.properties.tipo?.getValue();
    const isAtiva = Boolean(idNormalizado && areaId === idNormalizado);

    if (tipo === 'borda_orbital' && ent.polyline) {
      const corHex = ent.properties.corHex?.getValue() || RAIO_CAMADAS[areaId]?.cor || '#38BDF8';
      ent.polyline.width = isAtiva ? 2.0 : 1.0;
      ent.polyline.material = window.Cesium.Color.fromCssColorString(corHex).withAlpha(isAtiva ? 0.9 : 0.25);
    }
  });

  const aplicarCoresDiscos = () => {
    const prim = colecao.primitivoDiscos;
    if (!prim) return false;
    let atualizado = false;

    Object.entries(RAIO_CAMADAS).forEach(([id, cfg]) => {
      try {
        const attrs = prim.getGeometryInstanceAttributes(`area_${id}`);
        if (attrs) {
          const isAtiva = Boolean(idNormalizado && id === idNormalizado);
          const alphaFill = isAtiva ? 0.16 : 0.04;
          attrs.color = window.Cesium.ColorGeometryInstanceAttribute.toValue(
            window.Cesium.Color.fromCssColorString(cfg.cor).withAlpha(alphaFill)
          );
          atualizado = true;
        }
      } catch {
        // Aguarda inicializacao do primitivo no proximo frame
      }
    });

    return atualizado;
  };

  if (!aplicarCoresDiscos() && typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      aplicarCoresDiscos();
    });
  }
}

// Realca pino historico sob hover ou selecao
export function destacarPinoHistorico(entidade, isHover) {
  if (!entidade || !entidade.point || !window.Cesium) return;

  if (isHover) {
    entidade.point.pixelSize = 10;
    entidade.point.color = window.Cesium.Color.WHITE;
    entidade.point.outlineColor = window.Cesium.Color.fromCssColorString('#E05252');
    entidade.point.outlineWidth = 2.5;
    if (entidade.billboard) {
      entidade.billboard.scale = 1.3;
    }
  } else {
    entidade.point.pixelSize = 7.5;
    entidade.point.color = window.Cesium.Color.fromCssColorString('#E05252');
    entidade.point.outlineColor = window.Cesium.Color.WHITE;
    entidade.point.outlineWidth = 1.5;
    if (entidade.billboard) {
      entidade.billboard.scale = 1.0;
    }
  }
}

// Remove marcadores de eventos
export function removerMarcadoresEventos3D(viewer, entidades) {
  if (!viewer || !entidades) return;
  entidades.forEach((ent) => {
    try {
      viewer.entities.remove(ent);
    } catch {
      // Ignora entidades ja removidas
    }
  });
}

// Remove geometrias das faixas orbitais
export function removerGeometriasAreas3D(viewer, colecao) {
  if (!viewer || !colecao) return;

  if (colecao.entidades) {
    colecao.entidades.forEach((ent) => {
      try {
        viewer.entities.remove(ent);
      } catch {
        // Ignora entidades ja removidas
      }
    });
  }

  if (colecao.primitivos) {
    colecao.primitivos.forEach((prim) => {
      try {
        viewer.scene.primitives.remove(prim);
      } catch {
        // Ignora primitivos ja removidos
      }
    });
  }
}
