import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building2, Package, Calculator, ShoppingCart, Activity,
  UserCheck, TrendingUp, ArrowUpRight, AlertTriangle, Award, Target
} from "lucide-react"
import axios from "axios"

const modules = [
  { title: "Produção",     desc: "Ordens e chão de fábrica",    icon: Building2,   accent: "#f97316", bg: "rgba(249,115,22,0.10)",  border: "rgba(249,115,22,0.20)",  route: "/dashboard/producao" },
  { title: "Estoque",      desc: "Gestão de insumos e produtos", icon: Package,     accent: "#3b82f6", bg: "rgba(59,130,246,0.10)",  border: "rgba(59,130,246,0.20)",  route: "/dashboard/estoque" },
  { title: "Financeiro",   desc: "Contas a pagar e receber",     icon: Calculator,  accent: "#10b981", bg: "rgba(16,185,129,0.10)",  border: "rgba(16,185,129,0.20)",  route: "/dashboard/financeiro" },
  { title: "Vendas",       desc: "Faturamento e emissão NF-e",   icon: ShoppingCart,accent: "#8b5cf6", bg: "rgba(139,92,246,0.10)", border: "rgba(139,92,246,0.20)",  route: "/dashboard/vendas" },
  { title: "Gestão / DRE", desc: "Relatórios gerenciais e fluxo",icon: Activity,    accent: "#06b6d4", bg: "rgba(6,182,212,0.10)",  border: "rgba(6,182,212,0.20)",   route: "/dashboard/gestao" },
]

