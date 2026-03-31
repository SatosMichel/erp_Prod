from app.dependencies import get_empresa_session
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.models.venda import Venda
from app.models.produto import Produto
from app.models.ficha_tecnica import FichaTecnica
from app.models.insumo import Insumo
from app.models.marketplace import Marketplace
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy import func

router = APIRouter()


class VendaCreate(BaseModel):
    produto_id: int
    quantidade: int
    preco_venda_unit: float
    marketplace_id: Optional[int] = None
    frete: float = 0.0
    tem_nota_fiscal: bool = False
    numero_nota_fiscal: Optional[str] = None
    nome_cliente: str
    endereco: str
    cidade: str
    estado: str
    cep: Optional[str] = None
    observacao: Optional[str] = None

@router.post("/vendas/")
def registrar_venda(dados: VendaCreate, session: Session = Depends(get_empresa_session)):
    produto = session.get(Produto, dados.produto_id)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    if produto.quantidade_estoque < dados.quantidade:
        raise HTTPException(status_code=400, detail="Estoque do produto insuficiente para essa venda")

    # 1. Calcular Custo de IFichas (Insumos consumidos para fabricar este Produto)
    # Obs: A baixa do insumo só ocorreu na "produção". A Venda baixa o produto da prateleira.
    # Mas o "custo_insumo_calculado" na venda nos dirá quanto custou produzi-lo base no último preço, para fins de KPI DRE.
    # Para ser simples, o preço histórico é algo útil mas a regra é custo = Σ(insumo.ultimo_preco * qt_ficha) * qt_vendida
    # Entretanto, não temos histórico de valor pago por unidade do insumo na model Insumo.
    # Vamos criar essa lógica se baseando num cálculo fixo ou zero caso não haja "preço_custo" no insumo.
    # Como o modelo Insumo nao tem preço médio, a métrica exata de custo em R$ dependerá das EntradasInsumo.
    
    # Para simplificar na POC: vamos usar uma estimativa ou zero.
    # Vou buscar as últimas entradas do insumo para achar um preço médio ou pegar o último.
    custo_unit_produto = 0.0
    fichas = session.exec(select(FichaTecnica).where(FichaTecnica.produto_id == dados.produto_id)).all()
    
    from app.models.entrada_insumo import EntradaInsumo
    for ficha in fichas:
        # Pega a ultima entrada deste insumo para ter premissa de custo
        ultima_entrada = session.exec(
            select(EntradaInsumo)
            .where(EntradaInsumo.insumo_id == ficha.insumo_id)
            .order_by(EntradaInsumo.id.desc())
        ).first()
        
        custo_insumo_unitario = 0.0
        if ultima_entrada and ultima_entrada.quantidade > 0:
            custo_insumo_unitario = ultima_entrada.valor_aquisicao / ultima_entrada.quantidade
            
        custo_unit_produto += (custo_insumo_unitario * ficha.quantidade_necessaria)

    custo_total_insumos = custo_unit_produto * dados.quantidade

    # 2. Calcular Margem
    receita_total = dados.preco_venda_unit * dados.quantidade
    tarifa_pct = 0.0
    if dados.marketplace_id:
        mkp = session.get(Marketplace, dados.marketplace_id)
        if mkp:
            tarifa_pct = mkp.taxa_percentual
            
    valor_tarifa = receita_total * (tarifa_pct / 100)
    
    lucro = receita_total - custo_total_insumos - valor_tarifa - dados.frete
    margem = (lucro / receita_total) * 100 if receita_total > 0 else 0
    alerta_margin = True if margem < 50 else False

    # 3. Registrar a Venda
    venda = Venda(
        **dados.dict(),
        custo_insumo_calculado=custo_total_insumos,
        margem_percentual=margem,
        alerta_margem=alerta_margin,
        data_venda=datetime.utcnow()
    )
    
    # 4. Baixar do Estoque do Produto
    produto.quantidade_estoque -= dados.quantidade
    
    session.add(venda)
    session.add(produto)
    session.commit()
    session.refresh(venda)
    
    return {"message": "Venda registrada com sucesso", "venda_id": venda.id, "margem": margem, "alerta": alerta_margin}

