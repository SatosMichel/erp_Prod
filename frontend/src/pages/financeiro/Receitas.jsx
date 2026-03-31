import { useState, useEffect } from "react"
import { TrendingUp, Plus } from "lucide-react"
import { Input } from "../../components/ui/Input"
import { Button } from "../../components/ui/Button"

export default function Receitas() {
  const [receitas, setReceitas] = useState([])
  const [totalBruto, setTotalBruto] = useState(0)
  const [totalLiquido, setTotalLiquido] = useState(0)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  
  const [novaReceita, setNovaReceita] = useState({
    descricao: "", categoria: "Injeção de Capital", valor: "", qtd_parcelas: 1, valor_parcela: "", dia_vencimento: 15, data_receita: new Date().toISOString().split('T')[0]
  })
  
  const loadReceitas = async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/api/financeiro/receitas?mes=${mes}&ano=${ano}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('jwt_token')}` }
      })
      if (response.ok) {
        const data = await response.json()
        setReceitas(data.itens)
        setTotalBruto(data.total_bruto)
        setTotalLiquido(data.total_liquido)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadReceitas()
  }, [mes, ano])

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`http://localhost:8000/api/financeiro/receitas-extras`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('jwt_token')}` 
        },
        body: JSON.stringify({
          descricao: novaReceita.descricao,
          categoria: novaReceita.categoria,
          valor: parseFloat(novaReceita.valor),
          qtd_parcelas: novaReceita.categoria === "Empréstimo" ? parseInt(novaReceita.qtd_parcelas) : 1,
          valor_parcela: novaReceita.categoria === "Empréstimo" ? parseFloat(novaReceita.valor_parcela) : 0,
          dia_vencimento: novaReceita.categoria === "Empréstimo" ? parseInt(novaReceita.dia_vencimento) : null,
          data_receita: novaReceita.data_receita ? new Date(novaReceita.data_receita).toISOString() : null
        })
      })
      if (response.ok) {
        setShowModal(false)
        setNovaReceita({ descricao: "", categoria: "Injeção de Capital", valor: "", qtd_parcelas: 1, valor_parcela: "", dia_vencimento: 15, data_receita: new Date().toISOString().split('T')[0] })
        loadReceitas()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ color: "white", fontSize: "20px", fontWeight: 700, margin: 0 }}>Receitas de Vendas</h2>
          <div style={{ color: "#94a3b8", fontSize: "14px" }}>Valores faturados e taxa retida no período</div>
        </div>
        
        <div style={{ display: "flex", gap: "12px" }}>
          <select value={mes} onChange={e => setMes(e.target.value)} style={{
            background: "#1e293b", color: "white", border: "1px solid rgba(255,255,255,0.1)", 
            borderRadius: "6px", padding: "8px 12px", outline: "none"
          }}>
            <option value={1}>Janeiro</option><option value={2}>Fevereiro</option>
            <option value={3}>Março</option><option value={4}>Abril</option>
            <option value={5}>Maio</option><option value={6}>Junho</option>
            <option value={7}>Julho</option><option value={8}>Agosto</option>
            <option value={9}>Setembro</option><option value={10}>Outubro</option>
            <option value={11}>Novembro</option><option value={12}>Dezembro</option>
          </select>
          <select value={ano} onChange={e => setAno(e.target.value)} style={{
            background: "#1e293b", color: "white", border: "1px solid rgba(255,255,255,0.1)", 
            borderRadius: "6px", padding: "8px 12px", outline: "none"
          }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#10b981", color: "white" }}>
            <Plus size={16} /> Lançar Receita
          </Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
        <div style={{ flex: 1, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={24} color="#10b981" />
          </div>
          <div>
            <div style={{ color: "#10b981", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Receita Líquida no Caixa</div>
            <div style={{ color: "white", fontSize: "28px", fontWeight: 800 }}>R$ {totalLiquido.toFixed(2)}</div>
          </div>
        </div>

        <div style={{ flex: 1, background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
           <div>
            <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Total Bruto (Antes das taxas)</div>
            <div style={{ color: "white", fontSize: "20px", fontWeight: 600 }}>R$ {totalBruto.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "#94a3b8" }}>Carregando...</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left" }}>
              <th style={{ padding: "12px", color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>Data</th>
              <th style={{ padding: "12px", color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>Identificação</th>
              <th style={{ padding: "12px", color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>Origem</th>
              <th style={{ padding: "12px", color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>Valor Bruto</th>
              <th style={{ padding: "12px", color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>Taxas Marketplace</th>
              <th style={{ padding: "12px", color: "#10b981", fontSize: "12px", fontWeight: 600 }}>Valor Líquido (Recebido)</th>
            </tr>
          </thead>
          <tbody>
            {receitas.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Nenhum recebimento aprovado neste período</td></tr>
            ) : receitas.map(v => (
              <tr key={v.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <td style={{ padding: "12px", color: "white", fontSize: "14px" }}>{new Date(v.data).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: "12px", color: "white", fontSize: "14px" }}>
                   {v.tipo === "Venda Marketplace" ? `#${v.id} - ${v.cliente}` : v.cliente}
                </td>
                <td style={{ padding: "12px", fontSize: "13px" }}>
                  <span style={{ 
                    padding: "4px 8px", borderRadius: "12px",
                    background: v.tipo === "Venda Marketplace" ? "rgba(16, 185, 129, 0.1)" : "rgba(168, 85, 247, 0.1)",
                    color: v.tipo === "Venda Marketplace" ? "#10b981" : "#a855f7"
                  }}>{v.tipo}</span>
                </td>
                <td style={{ padding: "12px", color: "#94a3b8", fontSize: "14px" }}>R$ {v.valor_total.toFixed(2)}</td>
                <td style={{ padding: "12px", color: "#f59e0b", fontSize: "14px" }}>
                   {v.tipo === "Venda Marketplace" ? `- R$ ${(v.valor_total - v.valor_liquido).toFixed(2)}` : "-"}
                </td>
                <td style={{ padding: "12px", color: "#10b981", fontSize: "14px", fontWeight: 600 }}>R$ {v.valor_liquido.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#0f1629", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "24px", width: "400px" }}>
            <h3 style={{ color: "white", margin: "0 0 20px 0" }}>Lançar Receita Diversificada</h3>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Origem (Natureza)</label>
                <select value={novaReceita.categoria} onChange={e => setNovaReceita({...novaReceita, categoria: e.target.value})} style={{
                  width: "100%", background: "#1e293b", color: "white", border: "1px solid rgba(255,255,255,0.1)", 
                  borderRadius: "8px", padding: "10px", outline: "none", boxSizing: "border-box"
                }}>
                  <option>Injeção de Capital</option>
                  <option>Empréstimo</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Descrição / Justificativa</label>
                <Input value={novaReceita.descricao} onChange={e => setNovaReceita({...novaReceita, descricao: e.target.value})} required style={{ background: "#1e293b", color: "white", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>

              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Valor Recebido no Caixa (R$)</label>
                <Input type="number" step="0.01" value={novaReceita.valor} onChange={e => setNovaReceita({...novaReceita, valor: e.target.value})} required style={{ background: "#1e293b", color: "white", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>

              {novaReceita.categoria === "Empréstimo" && (
                <div style={{ padding: "12px", background: "rgba(245, 158, 11, 0.1)", borderRadius: "8px", border: "1px dashed rgba(245, 158, 11, 0.3)" }}>
                  <div style={{ color: "#f59e0b", fontSize: "12px", marginBottom: "12px", fontWeight: 600 }}>
                    As parcelas desse empréstimo serão geradas automaticamente no Contas a Pagar (Despesas).
                  </div>
                  <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Qtd. de Parcelas</label>
                      <Input type="number" min="1" value={novaReceita.qtd_parcelas} onChange={e => setNovaReceita({...novaReceita, qtd_parcelas: e.target.value})} required style={{ background: "#1e293b", color: "white", borderColor: "rgba(255,255,255,0.1)" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Valor da Parcela</label>
                      <Input type="number" step="0.01" value={novaReceita.valor_parcela} onChange={e => setNovaReceita({...novaReceita, valor_parcela: e.target.value})} required style={{ background: "#1e293b", color: "white", borderColor: "rgba(255,255,255,0.1)" }} />
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Dia de Vencimento (1 a 31)</label>
                    <Input type="number" min="1" max="31" value={novaReceita.dia_vencimento} onChange={e => setNovaReceita({...novaReceita, dia_vencimento: e.target.value})} required style={{ background: "#1e293b", color: "white", borderColor: "rgba(255,255,255,0.1)" }} />
                  </div>
                </div>
              )}
              
              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Data do Recebimento</label>
                <Input type="date" value={novaReceita.data_receita} onChange={e => setNovaReceita({...novaReceita, data_receita: e.target.value})} required style={{ background: "#1e293b", color: "white", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <Button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, background: "#ef4444", color: "white", border: "none" }}>Cancelar</Button>
                <Button type="submit" style={{ flex: 1, background: "#10b981", color: "white", border: "none" }}>Salvar Receita</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
