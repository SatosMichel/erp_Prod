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
        fetch(`/api/financeiro/balanco?ano=${ano}`, { headers }),
        fetch(`/api/financeiro/dashboard-kpis`, { headers })
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
    PREJUIZO: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", icon: AlertTriangle, label: "PREJUÍZO OPERACIONAL", msg: "Atenção: Os custos superam as receitas." },
    EMPATE: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", icon: Minus, label: "PONTO DE EQUILÍBRIO", msg: "Receitas e despesas empatadas." }
  }

  const cfg = statusConfig[status] || statusConfig.EMPATE

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header — responsivo */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <button onClick={() => navigate("/dashboard")} style={{
          background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
          color: "var(--text-secondary)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit"
        }}>← Dashboard</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#06b6d4", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>ERP Produção</div>
          <h1 style={{ color: "var(--text-primary)", fontSize: "22px", fontWeight: 800, margin: 0 }}>Gestão Empresarial · DRE</h1>
        </div>
        <div>
          <select value={ano} onChange={e => setAno(Number(e.target.value))} style={{
            background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)",
            borderRadius: "8px", padding: "8px 14px", fontSize: "14px", outline: "none", fontFamily: "inherit"
          }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-secondary)", padding: "40px", textAlign: "center" }}>Carregando dados...</div>
      ) : (
        <>
          {/* Banner de Status — responsivo */}
          {status && (
            <div style={{
              background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: "16px",
              padding: "20px", marginBottom: "20px",
              display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap"
            }}>
              <div style={{
                width: "50px", height: "50px", background: cfg.bg, borderRadius: "14px",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `1px solid ${cfg.border}`, flexShrink: 0
              }}>
                <cfg.icon size={24} color={cfg.color} />
              </div>
              <div style={{ flex: 1, minWidth: "180px" }}>
                <div style={{ color: cfg.color, fontWeight: 800, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>{cfg.label} · {ano}</div>
                <div style={{ color: "var(--text-primary)", fontSize: "28px", fontWeight: 900, letterSpacing: "-1px", marginBottom: "4px" }}>{fmt(resultado)}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{cfg.msg}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "4px" }}>Margem Líquida</div>
                <div style={{ color: cfg.color, fontSize: "24px", fontWeight: 800 }}>{margem.toFixed(1)}%</div>
              </div>
            </div>
          )}

          {/* KPI Cards — grid responsivo */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px", marginBottom: "24px" }}>
            {[
              { label: "Receita Líquida", value: fmt(receita), color: "#10b981", icon: TrendingUp },
              { label: "Despesas Totais", value: fmt(despTotal), color: "#ef4444", icon: TrendingDown },
              { label: "Custo de Insumos", value: fmt(balanco?.despesas?.insumos), color: "#f97316", icon: Minus },
              { label: "Despesas Extras", value: fmt(balanco?.despesas?.extras), color: "#f59e0b", icon: Minus },
              { label: "Ordens no Mês", value: `${kpis?.pedidos_abertos ?? "—"} ordens`, color: "#3b82f6", icon: Activity },
              { label: "Est. Crítico", value: kpis ? `${kpis.estoque_critico}` : "—", color: kpis?.estoque_critico > 0 ? "#ef4444" : "#10b981", icon: AlertTriangle },
            ].map(card => (
              <div key={card.label} style={{
                background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
                borderRadius: "12px", padding: "16px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div style={{ color: "var(--text-muted)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</div>
                  <card.icon size={13} color={card.color} />
                </div>
                <div style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 700, wordBreak: "break-all" }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Gráfico de Barras — com scroll se necessário */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
            <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "15px", marginBottom: "18px" }}>Fluxo Mensal — {ano}</div>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <div style={{ display: "flex", gap: "6px", alignItems: "flex-end", height: "160px", minWidth: "400px" }}>
                {meses.map((m, i) => {
                  const hRec = (m.receita / maxVal) * 140
                  const hDesp = (m.despesa / maxVal) * 140
                  const isLucro = m.lucro >= 0
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", minWidth: "28px" }}>
                      <div style={{ width: "100%", display: "flex", gap: "2px", alignItems: "flex-end", height: "140px" }}>
                        <div title={`Receita: ${fmt(m.receita)}`} style={{
                          flex: 1, background: "#10b981", borderRadius: "3px 3px 0 0",
                          height: `${Math.max(hRec, 4)}px`, transition: "height 0.3s"
                        }} />
                        <div title={`Despesa: ${fmt(m.despesa)}`} style={{
                          flex: 1, background: "#ef4444", borderRadius: "3px 3px 0 0",
                          height: `${Math.max(hDesp, 4)}px`, transition: "height 0.3s"
                        }} />
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "10px", fontWeight: 600 }}>{MESES[i]}</div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div style={{ display: "flex", gap: "16px", marginTop: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "10px", height: "10px", background: "#10b981", borderRadius: "3px" }} />
                <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Receita</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "10px", height: "10px", background: "#ef4444", borderRadius: "3px" }} />
                <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Despesa</span>
              </div>
            </div>
          </div>

          {/* Tabela DRE — com scroll */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "20px" }}>
            <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "15px", marginBottom: "18px" }}>DRE — Demonstração Mês a Mês</div>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "480px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    {["Mês", "Receita", "Despesa", "Resultado", "Status"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
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
                      <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "10px 12px", color: "var(--text-primary)", fontSize: "13px", fontWeight: 600 }}>{MESES[i]}</td>
                        <td style={{ padding: "10px 12px", color: "#10b981", fontSize: "13px", whiteSpace: "nowrap" }}>{fmt(m.receita)}</td>
                        <td style={{ padding: "10px 12px", color: "#ef4444", fontSize: "13px", whiteSpace: "nowrap" }}>{fmt(m.despesa)}</td>
                        <td style={{ padding: "10px 12px", color: cor, fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap" }}>{fmt(m.lucro)}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: `${cor}20`, color: cor, whiteSpace: "nowrap" }}>{statusTxt}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid var(--border-default)" }}>
                    <td style={{ padding: "12px", color: "var(--text-secondary)", fontWeight: 700, fontSize: "13px" }}>TOTAL</td>
                    <td style={{ padding: "12px", color: "#10b981", fontWeight: 800, fontSize: "13px", whiteSpace: "nowrap" }}>{fmt(receita)}</td>
                    <td style={{ padding: "12px", color: "#ef4444", fontWeight: 800, fontSize: "13px", whiteSpace: "nowrap" }}>{fmt(despTotal)}</td>
                    <td style={{ padding: "12px", color: cfg.color, fontWeight: 900, fontSize: "14px", whiteSpace: "nowrap" }}>{fmt(resultado)}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 800, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: "nowrap" }}>{cfg.label}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
