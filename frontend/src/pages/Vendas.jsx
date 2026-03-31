import { useNavigate } from "react-router-dom"
import { ShoppingCart } from "lucide-react"

export default function Vendas() {
  const navigate = useNavigate()
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
          <div style={{ color: "#8b5cf6", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>ERP Produção</div>
          <h1 style={{ color: "white", fontSize: "24px", fontWeight: 800, margin: 0 }}>Minhas Vendas</h1>
        </div>
      </div>
      <div style={{
        background: "#0f1629", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px",
        padding: "60px", textAlign: "center",
      }}>
        <div style={{ width: "72px", height: "72px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
          borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <ShoppingCart size={32} color="#8b5cf6" />
        </div>
        <div style={{ color: "white", fontSize: "20px", fontWeight: 800, marginBottom: "10px" }}>Módulo em Desenvolvimento</div>
        <div style={{ color: "#475569", fontSize: "14px", maxWidth: "400px", margin: "0 auto 24px" }}>
          O módulo Minhas Vendas está sendo desenvolvido. Em breve terá faturamento, pedidos de venda e emissão de NF-e.
        </div>
        <span style={{ padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
          background: "rgba(234,179,8,0.1)", color: "#fbbf24", border: "1px solid rgba(234,179,8,0.3)" }}>
          🚧 Em breve
        </span>
      </div>
    </div>
  )
}
