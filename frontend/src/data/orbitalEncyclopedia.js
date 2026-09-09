/**
 * Enciclopédia Orbital Factual e Glossário Astrodinâmico Educacional
 * 
 * Fornece histórico documentado de missões espaciais reais,
 * definições conceituais acessíveis e dados científicos de sustentabilidade
 * para o Trabalho de Conclusão de Curso (TCC).
 * 
 * Regra: Ausência estrita de emojis em todos os textos.
 */

// 1. CATÁLOGO FACTUAL DE MISSÕES HISTÓRICAS E REAIS
export const CATALOGO_HISTORICO = {
  // MISSÕES BRASILEIRAS (INPE / AEB)
  "22823": {
    nomeOficial: "SCD-1 (Satélite de Coleta de Dados 1)",
    pais: "Brasil",
    operador: "INPE (Instituto Nacional de Pesquisas Espaciais)",
    anoLancamento: 1993,
    massaKg: 115,
    finalidade: "Coleta e retransmissão de dados ambientais de plataformas hidrológicas e meteorológicas distribuídas pelo território nacional, incluindo a Bacia Amazônica.",
    historico: "Lançado em 9 de fevereiro de 1993 pelo foguete americano Pegasus, o SCD-1 é o primeiro satélite desenvolvido integralmente no Brasil. Projetado originalmente para operar por apenas 1 ano, superou todas as expectativas da engenharia espacial brasileira e permanece em operação contínua e transmitindo dados há mais de 30 anos.",
    relevancia: "Marco pioneiro do Programa Espacial Brasileiro, validou a competência nacional em subsistemas térmicos, de bordo e controle de atitude por rotação."
  },
  "25400": {
    nomeOficial: "SCD-2 (Satélite de Coleta de Dados 2)",
    pais: "Brasil",
    operador: "INPE",
    anoLancamento: 1998,
    massaKg: 117,
    finalidade: "Monitoramento de recursos hídricos, previsão do tempo e qualidade do ar em conjunto com o SCD-1.",
    historico: "Lançado em outubro de 1998 a bordo de um lançador Pegasus XL, o SCD-2 sucedeu o SCD-1 trazendo melhorias nos sistemas de telemetria e baterias solares desenvolvidas no Laboratório de Integração e Testes (LIT/INPE).",
    relevancia: "Garante a redundância e a perenidade do Sistema Brasileiro de Coleta de Dados Ambientais."
  },
  "54380": {
    nomeOficial: "Amazonia-1",
    pais: "Brasil",
    operador: "INPE / AEB",
    anoLancamento: 2021,
    massaKg: 638,
    finalidade: "Imageamento óptico multiespectral para vigilância de desmatamento na Amazônia Legal e monitoramento da agricultura nacional.",
    historico: "Lançado em 28 de fevereiro de 2021 pelo lançador indiano PSLV-C51, o Amazonia-1 é o primeiro satélite de sensoriamento remoto de grande porte projetado, integrado, testado e operado 100% pelo Brasil, baseado na Plataforma Multimissão (PMM).",
    relevancia: "Consolidou o domínio tecnológico brasileiro na fabricação de satélites estabilizados em 3 eixos e câmeras multiespectrais de alta resolução temporal."
  },
  "44883": {
    nomeOficial: "CBERS-4A (China-Brazil Earth Resources Satellite)",
    pais: "Brasil / China",
    operador: "INPE / CAST",
    anoLancamento: 2019,
    massaKg: 1980,
    finalidade: "Sensoriamento remoto global com resolução espacial de até 2 metros para gestão ambiental, recursos hídricos e ordenamento territorial.",
    historico: "Sexto satélite do programa bilateral sino-brasileiro iniciado em 1988, o CBERS-4A foi lançado em dezembro de 2019 a partir do Centro de Lançamento de Taiyuan, transportando câmeras brasileiras MUX e WFI e chinesas WPM.",
    relevancia: "Exemplo internacional de cooperação Sul-Sul em alta tecnologia espacial e distribuição aberta de dados geoespaciais."
  },

  // ESTAÇÕES ESPACIAIS HABITADAS
  "25544": {
    nomeOficial: "ISS (Estação Espacial Internacional)",
    pais: "Multinacional (EUA / Rússia / ESA / Japão / Canadá)",
    operador: "NASA / Roscosmos / ESA / JAXA / CSA",
    anoLancamento: 1998,
    massaKg: 450000,
    finalidade: "Laboratório científico habitado contínuo em regime de microgravidade para pesquisas em biologia, física quântica, materiais e medicina espacial.",
    historico: "Iniciada em novembro de 1998 com o módulo russo Zarya, a ISS tem massa próxima a 450 toneladas e dimensões comparáveis a um campo de futebol. É habitada ininterruptamente por astronautas desde novembro de 2000 e viaja a 28.000 km/h, completando uma volta na Terra a cada 90 minutos.",
    relevancia: "A maior e mais complexa estrutura multinacional já construída pela humanidade fora do planeta Terra."
  },
  "48274": {
    nomeOficial: "Tiangong (Estação Espacial Chinesa - Tianhe)",
    pais: "China",
    operador: "CNSA (China National Space Administration)",
    anoLancamento: 2021,
    massaKg: 66000,
    finalidade: "Posto científico orbital permanente da China para missões espaciais de longa duração e física de fluidos.",
    historico: "O módulo central Tianhe foi lançado em abril de 2021, seguido pelos laboratórios científicos Wentian e Mengtian em 2022. A estação abriga equipes de três taikonautas e conta com braço robótico de alta precisão e portas de acoplamento de naves Shenzhou e Tianzhou.",
    relevancia: "Representa a autonomia tecnológica da China em habitação espacial de terceira geração em órbita baixa."
  },

  // TELESCÓPIOS E CIÊNCIA
  "20580": {
    nomeOficial: "Telescópio Espacial Hubble (HST)",
    pais: "Estados Unidos / Europa",
    operador: "NASA / ESA",
    anoLancamento: 1990,
    massaKg: 11110,
    finalidade: "Astronomia observacional profunda em luz visível, ultravioleta e infravermelho próximo.",
    historico: "Colocado em órbita pelo Ônibus Espacial Discovery em abril de 1990, o Hubble revolucionou a astrofísica moderna ao operar livre da distorção atmosférica, permitindo determinar a taxa de expansão do universo e observar as primeiras galáxias.",
    relevancia: "Considerado um dos instrumentos científicos mais produtivos da história da ciência com mais de 1,5 milhão de observações."
  },

  // CONSTELAÇÕES DE NAVEGAÇÃO
  "24876": {
    nomeOficial: "GPS BIIR-2 (NAVSTAR 43)",
    pais: "Estados Unidos",
    operador: "Força Espacial dos EUA",
    anoLancamento: 1997,
    massaKg: 2032,
    finalidade: "Transmissão de sinais de radionavegação e cronometria de altíssima precisão baseada em relógios atômicos de césio e rubídio.",
    historico: "Parte da constelação GPS em órbita média (MEO) a cerca de 20.200 km de altitude. Satélites desse bloco garantem posicionamento tridimensional contínuo em qualquer ponto do globo terrestre.",
    relevancia: "Infraestrutura essencial para aviação, navegação marítima, telecomunicações e sincronização de redes elétricas globais."
  },

  // DETRITOS HISTÓRICOS DE COLISÃO E IMPACTO
  "22675": {
    nomeOficial: "Cosmos 2251 (Remanescentes da Colisão de 2009)",
    pais: "Rússia",
    operador: "Ministério da Defesa Russo (Desativado)",
    anoLancamento: 1993,
    massaKg: 900,
    finalidade: "Satélite de comunicação militar da frota Strela-2M. Encerrou sua vida útil em 1995 e permaneceu como satélite inativo descontrolado.",
    historico: "Em 10 de fevereiro de 2009, o Cosmos 2251 colidiu catastroficamente a 789 km de altitude com o satélite comercial operacional Iridium 33 a uma velocidade relativa de 42.120 km/h (11,7 km/s). O choque destruiu ambos os satélites e gerou mais de 1.400 fragmentos grandes catalogados de lixo espacial.",
    relevancia: "Primeiro choque acidental hiperveloz entre dois satélites artificiais intactos na história espacial, marco prático do Efeito Kessler."
  },
  "24946": {
    nomeOficial: "Iridium 33 (Remanescentes da Colisão de 2009)",
    pais: "Estados Unidos",
    operador: "Iridium Communications",
    anoLancamento: 1997,
    massaKg: 560,
    finalidade: "Satélite de telefonia global por satélite. Estava plenamente operacional no momento do impacto.",
    historico: "Destruído instantaneamente no evento de colisão com o Cosmos 2251 sobre a península de Taimyr na Sibéria. Seus fragmentos permanecem dispersos em órbitas com inclinação de 86 graus, exigindo manobras evasivas regulares de outros satélites.",
    relevancia: "Evidenciou internacionalmente a vulnerabilidade de constelações comerciais diante de objetos fantasmas desativados em órbita."
  }
};

