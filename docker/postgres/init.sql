-- Script de inicialização do Banco de Dados para o Monitoramento Orbital Educacional

-- 1. Criar a tabela categoria_objeto
CREATE TABLE IF NOT EXISTS categoria_objeto (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    cor_visualizacao VARCHAR(7) NOT NULL -- Hexadecimal, ex: #00FF66
);

-- 2. Criar a tabela objeto_orbital
CREATE TABLE IF NOT EXISTS objeto_orbital (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    norad_id VARCHAR(50) NOT NULL UNIQUE,
    pais VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    data_lancamento DATE,
    categoria_id INTEGER NOT NULL,
    estacao_pai_norad VARCHAR(50), -- Vínculo opcional para módulos e naves de apoio (ex: 25544 para ISS, 48274 para Tiangong)
    CONSTRAINT fk_categoria FOREIGN KEY (categoria_id) REFERENCES categoria_objeto(id) ON DELETE RESTRICT
);

-- 3. Criar a tabela informacao_missao (Relacionamento 1:1 para dados enriquecidos da Wikidata)
CREATE TABLE IF NOT EXISTS informacao_missao (
    id SERIAL PRIMARY KEY,
    objeto_id INTEGER NOT NULL UNIQUE,
    wikidata_id VARCHAR(50),
    descricao TEXT,
    operador VARCHAR(255),
    massa_kg NUMERIC(10, 2),
    imagem_url TEXT,
    artigo_url TEXT,
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_missao_objeto FOREIGN KEY (objeto_id) REFERENCES objeto_orbital(id) ON DELETE CASCADE
);

-- 4. Criar a tabela tle_historico
CREATE TABLE IF NOT EXISTS tle_historico (
    id SERIAL PRIMARY KEY,
    objeto_id INTEGER NOT NULL,
    epoch TIMESTAMP WITH TIME ZONE NOT NULL,
    linha1 CHAR(69) NOT NULL,
    linha2 CHAR(69) NOT NULL,
    data_captura TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_objeto FOREIGN KEY (objeto_id) REFERENCES objeto_orbital(id) ON DELETE CASCADE
);

-- 5. Regras de Performance: Índices para consultas instantâneas em grande volume (31.800+ objetos)
CREATE INDEX IF NOT EXISTS idx_objeto_orbital_norad_id ON objeto_orbital(norad_id);
CREATE INDEX IF NOT EXISTS idx_objeto_orbital_nome ON objeto_orbital(nome);
CREATE INDEX IF NOT EXISTS idx_objeto_orbital_categoria_id ON objeto_orbital(categoria_id);
CREATE INDEX IF NOT EXISTS idx_objeto_orbital_estacao_pai ON objeto_orbital(estacao_pai_norad);
CREATE INDEX IF NOT EXISTS idx_informacao_missao_objeto_id ON informacao_missao(objeto_id);
CREATE INDEX IF NOT EXISTS idx_informacao_missao_wikidata_id ON informacao_missao(wikidata_id);
CREATE INDEX IF NOT EXISTS idx_tle_historico_objeto_epoch ON tle_historico(objeto_id, epoch DESC);

-- 6. Inserir dados iniciais para categorias (conforme especificação e hierarquia oficial de cores)
INSERT INTO categoria_objeto (id, nome, descricao, cor_visualizacao) VALUES
(1, 'Satélite Ativo', 'Satélites operacionais ativos em órbita executando serviços de comunicação, observação, etc.', '#00FF66'), -- Verde Neon
(2, 'Satélite Inativo', 'Satélites que encerraram suas operações e permanecem em órbita desativados.', '#FFAA00'), -- Laranja Neon
(3, 'Detrito Espacial', 'Fragmentos metálicos inertes resultantes de colisões ou degradação em órbita.', '#FF0055'), -- Vermelho Neon
(4, 'Estação Espacial', 'Grandes estruturas habitáveis em órbita que abrigam astronautas e experimentos.', '#00F0FF'),  -- Ciano Neon
(5, 'Corpo de Foguete', 'Estágios superiores descartados que atingiram velocidade orbital e permanecem à deriva.', '#B026FF') -- Roxo Neon
ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao,
    cor_visualizacao = EXCLUDED.cor_visualizacao;
