from app.dependencies import get_empresa_session
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.models.ficha_tecnica import FichaTecnica
from app.models.insumo import Insumo
from typing import List

router = APIRouter()


@router.post("/fichas_tecnicas/", response_model=FichaTecnica)
def create_ficha_tecnica(ficha: FichaTecnica, session: Session = Depends(get_empresa_session)):
    session.add(ficha)
    session.commit()
    session.refresh(ficha)
    return ficha

@router.get("/fichas_tecnicas/", response_model=List[FichaTecnica])
def read_fichas_tecnicas(skip: int = 0, limit: int = 500, session: Session = Depends(get_empresa_session)):
    return session.exec(select(FichaTecnica).offset(skip).limit(limit)).all()

@router.get("/fichas_tecnicas/produto/{produto_id}")
def get_fichas_por_produto(produto_id: int, session: Session = Depends(get_empresa_session)):
    fichas = session.exec(select(FichaTecnica).where(FichaTecnica.produto_id == produto_id)).all()
    result = []
    for f in fichas:
        insumo = session.get(Insumo, f.insumo_id)
        result.append({
            "id": f.id,
            "produto_id": f.produto_id,
            "insumo_id": f.insumo_id,
            "insumo_nome": insumo.nome if insumo else "N/A",
            "unidade_medida": insumo.unidade_medida if insumo else "UND",
            "quantidade_necessaria": f.quantidade_necessaria,
        })
    return result

@router.delete("/fichas_tecnicas/{ficha_id}", status_code=204)
def delete_ficha_tecnica(ficha_id: int, session: Session = Depends(get_empresa_session)):
    ficha = session.get(FichaTecnica, ficha_id)
    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha técnica não encontrada")
    session.delete(ficha)
    session.commit()

@router.delete("/fichas_tecnicas/produto/{produto_id}", status_code=204)
def delete_fichas_por_produto(produto_id: int, session: Session = Depends(get_empresa_session)):
    fichas = session.exec(select(FichaTecnica).where(FichaTecnica.produto_id == produto_id)).all()
    for f in fichas:
        session.delete(f)
    session.commit()