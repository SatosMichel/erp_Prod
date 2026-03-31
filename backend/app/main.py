from fastapi import FastAPI
from app.api.insumo import router as insumo_router
from app.api.produto import router as produto_router
from app.api.ficha_tecnica import router as ficha_tecnica_router
from app.api.ordem_producao import router as ordem_producao_router
from app.api.auth import router as auth_router
from app.api.entrada_insumo import router as entrada_insumo_router
from app.api.marketplace import router as marketplace_router
from app.api.venda import router as venda_router
from app.api.financeiro import router as financeiro_router
from app.api.empresas import router as empresas_router
from app.models.database import init_db
from app.models.database_master import init_master_db
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import os

app = FastAPI(title="ERP Satos", version="2.0.0")

@app.on_event("startup")
def on_startup():
    # Registra modelos operacionais no metadata (banco padrão + empresas)
    from app.models import insumo, produto, ficha_tecnica, entrada_insumo, ordem_producao, marketplace, venda, despesa_extra, receita_extra  # noqa
    # Registra modelos master
    from app.models import usuario, empresa  # noqa

    init_db()          # Banco padrão (base demo/testes → database.db)
    init_master_db()   # Banco master (usuarios e empresas → database_master.db)
    _init_superadmin()
    _init_empresa_satos()

def _init_superadmin():
    from sqlmodel import Session, select
    from app.models.database_master import master_engine
    from app.models.usuario import Usuario
    from app.api.auth import get_password_hash
    with Session(master_engine) as session:
        # Migrar admin antigo se existir
        old_admin = session.exec(select(Usuario).where(Usuario.email == "admin@erp.com")).first()
        if old_admin:
            old_admin.email = "admin@satos.com"
            old_admin.cnpj_empresa = None
            session.add(old_admin)
            session.commit()

        # Criar super admin se não existir
        admin = session.exec(select(Usuario).where(Usuario.email == "admin@satos.com")).first()
        if not admin:
            session.add(Usuario(
                nome="Super Administrador Satos",
                email="admin@satos.com",
                senha_hash=get_password_hash("Miguel2@"),
                is_admin=True,
                is_approved=True,
                cnpj_empresa=None  # None = acesso global
            ))
            session.commit()

def _init_empresa_satos():
    """Cria automaticamente a empresa Satos e seu banco isolado se ainda não existir."""
    from sqlmodel import Session, select
    from app.models.database_master import master_engine
    from app.models.empresa import Empresa
    from app.models.database import init_empresa_db
    CNPJ_SATOS = "56.022.691/0001-89"
    with Session(master_engine) as session:
        existente = session.exec(select(Empresa).where(Empresa.cnpj == CNPJ_SATOS)).first()
        if not existente:
            session.add(Empresa(
                nome="Satos",
                cnpj=CNPJ_SATOS,
                ativo=True
            ))
            session.commit()
    # Garante que o banco isolado da Satos está criado
    init_empresa_db(CNPJ_SATOS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(insumo_router, prefix="/api")
app.include_router(produto_router, prefix="/api")
app.include_router(ficha_tecnica_router, prefix="/api")
app.include_router(ordem_producao_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(entrada_insumo_router, prefix="/api")
app.include_router(marketplace_router, prefix="/api")
app.include_router(venda_router, prefix="/api")
app.include_router(financeiro_router, prefix="/api")
app.include_router(empresas_router, prefix="/api")

@app.get("/")
def read_root():
    return RedirectResponse(url="/web/index.html")

static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static")
os.makedirs(static_dir, exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static_assets")
app.mount("/web", StaticFiles(directory=static_dir), name="web")