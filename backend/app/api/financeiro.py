from app.dependencies import get_empresa_session
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import calendar
from pydantic import BaseModel
from app.models.despesa_extra import DespesaExtra
from app.models.entrada_insumo import EntradaInsumo
from app.models.insumo import Insumo
from app.models.venda import Venda
from app.models.receita_extra import ReceitaExtra
from app.models.ordem_producao import OrdemProducao
from app.api.auth import read_users_me

router = APIRouter(prefix="/financeiro", tags=["financeiro"])


class DespesaExtraCreate(BaseModel):
    descricao: str
    categoria: str
    valor: float
    data_despesa: Optional[datetime] = None

class DespesaExtraUpdate(BaseModel):
    descricao: Optional[str] = None
    categoria: Optional[str] = None
    valor: Optional[float] = None
    data_despesa: Optional[datetime] = None

@router.post("/despesas-extras", response_model=DespesaExtra)
def create_despesa_extra(
    despesa: DespesaExtraCreate,
    session: Session = Depends(get_empresa_session),
    current_user: dict = Depends(read_users_me)
):
    db_despesa = DespesaExtra(
        descricao=despesa.descricao,
        categoria=despesa.categoria,
        valor=despesa.valor,
        data_despesa=despesa.data_despesa or datetime.utcnow()
    )
    session.add(db_despesa)
    session.commit()
    session.refresh(db_despesa)
    return db_despesa

@router.get("/despesas-extras", response_model=List[DespesaExtra])
def list_despesas_extras(
    mes: Optional[int] = Query(None, description="Mês (1-12)"),
    ano: Optional[int] = Query(None, description="Ano (ex: 2024)"),
    session: Session = Depends(get_empresa_session),
    current_user: dict = Depends(read_users_me)
):
    query = select(DespesaExtra)
    
    if mes is not None and ano is not None:
        # SQLite doesn't have EXTRACT, so using strftime for SQLite compatibility usually or naive filtering
        # To be completely safe with SQLite dates, we can fetch all and filter in Python, or use LIKE
        # But SQLModel in SQLite for datetimes usually stores them as strings "YYYY-MM-DD..."
        query = query.where(
             (func.strftime('%Y', DespesaExtra.data_despesa) == str(ano)) &
             (func.strftime('%m', DespesaExtra.data_despesa) == f"{mes:02d}")
        )
    
    despesas = session.exec(query).all()
    # If SQLite function filter fails (due to date formats), fallback to python filter:
    if mes and ano and not despesas:
        all_despesas = session.exec(select(DespesaExtra)).all()
        despesas = [d for d in all_despesas if d.data_despesa.year == ano and d.data_despesa.month == mes]
        
    return despesas

@router.delete("/despesas-extras/{despesa_id}")
def delete_despesa_extra(
    despesa_id: int,
    session: Session = Depends(get_empresa_session),
    current_user: dict = Depends(read_users_me)
):
    despesa = session.get(DespesaExtra, despesa_id)
    if not despesa:
        raise HTTPException(status_code=404, detail="Despesa extra não encontrada")
    session.delete(despesa)
    session.commit()
    return {"ok": True}

@router.get("/despesas", response_model=Dict[str, Any])
def get_consolidated_despesas(
    mes: Optional[int] = Query(None, description="Mês (1-12)"),
    ano: Optional[int] = Query(None, description="Ano (ex: 2024)"),
    session: Session = Depends(get_empresa_session),
    current_user: dict = Depends(read_users_me)
):
    # Fetch all, filtering in Python for maximum compatibility with SQLite datetime formats
    all_extras = session.exec(select(DespesaExtra)).all()
    all_insumos = session.exec(select(EntradaInsumo)).all()
    
    if mes and ano:
        extras = [d for d in all_extras if d.data_despesa.year == ano and d.data_despesa.month == mes]
        insumos = [
            i for i in all_insumos 
            if (i.data_pagamento and i.data_pagamento.year == ano and i.data_pagamento.month == mes) or 
               (not i.data_pagamento and i.data_aquisicao and i.data_aquisicao.year == ano and i.data_aquisicao.month == mes)
        ]
    else:
        extras = all_extras
        insumos = all_insumos

    total_extras = sum(d.valor for d in extras)
    total_insumos = sum(i.valor_aquisicao for i in insumos if hasattr(i, 'valor_aquisicao') and i.valor_aquisicao)
    
    lista_consolidada = []
    
    for ext in extras:
        lista_consolidada.append({
            "id": f"ext_{ext.id}",
            "tipo": "Despesa Extra",
            "descricao": ext.descricao,
            "categoria": ext.categoria,
            "valor": ext.valor,
            "data": ext.data_despesa.isoformat()
        })
        
    for ins in insumos:
        lista_consolidada.append({
            "id": f"ins_{ins.id}",
            "tipo": "Compra Insumo",
            "descricao": f"Entrada de Insumo ID: {ins.insumo_id} ({ins.condicao_pagamento or 'À Vista'})",
            "categoria": "Matéria-Prima",
            "valor": getattr(ins, 'valor_aquisicao', 0) or 0,
            "data": (ins.data_pagamento or ins.data_aquisicao).isoformat() if (ins.data_pagamento or ins.data_aquisicao) else None
        })
        
    # Sort by date desc
    lista_consolidada.sort(key=lambda x: x["data"] or "", reverse=True)

    return {
        "total_geral": total_extras + total_insumos,
        "total_extras": total_extras,
        "total_insumos": total_insumos,
        "itens": lista_consolidada
    }

