from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Empresa(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    cnpj: str = Field(unique=True, index=True)
    ie: Optional[str] = None          # Inscrição Estadual
    endereco: Optional[str] = None
    telefone: Optional[str] = None
    logo_url: Optional[str] = None    # Caminho relativo da logomarca
    ativo: bool = Field(default=True)
    data_criacao: datetime = Field(default_factory=datetime.utcnow)
