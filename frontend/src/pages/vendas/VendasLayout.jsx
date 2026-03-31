import { useState } from "react"
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom"
import NovaVenda from "./NovaVenda"
import HistoricoVendas from "./HistoricoVendas"
import Marketplaces from "./Marketplaces"
import KpiVendas from "./KpiVendas"
import { ShoppingCart, LogOut } from "lucide-react"

const styles = {
  container: { fontFamily: "'Inter', system-ui, sans-serif", maxWidth: "1200px", minHeight: "80vh" },
  headerBox: { marginBottom: "24px" },
  badgeInfo: { color: "#3b82f6", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" },
  title: { color: "white", fontSize: "28px", fontWeight: 800, margin: 0 },
  tabsContainer: {
    display: "flex", gap: "10px", padding: "6px", background: "#0f1629",
    border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", marginBottom: "24px",
    overflowX: "auto"
  },
  tabBtn: (active) => ({
    padding: "10px 24px", fontSize: "14px", fontWeight: 600, color: active ? "white" : "#94a3b8",
    background: active ? "#1e293b" : "transparent",
    border: `1px solid ${active ? "rgba(255,255,255,0.1)" : "transparent"}`,
    borderRadius: "8px", cursor: "pointer", transition: "all 0.2s ease",
    whiteSpace: "nowrap", flexShrink: 0
  }),
  backBtn: {
    display: "inline-flex", alignItems: "center", gap: "6px",
    background: "#1e293b", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.1)",
    padding: "6px 12px", borderRadius: "8px", fontSize: "13px", cursor: "pointer",
    marginBottom: "16px", fontWeight: 500
  }
}

export default function VendasLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { label: "Nova Venda", path: "/dashboard/vendas/nova", icon: "🛒" },
    { label: "Histórico de Vendas", path: "/dashboard/vendas/historico", icon: "📜" },
    { label: "Dashboard & KPIs", path: "/dashboard/vendas/kpi", icon: "📊" },
    { label: "Marketplaces (Taxas)", path: "/dashboard/vendas/marketplaces", icon: "🏪" },
  ]

  const currentPath = location.pathname

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
        ← Dashboard
      </button>

      <div style={styles.headerBox}>
        <div style={styles.badgeInfo}>ERP PRODUÇÃO</div>
        <h1 style={styles.title}>Minhas Vendas</h1>
      </div>

      <div style={styles.tabsContainer}>
        {tabs.map(tab => (
          <button
            key={tab.path}
            style={styles.tabBtn(currentPath === tab.path)}
            onClick={() => navigate(tab.path)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div>
        <Routes>
          <Route path="nova" element={<NovaVenda />} />
          <Route path="historico" element={<HistoricoVendas />} />
          <Route path="kpi" element={<KpiVendas />} />
          <Route path="marketplaces" element={<Marketplaces />} />
          <Route path="/" element={<Navigate to="nova" replace />} />
        </Routes>
      </div>
    </div>
  )
}
