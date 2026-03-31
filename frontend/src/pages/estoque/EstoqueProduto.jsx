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
  th: { color: "#475569", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  td: { color: "#cbd5e1", fontSize: "13px", padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" },
}

export default function EstoqueProduto() {
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { carregar() }, [])

  const carregar = async () => {
    const r = await api("/produtos/")
    setProdutos(r.data)
  }

  const toggleAtivo = async (id) => {
    setLoading(true)
    try {
      await api(`/produtos/${id}/toggle-ativo`, { method: "PATCH" })
      carregar()
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  return (
    <div style={styles.page}>
      <div style={styles.title}>Estoque de Produto</div>
      <div style={styles.subtitle}>Visualize todos os produtos finais e seus saldos em estoque.</div>

      <div style={styles.card}>
        {produtos.length === 0 ? (
          <div style={{ color: "#475569", textAlign: "center", padding: "32px" }}>Nenhum produto cadastrado.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["CODPROD", "Nome", "Descrição", "Característica", "Qtd Estoque", "Status", "Ação"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {produtos.map(p => (
                <tr key={p.id}>
                  <td style={{ ...styles.td, color: "#64748b", fontFamily: "monospace", fontSize: "12px" }}>#{p.id}</td>
                  <td style={{ ...styles.td, color: "#e2e8f0", fontWeight: 600 }}>{p.nome}</td>
                  <td style={styles.td}>{p.descricao || "—"}</td>
                  <td style={styles.td}>{p.caracteristica || "—"}</td>
                  <td style={{ ...styles.td, color: p.quantidade_estoque > 0 ? "#34d399" : "#64748b", fontWeight: 700, fontSize: "14px" }}>
                    {p.quantidade_estoque}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                      background: p.ativo ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      color: p.ativo ? "#34d399" : "#f87171",
                      border: `1px solid ${p.ativo ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                    }}>
                      {p.ativo ? "ATIVO" : "INATIVO"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      disabled={loading}
                      onClick={() => toggleAtivo(p.id)}
                      style={{
                        background: p.ativo ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                        color: p.ativo ? "#f87171" : "#34d399",
                        border: `1px solid ${p.ativo ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
                        borderRadius: "6px", padding: "5px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                      }}>
                      {p.ativo ? "Inativar" : "Ativar"}
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
