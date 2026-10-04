-- Cria a tabela categoria_objeto
CREATE TABLE IF NOT EXISTS categoria_objeto (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    cor_visualizacao VARCHAR(7) NOT NULL
);

-- Cria a tabela objeto_orbital
CREATE TABLE IF NOT EXISTS objeto_orbital (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    norad_id VARCHAR(50) NOT NULL UNIQUE,
    cospar_id VARCHAR(30),
    pais VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    data_lancamento DATE,
    data_decaimento DATE,
    local_lancamento VARCHAR(150),
    codigo_status VARCHAR(10),
    categoria_id INTEGER NOT NULL,
    estacao_pai_norad VARCHAR(50),
    CONSTRAINT fk_categoria FOREIGN KEY (categoria_id) REFERENCES categoria_objeto(id) ON DELETE RESTRICT
);

-- Cria a tabela informacao_missao
CREATE TABLE IF NOT EXISTS informacao_missao (
    id SERIAL PRIMARY KEY,
    objeto_id INTEGER NOT NULL UNIQUE,
    descricao TEXT,
    operador VARCHAR(255),
    massa_kg NUMERIC(10, 2),
    imagem_url TEXT,
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_missao_objeto FOREIGN KEY (objeto_id) REFERENCES objeto_orbital(id) ON DELETE CASCADE
);

-- Cria a tabela tle_historico
CREATE TABLE IF NOT EXISTS tle_historico (
    id SERIAL PRIMARY KEY,
    objeto_id INTEGER NOT NULL,
    epoch TIMESTAMP WITH TIME ZONE NOT NULL,
    linha1 CHAR(69) NOT NULL,
    linha2 CHAR(69) NOT NULL,
    data_captura TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_objeto FOREIGN KEY (objeto_id) REFERENCES objeto_orbital(id) ON DELETE CASCADE
);

-- Cria índices de busca
CREATE INDEX IF NOT EXISTS idx_objeto_orbital_norad_id ON objeto_orbital(norad_id);
CREATE INDEX IF NOT EXISTS idx_objeto_orbital_cospar_id ON objeto_orbital(cospar_id);
CREATE INDEX IF NOT EXISTS idx_objeto_orbital_nome ON objeto_orbital(nome);
CREATE INDEX IF NOT EXISTS idx_objeto_orbital_categoria_id ON objeto_orbital(categoria_id);
CREATE INDEX IF NOT EXISTS idx_objeto_orbital_data_decaimento ON objeto_orbital(data_decaimento);
CREATE INDEX IF NOT EXISTS idx_objeto_orbital_estacao_pai ON objeto_orbital(estacao_pai_norad);
CREATE INDEX IF NOT EXISTS idx_informacao_missao_objeto_id ON informacao_missao(objeto_id);
CREATE INDEX IF NOT EXISTS idx_tle_historico_objeto_epoch ON tle_historico(objeto_id, epoch DESC);

-- Insere categorias padrão
INSERT INTO categoria_objeto (id, nome, descricao, cor_visualizacao) VALUES
(1, 'Satélite Ativo', 'Satélites operacionais ativos em órbita executando serviços de comunicação, observação, etc.', '#00FF66'),
(2, 'Satélite Inativo', 'Satélites que encerraram suas operações e permanecem em órbita desativados.', '#FFAA00'),
(3, 'Detrito Espacial', 'Fragmentos metálicos inertes resultantes de colisões ou degradação em órbita.', '#FF0055'),
(4, 'Estação Espacial', 'Grandes estruturas habitáveis em órbita que abrigam astronautas e experimentos.', '#00F0FF'),
(5, 'Corpo de Foguete', 'Estágios superiores descartados que atingiram velocidade orbital e permanecem à deriva.', '#B026FF')
ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao,
    cor_visualizacao = EXCLUDED.cor_visualizacao;
