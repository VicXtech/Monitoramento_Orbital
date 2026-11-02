# OrbitalED — Monitoramento Orbital & Mecânica Celeste 3D

Plataforma interativa para rastreamento, cálculo e visualização em tempo real de satélites e detritos na órbita terrestre. O projeto é focado em divulgação científica, astrodinâmica didática e conscientização sobre sustentabilidade espacial e mitigação do Efeito Kessler.

A aplicação traduz parâmetros complexos de mecânica orbital em uma experiência tridimensional intuitiva diretamente no navegador, sem necessidade de plugins ou cadastros, com toda a propagação física processada no cliente.

---

## Acesso Online (Produção)

- **Aplicação Web:** [https://orbital-frontend-ftnc.onrender.com](https://orbital-frontend-ftnc.onrender.com)
- **Documentação da API REST (Swagger):** [https://orbital-backend-nmib.onrender.com/docs](https://orbital-backend-nmib.onrender.com/docs)

---

## Arquitetura & Stack Tecnológica

O sistema opera sob arquitetura desacoplada e multi-container com serviços orquestrados via Docker Compose:

### Frontend & Visualização 3D
- **React 19:** Biblioteca declarativa para interface e gerenciamento de estado da aplicação.
- **Vite 8:** Bundler de alta performance com suporte a ES Modules e compilação otimizada.
- **CesiumJS (WebGL):** Motor geoespacial 3D com aceleração gráfica por hardware, iluminação solar dinâmica e atmosfera terrestre.
- **satellite.js (SGP4):** Biblioteca de propagação física no cliente baseada no modelo analítico SGP4 (*Simplified General Perturbations-4*).
- **Web Workers:** Execução do propagador orbital em thread secundária dedicada (`sgp4Worker.js`), garantindo 60 FPS contínuos na interface.
- **Design HUD Tático:** Estética inspirada em consoles de comando orbital com superfície de vidro fosco (*frosted glass* calibrado em 90% de opacidade) e tipografia técnica (*Space Grotesk*, *JetBrains Mono*, *Inter* e *Bruno Ace SC*).

### Backend & API
- **Python 3.11 & FastAPI:** Servidor assíncrono para ingestão, tratamento e disponibilização do catálogo orbital.
- **SQLAlchemy 2.0:** Mapeamento objeto-relacional (ORM) e gerenciamento de sessões com o banco.
- **APScheduler:** Agendamento automático e periódico para atualização diária de dados TLE.
- **Cache em Memória:** Mecanismo de cache RAM em dois níveis (cliente e servidor) para alternância instantânea de amostragem.

### Dados & Física
- **PostgreSQL 15 (Local) / Supabase (Nuvem):** Banco de dados relacional com índices em `norad_id`, nomes e categorias.
- **CelesTrak & Space-Track:** Fontes oficiais e públicas para extração de parâmetros orbitais (Two-Line Element Sets - TLEs).
- **Catálogo Abrangente:** Mais de 31.800 objetos rastreados no banco ativo e mais de 34.000 registros catalogados.

### Infraestrutura & Deploy
- **Docker & Docker Compose:** Ambientes isolados em contêineres com variáveis de ambiente externalizadas via `.env`.
- **Render:** Hospedagem em nuvem do frontend (Static Site CDN global) e backend (Web Service Docker).
- **Healthchecks:** Verificação de integridade automatizada entre os serviços na inicialização.

---

## Principais Recursos

- **Globo Terrestre 3D Interativo:** Navegação tridimensional livre com rotação, aproximação contínua e acompanhamento automático de satélites em foco.
- **Amostragem Dinâmica com Dois Modos:**
  - **Modo Tático (3.000 objetos):** Amostragem otimizada para alta fluidez e visualização tática limpa.
  - **Modo Expandido (10.000 objetos):** Censo denso de satélites e detritos processados paralelamente via Web Worker.
- **Controle de Tempo Orbital:** Modos de reprodução ao vivo com velocidades de aceleração em **1x, 10x, 60x e 300x**, além de congelamento para análise pontual de trajetórias.
- **Modo Orbital Didático:** Módulo temático para estudo das principais camadas da Terra (LEO, MEO, GEO e HEO), com anéis tridimensionais, marcos históricos e simuladores comparativos de velocidade, cobertura e latência de sinal.
- **Dossiê Analítico Estruturado:**
  - *Telemetria em Tempo Real:* Altitude, velocidade instantânea, inclinação, período orbital, apogeu e perigeu.
  - *Ficha Técnica de Engenharia:* Nação de origem, finalidade operacional, veículo e data de lançamento.
  - *Auditoria e Sustentabilidade:* Estimativa de decaimento atmosférico, vida útil e risco de fragmentação.
- **Filtros por Categorias Operacionais:**
  - Satélites Ativos (`#34D399` - Verde)
  - Satélites Inativos (`#E5A93C` - Âmbar)
  - Corpos de Foguete (`#9D72FF` - Roxo)
  - Detritos Espaciais (`#E05252` - Vermelho)
  - Estações Espaciais (`#38BDF8` - Ciano)
- **Filtros por Camadas de Altitude:** Seleção direta por LEO (< 2.000 km), MEO (2.000 a 35.786 km), GEO (~35.786 km) e HEO (órbitas altamente elípticas).
- **Busca Tática Instantânea:** Consulta em tempo real com autocompletar por nome do objeto ou identificador NORAD ID.
- **Módulos Didáticos Integrados:** Seções completas dedicadas à Sustentabilidade Espacial (Efeito Kessler e descarte orbital) e Glossário Astrodinâmico explicativo.

---

## Como Executar Localmente

### Pré-requisitos
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados na máquina.
- Git instalado.

### Passo a Passo

```bash
# 1. Clonar o repositório
git clone https://github.com/VicFentys/Monitoramento_Orbital.git
cd Monitoramento_Orbital

# 2. Configurar as variáveis de ambiente
cp .env.example .env

# 3. Subir todos os serviços com Docker Compose
docker compose up --build
```

O Docker Compose inicializará automaticamente:
- O banco de dados PostgreSQL (`orbital_db`), aplicando o esquema inicial de `docker/postgres/init.sql`.
- A API FastAPI (`orbital_backend`), conectando-se ao banco através da rede interna do Docker.
- A aplicação React no Vite (`orbital_frontend`).

### Endereços e Portas

| Serviço | Endereço Local | Descrição |
| :--- | :--- | :--- |
| **Frontend (Aplicação)** | [http://localhost:3000](http://localhost:3000) | Console interativo 3D e simulador |
| **Backend API (Swagger Docs)** | [http://localhost:8000/docs](http://localhost:8000/docs) | Documentação OpenAPI interativa |
| **Backend API (Saúde)** | [http://localhost:8000/health](http://localhost:8000/health) | Endpoint de verificação de status |
| **PostgreSQL** | `localhost:5433` | Banco de dados relacional local |

---

## Estrutura do Repositório

```text
Monitoramento_Orbital/
├── backend/
│   ├── app/
│   │   ├── collector.py      # Coletor e parser de TLEs via CelesTrak
│   │   ├── database.py       # Configuração de conexão e sessão SQLAlchemy
│   │   ├── main.py           # Endpoints REST, rotinas e cache em memória
│   │   ├── models.py         # Modelos de entidades relacionais do banco
│   │   └── schemas.py        # Esquemas Pydantic de validação e serialização
│   ├── Dockerfile            # Imagem do serviço backend (Python 3.11)
│   └── requirements.txt      # Dependências Python (FastAPI, SQLAlchemy, etc.)
├── frontend/
│   ├── public/
│   │   └── favicon.svg       # Ícone oficial em curvas vetorizadas
│   ├── src/
│   │   ├── assets/           # Efeitos sonoros e trilha sonora tática
│   │   ├── components/       # Componentes React modulares (filtros, cards, visor)
│   │   ├── data/             # Enciclopédia orbital, glossário e marcos históricos
│   │   ├── utils/            # Fórmulas de mecânica celeste e cálculos keplerianos
│   │   ├── workers/
│   │   │   └── sgp4Worker.js # Web Worker dedicado à propagação orbital paralela
│   │   ├── App.jsx           # Componente raiz com o console e o visor tático
│   │   ├── App.css           # Estilos visuais do HUD, vidro fosco e animações
│   │   └── index.css         # Variáveis de tema, superfícies e tipografia oficial
│   ├── Dockerfile            # Imagem do serviço frontend (Node 20 / Vite)
│   ├── package.json          # Dependências do cliente (React 19, Cesium, Satellite.js)
│   └── vite.config.js        # Configuração do bundler Vite
├── docker/
│   └── postgres/
│       └── init.sql          # Estrutura inicial do esquema do banco de dados
├── .env.example              # Modelo seguro de variáveis de ambiente
├── docker-compose.yml        # Orquestração local dos contêineres Docker
├── LICENSE                   # Termos de licença do projeto
└── README.md                 # Documentação principal do repositório
```

---

## Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
