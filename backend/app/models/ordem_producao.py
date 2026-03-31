from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class OrdemProducao(SQLModel, table=True):
    __tablename__ = "ordemproducao"
    id: Optional[int] = Field(default=None, primary_key=True)
    produto_id: int = Field(foreign_key="produto.id")
    quantidade: int
    status: str = Field(default="concluida")  # orcamento | em_producao | concluida | cancelada
    data_criacao: datetime = Field(default_factory=datetime.utcnow)
    observacao: Optional[str] = None