// 2. DIAGNÓSTICO DO SETOR (MACRO) REATIVO AO FILTRO ATIVO DO PAINEL ESQUERDO
export const DIAGNOSTICO_SETORES = {
  1: {
    titulo: "SATÉLITES ATIVOS",
    itens: [
      { rotulo: "Densidade Crítica", desc: "87% operando em Órbita Baixa (LEO)" },
      { rotulo: "Taxa de Ocupação", desc: "83,7% de satélites funcionais no censo atual" },
      { rotulo: "Alerta de Tráfego", desc: "Alta densidade de megaconstelações comerciais" }
    ]
  },
  2: {
    titulo: "SATÉLITES INATIVOS",
    itens: [
      { rotulo: "Obsoletos em Órbita", desc: "Carcaças e equipamentos desativados à deriva" },
      { rotulo: "Risco de Fragmentação", desc: "Baterias e tanques pressurizados residuais" },
      { rotulo: "Órbitas Cemitério", desc: "Frotas em GEO elevadas a zonas de descarte (>36.000 km)" }
    ]
  },
  3: {
    titulo: "DETRITOS ESPACIAIS",
    itens: [
      { rotulo: "Risco de Impacto", desc: "Mais de 12.500 fragmentos sem propulsão ou controle" },
      { rotulo: "Ponto Crítico", desc: "Concentração máxima entre 750 km e 950 km (LEO)" },
      { rotulo: "Dinâmica", desc: "Fragmentos hipersônicos a 27.000 km/h sem manobra evasiva" }
    ]
  },
  4: {
    titulo: "BASES TRIPULADAS",
    itens: [
      { rotulo: "População Orbital", desc: "Estruturas habitadas continuamente (ISS e Tiangong)" },
      { rotulo: "Regime de Voo", desc: "~400 km a 420 km de altitude média" },
      { rotulo: "Manobras Evasivas", desc: "Requerem queima periódica de propulsores contra detritos" }
    ]
  },
  5: {
    titulo: "CORPOS DE FOGUETES",
    itens: [
      { rotulo: "Massa Crítica", desc: "Estágios superiores descartados (Falcon, Soyuz, Centaur, CZ)" },
      { rotulo: "Risco de Explosão", desc: "Propelente residual e pressurização em tanques esgotados" },
      { rotulo: "Cinturão Kessler", desc: "Alvos massivos que amplificam potencial de fragmentação" }
    ]
  },
  todos: {
    titulo: "SATÉLITES ATIVOS",
    itens: [
      { rotulo: "Densidade Crítica", desc: "Mais de 16.500 satélites operacionais catalogados" },
      { rotulo: "Taxa de Ocupação", desc: "Predominância em Órbita Baixa (LEO) e Geoestacionária" },
      { rotulo: "Alerta de Tráfego", desc: "Crescimento exponencial de megaconstelações comerciais" }
    ]
  }
};

