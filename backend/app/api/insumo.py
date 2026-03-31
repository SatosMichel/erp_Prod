from app.dependencies import get_empresa_session
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.models.insumo import Insumo
from typing import List

router = APIRouter()


@router.post("/insumos/", response_model=Insumo)
def create_insumo(insumo: Insumo, session: Session = Depends(get_empresa_session)):
    db_insumo = session.exec(select(Insumo).where(Insumo.nome == insumo.nome)).first()
    if db_insumo:
        raise HTTPException(status_code=400, detail="Insumo já cadastrado com este nome")
    session.add(insumo)
    session.commit()
    session.refresh(insumo)
    return insumo

@router.get("/insumos/", response_model=List[Insumo])
def read_insumos(skip: int = 0, limit: int = 500, session: Session = Depends(get_empresa_session)):
    return session.exec(select(Insumo).offset(skip).limit(limit)).all()

@router.get("/insumos/{insumo_id}", response_model=Insumo)
def read_insumo(insumo_id: int, session: Session = Depends(get_empresa_session)):
    insumo = session.get(Insumo, insumo_id)
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo não encontrado")
    return insumo

@router.put("/insumos/{insumo_id}", response_model=Insumo)
def update_insumo(insumo_id: int, insumo: Insumo, session: Session = Depends(get_empresa_session)):
    db_insumo = session.get(Insumo, insumo_id)
    if not db_insumo:
        raise HTTPException(status_code=404, detail="Insumo não encontrado")
    if not db_insumo.ativo:
        raise HTTPException(status_code=400, detail="Insumo inativo não pode ser alterado")
    for key, value in insumo.dict(exclude_unset=True).items():
        setattr(db_insumo, key, value)
    session.add(db_insumo)
    session.commit()
    session.refresh(db_insumo)
    return db_insumo

@router.patch("/insumos/{insumo_id}/toggle-ativo", response_model=Insumo)
def toggle_ativo_insumo(insumo_id: int, session: Session = Depends(get_empresa_session)):
    insumo = session.get(Insumo, insumo_id)
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo não encontrado")
    insumo.ativo = not insumo.ativo
    session.add(insumo)
    session.commit()
    session.refresh(insumo)
    return insumo

@router.delete("/insumos/{insumo_id}", status_code=204)
def delete_insumo(insumo_id: int, session: Session = Depends(get_empresa_session)):
    insumo = session.get(Insumo, insumo_id)
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo não encontrado")
    session.delete(insumo)
    session.commit()