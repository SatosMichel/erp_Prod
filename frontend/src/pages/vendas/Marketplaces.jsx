import { useState, useEffect } from "react"
import axios from "axios"

const token = () => localStorage.getItem("jwt_token")
const api = (url, opts = {}) =>
  axios({ url: `/api${url}`, ...opts, headers: { Authorization: `Bearer ${token()}`, ...opts.headers } })

const styles = {
  card: {
    background: "#0f1629", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "14px", padding: "24px", marginBottom: "24px",
  },
  label: { color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "6px" },
  input: {
    width: "100%", background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px", padding: "10px 12px", color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box",
  },
  btn: (color = "#3b82f6") => ({
    background: color, color: "white", border: "none", borderRadius: "8px",
    padding: "10px 20px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
  }),
  table: { width: "100%", borderCollapse: "collapse" },
  th: { color: "#475569", fontSize: "11px", textTransform: "uppercase", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  td: { color: "#cbd5e1", fontSize: "13px", padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }
}

export default function Marketplaces() {
  const [marketplaces, setMarketplaces] = useState([])
  const [form, setForm] = useState({ nome: "", taxa_percentual: "" })
  const [loading, setLoading] = useState(false)

  useEffect(() => { carregar() }, [])

  const carregar = async () => {
    try {
      const res = await api("/marketplaces/")
      setMarketplaces(res.data)
    } catch (e) { console.error(e) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api("/marketplaces/", { method: "POST", data: { nome: form.nome, taxa_percentual: parseFloat(form.taxa_percentual) } })
      setForm({ nome: "", taxa_percentual: "" })
      carregar()
    } catch (err) {
      alert(err.response?.data?.detail || "Erro ao salvar")
    } finally { setLoading(false) }
  }

  const toggleAtivo = async (id) => {
    try {
      await api(`/marketplaces/${id}/toggle-ativo`, { method: "PATCH" })
      carregar()
    } catch (e) { alert("Erro ao alterar status") }
  }

  return (
    <div>
      <div style={styles.card}>
        <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px" }}>Cadastrar Novo Marketplace</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "end" }}>
            <div>
              <label style={styles.label}>Nome da Plataforma (Ex: Shopee, Mercado Livre)</label>
              <input style={styles.input} required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do Marketplace"/>
            </div>
            <div>
              <label style={styles.label}>Taxa / Comissão Percentual (%) *</label>
              <input style={styles.input} required type="number" step="0.01" min="0" value={form.taxa_percentual} onChange={e => setForm(f => ({ ...f, taxa_percentual: e.target.value }))} placeholder="Ex: 12.5"/>
            </div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <button type="submit" style={styles.btn()} disabled={loading}>{loading ? "Registrando..." : "Cadastrar Plataforma"}</button>
          </div>
        </form>
      </div>

      <div style={styles.card}>
        <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px" }}>Marketplaces Cadastrados</h3>
        {marketplaces.length === 0 ? (
          <div style={{ color: "#475569", textAlign: "center", padding: "16px" }}>Nenhum marketplace cadastrado.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Plataforma</th>
                <th style={styles.th}>Taxa (%)</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {marketplaces.map(m => (
                <tr key={m.id} style={{ opacity: m.ativo ? 1 : 0.5 }}>
                  <td style={styles.td}>{m.id}</td>
                  <td style={styles.td}><strong>{m.nome}</strong></td>
                  <td style={styles.td}>{m.taxa_percentual.toFixed(2)}%</td>
                  <td style={styles.td}>{m.ativo ? <span style={{ color: "#34d399" }}>Ativo</span> : <span style={{ color: "#ef4444" }}>Inativo</span>}</td>
                  <td style={styles.td}>
                    <button type="button" onClick={() => toggleAtivo(m.id)} style={{
                      background: "transparent", color: m.ativo ? "#ef4444" : "#3b82f6",
                      border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px",
                      padding: "4px 8px", cursor: "pointer", fontSize: "12px"
                    }}>
                      {m.ativo ? "Desativar" : "Reativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
