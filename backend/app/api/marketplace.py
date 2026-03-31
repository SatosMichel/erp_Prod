from app.dependencies import get_empresa_session
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.models.marketplace import Marketplace
from typing import List

router = APIRouter()


@router.post("/marketplaces/", response_model=Marketplace)
def create_marketplace(marketplace: Marketplace, session: Session = Depends(get_empresa_session)):
    db_mkp = session.exec(select(Marketplace).where(Marketplace.nome == marketplace.nome)).first()
    if db_mkp:
        raise HTTPException(status_code=400, detail="Este Marketplace já está cadastrado")
    session.add(marketplace)
    session.commit()
    session.refresh(marketplace)
    return marketplace

@router.get("/marketplaces/", response_model=List[Marketplace])
def read_marketplaces(skip: int = 0, limit: int = 100, session: Session = Depends(get_empresa_session)):
    return session.exec(select(Marketplace).offset(skip).limit(limit)).all()

@router.patch("/marketplaces/{marketplace_id}/toggle-ativo", response_model=Marketplace)
def toggle_ativo_marketplace(marketplace_id: int, session: Session = Depends(get_empresa_session)):
    mkp = session.get(Marketplace, marketplace_id)
    if not mkp:
        raise HTTPException(status_code=404, detail="Marketplace não encontrado")
    mkp.ativo = not mkp.ativo
    session.add(mkp)
    session.commit()
    session.refresh(mkp)
    return mkp

@router.delete("/marketplaces/{marketplace_id}", status_code=204)
def delete_marketplace(marketplace_id: int, session: Session = Depends(get_empresa_session)):
    mkp = session.get(Marketplace, marketplace_id)
    if not mkp:
        raise HTTPException(status_code=404, detail="Marketplace não encontrado")
    session.delete(mkp)
    session.commit()
