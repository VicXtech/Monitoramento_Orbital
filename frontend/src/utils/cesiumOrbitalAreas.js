import { DEFINICOES_AREAS_ORBITAIS, RAIO_TERRA_METROS } from './orbitalAreas3D';
import { EVENTOS_HISTORICOS_ESA } from '../data/esaSpaceEnvironmentData';

/**
 * Cria a geometria de um anel plano 2D no plano equatorial (Z = 0)
 * Elimina paredes verticais e linhas de silhueta indesejadas
 */
function criarGeometriaAnelPlano(raioInterno, raioExterno, segmentos = 96) {
  const numVertices = (segmentos + 1) * 2;
  const positions = new Float64Array(numVertices * 3);
  const indices = new Uint32Array(segmentos * 12);

  for (let i = 0; i <= segmentos; i++) {
    const angle = (i / segmentos) * 2.0 * Math.PI;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Vértice interno no plano equatorial
    const idxIn = i * 2 * 3;
    positions[idxIn] = raioInterno * cos;
    positions[idxIn + 1] = raioInterno * sin;
    positions[idxIn + 2] = 0.0;

    // Vértice externo no plano equatorial
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

    // Face superior (sentido anti-horário)
    indices[indexOffset++] = v0;
    indices[indexOffset++] = v1;
    indices[indexOffset++] = v2;

    indices[indexOffset++] = v2;
    indices[indexOffset++] = v1;
    indices[indexOffset++] = v3;

    // Face inferior (sentido horário)
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

/**
 * Gera pontos de um círculo equatorial em altitude metros
 */
function gerarCirculoEquatorial(altitudeMetros, segmentos = 96) {
  const pontos = [];
  const raioTotal = RAIO_TERRA_METROS + altitudeMetros;
  for (let i = 0; i <= segmentos; i++) {
    const angle = (i / segmentos) * 2.0 * Math.PI;
    const x = raioTotal * Math.cos(angle);
    const y = raioTotal * Math.sin(angle);
    const z = 0;
    pontos.push(new window.Cesium.Cartesian3(x, y, z));
  }
  return pontos;
}

/**
 * Gera pontos de uma órbita altamente elíptica (HEO/Molniya)
 */
function gerarElipseHeo(segmentos = 96, offsetSemiEixo = 0) {
  const pontos = [];
  const rPerigeu = RAIO_TERRA_METROS + 600000 + offsetSemiEixo;
  const rApogeu = RAIO_TERRA_METROS + 39500000 + offsetSemiEixo;
  const a = (rPerigeu + rApogeu) / 2;
  const c = a - rPerigeu;
  const b = Math.sqrt(Math.max(1, a * a - c * c));
  const inclinacaoRad = window.Cesium.Math.toRadians(63.4);

  for (let i = 0; i <= segmentos; i++) {
    const theta = (i / segmentos) * 2 * Math.PI;
    const xOrb = a * Math.cos(theta) - c;
    const yOrb = b * Math.sin(theta);

    const x = xOrb;
    const y = yOrb * Math.cos(inclinacaoRad);
    const z = yOrb * Math.sin(inclinacaoRad);

    pontos.push(new window.Cesium.Cartesian3(x, y, z));
  }
  return pontos;
}

/**
 * Cria os discos equatoriais contínuos sem frestas e sem sobreposição
 */
export function criarGeometriasAreas3D(viewer, ano = 2026) {
  if (!viewer || !window.Cesium) return [];

  const colecao = {
    entidades: [],
    primitivos: []
  };

  // 1. Instâncias dos anéis planos equatoriais (2D sem espessura e sem paredes)
  // LEO: 200 km a 2.000 km
  const geomLeo = criarGeometriaAnelPlano(
    RAIO_TERRA_METROS + 200000,
    RAIO_TERRA_METROS + 2000000,
    96
  );
  const instLeo = new window.Cesium.GeometryInstance({
    geometry: geomLeo,
    attributes: {
      color: window.Cesium.ColorGeometryInstanceAttribute.fromColor(
        window.Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.18)
      )
    },
    id: 'area_leo'
  });

  // MEO: Inicia exatamente em 2.000 km e vai até 35.500 km (sem espaço vazio)
  const geomMeo = criarGeometriaAnelPlano(
    RAIO_TERRA_METROS + 2000000,
    RAIO_TERRA_METROS + 35500000,
    128
  );
  const instMeo = new window.Cesium.GeometryInstance({
    geometry: geomMeo,
    attributes: {
      color: window.Cesium.ColorGeometryInstanceAttribute.fromColor(
        window.Cesium.Color.fromCssColorString('#0066ff').withAlpha(0.10)
      )
    },
    id: 'area_meo'
  });

  // GEO: Anel do cinturão geoestacionário (35.500 km a 36.100 km, centrado em 35.786 km)
  const geomGeo = criarGeometriaAnelPlano(
    RAIO_TERRA_METROS + 35500000,
    RAIO_TERRA_METROS + 36100000,
    128
  );
  const instGeo = new window.Cesium.GeometryInstance({
    geometry: geomGeo,
    attributes: {
      color: window.Cesium.ColorGeometryInstanceAttribute.fromColor(
        window.Cesium.Color.fromCssColorString('#a855f7').withAlpha(0.24)
      )
    },
    id: 'area_geo'
  });

  // Cria primitivo com renderização translúcida plana uniforme
  const primitivoDiscos = new window.Cesium.Primitive({
    geometryInstances: [instLeo, instMeo, instGeo],
    appearance: new window.Cesium.PerInstanceColorAppearance({
      flat: true,
      translucent: true,
      closed: false
    }),
    asynchronous: false
  });

  viewer.scene.primitives.add(primitivoDiscos);
  colecao.primitivos.push(primitivoDiscos);

  // 2. Trajetória da órbita altamente elíptica (HEO)
  const linhaHeoCentro = viewer.entities.add({
    name: 'Órbita HEO Central',
    polyline: {
      positions: gerarElipseHeo(96, 0),
      width: 2.5,
      material: window.Cesium.Color.fromCssColorString('#e879f9').withAlpha(0.95)
    },
    properties: new window.Cesium.PropertyBag({
      areaId: 'heo',
      tipo: 'area_orbital',
      isCore: true
    })
  });
  colecao.entidades.push(linhaHeoCentro);

  const linhaHeoAura = viewer.entities.add({
    name: 'Aura HEO',
    polyline: {
      positions: gerarElipseHeo(96, 0),
      width: 7.5,
      material: window.Cesium.Color.fromCssColorString('#c084fc').withAlpha(0.25)
    },
    properties: new window.Cesium.PropertyBag({
      areaId: 'heo',
      tipo: 'area_orbital',
      isAura: true
    })
  });
  colecao.entidades.push(linhaHeoAura);

  return colecao;
}

/**
 * Cria marcadores compactos com oclusão esférica natural da Terra
 */
export function criarMarcadoresEventos3D(viewer, ano) {
  if (!viewer || !window.Cesium) return [];

  const marcadoresCriados = [];

  EVENTOS_HISTORICOS_ESA.forEach((evento) => {
    if (evento.ano <= ano) {
      const isAnoAtual = evento.ano === ano;
      const corBase = window.Cesium.Color.fromCssColorString('#00f0ff');

      const cartesian = window.Cesium.Cartesian3.fromDegrees(
        evento.posicao.lon,
        evento.posicao.lat,
        evento.posicao.altMetros
      );

      const pontoEntity = viewer.entities.add({
        name: evento.nome,
        position: cartesian,
        point: {
          pixelSize: isAnoAtual ? 11 : 7,
          color: isAnoAtual
            ? window.Cesium.Color.WHITE
            : corBase,
          outlineColor: isAnoAtual
            ? corBase
            : window.Cesium.Color.fromCssColorString('rgba(0, 240, 255, 0.4)'),
          outlineWidth: isAnoAtual ? 3.5 : 2.0
        },
        label: {
          text: `◆ ${evento.nome.toUpperCase()}`,
          font: 'bold 10px monospace',
          fillColor: window.Cesium.Color.WHITE,
          outlineColor: corBase,
          outlineWidth: 2.0,
          style: window.Cesium.LabelStyle.FILL_AND_OUTLINE,
          showBackground: true,
          backgroundColor: window.Cesium.Color.fromCssColorString('rgba(6, 14, 28, 0.9)'),
          backgroundPadding: new window.Cesium.Cartesian2(6, 3),
          verticalOrigin: window.Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new window.Cesium.Cartesian2(0, -12),
          show: false
        },
        properties: new window.Cesium.PropertyBag({
          tipo: 'evento_historico',
          eventoId: evento.id,
          eventoData: evento,
          isAnoAtual: isAnoAtual
        })
      });

      marcadoresCriados.push(pontoEntity);
    }
  });

  return marcadoresCriados;
}

/**
 * Destaque ao passar o mouse sobre o ponto do evento histórico
 */
export function destacarEvento3D(entidade, isHover) {
  if (!entidade || !entidade.point) return;
  const isAnoAtual = entidade.properties?.isAnoAtual?.getValue() || false;
  const corBase = window.Cesium.Color.fromCssColorString('#00f0ff');

  if (isHover) {
    entidade.point.pixelSize = 14;
    entidade.point.color = window.Cesium.Color.WHITE;
    entidade.point.outlineColor = corBase;
    entidade.point.outlineWidth = 4.0;
    if (entidade.label) {
      entidade.label.show = true;
    }
  } else {
    entidade.point.pixelSize = isAnoAtual ? 11 : 7;
    entidade.point.color = isAnoAtual ? window.Cesium.Color.WHITE : corBase;
    entidade.point.outlineColor = isAnoAtual
      ? corBase
      : window.Cesium.Color.fromCssColorString('rgba(0, 240, 255, 0.4)');
    entidade.point.outlineWidth = isAnoAtual ? 3.5 : 2.0;
    if (entidade.label) {
      entidade.label.show = false;
    }
  }
}

/**
 * Remove marcadores de eventos históricos
 */
export function removerMarcadoresEventos3D(viewer, entidades) {
  if (!viewer || !entidades) return;
  entidades.forEach((ent) => {
    try {
      viewer.entities.remove(ent);
    } catch {
      // Ignora entidades já removidas
    }
  });
}

/**
 * Atualiza cores ao trocar de ano
 */
export function atualizarCoresAreas3D(viewer, colecao, ano) {
  // Cores mantidas uniformes
}

/**
 * Realça elementos perimétricos sob hover
 */
export function destacarArea3D(colecao, areaIdHover) {
  if (!colecao) return;
  const entidades = colecao.entidades || (Array.isArray(colecao) ? colecao : []);

  entidades.forEach((ent) => {
    if (!ent.properties || !ent.properties.areaId) return;
    const areaId = ent.properties.areaId.getValue();
    const isHovered = areaId === areaIdHover;

    // Linhas HEO
    if (ent.polyline && areaId === 'heo') {
      const isAura = ent.properties.isAura ? ent.properties.isAura.getValue() : false;
      const isCore = ent.properties.isCore ? ent.properties.isCore.getValue() : false;

      if (isAura) {
        ent.polyline.width = isHovered ? 11.0 : 7.5;
        ent.polyline.material = isHovered
          ? window.Cesium.Color.fromCssColorString('#c084fc').withAlpha(0.50)
          : window.Cesium.Color.fromCssColorString('#c084fc').withAlpha(0.25);
      } else if (isCore) {
        ent.polyline.width = isHovered ? 3.8 : 2.5;
        ent.polyline.material = isHovered
          ? window.Cesium.Color.WHITE
          : window.Cesium.Color.fromCssColorString('#e879f9').withAlpha(0.95);
      }
    }
  });
}

/**
 * Remove todas as geometrias e primitivos de áreas do Cesium
 */
export function removerGeometriasAreas3D(viewer, colecao) {
  if (!viewer || !colecao) return;

  if (Array.isArray(colecao)) {
    colecao.forEach((item) => {
      try {
        if (viewer.entities.contains(item)) {
          viewer.entities.remove(item);
        } else if (viewer.scene.primitives.contains(item)) {
          viewer.scene.primitives.remove(item);
        }
      } catch {
        // Ignora itens já removidos
      }
    });
  } else if (typeof colecao === 'object') {
    if (colecao.entidades) {
      colecao.entidades.forEach((ent) => {
        try {
          viewer.entities.remove(ent);
        } catch {
          // Ignora entidades já removidas
        }
      });
    }
    if (colecao.primitivos) {
      colecao.primitivos.forEach((prim) => {
        try {
          viewer.scene.primitives.remove(prim);
        } catch {
          // Ignora primitivos já removidos
        }
      });
    }
  }
}

