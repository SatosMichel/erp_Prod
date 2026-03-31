import { useState, useEffect } from "react"
import { Trash2, Plus, Calendar } from "lucide-react"
import { Input } from "../../components/ui/Input"
import { Button } from "../../components/ui/Button"

export default function Despesas() {
  const [despesas, setDespesas] = useState([])
  const [total, setTotal] = useState(0)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [insumoMap, setInsumoMap] = useState({})
  
  const [showModal, setShowModal] = useState(false)
  const [novaDespesa, setNovaDespesa] = useState({
    descricao: "", categoria: "Frete", valor: "", data_despesa: new Date().toISOString().split('T')[0]
  })

  const loadDespesas = async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/api/financeiro/despesas?mes=${mes}&ano=${ano}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('jwt_token')}` }
      })
      if (response.ok) {
        const data = await response.json()
        setDespesas(data.itens)
        setTotal(data.total_geral)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetch(`http://localhost:8000/api/financeiro/insumos-map`)
      .then(r => r.ok ? r.json() : {})
      .then(data => setInsumoMap(data))
      .catch(() => {})
  }, [])

  const resolveDescricao = (item) => {
    if (item.tipo !== "Compra Insumo") return item.descricao
    const match = item.descricao.match(/Entrada de Insumo ID: (\d+)/)
    if (match) {
      const nomeInsumo = insumoMap[match[1]] || `Insumo #${match[1]}`
      const resto = item.descricao.replace(`Entrada de Insumo ID: ${match[1]}`, "").trim()
      return `Compra: ${nomeInsumo}${resto}`
    }
    return item.descricao
  }

  useEffect(() => {
    loadDespesas()
  }, [mes, ano])

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`http://localhost:8000/api/financeiro/despesas-extras`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('jwt_token')}` 
        },
        body: JSON.stringify({
          descricao: novaDespesa.descricao,
          categoria: novaDespesa.categoria,
          valor: parseFloat(novaDespesa.valor),
          data_despesa: novaDespesa.data_despesa ? new Date(novaDespesa.data_despesa).toISOString() : null
        })
      })
      if (response.ok) {
        setShowModal(false)
        setNovaDespesa({ descricao: "", categoria: "Frete", valor: "", data_despesa: new Date().toISOString().split('T')[0] })
        loadDespesas()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id, tipo) => {
    if (tipo !== "Despesa Extra") return // Não permitimos deletar entrada de insumo por aqui
    if (!confirm("Tem certeza que deseja remover esta despesa?")) return
    
    try {
      const realId = id.replace("ext_", "")
      const response = await fetch(`http://localhost:8000/api/financeiro/despesas-extras/${realId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem('jwt_token')}` }
      })
      if (response.ok) {
        loadDespesas()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ color: "white", fontSize: "20px", fontWeight: 700, margin: 0 }}>Despesas e Custos</h2>
          <div style={{ color: "#94a3b8", fontSize: "14px" }}>Consolidado de materiais e contas extras</div>
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
          <Button onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#ef4444" }}>
            <Plus size={16} /> Lançar Despesa
          </Button>
        </div>
      </div>

      <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "12px", padding: "20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "24px" }}>💸</span>
        </div>
        <div>
          <div style={{ color: "#ef4444", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Total de Saídas no Período</div>
          <div style={{ color: "white", fontSize: "28px", fontWeight: 800 }}>R$ {total.toFixed(2)}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "#94a3b8" }}>Carregando...</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left" }}>
              <th style={{ padding: "12px", color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>Data</th>
              <th style={{ padding: "12px", color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>Descrição</th>
              <th style={{ padding: "12px", color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>Categoria</th>
              <th style={{ padding: "12px", color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>Tipo Origem</th>
              <th style={{ padding: "12px", color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>Valor</th>
              <th style={{ padding: "12px", color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {despesas.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Nenhuma despesa para este período</td></tr>
            ) : despesas.map(d => (
              <tr key={d.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <td style={{ padding: "12px", color: "white", fontSize: "14px" }}>{new Date(d.data).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: "12px", color: "white", fontSize: "14px" }}>{resolveDescricao(d)}</td>
                <td style={{ padding: "12px", color: "#94a3b8", fontSize: "14px" }}>{d.categoria}</td>
                <td style={{ padding: "12px", fontSize: "13px" }}>
                  <span style={{ 
                    padding: "4px 8px", borderRadius: "12px",
                    background: d.tipo === "Despesa Extra" ? "rgba(249, 115, 22, 0.1)" : "rgba(56, 189, 248, 0.1)",
                    color: d.tipo === "Despesa Extra" ? "#f97316" : "#38bdf8"
                  }}>{d.tipo}</span>
                </td>
                <td style={{ padding: "12px", color: "#ef4444", fontSize: "14px", fontWeight: 600 }}>R$ {d.valor.toFixed(2)}</td>
                <td style={{ padding: "12px" }}>
                  {d.tipo === "Despesa Extra" && (
                    <button onClick={() => handleDelete(d.id, d.tipo)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#0f1629", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "24px", width: "400px" }}>
            <h3 style={{ color: "white", margin: "0 0 20px 0" }}>Lançar Despesa Extra</h3>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Descrição Breve</label>
                <Input value={novaDespesa.descricao} onChange={e => setNovaDespesa({...novaDespesa, descricao: e.target.value})} required style={{ background: "#1e293b", color: "white", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
              
              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Categoria</label>
                <select value={novaDespesa.categoria} onChange={e => setNovaDespesa({...novaDespesa, categoria: e.target.value})} style={{
                  width: "100%", background: "#1e293b", color: "white", border: "1px solid rgba(255,255,255,0.1)", 
                  borderRadius: "8px", padding: "10px", outline: "none", boxSizing: "border-box"
                }}>
                  <option>Frete</option>
                  <option>Manutenção</option>
                  <option>Mão de Obra Terceirizada</option>
                  <option>Impostos</option>
                  <option>Outros</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Valor (R$)</label>
                <Input type="number" step="0.01" value={novaDespesa.valor} onChange={e => setNovaDespesa({...novaDespesa, valor: e.target.value})} required style={{ background: "#1e293b", color: "white", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
              
              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Data (Opcional)</label>
                <Input type="date" value={novaDespesa.data_despesa} onChange={e => setNovaDespesa({...novaDespesa, data_despesa: e.target.value})} style={{ background: "#1e293b", color: "white", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <Button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, background: "#ef4444", color: "white", border: "none" }}>Cancelar</Button>
                <Button type="submit" style={{ flex: 1, background: "#10b981", color: "white", border: "none" }}>Salvar Despesa</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
