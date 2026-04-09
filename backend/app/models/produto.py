from sqlmodel import SQLModel, Field
from typing import Optional

class Produto(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    nome: str = Field(nullable=False)
    descricao: Optional[str] = None
    caracteristica: Optional[str] = None
    quantidade_estoque: int = Field(default=0)
    ativo: bool = Field(default=True)
    tempo_producao_horas: float = Field(default=0.0)
    idcodbar: str = Field(default="")