// 3. GERADOR FACTUAL DINÂMICO PARA SATÉLITES NÃO LISTADOS NOMINALMENTE
export function obterFichaFactual(sat, parametrosOrbitais) {
  if (!sat) return null;

  const noradId = String(sat.norad_id || '').trim();
  const nome = (sat.nome || '').toUpperCase();
  const categoriaId = Number(sat.categoria_id);

  // Se existir ficha nominal cadastrada no catálogo, utiliza a base documentada
  if (CATALOGO_HISTORICO[noradId]) {
    const item = CATALOGO_HISTORICO[noradId];
    return {
      titulo: item.nomeOficial,
      funcao: item.finalidade,
      historia: item.historico,
      relevancia: item.relevancia,
      operador: item.operador,
      contextoMissao: item.finalidade || item.historico,
      fonte: "Catálogo Histórico Oficial de Engenharia Espacial"
    };
  }

  // Decodificação factual dinâmica baseada na categoria e nos cálculos físicos
  let funcao;
  let historia;
  let relevancia;
  let contextoMissao;
  let operador = sat.pais || "Internacional";

  // Identificação por padrões de nomenclatura oficiais
  if (nome.includes("STARLINK")) {
    funcao = "Comunicação de Banda Larga em Megaconstelação";
    operador = "SpaceX (EUA)";
    contextoMissao = "Satélite de megaconstelação para internet de banda larga em órbita baixa, equipado com propulsão iônica para prevenção de colisões e desorbitação ativa ao fim da vida útil.";
    historia = `Satélite integrante da megaconstelação Starlink em órbita baixa (LEO). Projetado com propulsores de íons de criptônio/argônio para manutenção de posição e desorbitação ativa.`;
    relevancia = `Representa a nova era de satélites serializados em massa, objeto de intensos debates sobre tráfego espacial e reflexividade astronômica.`;
  } else if (nome.includes("ONEWEB")) {
    funcao = "Telecomunicações Globais em Órbita Baixa";
    operador = "Eutelsat OneWeb (Reino Unido)";
    contextoMissao = "Satélite de conectividade global operando a ~1.200 km, com descarte propulsionado obrigatório para evitar permanência de séculos em órbita.";
    historia = `Satélite de comunicações em constelação operando a cerca de 1.200 km de altitude, fornecendo conectividade corporativa e governamental.`;
    relevancia = `Por operar em altitude mais alta que a Starlink, seus remanescentes exigem descarte propulsionado rigoroso.`;
  } else if (nome.includes("NOAA") || nome.includes("GOES") || nome.includes("METOP")) {
    funcao = "Monitoramento Meteorológico, Oceânico e Climático";
    operador = "Agências Meteorológicas Globais (NOAA/EUMETSAT)";
    contextoMissao = "Plataforma de observação da Terra dedicada ao rastreamento contínuo de sistemas meteorológicos, tempestades tropicais e apoio a alertas de desastres.";
    historia = `Plataforma de sensoriamento remoto dedicada ao rastreamento contínuo de sistemas meteorológicos, tempestades tropicais e temperatura dos oceanos.`;
    relevancia = `Fornece dados abertos vitais para modelos climáticos numéricos globais.`;
  } else if (nome.includes("GALILEO") || nome.includes("GLONASS") || nome.includes("BEIDOU") || nome.includes("GPS") || nome.includes("NAVSTAR")) {
    funcao = "Radionavegação e Cronometria Global (GNSS)";
    operador = "Governo Soberano / Defesa";
    contextoMissao = "Satélite de radionavegação e temporização atômica em órbita média (MEO), transmitindo sinais codificados para geolocalização civil e militar.";
    historia = `Satélite de navegação situado na órbita terrestre média (MEO). Emite sinais de radiofrequência codificados para cálculo de posição e tempo.`;
    relevancia = `Pilar fundamental da navegação contemporânea e infraestrutura crítica global.`;
  } else if (categoriaId === 4 || nome.includes("ISS") || nome.includes("TIANGONG") || nome.includes("ESTACAO")) {
    funcao = "Estação Espacial Tripulada Permanente";
    operador = "Cooperação Internacional / Agências";
    contextoMissao = "Infraestrutura orbital habitada permanentemente em microgravidade, servindo como laboratório de pesquisas científicas e cooperação tecnológica.";
    historia = `Complexo orbital tripulado com presença humana contínua em órbita baixa da Terra.`;
    relevancia = `Laboratório único para estudos de medicina espacial, física de fluidos e astrobiologia.`;
  } else if (categoriaId === 3 || nome.includes("DEB") || nome.includes("DEBRIS") || nome.includes("R/B") || nome.includes("STAGE")) {
    funcao = "Detrito Espacial Inerte (Lixo Orbital)";
    operador = sat.pais || "Nação Lançadora Original";
    if (nome.includes("R/B") || nome.includes("ROCKET")) {
      contextoMissao = "Estágio de foguete descartado à deriva sem propulsão ou telemetria, monitorado por radar devido ao risco de colisão e fragmentação.";
      historia = `Corpo de foguete descartado que atingiu velocidade orbital e permaneceu à deriva no espaço desprovido de controle.`;
      relevancia = `Constitui uma das maiores fontes potenciais de novos fragmentos por risco de colisão.`;
    } else {
      contextoMissao = "Fragmento metálico inerte resultante de colisão ou degradação em órbita, rastreado preventivamente para evitar conjunções catastróficas.";
      historia = `Fragmento metálico remanescente de colisão ou degradação térmica em órbita, deslocando-se a velocidades hipersônicas sem propulsão.`;
      relevancia = `Possui energia cinética equivalente a artefatos explosivos devido à velocidade orbital superior a 27.000 km/h.`;
    }
  } else if (categoriaId === 2) {
    funcao = "Satélite Desativado (Inativo em Órbita)";
    operador = sat.pais || "Operador Original";
    contextoMissao = "Satélite desativado que encerrou operações funcionais, permanecendo em rota passiva até reentrada atmosférica ou transferência para órbita cemitério.";
    historia = `Satélite que encerrou suas operações funcionais por esgotamento de combustível ou falha de bateria, permanecendo em rota passiva.`;
    relevancia = `Satélites inativos não respondem a comandos evasivos, atuando como alvos fixos na teia da Síndrome de Kessler.`;
  } else if (nome.includes("COSMOS") || nome.includes("USA ") || nome.includes("NROL") || nome.includes("KOSMOS") || nome.includes("YAOGAN")) {
    funcao = "Carga Útil de Reconhecimento e Defesa";
    operador = sat.pais || "Defesa Soberana";
    contextoMissao = "Carga útil militar/reconhecimento em órbita baixa polar ou heliossíncrona, monitorada por rastreamento radar automatizado.";
    historia = `Plataforma de defesa e sensoriamento governamental em órbita especializada.`;
    relevancia = `Operação de alta relevância estratégica sob rastreamento pelas redes globais de defesa aeroespacial.`;
  } else {
    const regime = parametrosOrbitais ? parametrosOrbitais.regimeNome : "Órbita Terrestre";
    const classeInc = parametrosOrbitais ? parametrosOrbitais.classeInclinacao : "Órbita Padrão";
    funcao = `Objeto Operacional em ${regime}`;
    contextoMissao = `Plataforma operacional em ${regime} (${classeInc}), monitorada por rastreamento radar automatizado da rede global de vigilância espacial.`;
    historia = `Plataforma em operação sob responsabilidade de: ${sat.pais || "Registro Internacional"}.`;
    relevancia = `Trajetória propagada analiticamente em tempo real via modelo matemático SGP4.`;
  }

  return {
    titulo: sat.nome,
    funcao,
    historia,
    relevancia,
    contextoMissao,
    operador,
    fonte: "Catálogo Oficial NORAD / Propagação SGP4"
  };
}