@router.get("/vendas/", response_model=List[Venda])
def listar_vendas(skip: int = 0, limit: int = 100, session: Session = Depends(get_empresa_session)):
    return session.exec(select(Venda).offset(skip).limit(limit)).all()

@router.get("/vendas/custos_base")
def get_custos_base_produtos(session: Session = Depends(get_empresa_session)):
    produtos = session.exec(select(Produto)).all()
    custos = {}
    from app.models.entrada_insumo import EntradaInsumo
    for p in produtos:
        custo_unit_produto = 0.0
        fichas = session.exec(select(FichaTecnica).where(FichaTecnica.produto_id == p.id)).all()
        for ficha in fichas:
            ultima_entrada = session.exec(
                select(EntradaInsumo)
                .where(EntradaInsumo.insumo_id == ficha.insumo_id)
                .order_by(EntradaInsumo.id.desc())
            ).first()
            custo_insumo_unitario = 0.0
            if ultima_entrada and ultima_entrada.quantidade > 0:
                custo_insumo_unitario = ultima_entrada.valor_aquisicao / ultima_entrada.quantidade
            custo_unit_produto += (custo_insumo_unitario * ficha.quantidade_necessaria)
        custos[str(p.id)] = custo_unit_produto
    return custos

# --- KPIs ---
@router.get("/vendas/kpi/estados")
def kpi_vendas_por_estado(session: Session = Depends(get_empresa_session)):
    # Group by state
    vendas = session.exec(select(Venda)).all()
    dados_estado = {}
    for v in vendas:
        uf = v.estado.upper()
        if uf not in dados_estado:
            dados_estado[uf] = {"quantidade": 0, "receita": 0.0}
        dados_estado[uf]["quantidade"] += v.quantidade
        dados_estado[uf]["receita"] += (v.preco_venda_unit * v.quantidade)
    
    ranking = sorted([{"estado": k, **v} for k, v in dados_estado.items()], key=lambda x: x["receita"], reverse=True)
    return ranking

@router.get("/vendas/kpi/marketplaces")
def kpi_vendas_por_marketplace(session: Session = Depends(get_empresa_session)):
    vendas = session.exec(select(Venda)).all()
    dados_mkp = {}
    for v in vendas:
        mkp_id = v.marketplace_id
        mkp_name = "Venda Direta"
        if mkp_id:
            mkp = session.get(Marketplace, mkp_id)
            if mkp:
                mkp_name = mkp.nome
            
        if mkp_name not in dados_mkp:
            dados_mkp[mkp_name] = {"quantidade": 0, "receita": 0.0}
        dados_mkp[mkp_name]["quantidade"] += v.quantidade
        dados_mkp[mkp_name]["receita"] += (v.preco_venda_unit * v.quantidade)
        
    return [{"marketplace": k, **v} for k, v in dados_mkp.items()]

@router.get("/vendas/kpi/resumo")
def kpi_resumo_geral(session: Session = Depends(get_empresa_session)):
    vendas = session.exec(select(Venda)).all()
    receita_total = sum(v.preco_venda_unit * v.quantidade for v in vendas)
    total_custos = sum(v.custo_insumo_calculado + v.frete + ((v.preco_venda_unit * v.quantidade) * (session.get(Marketplace, v.marketplace_id).taxa_percentual/100 if v.marketplace_id and session.get(Marketplace, v.marketplace_id) else 0)) for v in vendas)
    
    lucro_total = receita_total - total_custos
    margem_media = (lucro_total / receita_total * 100) if receita_total > 0 else 0
    
    produtos_q = {}
    for v in vendas:
        p = session.get(Produto, v.produto_id)
        p_name = p.nome if p else f"ID {v.produto_id}"
        produtos_q[p_name] = produtos_q.get(p_name, 0) + v.quantidade
        
    ranking_produtos = sorted([{"produto": k, "quantidade": v} for k, v in produtos_q.items()], key=lambda x: x["quantidade"], reverse=True)[:5]
    
    return {
        "receita_total": receita_total,
        "margem_media": margem_media,
        "total_vendas": len(vendas),
        "ranking_produtos": ranking_produtos
    }
