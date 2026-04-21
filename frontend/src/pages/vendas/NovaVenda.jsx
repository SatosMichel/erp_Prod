import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { AlertCircle, Target, Package, DollarSign, User, Plus, Trash2 } from "lucide-react"

const token = () => localStorage.getItem("jwt_token")
const api = (url, opts = {}) => axios({ url: `/api${url}`, ...opts, headers: { Authorization: `Bearer ${token()}`, ...opts.headers } })

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"]

const styles = {
  card: { background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "14px", padding: "20px", marginBottom: "20px" },
  sectionTitle: { display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)", fontSize: "15px", fontWeight: 700, marginBottom: "16px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" },
  label: { color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "6px" },
  input: { width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "10px 12px", color: "var(--text-primary)", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  btn: (color = "#3b82f6") => ({ background: color, color: "white", border: "none", borderRadius: "8px", padding: "12px 20px", fontSize: "14px", fontWeight: 600, cursor: "pointer", width: "100%", transition: "all 0.2s", fontFamily: "inherit" }),
}

export default function NovaVenda() {
  const navigate = useNavigate()
  
  const [itens, setItens] = useState([{ produto_id: "", quantidade: 1, preco_venda_unit: "" }])
  const [formGlob, setFormGlob] = useState({
    marketplace_id: "", frete: "", tem_nota_fiscal: false, numero_nota_fiscal: "",
    nome_cliente: "", endereco: "", cidade: "", estado: "", cep: "", observacao: ""
  })
  
  const [metadata, setMetadata] = useState({ produtos: [], marketplaces: [], custosBase: {} })
  const [margemRealtime, setMargemRealtime] = useState({ pct: 0, lucro: 0, risco: false, receita: 0, taxaMkp: 0, custoInsumoTotal: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rp, rm, rc] = await Promise.all([ 
          api("/produtos/"), 
          api("/marketplaces/"),
          api("/vendas/custos_base")
        ])
        setMetadata({ 
          produtos: rp.data.filter(p => p.ativo), 
          marketplaces: rm.data.filter(m => m.ativo),
          custosBase: rc.data || {}
        })
      } catch (e) { console.error("Erro ao carregar dependencias") }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const calcularSimulacao = () => {
      const vFrete = parseFloat(formGlob.frete) || 0
      
      let receitaTotal = 0
      let insumoTotal = 0
      
      itens.forEach(item => {
        const qtdItem = parseInt(item.quantidade) || 0
        receitaTotal += (parseFloat(item.preco_venda_unit) || 0) * qtdItem
        insumoTotal += (metadata.custosBase[item.produto_id] || 0) * qtdItem
      })

      let taxaAmt = 0
      if (formGlob.marketplace_id) {
        const mkp = metadata.marketplaces.find(m => m.id.toString() === formGlob.marketplace_id.toString())
        if (mkp) taxaAmt = receitaTotal * (mkp.taxa_percentual / 100)
      }

      const baseCustos = taxaAmt + vFrete + insumoTotal
      const lucroSobrado = receitaTotal - baseCustos
      const pct = receitaTotal > 0 ? (lucroSobrado / receitaTotal) * 100 : 0
      
      setMargemRealtime({ pct, lucro: lucroSobrado, risco: pct < 50, receita: receitaTotal, taxaMkp: taxaAmt, custoInsumoTotal: insumoTotal })
    }
    calcularSimulacao()
  }, [itens, formGlob.marketplace_id, formGlob.frete, metadata.marketplaces, metadata.custosBase])

  const handleItemChange = (index, field, value) => {
    const newItens = [...itens]
    newItens[index][field] = value
    setItens(newItens)
  }
  
  const addItem = () => setItens([...itens, { produto_id: "", quantidade: 1, preco_venda_unit: "" }])
  const removeItem = (index) => {
    if (itens.length > 1) {
      const newItens = itens.filter((_, i) => i !== index)
      setItens(newItens)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      for (const item of itens) {
        const pSel = metadata.produtos.find(p => p.id.toString() === item.produto_id)
        if (pSel && pSel.quantidade_estoque < item.quantidade) {
          alert(`Estoque insuficiente do produto: ${pSel.nome}. Temos apenas ${pSel.quantidade_estoque}.`)
          setLoading(false)
          return
        }
      }

      const promises = itens.map((item, index) => {
        const payload = {
          produto_id: parseInt(item.produto_id),
          quantidade: parseInt(item.quantidade),
          preco_venda_unit: parseFloat(item.preco_venda_unit),
          marketplace_id: formGlob.marketplace_id ? parseInt(formGlob.marketplace_id) : null,
          frete: index === 0 ? (parseFloat(formGlob.frete) || 0) : 0,
          tem_nota_fiscal: formGlob.tem_nota_fiscal,
          numero_nota_fiscal: formGlob.numero_nota_fiscal || null,
          nome_cliente: formGlob.nome_cliente, endereco: formGlob.endereco, cidade: formGlob.cidade, estado: formGlob.estado, cep: formGlob.cep
        }
        return api("/vendas/", { method: "POST", data: payload })
      })
      
      await Promise.all(promises)
      alert("Sucesso! Venda(s) Registrada(s).")
      navigate("/dashboard/vendas/historico")
    } catch (err) {
      alert(err.response?.data?.detail || "Erro ao gerar venda")
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Layout responsivo: 2 colunas no desktop, 1 no mobile */}
      <div className="nova-venda-grid">
        {/* COLUNA ESQUERDA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* CARRINHO DE PRODUTOS */}
          <div style={styles.card}>
            <div style={styles.sectionTitle}><Package size={18} color="#3b82f6"/> Produtos da Venda</div>
            
            {itens.map((item, idx) => {
              const pSel = metadata.produtos.find(p => p.id.toString() === item.produto_id)
              return (
                <div key={idx} style={{
                  display: "flex", flexDirection: "column", gap: "12px",
                  marginBottom: "16px", paddingBottom: "16px",
                  borderBottom: idx < itens.length - 1 ? "1px solid var(--border-subtle)" : "none"
                }}>
                  <div>
                    <label style={styles.label}>Produto Final *</label>
                    <select style={styles.input} required value={item.produto_id} onChange={e => handleItemChange(idx, "produto_id", e.target.value)}>
                      <option value="">Selecione...</option>
                      {metadata.produtos.map(p => (
                        <option key={p.id} value={p.id}>{p.nome} (Estoque: {p.quantidade_estoque})</option>
                      ))}
                    </select>
                    {pSel && pSel.quantidade_estoque <= 0 && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>Sem Estoque!</div>}
                  </div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 120px" }}>
                      <label style={styles.label}>Preço Un. (R$) *</label>
                      <input style={styles.input} required type="number" step="0.01" value={item.preco_venda_unit} onChange={e => handleItemChange(idx, "preco_venda_unit", e.target.value)} placeholder="0.00" />
                    </div>
                    <div style={{ flex: "0 0 90px" }}>
                      <label style={styles.label}>Qtd *</label>
                      <input style={styles.input} required type="number" min="1" value={item.quantidade} onChange={e => handleItemChange(idx, "quantidade", e.target.value)} placeholder="1" />
                    </div>
                    {itens.length > 1 && (
                      <div style={{ display: "flex", alignItems: "flex-end" }}>
                        <button type="button" onClick={() => removeItem(idx)} style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: "8px", padding: "10px", color: "#ef4444", cursor: "pointer" }} title="Remover item">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            
            <button type="button" onClick={addItem} style={{ ...styles.btn("rgba(59,130,246,0.12)"), color: "#60a5fa", border: "1px dashed #3b82f6", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <Plus size={16} /> Adicionar Produto
            </button>
          </div>

          {/* TAXAS E MKP */}
          <div style={styles.card}>
            <div style={styles.sectionTitle}><DollarSign size={18} color="#10b981"/> Taxas e Marketplaces</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={styles.label}>Canal de Venda</label>
                <select style={styles.input} value={formGlob.marketplace_id} onChange={e => setFormGlob({...formGlob, marketplace_id: e.target.value})}>
                  <option value="">Venda Direta / Balcão</option>
                  {metadata.marketplaces.map(m => ( <option key={m.id} value={m.id}>{m.nome} — {m.taxa_percentual.toFixed(1)}% taxa</option> ))}
                </select>
              </div>
              <div>
                <label style={styles.label}>Custo de Frete Absorvido (R$)</label>
                <input style={styles.input} type="number" step="0.01" value={formGlob.frete} onChange={e => setFormGlob({...formGlob, frete: e.target.value})} placeholder="0 se cobrou do cliente" />
              </div>
            </div>
          </div>

          {/* CLIENTE */}
          <div style={styles.card}>
            <div style={styles.sectionTitle}><User size={18} color="#8b5cf6"/> Dados do Cliente</div>
            
            <div style={{ marginBottom: "16px", background: "var(--bg-elevated)", padding: "14px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>
                <input type="checkbox" checked={formGlob.tem_nota_fiscal} onChange={e => setFormGlob({...formGlob, tem_nota_fiscal: e.target.checked})} />
                Pedido conta com Emissão de NF-e?
              </label>
              {formGlob.tem_nota_fiscal && (
                <div style={{ marginTop: "12px" }}>
                   <label style={styles.label}>Número da NF Emitida</label>
                   <input style={styles.input} value={formGlob.numero_nota_fiscal} onChange={e => setFormGlob({...formGlob, numero_nota_fiscal: e.target.value})} placeholder="Série e Numeral" />
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={styles.label}>Nome Completo / CPF ou Razão Social *</label>
                <input style={styles.input} required value={formGlob.nome_cliente} onChange={e => setFormGlob({...formGlob, nome_cliente: e.target.value})} placeholder="Elias da Silva..." />
              </div>
              <div>
                <label style={styles.label}>Endereço p/ Entrega *</label>
                <input style={styles.input} required value={formGlob.endereco} onChange={e => setFormGlob({...formGlob, endereco: e.target.value})} placeholder="Rua Central, 120" />
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 140px" }}>
                  <label style={styles.label}>Cidade *</label>
                  <input style={styles.input} required value={formGlob.cidade} onChange={e => setFormGlob({...formGlob, cidade: e.target.value})} placeholder="São Paulo" />
                </div>
                <div style={{ flex: "0 0 100px" }}>
                  <label style={styles.label}>UF *</label>
                  <select style={styles.input} required value={formGlob.estado} onChange={e => setFormGlob({...formGlob, estado: e.target.value})}>
                    <option value="">...</option>
                    {UFS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={styles.label}>CEP *</label>
                <input style={styles.input} required value={formGlob.cep} onChange={e => setFormGlob({...formGlob, cep: e.target.value})} placeholder="00000-000" />
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: PAINEL FINANCEIRO */}
        <div>
          <div style={{ position: "sticky", top: "20px" }}>
            <div style={{ ...styles.card, border: margemRealtime.risco ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(16,185,129,0.3)" }}>
              <h3 style={{ color: "var(--text-primary)", marginTop: 0, marginBottom: "8px", fontWeight: 800, fontSize: "15px" }}>Simulação Financeira</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "18px" }}>Apuração Custo de Matéria Prima e Encargos.</p>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", borderBottom: "1px dashed var(--border-default)", paddingBottom: "10px", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Receita Total:</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "13px" }}>R$ {margemRealtime.receita.toFixed(2)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", flexWrap: "wrap", gap: "4px" }}>
                <span style={{ color: "#fca5a5", fontSize: "13px" }}>Custo Fabricação:</span>
                <span style={{ color: "#fca5a5", fontWeight: 600, fontSize: "13px" }}>- R$ {margemRealtime.custoInsumoTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", flexWrap: "wrap", gap: "4px" }}>
                <span style={{ color: "#fca5a5", fontSize: "13px" }}>Rateio / Marketplace:</span>
                <span style={{ color: "#fca5a5", fontWeight: 600, fontSize: "13px" }}>- R$ {margemRealtime.taxaMkp.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "18px", borderBottom: "1px dashed var(--border-default)", paddingBottom: "10px", flexWrap: "wrap", gap: "4px" }}>
                <span style={{ color: "#fca5a5", fontSize: "13px" }}>Custo de Frete:</span>
                <span style={{ color: "#fca5a5", fontWeight: 600, fontSize: "13px" }}>- R$ {(parseFloat(formGlob.frete) || 0).toFixed(2)}</span>
              </div>

              {margemRealtime.risco && (
                <div style={{ display: "flex", gap: "8px", padding: "10px", background: "rgba(239,68,68,0.12)", borderRadius: "8px", marginBottom: "16px" }}>
                   <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0 }}/>
                   <span style={{ color: "#fca5a5", fontSize: "12px", fontWeight: 600, lineHeight: 1.4 }}>
                     ALERTA: A margem tributada está abaixo de 50%.
                   </span>
                </div>
              )}

              <div style={{ background: margemRealtime.risco ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", padding: "16px", borderRadius: "12px", textAlign: "center", marginBottom: "20px" }}>
                <div style={{ color: margemRealtime.risco ? "#fca5a5" : "#6ee7b7", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Margem Operacional Prévia</div>
                <div style={{ color: margemRealtime.risco ? "#f87171" : "#34d399", fontSize: "32px", fontWeight: 900, letterSpacing: "-1px" }}>
                  {margemRealtime.pct.toFixed(1)}%
                </div>
                <div style={{ color: margemRealtime.risco ? "#fca5a5" : "#6ee7b7", fontSize: "13px", fontWeight: 500, marginTop: "4px" }}>
                  R$ {margemRealtime.lucro.toFixed(2)} Excedente
                </div>
              </div>

              <button type="submit" style={{...styles.btn(margemRealtime.risco ? "#ef4444" : "#10b981"), padding: "14px", fontSize: "15px", opacity: loading ? 0.7 : 1}} disabled={loading}>
                {loading ? "Registrando..." : "✅ Salvar Venda(s)"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS para o grid responsivo */}
      <style>{`
        .nova-venda-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .nova-venda-grid {
            grid-template-columns: 2fr 1fr;
          }
        }
      `}</style>
    </form>
  )
}