// 3. GLOSSÁRIO DIDÁTICO ASTRODINÂMICO (PARA O 4º SLIDE E CONSULTA NO CONSOLE)
export const GLOSSARIO_ORBITAL = [
  {
    categoria: "REGIMES DE ÓRBITA",
    itens: [
      {
        termo: "LEO (Low Earth Orbit)",
        titulo: "Órbita Terrestre Baixa",
        definicao: "Faixa de 160 km a 2.000 km de altitude. Abriga a Estação Espacial Internacional e constelações de satélites de internet. Por concentrar a maior parte dos objetos espaciais, apresenta o maior risco de colisões."
      },
      {
        termo: "MEO (Medium Earth Orbit)",
        titulo: "Órbita Terrestre Média",
        definicao: "Faixa intermediária de 2.000 km a 35.786 km de altitude. Região tradicionalmente utilizada por constelações de navegação e geolocalização global, como GPS, Galileo, Glonass e BeiDou."
      },
      {
        termo: "GEO (Geostationary Earth Orbit)",
        titulo: "Órbita Geoestacionária",
        definicao: "Órbita circular a 35.786 km de altitude sobre a linha do equador. O satélite acompanha com precisão a rotação da Terra (24 horas), parecendo imóvel no céu para quem observa da superfície."
      },
      {
        termo: "HEO (Highly Elliptical Orbit)",
        titulo: "Órbita Muito Elíptica",
        definicao: "Trajetória oval com altitude bastante variável. O satélite passa veloz e próximo da Terra no ponto mais baixo e passa a maior parte do tempo no ponto mais alto, cobrindo regiões polares isoladas."
      }
    ]
  },
  {
    categoria: "MECÂNICA CELESTE E ENGENHARIA",
    itens: [
      {
        termo: "Perigeu",
        titulo: "Ponto de Maior Proximidade",
        definicao: "Ponto da órbita em que o satélite passa mais perto da superfície terrestre. Sob a maior atração gravitacional do planeta, é onde o objeto desenvolve sua velocidade máxima de deslocamento."
      },
      {
        termo: "Apogeu",
        titulo: "Ponto de Maior Distância",
        definicao: "Ponto da órbita em que o satélite atinge a maior distância da superfície terrestre. Longe da atração principal da Terra, é o trecho onde o objeto se move com sua velocidade mínima."
      },
      {
        termo: "Inclinação Orbital",
        titulo: "Ângulo do Plano Orbital",
        definicao: "Ângulo medido em graus entre o plano da órbita e o equador terrestre. Determina a abrangência do satélite: 0° acompanha o equador, 90° cruza os polos e valores maiores indicam rota invertida."
      },
      {
        termo: "TLE (Two-Line Element)",
        titulo: "Formato de Dados Orbitais",
        definicao: "Padrão internacional codificado em duas linhas de texto com parâmetros físicos essenciais. Fornece os dados matemáticos necessários para calcular e desenhar a posição de qualquer satélite."
      },
      {
        termo: "SGP4 (Modelo de Propagação)",
        titulo: "Algoritmo de Cálculo Orbital",
        definicao: "Modelo matemático analítico que calcula a trajetória real de objetos no espaço. Compensa a gravidade irregular da Terra, a atração da Lua e do Sol e o atrito com as camadas de ar."
      },
      {
        termo: "Termo BSTAR",
        titulo: "Atrito com a Atmosfera",
        definicao: "Parâmetro do TLE que mede o impacto da resistência do ar residual sobre a velocidade do satélite. Quanto maior esse valor, mais rápido o objeto perde altitude e cai rumo ao planeta."
      }
    ]
  },
  {
    categoria: "SUSTENTABILIDADE E MEIO AMBIENTE ESPACIAL",
    itens: [
      {
        termo: "Síndrome de Kessler",
        titulo: "Reação em Cadeia de Detritos",
        definicao: "Cenário onde a densidade de objetos e lixo espacial atinge um ponto crítico. Colisões geram milhares de novos fragmentos descontrolados, criando um efeito cascata que pode inutilizar órbitas inteiras por séculos."
      },
      {
        termo: "Decaimento Orbital",
        titulo: "Descida e Reentrada Natural",
        definicao: "Processo gradual em que o atrito contínuo com as partículas de ar reduz a energia do satélite. O objeto perde altitude ao longo dos meses até mergulhar na atmosfera densa e sofrer desintegração térmica."
      },
      {
        termo: "Poluição por Alumina",
        titulo: "Resíduos Metálicos Atmosféricos",
        definicao: "Poeira química resultante da queima de carcaças de alumínio durante a reentrada de frotas de satélites. As partículas condutoras afetam a camada de ozônio e podem interferir no escudo magnético terrestre."
      },
      {
        termo: "Ponto Nemo",
        titulo: "Cemitério de Naves Espaciais",
        definicao: "Polo oceânico isolado no Pacífico Sul, o local mais distante de qualquer área habitada na Terra. Funciona como zona segura para orientar a queda controlada de satélites desativados e grandes estações espaciais."
      }
    ]
  }
];

