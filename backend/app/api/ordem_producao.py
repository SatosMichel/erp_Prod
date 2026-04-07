from app.dependencies import get_empresa_session
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.models.insumo import Insumo
from app.models.produto import Produto
from app.models.ficha_tecnica import FichaTecnica
from app.models.ordem_producao import OrdemProducao
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()


class OrdemCreate(BaseModel):
    produto_id: int
    quantidade: int
    observacao: Optional[str] = None

class ItemFicha(BaseModel):
    insumo_id: int
    insumo_nome: str
    unidade_medida: str
    quantidade_necessaria: float
    quantidade_total: float
    disponivel_estoque: float
    suficiente: bool

class OrcamentoResponse(BaseModel):
    produto_id: int
    produto_nome: str
    quantidade: int
    itens: List[ItemFicha]
    pode_produzir: bool

@router.get("/orcamento/{produto_id}", response_model=OrcamentoResponse)
def consultar_orcamento(produto_id: int, quantidade: int = 1, session: Session = Depends(get_empresa_session)):
    produto = session.get(Produto, produto_id)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    if not produto.ativo:
        raise HTTPException(status_code=400, detail="Produto está inativo")

    fichas = session.exec(select(FichaTecnica).where(FichaTecnica.produto_id == produto_id)).all()
    if not fichas:
        raise HTTPException(status_code=400, detail="Nenhuma ficha técnica cadastrada para este produto")

    itens = []
    pode_produzir = True
    for ficha in fichas:
        insumo = session.get(Insumo, ficha.insumo_id)
        if not insumo:
            continue
        qtd_total = float(ficha.quantidade_necessaria) * float(quantidade)
        suficiente = float(insumo.quantidade_estoque) >= qtd_total
        if not suficiente:
            pode_produzir = False
        itens.append(ItemFicha(
            insumo_id=insumo.id,
            insumo_nome=insumo.nome,
            unidade_medida=insumo.unidade_medida or "UND",
            quantidade_necessaria=float(ficha.quantidade_necessaria),
            quantidade_total=qtd_total,
            disponivel_estoque=float(insumo.quantidade_estoque),
            suficiente=suficiente,
        ))

    return OrcamentoResponse(
        produto_id=produto.id,
        produto_nome=produto.nome,
        quantidade=quantidade,
        itens=itens,
        pode_produzir=pode_produzir,
    )

@router.post("/ordem_producao/")
def criar_ordem_producao(dados: OrdemCreate, session: Session = Depends(get_empresa_session)):
    produto = session.get(Produto, dados.produto_id)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    if not produto.ativo:
        raise HTTPException(status_code=400, detail="Produto está inativo e não pode ser produzido")

    fichas = session.exec(select(FichaTecnica).where(FichaTecnica.produto_id == dados.produto_id)).all()
    if not fichas:
        raise HTTPException(status_code=400, detail="Nenhuma ficha técnica encontrada para o produto")

    # Validação de estoque para todos os insumos
    for ficha in fichas:
        insumo = session.get(Insumo, ficha.insumo_id)
        if not insumo:
            raise HTTPException(status_code=400, detail="Insumo da ficha técnica não encontrado")
        if not insumo.ativo:
            raise HTTPException(status_code=400, detail=f"Insumo '{insumo.nome}' está inativo")
        qtd_necessaria = ficha.quantidade_necessaria * dados.quantidade
        if insumo.quantidade_estoque < qtd_necessaria:
            raise HTTPException(
                status_code=400,
                detail=f"Insumo insuficiente: '{insumo.nome}' — Necessário: {qtd_necessaria}, Disponível: {insumo.quantidade_estoque}"
            )

    try:
        # Descontar insumos
        for ficha in fichas:
            insumo = session.get(Insumo, ficha.insumo_id)
            insumo.quantidade_estoque -= ficha.quantidade_necessaria * dados.quantidade
            session.add(insumo)

        # Incrementar estoque do produto acabado
        produto.quantidade_estoque += dados.quantidade
        session.add(produto)

        # Registrar histórico da ordem
        ordem = OrdemProducao(
            produto_id=dados.produto_id,
            quantidade=dados.quantidade,
            status="concluida",
            data_criacao=datetime.utcnow(),
            observacao=dados.observacao,
        )
        session.add(ordem)
        session.commit()
        session.refresh(ordem)
        return {"message": "Ordem de produção concluída com sucesso", "ordem_id": ordem.id}

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao processar a ordem de produção: {str(e)}")

@router.get("/ordens_producao/")
def listar_ordens(skip: int = 0, limit: int = 50, session: Session = Depends(get_empresa_session)):
    ordens = session.exec(select(OrdemProducao).offset(skip).limit(limit)).all()
    result = []
    for o in ordens:
        produto = session.get(Produto, o.produto_id)
        result.append({
            "id": o.id,
            "produto_id": o.produto_id,
            "produto_nome": produto.nome if produto else "N/A",
            "quantidade": o.quantidade,
            "status": o.status,
            "data_criacao": o.data_criacao,
            "observacao": o.observacao,
        })
    return result