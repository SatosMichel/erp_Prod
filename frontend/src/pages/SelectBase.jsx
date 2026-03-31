import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, ArrowRight, Loader2, Star } from "lucide-react"
import axios from "axios"

export default function SelectBase() {
  const navigate = useNavigate()
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const preToken = localStorage.getItem("pre_token")
    if (!preToken) { navigate("/"); return }
    axios.get("/api/empresas/", { headers: { Authorization: `Bearer ${preToken}` } })
      .then(res => setEmpresas(res.data))
      .catch(() => setError("Erro ao carregar empresas"))
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = async (cnpj_db, nome) => {
    setSelecting(cnpj_db)
    setError("")
    try {
      const preToken = localStorage.getItem("pre_token")
      const res = await axios.post("/api/login/select-base", { pre_token: preToken, cnpj_db })
      localStorage.setItem("jwt_token", res.data.access_token)
      localStorage.setItem("empresa_nome", res.data.empresa_nome)
      localStorage.removeItem("pre_token")
      navigate("/dashboard")
    } catch (err) {
      setError(err.response?.data?.detail || "Erro ao selecionar base")
    } finally {
      setSelecting(null)
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #0a0e1a 0%, #0f1629 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', system-ui, sans-serif", padding: "24px"
    }}>
      <div style={{ width: "100%", maxWidth: "560px" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "40px", justifyContent: "center" }}>
          <div style={{ width: "36px", height: "36px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={19} color="white" />
          </div>
          <span style={{ color: "white", fontSize: "18px", fontWeight: 700 }}>ERP SATOS</span>
        </div>

        <h2 style={{ color: "white", fontSize: "24px", fontWeight: 800, textAlign: "center", marginBottom: "8px" }}>Selecione a Base</h2>
        <p style={{ color: "#64748b", fontSize: "14px", textAlign: "center", marginBottom: "32px" }}>Escolha qual empresa você deseja gerenciar nesta sessão</p>

        {error && (
          <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "13px" }}>{error}</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Base Padrão (demo) */}
          <BaseCard
            nome="Base Padrão (Demonstração)"
            cnpj="padrao"
            descricao="Ambiente de testes e demonstração do sistema"
            isDemo
            selecionando={selecting === "padrao"}
            onSelect={() => handleSelect("padrao", "Base Padrão")}
          />

          {loading ? (
            <div style={{ textAlign: "center", color: "#64748b", padding: "24px" }}>
              <Loader2 size={20} style={{ animation: "spin 1s linear infinite", display: "inline" }} />
              <span style={{ marginLeft: "8px" }}>Carregando empresas...</span>
            </div>
          ) : (
            empresas.map(emp => (
              <BaseCard
                key={emp.cnpj}
                nome={emp.nome}
                cnpj={emp.cnpj}
                descricao={emp.cnpj}
                logo={emp.logo_url}
                selecionando={selecting === emp.cnpj}
                onSelect={() => handleSelect(emp.cnpj, emp.nome)}
              />
            ))
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function BaseCard({ nome, cnpj, descricao, isDemo, logo, selecionando, onSelect }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onSelect}
      disabled={selecionando}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", padding: "18px 20px", textAlign: "left", cursor: "pointer",
        background: hovered ? "#111827" : "#0f1629",
        border: `1px solid ${hovered ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: "12px", transition: "all 0.2s",
        display: "flex", alignItems: "center", gap: "16px",
        boxShadow: hovered ? "0 4px 24px rgba(59,130,246,0.1)" : "none"
      }}
    >
      <div style={{
        width: "48px", height: "48px", borderRadius: "12px", flexShrink: 0, overflow: "hidden",
        background: isDemo ? "rgba(6,182,212,0.1)" : "rgba(59,130,246,0.1)",
        border: `1px solid ${isDemo ? "rgba(6,182,212,0.2)" : "rgba(59,130,246,0.2)"}`,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {logo ? <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : isDemo ? <Star size={22} color="#06b6d4" />
          : <Building2 size={22} color="#3b82f6" />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: "white", fontWeight: 700, fontSize: "15px" }}>{nome}</div>
        <div style={{ color: "#475569", fontSize: "12px", marginTop: "3px" }}>{descricao}</div>
      </div>
      {selecionando
        ? <Loader2 size={18} color="#3b82f6" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
        : <ArrowRight size={18} color={hovered ? "#3b82f6" : "#334155"} style={{ flexShrink: 0, transition: "color 0.2s" }} />}
    </button>
  )
}
