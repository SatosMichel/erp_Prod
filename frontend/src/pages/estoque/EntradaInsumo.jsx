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
  label: {
    color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase",
    letterSpacing: "0.5px", display: "block", marginBottom: "6px",
  },
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
  th: {
    color: "#475569", fontSize: "11px", textTransform: "uppercase",
    letterSpacing: "0.5px", padding: "10px 12px", textAlign: "left",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  td: { color: "#cbd5e1", fontSize: "13px", padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  alert: (type) => ({
    padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px",
    background: type === "error" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
    border: `1px solid ${type === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
    color: type === "error" ? "#f87171" : "#34d399",
  }),
  unitBadge: (unit) => ({
    display: "inline-flex", alignItems: "center", gap: "4px",
    padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
    background: unit === "KG" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)",
    color: unit === "KG" ? "#fbbf24" : "#60a5fa",
    border: `1px solid ${unit === "KG" ? "rgba(245,158,11,0.3)" : "rgba(59,130,246,0.3)"}`,
  }),
}

const formVazio = () => ({
  insumo_nome: "",
  caracteristica: "",
  valor_aquisicao: "",
  quantidade: "",
  unidade_medida: "UND",
  data_aquisicao: "",
  condicao_pagamento: "À Vista",
  data_pagamento: "",
})

export default function EntradaInsumo() {
  const [insumos, setInsumos] = useState([])
  const [entradas, setEntradas] = useState([])
  const [form, setForm] = useState(formVazio())
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

  const selecionarInsumo = (insumo) => {
    setForm(f => ({
      ...f,
      insumo_nome: insumo.nome,
      caracteristica: insumo.caracteristica || "",
      unidade_medida: insumo.unidade_medida || "UND",
    }))
    setShowSugestoes(false)
    if (!insumo.ativo) {
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
      if (!form.insumo_nome.trim()) {
        setMsg({ type: "error", text: "❌ Informe o nome do insumo." })
        setLoading(false)
        return
      }
      const qtd = parseFloat(String(form.quantidade).replace(",", "."))
      if (isNaN(qtd) || qtd <= 0) {
        setMsg({ type: "error", text: "❌ Informe uma quantidade válida." })
        setLoading(false)
        return
      }
      const payload = {
        insumo_nome: form.insumo_nome.trim(),
        caracteristica: form.caracteristica.trim() || null,
        valor_aquisicao: parseFloat(String(form.valor_aquisicao).replace(",", ".")),
        quantidade: qtd,
        unidade_medida: form.unidade_medida,
        condicao_pagamento: form.condicao_pagamento,
        data_pagamento: form.condicao_pagamento === "A Prazo" && form.data_pagamento ? form.data_pagamento : null,
        data_aquisicao: form.data_aquisicao || null,
      }
      await api("/entrada-insumo/", { method: "POST", data: payload })
      setMsg({ type: "success", text: "✅ Entrada registrada com sucesso!" })
      setForm(formVazio())
      carregar()
    } catch (err) {
      const detail = err.response?.data?.detail || "Erro ao registrar entrada"
      setMsg({ type: "error", text: `❌ ${detail}` })
    } finally { setLoading(false) }
  }

  const getNomeInsumo = (id) => {
    const ins = insumos.find(i => i.id === id)
    if (!ins) return `#${id}`
    return ins.caracteristica ? `${ins.nome} — ${ins.caracteristica}` : ins.nome
  }

  return (
    <div style={styles.page}>
      <div style={styles.title}>Entrada de Insumo</div>
      <div style={styles.subtitle}>
        Registre a compra de insumos. Se o insumo for novo, ele será cadastrado automaticamente.
      </div>

      <div style={styles.card}>
        <form onSubmit={handleSubmit}>
          {msg && <div style={styles.alert(msg.type)}>{msg.text}</div>}

          {/* LINHA 1: Nome + Característica */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            {/* Nome do Insumo com autocomplete */}
            <div style={{ position: "relative" }}>
              <label style={styles.label}>Nome do Insumo *</label>
              <input
                style={styles.input} required
                value={form.insumo_nome}
                onChange={e => handleNome(e.target.value)}
                onBlur={() => setTimeout(() => setShowSugestoes(false), 200)}
                placeholder="Ex: Filamento, Resina, PLA..."
              />
              {showSugestoes && nomeSugestoes.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                  background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px", maxHeight: "200px", overflowY: "auto", marginTop: "4px",
                }}>
                  {nomeSugestoes.map(i => (
                    <div key={i.id}
                      onMouseDown={() => selecionarInsumo(i)}
                      style={{
                        padding: "10px 12px", cursor: "pointer",
                        color: i.ativo ? "#cbd5e1" : "#64748b",
                        borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "13px",
                        display: "flex", alignItems: "center", gap: "8px",
                      }}>
                      <span>{i.nome}</span>
                      {i.caracteristica && (
                        <span style={{ color: "#94a3b8", fontSize: "12px" }}>— {i.caracteristica}</span>
                      )}
                      {i.unidade_medida && (
                        <span style={styles.unitBadge(i.unidade_medida)}>{i.unidade_medida}</span>
                      )}
                      {!i.ativo && <span style={{ color: "#ef4444", fontSize: "11px" }}>(inativo)</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Característica */}
            <div>
              <label style={styles.label}>Característica / Variação</label>
              <input
                style={styles.input}
                value={form.caracteristica}
                onChange={e => setForm(f => ({ ...f, caracteristica: e.target.value }))}
                placeholder="Ex: Cor Preta, Cor Azul, 1.75mm..."
              />
              <div style={{ color: "#475569", fontSize: "11px", marginTop: "5px" }}>
                Diferencie variações do mesmo insumo (ex: filamento por cor)
              </div>
            </div>
          </div>

          {/* Seletor de Unidade de Medida */}
          <div style={{ marginBottom: "20px" }}>
            <label style={styles.label}>📏 Unidade de Medida *</label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              {["UND", "KG"].map(unit => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, unidade_medida: unit }))}
                  style={{
                    padding: "9px 24px", borderRadius: "8px", fontSize: "13px", fontWeight: 700,
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
                  ? "Contagem em unidades inteiras (peças, rolos, caixas...)"
                  : "Contagem em quilogramas (a granel, pós, resinas...)"}
              </span>
            </div>
          </div>

          {/* LINHA 2: Valor + Quantidade + Condição + Data */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px", alignItems: "start", marginBottom: "20px" }}>
            <div>
              <label style={styles.label}>Valor de Aquisição (Total R$) *</label>
              <input
                style={styles.input} required type="number" step="0.01" min="0"
                value={form.valor_aquisicao}
                onChange={e => setForm(f => ({ ...f, valor_aquisicao: e.target.value }))}
                placeholder="0,00"
              />
            </div>

            <div>
              <label style={styles.label}>
                Quantidade * {form.unidade_medida === "KG" ? "(KG)" : "(UND)"}
              </label>
              <input
                style={styles.input} required
                type="number"
                step={form.unidade_medida === "KG" ? "0.001" : "1"}
                min={form.unidade_medida === "KG" ? "0.001" : "1"}
                value={form.quantidade}
                onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))}
                placeholder={form.unidade_medida === "KG" ? "Ex: 2.5" : "Ex: 10"}
              />
              <div style={{ marginTop: "5px" }}>
                <span style={styles.unitBadge(form.unidade_medida)}>
                  {form.unidade_medida === "KG" ? "⚖️ Quilogramas" : "📦 Unidades"}
                </span>
              </div>
            </div>

            <div>
              <label style={styles.label}>Condição de Pagamento *</label>
              <select
                style={{ ...styles.input, appearance: "auto" }}
                value={form.condicao_pagamento}
                onChange={e => setForm(f => ({ ...f, condicao_pagamento: e.target.value }))}
              >
                <option value="À Vista">À Vista</option>
                <option value="A Prazo">A Prazo</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Data de Aquisição</label>
              <input
                style={styles.input} type="date"
                value={form.data_aquisicao}
                onChange={e => setForm(f => ({ ...f, data_aquisicao: e.target.value }))}
              />
            </div>
          </div>

          {/* Campo de data de pagamento (só aparece se A Prazo) */}
          {form.condicao_pagamento === "A Prazo" && (
            <div style={{ marginBottom: "20px", maxWidth: "260px" }}>
              <label style={styles.label}>Data do Pagamento *</label>
              <input
                style={styles.input} type="date" required
                value={form.data_pagamento}
                onChange={e => setForm(f => ({ ...f, data_pagamento: e.target.value }))}
              />
            </div>
          )}

          <button type="submit" style={styles.btn()} disabled={loading}>
            {loading ? "Registrando..." : "✚ Registrar Entrada"}
          </button>
        </form>
      </div>

      {/* Histórico de Entradas */}
      <div style={styles.card}>
        <div style={{ color: "white", fontWeight: 700, marginBottom: "16px" }}>Histórico de Entradas</div>
        {entradas.length === 0 ? (
          <div style={{ color: "#475569", textAlign: "center", padding: "32px" }}>Nenhuma entrada registrada ainda.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {["#", "Insumo / Variação", "Unid.", "Qtd", "Valor Unit. (R$)", "Total (R$)", "Data"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entradas.map(e => {
                const ins = insumos.find(i => i.id === e.insumo_id)
                const unid = ins?.unidade_medida || "UND"
                return (
                  <tr key={e.id}>
                    <td style={{ ...styles.td, color: "#64748b", fontFamily: "monospace", fontSize: "12px" }}>#{e.id}</td>
                    <td style={styles.td}>
                      <div style={{ color: "#e2e8f0", fontWeight: 600 }}>{ins?.nome || `#${e.insumo_id}`}</div>
                      {ins?.caracteristica && (
                        <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>{ins.caracteristica}</div>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.unitBadge(unid)}>{unid}</span>
                    </td>
                    <td style={styles.td}>{Number(e.quantidade).toLocaleString("pt-BR")}</td>
                    <td style={styles.td}>R$ {(e.valor_aquisicao / e.quantidade).toFixed(2)}</td>
                    <td style={styles.td}>R$ {Number(e.valor_aquisicao).toFixed(2)}</td>
                    <td style={styles.td}>{new Date(e.data_aquisicao).toLocaleDateString("pt-BR")}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
