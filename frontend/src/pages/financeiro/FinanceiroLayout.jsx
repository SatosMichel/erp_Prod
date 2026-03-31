import { useState } from "react"
import { Routes, Route, useNavigate, useLocation } from "react-router-dom"
import Despesas from "./Despesas"
import Receitas from "./Receitas"
import Balanco from "./Balanco"
import { Calculator, ArrowDownCircle, ArrowUpCircle, BarChart3 } from "lucide-react"

export default function FinanceiroLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { path: "/dashboard/financeiro/balanco", label: "Balanço Empresarial", icon: BarChart3 },
    { path: "/dashboard/financeiro/despesas", label: "Despesas (Pagar)", icon: ArrowDownCircle },
    { path: "/dashboard/financeiro/receitas", label: "Receitas (Receber)", icon: ArrowUpCircle }
  ]

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
        <button onClick={() => navigate("/dashboard")} style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#94a3b8", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "13px"
        }}>
          ← Dashboard
        </button>
        <div>
          <div style={{ color: "#10b981", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>ERP Produção</div>
          <h1 style={{ color: "white", fontSize: "24px", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Calculator size={24} color="#10b981" /> Controle Financeiro
          </h1>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", overflowX: "auto" }}>
        {tabs.map(tab => {
          const isActive = location.pathname.includes(tab.path) || 
                           (tab.path === "/dashboard/financeiro/balanco" && location.pathname === "/dashboard/financeiro")
                           
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "10px",
                border: isActive ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.05)",
                background: isActive ? "rgba(16,185,129,0.1)" : "transparent",
                color: isActive ? "#10b981" : "#94a3b8",
                fontWeight: isActive ? 600 : 500, fontSize: "14px", cursor: "pointer", transition: "all 0.2s"
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div style={{ background: "#0f1629", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "24px", minHeight: "60vh" }}>
        <Routes>
          <Route path="/" element={<Balanco />} />
          <Route path="balanco" element={<Balanco />} />
          <Route path="despesas" element={<Despesas />} />
          <Route path="receitas" element={<Receitas />} />
        </Routes>
      </div>
    </div>
  )
}
