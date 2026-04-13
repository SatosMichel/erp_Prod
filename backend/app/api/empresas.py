import os
import httpx
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional
from jose import jwt, JWTError

from app.models.empresa import Empresa
from app.models.database_master import master_engine
from app.models.database import get_engine_for, init_empresa_db, BASE_PADRAO_CNPJ
from app.models.usuario import Usuario

SECRET_KEY = "secret_key_example"
ALGORITHM = "HS256"
SUPERADMIN_EMAIL = "admin@satos.com"

LOGOS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "static", "logos")
os.makedirs(LOGOS_DIR, exist_ok=True)

router = APIRouter(prefix="/empresas", tags=["empresas"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

def get_master_session():
    with Session(master_engine) as session:
        yield session

def _get_superadmin(token: str, session: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = session.exec(select(Usuario).where(Usuario.email == email)).first()
    if not user or user.email != SUPERADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Apenas o super admin pode executar esta ação")
    return user

# ─── Listar empresas ──────────────────────────────────────────────────────────

@router.get("/")
def listar_empresas(token: str = Depends(oauth2_scheme), session: Session = Depends(get_master_session)):
    _get_superadmin(token, session)
    empresas = session.exec(select(Empresa)).all()
    return empresas

# ─── Criar empresa ────────────────────────────────────────────────────────────

class EmpresaCreate(BaseModel):
    nome: str
    cnpj: str
    ie: Optional[str] = None
    endereco: Optional[str] = None
    telefone: Optional[str] = None

@router.post("/")
def criar_empresa(dados: EmpresaCreate, token: str = Depends(oauth2_scheme), session: Session = Depends(get_master_session)):
    _get_superadmin(token, session)
    existente = session.exec(select(Empresa).where(Empresa.cnpj == dados.cnpj)).first()
    if existente:
        raise HTTPException(status_code=400, detail="CNPJ já cadastrado")
    empresa = Empresa(**dados.dict())
    session.add(empresa)
    session.commit()
    session.refresh(empresa)
    # Inicializa o banco de dados isolado desta empresa
    init_empresa_db(dados.cnpj)
    return empresa

# ─── Atualizar empresa ────────────────────────────────────────────────────────

class EmpresaUpdate(BaseModel):
    nome: Optional[str] = None
    ie: Optional[str] = None
    endereco: Optional[str] = None
    telefone: Optional[str] = None

@router.put("/atualizar")
def atualizar_empresa(cnpj: str, dados: EmpresaUpdate, token: str = Depends(oauth2_scheme), session: Session = Depends(get_master_session)):
    # Permite que admin da própria empresa edite seus dados
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = session.exec(select(Usuario).where(Usuario.email == email)).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso negado")
    if user.email != SUPERADMIN_EMAIL and user.cnpj_empresa != cnpj:
        raise HTTPException(status_code=403, detail="Você só pode editar sua própria empresa")

    empresa = session.exec(select(Empresa).where(Empresa.cnpj == cnpj)).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    for field, value in dados.dict(exclude_none=True).items():
        setattr(empresa, field, value)
    session.add(empresa)
    session.commit()
    session.refresh(empresa)
    return empresa

# ─── Upload de logomarca ──────────────────────────────────────────────────────

@router.post("/upload-logo")
async def upload_logo(cnpj: str, file: UploadFile = File(...), token: str = Depends(oauth2_scheme), session: Session = Depends(get_master_session)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = session.exec(select(Usuario).where(Usuario.email == email)).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso negado")
    if user.email != SUPERADMIN_EMAIL and user.cnpj_empresa != cnpj:
        raise HTTPException(status_code=403, detail="Você só pode editar sua própria empresa")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg", ".webp"]:
        raise HTTPException(status_code=400, detail="Formato inválido. Use PNG, JPG ou WEBP.")

    slug = "".join(c for c in cnpj if c.isdigit())
    filename = f"logo_{slug}{ext}"
    filepath = os.path.join(LOGOS_DIR, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    logo_url = f"/static/logos/{filename}"
    empresa = session.exec(select(Empresa).where(Empresa.cnpj == cnpj)).first()
    if empresa:
        empresa.logo_url = logo_url
        session.add(empresa)
        session.commit()

    return {"logo_url": logo_url}

# ─── Consulta CNPJ na Receita Federal (API pública com fallback) ──────────────

def _montar_endereco(logradouro="", numero="", complemento="", bairro="", municipio="", uf="", cep=""):
    """Monta o endereço filtrando partes vazias para não gerar vírgulas soltas."""
    partes_rua = [p.strip() for p in [logradouro, numero, complemento] if p and p.strip()]
    rua = ", ".join(partes_rua) if partes_rua else ""
    partes_local = [p.strip() for p in [bairro] if p and p.strip()]
    cidade_uf = f"{municipio.strip()}/{uf.strip()}" if municipio and uf else (municipio or uf or "")
    todos = [p for p in [rua, *partes_local, cidade_uf] if p]
    endereco = " - ".join(todos) if todos else ""
    if cep and cep.strip():
        endereco += f" | CEP: {cep.strip()}"
    return endereco

def _extrair_telefone_brasil(data):
    """Extrai telefone da BrasilAPI (campo ddd_telefone_1)."""
    raw = data.get("ddd_telefone_1", "")
    if raw and len(raw) >= 10:
        return f"({raw[:2]}) {raw[2:]}"
    return raw or ""

@router.get("/consulta-cnpj/{cnpj}")
async def consultar_cnpj(cnpj: str):
    cnpj_limpo = "".join(c for c in cnpj if c.isdigit())
    if len(cnpj_limpo) != 14:
        raise HTTPException(status_code=400, detail="CNPJ deve ter 14 dígitos")

    # Tentativa 1: BrasilAPI
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(f"https://brasilapi.com.br/api/cnpj/v1/{cnpj_limpo}")
        if res.status_code == 200:
            data = res.json()
            return {
                "nome": data.get("razao_social", ""),
                "fantasia": data.get("nome_fantasia", ""),
                "cnpj": cnpj,
                "endereco": _montar_endereco(
                    data.get("logradouro", ""), data.get("numero", ""),
                    data.get("complemento", ""), data.get("bairro", ""),
                    data.get("municipio", ""), data.get("uf", ""),
                    data.get("cep", "")
                ),
                "telefone": _extrair_telefone_brasil(data),
                "situacao": data.get("descricao_situacao_cadastral", "")
            }
    except Exception:
        pass

    # Tentativa 2: ReceitaWS (fallback)
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            res2 = await client.get(
                f"https://receitaws.com.br/v1/cnpj/{cnpj_limpo}",
                headers={"Accept": "application/json"}
            )
        if res2.status_code == 200:
            data2 = res2.json()
            if data2.get("status") == "ERROR":
                raise HTTPException(status_code=404, detail=data2.get("message", "CNPJ não encontrado"))
            return {
                "nome": data2.get("nome", ""),
                "fantasia": data2.get("fantasia", ""),
                "cnpj": cnpj,
                "endereco": _montar_endereco(
                    data2.get("logradouro", ""), data2.get("numero", ""),
                    data2.get("complemento", ""), data2.get("bairro", ""),
                    data2.get("municipio", ""), data2.get("uf", ""),
                    data2.get("cep", "")
                ),
                "telefone": data2.get("telefone", ""),
                "situacao": data2.get("situacao", "")
            }
    except httpx.RequestError:
        pass

    raise HTTPException(status_code=404, detail="CNPJ não encontrado. Tente novamente em alguns segundos.")

# ─── Dados da empresa pelo CNPJ do token ─────────────────────────────────────

@router.get("/minha")
def minha_empresa(token: str = Depends(oauth2_scheme), session: Session = Depends(get_master_session)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        cnpj = payload.get("cnpj_db", BASE_PADRAO_CNPJ)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    if cnpj == BASE_PADRAO_CNPJ:
        return {"nome": "Base Padrão", "cnpj": "padrao", "logo_url": None}
    empresa = session.exec(select(Empresa).where(Empresa.cnpj == cnpj)).first()
    if not empresa:
        return {"nome": "Empresa", "cnpj": cnpj, "logo_url": None}
    return empresa
