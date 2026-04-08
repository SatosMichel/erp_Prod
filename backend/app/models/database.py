"""
Fábrica de engines SQLite por CNPJ.
Cada empresa tem seu próprio arquivo .db em backend/databases/.
"""
from sqlmodel import SQLModel, create_engine
from typing import Dict
import os

# Diretório onde ficam os bancos de dados das empresas
# No Railway: defina DATABASE_DIR=/data (volume persistente)
# Localmente: usa backend/databases/ como antes
_DEFAULT_DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "databases")
EMPRESAS_DB_DIR = os.environ.get("DATABASE_DIR", _DEFAULT_DB_DIR)
os.makedirs(EMPRESAS_DB_DIR, exist_ok=True)

# Cache de engines (evita recriar a cada request)
_engines: Dict[str, object] = {}

# CNPJ da base padrão (demo/testes)
BASE_PADRAO_CNPJ = "padrao"

def _cnpj_para_slug(cnpj: str) -> str:
    """Remove caracteres não alfanuméricos do CNPJ para usar como nome de arquivo."""
    return "".join(c for c in cnpj if c.isdigit() or c.isalpha())

def get_engine_for(cnpj: str):
    """Retorna (ou cria) o engine SQLite para o CNPJ informado."""
    slug = _cnpj_para_slug(cnpj)
    if slug not in _engines:
        db_path = os.path.join(EMPRESAS_DB_DIR, f"empresa_{slug}.db")
        _engines[slug] = create_engine(f"sqlite:///{db_path}", echo=False)
    return _engines[slug]

def migrate_empresa_db(engine):
    """
    Aplica migrações incrementais no banco SQLite.
    Adiciona colunas novas sem apagar dados existentes.
    SQLite não suporta ALTER TABLE ADD COLUMN IF NOT EXISTS,
    então verificamos as colunas existentes antes de adicionar.
    """
    from sqlalchemy import text
    with engine.connect() as conn:
        # ----- Tabela: insumo -----
        try:
            cols = [row[1] for row in conn.execute(text("PRAGMA table_info(insumo)")).fetchall()]
            if "caracteristica" not in cols:
                conn.execute(text("ALTER TABLE insumo ADD COLUMN caracteristica TEXT"))
            if "unidade_medida" not in cols:
                conn.execute(text("ALTER TABLE insumo ADD COLUMN unidade_medida TEXT DEFAULT 'UND'"))
            if "descricao" not in cols:
                conn.execute(text("ALTER TABLE insumo ADD COLUMN descricao TEXT"))
            conn.commit()
        except Exception:
            pass  # tabela pode não existir ainda (criada em seguida pelo create_all)

def init_empresa_db(cnpj: str):
    """Inicializa todas as tabelas operacionais para uma empresa específica."""
    engine = get_engine_for(cnpj)
    SQLModel.metadata.create_all(engine)
    migrate_empresa_db(engine)

def list_empresa_cnpjs() -> list:
    """Retorna a lista de slugs de empresas com banco criado."""
    slugs = []
    if os.path.exists(EMPRESAS_DB_DIR):
        for f in os.listdir(EMPRESAS_DB_DIR):
            if f.startswith("empresa_") and f.endswith(".db"):
                slug = f.replace("empresa_", "").replace(".db", "")
                slugs.append(slug)
    return slugs

# ─── Compatibilidade: banco padrão (era database.db) ──────────────────────────
DEFAULT_DB_PATH = os.path.join(EMPRESAS_DB_DIR, "database.db")
DATABASE_URL = f"sqlite:///{DEFAULT_DB_PATH}"
engine = create_engine(DATABASE_URL, echo=False)  # Mantido para a Base Padrão

def init_db():
    """Inicializa o banco padrão (base de testes/demo)."""
    SQLModel.metadata.create_all(engine)
    migrate_empresa_db(engine)