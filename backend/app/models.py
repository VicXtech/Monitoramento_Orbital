from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, CHAR, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class CategoriaObjeto(Base):
    __tablename__ = "categoria_objeto"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False, unique=True)
    descricao = Column(Text, nullable=True)
    cor_visualizacao = Column(String(7), nullable=False) # Hexadecimal, ex: #00FF66

    # Relacionamento de um-para-muitos com objetos
    objetos = relationship("ObjetoOrbital", back_populates="categoria", cascade="all, delete-orphan")

class ObjetoOrbital(Base):
    __tablename__ = "objeto_orbital"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    norad_id = Column(String(50), nullable=False, unique=True, index=True)
    pais = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)
    data_lancamento = Column(Date, nullable=True)
    categoria_id = Column(Integer, ForeignKey("categoria_objeto.id", ondelete="RESTRICT"), nullable=False, index=True)
    estacao_pai_norad = Column(String(50), nullable=True, index=True)

    # Relacionamentos
    categoria = relationship("CategoriaObjeto", back_populates="objetos")
    historico_tle = relationship("TLEHistorico", back_populates="objeto", cascade="all, delete-orphan")
    missao = relationship("InformacaoMissao", back_populates="objeto", uselist=False, cascade="all, delete-orphan")

class InformacaoMissao(Base):
    __tablename__ = "informacao_missao"

    id = Column(Integer, primary_key=True, index=True)
    objeto_id = Column(Integer, ForeignKey("objeto_orbital.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    wikidata_id = Column(String(50), nullable=True, index=True)
    descricao = Column(Text, nullable=True)
    operador = Column(String(255), nullable=True)
    massa_kg = Column(Numeric(10, 2), nullable=True)
    imagem_url = Column(Text, nullable=True)
    artigo_url = Column(Text, nullable=True)
    data_atualizacao = Column(DateTime, default=datetime.utcnow)

    # Relacionamento inverso
    objeto = relationship("ObjetoOrbital", back_populates="missao")

class TLEHistorico(Base):
    __tablename__ = "tle_historico"

    id = Column(Integer, primary_key=True, index=True)
    objeto_id = Column(Integer, ForeignKey("objeto_orbital.id", ondelete="CASCADE"), nullable=False)
    epoch = Column(DateTime, nullable=False)
    linha1 = Column(CHAR(69), nullable=False)
    linha2 = Column(CHAR(69), nullable=False)
    data_captura = Column(DateTime, default=datetime.utcnow)

    # Relacionamento inverso
    objeto = relationship("ObjetoOrbital", back_populates="historico_tle")

