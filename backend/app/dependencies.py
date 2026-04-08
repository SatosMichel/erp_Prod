"""
Dependency injection para roteamento de sessão por empresa.
Lê o campo `cnpj_db` do JWT e retorna a sessão SQLite correta.
"""
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session
from jose import jwt, JWTError
from app.models.database import get_engine_for, BASE_PADRAO_CNPJ, engine as default_engine

SECRET_KEY = "secret_key_example"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

def get_cnpj_from_token(token: str = Depends(oauth2_scheme)) -> str:
    """Extrai o cnpj_db do JWT. Retorna 'padrao' se não especificado."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        cnpj = payload.get("cnpj_db", BASE_PADRAO_CNPJ)
        return cnpj
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

_migrated_engines = set()

def _ensure_migrated(engine):
    """Garante que o banco está migrado. Executa apenas uma vez por engine."""
    engine_id = id(engine)
    if engine_id not in _migrated_engines:
        from app.models.database import migrate_empresa_db
        from sqlmodel import SQLModel
        SQLModel.metadata.create_all(engine)
        migrate_empresa_db(engine)
        _migrated_engines.add(engine_id)

def get_empresa_session(cnpj: str = Depends(get_cnpj_from_token)):
    """Retorna uma sessão SQLModel apontada para o banco da empresa correta."""
    if cnpj == BASE_PADRAO_CNPJ:
        _ensure_migrated(default_engine)
        with Session(default_engine) as session:
            yield session
    else:
        engine = get_engine_for(cnpj)
        _ensure_migrated(engine)
        with Session(engine) as session:
            yield session

def get_master_session():
    """Retorna sessão para o banco master (Empresa, Usuario global)."""
    from app.models.database_master import master_engine
    with Session(master_engine) as session:
        yield session
