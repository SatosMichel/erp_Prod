import { useState, useEffect } from "react"
import axios from "axios"

const token = () => localStorage.getItem("jwt_token")
const api = (url, opts = {}) =>
  axios({ url: `/api${url}`, ...opts, headers: { Authorization: `Bearer ${token()}`, ...opts.headers } })

const styles = {
  page: { fontFamily: "'Inter', system-ui, sans-serif" },
  title: { color: "white", fontSize: "22px", fontWeight: 800, marginBottom: "4px" },
  subtitle: { color: "#475569", fontSize: "13px", marginBottom: "24px" },
  card: { background: "#0f1629", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "24px", marginBottom: "24px" },
  label: { color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" },
  input: { width: "100%", background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 12px", color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box" },
  th: { color: "#475569", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  td: { color: "#cbd5e1", fontSize: "13px", padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  btn: (color = "#3b82f6") => ({ background: color, color: "white", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }),
  alert: (type) => ({
    padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px",
    background: type === "error" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
    border: `1px solid ${type === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
    color: type === "error" ? "#f87171" : "#34d399",
  }),
  unitBadge: (unit) => ({
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
    background: unit === "KG" ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)",
    color: unit === "KG" ? "#fbbf24" : "#60a5fa",
    border: `1px solid ${unit === "KG" ? "rgba(245,158,11,0.3)" : "rgba(59,130,246,0.3)"}`,
  }),
}

const formVazio = () => ({ nome: "", descricao: "", caracteristica: "", unidade_medida: "UND" })

export default function EstoqueInsumo() {
  const [insumos, setInsumos] = useState([])
  const [form, setForm] = useState(formVazio())
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { carregar() }, [])

  const carregar = async () => {
    const r = await api("/insumos/")
    setInsumos(r.data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      await api("/insumos/", { method: "POST", data: form })
      setMsg({ type: "success", text: `✅ Insumo "${form.nome}" cadastrado com sucesso!` })
      setForm(formVazio())
      setShowForm(false)
      carregar()
    } catch (err) {
      setMsg({ type: "error", text: `❌ ${err.response?.data?.detail || "Erro ao cadastrar insumo"}` })
    } finally { setLoading(false) }
  }

  const toggleAtivo = async (id) => {
    setLoading(true)
    try {
      await api(`/insumos/${id}/toggle-ativo`, { method: "PATCH" })
      carregar()
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  return (
    <div style={styles.page}>
      <div style={styles.title}>Estoque de Insumo</div>
      <div style={styles.subtitle}>Visualize, cadastre e gerencie os insumos do estoque.</div>

      {/* Botão abrir formulário */}
      <div style={{ marginBottom: "16px" }}>
        <button
          onClick={() => { setShowForm(v => !v); setMsg(null) }}
          style={styles.btn(showForm ? "rgba(255,255,255,0.06)" : "#3b82f6")}
        >
          {showForm ? "✕ Cancelar" : "＋ Cadastrar Novo Insumo"}
        </button>
      </div>

      {/* Formulário de cadastro */}
      {showForm && (
        <div style={styles.card}>
          <div style={{ color: "#3b82f6", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>
            ▸ Novo Insumo
          </div>
          {msg && <div style={styles.alert(msg.type)}>{msg.text}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={styles.label}>Nome do Insumo *</label>
                <input style={styles.input} required value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Farinha de trigo" />
              </div>
              <div>
                <label style={styles.label}>Descrição</label>
                <input style={styles.input} value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Opcional" />
              </div>
              <div>
                <label style={styles.label}>Característica</label>
                <input style={styles.input} value={form.caracteristica}
                  onChange={e => setForm(f => ({ ...f, caracteristica: e.target.value }))}
                  placeholder="Ex: Tipo 1, integral... (opcional)" />
              </div>
            </div>

            {/* Seletor de Unidade de Medida */}
            <div style={{ marginBottom: "20px" }}>
              <label style={styles.label}>📏 Unidade de Medida *</label>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                {["UND", "KG"].map(unit => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, unidade_medida: unit }))}
                    style={{
                      padding: "10px 28px", borderRadius: "8px", fontSize: "14px", fontWeight: 700,
                      cursor: "pointer", transition: "all 0.15s ease",
                      background: form.unidade_medida === unit
                        ? (unit === "KG" ? "rgba(245,158,11,0.2)" : "rgba(59,130,246,0.2)")
                        : "rgba(255,255,255,0.04)",
                      border: form.unidade_medida === unit
                        ? `2px solid ${unit === "KG" ? "#f59e0b" : "#3b82f6"}`
                        : "2px solid rgba(255,255,255,0.06)",
                      color: form.unidade_medida === unit
                        ? (unit === "KG" ? "#fbbf24" : "#60a5fa")
                        : "#475569",
                    }}
                  >
                    {unit === "UND" ? "📦 UND — Unidade" : "⚖️ KG — Quilogramas"}
                  </button>
                ))}
                <span style={{ color: "#475569", fontSize: "12px" }}>
                  {form.unidade_medida === "UND"
                    ? "Contagem em unidades inteiras (caixas, peças, litros...)"
                    : "Contagem em quilogramas (ingredientes a granel, pós, etc.)"}
                </span>
              </div>
            </div>

            <button type="submit" style={styles.btn("#10b981")} disabled={loading}>
              {loading ? "Salvando..." : "✓ Salvar Insumo"}
            </button>
          </form>
        </div>
      )}

      {/* Mensagem fora do formulário (após fechar) */}
      {msg && !showForm && <div style={styles.alert(msg.type)}>{msg.text}</div>}

      {/* Tabela de insumos */}
      <div style={styles.card}>
        <div style={{ color: "white", fontWeight: 700, marginBottom: "16px" }}>
          Insumos Cadastrados ({insumos.length})
        </div>
        {insumos.length === 0 ? (
          <div style={{ color: "#475569", textAlign: "center", padding: "32px" }}>Nenhum insumo cadastrado.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["#", "Nome", "Unid.", "Descrição", "Característica", "Qtd Estoque", "Status", "Ação"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {insumos.map(i => (
                <tr key={i.id}>
                  <td style={{ ...styles.td, color: "#64748b", fontFamily: "monospace", fontSize: "12px" }}>#{i.id}</td>
                  <td style={{ ...styles.td, color: "#e2e8f0", fontWeight: 600 }}>{i.nome}</td>
                  <td style={styles.td}>
                    <span style={styles.unitBadge(i.unidade_medida || "UND")}>
                      {i.unidade_medida || "UND"}
                    </span>
                  </td>
                  <td style={styles.td}>{i.descricao || "—"}</td>
                  <td style={styles.td}>{i.caracteristica || "—"}</td>
                  <td style={{ ...styles.td, color: i.quantidade_estoque > 0 ? "#34d399" : "#64748b", fontWeight: 700, fontSize: "14px" }}>
                    {i.quantidade_estoque}
                    <span style={{ color: "#475569", fontSize: "11px", fontWeight: 400, marginLeft: "4px" }}>
                      {i.unidade_medida || "UND"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                      background: i.ativo ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      color: i.ativo ? "#34d399" : "#f87171",
                      border: `1px solid ${i.ativo ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                    }}>
                      {i.ativo ? "ATIVO" : "INATIVO"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      disabled={loading}
                      onClick={() => toggleAtivo(i.id)}
                      style={{
                        background: i.ativo ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                        color: i.ativo ? "#f87171" : "#34d399",
                        border: `1px solid ${i.ativo ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
                        borderRadius: "6px", padding: "5px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                      }}>
                      {i.ativo ? "Inativar" : "Ativar"}
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
