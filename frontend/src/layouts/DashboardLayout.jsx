import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import {
  Building2, LayoutDashboard, Package, Calculator,
  ShoppingCart, UserCheck, LogOut, LineChart, ChevronLeft, Menu, Settings
} from "lucide-react"
import Configuracoes from "../pages/Configuracoes"

const navItems = [
  { title: "Visão Geral", icon: LayoutDashboard, href: "/dashboard" },
  { title: "Produção", icon: Building2, href: "/dashboard/producao" },
  { title: "Estoque", icon: Package, href: "/dashboard/estoque" },
  { title: "Financeiro", icon: Calculator, href: "/dashboard/financeiro" },
  { title: "Vendas", icon: ShoppingCart, href: "/dashboard/vendas" },
  { title: "Gestão / DRE", icon: LineChart, href: "/dashboard/gestao" },
]

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [empresaNome, setEmpresaNome] = useState(localStorage.getItem("empresa_nome") || "")
  const [empresaLogo, setEmpresaLogo] = useState(localStorage.getItem("empresa_logo") || null)
  const [userName, setUserName] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem("jwt_token")
    if (!token) return
    fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setIsAdmin(data.is_admin)
          setUserName(data.nome)
          localStorage.setItem("is_admin", data.is_admin ? "true" : "false")
        }
      })

    // Ouvir atualizações da tela de configurações
    const onUpdate = () => {
      setEmpresaNome(localStorage.getItem("empresa_nome") || "")
      setEmpresaLogo(localStorage.getItem("empresa_logo") || null)
    }
    window.addEventListener("empresa-atualizada", onUpdate)
    return () => window.removeEventListener("empresa-atualizada", onUpdate)
  }, [])

  const allItems = isAdmin
    ? [...navItems, { title: "Controle de Acesso", icon: UserCheck, href: "/dashboard/approvals" }]
    : navItems

  const handleLogout = () => {
    localStorage.removeItem("jwt_token")
    localStorage.removeItem("is_admin")
    localStorage.removeItem("empresa_nome")
    localStorage.removeItem("empresa_logo")
    navigate("/")
  }

  const userInitial = userName ? userName.charAt(0).toUpperCase() : "U"
  const sidebarWidth = collapsed ? "68px" : "240px"

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#0a0e1a", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: sidebarWidth, minWidth: sidebarWidth, background: "#0f1629", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", transition: "width 0.25s ease", overflow: "hidden" }}>
        {/* Logo */}
        <div style={{ height: "60px", display: "flex", alignItems: "center", padding: collapsed ? "0 16px" : "0 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", justifyContent: collapsed ? "center" : "space-between", flexShrink: 0 }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "30px", height: "30px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Building2 size={16} color="white" />
              </div>
              <span style={{ color: "white", fontWeight: 700, fontSize: "15px", letterSpacing: "-0.3px", whiteSpace: "nowrap" }}>ERP SATOS</span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", color: "#64748b", borderRadius: "7px", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "white" }}
            onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#64748b" }}>
            {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto", overflowX: "hidden" }}>
          {allItems.map((item) => {
            const active = location.pathname === item.href
            return (
              <button key={item.href} onClick={() => navigate(item.href)} title={collapsed ? item.title : ""} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", borderRadius: "8px", border: "none", cursor: "pointer", marginBottom: "2px", transition: "all 0.15s", background: active ? "rgba(59,130,246,0.15)" : "transparent", color: active ? "#60a5fa" : "#64748b", justifyContent: collapsed ? "center" : "flex-start", whiteSpace: "nowrap" }}
                onMouseOver={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#cbd5e1" } }}
                onMouseOut={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b" } }}>
                <item.icon size={17} style={{ flexShrink: 0 }} />
                {!collapsed && <span style={{ fontSize: "13.5px", fontWeight: active ? 600 : 400 }}>{item.title}</span>}
                {active && !collapsed && <div style={{ marginLeft: "auto", width: "5px", height: "5px", borderRadius: "50%", background: "#3b82f6", flexShrink: 0 }} />}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: "8px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", borderRadius: "8px", border: "none", cursor: "pointer", color: "#64748b", background: "transparent", transition: "all 0.15s", justifyContent: collapsed ? "center" : "flex-start", whiteSpace: "nowrap" }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#f87171" }}
            onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b" }}>
            <LogOut size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ fontSize: "13.5px", fontWeight: 500 }}>Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Topbar */}
        <header style={{ height: "60px", flexShrink: 0, background: "#0f1629", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#334155", fontSize: "13px" }}>Workspace</span>
            <span style={{ color: "#334155" }}>/</span>
            <span style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>
              {navItems.find(n => n.href === location.pathname)?.title || "Painel"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Botão de configurações */}
            {isAdmin && (
              <button onClick={() => setShowConfig(true)} title="Configurações da Empresa" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8", borderRadius: "8px", padding: "7px", cursor: "pointer", display: "flex", transition: "all 0.2s" }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)" }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)" }}>
                <Settings size={16} />
              </button>
            )}

            {/* Info do usuário + logo */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
              <span style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>{userName || "Usuário"}</span>
              {empresaNome && <span style={{ color: "#475569", fontSize: "11px" }}>{empresaNome}</span>}
            </div>

            {/* Avatar / Logo */}
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: empresaLogo ? "transparent" : "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, border: empresaLogo ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
              {empresaLogo
                ? <img src={empresaLogo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                : <span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>{userInitial}</span>}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 36px", background: "#0a0e1a" }}>
          <Outlet />
        </div>
      </main>

      {/* Modal de configurações */}
      {showConfig && <Configuracoes onClose={() => setShowConfig(false)} />}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
    </div>
  )
}
