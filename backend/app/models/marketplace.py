from sqlmodel import SQLModel, Field
from typing import Optional

class Marketplace(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str = Field(unique=True, index=True)
    taxa_percentual: float = Field(default=0.0)
    ativo: bool = Field(default=True)
