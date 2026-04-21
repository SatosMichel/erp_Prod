import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Building2, AlertCircle, ArrowRight, Loader2, Hash, Eye, EyeOff } from "lucide-react"

const SUPERADMIN = "admin@satos.com"

export default function Login() {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nome, setNome] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  const isSuperAdmin = email.trim().toLowerCase() === SUPERADMIN

  const inputStyle = (field) => ({
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.05)",
    border: `1.5px solid ${focusedField === field ? "rgba(99,102,241,0.65)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: "11px",
    color: "white",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
    boxShadow: focusedField === field ? "0 0 0 3px rgba(99,102,241,0.15)" : "none",
  })

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
      background: "linear-gradient(135deg, #060a14 0%, #0d1225 45%, #0a1225 100%)",
      display: "flex",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Orbs decorativos de fundo */}
      <div style={{ position: "absolute", top: "-180px", left: "-180px", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-150px", right: "-150px", width: "450px", height: "450px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "40%", left: "35%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)", pointerEvents: "none" }} />

      {/* Grid lines decorativas (muito sutis) */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }} />

      {/* ── Left Panel (só desktop) ── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 80px",
        position: "relative",
        overflow: "hidden",
      }}
        className="login-left-panel"
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "72px" }}>
            <div style={{
              width: "42px", height: "42px",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              borderRadius: "12px",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 24px rgba(99,102,241,0.40)",
            }}>
              <Building2 size={22} color="white" />
            </div>
            <div>
              <div style={{ color: "white", fontSize: "18px", fontWeight: 800, letterSpacing: "-0.3px" }}>ERP SATOS</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", fontWeight: 500, letterSpacing: "0.5px", textTransform: "uppercase" }}>Sistema ERP</div>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{ color: "white", fontSize: "44px", fontWeight: 800, letterSpacing: "-1.2px", lineHeight: 1.18, marginBottom: "20px" }}>
            Gestão corporativa<br />
            <span style={{ background: "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              de alta performance.
            </span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.40)", fontSize: "16px", lineHeight: 1.75, maxWidth: "420px" }}>
            Controle produção, estoque, finanças e vendas em uma única plataforma integrada e inteligente.
          </p>

          {/* Feature pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "40px" }}>
            {["Produção", "Estoque", "Financeiro", "Vendas", "Gestão / DRE"].map(f => (
              <span key={f} style={{
                padding: "6px 14px", borderRadius: "99px", fontSize: "12px", fontWeight: 600,
                background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <div style={{
        width: "100%", maxWidth: "460px",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "32px 28px",
        position: "relative", zIndex: 10,
      }}>
        {/* Card glassmorphism */}
        <div style={{
          width: "100%",
          background: "rgba(13, 18, 37, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: "20px",
          padding: "36px 32px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
          animation: "fadeInUp 0.5s ease both",
        }}>
          {/* Logo mobile */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
            <div style={{
              width: "34px", height: "34px",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 6px 18px rgba(99,102,241,0.35)",
            }}>
              <Building2 size={17} color="white" />
            </div>
            <span style={{ color: "white", fontSize: "16px", fontWeight: 800 }}>ERP SATOS</span>
          </div>

          <h2 style={{ color: "white", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.4px", marginBottom: "5px" }}>
            {isRegister ? "Solicitar Acesso" : "Acessar o Sistema"}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13.5px", marginBottom: "28px" }}>
            {isRegister ? "Preencha os dados para solicitar sua credencial." : "Entre com suas credenciais corporativas."}
          </p>

          {/* Mensagem de erro / sucesso */}
          {error && (
            <div style={{
              marginBottom: "20px", padding: "11px 14px", borderRadius: "10px",
              background: error.startsWith("✅") ? "rgba(16,185,129,0.10)" : "rgba(244,63,94,0.10)",
              border: `1px solid ${error.startsWith("✅") ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)"}`,
              display: "flex", alignItems: "center", gap: "8px",
              color: error.startsWith("✅") ? "#10b981" : "#f87171", fontSize: "13px",
              animation: "fadeInScale 0.25s ease both",
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {isRegister && (
              <div>
                <label style={{ display: "block", color: "rgba(255,255,255,0.55)", fontSize: "12px", fontWeight: 600, marginBottom: "7px", letterSpacing: "0.3px" }}>
                  NOME COMPLETO
                </label>
                <input
                  placeholder="João da Silva"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                  style={inputStyle("nome")}
                  onFocus={() => setFocusedField("nome")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            )}

            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.55)", fontSize: "12px", fontWeight: 600, marginBottom: "7px", letterSpacing: "0.3px" }}>
                E-MAIL CORPORATIVO
              </label>
              <input
                type="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={inputStyle("email")}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
              />
            </div>

            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.55)", fontSize: "12px", fontWeight: 600, marginBottom: "7px", letterSpacing: "0.3px" }}>
                SENHA
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ ...inputStyle("password"), paddingRight: "44px" }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "rgba(255,255,255,0.30)", display: "flex", padding: 0,
                    transition: "color 0.2s",
                  }}
                  onMouseOver={e => e.currentTarget.style.color = "rgba(255,255,255,0.65)"}
                  onMouseOut={e => e.currentTarget.style.color = "rgba(255,255,255,0.30)"}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* CNPJ — só no cadastro */}
            {isRegister && (
              <div>
                <label style={{ display: "block", color: "rgba(255,255,255,0.55)", fontSize: "12px", fontWeight: 600, marginBottom: "7px", letterSpacing: "0.3px" }}>
                  CNPJ DA EMPRESA
                </label>
                <div style={{ position: "relative" }}>
                  <Hash size={14} color="rgba(255,255,255,0.25)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={e => setCnpj(e.target.value)}
                    required
                    style={{ ...inputStyle("cnpj"), paddingLeft: "38px" }}
                    onFocus={() => setFocusedField("cnpj")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", marginTop: "5px" }}>
                  Seu acesso ficará vinculado a este CNPJ. No login, basta e-mail e senha.
                </div>
              </div>
            )}

            {/* Info super admin */}
            {!isRegister && isSuperAdmin && (
              <div style={{ padding: "10px 14px", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.18)", borderRadius: "9px", color: "#06b6d4", fontSize: "12px" }}>
                🔐 Acesso Super Admin — você selecionará a base após o login
              </div>
            )}

            {/* Botão submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "13px",
                background: loading ? "rgba(99,102,241,0.45)" : "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                color: "white", border: "none", borderRadius: "11px",
                fontSize: "14px", fontWeight: 700, fontFamily: "inherit",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                marginTop: "4px",
                boxShadow: loading ? "none" : "0 6px 24px rgba(99,102,241,0.38)",
                transition: "all 0.2s",
                letterSpacing: "0.2px",
              }}
              onMouseOver={e => { if (!loading) { e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,102,241,0.50)"; e.currentTarget.style.transform = "translateY(-1px)" } }}
              onMouseOut={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(99,102,241,0.38)"; e.currentTarget.style.transform = "translateY(0)" }}
            >
              {loading
                ? <Loader2 size={15} style={{ animation: "spin 0.9s linear infinite" }} />
                : <ArrowRight size={15} />
              }
              {isRegister ? "Enviar Solicitação" : isSuperAdmin ? "Verificar Identidade" : "Acessar Plataforma"}
            </button>
          </form>

          {/* Toggle cadastro/login */}
          <div style={{ textAlign: "center", marginTop: "22px" }}>
            <button
              onClick={() => { setIsRegister(!isRegister); setError("") }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: "13px", fontFamily: "inherit", transition: "color 0.2s" }}
              onMouseOver={e => e.currentTarget.style.color = "rgba(255,255,255,0.65)"}
              onMouseOut={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
            >
              {isRegister ? "Já possui credencial? " : "Ainda não tem acesso? "}
              <span style={{ color: "#818cf8", fontWeight: 700 }}>
                {isRegister ? "Fazer Login" : "Solicitar agora"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* CSS para hide/show do left panel */}
      <style>{`
        .login-left-panel { display: none; }
        @media (min-width: 900px) {
          .login-left-panel { display: flex; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
