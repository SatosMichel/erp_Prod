import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Building2, AlertCircle, ArrowRight, Loader2, Hash } from "lucide-react"

const SUPERADMIN = "admin@satos.com"
const inputStyle = {
  width: "100%", padding: "12px 16px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px", color: "white", fontSize: "14px",
  outline: "none", transition: "border-color 0.2s", boxSizing: "border-box"
}

export default function Login() {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nome, setNome] = useState("")
  const [cnpj, setCnpj] = useState("")

  const isSuperAdmin = email.trim().toLowerCase() === SUPERADMIN

  useEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      input::placeholder { color: #334155; }
      @media(min-width: 900px) { .left-panel { display: flex !important; } }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])
  // CNPJ só é exigido na hora do cadastro (fica gravado no perfil)
  // No login basta email + senha (super admin vai para seleção de base)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (isRegister) {
        await axios.post("/api/register", { nome, email, password, cnpj: cnpj || null })
        setError("✅ Solicitação enviada! Aguarde aprovação do administrador.")
        setIsRegister(false)
      } else {
        const res = await axios.post("/api/login", { email, password, cnpj: cnpj || null })
        const data = res.data

        if (data.requires_base_selection) {
          // Super admin → tela de seleção de base
          localStorage.setItem("pre_token", data.pre_token)
          navigate("/select-base")
        } else {
          localStorage.setItem("jwt_token", data.access_token)
          localStorage.setItem("empresa_nome", data.empresa_nome || "")
          navigate("/dashboard")
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Erro de autenticação. Verifique suas credenciais.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0e1a 0%, #0f1629 50%, #0a1628 100%)",
      display: "flex", fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      {/* Left Panel */}
      <div style={{ flex: 1, display: "none", flexDirection: "column", justifyContent: "center", padding: "60px", position: "relative", overflow: "hidden" }} className="left-panel">
        <div style={{ position: "absolute", top: "-100px", left: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "64px" }}>
            <div style={{ width: "40px", height: "40px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={22} color="white" />
            </div>
            <span style={{ color: "white", fontSize: "20px", fontWeight: 700 }}>ERP SATOS</span>
          </div>
          <h1 style={{ color: "white", fontSize: "42px", fontWeight: 800, letterSpacing: "-1px", lineHeight: 1.2, marginBottom: "20px" }}>
            Gestão corporativa<br />
            <span style={{ background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>de alta performance.</span>
          </h1>
          <p style={{ color: "#64748b", fontSize: "17px", lineHeight: 1.7 }}>
            Controle produção, estoque, finanças e vendas em uma única plataforma integrada.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div style={{ width: "100%", maxWidth: "480px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
        <div style={{ width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "40px" }}>
            <div style={{ width: "36px", height: "36px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={19} color="white" />
            </div>
            <span style={{ color: "white", fontSize: "18px", fontWeight: 700 }}>ERP SATOS</span>
          </div>

          <h2 style={{ color: "white", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.5px", marginBottom: "6px" }}>
            {isRegister ? "Solicitar Acesso" : "Acessar o Sistema"}
          </h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "32px" }}>
            {isRegister ? "Preencha os dados para solicitar sua credencial." : "Entre com suas credenciais corporativas."}
          </p>

          {error && (
            <div style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "10px", background: error.startsWith("✅") ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${error.startsWith("✅") ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`, display: "flex", alignItems: "center", gap: "8px", color: error.startsWith("✅") ? "#10b981" : "#f87171", fontSize: "13px" }}>
              <AlertCircle size={15} />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {isRegister && (
              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>Nome Completo</label>
                <input placeholder="João da Silva" value={nome} onChange={e => setNome(e.target.value)} required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#3b82f6"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
              </div>
            )}
            <div>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>E-mail Corporativo</label>
              <input type="email" placeholder="nome@empresa.com" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#3b82f6"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
            </div>
            <div>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>Senha</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#3b82f6"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
            </div>

            {/* CNPJ — apenas no cadastro */}
            {isRegister && (
              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
                  CNPJ da Empresa
                </label>
                <div style={{ position: "relative" }}>
                  <Hash size={15} color="#475569" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  <input placeholder="00.000.000/0000-00" value={cnpj} onChange={e => setCnpj(e.target.value)} required
                    style={{ ...inputStyle, paddingLeft: "38px" }}
                    onFocus={e => e.target.style.borderColor = "#3b82f6"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
                </div>
                <div style={{ color: "#475569", fontSize: "11px", marginTop: "4px" }}>Seu acesso ficará vinculado a este CNPJ. No login, basta e-mail e senha.</div>
              </div>
            )}

            {/* Info super admin — apenas no login */}
            {!isRegister && isSuperAdmin && (
              <div style={{ padding: "10px 14px", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "8px", color: "#06b6d4", fontSize: "12px" }}>
                🔐 Acesso Super Admin — você selecionará a base após o login
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "13px",
              background: loading ? "rgba(59,130,246,0.5)" : "linear-gradient(135deg, #3b82f6, #6366f1)",
              color: "white", border: "none", borderRadius: "10px",
              fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              marginTop: "4px", boxShadow: loading ? "none" : "0 4px 24px rgba(59,130,246,0.35)"
            }}>
              {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <ArrowRight size={16} />}
              {isRegister ? "Enviar Solicitação" : isSuperAdmin ? "Verificar Identidade" : "Acessar Plataforma"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <button onClick={() => { setIsRegister(!isRegister); setError("") }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "13px" }}>
              {isRegister ? "Já possui credencial? " : "Ainda não tem acesso? "}
              <span style={{ color: "#3b82f6", fontWeight: 600 }}>{isRegister ? "Fazer Login" : "Solicitar agora"}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
