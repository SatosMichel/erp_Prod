from app.dependencies import get_empresa_session
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from sqlalchemy import func
from app.models.entrada_insumo import EntradaInsumo
from app.models.insumo import Insumo
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date

router = APIRouter()


class EntradaInsumoCreate(BaseModel):
    insumo_nome: str
    valor_aquisicao: float
    quantidade: float
    unidade_medida: Optional[str] = "UND"
    caracteristica: Optional[str] = None
    condicao_pagamento: Optional[str] = "À Vista"
    data_pagamento: Optional[date] = None
    data_aquisicao: Optional[date] = None  # data manual (opcional, padrão hoje)

@router.post("/entrada-insumo/", response_model=EntradaInsumo)
def registrar_entrada(entrada: EntradaInsumoCreate, session: Session = Depends(get_empresa_session)):
    # Monta a chave de busca: nome + característica (para diferenciar variações)
    insumo = None

    # Tenta encontrar por nome e característica (ignorando maiúsculas e espaços)
    stmt = select(Insumo).where(func.lower(Insumo.nome) == func.lower(entrada.insumo_nome.strip()))
    candidatos = session.exec(stmt).all()

    if entrada.caracteristica:
        # Busca por nome + característica exata
        for c in candidatos:
            if (c.caracteristica or "").strip().lower() == entrada.caracteristica.strip().lower():
                insumo = c
                break
    elif candidatos:
        # Sem característica: pega o primeiro com mesmo nome e sem característica
        for c in candidatos:
            if not c.caracteristica:
                insumo = c
                break
        if not insumo:
            insumo = candidatos[0]  # fallback: primeiro com esse nome

    if not insumo:
        # Cadastra o insumo automaticamente ao dar a primeira entrada
        insumo = Insumo(
            nome=entrada.insumo_nome,
            caracteristica=entrada.caracteristica,
            unidade_medida=entrada.unidade_medida or "UND",
            quantidade_estoque=0.0,
        )
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
    insumo.quantidade_estoque = (insumo.quantidade_estoque or 0.0) + entrada.quantidade
    session.add(insumo)
    session.commit()
    session.refresh(nova_entrada)
    return nova_entrada

@router.get("/entrada-insumo/", response_model=List[EntradaInsumo])
def listar_entradas(skip: int = 0, limit: int = 100, session: Session = Depends(get_empresa_session)):
    return session.exec(select(EntradaInsumo).offset(skip).limit(limit)).all()

@router.delete("/entrada-insumo/{entrada_id}")
def excluir_entrada(entrada_id: int, session: Session = Depends(get_empresa_session)):
    entrada = session.get(EntradaInsumo, entrada_id)
    if not entrada:
        raise HTTPException(status_code=404, detail="Entrada não encontrada.")
    
    insumo = session.get(Insumo, entrada.insumo_id)
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo não encontrado.")
    
    estoque_atual = insumo.quantidade_estoque or 0.0
    if (estoque_atual - entrada.quantidade) < 0:
        raise HTTPException(status_code=400, detail="Não é possível excluir. O estoque do insumo ficaria negativo.")
    
    insumo.quantidade_estoque = estoque_atual - entrada.quantidade
    session.add(insumo)
    session.delete(entrada)
    session.commit()
    
    return {"detail": "Entrada excluída com sucesso."}

