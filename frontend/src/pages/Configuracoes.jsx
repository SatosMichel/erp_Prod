import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, Search, Upload, Save, CheckCircle, AlertCircle, X } from "lucide-react"

export default function Configuracoes({ onClose }) {
  const navigate = useNavigate()
  const fileRef = useRef()
  const [empresa, setEmpresa] = useState({ nome: "", cnpj: "", ie: "", endereco: "", telefone: "", logo_url: null })
  const [consultando, setConsultando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoFile, setLogoFile] = useState(null)

  const token = () => localStorage.getItem("jwt_token")

  useEffect(() => {
    fetch("/api/empresas/minha", { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) { setEmpresa(data); if (data.logo_url) setLogoPreview(data.logo_url) } })
      .catch(() => {})
  }, [])

  const consultarCnpj = async () => {
    const cnpjNum = empresa.cnpj.replace(/\D/g, "")
    if (cnpjNum.length !== 14) { setMsg({ type: "error", text: "CNPJ inválido. Verifique os 14 dígitos." }); return }
    setConsultando(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/empresas/consulta-cnpj/${cnpjNum}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      setEmpresa(prev => ({
        ...prev,
        nome: data.nome || prev.nome,
        endereco: data.endereco || prev.endereco,
        telefone: data.telefone || prev.telefone,
      }))
      setMsg({ type: "ok", text: `✅ Dados importados: ${data.nome}` })
    } catch (e) { setMsg({ type: "error", text: e.message || "Erro ao consultar CNPJ" }) }
    setConsultando(false)
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSalvando(true)
    setMsg(null)
    try {
      // Salvar dados da empresa
      const cnpjEncoded = encodeURIComponent(empresa.cnpj)
      const resSave = await fetch(`/api/empresas/${cnpjEncoded}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ nome: empresa.nome, ie: empresa.ie, endereco: empresa.endereco, telefone: empresa.telefone })
      })
      if (!resSave.ok) throw new Error((await resSave.json()).detail)

      // Upload de logo se selecionado
      if (logoFile) {
        const formData = new FormData()
        formData.append("file", logoFile)
        const resLogo = await fetch(`/api/empresas/${cnpjEncoded}/logo`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token()}` },
          body: formData
        })
        if (resLogo.ok) {
          const logoData = await resLogo.json()
          localStorage.setItem("empresa_logo", logoData.logo_url)
          window.dispatchEvent(new Event("empresa-atualizada"))
        }
      }
      setMsg({ type: "ok", text: "✅ Configurações salvas com sucesso!" })
      localStorage.setItem("empresa_nome", empresa.nome)
      window.dispatchEvent(new Event("empresa-atualizada"))
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Erro ao salvar configurações" })
    }
    setSalvando(false)
  }

  const inputStyle = {
    width: "100%", padding: "10px 14px", background: "#1e293b",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
    color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box"
  }
  const labelStyle = { display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
      <div style={{ background: "#0f1629", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflow: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "38px", height: "38px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={18} color="#6366f1" />
            </div>
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: "16px" }}>Configurações da Empresa</div>
              <div style={{ color: "#475569", fontSize: "12px" }}>Dados cadastrais e identidade visual</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: "8px", padding: "6px", cursor: "pointer", display: "flex" }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Logomarca */}
          <div>
            <label style={labelStyle}>Logomarca da Empresa</label>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                {logoPreview ? <img src={logoPreview} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  : <Building2 size={28} color="#334155" />}
              </div>
              <div style={{ flex: 1 }}>
                <button type="button" onClick={() => fileRef.current.click()} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)",
                  color: "#818cf8", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontSize: "13px", fontWeight: 600
                }}>
                  <Upload size={14} /> Enviar Logomarca
                </button>
                <div style={{ color: "#475569", fontSize: "11px", marginTop: "6px" }}>PNG, JPG ou WEBP. Aparecerá no topo do sistema e nos relatórios futuros.</div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: "none" }} />
            </div>
          </div>

          {/* CNPJ + consulta */}
          <div>
            <label style={labelStyle}>CNPJ</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input value={empresa.cnpj} onChange={e => setEmpresa({ ...empresa, cnpj: e.target.value })} placeholder="00.000.000/0001-00" style={{ ...inputStyle, flex: 1 }} />
              <button type="button" onClick={consultarCnpj} disabled={consultando} style={{
                padding: "10px 14px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
                color: "#60a5fa", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", flexShrink: 0
              }}>
                <Search size={13} /> {consultando ? "..." : "Consultar"}
              </button>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label style={labelStyle}>Nome / Razão Social</label>
            <input value={empresa.nome} onChange={e => setEmpresa({ ...empresa, nome: e.target.value })} placeholder="Ex: Satos Indústria Ltda" style={inputStyle} required />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Inscrição Estadual (IE)</label>
              <input value={empresa.ie || ""} onChange={e => setEmpresa({ ...empresa, ie: e.target.value })} placeholder="000.000.000" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input value={empresa.telefone || ""} onChange={e => setEmpresa({ ...empresa, telefone: e.target.value })} placeholder="(00) 00000-0000" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Endereço</label>
            <input value={empresa.endereco || ""} onChange={e => setEmpresa({ ...empresa, endereco: e.target.value })} placeholder="Rua, nº, Cidade/UF" style={inputStyle} />
          </div>

          {msg && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "8px", background: msg.type === "ok" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: msg.type === "ok" ? "#10b981" : "#f87171", fontSize: "13px" }}>
              {msg.type === "ok" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {msg.text}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: "10px", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}>
              Fechar
            </button>
            <button type="submit" disabled={salvando} style={{ flex: 2, padding: "11px", background: "#6366f1", color: "white", border: "none", borderRadius: "10px", cursor: salvando ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <Save size={15} />
              {salvando ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
