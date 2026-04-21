import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import {
  Building2, LayoutDashboard, Package, Calculator,
  ShoppingCart, UserCheck, LogOut, LineChart, ChevronLeft,
  Menu, Settings, HelpCircle, Sun, Moon, X
} from "lucide-react"
import Configuracoes from "../pages/Configuracoes"
import { useTheme } from "../contexts/ThemeContext"

const navItems = [
  { title: "Visão Geral",     icon: LayoutDashboard, href: "/dashboard",              accent: "#6366f1" },
  { title: "Produção",        icon: Building2,        href: "/dashboard/producao",     accent: "#f97316" },
  { title: "Estoque",         icon: Package,          href: "/dashboard/estoque",      accent: "#3b82f6" },
  { title: "Financeiro",      icon: Calculator,       href: "/dashboard/financeiro",   accent: "#10b981" },
  { title: "Vendas",          icon: ShoppingCart,     href: "/dashboard/vendas",       accent: "#8b5cf6" },
  { title: "Gestão / DRE",    icon: LineChart,        href: "/dashboard/gestao",       accent: "#06b6d4" },
  { title: "Central de Ajuda",icon: HelpCircle,       href: "/dashboard/ajuda",        accent: "#f59e0b" },
]

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [empresaNome, setEmpresaNome] = useState(localStorage.getItem("empresa_nome") || "")
  const [empresaLogo, setEmpresaLogo] = useState(localStorage.getItem("empresa_logo") || null)
  const [userName, setUserName] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

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

    const onUpdate = () => {
      setEmpresaNome(localStorage.getItem("empresa_nome") || "")
      setEmpresaLogo(localStorage.getItem("empresa_logo") || null)
    }
    window.addEventListener("empresa-atualizada", onUpdate)
    return () => window.removeEventListener("empresa-atualizada", onUpdate)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Fechar drawer ao navegar no mobile
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const allItems = isAdmin
    ? [...navItems, { title: "Controle de Acesso", icon: UserCheck, href: "/dashboard/approvals", accent: "#f59e0b" }]
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

  // ──────────────────────────────────────────────────────────────
  // Conteúdo da Sidebar (reutilizado no desktop e no drawer mobile)
  // ──────────────────────────────────────────────────────────────
  const SidebarContent = ({ onClose }) => (
    <aside
      style={{
        width: isMobile ? "260px" : sidebarWidth,
        minWidth: isMobile ? "260px" : sidebarWidth,
        height: "100%",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Gradiente decorativo no topo da sidebar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "120px",
        background: "linear-gradient(180deg, rgba(99,102,241,0.07) 0%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* Logo + botão colapsar */}
      <div style={{
        height: "64px", display: "flex", alignItems: "center",
        padding: collapsed && !isMobile ? "0 16px" : "0 16px",
        borderBottom: "1px solid var(--border-subtle)",
        justifyContent: "space-between",
        flexShrink: 0, position: "relative", zIndex: 1,
      }}>
        {(!collapsed || isMobile) && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px", height: "32px",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              borderRadius: "9px",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
            }}>
              <Building2 size={16} color="white" />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "14px", letterSpacing: "-0.3px", lineHeight: 1 }}>
                ERP SATOS
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "10px", fontWeight: 500, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Sistema ERP
              </span>
            </div>
          </div>
        )}

        {/* Botão fechar mobile ou colapsar desktop */}
        {isMobile ? (
          <button
            onClick={onClose}
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "6px", cursor: "pointer", color: "var(--text-muted)", display: "flex", marginLeft: "auto" }}
          >
            <X size={16} />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
              borderRadius: "8px", padding: "6px", cursor: "pointer",
              color: "var(--text-muted)", display: "flex",
              transition: "all 0.2s",
              marginLeft: collapsed ? "auto" : undefined,
            }}
            onMouseOver={e => { e.currentTarget.style.background = "var(--bg-card-hover)"; e.currentTarget.style.color = "var(--text-primary)" }}
            onMouseOut={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-muted)" }}
          >
            <ChevronLeft size={15} style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s" }} />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto", overflowX: "hidden" }}>
        {/* Label seção */}
        {(!collapsed || isMobile) && (
          <div style={{ color: "var(--text-muted)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", padding: "4px 10px 8px", marginTop: "2px" }}>
            Navegação
          </div>
        )}

        {allItems.map((item) => {
          const active = location.pathname === item.href || (item.href !== "/dashboard" && location.pathname.startsWith(item.href))
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              title={collapsed && !isMobile ? item.title : ""}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 10px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                marginBottom: "2px",
                transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
                background: active ? `${item.accent}18` : "transparent",
                color: active ? item.accent : "var(--text-muted)",
                justifyContent: collapsed && !isMobile ? "center" : "flex-start",
                whiteSpace: "nowrap",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseOver={e => { if (!active) { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)" } }}
              onMouseOut={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)" } }}
            >
              {/* Indicador ativo */}
              {active && (
                <div style={{
                  position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                  width: "3px", height: "60%", borderRadius: "0 3px 3px 0",
                  background: item.accent,
                }} />
              )}
              <item.icon size={17} style={{ flexShrink: 0 }} />
              {(!collapsed || isMobile) && (
                <span style={{ fontSize: "13.5px", fontWeight: active ? 600 : 400, flex: 1 }}>
                  {item.title}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer da sidebar: logout */}
      <div style={{ padding: "8px", borderTop: "1px solid var(--border-subtle)", flexShrink: 0 }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: "10px",
            padding: "9px 10px", borderRadius: "10px", border: "none", cursor: "pointer",
            color: "var(--text-muted)", background: "transparent", transition: "all 0.18s",
            justifyContent: collapsed && !isMobile ? "center" : "flex-start", whiteSpace: "nowrap",
            fontFamily: "inherit",
          }}
          onMouseOver={e => { e.currentTarget.style.background = "rgba(244,63,94,0.08)"; e.currentTarget.style.color = "#f43f5e" }}
          onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)" }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {(!collapsed || isMobile) && <span style={{ fontSize: "13.5px", fontWeight: 500 }}>Sair do Sistema</span>}
        </button>
      </div>
    </aside>
  )

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-base)", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* ── SIDEBAR DESKTOP ── */}
      {!isMobile && <SidebarContent />}

      {/* ── OVERLAY + DRAWER MOBILE ── */}
      {isMobile && mobileOpen && (
        <>
          {/* Overlay escurecido */}
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(2px)",
              animation: "fadeIn 0.2s ease both",
            }}
          />
          {/* Drawer */}
          <div style={{
            position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 201,
            animation: "slideInLeft 0.25s cubic-bezier(0.4,0,0.2,1) both",
            display: "flex",
          }}>
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* ── MAIN ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* ── TOPBAR ── */}
        <header style={{
          height: "64px", flexShrink: 0,
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px 0 24px",
          gap: "16px",
        }}>
          {/* Esquerda: hamburger mobile + breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            {isMobile && (
              <button
                onClick={() => setMobileOpen(true)}
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "9px", padding: "7px", cursor: "pointer", color: "var(--text-secondary)", display: "flex", flexShrink: 0, transition: "all 0.2s" }}
                onMouseOver={e => { e.currentTarget.style.color = "var(--text-primary)" }}
                onMouseOut={e => { e.currentTarget.style.color = "var(--text-secondary)" }}
              >
                <Menu size={18} />
              </button>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "13px", whiteSpace: "nowrap" }}>Workspace</span>
              <span style={{ color: "var(--border-default)", fontSize: "13px" }}>/</span>
              <span style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {allItems.find(n => location.pathname === n.href || (n.href !== "/dashboard" && location.pathname.startsWith(n.href)))?.title || "Painel"}
              </span>
            </div>
          </div>

          {/* Direita: controles */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>

            {/* Botão Dark / Light Mode */}
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "9px",
                padding: "8px",
                cursor: "pointer",
                color: theme === "dark" ? "#f59e0b" : "#6366f1",
                display: "flex",
                transition: "all 0.25s",
              }}
              onMouseOver={e => { e.currentTarget.style.background = "var(--bg-card-hover)"; e.currentTarget.style.transform = "scale(1.05)" }}
              onMouseOut={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.transform = "scale(1)" }}
            >
              {theme === "dark"
                ? <Sun size={16} />
                : <Moon size={16} />
              }
            </button>

            {/* Configurações (só admin) */}
            {isAdmin && (
              <button
                onClick={() => setShowConfig(true)}
                title="Configurações da Empresa"
                style={{
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.18)",
                  color: "#818cf8",
                  borderRadius: "9px",
                  padding: "8px",
                  cursor: "pointer",
                  display: "flex",
                  transition: "all 0.2s",
                }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)" }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.18)" }}
              >
                <Settings size={16} />
              </button>
            )}

            {/* Divider */}
            <div style={{ width: "1px", height: "28px", background: "var(--border-subtle)" }} />

            {/* Info usuário + avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1px" }}>
                <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {userName || "Usuário"}
                </span>
                {empresaNome && (
                  <span style={{ color: "var(--text-muted)", fontSize: "11px", whiteSpace: "nowrap", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {empresaNome}
                  </span>
                )}
              </div>

              {/* Avatar / Logo */}
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: empresaLogo ? "transparent" : "linear-gradient(135deg, #3b82f6, #6366f1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", flexShrink: 0,
                border: "2px solid rgba(99,102,241,0.25)",
                boxShadow: "0 0 0 2px var(--bg-surface)",
              }}>
                {empresaLogo
                  ? <img src={empresaLogo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  : <span style={{ color: "white", fontSize: "13px", fontWeight: 800 }}>{userInitial}</span>
                }
              </div>
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: isMobile ? "20px 16px" : "32px 36px",
          background: "var(--bg-base)",
          animation: "fadeIn 0.3s ease both",
        }}>
          <Outlet />
        </div>
      </main>

      {/* Modal de configurações */}
      {showConfig && <Configuracoes onClose={() => setShowConfig(false)} />}
    </div>
  )
}
