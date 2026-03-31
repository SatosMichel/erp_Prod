from app.dependencies import get_empresa_session
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.models.entrada_insumo import EntradaInsumo
from app.models.insumo import Insumo
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date

router = APIRouter()


class EntradaInsumoCreate(BaseModel):
    insumo_nome: str
    valor_aquisicao: float
    quantidade: int
    condicao_pagamento: Optional[str] = "À Vista"
    data_pagamento: Optional[date] = None
    data_aquisicao: Optional[date] = None  # data manual (opcional, padrão hoje)

@router.post("/entrada-insumo/", response_model=EntradaInsumo)
def registrar_entrada(entrada: EntradaInsumoCreate, session: Session = Depends(get_empresa_session)):
    insumo = session.exec(select(Insumo).where(Insumo.nome == entrada.insumo_nome)).first()
    if not insumo:
        insumo = Insumo(nome=entrada.insumo_nome, quantidade_estoque=0)
        session.add(insumo)
        session.commit()
        session.refresh(insumo)

    if not insumo.ativo:
        raise HTTPException(status_code=400, detail="Este insumo está inativo e não pode receber alterações no estoque.")

    data = datetime.combine(entrada.data_aquisicao, datetime.min.time()) if entrada.data_aquisicao else datetime.utcnow()
    
    dt_pagamento_comb = datetime.combine(entrada.data_pagamento, datetime.min.time()) if entrada.data_pagamento else None

    nova_entrada = EntradaInsumo(
        insumo_id=insumo.id,
        valor_aquisicao=entrada.valor_aquisicao,
        quantidade=entrada.quantidade,
        condicao_pagamento=entrada.condicao_pagamento,
        data_pagamento=dt_pagamento_comb or data,
        data_aquisicao=data,
    )
    session.add(nova_entrada)
    insumo.quantidade_estoque += entrada.quantidade
    session.add(insumo)
    session.commit()
    session.refresh(nova_entrada)
    return nova_entrada

@router.get("/entrada-insumo/", response_model=List[EntradaInsumo])
def listar_entradas(skip: int = 0, limit: int = 100, session: Session = Depends(get_empresa_session)):
    return session.exec(select(EntradaInsumo).offset(skip).limit(limit)).all()
