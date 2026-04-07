from sqlmodel import SQLModel, Field, Relationship
from typing import Optional

class FichaTecnica(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    produto_id: int = Field(foreign_key="produto.id")
    insumo_id: int = Field(foreign_key="insumo.id")
    quantidade_necessaria: float