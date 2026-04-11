import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle2, TrendingDown, TrendingUp, DollarSign } from "lucide-react"

export default function Balanco() {
  const [balanco, setBalanco] = useState(null)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  
  const loadBalanco = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/financeiro/balanco?ano=${ano}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('jwt_token')}` }
      })
      if (response.ok) {
        setBalanco(await response.json())
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadBalanco()
  }, [ano])

  if (loading) return <div style={{ color: "#94a3b8" }}>Calculando Balanço Patrimonial...</div>
  if (!balanco) return null

  const isLucro = balanco.resultado_liquido > 0
  const isPrejuizo = balanco.resultado_liquido < 0

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ color: "white", fontSize: "20px", fontWeight: 700, margin: 0 }}>DRE - Demonstração de Resultado e Caixa</h2>
          <div style={{ color: "#94a3b8", fontSize: "14px" }}>Visão macro da saúde financeira da empresa consolidada por ano base.</div>
        </div>
        
        <select value={ano} onChange={e => setAno(e.target.value)} style={{
          background: "#1e293b", color: "white", border: "1px solid rgba(255,255,255,0.1)", 
          borderRadius: "6px", padding: "8px 20px", outline: "none", fontSize: "16px", fontWeight: 600
        }}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>Balanço de {y}</option>)}
        </select>
      </div>

      {isPrejuizo && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: "12px", padding: "16px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
          <AlertCircle size={32} color="#ef4444" />
          <div>
            <div style={{ color: "#ef4444", fontWeight: 700, fontSize: "16px" }}>ALERTA DE CAPITAL DE GIRO — PREJUÍZO OPERACIONAL</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>A operação este ano apresenta saldo negativo. Revisa os custos de insumo ou corte despesas extras. Será necessário capital de liquidez no caixa.</div>
          </div>
        </div>
      )}

      {isLucro && (
        <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", borderRadius: "12px", padding: "16px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
          <CheckCircle2 size={32} color="#10b981" />
          <div>
            <div style={{ color: "#10b981", fontWeight: 700, fontSize: "16px" }}>EMPRESA SAUDÁVEL — GERAÇÃO DE LUCRO</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>Parabéns. O caixa está positivo trazendo lucratividade de {balanco.margem_lucro_percentual}% esse ano.</div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "32px" }}>
        <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
            <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>Receita Líquida (Entradas)</div>
            <div style={{ color: "#10b981", fontSize: "32px", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
               <TrendingUp size={24} /> + R$ {balanco.receita_liquida_total.toFixed(2)}
            </div>
            <div style={{ color: "#64748b", fontSize: "12px", marginTop: "12px" }}>Resultado operacional de vendas.</div>
        </div>
        <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
            <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>Custo Total (Saídas)</div>
            <div style={{ color: "#ef4444", fontSize: "32px", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
               <TrendingDown size={24} /> - R$ {balanco.despesas.total.toFixed(2)}
            </div>
            <div style={{ color: "#64748b", fontSize: "12px", marginTop: "12px" }}>Insumos: R$ {balanco.despesas.insumos} | Extras: R$ {balanco.despesas.extras}</div>
        </div>
        <div style={{ background: isLucro ? "rgba(16, 185, 129, 0.15)" : isPrejuizo ? "rgba(239, 68, 68, 0.15)" : "#1e293b", 
          border: `1px solid ${isLucro ? '#10b981' : isPrejuizo ? '#ef4444' : 'rgba(255,255,255,0.05)'}`, borderRadius: "16px", padding: "24px" }}>
            <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>Resultado Líquido do Ano</div>
            <div style={{ color: isLucro ? "#10b981" : isPrejuizo ? "#ef4444" : "white", fontSize: "32px", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
               <DollarSign size={24} /> R$ {Math.abs(balanco.resultado_liquido).toFixed(2)}
            </div>
            <div style={{ color: isLucro ? "#10b981" : isPrejuizo ? "#ef4444" : "#94a3b8", fontSize: "13px", fontWeight: 700, marginTop: "12px" }}>
              Margem de retenção: {balanco.margem_lucro_percentual}%
            </div>
        </div>
      </div>

      <h3 style={{ color: "white", fontSize: "16px", marginBottom: "16px" }}>Fluxo de Caixa Mês a Mês ({ano})</h3>
      <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left" }}>
                <th style={{ padding: "12px", color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>Mês</th>
                <th style={{ padding: "12px", color: "#10b981", fontSize: "12px", fontWeight: 600 }}>Receitas</th>
                <th style={{ padding: "12px", color: "#ef4444", fontSize: "12px", fontWeight: 600 }}>Despesas</th>
                <th style={{ padding: "12px", color: "white", fontSize: "12px", fontWeight: 600 }}>Resultado no Mês</th>
              </tr>
            </thead>
            <tbody>
              {balanco.meses.map(m => (
                <tr key={m.mes} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "12px", color: "white", fontSize: "14px", fontWeight: 600 }}>
                    {["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][m.mes-1]}
                  </td>
                  <td style={{ padding: "12px", color: "#10b981", fontSize: "14px" }}>R$ {m.receita.toFixed(2)}</td>
                  <td style={{ padding: "12px", color: "#ef4444", fontSize: "14px" }}>- R$ {m.despesa.toFixed(2)}</td>
                  <td style={{ padding: "12px", color: m.lucro > 0 ? "#10b981" : (m.lucro < 0 ? "#ef4444" : "white"), fontSize: "14px", fontWeight: 700 }}>
                    R$ {m.lucro.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    </div>
  )
}
