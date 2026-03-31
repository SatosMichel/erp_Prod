from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class DespesaExtra(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    descricao: str
    categoria: str
    valor: float
    data_despesa: datetime = Field(default_factory=datetime.utcnow)
