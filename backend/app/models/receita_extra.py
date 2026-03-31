from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class ReceitaExtra(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    descricao: str
    categoria: str 
    valor: float
    data_receita: datetime = Field(default_factory=datetime.utcnow)
