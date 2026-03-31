from sqlmodel import SQLModel, Field
from typing import Optional

class Usuario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    email: str = Field(unique=True, nullable=False)
    senha_hash: str
    is_admin: bool = Field(default=False)
    is_approved: bool = Field(default=False)
    cnpj_empresa: Optional[str] = Field(default=None)  # None = super admin global