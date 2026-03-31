"""
Banco de dados master (global).
Armazena: Empresa, Usuario (tabela master de usuários/credenciais).
"""
from sqlmodel import SQLModel, create_engine
import os

_DEFAULT_DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
_DB_DIR = os.environ.get("DATABASE_DIR", _DEFAULT_DB_DIR)
os.makedirs(_DB_DIR, exist_ok=True)

MASTER_DB_PATH = os.path.join(_DB_DIR, "database_master.db")
MASTER_DATABASE_URL = f"sqlite:///{MASTER_DB_PATH}"
master_engine = create_engine(MASTER_DATABASE_URL, echo=False)

def init_master_db():
    """Cria as tabelas no banco master. Deve ser chamado no startup."""
    SQLModel.metadata.create_all(master_engine)
