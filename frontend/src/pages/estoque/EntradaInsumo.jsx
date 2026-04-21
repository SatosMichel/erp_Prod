import { useState, useEffect } from "react"
import axios from "axios"
import { Tooltip } from "../../components/ui/Tooltip"

const token = () => localStorage.getItem("jwt_token")
const api = (url, opts = {}) =>
  axios({ url: `/api${url}`, ...opts, headers: { Authorization: `Bearer ${token()}`, ...opts.headers } })

const styles = {
  page: { fontFamily: "'Inter', system-ui, sans-serif" },
  title: { color: "var(--text-primary)", fontSize: "20px", fontWeight: 800, marginBottom: "4px" },
  subtitle: { color: "var(--text-muted)", fontSize: "13px", marginBottom: "24px" },
  card: {
    background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
    borderRadius: "14px", padding: "20px", marginBottom: "20px",
  },
  label: {
    color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase",
    letterSpacing: "0.5px", display: "block", marginBottom: "6px",
  },
  input: {
    width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
    borderRadius: "8px", padding: "10px 12px", color: "var(--text-primary)", fontSize: "14px",
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  },
  btn: (color = "#3b82f6") => ({
    background: color, color: "white", border: "none", borderRadius: "8px",
    padding: "10px 20px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  }),
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase",
    letterSpacing: "0.5px", padding: "10px 12px", textAlign: "left",
    borderBottom: "1px solid var(--border-subtle)", whiteSpace: "nowrap",
  },
  td: { color: "var(--text-secondary)", fontSize: "13px", padding: "12px 12px", borderBottom: "1px solid var(--border-subtle)" },
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

  const handleExcluir = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta entrada? O estoque correspondente será deduzido.")) return
    setLoading(true)
    try {
      await api(`/entrada-insumo/${id}`, { method: "DELETE" })
      setMsg({ type: "success", text: "✅ Entrada excluída com sucesso!" })
      carregar()
    } catch (err) {
      const detail = err.response?.data?.detail || "Erro ao excluir entrada"
      setMsg({ type: "error", text: `❌ ${detail}` })
    } finally {
      setLoading(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
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

          {/* LINHA 1: Nome + Característica — empilha no mobile */}
          <div style={{ display: "flex", gap: "14px", marginBottom: "16px", flexWrap: "wrap" }}>
            {/* Nome do Insumo com autocomplete */}
            <div style={{ position: "relative", flex: "1 1 200px", minWidth: 0 }}>
              <label style={styles.label}>Nome do Insumo *</label>
              <input
                style={styles.input} required
                value={form.insumo_nome}
                onChange={e => handleNome(e.target.value)}
                onBlur={() => setTimeout(() => setShowSugestoes(false), 200)}
                placeholder="Ex: Filamento, Resina..."
              />
              {showSugestoes && nomeSugestoes.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                  background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
                  borderRadius: "8px", maxHeight: "200px", overflowY: "auto", marginTop: "4px",
                }}>
                  {nomeSugestoes.map(i => (
                    <div key={i.id}
                      onMouseDown={() => selecionarInsumo(i)}
                      style={{
                        padding: "10px 12px", cursor: "pointer",
                        color: i.ativo ? "var(--text-secondary)" : "var(--text-muted)",
                        borderBottom: "1px solid var(--border-subtle)", fontSize: "13px",
                        display: "flex", alignItems: "center", gap: "8px",
                      }}>
                      <span>{i.nome}</span>
                      {i.caracteristica && (
                        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>— {i.caracteristica}</span>
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
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <label style={styles.label}>Característica / Variação</label>
              <input
                style={styles.input}
                value={form.caracteristica}
                onChange={e => setForm(f => ({ ...f, caracteristica: e.target.value }))}
                placeholder="Ex: Cor Preta, Cor A"
              />
              <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "5px" }}>
                Diferencie variações do mesmo insumo (ex: filamento por cor)
              </div>
            </div>
          </div>

          {/* Seletor de Unidade de Medida */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{...styles.label, display: "flex", alignItems: "center"}}>
              📏 Unidade de Medida *
              <Tooltip position="top" text="Dica: Escolha KG se você pesa o insumo. O sistema fará a baixa na produção usando KG." />
            </label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              {["UND", "KG"].map(unit => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, unidade_medida: unit }))}
                  style={{
                    padding: "9px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: 700,
                    cursor: "pointer", transition: "all 0.15s ease", fontFamily: "inherit",
                    background: form.unidade_medida === unit
                      ? (unit === "KG" ? "rgba(245,158,11,0.2)" : "rgba(59,130,246,0.2)")
                      : "var(--bg-elevated)",
                    border: form.unidade_medida === unit
                      ? `2px solid ${unit === "KG" ? "#f59e0b" : "#3b82f6"}`
                      : "2px solid var(--border-default)",
                    color: form.unidade_medida === unit
                      ? (unit === "KG" ? "#fbbf24" : "#60a5fa")
                      : "var(--text-muted)",
                  }}
                >
                  {unit === "UND" ? "📦 UND — Unidade" : "⚖️ KG — Quilogramas"}
                </button>
              ))}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "6px" }}>
              {form.unidade_medida === "UND"
                ? "Contagem em unidades inteiras (peças, rolos, caixas...)"
                : "Contagem em quilogramas (a granel, pós, resinas...)"}
            </div>
          </div>

          {/* LINHA 2: Valor + Quantidade + Condição + Data — empilha no mobile */}
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "start", marginBottom: "20px" }}>
            <div style={{ flex: "1 1 140px", minWidth: 0 }}>
              <label style={styles.label}>Valor Aquisição (R$) *</label>
              <input
                style={styles.input} required type="number" step="0.01" min="0"
                value={form.valor_aquisicao}
                onChange={e => setForm(f => ({ ...f, valor_aquisicao: e.target.value }))}
                placeholder="0,00"
              />
            </div>

            <div style={{ flex: "1 1 140px", minWidth: 0 }}>
              <label style={{...styles.label, display: "flex", alignItems: "center"}}>
                Qtd * ({form.unidade_medida})
                <Tooltip position="top" text="Use ponto para fracionar KG. Ex: 1.5 para 1kg e meio." />
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

            <div style={{ flex: "1 1 140px", minWidth: 0 }}>
              <label style={styles.label}>Condição Pgto *</label>
              <select
                style={{ ...styles.input, appearance: "auto" }}
                value={form.condicao_pagamento}
                onChange={e => setForm(f => ({ ...f, condicao_pagamento: e.target.value }))}
              >
                <option value="À Vista">À Vista</option>
                <option value="A Prazo">A Prazo</option>
              </select>
            </div>

            <div style={{ flex: "1 1 140px", minWidth: 0 }}>
              <label style={styles.label}>Data Aquisição</label>
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

      {/* Histórico de Entradas — com scroll horizontal */}
      <div style={styles.card}>
        <div style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "16px" }}>Histórico de Entradas</div>
        {entradas.length === 0 ? (
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "32px" }}>Nenhuma entrada registrada ainda.</div>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["#", "Insumo / Variação", "Unid.", "Qtd", "Val. Unit.", "Total", "Data", "Ação"].map(h => (
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
                      <td style={{ ...styles.td, color: "var(--text-muted)", fontFamily: "monospace", fontSize: "12px" }}>#{e.id}</td>
                      <td style={styles.td}>
                        <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{ins?.nome || `#${e.insumo_id}`}</div>
                        {ins?.caracteristica && (
                          <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "2px" }}>{ins.caracteristica}</div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.unitBadge(unid)}>{unid}</span>
                      </td>
                      <td style={styles.td}>{Number(e.quantidade).toLocaleString("pt-BR")}</td>
                      <td style={{ ...styles.td, whiteSpace: "nowrap" }}>R$ {(e.valor_aquisicao / e.quantidade).toFixed(2)}</td>
                      <td style={{ ...styles.td, whiteSpace: "nowrap" }}>R$ {Number(e.valor_aquisicao).toFixed(2)}</td>
                      <td style={{ ...styles.td, whiteSpace: "nowrap" }}>{new Date(e.data_aquisicao).toLocaleDateString("pt-BR")}</td>
                      <td style={styles.td}>
                        <button
                          title="Excluir entrada"
                          disabled={loading}
                          onClick={() => handleExcluir(e.id)}
                          style={{
                            background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: "6px", padding: "6px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer",
                            fontFamily: "inherit", whiteSpace: "nowrap",
                          }}>
                          EXCLUIR
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