class ReceitaExtraCreate(BaseModel):
    descricao: str
    categoria: str # 'Empréstimo' ou 'Injeção de Capital'
    valor: float # Valor total recebido
    qtd_parcelas: Optional[int] = 1 # Usado apenas para empréstimo
    valor_parcela: Optional[float] = 0.0 # Valor com juros da parcela
    dia_vencimento: Optional[int] = None # Dia do mês para o vencimento
    data_receita: Optional[datetime] = None

def _add_months(sourcedate: datetime, months: int, target_day: Optional[int] = None) -> datetime:
    month = sourcedate.month - 1 + months
    year = sourcedate.year + month // 12
    month = month % 12 + 1
    day = target_day if target_day is not None else sourcedate.day
    max_day = calendar.monthrange(year, month)[1]
    return sourcedate.replace(year=year, month=month, day=min(day, max_day))

@router.post("/receitas-extras", response_model=ReceitaExtra)
def create_receita_extra(
    receita: ReceitaExtraCreate,
    session: Session = Depends(get_empresa_session),
    current_user: dict = Depends(read_users_me)
):
    db_receita = ReceitaExtra(
        descricao=receita.descricao,
        categoria=receita.categoria,
        valor=receita.valor,
        data_receita=receita.data_receita or datetime.utcnow()
    )
    session.add(db_receita)
    
    if receita.categoria == "Empréstimo":
        num_parcelas = receita.qtd_parcelas or 1
        valor_parc = receita.valor_parcela or (receita.valor / num_parcelas)
        data_referencia = db_receita.data_receita
        target_day = receita.dia_vencimento
        
        for i in range(1, num_parcelas + 1):
            data_pgto = _add_months(data_referencia, i, target_day)
            # Criando despesa extra referenciando esse empréstimo
            db_despesa = DespesaExtra(
                descricao=f"Parcela {i}/{num_parcelas} - {receita.descricao}",
                categoria="Pagamento de Empréstimo",
                valor=valor_parc,
                data_despesa=data_pgto
            )
            session.add(db_despesa)
            
    session.commit()
    session.refresh(db_receita)
    return db_receita

@router.get("/receitas", response_model=Dict[str, Any])
def get_receitas(
    mes: Optional[int] = Query(None, description="Mês (1-12)"),
    ano: Optional[int] = Query(None, description="Ano (ex: 2024)"),
    session: Session = Depends(get_empresa_session),
    current_user: dict = Depends(read_users_me)
):
    all_vendas = session.exec(select(Venda)).all()
    all_extras = session.exec(select(ReceitaExtra)).all()
    
    if mes and ano:
        vendas = [v for v in all_vendas if v.data_venda.year == ano and v.data_venda.month == mes]
        extras = [e for e in all_extras if e.data_receita.year == ano and e.data_receita.month == mes]
    else:
        vendas = all_vendas
        extras = all_extras
        
    total_receita_bruta = sum(v.valor_total for v in vendas) + sum(e.valor for e in extras)
    total_receita_liquida = sum(v.valor_liquido for v in vendas) + sum(e.valor for e in extras)
    
    itens = []
    for v in vendas:
        itens.append({
            "id": f"vda_{v.id}",
            "tipo": "Venda Marketplace",
            "cliente": v.nome_cliente,
            "valor_total": v.valor_total,
            "valor_liquido": v.valor_liquido,
            "data": v.data_venda.isoformat()
        })
    for e in extras:
        itens.append({
            "id": f"rec_{e.id}",
            "tipo": e.categoria,
            "cliente": e.descricao,
            "valor_total": e.valor,
            "valor_liquido": e.valor,
            "data": e.data_receita.isoformat()
        })
        
    itens.sort(key=lambda x: x["data"], reverse=True)
    
    return {
        "total_bruto": total_receita_bruta,
        "total_liquido": total_receita_liquida,
        "itens": itens
    }

