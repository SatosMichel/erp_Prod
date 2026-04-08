from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class EntradaInsumo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    insumo_id: int = Field(foreign_key="insumo.id")
    valor_aquisicao: float
    quantidade: float
    data_aquisicao: datetime = Field(default_factory=datetime.utcnow)
    condicao_pagamento: Optional[str] = Field(default="À Vista")
    data_pagamento: Optional[datetime] = None
