import { PINOS_HISTORICOS, CAMADAS_ORBITAIS } from '../data/orbitalModeData';

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

// Coordenadas calculadas para posicionamento dos badges no plano equatorial
export const RAIO_CAMADAS = {
  leo: { in: 1.25 * RAIO_TERRA_METROS, out: 1.52 * RAIO_TERRA_METROS, cor: '#00f0ff', sigla: 'LEO' },
  meo: { in: 1.70 * RAIO_TERRA_METROS, out: 2.05 * RAIO_TERRA_METROS, cor: '#0066ff', sigla: 'MEO' },
  geo: { in: 2.25 * RAIO_TERRA_METROS, out: 2.55 * RAIO_TERRA_METROS, cor: '#a855f7', sigla: 'GEO' },
  heo: { in: 2.75 * RAIO_TERRA_METROS, out: 3.08 * RAIO_TERRA_METROS, cor: '#e879f9', sigla: 'HEO' }
};

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

// Cria as 4 faixas concentricas equatoriais e bordas neon
export function criarGeometriasAreas3D(viewer) {
  if (!viewer || !window.Cesium) return null;

  const colecao = {
    entidades: [],
    primitivos: []
  };

  // Instâncias dos 4 anéis concêntricos planos no mesmo formato
  const instLeo = new window.Cesium.GeometryInstance({
    geometry: criarGeometriaAnelPlano(RAIO_CAMADAS.leo.in, RAIO_CAMADAS.leo.out, 96),
    attributes: {
      color: window.Cesium.ColorGeometryInstanceAttribute.fromColor(
        window.Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.22)
      )
    },
    id: 'area_leo'
  });

  const instMeo = new window.Cesium.GeometryInstance({
    geometry: criarGeometriaAnelPlano(RAIO_CAMADAS.meo.in, RAIO_CAMADAS.meo.out, 128),
    attributes: {
      color: window.Cesium.ColorGeometryInstanceAttribute.fromColor(
        window.Cesium.Color.fromCssColorString('#0066ff').withAlpha(0.18)
      )
    },
    id: 'area_meo'
  });

  const instGeo = new window.Cesium.GeometryInstance({
    geometry: criarGeometriaAnelPlano(RAIO_CAMADAS.geo.in, RAIO_CAMADAS.geo.out, 128),
    attributes: {
      color: window.Cesium.ColorGeometryInstanceAttribute.fromColor(
        window.Cesium.Color.fromCssColorString('#a855f7').withAlpha(0.20)
      )
    },
    id: 'area_geo'
  });

  const instHeo = new window.Cesium.GeometryInstance({
    geometry: criarGeometriaAnelPlano(RAIO_CAMADAS.heo.in, RAIO_CAMADAS.heo.out, 128),
    attributes: {
      color: window.Cesium.ColorGeometryInstanceAttribute.fromColor(
        window.Cesium.Color.fromCssColorString('#e879f9').withAlpha(0.22)
      )
    },
    id: 'area_heo'
  });

  // Primitivo translúcido contínuo das quatro camadas
  const primitivoDiscos = new window.Cesium.Primitive({
    geometryInstances: [instLeo, instMeo, instGeo, instHeo],
    appearance: new window.Cesium.PerInstanceColorAppearance({
      flat: true,
      translucent: true,
      closed: false
    }),
    asynchronous: false
  });
  viewer.scene.primitives.add(primitivoDiscos);
  colecao.primitivos.push(primitivoDiscos);

  // Bordas perimétricas neon para realce visual de cada faixa
  const bordas = [
    { raio: RAIO_CAMADAS.leo.in, cor: '#00f0ff', alpha: 0.65, areaId: 'leo' },
    { raio: RAIO_CAMADAS.leo.out, cor: '#00f0ff', alpha: 0.85, areaId: 'leo' },
    { raio: RAIO_CAMADAS.meo.in, cor: '#0066ff', alpha: 0.60, areaId: 'meo' },
    { raio: RAIO_CAMADAS.meo.out, cor: '#0066ff', alpha: 0.80, areaId: 'meo' },
    { raio: RAIO_CAMADAS.geo.in, cor: '#a855f7', alpha: 0.65, areaId: 'geo' },
    { raio: RAIO_CAMADAS.geo.out, cor: '#a855f7', alpha: 0.85, areaId: 'geo' },
    { raio: RAIO_CAMADAS.heo.in, cor: '#e879f9', alpha: 0.65, areaId: 'heo' },
    { raio: RAIO_CAMADAS.heo.out, cor: '#e879f9', alpha: 0.85, areaId: 'heo' }
  ];

  bordas.forEach((b) => {
    const entBorda = viewer.entities.add({
      polyline: {
        positions: gerarCirculoEquatorial(b.raio, 96),
        width: 1.8,
        material: window.Cesium.Color.fromCssColorString(b.cor).withAlpha(b.alpha)
      },
      properties: new window.Cesium.PropertyBag({
        tipo: 'borda_orbital',
        areaId: b.areaId
      })
    });
    colecao.entidades.push(entBorda);
  });

  return colecao;
}

