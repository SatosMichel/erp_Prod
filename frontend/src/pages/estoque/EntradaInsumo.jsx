import { useState, useEffect } from "react"
import axios from "axios"

const token = () => localStorage.getItem("jwt_token")
const api = (url, opts = {}) =>
  axios({ url: `/api${url}`, ...opts, headers: { Authorization: `Bearer ${token()}`, ...opts.headers } })

const styles = {
  page: { fontFamily: "'Inter', system-ui, sans-serif" },
  title: { color: "white", fontSize: "22px", fontWeight: 800, marginBottom: "4px" },
  subtitle: { color: "#475569", fontSize: "13px", marginBottom: "24px" },
  card: {
    background: "#0f1629", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "14px", padding: "24px", marginBottom: "24px",
  },
  label: { color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase",
    letterSpacing: "0.5px", display: "block", marginBottom: "6px" },
  input: {
    width: "100%", background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px", padding: "10px 12px", color: "white", fontSize: "14px",
    outline: "none", boxSizing: "border-box",
  },
  btn: (color = "#3b82f6") => ({
    background: color, color: "white", border: "none", borderRadius: "8px",
    padding: "10px 20px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
  }),
  table: { width: "100%", borderCollapse: "collapse" },
  th: { color: "#475569", fontSize: "11px", textTransform: "uppercase",
    letterSpacing: "0.5px", padding: "10px 12px", textAlign: "left",
    borderBottom: "1px solid rgba(255,255,255,0.06)" },
  td: { color: "#cbd5e1", fontSize: "13px", padding: "12px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.04)" },
  alert: (type) => ({
    padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px",
    background: type === "error" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
    border: `1px solid ${type === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
    color: type === "error" ? "#f87171" : "#34d399",
  }),
}

export default function EntradaInsumo() {
  const [insumos, setInsumos] = useState([])
  const [entradas, setEntradas] = useState([])
  const [form, setForm] = useState({ insumo_nome: "", valor_aquisicao: "", quantidade: "", data_aquisicao: "", condicao_pagamento: "À Vista", data_pagamento: "" })
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [nomeSugestoes, setNomeSugestoes] = useState([])
  const [showSugestoes, setShowSugestoes] = useState(false)

  useEffect(() => { carregar() }, [])

  const carregar = async () => {
    const [ri, re] = await Promise.all([api("/insumos/"), api("/entrada-insumo/")])
    setInsumos(ri.data)
    setEntradas(re.data.reverse())
  }

  const handleNome = (val) => {
    setForm(f => ({ ...f, insumo_nome: val }))
    if (val.length > 0) {
      const s = insumos.filter(i => i.nome.toLowerCase().includes(val.toLowerCase()))
      setNomeSugestoes(s)
      setShowSugestoes(true)
    } else {
      setShowSugestoes(false)
    }
  }

  const selecionarInsumo = (nome) => {
    setForm(f => ({ ...f, insumo_nome: nome }))
    setShowSugestoes(false)
    const existe = insumos.find(i => i.nome === nome)
    if (existe && !existe.ativo) {
      setMsg({ type: "error", text: "⚠️ Este insumo está INATIVO e não pode receber entrada." })
    } else {
      setMsg(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const payload = {
        insumo_nome: form.insumo_nome,
        valor_aquisicao: parseFloat(form.valor_aquisicao),
        quantidade: parseInt(form.quantidade),
        condicao_pagamento: form.condicao_pagamento,
        data_pagamento: form.condicao_pagamento === "A Prazo" && form.data_pagamento ? form.data_pagamento : null,
        data_aquisicao: form.data_aquisicao || null,
      }
      await api("/entrada-insumo/", { method: "POST", data: payload })
      setMsg({ type: "success", text: "✅ Entrada registrada com sucesso!" })
      setForm({ insumo_nome: "", valor_aquisicao: "", quantidade: "", data_aquisicao: "", condicao_pagamento: "À Vista", data_pagamento: "" })
      carregar()
    } catch (err) {
      setMsg({ type: "error", text: `❌ ${err.response?.data?.detail || "Erro ao registrar entrada"}` })
    } finally { setLoading(false) }
  }

  const getNomeInsumo = (id) => insumos.find(i => i.id === id)?.nome || id

  return (
    <div style={styles.page}>
      <div style={styles.title}>Entrada de Insumo</div>
      <div style={styles.subtitle}>Registre a entrada de insumos no estoque.</div>

      <div style={styles.card}>
        <form onSubmit={handleSubmit}>
          {msg && <div style={styles.alert(msg.type)}>{msg.text}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px", alignItems: "end" }}>
            <div style={{ position: "relative" }}>
              <label style={styles.label}>Nome do Insumo *</label>
              <input
                style={styles.input} required
                value={form.insumo_nome}
                onChange={e => handleNome(e.target.value)}
                onBlur={() => setTimeout(() => setShowSugestoes(false), 200)}
                placeholder="Digite ou selecione..."
              />
              {showSugestoes && nomeSugestoes.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                  background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px", maxHeight: "200px", overflowY: "auto",
                }}>
                  {nomeSugestoes.map(i => (
                    <div key={i.id}
                      onMouseDown={() => selecionarInsumo(i.nome)}
                      style={{ padding: "10px 12px", cursor: "pointer", color: i.ativo ? "#cbd5e1" : "#64748b",
                        borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "13px" }}>
                      {i.nome} {!i.ativo && <span style={{ color: "#ef4444" }}>(inativo)</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label style={styles.label}>Valor de Aquisição (Total R$) *</label>
              <input style={styles.input} required type="number" step="0.01" min="0"
                value={form.valor_aquisicao} onChange={e => setForm(f => ({ ...f, valor_aquisicao: e.target.value }))}
                placeholder="0,00" />
            </div>
            <div>
              <label style={styles.label}>Quantidade *</label>
              <input style={styles.input} required type="number" min="1"
                value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))}
                placeholder="0" />
            </div>
            <div>
              <label style={styles.label}>Condição de Pagamento *</label>
              <select style={{...styles.input, appearance: "auto"}} value={form.condicao_pagamento} onChange={e => setForm(f => ({ ...f, condicao_pagamento: e.target.value }))}>
                <option value="À Vista">À Vista</option>
                <option value="A Prazo">A Prazo</option>
              </select>
            </div>
            {form.condicao_pagamento === "A Prazo" && (
              <div>
                <label style={styles.label}>Data do Pagamento *</label>
                <input style={styles.input} type="date" required
                  value={form.data_pagamento} onChange={e => setForm(f => ({ ...f, data_pagamento: e.target.value }))} />
              </div>
            )}
            <div>
              <label style={styles.label}>Data de Aquisição</label>
              <input style={styles.input} type="date"
                value={form.data_aquisicao} onChange={e => setForm(f => ({ ...f, data_aquisicao: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <button type="submit" style={styles.btn()} disabled={loading}>
              {loading ? "Registrando..." : "✚ Registrar Entrada"}
            </button>
          </div>
        </form>
      </div>

      <div style={styles.card}>
        <div style={{ color: "white", fontWeight: 700, marginBottom: "16px" }}>Histórico de Entradas</div>
        {entradas.length === 0 ? (
          <div style={{ color: "#475569", textAlign: "center", padding: "32px" }}>Nenhuma entrada registrada ainda.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {["#", "Insumo", "Qtd", "Valor Unit. (R$)", "Total (R$)", "Data"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entradas.map(e => (
                <tr key={e.id}>
                  <td style={styles.td}>{e.id}</td>
                  <td style={styles.td}>{getNomeInsumo(e.insumo_id)}</td>
                  <td style={styles.td}>{e.quantidade}</td>
                  <td style={styles.td}>R$ {(e.valor_aquisicao / e.quantidade).toFixed(2)}</td>
                  <td style={styles.td}>R$ {Number(e.valor_aquisicao).toFixed(2)}</td>
                  <td style={styles.td}>{new Date(e.data_aquisicao).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
