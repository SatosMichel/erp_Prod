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




export default function EstoqueInsumo() {
  const [insumos, setInsumos] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { carregar() }, [])

  const carregar = async () => {
    const r = await api("/insumos/")
    setInsumos(r.data)
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
      <div style={styles.subtitle}>
        Visualize e gerencie os insumos cadastrados. Para registrar um novo insumo, utilize a aba <strong style={{ color: "#60a5fa" }}>Entrada de Insumo</strong>.
      </div>





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
