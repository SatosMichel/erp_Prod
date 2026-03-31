import { useEffect, useState } from "react"
import axios from "axios"
import { UserCheck, Clock, CheckCircle } from "lucide-react"

export default function Approvals() {
  const [pendentes, setPendentes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPendentes = async () => {
    try {
      const token = localStorage.getItem("jwt_token")
      const res = await axios.get("/api/usuarios/pendentes", {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPendentes(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendentes()
  }, [])

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem("jwt_token")
      await axios.post(`/api/usuarios/aprovar/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchPendentes()
    } catch (err) {
      alert("Falha ao aprovar")
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ color: "white", fontSize: "24px", fontWeight: 800, margin: "0 0 8px 0" }}>Aprovações Pendentes</h1>
        <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>Gerencie credenciais dos usuários que solicitaram acesso.</p>
      </div>

      <div style={{
        background: "#0f1629", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "16px", padding: "24px"
      }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ width: "40px", height: "40px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserCheck size={20} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ color: "white", fontSize: "18px", fontWeight: 700, margin: 0 }}>Fila de Espera</h2>
          </div>
        </div>
        
        <p style={{ color: "#475569", fontSize: "13px", marginBottom: "24px", marginLeft: "52px" }}>
          Existem {pendentes.length} solicitações em aguardo operacional.
        </p>

        <div>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Buscando do núcleo...</div>
          ) : pendentes.length === 0 ? (
            <div style={{
              padding: "48px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              color: "#94a3b8", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.1)"
            }}>
              <CheckCircle size={32} color="#10b981" style={{ marginBottom: "12px" }} />
              <p style={{ margin: 0 }}>Nenhuma solicitação pendente no momento.</p>
            </div>
          ) : (
            <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <tr>
                    <th style={{ padding: "16px", color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", textAlign: "left" }}>Nome do Funcionário</th>
                    <th style={{ padding: "16px", color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", textAlign: "left" }}>E-mail Corporativo</th>
                    <th style={{ padding: "16px", color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", textAlign: "left" }}>Status</th>
                    <th style={{ padding: "16px", color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", textAlign: "right" }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {pendentes.map((user) => (
                    <tr key={user.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "16px", color: "white", fontSize: "14px", fontWeight: 600 }}>{user.nome}</td>
                      <td style={{ padding: "16px", color: "#94a3b8", fontSize: "14px" }}>{user.email}</td>
                      <td style={{ padding: "16px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px",
                          borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                          background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)"
                        }}>
                          <Clock size={14} /> Pendente
                        </span>
                      </td>
                      <td style={{ padding: "16px", textAlign: "right" }}>
                        <button onClick={() => handleApprove(user.id)} style={{
                          background: "#3b82f6", color: "white", border: "none", borderRadius: "8px",
                          padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer"
                        }}>
                          Autorizar Acesso
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
