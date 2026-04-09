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
  select: { width: "100%", background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 12px", color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box" },
  btn: (color = "#3b82f6") => ({ background: color, color: "white", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }),
  btnSm: (color = "#3b82f6") => ({ background: color, color: "white", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }),
  alert: (type) => ({
    padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px",
    background: type === "error" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
    border: `1px solid ${type === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
    color: type === "error" ? "#f87171" : "#34d399",
  }),
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
  fichaRow: { display: "grid", gridTemplateColumns: "1fr 140px 80px 36px", gap: "8px", marginBottom: "8px", alignItems: "end" },
}

const fichaVazia = () => ({ insumo_id: "", quantidade_necessaria: "" })

export default function CadastroProduto() {
  const [insumos, setInsumos] = useState([])
  const [produtos, setProdutos] = useState([])
  const [form, setForm] = useState({ nome: "", descricao: "", caracteristica: "", idcodbar: "", tempo_producao_horas: "" })
  const [fichas, setFichas] = useState([fichaVazia()])
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [duplicado, setDuplicado] = useState(false)

  useEffect(() => { carregar() }, [])

  const carregar = async () => {
    const [ri, rp] = await Promise.all([api("/insumos/"), api("/produtos/")])
    setInsumos(ri.data.filter(i => i.ativo))
    setProdutos(rp.data)
  }

  const checkDuplicado = (nome) => {
    const existe = produtos.find(p => p.nome.toLowerCase() === nome.toLowerCase())
    setDuplicado(!!existe)
  }

  const addFicha = () => setFichas(f => [...f, fichaVazia()])
  const removeFicha = (idx) => setFichas(f => f.filter((_, i) => i !== idx))
  const updateFicha = (idx, field, val) => setFichas(f => f.map((item, i) => i === idx ? { ...item, [field]: val } : item))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (duplicado) return setMsg({ type: "error", text: "❌ Produto com este nome já está cadastrado!" })
    const fichasValidas = fichas.filter(f => f.insumo_id && f.quantidade_necessaria)
    if (fichasValidas.length === 0) return setMsg({ type: "error", text: "❌ Adicione pelo menos um insumo à ficha técnica." })

    setLoading(true)
    setMsg(null)
    try {
      // 1. Cadastrar produto
      const resProd = await api("/produtos/", { method: "POST", data: form })
      const produtoId = resProd.data.id

      // 2. Cadastrar ficha técnica (insumos e quantidades)
      for (const f of fichasValidas) {
        await api("/fichas_tecnicas/", {
          method: "POST",
          data: { produto_id: produtoId, insumo_id: parseInt(f.insumo_id), quantidade_necessaria: parseFloat(f.quantidade_necessaria) }
        })
      }

      setMsg({ type: "success", text: `✅ Produto "${form.nome}" cadastrado com sucesso! Estoque inicial: 0 unidades.` })
      setForm({ nome: "", descricao: "", caracteristica: "", idcodbar: "", tempo_producao_horas: "" })
      setFichas([fichaVazia()])
      setDuplicado(false)
      carregar()
    } catch (err) {
      setMsg({ type: "error", text: `❌ ${err.response?.data?.detail || "Erro ao cadastrar produto"}` })
    } finally { setLoading(false) }
  }

  return (
    <div style={styles.page}>
      <div style={styles.title}>Cadastro de Produto</div>
      <div style={styles.subtitle}>Cadastre produtos finais com sua ficha técnica de insumos.</div>

      <div style={styles.card}>
        <form onSubmit={handleSubmit}>
          {msg && <div style={styles.alert(msg.type)}>{msg.text}</div>}

          <div style={{ marginBottom: "20px" }}>
            <div style={{ color: "#3b82f6", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              ▸ Dados do Produto
            </div>
            <div style={styles.row}>
              <div>
                <label style={styles.label}>Nome do Produto *</label>
                <input style={{ ...styles.input, borderColor: duplicado ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)" }}
                  required value={form.nome}
                  onChange={e => { setForm(f => ({ ...f, nome: e.target.value })); checkDuplicado(e.target.value) }}
                  placeholder="Ex: Camiseta modelo A" />
                {duplicado && <div style={{ color: "#f87171", fontSize: "12px", marginTop: "4px" }}>⚠️ Este nome já está cadastrado!</div>}
              </div>
              <div>
                <label style={styles.label}>Descrição</label>
                <input style={styles.input} value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Opcional" />
              </div>
            </div>
            </div>
            <div style={styles.row}>
              <div>
                <label style={styles.label}>Característica</label>
                <input style={styles.input} value={form.caracteristica}
                  onChange={e => setForm(f => ({ ...f, caracteristica: e.target.value }))} placeholder="Tamanho, cor, etc. (opcional)" />
              </div>
              <div>
                <label style={styles.label}>ID Código de Barras</label>
                <input style={styles.input} value={form.idcodbar}
                  onChange={e => setForm(f => ({ ...f, idcodbar: e.target.value }))} placeholder="Cod. Customizado (opcional)" />
              </div>
            </div>
            <div style={{ marginBottom: "16px", maxWidth: "260px" }}>
              <label style={styles.label}>Tempo de Produção (em horas) *</label>
              <input style={styles.input} type="number" step="0.5" min="0" required
                value={form.tempo_producao_horas}
                onChange={e => setForm(f => ({ ...f, tempo_producao_horas: e.target.value }))} placeholder="Ex: 2.5 horas" />
            </div>
          </div>

          <div>
            <div style={{ color: "#f97316", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              ▸ Ficha Técnica — Insumos Necessários
            </div>
            <div style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "12px" }}>Selecione os insumos e a quantidade necessária para fabricar <strong style={{color:"white"}}>1 unidade</strong> do produto.</div>

            {fichas.map((f, idx) => {
              const insumoSel = insumos.find(i => String(i.id) === String(f.insumo_id))
              const unit = insumoSel?.unidade_medida || "UND"
              const isKG = unit === "KG"
              return (
                <div key={idx} style={styles.fichaRow}>
                  <div>
                    {idx === 0 && <label style={styles.label}>Insumo *</label>}
                    <select style={styles.select} value={f.insumo_id} required={idx === 0}
                      onChange={e => updateFicha(idx, "insumo_id", e.target.value)}>
                      <option value="">— Selecione um insumo —</option>
                      {insumos.map(i => (
                        <option key={i.id} value={i.id}>
                          {i.nome} [{i.unidade_medida || "UND"}]
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    {idx === 0 && <label style={styles.label}>Quantidade</label>}
                    <input style={styles.input} type="number" step="0.001" min="0.001"
                      value={f.quantidade_necessaria} onChange={e => updateFicha(idx, "quantidade_necessaria", e.target.value)}
                      placeholder={isKG ? "Ex: 1.500" : "Ex: 2"} required={!!f.insumo_id} />
                  </div>
                  <div>
                    {idx === 0 && <label style={styles.label}>Unid.</label>}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "10px 0", borderRadius: "8px", fontSize: "12px", fontWeight: 700,
                      background: f.insumo_id ? (isKG ? "rgba(245,158,11,0.12)" : "rgba(59,130,246,0.12)") : "rgba(255,255,255,0.03)",
                      border: `1px solid ${f.insumo_id ? (isKG ? "rgba(245,158,11,0.3)" : "rgba(59,130,246,0.3)") : "rgba(255,255,255,0.06)"}`,
                      color: f.insumo_id ? (isKG ? "#fbbf24" : "#60a5fa") : "#475569",
                      minHeight: "42px",
                    }}>
                      {f.insumo_id ? (isKG ? "⚖️ KG" : "📦 UND") : "—"}
                    </div>
                  </div>
                  <div style={{ marginTop: idx === 0 ? "18px" : "0" }}>
                    {fichas.length > 1 && (
                      <button type="button" onClick={() => removeFicha(idx)}
                        style={{ ...styles.btnSm("rgba(239,68,68,0.2)"), color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            <button type="button" onClick={addFicha}
              style={{ ...styles.btn("rgba(59,130,246,0.15)"), color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)", marginTop: "8px" }}>
              + Adicionar Insumo
            </button>
          </div>

          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button type="submit" style={styles.btn("#10b981")} disabled={loading || duplicado}>
              {loading ? "Salvando..." : "✓ Salvar Produto"}
            </button>
            <span style={{ color: "#475569", fontSize: "12px", marginLeft: "12px" }}>
              O produto será adicionado ao estoque com quantidade inicial zero.
            </span>
          </div>
        </form>
      </div>

      <div style={styles.card}>
        <div style={{ color: "white", fontWeight: 700, marginBottom: "16px" }}>Produtos Cadastrados ({produtos.length})</div>
        {produtos.length === 0 ? (
          <div style={{ color: "#475569", textAlign: "center", padding: "32px" }}>Nenhum produto cadastrado ainda.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["CODBAR", "Nome", "Descrição", "Característica", "Horas", "Estoque", "Status"].map(h => (
                  <th key={h} style={{ color: "#475569", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {produtos.map(p => (
                <tr key={p.id}>
                  <td style={{ color: "#64748b", fontSize: "12px", padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "monospace" }}>{p.idcodbar || `#${p.id}`}</td>
                  <td style={{ color: "#e2e8f0", fontSize: "13px", padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontWeight: 600 }}>{p.nome}</td>
                  <td style={{ color: "#94a3b8", fontSize: "13px", padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{p.descricao || "—"}</td>
                  <td style={{ color: "#94a3b8", fontSize: "13px", padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{p.caracteristica || "—"}</td>
                  <td style={{ color: "#94a3b8", fontSize: "13px", padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{p.tempo_producao_horas ? `${p.tempo_producao_horas}h` : "—"}</td>
                  <td style={{ color: p.quantidade_estoque > 0 ? "#34d399" : "#94a3b8", fontSize: "13px", padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontWeight: 600 }}>{p.quantidade_estoque}</td>
                  <td style={{ padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                      background: p.ativo ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      color: p.ativo ? "#34d399" : "#f87171",
                      border: `1px solid ${p.ativo ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                      {p.ativo ? "ATIVO" : "INATIVO"}
                    </span>
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
