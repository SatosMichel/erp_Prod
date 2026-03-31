import { useState, useEffect } from "react"
import axios from "axios"
import { Activity, MapPin, Target, PackageOpen, Award, AlertCircle } from "lucide-react"

const token = () => localStorage.getItem("jwt_token")
const api = (url) => axios({ url: `/api${url}`, headers: { Authorization: `Bearer ${token()}` } })

const styles = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginBottom: "24px" },
  card: { background: "#0f1629", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "24px" },
  kpiTitle: { color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" },
  kpiValue: { color: "white", fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px" },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }
}

export default function KpiVendas() {
  const [resumo, setResumo] = useState(null)
  const [estados, setEstados] = useState([])
  const [marketplaces, setMarketplaces] = useState([])

  useEffect(() => { carregar() }, [])

  const carregar = async () => {
    try {
      const [rr, re, rm] = await Promise.all([
        api("/vendas/kpi/resumo"),
        api("/vendas/kpi/estados"),
        api("/vendas/kpi/marketplaces")
      ])
      setResumo(rr.data)
      setEstados(re.data)
      setMarketplaces(rm.data)
    } catch (e) { console.error(e) }
  }

  if (!resumo) return <div style={{color: "white"}}>Carregando indicadores...</div>

  const isMarginBad = resumo.margem_media < 50

  return (
    <div>
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.kpiTitle}><Activity size={14} style={{display:"inline", marginRight:4}}/> Faturamento Total</div>
          <div style={styles.kpiValue}>R$ {resumo.receita_total.toFixed(2)}</div>
        </div>
        <div style={{ ...styles.card, border: isMarginBad ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(16,185,129,0.3)" }}>
          <div style={styles.kpiTitle}>
            {isMarginBad ? <AlertCircle size={14} color="#f87171" style={{display:"inline", marginRight:4}}/> : <Target size={14} color="#34d399" style={{display:"inline", marginRight:4}}/>} 
            Margem de Lucro Média
          </div>
          <div style={{ ...styles.kpiValue, color: isMarginBad ? "#f87171" : "#34d399" }}>
            {resumo.margem_media.toFixed(1)}%
          </div>
        </div>
        <div style={styles.card}>
          <div style={styles.kpiTitle}><PackageOpen size={14} style={{display:"inline", marginRight:4}}/> Quantidade Vendas</div>
          <div style={styles.kpiValue}>{resumo.total_vendas} pts.</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
        
        {/* RANKING ESTADOS */}
        <div style={styles.card}>
          <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px", display: "flex", alignItems:"center", gap:"8px" }}>
            <MapPin size={18} color="#3b82f6"/> Ranking por Estado
          </h3>
          {estados.length === 0 ? <p style={{color:"#475569", fontSize:"13px"}}>Sem dados</p> : null}
          {estados.map((e, idx) => (
            <div key={e.estado} style={styles.row}>
              <div style={{ color: "white", fontSize: "14px", fontWeight: 600 }}>
                {idx + 1}º — {e.estado}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#3b82f6", fontWeight: 700, fontSize: "14px" }}>R$ {e.receita.toFixed(2)}</div>
                <div style={{ color: "#64748b", fontSize: "12px" }}>{e.quantidade} itens</div>
              </div>
            </div>
          ))}
        </div>

        {/* RANKING CANAIS E PRODUTOS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={styles.card}>
            <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px", display: "flex", alignItems:"center", gap:"8px" }}>
              <Target size={18} color="#8b5cf6"/> Receita por Canal (Marketplaces)
            </h3>
            {marketplaces.length === 0 ? <p style={{color:"#475569", fontSize:"13px"}}>Sem dados</p> : null}
            {marketplaces.map(m => (
              <div key={m.marketplace} style={styles.row}>
                <div style={{ color: "white", fontSize: "14px", fontWeight: 600 }}>{m.marketplace}</div>
                <div style={{ color: "#8b5cf6", fontWeight: 700, fontSize: "14px" }}>R$ {m.receita.toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div style={{...styles.card, paddingBottom: "12px"}}>
            <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px", display: "flex", alignItems:"center", gap:"8px" }}>
              <Award size={18} color="#f59e0b"/> Produtos Mais Vendidos
            </h3>
            {resumo.ranking_produtos.length === 0 ? <p style={{color:"#475569", fontSize:"13px", paddingBottom:"12px"}}>Sem dados</p> : null}
            {resumo.ranking_produtos.map(p => (
              <div key={p.produto} style={styles.row}>
                <div style={{ color: "white", fontSize: "13px" }}>{p.produto}</div>
                <div style={{ color: "#f59e0b", fontWeight: 600, fontSize: "13px" }}>{p.quantidade} un.</div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  )
}
