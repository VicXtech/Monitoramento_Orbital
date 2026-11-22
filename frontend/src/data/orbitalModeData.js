// Catalogo de dados oficiais do Modo Orbital Figurativo
// Fontes: ESA Space Environment Report, NASA ODPO e INPE

export const CAMADAS_ORBITAIS = {
  leo: {
    id: 'leo',
    nome: 'Órbita Terrestre Baixa',
    sigla: 'LEO',
    cor: '#38BDF8',
    altitudeCurta: '160 a 2.000 km',
    altitudeSub: 'Faixa mais cheia de objetos',
    trafegoGlobal: '~84% do total',
    trafegoSub: 'Fonte: Catálogo ESA',
    risco: 'Crítico',
    velocidadeFicha: '~7,8 km/s',
    velocidadeSub: 'Velocidade constante rápida',
    periodoFicha: '90 a 120 min',
    periodoSub: '14 a 16 voltas diárias',
    subregioes: [
      {
        nome: 'VLEO - 160 a 450 km',
        desc: 'Onde ficam as Estações Espaciais e satélites de fotos bem detalhadas.',
        trafego: 'Estações ISS e Tiangong'
      },
      {
        nome: 'Megaconstelações - 500 a 600 km',
        desc: 'Grandes grupos de satélites que levam internet rápida para o planeta inteiro.',
        trafego: 'Satélites Starlink, OneWeb'
      },
      {
        nome: 'Heliossíncrona (SSO) - 600 a 900 km',
        desc: 'Passa por cada lugar sempre no mesmo horário do Sol, ideal para acompanhar o clima e as florestas.',
        trafego: 'Satélites CBERS-4A, Amazonia-1'
      },
      {
        nome: 'Zona Crítica - 750 a 950 km',
        desc: 'Região com mais lixo espacial acumulado de colisões e explosões antigas.',
        trafego: 'Fragmentos de colisões'
      }
    ],
    matrizDiagnostico: [
      {
        id: 'saturacao',
        titulo: 'Saturação e Manobras',
        badge: 'CRÍTICO',
        nivel: 'critico',
        destaque: 'Milhares de desvios/ano',
        pct: 95,
        detalhe: 'Frotas de satélites e a ISS precisam desviar de fragmentos o tempo todo.'
      },
      {
        id: 'persistencia',
        titulo: 'Permanência do Lixo',
        badge: 'ALTO',
        nivel: 'medio',
        destaque: '5 a 100+ anos em órbita',
        pct: 75,
        detalhe: 'Abaixo de 500 km cai rápido; acima de 800 km o ar é muito fino e o lixo fica por séculos.'
      },
      {
        id: 'energia_colisao',
        titulo: 'Força da Batida',
        badge: 'CRÍTICO',
        nivel: 'critico',
        destaque: 'Choque a ~10–15 km/s',
        pct: 95,
        detalhe: 'Um pedaço de apenas 1 cm bate com a mesma energia de uma granada de mão.'
      },
      {
        id: 'destino_reentrada',
        titulo: 'Poluição ao Voltar',
        badge: 'CRÍTICO',
        nivel: 'critico',
        destaque: 'Poeira de Metais',
        pct: 90,
        detalhe: 'A queima diária de satélites solta poeira de alumínio e lítio nas camadas altas do ar.'
      }
    ],
    matrizImpacto: {
      espaco: {
        titulo: 'NO ESPAÇO',
        subtitulo: 'Síndrome de Kessler',
        desc: 'Batidas a até 14 km/s criam nuvens de estilhaços que podem impedir novos voos espaciais.',
        consequencia: 'Rotas perigosas demais para usar'
      },
      terra: {
        titulo: 'NO PLANETA TERRA',
        subtitulo: 'Poluição na Alta Atmosfera',
        desc: 'A queima de muitos satélites libera óxidos de alumínio, cobre e lítio que atacam a camada de ozônio.',
        consequencia: 'Dano ao ozônio e perda de serviços'
      }
    },
    acoesNormas: [
      { badge: 'FCC 22-74', titulo: 'Regra dos 5 Anos', desc: 'Obrigação de retirar o satélite de órbita em até 5 anos após o fim do uso.' },
      { badge: 'ESA Zero Debris', titulo: 'Remoção Ativa', desc: 'Garras robóticas e redes, como na missão ClearSpace-1 da ESA (prevista para 2030, visando o satélite PROBA-1), para capturar lixo grande.' },
      { badge: 'Engenharia Verde', titulo: 'Satélites Limpos', desc: 'Pesquisas com materiais mais seguros e satélites de madeira que geram menos fumaça tóxica ao queimar.' }
    ],
    velocimetro: {
      velocidadeKmS: 7.8,
      multiplicador: '30x mais rápido que o avião',
      duracaoSegundos: 0.8
    },
    radarCobertura: {
      tipo: 'polar',
      rotulo: 'Órbita Polar / SSO',
      desc: 'Varredura diária de polo a polo sobre o Brasil.'
    },
    impactoCotidiano: [
      { titulo: 'Monitoramento Florestal', desc: 'Alertas diários de desmatamento pelo INPE.' },
      { titulo: 'Previsão Meteorológica', desc: 'Rastreamento de frentes frias e temporais.' },
      { titulo: 'Internet em Áreas Remotas', desc: 'Conexão de baixa latência para o interior.' }
    ],
    pinosRelacionados: ['iridium-cosmos-2009', 'fengyun-2007', 'inpe-brasil-1993', 'cerise-1996']
  },
  meo: {
    id: 'meo',
    nome: 'Órbita Terrestre Média',
    sigla: 'MEO',
    cor: '#5B8DEF',
    altitudeCurta: '2.000 a 35.786 km',
    altitudeSub: 'Corredores de navegação global',
    trafegoGlobal: '~2% do total',
    trafegoSub: 'Fonte: Catálogo ESA',
    risco: 'Moderado',
    velocidadeFicha: '~3,9 km/s',
    velocidadeSub: 'Velocidade intermediária',
    periodoFicha: '~12 horas',
    periodoSub: '2 voltas por dia',
    subregioes: [
      {
        nome: 'Internet de Baixo Atraso - 8.000 km',
        desc: 'Órbita intermediária para conexões rápidas de alta capacidade, com menos atraso que a GEO.',
        trafego: 'Constelações O3b e O3b mPOWER'
      },
      {
        nome: 'Corredor GNSS - 19.100 a 23.222 km',
        desc: 'Satélites usados mundialmente para localização por GPS e acerto de relógios.',
        trafego: 'Constelações GPS, Galileo, GLONASS, BeiDou'
      },
      {
        nome: 'Cinturões de Radiação',
        desc: 'Regiões com partículas presas pelo campo magnético da Terra.',
        trafego: 'Cinturões de Van Allen'
      }
    ],
    matrizDiagnostico: [
      {
        id: 'saturacao',
        titulo: 'Espaço Entre Frotas',
        badge: 'BAIXO',
        nivel: 'baixo',
        destaque: 'Bastante espaço livre',
        pct: 20,
        detalhe: 'Grande distância entre os satélites reduz bastante o risco de batida direta.'
      },
      {
        id: 'persistencia',
        titulo: 'Permanência do Lixo',
        badge: 'CRÍTICO',
        nivel: 'critico',
        destaque: '> 10.000 anos no espaço',
        pct: 100,
        detalhe: 'Quase não existe ar nessa altura; qualquer sucata deixada lá fica por milênios.'
      },
      {
        id: 'energia_colisao',
        titulo: 'Risco de Explosão',
        badge: 'MODERADO',
        nivel: 'medio',
        destaque: 'Cruzamentos a ~4 km/s',
        pct: 45,
        detalhe: 'Baterias e foguetes antigos nessa região de radiação podem explodir e atingir rotas de GPS.'
      },
      {
        id: 'destino_reentrada',
        titulo: 'Para Onde Vão',
        badge: 'MODERADO',
        nivel: 'medio',
        destaque: 'Órbitas de Descarte',
        pct: 40,
        detalhe: 'Como não caem sozinhos, satélites aposentados são movidos para fora das rotas GNSS.'
      }
    ],
    matrizImpacto: {
      espaco: {
        titulo: 'NO ESPAÇO',
        subtitulo: 'Risco aos Satélites de Navegação',
        desc: 'Explosões de baterias antigas nos Cinturões de Van Allen ameaçam as frotas de GPS.',
        consequencia: 'Risco para os sistemas GNSS (GPS)'
      },
      terra: {
        titulo: 'NO PLANETA TERRA',
        subtitulo: 'Dependência no Dia a Dia',
        desc: 'Perder essa faixa afetaria aviões, navios, sistemas bancários e mapas no celular.',
        consequencia: 'Falhas na aviação, bancos e navegação'
      }
    },
    acoesNormas: [
      { badge: 'IADC', titulo: 'Órbitas de Descarte', desc: 'Mover satélites aposentados para zonas seguras fora das rotas de navegação GNSS.' },
      { badge: 'Diretriz', titulo: 'Passivação de Energia', desc: 'Esvaziar baterias e tanques de combustível para impedir que o satélite exploda depois de desativado.' }
    ],
    velocimetro: {
      velocidadeKmS: 3.9,
      multiplicador: '15x mais rápido que o avião',
      duracaoSegundos: 1.6
    },
    radarCobertura: {
      tipo: 'constelacao',
      rotulo: 'Constelação GNSS',
      desc: 'Vários satélites enviam sinais ao mesmo tempo para calcular sua posição exata.'
    },
    impactoCotidiano: [
      { titulo: 'Navegação GPS', desc: 'Posicionamento para trânsito e aviação civil.' },
      { titulo: 'Sincronismo Bancário', desc: 'Validação de horário de transações financeiras.' },
      { titulo: 'Resgate e Emergência', desc: 'Sinal de socorro marítimo e aéreo mundial.' }
    ],
    pinosRelacionados: ['vanguard-1958', 'navstar-gps-1978', 'galileo-resgate-2014']
  },
  geo: {
    id: 'geo',
    nome: 'Órbita Geoestacionária',
    sigla: 'GEO',
    cor: '#7C69EF',
    altitudeCurta: '35.786 km fixos',
    altitudeSub: 'Anel sobre a linha do equador',
    trafegoGlobal: '~9% do total',
    trafegoSub: 'Fonte: Catálogo ESA',
    risco: 'Crítico',
    velocidadeFicha: '~3,07 km/s',
    velocidadeSub: 'Acompanha o giro da Terra',
    periodoFicha: '23h 56m 04s',
    periodoSub: '1 volta por dia sideral',
    subregioes: [
      {
        nome: 'Anel Principal',
        desc: 'Grandes satélites de TV, internet, previsão do tempo contínua e defesa.',
        trafego: 'Satélites SGDC, GOES, Meteosat'
      },
      {
        nome: 'Órbita Geossíncrona Inclinada (IGSO)',
        desc: 'Mesma altura da GEO, mas inclinada: desenha um "8" no céu para cobrir regiões fora do equador.',
        trafego: 'Sistemas BeiDou IGSO e QZSS Michibiki'
      },
      {
        nome: 'Vagas da UIT',
        desc: 'Posições no anel organizadas pela ONU (UIT) para que um satélite não atrapalhe o sinal do outro.',
        trafego: 'Vagas alocadas da UIT'
      },
      {
        nome: 'Super-GEO +300 km',
        desc: 'Órbita cemitério acima da faixa ativa, usada para guardar satélites aposentados.',
        trafego: 'Satélites aposentados'
      }
    ],
    matrizDiagnostico: [
      {
        id: 'saturacao',
        titulo: 'Espaço Disputado',
        badge: 'ALTO',
        nivel: 'medio',
        destaque: 'Anel Único Cheio',
        pct: 75,
        detalhe: 'Mais de 550 satélites ativos ficam alinhados na mesma faixa estreita sobre o equador.'
      },
      {
        id: 'persistencia',
        titulo: 'Permanência do Lixo',
        badge: 'CRÍTICO',
        nivel: 'critico',
        destaque: '> 1 milhão de anos',
        pct: 100,
        detalhe: 'Longe demais da atmosfera para cair; qualquer objeto deixado ali fica preso para sempre.'
      },
      {
        id: 'energia_colisao',
        titulo: 'Efeito Dominó',
        badge: 'ALTO',
        nivel: 'medio',
        destaque: 'Risco no Anel',
        pct: 70,
        detalhe: 'Satélites sem controle podem vagar pelo anel e ameaçar vagas ativas muito disputadas.'
      },
      {
        id: 'destino_reentrada',
        titulo: 'Para Onde Vão',
        badge: 'MODERADO',
        nivel: 'medio',
        destaque: 'Cemitério +300 km',
        pct: 50,
        detalhe: 'O combustível final é usado para subir o satélite até a faixa cemitério Super-GEO.'
      }
    ],
    matrizImpacto: {
      espaco: {
        titulo: 'NO ESPAÇO',
        subtitulo: 'Satélites Zumbis',
        desc: 'Satélites quebrados continuam passeando pelo anel e podem bloquear vagas importantes.',
        consequencia: 'Perda permanente de vagas no anel GEO'
      },
      terra: {
        titulo: 'NO PLANETA TERRA',
        subtitulo: 'Serviços Essenciais',
        desc: 'Sem esses satélites, faltariam imagens contínuas de furacões, previsão de tempestades e links de segurança.',
        consequencia: 'Prejuízo a alertas de clima e comunicações'
      }
    },
    acoesNormas: [
      { badge: 'IADC', titulo: 'Órbita Cemitério +300 km', desc: 'Guardar combustível suficiente para subir o satélite até a órbita cemitério ao fim do uso.' },
      { badge: 'Robótica MEV', titulo: 'Rebocadores Espaciais', desc: 'Veículos robôs que se encaixam em satélites sem combustível para estender a vida útil em 5 a 10 anos.' }
    ],
    velocimetro: {
      velocidadeKmS: 3.07,
      multiplicador: '12x mais rápido que o avião',
      duracaoSegundos: 2.0
    },
    radarCobertura: {
      tipo: 'geo',
      rotulo: 'Anel Sincronizado',
      desc: 'Ponto fixo iluminando o mesmo continente.'
    },
    impactoCotidiano: [
      { titulo: 'Monitoramento de Furacões', desc: 'Imagens contínuas de tempestades e clima.' },
      { titulo: 'Comunicações Estratégicas', desc: 'Canais de dados seguros e defesa nacional.' },
      { titulo: 'Transmissão de Mídia', desc: 'Cobertura contínua de TV aberta e rádio.' }
    ],
    pinosRelacionados: ['mev1-intelsat-2020', 'galaxy15-2010']
  },
  heo: {
    id: 'heo',
    nome: 'Órbita Altamente Elíptica',
    sigla: 'HEO',
    cor: '#A864E8',
    altitudeCurta: '200 a 40.000+ km',
    altitudeSub: 'Órbita alongada de perigeu baixo',
    trafegoGlobal: '~5% do total',
    trafegoSub: 'Fonte: Catálogo ESA',
    risco: 'Elevado',
    velocidadeFicha: '1,5 a 10 km/s',
    velocidadeSub: 'Muito rápida perto da Terra, lenta no ponto mais alto',
    periodoFicha: '12h a 57h+',
    periodoSub: 'Varia conforme o alongamento da órbita',
    subregioes: [
      {
        nome: 'Transferência GTO',
        desc: 'Caminho oval usado para levar satélites até órbitas altas, onde muitos estágios de foguete acabam descartados.',
        trafego: 'Estágios superiores de foguetes e satélites rumo a GEO'
      },
      {
        nome: 'Órbitas Molniya e Tundra',
        desc: 'Órbitas inclinadas em 63,4 graus para manter o satélite por mais tempo sobre os polos.',
        trafego: 'Satélites de comunicação polar, defesa e meteorologia'
      },
      {
        nome: 'Observatórios Científicos',
        desc: 'Telescópios e sensores que estudam o campo magnético da Terra e a radiação espacial.',
        trafego: 'Satélites científicos Salsa e Cluster'
      }
    ],
    matrizDiagnostico: [
      {
        id: 'saturacao',
        titulo: 'Cruzamento de Camadas',
        badge: 'ALTO',
        nivel: 'medio',
        destaque: 'Cruza 3 Camadas',
        pct: 75,
        detalhe: 'A órbita oval atravessa as faixas LEO, MEO e GEO duas vezes a cada volta.'
      },
      {
        id: 'persistencia',
        titulo: 'Permanência do Lixo',
        badge: 'MODERADO',
        nivel: 'medio',
        destaque: 'Décadas a Séculos',
        pct: 60,
        detalhe: 'O ar só freia o objeto nos poucos minutos em que ele passa mais perto da Terra.'
      },
      {
        id: 'energia_colisao',
        titulo: 'Força da Batida',
        badge: 'CRÍTICO',
        nivel: 'critico',
        destaque: 'Até 10 km/s no Perigeu',
        pct: 95,
        detalhe: 'Restos de foguetes em transferência GTO cruzam a órbita baixa em altíssima velocidade.'
      },
      {
        id: 'destino_reentrada',
        titulo: 'Destino Final',
        badge: 'MODERADO',
        nivel: 'medio',
        destaque: 'Queda no Ponto Nemo',
        pct: 65,
        detalhe: 'Tanques de titânio e peças pesadas não derretem por completo e precisam cair em áreas desabitadas do oceano.'
      }
    ],
    matrizImpacto: {
      espaco: {
        titulo: 'NO ESPAÇO',
        subtitulo: 'Cruzamento Perigoso',
        desc: 'Foguetes abandonados em GTO cruzam LEO, MEO e GEO duas vezes por dia a até 10 km/s.',
        consequencia: 'Risco de batidas cruzando 3 camadas'
      },
      terra: {
        titulo: 'NO PLANETA TERRA',
        subtitulo: 'Queda de Peças Pesadas',
        desc: 'Estágios de várias toneladas em aço e titânio podem resistir ao calor e atingir solo ou mar.',
        consequencia: 'Queda de tanques e peças de titânio'
      }
    },
    acoesNormas: [
      { badge: 'ESA 2024', titulo: 'Reentrada Guiada no Ponto Nemo', desc: 'Manobras planejadas para fazer o satélite cair com segurança em região deserta do Oceano Pacífico.' },
      { badge: 'IADC', titulo: 'Passivação e Queima Final', desc: 'Esvaziar tanques e usar o motor do 2º estágio para tirá-lo de órbita logo após soltar a carga.' }
    ],
    velocimetro: {
      velocidadeKmS: 10.0,
      multiplicador: 'Até 40x mais rápido',
      duracaoSegundos: 0.6
    },
    radarCobertura: {
      tipo: 'eliptica',
      rotulo: 'Órbita Elíptica',
      desc: 'Fica horas sobre o ponto mais alto e passa bem rápido perto da Terra.'
    },
    impactoCotidiano: [
      { titulo: 'Comunicação Polar', desc: 'Conexão estável em rotas de voo árticas.' },
      { titulo: 'Clima Espacial', desc: 'Monitoramento de radiação e vento solar.' },
      { titulo: 'Pesquisa da Magnetosfera', desc: 'Sensores de plasma no espaço profundo.' }
    ],
    pinosRelacionados: ['salsa-cluster-2024', 'molniya-1965']
  }
};

