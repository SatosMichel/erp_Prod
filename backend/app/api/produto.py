from app.dependencies import get_empresa_session
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.models.produto import Produto
from typing import List

router = APIRouter()


@router.post("/produtos/", response_model=Produto)
def create_produto(produto: Produto, session: Session = Depends(get_empresa_session)):
    db = session.exec(select(Produto).where(Produto.nome == produto.nome)).first()
    if db:
        raise HTTPException(status_code=400, detail="Produto já cadastrado com este nome")
    produto.quantidade_estoque = 0  # sempre inicia zerado
    session.add(produto)
    session.commit()
    session.refresh(produto)
    return produto

@router.get("/produtos/", response_model=List[Produto])
def read_produtos(skip: int = 0, limit: int = 500, session: Session = Depends(get_empresa_session)):
    return session.exec(select(Produto).offset(skip).limit(limit)).all()

@router.get("/produtos/{produto_id}", response_model=Produto)
def read_produto(produto_id: int, session: Session = Depends(get_empresa_session)):
    produto = session.get(Produto, produto_id)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return produto

@router.put("/produtos/{produto_id}", response_model=Produto)
def update_produto(produto_id: int, produto: Produto, session: Session = Depends(get_empresa_session)):
    db = session.get(Produto, produto_id)
    if not db:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    if not db.ativo:
        raise HTTPException(status_code=400, detail="Produto inativo não pode ser alterado")
    for key, value in produto.dict(exclude_unset=True).items():
        setattr(db, key, value)
    session.add(db)
    session.commit()
    session.refresh(db)
    return db

@router.patch("/produtos/{produto_id}/toggle-ativo", response_model=Produto)
def toggle_ativo_produto(produto_id: int, session: Session = Depends(get_empresa_session)):
    produto = session.get(Produto, produto_id)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    produto.ativo = not produto.ativo
    session.add(produto)
    session.commit()
    session.refresh(produto)
    return produto

@router.delete("/produtos/{produto_id}", status_code=204)
def delete_produto(produto_id: int, session: Session = Depends(get_empresa_session)):
    produto = session.get(Produto, produto_id)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    session.delete(produto)
    session.commit()