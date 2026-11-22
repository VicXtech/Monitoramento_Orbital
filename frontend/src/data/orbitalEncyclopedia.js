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
  // MISSÕES BRASILEIRAS
  "22490": {
    nomeOficial: "SCD-1 - Satélite de Coleta de Dados 1",
    pais: "Brasil",
    operador: "INPE - Instituto Nacional de Pesquisas Espaciais",
    anoLancamento: 1993,
    massaKg: 115,
    finalidade: "Coleta dados de chuva, rios e clima em estações espalhadas pelo Brasil, incluindo a Amazônia.",
    historico: "Lançado em 9 de fevereiro de 1993 pelo foguete americano Pegasus, o SCD-1 é o primeiro satélite desenvolvido integralmente no Brasil. Projetado originalmente para operar por apenas 1 ano, superou todas as expectativas da engenharia espacial brasileira e permanece em operação contínua e transmitindo dados há mais de 30 anos.",
    relevancia: "Marco pioneiro do Programa Espacial Brasileiro, validou a competência nacional em subsistemas térmicos, de bordo e controle de atitude por rotação."
  },
  "25504": {
    nomeOficial: "SCD-2 - Satélite de Coleta de Dados 2",
    pais: "Brasil",
    operador: "INPE",
    anoLancamento: 1998,
    massaKg: 117,
    finalidade: "Ajuda a acompanhar rios, previsão do tempo e qualidade do ar junto com o SCD-1.",
    historico: "Lançado em outubro de 1998 a bordo de um lançador Pegasus XL, o SCD-2 sucedeu o SCD-1 trazendo melhorias nos sistemas de telemetria e baterias solares desenvolvidas no Laboratório de Integração e Testes LIT/INPE.",
    relevancia: "Garante a redundância e a perenidade do Sistema Brasileiro de Coleta de Dados Ambientais."
  },
  "47699": {
    nomeOficial: "Amazonia-1",
    pais: "Brasil",
    operador: "INPE / AEB",
    anoLancamento: 2021,
    massaKg: 638,
    finalidade: "Tira fotos do território nacional para vigiar o desmatamento na Amazônia e acompanhar a agricultura.",
    historico: "Lançado em 28 de fevereiro de 2021 pelo lançador indiano PSLV-C51, o Amazonia-1 é o primeiro satélite de sensoriamento remoto de grande porte projetado, integrado, testado e operado 100% pelo Brasil, baseado na Plataforma Multimissão PMM.",
    relevancia: "Consolidou o domínio tecnológico brasileiro na fabricação de satélites estabilizados em 3 eixos e câmeras multiespectrais de alta resolução temporal."
  },
  "44883": {
    nomeOficial: "CBERS-4A - China-Brazil Earth Resources Satellite",
    pais: "Brasil / China",
    operador: "INPE / CAST",
    anoLancamento: 2019,
    massaKg: 1980,
    finalidade: "Tira imagens detalhadas (até 2 metros) da Terra para cuidar das florestas, rios e cidades.",
    historico: "Sexto satélite do programa bilateral sino-brasileiro iniciado em 1988, o CBERS-4A foi lançado em dezembro de 2019 a partir do Centro de Lançamento de Taiyuan, transportando câmeras brasileiras MUX e WFI e chinesas WPM.",
    relevancia: "Exemplo internacional de cooperação Sul-Sul em alta tecnologia espacial e distribuição aberta de dados geoespaciais."
  },

  // ESTAÇÕES ESPACIAIS HABITADAS
  "25544": {
    nomeOficial: "ISS - Estação Espacial Internacional",
    pais: "Multinacional - EUA, Rússia, ESA, Japão e Canadá",
    operador: "NASA / Roscosmos / ESA / JAXA / CSA",
    anoLancamento: 1998,
    massaKg: 450000,
    finalidade: "Laboratório científico habitado contínuo em regime de microgravidade para pesquisas em biologia, física quântica, materiais e medicina espacial.",
    historico: "Iniciada em novembro de 1998 com o módulo russo Zarya, a ISS tem massa próxima a 450 toneladas e dimensões comparáveis a um campo de futebol. É habitada ininterruptamente por astronautas desde novembro de 2000 e viaja a 28.000 km/h, completando uma volta na Terra a cada 90 minutos.",
    relevancia: "A maior e mais complexa estrutura multinacional já construída pela humanidade fora do planeta Terra."
  },
  "48274": {
    nomeOficial: "Tiangong - Estação Espacial Chinesa Tianhe",
    pais: "China",
    operador: "CNSA - China National Space Administration",
    anoLancamento: 2021,
    massaKg: 66000,
    finalidade: "Posto científico orbital permanente da China para missões espaciais de longa duração e física de fluidos.",
    historico: "O módulo central Tianhe foi lançado em abril de 2021, seguido pelos laboratórios científicos Wentian e Mengtian em 2022. A estação abriga equipes de três taikonautas e conta com braço robótico de alta precisão e portas de acoplamento de naves Shenzhou e Tianzhou.",
    relevancia: "Representa a autonomia tecnológica da China em habitação espacial de terceira geração em órbita baixa."
  },

  // TELESCÓPIOS E CIÊNCIA
  "20580": {
    nomeOficial: "Telescópio Espacial Hubble HST",
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
    nomeOficial: "GPS BIIR-2 - NAVSTAR 43",
    pais: "Estados Unidos",
    operador: "Força Espacial dos EUA",
    anoLancamento: 1997,
    massaKg: 2032,
    finalidade: "Envia sinais de localização GPS e horário exato com relógios atômicos de alta precisão.",
    historico: "Parte da constelação GPS em órbita média MEO a cerca de 20.200 km de altitude. Satélites desse bloco garantem posicionamento tridimensional contínuo em qualquer ponto do globo terrestre.",
    relevancia: "Infraestrutura essencial para aviação, navegação marítima, telecomunicações e sincronização de redes elétricas globais."
  },

  // DETRITOS HISTÓRICOS DE COLISÃO E IMPACTO
  "22675": {
    nomeOficial: "Cosmos 2251 - Remanescentes da Colisão de 2009",
    pais: "Rússia",
    operador: "Ministério da Defesa Russo - Desativado",
    anoLancamento: 1993,
    massaKg: 900,
    finalidade: "Satélite de comunicação militar da frota Strela-2M. Encerrou sua vida útil em 1995 e permaneceu como satélite inativo descontrolado.",
    historico: "Em 10 de fevereiro de 2009, o Cosmos 2251 colidiu catastroficamente a 789 km de altitude com o satélite comercial operacional Iridium 33 a uma velocidade relativa de 42.120 km/h (11,7 km/s). O choque destruiu ambos os satélites e gerou mais de 2.000 fragmentos catalogados ao todo (somando os dois satélites) de lixo espacial.",
    relevancia: "Primeiro choque acidental hiperveloz entre dois satélites artificiais intactos na história espacial, marco prático do Efeito Kessler."
  },
  "24946": {
    nomeOficial: "Iridium 33 - Remanescentes da Colisão de 2009",
    pais: "Estados Unidos",
    operador: "Iridium Communications",
    anoLancamento: 1997,
    massaKg: 560,
    finalidade: "Satélite de telefonia global por satélite. Estava plenamente operacional no momento do impacto.",
    historico: "Destruído instantaneamente no evento de colisão com o Cosmos 2251 sobre a península de Taimyr na Sibéria. Seus fragmentos permanecem dispersos em órbitas com inclinação de 86 graus, exigindo manobras evasivas regulares de outros satélites.",
    relevancia: "Evidenciou internacionalmente a vulnerabilidade de constelações comerciais diante de objetos fantasmas desativados em órbita."
  }
};