// Cria os marcadores de pinos vermelhos dos eventos historicos no globo
export function criarMarcadoresEventos3D(viewer) {
  if (!viewer || !window.Cesium) return [];

  const entidadesCriadas = [];

  PINOS_HISTORICOS.forEach((pino) => {
    const posSuperficie = window.Cesium.Cartesian3.fromDegrees(
      pino.posicao.lon,
      pino.posicao.lat,
      10000
    );
    const posTopoHaste = window.Cesium.Cartesian3.fromDegrees(
      pino.posicao.lon,
      pino.posicao.lat,
      350000
    );

    // Haste vertical do pino conectada a superficie
    const hasteEnt = viewer.entities.add({
      polyline: {
        positions: [posSuperficie, posTopoHaste],
        width: 2.0,
        material: window.Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.85)
      },
      properties: new window.Cesium.PropertyBag({
        tipo: 'haste_pino',
        pinoId: pino.id
      })
    });
    entidadesCriadas.push(hasteEnt);

    // Cabeca esferica do pino vermelho
    const pinoEnt = viewer.entities.add({
      name: pino.nome,
      position: posTopoHaste,
      point: {
        pixelSize: 11,
        color: window.Cesium.Color.fromCssColorString('#ff0044'),
        outlineColor: window.Cesium.Color.WHITE,
        outlineWidth: 2.0,
        disableDepthTestDistance: 1000000
      },
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

// Posiciona a camera para enquadramento com planeta a esquerda
export function posicionarCameraModoOrbital(viewer) {
  if (!viewer || !window.Cesium) return;

  viewer.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
  viewer.trackedEntity = undefined;

  // Enquadra a Terra no quadrante inferior-esquerdo
  viewer.camera.flyTo({
    destination: new window.Cesium.Cartesian3(42000000, 18000000, 44000000),
    orientation: {
      direction: new window.Cesium.Cartesian3(-0.694658, 0.0, -0.719340),
      up: new window.Cesium.Cartesian3(-0.719340, 0.0, 0.694658)
    },
    duration: 1.5
  });

  const ctrl = viewer.scene.screenSpaceCameraController;
  ctrl.enableRotate = true;
  ctrl.enableZoom = true;
  ctrl.enableTranslate = false;
  ctrl.enableTilt = false;
  ctrl.enableLook = false;
}

// Realca visualmente uma camada orbital selecionada
export function destacarCamadaOrbital(colecao, camadaIdAtiva) {
  if (!colecao) return;
  const entidades = colecao.entidades || [];

  entidades.forEach((ent) => {
    if (!ent.properties || !ent.properties.areaId) return;
    const areaId = ent.properties.areaId.getValue();
    const isAtiva = !camadaIdAtiva || areaId === camadaIdAtiva;

    if (ent.polyline) {
      ent.polyline.width = isAtiva ? 3.0 : 1.2;
    }
  });
}

// Realca pino historico sob hover ou selecao
export function destacarPinoHistorico(entidade, isHover) {
  if (!entidade || !entidade.point) return;

  if (isHover) {
    entidade.point.pixelSize = 14;
    entidade.point.color = window.Cesium.Color.WHITE;
    entidade.point.outlineColor = window.Cesium.Color.fromCssColorString('#ff0044');
    entidade.point.outlineWidth = 3.5;
  } else {
    entidade.point.pixelSize = 11;
    entidade.point.color = window.Cesium.Color.fromCssColorString('#ff0044');
    entidade.point.outlineColor = window.Cesium.Color.WHITE;
    entidade.point.outlineWidth = 2.0;
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
