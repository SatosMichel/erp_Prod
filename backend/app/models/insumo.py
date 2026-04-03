from sqlmodel import SQLModel, Field
from typing import Optional

class Insumo(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    nome: str = Field(unique=True, nullable=False)
    descricao: Optional[str] = None
    caracteristica: Optional[str] = None
    quantidade_estoque: int = Field(default=0)
    ativo: bool = Field(default=True)
    unidade_medida: Optional[str] = Field(default="UND")  # UND ou G