// 2. GERADOR FACTUAL DINÂMICO PARA SATÉLITES NÃO LISTADOS NOMINALMENTE
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
    operador = "SpaceX - EUA";
    contextoMissao = "Satélite da rede Starlink para levar internet rápida em órbita baixa. Tem pequenos propulsores para desviar de outros objetos e sair de órbita ao fim do uso.";
    historia = `Satélite integrante da megaconstelação Starlink em órbita baixa LEO. Projetado com propulsores de íons de criptônio ou argônio para manutenção de posição e desorbitação ativa.`;
    relevancia = `Representa a nova era de satélites serializados em massa, objeto de intensos debates sobre tráfego espacial e reflexividade astronômica.`;
  } else if (nome.includes("ONEWEB")) {
    funcao = "Telecomunicações Globais em Órbita Baixa";
    operador = "Eutelsat OneWeb - Reino Unido";
    contextoMissao = "Satélite de internet operando a ~1.200 km de altura, com motor para sair de órbita ao fim da missão e não virar lixo espacial.";
    historia = `Satélite de comunicações em constelação operando a cerca de 1.200 km de altitude, fornecendo conectividade corporativa e governamental.`;
    relevancia = `Por operar em altitude mais alta que a Starlink, seus remanescentes exigem descarte propulsionado rigoroso.`;
  } else if (nome.includes("NOAA") || nome.includes("GOES") || nome.includes("METOP")) {
    funcao = "Monitoramento Meteorológico, Oceânico e Climático";
    operador = "Agências Meteorológicas Globais NOAA e EUMETSAT";
    contextoMissao = "Satélite de monitoramento do tempo, tempestades, oceanos e clima.";
    historia = `Plataforma de sensoriamento remoto dedicada ao rastreamento contínuo de sistemas meteorológicos, tempestades tropicais e temperatura dos oceanos.`;
    relevancia = `Fornece dados abertos vitais para modelos climáticos numéricos globais.`;
  } else if (nome.includes("GALILEO") || nome.includes("GLONASS") || nome.includes("BEIDOU") || nome.includes("GPS") || nome.includes("NAVSTAR")) {
    funcao = "Radionavegação e Cronometria Global GNSS";
    operador = sat.pais || (nome.includes("BEIDOU") ? "China" : "Governo Soberano / Defesa");
    const regimeCodigo = (parametrosOrbitais?.regimeCodigo || sat.regime || '').toUpperCase();
    const inclinacao = Number(parametrosOrbitais?.inclinacaoGraus ?? sat.inclinacao ?? 0);
    const perigeu = Number(parametrosOrbitais?.perigeuKm ?? sat.perigeu ?? 0);
    const isIgso = nome.includes("IGSO") || (regimeCodigo === 'GEO' && inclinacao > 15);
    const isGeo = !isIgso && (regimeCodigo === 'GEO' || perigeu > 30000);

    if (isIgso) {
      contextoMissao = "Satélite de radionavegação e temporização atômica em órbita geossíncrona inclinada (IGSO) a ~35.786 km, projetado para garantir sinal contínuo em ângulos elevados sobre a Ásia-Pacífico.";
      historia = `Satélite de navegação em órbita geossíncrona inclinada (IGSO). Emite sinais de radiofrequência codificados com cobertura otimizada em altas elevações.`;
    } else if (isGeo) {
      contextoMissao = "Satélite de radionavegação em órbita geoestacionária (GEO) a ~35.786 km, fornecendo aumento de precisão regional, sincronismo atômico e serviços de mensagens curtas.";
      historia = `Satélite de navegação posicionado em órbita geoestacionária (GEO). Fornece aumento de precisão regional e serviços de mensagens bidirecionais.`;
    } else {
      contextoMissao = "Satélite de radionavegação e temporização atômica em órbita média (MEO), transmitindo sinais codificados para geolocalização global civil e militar.";
      historia = `Satélite de navegação situado na órbita terrestre média MEO. Emite sinais de radiofrequência codificados para cálculo de posição e tempo.`;
    }
    relevancia = `Pilar fundamental da navegação contemporânea e infraestrutura crítica global.`;
  } else if (categoriaId === 4 || nome.includes("ISS") || nome.includes("TIANGONG") || nome.includes("ESTACAO")) {
    funcao = "Estação Espacial Tripulada Permanente";
    operador = "Cooperação Internacional / Agências";
    contextoMissao = "Infraestrutura orbital habitada permanentemente em microgravidade, servindo como laboratório de pesquisas científicas e cooperação tecnológica.";
    historia = `Complexo orbital tripulado com presença humana contínua em órbita baixa da Terra.`;
    relevancia = `Laboratório único para estudos de medicina espacial, física de fluidos e astrobiologia.`;
  } else if (categoriaId === 3 || nome.includes("DEB") || nome.includes("DEBRIS") || nome.includes("R/B") || nome.includes("STAGE")) {
    funcao = "Detrito Espacial Inerte - Lixo Orbital";
    operador = sat.pais || "Nação Lançadora Original";
    if (nome.includes("R/B") || nome.includes("ROCKET")) {
      contextoMissao = "Estágio de foguete deixado no espaço após o lançamento, sem motor nem comunicação.";
      historia = `Corpo de foguete descartado que atingiu velocidade orbital e permaneceu à deriva no espaço desprovido de controle.`;
      relevancia = `Constitui uma das maiores fontes potenciais de novos fragmentos por risco de colisão.`;
    } else {
      contextoMissao = "Pedaço solto de satélite ou foguete viajando a mais de 27.000 km/h sem controle.";
      historia = `Fragmento metálico remanescente de colisão ou degradação térmica em órbita, deslocando-se a velocidades hipersônicas sem propulsão.`;
      relevancia = `Possui energia cinética equivalente a artefatos explosivos devido à velocidade orbital superior a 27.000 km/h.`;
    }
  } else if (categoriaId === 2) {
    funcao = "Satélite Desativado - Inativo em Órbita";
    operador = sat.pais || "Operador Original";
    contextoMissao = "Satélite que já encerrou sua missão e segue em órbita sem controle.";
    historia = `Satélite que encerrou suas operações funcionais por esgotamento de combustível ou falha de bateria, permanecendo em rota passiva.`;
    relevancia = `Satélites inativos não respondem a comandos evasivos, atuando como alvos fixos na teia da Síndrome de Kessler.`;
  } else if (nome.includes("COSMOS") || nome.includes("USA ") || nome.includes("NROL") || nome.includes("KOSMOS") || nome.includes("YAOGAN")) {
    operador = sat.pais || "Defesa Soberana";
    const regimeCodigo = (parametrosOrbitais?.regimeCodigo || sat.regime || 'LEO').toUpperCase();

    if (regimeCodigo === 'GEO') {
      funcao = "Carga Útil de Defesa e Telecomunicações GEO";
      contextoMissao = "Carga útil governamental de defesa e comunicações estratégicas em órbita geoestacionária, operando em posição orbital fixa.";
      historia = `Plataforma governamental de defesa e comunicações estratégicas em órbita geoestacionária.`;
    } else if (regimeCodigo === 'HEO') {
      funcao = "Carga Útil de Vigilância e Comunicação Polar";
      contextoMissao = "Carga útil governamental em órbita altamente elíptica, projetada para comunicações e vigilância em altas latitudes polares.";
      historia = `Plataforma governamental em trajetória elíptica com grande permanência sobre as regiões polares.`;
    } else if (regimeCodigo === 'MEO') {
      funcao = "Carga Útil de Defesa em Órbita Média";
      contextoMissao = "Carga útil governamental de defesa e sincronismo em órbita média especializada, monitorada por vigilância espacial.";
      historia = `Plataforma governamental operando na faixa de órbita média da Terra.`;
    } else {
      funcao = "Carga Útil de Reconhecimento e Defesa";
      contextoMissao = "Carga útil governamental de reconhecimento e sensoriamento em órbita baixa, monitorada por vigilância espacial.";
      historia = `Plataforma de defesa e sensoriamento governamental em órbita especializada.`;
    }
    relevancia = `Operação de alta relevância estratégica sob rastreamento pelas redes globais de defesa aeroespacial.`;
  } else {
    const regime = parametrosOrbitais ? parametrosOrbitais.regimeNome : "Órbita Terrestre";
    const classeInc = parametrosOrbitais ? parametrosOrbitais.classeInclinacao : "Órbita Padrão";
    funcao = `Objeto Operacional em ${regime}`;
    contextoMissao = `Satélite em operação em ${regime} - ${classeInc}, acompanhado continuamente pelos radares em terra.`;
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

// 3. GLOSSÁRIO ESPACIAL
export const GLOSSARIO_ORBITAL = [
  {
    categoria: "REGIMES DE ÓRBITA",
    itens: [
      {
        termo: "LEO - Low Earth Orbit",
        titulo: "Órbita Terrestre Baixa",
        definicao: "Faixa de 160 km a 2.000 km de altitude. Abriga a Estação Espacial Internacional e constelações de satélites de internet. Por concentrar a maior parte dos objetos espaciais, apresenta o maior risco de colisões."
      },
      {
        termo: "MEO - Medium Earth Orbit",
        titulo: "Órbita Terrestre Média",
        definicao: "Faixa intermediária de 2.000 km a 35.786 km de altitude. Região tradicionalmente utilizada por constelações de navegação e geolocalização global, como GPS, Galileo, Glonass e BeiDou."
      },
      {
        termo: "GEO - Geostationary Earth Orbit",
        titulo: "Órbita Geoestacionária",
        definicao: "Órbita circular a 35.786 km de altitude sobre a linha do equador. O satélite acompanha com precisão a rotação da Terra em 24 horas, parecendo imóvel no céu para quem observa da superfície."
      },
      {
        termo: "HEO - Highly Elliptical Orbit",
        titulo: "Órbita Muito Elíptica",
        definicao: "Trajetória oval com altitude bastante variável. O satélite passa veloz e próximo da Terra no ponto mais baixo e passa a maior parte do tempo no ponto mais alto, cobrindo regiões polares isoladas."
      },
      {
        termo: "VLEO - Very Low Earth Orbit",
        titulo: "Órbita Terrestre Muito Baixa",
        definicao: "Faixa mais baixa do espaço usado por satélites, entre 160 km e 450 km. Por ficar próxima ao ar da Terra, exige correções de altura com mais frequência."
      },
      {
        termo: "SSO - Sun-Synchronous Orbit",
        titulo: "Órbita Heliossíncrona",
        definicao: "Tipo especial de órbita polar em que o satélite passa por cada lugar da Terra sempre no mesmo horário do Sol. É ideal para fotografar florestas e nuvens sempre com a mesma iluminação."
      },
      {
        termo: "GTO - Geostationary Transfer Orbit",
        titulo: "Órbita de Transferência",
        definicao: "Caminho oval temporário usado por foguetes para levar satélites da órbita baixa até a órbita geoestacionária (35.786 km)."
      },
      {
        termo: "IGSO - Inclined Geosynchronous Orbit",
        titulo: "Órbita Geossíncrona Inclinada",
        definicao: "Órbita à mesma altura da GEO (35.786 km), mas inclinada em relação ao equador. No mapa, o satélite parece desenhar um \"8\" no céu, cobrindo áreas fora da linha do equador."
      },
      {
        termo: "Órbita Retrógrada",
        titulo: "Sentido Contrário à Terra",
        definicao: "Órbita com ângulo acima de 90°, em que o satélite gira no sentido oposto ao da rotação da Terra."
      }
    ]
  },
  {
    categoria: "CONCEITOS E DADOS ESPACIAIS",
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
        termo: "Excentricidade",
        titulo: "Formato da Órbita",
        definicao: "Número de 0 a 1 que indica o formato da rota. Valor próximo de 0 significa uma órbita redonda e circular; valor mais alto indica uma órbita oval e alongada."
      },
      {
        termo: "NORAD ID e COSPAR",
        titulo: "Códigos de Identificação",
        definicao: "Números de registro de cada objeto no espaço. O NORAD ID é o número sequencial no radar, e o COSPAR indica o ano e o lançamento de origem."
      },
      {
        termo: "TLE - Two-Line Element",
        titulo: "Formato de Dados Orbitais",
        definicao: "Padrão internacional codificado em duas linhas de texto com parâmetros físicos essenciais. Fornece os dados matemáticos necessários para calcular e desenhar a posição de qualquer satélite."
      },
      {
        termo: "SGP4 - Modelo de Propagação",
        titulo: "Algoritmo de Cálculo Orbital",
        definicao: "Modelo matemático usado para calcular a posição dos satélites em tempo real, considerando o achatamento da Terra e o atrito do ar (com o ramo SDP4 incluindo a gravidade da Lua e do Sol para órbitas distantes)."
      },
      {
        termo: "Termo BSTAR",
        titulo: "Atrito com a Atmosfera",
        definicao: "Número usado nos dados TLE que indica o quanto o ar rarefeito freia o satélite. Quanto maior esse valor, mais rápido o objeto perde altitude e cai."
      },
      {
        termo: "RCS - Radar Cross Section",
        titulo: "Tamanho no Radar",
        definicao: "Medida de quanto um objeto reflete o sinal dos radares da Terra. Ajuda a estimar se ele é pequeno, médio ou grande, mesmo a milhares de quilômetros de distância."
      },
      {
        termo: "RAAN - Ascensão Reta do Nó",
        titulo: "Orientação da Órbita",
        definicao: "Ângulo que mostra para qual direção a órbita está virada no espaço em relação à Terra. Ajuda a saber por quais regiões do planeta o satélite vai passar."
      },
      {
        termo: "SSN - Space Surveillance Network",
        titulo: "Rede de Vigilância Espacial",
        definicao: "Rede mundial de radares e telescópios que detecta, acompanha e cataloga dezenas de milhares de objetos artificiais ao redor da Terra."
      },
      {
        termo: "GNSS - Global Navigation Satellite System",
        titulo: "Navegação Global por Satélite",
        definicao: "Nome dado aos sistemas de localização por satélite que funcionam no mundo todo, como GPS (EUA), Galileo (Europa), GLONASS (Rússia) e BeiDou (China)."
      },
      {
        termo: "OMM e SATCAT",
        titulo: "Catálogos Orbitais Públicos",
        definicao: "Formatos oficiais do CelesTrak. O OMM traz os dados de órbita no padrão moderno (JSON) e o SATCAT lista informações do objeto, como país, data e local de lançamento."
      },
      {
        termo: "Dia Sideral",
        titulo: "Giro Real da Terra",
        definicao: "Tempo que a Terra leva para dar uma volta completa em torno de si mesma em relação às estrelas: 23 horas, 56 minutos e 4 segundos — exatamente o período da órbita GEO."
      },
      {
        termo: "Cinturões de Van Allen",
        titulo: "Zonas de Radiação",
        definicao: "Duas regiões ao redor da Terra onde o campo magnético prende partículas carregadas vindas do espaço. Satélites que cruzam essas áreas enfrentam radiação forte."
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
        definicao: "Perda gradual de altitude causada pelo atrito com o ar rarefeito. Com o tempo, o objeto desce até entrar na atmosfera mais densa e queimar pelo calor."
      },
      {
        termo: "Poluição por Alumina",
        titulo: "Resíduos Metálicos Atmosféricos",
        definicao: "Poeira metálica liberada quando satélites de alumínio queimam na reentrada. Essas partículas ficam na alta atmosfera e podem prejudicar a camada de ozônio."
      },
      {
        termo: "Ponto Nemo",
        titulo: "Cemitério de Naves Espaciais",
        definicao: "Polo oceânico isolado no Pacífico Sul, o local mais distante de qualquer área habitada na Terra. Funciona como zona segura para orientar a queda controlada de satélites desativados e grandes estações espaciais."
      },
      {
        termo: "Órbita Cemitério",
        titulo: "Zona de Descarte Espacial",
        definicao: "Faixa acima de 36.000 km para onde satélites distantes são enviados no fim da vida útil, liberando espaço nas órbitas ativas sem risco de colisão."
      },
      {
        termo: "SIO - Score de Impacto Orbital",
        titulo: "Índice de Risco do Objeto",
        definicao: "Nota de 0 a 100 usada na plataforma para medir o risco ambiental de um objeto, considerando sua altitude, o tráfego ao redor e se ele possui motor para desviar."
      },
      {
        termo: "IADC - Inter-Agency Debris Committee",
        titulo: "Comitê Interagências de Detritos",
        definicao: "Comitê internacional que reúne 13 agências espaciais (como NASA, ESA, JAXA, CNSA, Roscosmos e ISRO) para definir diretrizes globais de prevenção ao lixo espacial."
      },
      {
        termo: "FCC - Regra de 5 Anos",
        titulo: "Comissão Federal de Comunicações",
        definicao: "Regra do órgão regulador dos EUA (FCC 22-74) que obriga satélites em órbita baixa a sair de órbita em até 5 anos após o fim do uso, substituindo o antigo prazo de 25 anos."
      },
      {
        termo: "Passivação de Sistemas",
        titulo: "Desligamento Seguro",
        definicao: "Procedimento obrigatório ao encerrar o uso de um satélite: esvaziar os tanques de combustível e descarregar as baterias para evitar que ele exploda no espaço."
      },
      {
        termo: "ODPO / NASA",
        titulo: "Programa de Detritos da NASA",
        definicao: "Escritório da NASA responsável por estudar o lixo espacial, testar impactos em alta velocidade e criar regras técnicas de segurança."
      },
      {
        termo: "Conjunção Orbital",
        titulo: "Aproximação de Risco",
        definicao: "Quando dois objetos no espaço passam muito perto um do outro em alta velocidade, exigindo manobra de desvio para evitar uma batida."
      },
      {
        termo: "ASAT - Anti-Satellite Weapon",
        titulo: "Arma Antissatélite",
        definicao: "Míssil ou tecnologia criada para destruir satélites em órbita. Testes desse tipo já geraram milhares de fragmentos de lixo espacial."
      },
      {
        termo: "PMD - Post-Mission Disposal",
        titulo: "Descarte Pós-Missão",
        definicao: "Plano para retirar um satélite do caminho quando ele termina sua missão, seja levando-o para queimar na atmosfera ou movendo-o para uma órbita cemitério."
      },
      {
        termo: "UIT - União Internacional de Telecomunicações",
        titulo: "Vagas no Espaço",
        definicao: "Agência da ONU que organiza as posições (slots) dos satélites na órbita geoestacionária e as frequências de rádio para evitar interferências entre países."
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
    historicoImpacto: "A colisão histórica entre os satélites Iridium e Cosmos em 2009 gerou mais de 2.000 fragmentos que até hoje forçam a Estação Espacial Internacional a desvios de rota."
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
    dadoConfirmado: "Dado Confirmado: Evidência de metais na estratosfera PNAS",
    hipoteseEstudo: "Hipótese em Estudo: Modelagem de blindagem condutora arXiv",
    riscoCientifico: "Cientistas investigam se essa camada artificial de poeira condutora pode interferir no funcionamento do escudo magnético natural da Terra."
  },
  climaEOzonio: {
    titulo: "Danos na Camada de Ozônio",
    fatoChave: "A poeira de alumínio liberada na queima de satélites catalisa reações de cloro, podendo atrasar a regeneração do ozônio por décadas.",
    impactoQuimico: "Impacto Químico: Poeira de alumínio e fuligem fóssil",
    impactoLancamento: "A fuligem liberada pelos motores de foguetes permanece acumulada por anos no topo da atmosfera, intensificando o aquecimento do planeta."
  }
};



