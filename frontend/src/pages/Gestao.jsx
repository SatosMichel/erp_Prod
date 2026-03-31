import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { TrendingUp, TrendingDown, Minus, Activity, AlertTriangle, CheckCircle } from "lucide-react"

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

const fmt = (v) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`

export default function Gestao() {
  const navigate = useNavigate()
  const [ano, setAno] = useState(new Date().getFullYear())
  const [balanco, setBalanco] = useState(null)
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadDados = async () => {
    setLoading(true)
    const token = localStorage.getItem("jwt_token")
    const headers = { Authorization: `Bearer ${token}` }
    try {
      const [resBalanco, resKpis] = await Promise.all([
        fetch(`http://localhost:8000/api/financeiro/balanco?ano=${ano}`, { headers }),
        fetch(`http://localhost:8000/api/financeiro/dashboard-kpis`, { headers })
      ])
      if (resBalanco.ok) setBalanco(await resBalanco.json())
      if (resKpis.ok) setKpis(await resKpis.json())
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { loadDados() }, [ano])

  const status = balanco?.status
  const resultado = balanco?.resultado_liquido ?? 0
  const receita = balanco?.receita_liquida_total ?? 0
  const despTotal = balanco?.despesas?.total ?? 0
  const margem = balanco?.margem_lucro_percentual ?? 0
  const meses = balanco?.meses ?? []

  const maxVal = meses.reduce((m, mes) => Math.max(m, mes.receita, mes.despesa), 1)

  const statusConfig = {
    LUCRO: { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", icon: CheckCircle, label: "LUCRO OPERACIONAL", msg: "A empresa está gerando valor acima dos custos." },
    PREJUIZO: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", icon: AlertTriangle, label: "PREJUÍZO OPERACIONAL", msg: "Atenção: Os custos superam as receitas. Reavalie despesas e oriente captação de capital de giro." },
    EMPATE: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", icon: Minus, label: "PONTO DE EQUILÍBRIO", msg: "Receitas e despesas empatadas. Busque otimizações para gerar margem positiva." }
  }

  const cfg = statusConfig[status] || statusConfig.EMPATE

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
        <button onClick={() => navigate("/dashboard")} style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#94a3b8", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "13px"
        }}>← Dashboard</button>
        <div>
          <div style={{ color: "#06b6d4", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>ERP Produção</div>
          <h1 style={{ color: "white", fontSize: "24px", fontWeight: 800, margin: 0 }}>Gestão Empresarial · DRE</h1>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <select value={ano} onChange={e => setAno(Number(e.target.value))} style={{
            background: "#1e293b", color: "white", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px", padding: "8px 14px", fontSize: "14px", outline: "none"
          }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "#94a3b8", padding: "40px", textAlign: "center" }}>Carregando dados...</div>
      ) : (
        <>
          {/* Banner de Status */}
          {status && (
            <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: "16px", padding: "24px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{ width: "60px", height: "60px", background: cfg.bg, borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${cfg.border}`, flexShrink: 0 }}>
                <cfg.icon size={28} color={cfg.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: cfg.color, fontWeight: 800, fontSize: "13px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>{cfg.label} · {ano}</div>
                <div style={{ color: "white", fontSize: "32px", fontWeight: 900, letterSpacing: "-1px", marginBottom: "4px" }}>{fmt(resultado)}</div>
                <div style={{ color: "#94a3b8", fontSize: "14px" }}>{cfg.msg}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "4px" }}>Margem Líquida</div>
                <div style={{ color: cfg.color, fontSize: "26px", fontWeight: 800 }}>{margem.toFixed(1)}%</div>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "28px" }}>
            {[
              { label: "Receita Líquida", value: fmt(receita), color: "#10b981", icon: TrendingUp },
              { label: "Despesas Totais", value: fmt(despTotal), color: "#ef4444", icon: TrendingDown },
              { label: "Custo de Insumos", value: fmt(balanco?.despesas?.insumos), color: "#f97316", icon: Minus },
              { label: "Despesas Extras", value: fmt(balanco?.despesas?.extras), color: "#f59e0b", icon: Minus },
              { label: "Ordens no Mês", value: `${kpis?.pedidos_abertos ?? "—"} ordens`, color: "#3b82f6", icon: Activity },
              { label: "Est. Crítico", value: kpis ? `${kpis.estoque_critico} itens` : "—", color: kpis?.estoque_critico > 0 ? "#ef4444" : "#10b981", icon: AlertTriangle },
            ].map(card => (
              <div key={card.label} style={{ background: "#0f1629", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div style={{ color: "#475569", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</div>
                  <card.icon size={14} color={card.color} />
                </div>
                <div style={{ color: "white", fontSize: "18px", fontWeight: 700 }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Gráfico de Barras mensal */}
          <div style={{ background: "#0f1629", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
            <div style={{ color: "white", fontWeight: 700, fontSize: "16px", marginBottom: "20px" }}>Fluxo Mensal — {ano}</div>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", height: "160px" }}>
              {meses.map((m, i) => {
                const hRec = (m.receita / maxVal) * 140
                const hDesp = (m.despesa / maxVal) * 140
                const isLucro = m.lucro >= 0
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <div style={{ width: "100%", display: "flex", gap: "2px", alignItems: "flex-end", height: "140px" }}>
                      <div title={`Receita: ${fmt(m.receita)}`} style={{
                        flex: 1, background: "#10b981", borderRadius: "4px 4px 0 0",
                        height: `${Math.max(hRec, 4)}px`, transition: "height 0.3s"
                      }} />
                      <div title={`Despesa: ${fmt(m.despesa)}`} style={{
                        flex: 1, background: "#ef4444", borderRadius: "4px 4px 0 0",
                        height: `${Math.max(hDesp, 4)}px`, transition: "height 0.3s"
                      }} />
                    </div>
                    <div style={{ color: "#475569", fontSize: "10px", fontWeight: 600 }}>{MESES[i]}</div>
                    <div style={{ color: isLucro ? "#10b981" : "#ef4444", fontSize: "9px", fontWeight: 700 }}>
                      {m.lucro === 0 ? "—" : (isLucro ? "+" : "") + m.lucro.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ display: "flex", gap: "20px", marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "12px", background: "#10b981", borderRadius: "3px" }} />
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>Receita</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "12px", background: "#ef4444", borderRadius: "3px" }} />
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>Despesa</span>
              </div>
            </div>
          </div>

          {/* Tabela DRE mensal */}
          <div style={{ background: "#0f1629", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "24px" }}>
            <div style={{ color: "white", fontWeight: 700, fontSize: "16px", marginBottom: "20px" }}>DRE — Demonstração Mês a Mês</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {["Mês", "Receita", "Despesa", "Resultado", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", color: "#475569", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {meses.map((m, i) => {
                  const isLucro = m.lucro > 0
                  const isEmpate = m.lucro === 0
                  const cor = isLucro ? "#10b981" : (isEmpate ? "#f59e0b" : "#ef4444")
                  const statusTxt = isLucro ? "Lucro" : (isEmpate ? "Equilíbrio" : "Prejuízo")
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "12px 14px", color: "white", fontSize: "14px", fontWeight: 600 }}>{MESES[i]}</td>
                      <td style={{ padding: "12px 14px", color: "#10b981", fontSize: "14px" }}>{fmt(m.receita)}</td>
                      <td style={{ padding: "12px 14px", color: "#ef4444", fontSize: "14px" }}>{fmt(m.despesa)}</td>
                      <td style={{ padding: "12px 14px", color: cor, fontSize: "14px", fontWeight: 700 }}>{fmt(m.lucro)}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: `${cor}20`, color: cor }}>{statusTxt}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid rgba(255,255,255,0.1)" }}>
                  <td style={{ padding: "14px", color: "#94a3b8", fontWeight: 700 }}>TOTAL ANUAL</td>
                  <td style={{ padding: "14px", color: "#10b981", fontWeight: 800 }}>{fmt(receita)}</td>
                  <td style={{ padding: "14px", color: "#ef4444", fontWeight: 800 }}>{fmt(despTotal)}</td>
                  <td style={{ padding: "14px", color: cfg.color, fontWeight: 900, fontSize: "16px" }}>{fmt(resultado)}</td>
                  <td style={{ padding: "14px" }}>
                    <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 800, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
