from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Venda(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    produto_id: int = Field(foreign_key="produto.id")
    quantidade: int
    preco_venda_unit: float
    
    # Marketplace e Custos Adicionais
    marketplace_id: Optional[int] = Field(default=None, foreign_key="marketplace.id")
    frete: float = Field(default=0.0)
    
    # Notas Fiscais e Controle
    tem_nota_fiscal: bool = Field(default=False)
    numero_nota_fiscal: Optional[str] = None
    
    # Informações do Cliente & KPIs Geográficos
    nome_cliente: str
    endereco: str
    cidade: str
    estado: str  # Sigla UF para Ranking (ex: SP, RJ, MG)
    cep: Optional[str] = None
    
    # Cálculos Gerados e Salvos na Venda para Performance de DRE
    custo_insumo_calculado: float = Field(default=0.0)
    margem_percentual: float = Field(default=0.0)
    alerta_margem: bool = Field(default=False)
    
    data_venda: datetime = Field(default_factory=datetime.utcnow)
    observacao: Optional[str] = None
