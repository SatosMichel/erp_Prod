from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from app.models.database_master import master_engine
from app.models.usuario import Usuario
from app.models.empresa import Empresa
from app.models.database import init_empresa_db
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel

SECRET_KEY = "secret_key_example"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 horas
SUPERADMIN_EMAIL = "admin@satos.com"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")
router = APIRouter()

def get_master_session():
    with Session(master_engine) as session:
        yield session

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ─── Login principal ──────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str
    cnpj: Optional[str] = None  # Não obrigatório para super admin

@router.post("/login")
def login(req: LoginRequest, session: Session = Depends(get_master_session)):
    user = session.exec(select(Usuario).where(Usuario.email == req.email)).first()
    if not user or not verify_password(req.password, user.senha_hash):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    if not user.is_approved:
        raise HTTPException(status_code=403, detail="Cadastro aguardando aprovação.")

    # ── Super Admin: sem CNPJ, retorna flag para seleção de base
    if user.email == SUPERADMIN_EMAIL and user.cnpj_empresa is None:
        token_pre = create_access_token({"sub": user.email, "superadmin": True})
        return {
            "requires_base_selection": True,
            "pre_token": token_pre,
            "token_type": "bearer"
        }

    # ── Usuário comum: CNPJ obrigatório
    cnpj_login = req.cnpj or user.cnpj_empresa
    if not cnpj_login:
        raise HTTPException(status_code=400, detail="CNPJ é obrigatório para este usuário.")

    # Valida que a empresa existe
    empresa = session.exec(select(Empresa).where(Empresa.cnpj == cnpj_login)).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada para o CNPJ informado.")

    token = create_access_token({"sub": user.email, "cnpj_db": cnpj_login})
    return {"access_token": token, "token_type": "bearer", "empresa_nome": empresa.nome}

# ─── Seleção de base pelo super admin ─────────────────────────────────────────

class SelectBaseRequest(BaseModel):
    pre_token: str
    cnpj_db: str  # "padrao" ou CNPJ real

@router.post("/login/select-base")
def select_base(req: SelectBaseRequest, session: Session = Depends(get_master_session)):
    try:
        payload = jwt.decode(req.pre_token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        is_superadmin = payload.get("superadmin", False)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token intermediário inválido")

    if not is_superadmin:
        raise HTTPException(status_code=403, detail="Apenas super admin pode selecionar base")

    # Se escolheu base padrão
    if req.cnpj_db == "padrao":
        token = create_access_token({"sub": email, "cnpj_db": "padrao", "is_superadmin": True})
        return {"access_token": token, "token_type": "bearer", "empresa_nome": "Base Padrão"}

    empresa = session.exec(select(Empresa).where(Empresa.cnpj == req.cnpj_db)).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    token = create_access_token({"sub": email, "cnpj_db": req.cnpj_db, "is_superadmin": True})
    return {"access_token": token, "token_type": "bearer", "empresa_nome": empresa.nome}

# ─── /me – retorna dados do usuário logado ────────────────────────────────────

@router.get("/me")
def read_users_me(token: str = Depends(oauth2_scheme), session: Session = Depends(get_master_session)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = session.exec(select(Usuario).where(Usuario.email == email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {
        "id": user.id, "nome": user.nome, "email": user.email,
        "is_admin": user.is_admin, "is_approved": user.is_approved,
        "cnpj_empresa": user.cnpj_empresa,
        "is_superadmin": user.email == SUPERADMIN_EMAIL and user.cnpj_empresa is None
    }

# ─── Registro de novo usuário ─────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    nome: str
    email: str
    password: str
    cnpj: Optional[str] = None  # Usuários comuns devem informar a qual empresa pertencem

@router.post("/register")
def register(req: RegisterRequest, session: Session = Depends(get_master_session)):
    existing = session.exec(select(Usuario).where(Usuario.email == req.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    new_user = Usuario(
        nome=req.nome, email=req.email,
        senha_hash=get_password_hash(req.password),
        is_admin=False, is_approved=False,
        cnpj_empresa=req.cnpj
    )
    session.add(new_user)
    session.commit()

    # ── Auto-criar empresa e banco isolado para o CNPJ informado ──────────────
    if req.cnpj:
        empresa = session.exec(select(Empresa).where(Empresa.cnpj == req.cnpj)).first()
        if not empresa:
            # Cria registro da empresa no banco master com nome provisório
            nova_empresa = Empresa(nome=req.nome, cnpj=req.cnpj, ativo=True)
            session.add(nova_empresa)
            session.commit()
        # Garante que o arquivo .db isolado existe (cria se ainda não existe)
        try:
            init_empresa_db(req.cnpj)
        except Exception:
            pass  # Não bloqueia o cadastro se houver falha na criação do banco

    return {"message": "Cadastro realizado. Aguarde aprovação do administrador."}

# ─── Administração de usuários ────────────────────────────────────────────────

@router.get("/usuarios/pendentes")
def listar_pendentes(token: str = Depends(oauth2_scheme), session: Session = Depends(get_master_session)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    admin = session.exec(select(Usuario).where(Usuario.email == email)).first()
    if not admin or not admin.is_admin:
        raise HTTPException(status_code=403, detail="Acesso negado")
    pendentes = session.exec(select(Usuario).where(Usuario.is_approved == False)).all()
    return pendentes

@router.post("/usuarios/aprovar/{user_id}")
def aprovar_usuario(user_id: int, token: str = Depends(oauth2_scheme), session: Session = Depends(get_master_session)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    admin = session.exec(select(Usuario).where(Usuario.email == email)).first()
    if not admin or not admin.is_admin:
        raise HTTPException(status_code=403, detail="Acesso negado")
    user = session.get(Usuario, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    user.is_approved = True
    session.add(user)
    session.commit()

    # ── Garante que o banco isolado do CNPJ existe ao aprovar o usuário ───────
    if user.cnpj_empresa:
        try:
            init_empresa_db(user.cnpj_empresa)
        except Exception:
            pass  # Não bloqueia a aprovação se houver qualquer problema

    return {"message": "Usuário aprovado"}