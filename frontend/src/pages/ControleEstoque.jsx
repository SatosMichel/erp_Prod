import { useState } from "react"
import { useNavigate } from "react-router-dom"
import EntradaInsumo from "./estoque/EntradaInsumo"
import CadastroProduto from "./estoque/CadastroProduto"
import EstoqueInsumo from "./estoque/EstoqueInsumo"
import EstoqueProduto from "./estoque/EstoqueProduto"

const abas = [
  { id: "entrada", label: "Entrada de Insumo", icon: "📥" },
  { id: "cadastro", label: "Cadastro de Produto", icon: "📦" },
  { id: "estoque-insumo", label: "Estoque de Insumo", icon: "🧪" },
  { id: "estoque-produto", label: "Estoque de Produto", icon: "🏭" },
]

export default function ControleEstoque() {
  const [abaAtiva, setAbaAtiva] = useState("entrada")
  const navigate = useNavigate()

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <button onClick={() => navigate("/dashboard")} style={{
          background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
          color: "var(--text-secondary)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit"
        }}>
          ← Dashboard
        </button>
        <div>
          <div style={{ color: "#3b82f6", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            ERP Produção
          </div>
          <h1 style={{ color: "var(--text-primary)", fontSize: "22px", fontWeight: 800, margin: 0 }}>
            Controle de Estoque
          </h1>
        </div>
      </div>

      {/* Tab Navigation — com scroll horizontal no mobile */}
      <div style={{
        display: "flex", gap: "4px", marginBottom: "24px",
        background: "var(--bg-surface)", borderRadius: "12px", padding: "4px",
        border: "1px solid var(--border-subtle)",
        overflowX: "auto", WebkitOverflowScrolling: "touch",
      }}>
        {abas.map(aba => {
          const ativa = abaAtiva === aba.id
          return (
            <button key={aba.id} onClick={() => setAbaAtiva(aba.id)} style={{
              flex: "0 0 auto", padding: "9px 14px", borderRadius: "9px", border: "none", cursor: "pointer",
              background: ativa ? "var(--bg-elevated)" : "transparent",
              color: ativa ? "var(--text-primary)" : "var(--text-muted)",
              fontWeight: ativa ? 700 : 500, fontSize: "13px",
              fontFamily: "inherit",
              boxShadow: ativa ? "var(--shadow-sm)" : "none",
              transition: "all 0.15s ease", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "5px", whiteSpace: "nowrap",
            }}>
              <span>{aba.icon}</span>
              <span>{aba.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {abaAtiva === "entrada" && <EntradaInsumo />}
      {abaAtiva === "cadastro" && <CadastroProduto />}
      {abaAtiva === "estoque-insumo" && <EstoqueInsumo />}
      {abaAtiva === "estoque-produto" && <EstoqueProduto />}
    </div>
  )
}
