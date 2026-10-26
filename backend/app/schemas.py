from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, date
from typing import List, Optional, Dict, Any

# Schemas de categoria

class CategoriaBase(BaseModel):
    id: int
    nome: str
    descricao: Optional[str] = None
    cor_visualizacao: str = Field(..., max_length=7, description="Cor em formato hexadecimal")

    model_config = ConfigDict(from_attributes=True)


# Schemas de histórico de TLE

class TLEHistoricoBase(BaseModel):
    id: int
    epoch: datetime
    linha1: str = Field(..., min_length=69, max_length=69)
    linha2: str = Field(..., min_length=69, max_length=69)
    data_captura: datetime

    model_config = ConfigDict(from_attributes=True)


# Schemas de informação de missão

class InformacaoMissaoResponse(BaseModel):
    id: int
    descricao: Optional[str] = None
    operador: Optional[str] = None
    massa_kg: Optional[float] = None
    imagem_url: Optional[str] = None
    data_atualizacao: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Schemas de objeto orbital

class ObjetoOrbitalBase(BaseModel):
    id: int
    nome: str
    norad_id: str
    cospar_id: Optional[str] = None
    pais: str
    status: str
    data_lancamento: Optional[date] = None
    data_decaimento: Optional[date] = None
    local_lancamento: Optional[str] = None
    codigo_status: Optional[str] = None
    categoria_id: int
    estacao_pai_norad: Optional[str] = None
    regime: Optional[str] = None
    dados_omm: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class ObjetoOrbitalResponse(ObjetoOrbitalBase):
    categoria: CategoriaBase
    ultimo_tle: Optional[TLEHistoricoBase] = None
    missao: Optional[InformacaoMissaoResponse] = None
    omm: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


# Schemas de estatísticas

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
    leo: int = 8832
    meo: int = 360
    geo: int = 1292
    heo: int = 1052

    model_config = ConfigDict(from_attributes=True)


class TotaisOficiaisCatalogo(BaseModel):
    total: int = 11536
    total_em_orbita: Optional[int] = 11535
    total_console: int = 11512
    ativos: int = 5275
    inativos: int = 1117
    foguetes: int = 2283
    detritos: int = 2835
    estacoes: int = 2
    celestrak_catalogados: int = 34729
    celestrak_rastreados: int = 31818
    nao_catalogados_estimativa: str = "Mais de 140 milhões"

    model_config = ConfigDict(from_attributes=True)


class EstatisticasResponse(BaseModel):
    total_objetos: int
    total_em_orbita: Optional[int] = None
    percentual_detritos: float
    distribuicao_paises: List[EstatisticasPais]
    evolucao_historica: List[EvolucaoHistorica]
    distribuicao_regimes: Optional[DistribuicaoRegimes] = None
    totais_oficiais: Optional[TotaisOficiaisCatalogo] = None

    model_config = ConfigDict(from_attributes=True)