const fmt = v => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`

export default function Dashboard() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [kpis, setKpis] = useState(null)
  const [resumoVendas, setResumoVendas] = useState(null)
  const [marketplacesKpi, setMarketplacesKpi] = useState([])
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("jwt_token")
    const headers = { Authorization: `Bearer ${token}` }

    axios.get("/api/me", { headers }).then(res => {
      setIsAdmin(res.data.is_admin)
      localStorage.setItem("is_admin", res.data.is_admin ? "true" : "false")
    }).catch(() => {})

    axios.get("/api/financeiro/dashboard-kpis", { headers }).then(res => setKpis(res.data)).catch(() => {})
    axios.get("/api/vendas/kpi/resumo", { headers }).then(res => setResumoVendas(res.data)).catch(() => {})
    axios.get("/api/vendas/kpi/marketplaces", { headers }).then(res => setMarketplacesKpi(res.data)).catch(() => {})

    // Delay para animação de entrada stagger
    setTimeout(() => setVisible(true), 50)
  }, [])

  const kpiCards = [
    {
      label: "Produção Hoje",
      value: kpis ? `${kpis.producao_hoje} un.` : "—",
      delta: kpis?.producao_hoje > 0 ? "✅ Ativo" : "Nenhuma hoje",
      color: "#f97316", alert: false, bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.18)",
    },
    {
      label: "Receita do Mês",
      value: kpis ? `R$ ${kpis.receita_mes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—",
      delta: kpis?.receita_mes > 0 ? "↑ No período" : "Sem receita",
      color: "#10b981", alert: false, bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.18)",
    },
    {
      label: "Prod. no Mês",
      value: kpis ? `${kpis.pedidos_abertos} ordens` : "—",
      delta: kpis?.pedidos_abertos > 0 ? "↑ Ordens geradas" : "Nenhuma",
      color: "#3b82f6", alert: false, bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.18)",
    },
    {
      label: "Estoque Crítico",
      value: kpis ? `${kpis.estoque_critico} itens` : "—",
      delta: kpis?.estoque_critico > 0 ? "⚠️ Atenção necessária" : "✅ Estoque OK",
      color: kpis?.estoque_critico > 0 ? "#f43f5e" : "#10b981",
      alert: kpis?.estoque_critico > 0,
      bg: kpis?.estoque_critico > 0 ? "rgba(244,63,94,0.07)" : "rgba(16,185,129,0.07)",
      border: kpis?.estoque_critico > 0 ? "rgba(244,63,94,0.22)" : "rgba(16,185,129,0.18)",
    },
  ]

  const allModules = isAdmin
    ? [...modules, { title: "Controle de Acesso", desc: "Aprovar novos cadastros", icon: UserCheck, accent: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.20)", route: "/dashboard/approvals" }]
    : modules

  const topProdutos = resumoVendas?.ranking_produtos?.slice(0, 5) || []
  const topMarketplaces = [...marketplacesKpi].sort((a, b) => b.receita - a.receita).slice(0, 5)
  const totalReceita = marketplacesKpi.reduce((soma, m) => soma + m.receita, 0)

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: "1200px" }}>

      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--accent-indigo)", boxShadow: "0 0 8px var(--accent-indigo)" }} />
          <span style={{ color: "var(--accent-indigo)", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
            Centro de Controle
          </span>
        </div>
        <h1 style={{ color: "var(--text-primary)", fontSize: "26px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "5px" }}>
          Visão Geral dos Módulos
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Acesse e monitore cada área operacional da empresa.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "28px" }}>
        {kpiCards.map((kpi, i) => (
          <div
            key={kpi.label}
            className={`animate-fade-up stagger-${i + 1}`}
            style={{
              background: kpi.bg,
              border: `1px solid ${kpi.border}`,
              borderRadius: "14px",
              padding: "20px 22px",
              position: "relative",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)" }}
            onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}
          >
            {kpi.alert && (
              <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                <AlertTriangle size={15} color="#f43f5e" />
              </div>
            )}
            <div style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }}>
              {kpi.label}
            </div>
            <div style={{ color: "var(--text-primary)", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "6px" }}>
              {kpi.value}
            </div>
            <div style={{ color: kpi.color, fontSize: "12px", fontWeight: 600 }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Module Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "14px", marginBottom: "32px" }}>
        {allModules.map((mod, i) => (
          <div
            key={i}
            onClick={() => navigate(mod.route)}
            onMouseEnter={() => setHoveredCard(i)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`animate-fade-up stagger-${Math.min(i + 1, 6)}`}
            style={{
              background: hoveredCard === i ? "var(--bg-card-hover)" : "var(--bg-card)",
              border: `1px solid ${hoveredCard === i ? `${mod.accent}35` : "var(--border-subtle)"}`,
              borderRadius: "16px",
              padding: "22px",
              cursor: "pointer",
              transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
              transform: hoveredCard === i ? "translateY(-4px)" : "none",
              boxShadow: hoveredCard === i ? `0 12px 40px ${mod.bg}, var(--shadow-md)` : "var(--shadow-sm)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
              <div style={{
                width: "44px", height: "44px",
                background: mod.bg, border: `1px solid ${mod.border}`,
                borderRadius: "12px",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "transform 0.2s",
                transform: hoveredCard === i ? "scale(1.08)" : "scale(1)",
              }}>
                <mod.icon size={20} color={mod.accent} />
              </div>
              <ArrowUpRight
                size={16}
                color={hoveredCard === i ? mod.accent : "var(--text-muted)"}
                style={{ transition: "color 0.2s, transform 0.2s", transform: hoveredCard === i ? "translate(2px,-2px)" : "none" }}
              />
            </div>
            <h3 style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 700, marginBottom: "4px" }}>{mod.title}</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "18px", lineHeight: 1.5 }}>{mod.desc}</p>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              color: mod.accent, fontSize: "12px", fontWeight: 600,
              padding: "5px 12px",
              background: mod.bg, borderRadius: "99px",
              border: `1px solid ${mod.border}`,
              transition: "all 0.2s",
            }}>
              Acessar Módulo
              <ArrowUpRight size={12} />
            </div>
          </div>
        ))}
      </div>

      {/* Inteligência de Vendas */}
      {(topProdutos.length > 0 || topMarketplaces.length > 0) && (
        <div className="animate-fade-up stagger-6">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <TrendingUp size={16} color="#8b5cf6" />
            <span style={{ color: "#8b5cf6", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px" }}>
              Inteligência de Vendas
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "14px" }}>

            {/* Top Produtos */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
                <Award size={17} color="#f59e0b" />
                <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "14px" }}>Top Produtos Vendidos</span>
              </div>
              {topProdutos.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "13px", padding: "16px 0" }}>Sem dados de vendas ainda.</div>
              ) : topProdutos.map((p, idx) => (
                <div key={p.produto} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{
                      width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800,
                      background: idx === 0 ? "rgba(245,158,11,0.18)" : idx === 1 ? "rgba(156,163,175,0.18)" : "rgba(180,120,60,0.14)",
                      color: idx === 0 ? "#fbbf24" : idx === 1 ? "#9ca3af" : "#b4783c",
                      border: `1px solid ${idx === 0 ? "rgba(245,158,11,0.35)" : idx === 1 ? "rgba(156,163,175,0.35)" : "rgba(180,120,60,0.28)"}`,
                    }}>{idx + 1}</span>
                    <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600 }}>{p.produto}</span>
                  </div>
                  <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "13px" }}>{p.quantidade} un.</span>
                </div>
              ))}
            </div>

            {/* Top Marketplaces */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
                <Target size={17} color="#8b5cf6" />
                <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "14px" }}>Receita por Canal</span>
              </div>
              {topMarketplaces.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "13px", padding: "16px 0" }}>Sem dados de vendas ainda.</div>
              ) : topMarketplaces.map(m => {
                const pct = totalReceita > 0 ? (m.receita / totalReceita * 100) : 0
                return (
                  <div key={m.marketplace} style={{ padding: "9px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600 }}>{m.marketplace}</span>
                      <span style={{ color: "#8b5cf6", fontWeight: 700, fontSize: "13px" }}>{fmt(m.receita)}</span>
                    </div>
                    <div style={{ background: "var(--border-subtle)", borderRadius: "99px", height: "5px", overflow: "hidden" }}>
                      <div style={{ background: "linear-gradient(90deg, #8b5cf6, #6366f1)", width: `${pct}%`, height: "100%", borderRadius: "99px", transition: "width 0.7s ease" }} />
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px" }}>{pct.toFixed(1)}% do total · {m.quantidade} venda(s)</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
