import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

const token = () => localStorage.getItem("jwt_token")
const api = (url, opts = {}) =>
  axios({ url: `/api${url}`, ...opts, headers: { Authorization: `Bearer ${token()}`, ...opts.headers } })

const PAGE_SIZE = 20

const styles = {
  card: { background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "14px", padding: "20px", marginBottom: "20px" },
  label: { color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" },
  select: { width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "11px 12px", color: "var(--text-primary)", fontSize: "14px", outline: "none", fontFamily: "inherit", appearance: "auto" },
  input: { background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "11px 12px", color: "var(--text-primary)", fontSize: "14px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  inputSm: { background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "7px 10px", color: "var(--text-primary)", fontSize: "13px", outline: "none", fontFamily: "inherit" },
  btn: (color) => ({ background: color, color: "white", border: "none", borderRadius: "8px", padding: "11px 20px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }),
  btnSm: (color = "#3b82f6") => ({ background: color, color: "white", border: "none", borderRadius: "6px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }),
  th: { color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid var(--border-subtle)", whiteSpace: "nowrap" },
  td: { color: "var(--text-secondary)", fontSize: "13px", padding: "12px 12px", borderBottom: "1px solid var(--border-subtle)" },
  alert: (type) => ({
    padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontSize: "13px", whiteSpace: "pre-line",
    background: type === "error" ? "rgba(239,68,68,0.1)" : type === "warn" ? "rgba(234,179,8,0.1)" : "rgba(16,185,129,0.1)",
    border: `1px solid ${type === "error" ? "rgba(239,68,68,0.3)" : type === "warn" ? "rgba(234,179,8,0.3)" : "rgba(16,185,129,0.3)"}`,
    color: type === "error" ? "#f87171" : type === "warn" ? "#fbbf24" : "#34d399",
  }),
}

export default function Producao() {
  const navigate = useNavigate()
  const [produtos, setProdutos] = useState([])
  const [produtoSelecionado, setProdutoSelecionado] = useState("")
  const [quantidade, setQuantidade] = useState(1)
  const [orcamento, setOrcamento] = useState(null)
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [historico, setHistorico] = useState([])
  const [totalOrdens, setTotalOrdens] = useState(0)
  const [obsInput, setObsInput] = useState("")
  const [filtroDataInicio, setFiltroDataInicio] = useState("")
  const [filtroDataFim, setFiltroDataFim] = useState("")
  const [pagina, setPagina] = useState(1)
  const tabelaRef = useRef(null)

  useEffect(() => {
    api("/produtos/").then(r => setProdutos(r.data.filter(p => p.ativo)))
    carregarHistorico(1, "", "")
  }, [])

  const carregarHistorico = async (pag, di, df) => {
    try {
      const skip = (pag - 1) * PAGE_SIZE
      let url = `/ordens_producao/?skip=${skip}&limit=${PAGE_SIZE}`
      if (di) url += `&data_inicio=${di}`
      if (df) url += `&data_fim=${df}`
      let countUrl = `/ordens_producao/count?`
      if (di) countUrl += `data_inicio=${di}&`
      if (df) countUrl += `data_fim=${df}`
      const [rOrdens, rCount] = await Promise.all([api(url), api(countUrl)])
      setHistorico(rOrdens.data)
      setTotalOrdens(rCount.data.total)
    } catch { /* silent */ }
  }

  const handleFiltrar = () => {
    setPagina(1)
    carregarHistorico(1, filtroDataInicio, filtroDataFim)
  }

  const handleClear = () => {
    setFiltroDataInicio("")
    setFiltroDataFim("")
    setPagina(1)
    carregarHistorico(1, "", "")
  }

  const handlePage = (novaPag) => {
    setPagina(novaPag)
    carregarHistorico(novaPag, filtroDataInicio, filtroDataFim)
    tabelaRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const totalPaginas = Math.max(1, Math.ceil(totalOrdens / PAGE_SIZE))

  const consultarOrcamento = async () => {
    if (!produtoSelecionado) return setMsg({ type: "warn", text: "⚠️ Selecione um produto." })
    if (quantidade < 1) return setMsg({ type: "warn", text: "⚠️ A quantidade deve ser ao menos 1." })
    setLoading(true)
    setMsg(null)
    setOrcamento(null)
    try {
      const r = await api(`/orcamento/${produtoSelecionado}?quantidade=${quantidade}`)
      setOrcamento(r.data)
      if (!r.data.pode_produzir) {
        const insuficientes = r.data.itens.filter(i => !i.suficiente)
        const linhas = insuficientes.map(i => {
          const falta = Number(i.quantidade_total - i.disponivel_estoque).toFixed(3).replace(/\.?0+$/, "")
          return `• ${i.insumo_nome}: precisa ${i.quantidade_total} ${i.unidade_medida}, tem ${i.disponivel_estoque} → FALTA ${falta} ${i.unidade_medida}`
        })
        setMsg({ type: "error", text: `❌ Estoque insuficiente:\n${linhas.join("\n")}` })
      }
    } catch (err) {
      setMsg({ type: "error", text: `❌ ${err.response?.data?.detail || "Erro ao consultar orçamento"}` })
    } finally { setLoading(false) }
  }

  const confirmarProducao = async () => {
    if (!orcamento?.pode_produzir) return
    setLoading(true)
    setMsg(null)
    try {
      await api("/ordem_producao/", {
        method: "POST",
        data: { produto_id: parseInt(produtoSelecionado), quantidade: parseInt(quantidade), observacao: obsInput || null }
      })
      setMsg({ type: "success", text: `✅ Produção concluída! ${quantidade} un. de "${orcamento.produto_nome}" adicionadas ao estoque.` })
      setOrcamento(null)
      setProdutoSelecionado("")
      setQuantidade(1)
      setObsInput("")
      setPagina(1)
      carregarHistorico(1, filtroDataInicio, filtroDataFim)
    } catch (err) {
      setMsg({ type: "error", text: `❌ ${err.response?.data?.detail || "Erro ao confirmar produção"}` })
    } finally { setLoading(false) }
  }

  const exportarCSV = () => {
    const header = ["#", "Produto", "Quantidade", "Status", "Data", "Observação"]
    const rows = historico.map(o => [o.id, o.produto_nome, o.quantidade, o.status, new Date(o.data_criacao).toLocaleDateString("pt-BR"), o.observacao || ""])
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `ordens_producao.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <button onClick={() => navigate("/dashboard")} style={{
          background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
          color: "var(--text-secondary)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit"
        }}>← Dashboard</button>
        <div>
          <div style={{ color: "#f97316", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>ERP Produção</div>
          <h1 style={{ color: "var(--text-primary)", fontSize: "22px", fontWeight: 800, margin: 0 }}>Produção</h1>
        </div>
      </div>

      {msg && <div style={styles.alert(msg.type)}>{msg.text}</div>}

      {/* Seleção de produto — responsivo */}
      <div style={styles.card}>
        <div style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "16px", fontSize: "15px" }}>📋 Selecione o Produto e Quantidade</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={styles.label}>Produto *</label>
            <select style={styles.select} value={produtoSelecionado} onChange={e => { setProdutoSelecionado(e.target.value); setOrcamento(null); setMsg(null) }}>
              <option value="">— Selecione um produto —</option>
              {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 120px", minWidth: "120px" }}>
              <label style={styles.label}>Quantidade</label>
              <input style={{ ...styles.input, width: "100%" }} type="number" min="1"
                value={quantidade} onChange={e => { setQuantidade(e.target.value); setOrcamento(null) }} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button onClick={consultarOrcamento} disabled={loading || !produtoSelecionado}
                style={{ ...styles.btn("#3b82f6"), opacity: !produtoSelecionado ? 0.5 : 1, width: "100%" }}>
                🔍 Consultar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resultado do orçamento */}
      {orcamento && (
        <div style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "16px" }}>{orcamento.produto_nome}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                {orcamento.quantidade} unidade(s) a produzir
                {produtos.find(p => p.id === parseInt(produtoSelecionado))?.tempo_producao_horas > 0 && (
                  <span style={{ marginLeft: "8px", color: "#f59e0b", fontWeight: 600 }}>
                    • ⏱️ Previsão de {(produtos.find(p => p.id === parseInt(produtoSelecionado))?.tempo_producao_horas * quantidade).toFixed(1)} horas
                  </span>
                )}
              </div>
            </div>
            <span style={{
              padding: "4px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
              background: orcamento.pode_produzir ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: orcamento.pode_produzir ? "#34d399" : "#f87171",
              border: `1px solid ${orcamento.pode_produzir ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
              whiteSpace: "nowrap",
            }}>
              {orcamento.pode_produzir ? "✓ Pode Produzir" : "✗ Sem Estoque"}
            </span>
          </div>

          {/* Painel de déficit */}
          {!orcamento.pode_produzir && (
            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "14px 16px", marginBottom: "18px" }}>
              <div style={{ color: "#f87171", fontWeight: 700, fontSize: "13px", marginBottom: "10px" }}>⚠️ Insumos com déficit:</div>
              {orcamento.itens.filter(i => !i.suficiente).map(i => {
                const falta = i.quantidade_total - i.disponivel_estoque
                return (
                  <div key={i.insumo_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", flexWrap: "wrap", gap: "6px" }}>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "13px" }}>{i.insumo_nome}</span>
                    <div style={{ display: "flex", gap: "8px", fontSize: "12px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <span style={{ color: "var(--text-muted)" }}>Necessário: <strong style={{ color: "var(--text-secondary)" }}>{i.quantidade_total} {i.unidade_medida}</strong></span>
                      <span style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "2px 10px", borderRadius: "20px", fontWeight: 700, border: "1px solid rgba(239,68,68,0.3)" }}>
                        FALTA {Number(falta).toFixed(3).replace(/\.?0+$/, "")} {i.unidade_medida}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Insumos Necessários</div>
          {/* Tabela com scroll horizontal no mobile */}
          <div style={{ overflowX: "auto", marginBottom: "20px", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead>
                <tr>
                  {["Insumo", "Unid.", "Qtd/Un", "Total", "Disponível", "Situação", "Déficit"].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orcamento.itens.map(item => {
                  const falta = item.quantidade_total - item.disponivel_estoque
                  return (
                    <tr key={item.insumo_id}>
                      <td style={{ ...styles.td, color: "var(--text-primary)", fontWeight: 600 }}>{item.insumo_nome}</td>
                      <td style={styles.td}>
                        <span style={{
                          padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                          background: item.unidade_medida === "KG" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)",
                          color: item.unidade_medida === "KG" ? "#fbbf24" : "#60a5fa",
                          border: `1px solid ${item.unidade_medida === "KG" ? "rgba(245,158,11,0.3)" : "rgba(59,130,246,0.3)"}`,
                        }}>{item.unidade_medida || "UND"}</span>
                      </td>
                      <td style={styles.td}>{item.quantidade_necessaria}</td>
                      <td style={styles.td}>{item.quantidade_total}</td>
                      <td style={{ ...styles.td, color: item.suficiente ? "#34d399" : "#f87171", fontWeight: 700 }}>
                        {item.disponivel_estoque}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                          background: item.suficiente ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                          color: item.suficiente ? "#34d399" : "#f87171",
                          border: `1px solid ${item.suficiente ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                        }}>{item.suficiente ? "OK" : "INSUF."}</span>
                      </td>
                      <td style={styles.td}>
                        {!item.suficiente ? (
                          <span style={{ color: "#f87171", fontWeight: 700, fontSize: "12px" }}>
                            −{Number(falta).toFixed(3).replace(/\.?0+$/, "")}
                          </span>
                        ) : (
                          <span style={{ color: "#34d399", fontSize: "12px" }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {orcamento.pode_produzir && (
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "16px" }}>
              <div style={{ marginBottom: "12px" }}>
                <label style={styles.label}>Observação (opcional)</label>
                <input style={{ ...styles.input, width: "100%" }} value={obsInput}
                  onChange={e => setObsInput(e.target.value)} placeholder="Ex: Lote 01, turno manhã..." />
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button disabled style={{ ...styles.btn("var(--bg-elevated)"), color: "var(--text-muted)", border: "1px solid var(--border-default)", cursor: "not-allowed" }}>
                  📄 Apenas Orçamento
                </button>
                <button onClick={confirmarProducao} disabled={loading} style={styles.btn("#f97316")}>
                  {loading ? "Processando..." : "🏭 Confirmar Produção"}
                </button>
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "8px" }}>
                * Ao confirmar, os insumos serão descontados e o estoque do produto será atualizado.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Histórico de Ordens */}
      <div style={styles.card} ref={tabelaRef}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>📂 Histórico de Ordens ({totalOrdens})</div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <input type="date" style={{ ...styles.inputSm, width: "auto" }} value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)} title="Data início" />
            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>até</span>
            <input type="date" style={{ ...styles.inputSm, width: "auto" }} value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)} title="Data fim" />
            <button onClick={handleFiltrar} style={styles.btnSm("#3b82f6")}>🔍 Filtrar</button>
            <button onClick={handleClear} style={styles.btnSm("#475569")}>✕ Limpar</button>
            <button onClick={exportarCSV} style={styles.btnSm("#10b981")}>⬇ CSV</button>
          </div>
        </div>

        {historico.length === 0 ? (
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "32px" }}>Nenhuma ordem encontrada.</div>
        ) : (
          <>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "550px" }}>
                <thead>
                  <tr>
                    {["#", "Produto", "Qtd", "Status", "Data", "Obs."].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historico.map(o => (
                    <tr key={o.id}>
                      <td style={{ ...styles.td, color: "var(--text-muted)", fontFamily: "monospace", fontSize: "12px" }}>#{o.id}</td>
                      <td style={{ ...styles.td, color: "var(--text-primary)", fontWeight: 600 }}>{o.produto_nome}</td>
                      <td style={styles.td}>{o.quantidade}</td>
                      <td style={styles.td}>
                        <span style={{ padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }}>
                          {o.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={styles.td}>{new Date(o.data_criacao).toLocaleDateString("pt-BR")}</td>
                      <td style={{ ...styles.td, color: "var(--text-muted)", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis" }}>{o.observacao || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", marginTop: "8px", borderTop: "1px solid var(--border-subtle)", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Pág. {pagina} de {totalPaginas}</span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button disabled={pagina <= 1} onClick={() => handlePage(pagina - 1)}
                  style={{ ...styles.btnSm("var(--bg-elevated)"), opacity: pagina <= 1 ? 0.4 : 1, border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                  ←
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ color: "var(--text-muted)" }}>…</span>}
                      <button onClick={() => handlePage(p)}
                        style={{ ...styles.btnSm(p === pagina ? "#3b82f6" : "var(--bg-elevated)"), border: "1px solid var(--border-default)", minWidth: "32px", color: p === pagina ? "white" : "var(--text-secondary)" }}>
                        {p}
                      </button>
                    </span>
                  ))}
                <button disabled={pagina >= totalPaginas} onClick={() => handlePage(pagina + 1)}
                  style={{ ...styles.btnSm("var(--bg-elevated)"), opacity: pagina >= totalPaginas ? 0.4 : 1, border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                  →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