@router.get("/balanco", response_model=Dict[str, Any])
def get_balanco(
    ano: int = Query(..., description="Ano base para o DRE (ex: 2024)"),
    session: Session = Depends(get_empresa_session),
    current_user: dict = Depends(read_users_me)
):
    all_extras = session.exec(select(DespesaExtra)).all()
    all_insumos = session.exec(select(EntradaInsumo)).all()
    all_vendas = session.exec(select(Venda)).all()
    all_r_extras = session.exec(select(ReceitaExtra)).all()
    
    extras_ano = [d for d in all_extras if d.data_despesa.year == ano]
    insumos_ano = [
        i for i in all_insumos 
        if (i.data_pagamento and i.data_pagamento.year == ano) or 
           (not i.data_pagamento and i.data_aquisicao and i.data_aquisicao.year == ano)
    ]
    vendas_ano = [v for v in all_vendas if v.data_venda.year == ano]
    r_extras_ano = [r for r in all_r_extras if r.data_receita.year == ano]
    
    receita_bruta = sum(v.valor_total for v in vendas_ano) + sum(r.valor for r in r_extras_ano)
    receita_liquida = sum(v.valor_liquido for v in vendas_ano) + sum(r.valor for r in r_extras_ano)
    
    despesa_insumo = sum(getattr(i, 'valor_aquisicao', 0) or 0 for i in insumos_ano)
    despesa_extra = sum(e.valor for e in extras_ano)
    
    despesa_total = despesa_insumo + despesa_extra
    
    # Resultado Líquido Operacional
    resultado = receita_liquida - despesa_total
    
    margem = (resultado / receita_liquida * 100) if receita_liquida > 0 else 0
    
    # Montando a representação mês a mês
    meses_array = []
    for mes in range(1, 13):
        v_mes = sum(v.valor_liquido for v in vendas_ano if v.data_venda.month == mes)
        r_mes = sum(r.valor for r in r_extras_ano if r.data_receita.month == mes)
        di_mes = sum(
            getattr(i, 'valor_aquisicao', 0) or 0 for i in insumos_ano 
            if (i.data_pagamento and i.data_pagamento.month == mes) or 
               (not i.data_pagamento and i.data_aquisicao and i.data_aquisicao.month == mes)
        )
        de_mes = sum(e.valor for e in extras_ano if e.data_despesa.month == mes)
        
        t_rec = v_mes + r_mes
        t_desp = di_mes + de_mes
        res_mes = t_rec - t_desp
        
        meses_array.append({
            "mes": mes,
            "receita": t_rec,
            "despesa": t_desp,
            "lucro": res_mes
        })
    
    status = "LUCRO" if resultado > 0 else ("PREJUIZO" if resultado < 0 else "EMPATE")
    
    return {
        "ano": ano,
        "receita_liquida_total": receita_liquida,
        "despesas": {
            "insumos": despesa_insumo,
            "extras": despesa_extra,
            "total": despesa_total
        },
        "resultado_liquido": resultado,
        "margem_lucro_percentual": round(float(margem), 2),
        "status": status,
        "meses": meses_array
    }

@router.get("/dashboard-kpis", response_model=Dict[str, Any])
def get_dashboard_kpis(
    session: Session = Depends(get_empresa_session),
):
    """Retorna os KPIs consolidados para o Dashboard Principal."""
    hoje = datetime.utcnow()
    mes_atual = hoje.month
    ano_atual = hoje.year

    # Produção hoje
    todas_ordens = session.exec(select(OrdemProducao)).all()
    producao_hoje = sum(
        o.quantidade for o in todas_ordens
        if o.data_criacao and o.data_criacao.date() == hoje.date()
    )

    # Receita do mês
    todas_vendas = session.exec(select(Venda)).all()
    all_r_extras = session.exec(select(ReceitaExtra)).all()
    receita_mes = sum(
        v.valor_liquido for v in todas_vendas
        if v.data_venda.month == mes_atual and v.data_venda.year == ano_atual
    ) + sum(
        e.valor for e in all_r_extras
        if e.data_receita.month == mes_atual and e.data_receita.year == ano_atual
    )

    # Pedidos em aberto (ordens criadas no mês atual)
    pedidos_mes = sum(
        1 for o in todas_ordens
        if o.data_criacao and o.data_criacao.month == mes_atual and o.data_criacao.year == ano_atual
    )

    # Insumos com estoque crítico (abaixo de 10 unidades)
    todos_insumos = session.exec(select(Insumo).where(Insumo.ativo == True)).all()
    estoque_critico = sum(1 for i in todos_insumos if i.quantidade_estoque < 10)

    return {
        "producao_hoje": producao_hoje,
        "receita_mes": receita_mes,
        "pedidos_abertos": pedidos_mes,
        "estoque_critico": estoque_critico
    }

@router.get("/insumos-map", response_model=Dict[str, str])
def get_insumos_map(session: Session = Depends(get_empresa_session)):
    """Retorna um mapa de id -> nome dos insumos para resolver nomes no frontend."""
    insumos = session.exec(select(Insumo)).all()
    return {str(i.id): i.nome for i in insumos}
