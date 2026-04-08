import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, Package, Calculator, ShoppingCart, Activity, UserCheck, TrendingUp, ArrowUpRight, AlertTriangle, Award, Target } from "lucide-react"
import axios from "axios"

const modules = [
  { title: "Produção", desc: "Ordens e chão de fábrica", icon: Building2, accent: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.2)", route: "/dashboard/producao" },
  { title: "Estoque", desc: "Gestão de insumos e produtos", icon: Package, accent: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)", route: "/dashboard/estoque" },
  { title: "Financeiro", desc: "Contas a pagar e receber", icon: Calculator, accent: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)", route: "/dashboard/financeiro" },
  { title: "Vendas", desc: "Faturamento e emissão NF-e", icon: ShoppingCart, accent: "#8b5cf6", bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.2)", route: "/dashboard/vendas" },
  { title: "Gestão / DRE", desc: "Relatórios gerenciais e fluxo", icon: Activity, accent: "#06b6d4", bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.2)", route: "/dashboard/gestao" },
]

const fmt = v => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`

export default function Dashboard() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [kpis, setKpis] = useState(null)
  const [resumoVendas, setResumoVendas] = useState(null)
  const [marketplacesKpi, setMarketplacesKpi] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("jwt_token")
    const headers = { Authorization: `Bearer ${token}` }

    axios.get("/api/me", { headers }).then(res => {
      setIsAdmin(res.data.is_admin)
      localStorage.setItem("is_admin", res.data.is_admin ? "true" : "false")
    }).catch(() => {})

    axios.get("/api/financeiro/dashboard-kpis", { headers }).then(res => setKpis(res.data)).catch(() => {})

    // KPIs de Vendas para a seção de Inteligência
    axios.get("/api/vendas/kpi/resumo", { headers }).then(res => setResumoVendas(res.data)).catch(() => {})
    axios.get("/api/vendas/kpi/marketplaces", { headers }).then(res => setMarketplacesKpi(res.data)).catch(() => {})
  }, [])

  const kpiCards = [
    {
      label: "Produção Hoje",
      value: kpis ? `${kpis.producao_hoje} un.` : "—",
      delta: kpis?.producao_hoje > 0 ? "✅ Ativo" : "Nenhuma hoje",
      color: "#f97316", alert: false,
    },
    {
      label: "Receita do Mês",
      value: kpis ? `R$ ${kpis.receita_mes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—",
      delta: kpis?.receita_mes > 0 ? "↑ No período" : "Sem receita",
      color: "#10b981", alert: false,
    },
    {
      label: "Prod. no Mês",
      value: kpis ? `${kpis.pedidos_abertos} ordens` : "—",
      delta: kpis?.pedidos_abertos > 0 ? "↑ Ordens geradas" : "Nenhuma",
      color: "#3b82f6", alert: false,
    },
    {
      label: "Estoque Crítico",
      value: kpis ? `${kpis.estoque_critico} itens` : "—",
      delta: kpis?.estoque_critico > 0 ? "⚠️ Atenção necessária" : "✅ Estoque OK",
      color: kpis?.estoque_critico > 0 ? "#ef4444" : "#10b981",
      alert: kpis?.estoque_critico > 0,
    },
  ]

  const allModules = isAdmin
    ? [...modules, { title: "Controle de Acesso", desc: "Aprovar novos cadastros", icon: UserCheck, accent: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", route: "/dashboard/approvals" }]
    : modules

  const topProdutos = resumoVendas?.ranking_produtos?.slice(0, 5) || []
  const topMarketplaces = [...marketplacesKpi].sort((a, b) => b.receita - a.receita).slice(0, 5)
  const totalReceita = marketplacesKpi.reduce((soma, m) => soma + m.receita, 0)

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: "1200px" }}>
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <TrendingUp size={18} color="#3b82f6" />
          <span style={{ color: "#3b82f6", fontSize: "13px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
            Centro de Controle
          </span>
        </div>
        <h1 style={{ color: "white", fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "6px" }}>
          Visão Geral dos Módulos
        </h1>
        <p style={{ color: "#475569", fontSize: "14px" }}>
          Acesse e monitore cada área operacional da empresa.
        </p>
      </div>

      {/* KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {kpiCards.map((kpi) => (
          <div key={kpi.label} style={{
            background: kpi.alert ? "rgba(239,68,68,0.05)" : "#0f1629",
            border: `1px solid ${kpi.alert ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.06)"}`,
            borderRadius: "12px", padding: "20px 22px", position: "relative"
          }}>
            {kpi.alert && (
              <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                <AlertTriangle size={16} color="#ef4444" />
              </div>
            )}
            <div style={{ color: "#475569", fontSize: "12px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>{kpi.label}</div>
            <div style={{ color: "white", fontSize: "22px", fontWeight: 700, letterSpacing: "-0.5px", marginBottom: "6px" }}>{kpi.value}</div>
            <div style={{ color: kpi.color, fontSize: "12px", fontWeight: 600 }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Module Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {allModules.map((mod, i) => (
          <div
            key={i}
            onClick={() => navigate(mod.route)}
            onMouseEnter={() => setHoveredCard(i)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: hoveredCard === i ? "#111827" : "#0f1629",
              border: `1px solid ${hoveredCard === i ? mod.border : "rgba(255,255,255,0.06)"}`,
              borderRadius: "14px", padding: "24px", cursor: "pointer",
              transition: "all 0.2s ease",
              transform: hoveredCard === i ? "translateY(-3px)" : "none",
              boxShadow: hoveredCard === i ? `0 8px 32px ${mod.bg}` : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ width: "44px", height: "44px", background: mod.bg, border: `1px solid ${mod.border}`, borderRadius: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <mod.icon size={20} color={mod.accent} />
              </div>
              <ArrowUpRight size={16} color={hoveredCard === i ? mod.accent : "#334155"} style={{ transition: "color 0.2s" }} />
            </div>
            <h3 style={{ color: "white", fontSize: "16px", fontWeight: 700, marginBottom: "5px" }}>{mod.title}</h3>
            <p style={{ color: "#475569", fontSize: "13px", marginBottom: "20px" }}>{mod.desc}</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: mod.accent, fontSize: "12px", fontWeight: 600, padding: "5px 10px", background: mod.bg, borderRadius: "20px", border: `1px solid ${mod.border}` }}>
              Acessar Módulo →
            </div>
          </div>
        ))}
      </div>

      {/* Seção: Inteligência de Vendas */}
      {(topProdutos.length > 0 || topMarketplaces.length > 0) && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <TrendingUp size={16} color="#8b5cf6" />
            <span style={{ color: "#8b5cf6", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Inteligência de Vendas
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

            {/* Top Produtos */}
            <div style={{ background: "#0f1629", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
                <Award size={18} color="#f59e0b" />
                <span style={{ color: "white", fontWeight: 700, fontSize: "15px" }}>Top Produtos Vendidos</span>
              </div>
              {topProdutos.length === 0 ? (
                <div style={{ color: "#475569", fontSize: "13px", padding: "16px 0" }}>Sem dados de vendas ainda.</div>
              ) : (
                topProdutos.map((p, idx) => (
                  <div key={p.produto} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{
                        width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "11px", fontWeight: 800,
                        background: idx === 0 ? "rgba(245,158,11,0.2)" : idx === 1 ? "rgba(156,163,175,0.2)" : "rgba(180,120,60,0.15)",
                        color: idx === 0 ? "#fbbf24" : idx === 1 ? "#9ca3af" : "#b4783c",
                        border: `1px solid ${idx === 0 ? "rgba(245,158,11,0.4)" : idx === 1 ? "rgba(156,163,175,0.4)" : "rgba(180,120,60,0.3)"}`,
                      }}>{idx + 1}</span>
                      <span style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: 600 }}>{p.produto}</span>
                    </div>
                    <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "13px" }}>{p.quantidade} un.</span>
                  </div>
                ))
              )}
            </div>

            {/* Top Marketplaces */}
            <div style={{ background: "#0f1629", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
                <Target size={18} color="#8b5cf6" />
                <span style={{ color: "white", fontWeight: 700, fontSize: "15px" }}>Receita por Canal</span>
              </div>
              {topMarketplaces.length === 0 ? (
                <div style={{ color: "#475569", fontSize: "13px", padding: "16px 0" }}>Sem dados de vendas ainda.</div>
              ) : (
                topMarketplaces.map(m => {
                  const pct = totalReceita > 0 ? (m.receita / totalReceita * 100) : 0
                  return (
                    <div key={m.marketplace} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <span style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: 600 }}>{m.marketplace}</span>
                        <span style={{ color: "#8b5cf6", fontWeight: 700, fontSize: "13px" }}>{fmt(m.receita)}</span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "99px", height: "4px", overflow: "hidden" }}>
                        <div style={{ background: "linear-gradient(90deg, #8b5cf6, #6366f1)", width: `${pct}%`, height: "100%", borderRadius: "99px", transition: "width 0.5s ease" }} />
                      </div>
                      <div style={{ color: "#475569", fontSize: "11px", marginTop: "4px" }}>{pct.toFixed(1)}% do total · {m.quantidade} venda(s)</div>
                    </div>
                  )
                })
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
