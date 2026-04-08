import { useState, useEffect, useRef } from "react"
import axios from "axios"

const token = () => localStorage.getItem("jwt_token")
const api = (url, opts = {}) =>
  axios({ url: `/api${url}`, ...opts, headers: { Authorization: `Bearer ${token()}`, ...opts.headers } })

const PAGE_SIZE = 20

const styles = {
  card: { background: "#0f1629", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "24px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { color: "#475569", fontSize: "11px", textTransform: "uppercase", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  td: { color: "#cbd5e1", fontSize: "13px", padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  inputSm: { background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "7px 10px", color: "white", fontSize: "13px", outline: "none" },
  btnSm: (color = "#3b82f6") => ({ background: color, color: "white", border: "none", borderRadius: "6px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }),
}

export default function HistoricoVendas() {
  const [vendas, setVendas] = useState([])
  const [produtos, setProdutos] = useState([])
  const [marketplaces, setMarketplaces] = useState([])
  const [totalVendas, setTotalVendas] = useState(0)
  const [pagina, setPagina] = useState(1)

  // filtros
  const [filtroDataInicio, setFiltroDataInicio] = useState("")
  const [filtroDataFim, setFiltroDataFim] = useState("")
  const [filtroTexto, setFiltroTexto] = useState("")
  const [loading, setLoading] = useState(false)

  const tabelaRef = useRef(null)

  useEffect(() => {
    Promise.all([api("/produtos/"), api("/marketplaces/")]).then(([rp, rm]) => {
      setProdutos(rp.data)
      setMarketplaces(rm.data)
    })
    carregarVendas(1, "", "")
  }, [])

  const carregarVendas = async (pag, di, df) => {
    setLoading(true)
    try {
      const skip = (pag - 1) * PAGE_SIZE
      let url = `/vendas/?skip=${skip}&limit=${PAGE_SIZE}`
      let countUrl = `/vendas/count?`
      if (di) { url += `&data_inicio=${di}`; countUrl += `data_inicio=${di}&` }
      if (df) { url += `&data_fim=${df}`; countUrl += `data_fim=${df}` }
      const [rv, rc] = await Promise.all([api(url), api(countUrl)])
      setVendas(rv.data)
      setTotalVendas(rc.data.total)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleFiltrar = () => {
    setPagina(1)
    carregarVendas(1, filtroDataInicio, filtroDataFim)
  }

  const handleClear = () => {
    setFiltroDataInicio("")
    setFiltroDataFim("")
    setFiltroTexto("")
    setPagina(1)
    carregarVendas(1, "", "")
  }

  const handlePage = (novaPag) => {
    setPagina(novaPag)
    carregarVendas(novaPag, filtroDataInicio, filtroDataFim)
    tabelaRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const totalPaginas = Math.max(1, Math.ceil(totalVendas / PAGE_SIZE))

  const getNomeProduto = id => produtos.find(p => p.id === id)?.nome || String(id)
  const getNomeMarketplace = id => marketplaces.find(m => m.id === id)?.nome || "Venda Direta"

  // Filtro local de texto (busca nos dados da página atual)
  const vendasFiltradas = filtroTexto
    ? vendas.filter(v =>
        getNomeProduto(v.produto_id).toLowerCase().includes(filtroTexto.toLowerCase()) ||
        v.nome_cliente.toLowerCase().includes(filtroTexto.toLowerCase())
      )
    : vendas

  // Exportação CSV
  const exportarCSV = () => {
    const header = ["#", "Data", "Produto", "Qtd", "Preço Un.", "Canal", "Cliente", "UF", "NF-e", "Margem%"]
    const rows = vendasFiltradas.map(v => [
      v.id,
      new Date(v.data_venda).toLocaleDateString("pt-BR"),
      getNomeProduto(v.produto_id),
      v.quantidade,
      v.preco_venda_unit.toFixed(2),
      getNomeMarketplace(v.marketplace_id),
      v.nome_cliente,
      v.estado,
      v.tem_nota_fiscal ? (v.numero_nota_fiscal || "Sim") : "Não",
      v.margem_percentual.toFixed(1)
    ])
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `historico_vendas_pag${pagina}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  // Impressão PDF (usa a janela de impressão nativa com CSS)
  const exportarPDF = () => {
    const rows = vendasFiltradas.map(v => `
      <tr>
        <td>${new Date(v.data_venda).toLocaleDateString("pt-BR")}</td>
        <td>${getNomeProduto(v.produto_id)}</td>
        <td>${v.quantidade}</td>
        <td>R$ ${v.preco_venda_unit.toFixed(2)}</td>
        <td>${getNomeMarketplace(v.marketplace_id)}</td>
        <td>${v.nome_cliente} (${v.estado})</td>
        <td>${v.tem_nota_fiscal ? (v.numero_nota_fiscal || "Sim") : "Não"}</td>
        <td>${v.margem_percentual.toFixed(1)}%</td>
      </tr>`).join("")

    const janela = window.open("", "_blank")
    janela.document.write(`
      <html><head><title>Histórico de Vendas — ERP Produção</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 24px; }
        h2 { margin-bottom: 4px; } p { color: #555; margin-bottom: 16px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1e293b; color: white; padding: 8px 10px; font-size: 10px; text-align: left; }
        td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <h2>ERP Produção — Histórico de Vendas</h2>
      <p>Gerado em ${new Date().toLocaleString("pt-BR")} · Página ${pagina} · ${vendasFiltradas.length} registro(s)</p>
      <table>
        <thead><tr>
          <th>Data</th><th>Produto</th><th>Qtd</th><th>Preço Un.</th>
          <th>Canal</th><th>Cliente / UF</th><th>NF-e</th><th>Margem</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      </body></html>`)
    janela.document.close()
    janela.print()
  }

  return (
    <div style={styles.card}>
      {/* Cabeçalho e filtros */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <h3 style={{ color: "white", margin: 0 }}>
          Histórico de Vendas
          <span style={{ color: "#475569", fontSize: "13px", fontWeight: 400, marginLeft: "10px" }}>
            {totalVendas} registro(s)
          </span>
        </h3>
      </div>

      {/* Barra de filtros */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px", padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
        <input
          placeholder="Buscar produto ou cliente..."
          style={{ ...styles.inputSm, minWidth: "200px", flex: 1 }}
          value={filtroTexto}
          onChange={e => setFiltroTexto(e.target.value)}
        />
        <input type="date" style={styles.inputSm} value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)} title="De" />
        <span style={{ color: "#475569", fontSize: "12px" }}>até</span>
        <input type="date" style={styles.inputSm} value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)} title="Até" />
        <button onClick={handleFiltrar} style={styles.btnSm("#3b82f6")}>🔍 Filtrar</button>
        <button onClick={handleClear} style={styles.btnSm("#475569")}>✕ Limpar</button>
        <button onClick={exportarCSV} style={styles.btnSm("#10b981")}>⬇ CSV</button>
        <button onClick={exportarPDF} style={styles.btnSm("#8b5cf6")}>🖨️ PDF</button>
      </div>

      {loading ? (
        <div style={{ color: "#475569", textAlign: "center", padding: "32px" }}>Carregando...</div>
      ) : vendasFiltradas.length === 0 ? (
        <div style={{ color: "#475569", textAlign: "center", padding: "32px" }}>Nenhuma venda encontrada.</div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }} ref={tabelaRef}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Data</th>
                  <th style={styles.th}>Produto</th>
                  <th style={styles.th}>Qtd</th>
                  <th style={styles.th}>Preço Un.</th>
                  <th style={styles.th}>Canal</th>
                  <th style={styles.th}>Cliente / UF</th>
                  <th style={styles.th}>NF-e</th>
                  <th style={styles.th}>Margem</th>
                </tr>
              </thead>
              <tbody>
                {vendasFiltradas.map(v => {
                  const isBad = v.margem_percentual < 50
                  const isWarn = v.margem_percentual >= 50 && v.margem_percentual < 70
                  return (
                    <tr key={v.id}>
                      <td style={styles.td}>{new Date(v.data_venda).toLocaleDateString("pt-BR")}</td>
                      <td style={styles.td}><strong>{getNomeProduto(v.produto_id)}</strong></td>
                      <td style={styles.td}>{v.quantidade}</td>
                      <td style={styles.td}>R$ {v.preco_venda_unit.toFixed(2)}</td>
                      <td style={styles.td}>{getNomeMarketplace(v.marketplace_id)}</td>
                      <td style={styles.td}>{v.nome_cliente} <span style={{ color: "#475569" }}>({v.estado})</span></td>
                      <td style={styles.td}>{v.tem_nota_fiscal ? `#${v.numero_nota_fiscal}` : <span style={{ color: "#64748b" }}>Não</span>}</td>
                      <td style={styles.td}>
                        <span style={{
                          background: isBad ? "rgba(239,68,68,0.15)" : (isWarn ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)"),
                          color: isBad ? "#fca5a5" : (isWarn ? "#fcd34d" : "#6ee7b7"),
                          padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 700,
                          border: `1px solid ${isBad ? "rgba(239,68,68,0.3)" : (isWarn ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)")}`,
                        }}>
                          {v.alerta_margem && "⚠️ "}{v.margem_percentual.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", marginTop: "8px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ color: "#475569", fontSize: "12px" }}>Página {pagina} de {totalPaginas} · {totalVendas} venda(s)</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button disabled={pagina <= 1} onClick={() => handlePage(pagina - 1)}
                style={{ ...styles.btnSm("#1e293b"), opacity: pagina <= 1 ? 0.4 : 1, border: "1px solid rgba(255,255,255,0.1)" }}>
                ← Anterior
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 1)
                .map((p, idx, arr) => (
                  <span key={p} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ color: "#475569" }}>…</span>}
                    <button onClick={() => handlePage(p)}
                      style={{ ...styles.btnSm(p === pagina ? "#3b82f6" : "#1e293b"), border: "1px solid rgba(255,255,255,0.1)", minWidth: "32px" }}>
                      {p}
                    </button>
                  </span>
                ))}
              <button disabled={pagina >= totalPaginas} onClick={() => handlePage(pagina + 1)}
                style={{ ...styles.btnSm("#1e293b"), opacity: pagina >= totalPaginas ? 0.4 : 1, border: "1px solid rgba(255,255,255,0.1)" }}>
                Próximo →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
