import { useState, useEffect } from "react"
import axios from "axios"

const token = () => localStorage.getItem("jwt_token")
const api = (url) => axios({ url: `/api${url}`, headers: { Authorization: `Bearer ${token()}` } })

const styles = {
  card: { background: "#0f1629", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "24px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { color: "#475569", fontSize: "11px", textTransform: "uppercase", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  td: { color: "#cbd5e1", fontSize: "13px", padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }
}

export default function HistoricoVendas() {
  const [vendas, setVendas] = useState([])
  const [produtos, setProdutos] = useState([])
  const [marketplaces, setMarketplaces] = useState([])

  useEffect(() => { carregar() }, [])

  const carregar = async () => {
    try {
      const [rv, rp, rm] = await Promise.all([api("/vendas/"), api("/produtos/"), api("/marketplaces/")])
      setVendas(rv.data.reverse())
      setProdutos(rp.data)
      setMarketplaces(rm.data)
    } catch (e) { console.error(e) }
  }

  const getNomeProduto = id => produtos.find(p => p.id === id)?.nome || id
  const getNomeMarketplace = id => marketplaces.find(m => m.id === id)?.nome || "Venda Direta"

  return (
    <div style={styles.card}>
      <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px" }}>Histórico Geral de Vendas</h3>
      {vendas.length === 0 ? (
        <div style={{ color: "#475569", textAlign: "center", padding: "32px" }}>Nenhuma venda registrada ainda.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
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
              {vendas.map(v => {
                const isBad = v.margem_percentual < 50
                const isWarn = v.margem_percentual >= 50 && v.margem_percentual < 70
                return (
                  <tr key={v.id}>
                    <td style={styles.td}>{new Date(v.data_venda).toLocaleDateString("pt-BR")}</td>
                    <td style={styles.td}><strong>{getNomeProduto(v.produto_id)}</strong></td>
                    <td style={styles.td}>{v.quantidade}</td>
                    <td style={styles.td}>R$ {v.preco_venda_unit.toFixed(2)}</td>
                    <td style={styles.td}>{getNomeMarketplace(v.marketplace_id)}</td>
                    <td style={styles.td}>{v.nome_cliente} <span style={{color:"#475569"}}>({v.estado})</span></td>
                    <td style={styles.td}>{v.tem_nota_fiscal ? `#${v.numero_nota_fiscal}` : <span style={{color:"#64748b"}}>Não</span>}</td>
                    <td style={styles.td}>
                      <span style={{
                        background: isBad ? "rgba(239,68,68,0.15)" : (isWarn ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)"),
                        color: isBad ? "#fca5a5" : (isWarn ? "#fcd34d" : "#6ee7b7"),
                        padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 700,
                        border: `1px solid ${isBad ? "rgba(239,68,68,0.3)" : (isWarn ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)")}`
                      }}>
                        {v.alerta_margem && "⚠️ "} {v.margem_percentual.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
