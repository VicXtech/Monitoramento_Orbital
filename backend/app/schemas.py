from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, date
from typing import List, Optional

# --- SCHEMAS DE CATEGORIA ---

class CategoriaBase(BaseModel):
    id: int
    nome: str
    descricao: Optional[str] = None
    cor_visualizacao: str = Field(..., max_length=7, description="Cor em formato hexadecimal, ex: #FF0000")

    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE HISTÓRICO DE TLE ---

class TLEHistoricoBase(BaseModel):
    id: int
    epoch: datetime
    linha1: str = Field(..., min_length=69, max_length=69)
    linha2: str = Field(..., min_length=69, max_length=69)
    data_captura: datetime

    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE INFORMAÇÃO DA MISSÃO (WIKIDATA) ---

class InformacaoMissaoResponse(BaseModel):
    id: int
    wikidata_id: Optional[str] = None
    descricao: Optional[str] = None
    operador: Optional[str] = None
    massa_kg: Optional[float] = None
    imagem_url: Optional[str] = None
    artigo_url: Optional[str] = None
    data_atualizacao: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE OBJETO ORBITAL ---

class ObjetoOrbitalBase(BaseModel):
    id: int
    nome: str
    norad_id: str
    pais: str
    status: str
    data_lancamento: Optional[date] = None
    categoria_id: int
    estacao_pai_norad: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ObjetoOrbitalResponse(ObjetoOrbitalBase):
    categoria: CategoriaBase
    ultimo_tle: Optional[TLEHistoricoBase] = None
    missao: Optional[InformacaoMissaoResponse] = None

    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE ESTATÍSTICAS ---

class EstatisticasPais(BaseModel):
    pais: str
    total: int
    ativos: Optional[int] = 0
    inativos: Optional[int] = 0
    foguetes: Optional[int] = 0
    detritos: Optional[int] = 0
    estacoes: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)



class EvolucaoHistorica(BaseModel):
    data: str = Field(..., description="Data no formato YYYY-MM-DD")
    total: int

    model_config = ConfigDict(from_attributes=True)


class DistribuicaoRegimes(BaseModel):
    leo: int = 5519
    meo: int = 183
    geo: int = 590
    heo: int = 44

    model_config = ConfigDict(from_attributes=True)


class TotaisOficiaisCatalogo(BaseModel):
    total: int = 34104
    ativos: int = 16503
    inativos: int = 2782
    foguetes: int = 2295
    detritos: int = 12522
    estacoes: int = 2

    model_config = ConfigDict(from_attributes=True)


class EstatisticasResponse(BaseModel):
    total_objetos: int
    percentual_detritos: float
    distribuicao_paises: List[EstatisticasPais]
    evolucao_historica: List[EvolucaoHistorica]
    distribuicao_regimes: Optional[DistribuicaoRegimes] = None
    totais_oficiais: Optional[TotaisOficiaisCatalogo] = None

    model_config = ConfigDict(from_attributes=True)