// 4. METADADOS CIENTÍFICOS PARA O MÓDULO DE SUSTENTABILIDADE E MEIO AMBIENTE
export const DADOS_SUSTENTABILIDADE = {
  kessler: {
    titulo: "Risco de Colisão",
    fatoChave: "A 27.000 km/h, um fragmento de apenas 1 cm tem a energia de uma granada, perfurando qualquer blindagem aeroespacial moderna.",
    densidadeCriticaFaixa: "Faixa Crítica: 750 a 950 km de altitude",
    historicoImpacto: "A colisão histórica entre os satélites Iridium e Cosmos (2009) gerou mais de 2.000 fragmentos que até hoje forçam a Estação Espacial Internacional a desvios de rota."
  },
  reentrada: {
    titulo: "Queda na Atmosfera",
    fatoChave: "Embora fuselagens vaporizem, tanques de titânio e blocos maciços de aço resistem a 2.000 °C e atingem a superfície.",
    sobrevivenciaPercentual: "Sobrevivência: 10% a 40% de peças pesadas",
    zonaDescarte: "Quedas controladas miram o Ponto Nemo no Pacífico Sul, mas satélites abandonados e desativados reentram de forma imprevisível sobre o planeta."
  },
  magnetosfera: {
    titulo: "Interferência Eletromagnética",
    mecanismo: "A queima contínua de frotas de satélites injeta toneladas de óxido de alumínio e nanopartículas condutoras na alta atmosfera.",
    dadoConfirmado: "Dado Confirmado: Evidência de metais na estratosfera (PNAS)",
    hipoteseEstudo: "Hipótese em Estudo: Modelagem de blindagem condutora (arXiv)",
    riscoCientifico: "Cientistas investigam se essa camada artificial de poeira condutora pode interferir no funcionamento do escudo magnético natural da Terra."
  },
  climaEOzonio: {
    titulo: "Danos na Camada de Ozônio",
    fatoChave: "A poeira de alumínio liberada na queima de satélites catalisa reações de cloro, podendo atrasar a regeneração do ozônio por décadas.",
    impactoQuimico: "Impacto Químico: Poeira de alumínio e fuligem fóssil",
    impactoLancamento: "A fuligem liberada pelos motores de foguetes permanece acumulada por anos no topo da atmosfera, intensificando o aquecimento do planeta."
  }
};