export const PINOS_HISTORICOS = [
  {
    id: 'iridium-cosmos-2009',
    ano: 2009,
    nome: 'Colisão Iridium 33 e Cosmos 2251',
    localNome: 'Sibéria, Rússia',
    posicao: { lat: 72.5, lon: 97.0, altKm: 789 },
    camadaId: 'leo',
    fatoTecnico: 'Batida acidental a 11,7 km/s entre um satélite em funcionamento e um antigo desativado, criando mais de 2.000 fragmentos rastreados.',
    licaoSustentabilidade: 'Mostrou na prática que satélites abandonados causam colisões graves e exigem acompanhamento diário de aproximações.'
  },
  {
    id: 'fengyun-2007',
    ano: 2007,
    nome: 'Teste ASAT Fengyun-1C',
    localNome: 'China Central',
    posicao: { lat: 35.0, lon: 102.0, altKm: 865 },
    camadaId: 'leo',
    fatoTecnico: 'Destruição intencional de um satélite por míssil antissatélite (ASAT) na parte alta da órbita LEO, gerando mais de 3.500 fragmentos rastreáveis.',
    licaoSustentabilidade: 'Nessa altura o lixo espacial fica em órbita por séculos, o que levou vários países a pedir o fim dos testes de armas ASAT.'
  },
  {
    id: 'salsa-cluster-2024',
    ano: 2024,
    nome: 'Reentrada do Satélite Salsa',
    localNome: 'Ponto Nemo, Pacífico Sul',
    posicao: { lat: -45.0, lon: -125.0, altKm: 120 },
    camadaId: 'heo',
    fatoTecnico: 'Primeira queda planejada de um satélite europeu em órbita muito elíptica, guiado para cair com segurança no oceano.',
    licaoSustentabilidade: 'Marco da iniciativa Zero Debris da ESA, mostrando como zerar o risco de destroços caírem perto de pessoas.'
  },
  {
    id: 'inpe-brasil-1993',
    ano: 1993,
    nome: 'Pioneirismo SCD-1 e Monitoramento INPE',
    localNome: 'Lançado da Flórida (EUA) · Operado pelo INPE (Brasil)',
    posicao: { lat: -2.3, lon: -44.4, altKm: 750 },
    camadaId: 'leo',
    fatoTecnico: 'Fabricado no Brasil pelo INPE e lançado em 1993 por um foguete Pegasus a partir da Flórida, o SCD-1 durou mais de 30 vezes a previsão inicial de 1 ano; ao lado do CBERS-4A e Amazonia-1, ajuda a vigiar o meio ambiente brasileiro.',
    licaoSustentabilidade: 'Mostra como precisamos manter as órbitas limpas para continuar monitorando o clima e o desmatamento no Brasil.'
  },
  {
    id: 'cerise-1996',
    ano: 1996,
    nome: 'Impacto no Satélite Cerise',
    localNome: 'Europa / Atlântico',
    posicao: { lat: 45.0, lon: 15.0, altKm: 666 },
    camadaId: 'leo',
    fatoTecnico: 'Primeira batida confirmada da história entre um satélite em operação e um pedaço catalogado de foguete Ariane.',
    licaoSustentabilidade: 'Alertou as agências espaciais do mundo todo sobre o perigo de estágios de foguetes explodirem no espaço.'
  },
  {
    id: 'vanguard-1958',
    ano: 1958,
    nome: 'Vanguard 1 em Órbita',
    localNome: 'Cabo Canaveral, EUA',
    posicao: { lat: 28.5, lon: -80.5, altKm: 2235 },
    camadaId: 'meo',
    fatoTecnico: 'Objeto humano mais antigo ainda no espaço, em órbita elíptica de 654 km a 3.820 km; parou de responder em 1964, mas vai continuar lá por séculos.',
    licaoSustentabilidade: 'Mostra o quanto satélites sem mecanismo para sair de órbita permanecem circulando a Terra por gerações.'
  },
  {
    id: 'navstar-gps-1978',
    ano: 1978,
    nome: 'Lançamento do Navstar 1 - Primeiro Satélite GPS',
    localNome: 'Corredor GNSS',
    posicao: { lat: 10.0, lon: -60.0, altKm: 20200 },
    camadaId: 'meo',
    fatoTecnico: 'Primeiro satélite do sistema GPS colocado em órbita de 12 horas, abrindo caminho para os mapas e relógios de precisão que usamos hoje.',
    licaoSustentabilidade: 'Criou os corredores de navegação mundial que hoje precisam de faixas livres para descartar satélites antigos.'
  },
  {
    id: 'galileo-resgate-2014',
    ano: 2014,
    nome: 'Resgate Orbital dos Satélites Galileo 5 e 6',
    localNome: 'Cinturões de Radiação',
    posicao: { lat: -25.0, lon: 15.0, altKm: 17000 },
    camadaId: 'meo',
    fatoTecnico: 'Uma falha no foguete deixou dois satélites europeus na órbita errada; engenheiros da ESA ligaram os motores próprios dos satélites e conseguiram corrigir a rota em MEO.',
    licaoSustentabilidade: 'Mostrou como manobras bem planejadas podem salvar missões e o perigo de foguetes perdidos cruzarem as zonas de radiação.'
  },
  {
    id: 'mev1-intelsat-2020',
    ano: 2020,
    nome: 'Acoplamento Robótico MEV-1 e Intelsat 901',
    localNome: 'Anel Geoestacionário',
    posicao: { lat: 0.0, lon: -27.5, altKm: 35786 },
    camadaId: 'geo',
    fatoTecnico: 'Primeiro encaixe comercial em órbita GEO (2020), estendendo a vida útil do Intelsat 901 por 5 anos. Em abril de 2025, o MEV-1 terminou o trabalho, levou o satélite para a órbita cemitério e se soltou com sucesso.',
    licaoSustentabilidade: 'Provou que é possível dar manutenção no espaço e rebocar satélites sem combustível até uma faixa segura de descarte.'
  },
  {
    id: 'galaxy15-2010',
    ano: 2010,
    nome: 'Deriva do Satélite Zumbi Galaxy 15',
    localNome: 'Anel Geoestacionário',
    posicao: { lat: 0.0, lon: -133.0, altKm: 35786 },
    camadaId: 'geo',
    fatoTecnico: 'Perdeu o contato com a Terra, mas continuou ligado e transmitindo sinais enquanto vagava pelo anel GEO por meses, ameaçando outros satélites.',
    licaoSustentabilidade: 'Levou à criação de regras mais rígidas para que satélites desliguem seus transmissores automaticamente quando perdem controle.'
  },
  {
    id: 'molniya-1965',
    ano: 1965,
    nome: 'Pioneirismo da Órbita Molniya-1',
    localNome: 'Apogeu Hemisfério Norte',
    posicao: { lat: 63.4, lon: 90.0, altKm: 39500 },
    camadaId: 'heo',
    fatoTecnico: 'Primeiro satélite a usar a inclinação especial de 63,4° para passar mais horas sobre regiões distantes ao norte, como a Sibéria e o Ártico.',
    licaoSustentabilidade: 'Mostrou que objetos nessa rota muito alongada atravessam LEO, MEO e GEO a cada volta, aumentando o risco de batida em alta velocidade.'
  }
];

export function obterCamadaOrbital(id) {
  if (!id) return null;
  return CAMADAS_ORBITAIS[id.toLowerCase()] || null;
}

export function obterPinoHistorico(id) {
  if (!id) return null;
  return PINOS_HISTORICOS.find(p => p.id === id) || null;
}

export function listarPinosPorCamada(camadaId) {
  if (!camadaId) return PINOS_HISTORICOS;
  return PINOS_HISTORICOS.filter(p => p.camadaId.toLowerCase() === camadaId.toLowerCase());
}
