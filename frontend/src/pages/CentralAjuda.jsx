import React from "react";
import { Link } from "react-router-dom";
import { Package, Building2, ShoppingCart, Calculator, ArrowRight, Lightbulb } from "lucide-react";

const styles = {
  page: { fontFamily: "'Inter', system-ui, sans-serif", color: "white" },
  title: { fontSize: "28px", fontWeight: 800, marginBottom: "8px" },
  subtitle: { color: "#94a3b8", fontSize: "15px", marginBottom: "32px", maxWidth: "600px" },
  card: {
    background: "#0f1629", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "14px", padding: "28px", marginBottom: "24px"
  },
  boxStyle: {
    background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column",
    alignItems: "center", textAlign: "center", gap: "12px", flex: 1, minWidth: "200px"
  },
  iconWrapper: (color) => ({
    width: "48px", height: "48px", borderRadius: "12px",
    background: `${color}20`, color: color,
    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "4px"
  }),
  boxTitle: { fontSize: "16px", fontWeight: 700, margin: 0 },
  boxDesc: { fontSize: "13px", color: "#94a3b8", margin: 0, lineHeight: 1.5 },
  arrow: { color: "#475569", flexShrink: 0, marginTop: "20px" },
  tipCard: {
    background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.1))",
    border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px", padding: "20px",
    display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: "16px"
  }
};

export default function CentralAjuda() {
  return (
    <div style={styles.page}>
      <div style={styles.title}>Central de Ajuda</div>
      <div style={styles.subtitle}>
        Entenda o fluxo do sistema ERP e elimine rapidamente suas dúvidas para extrair o máximo de performance.
      </div>

      <div style={styles.card}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
          🗺️ Como o sistema funciona? Passo a Passo
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          
          {/* Box 1: Compras e Matérias-Primas */}
          <div style={styles.boxStyle}>
            <div style={styles.iconWrapper("#f59e0b")}>
              <Package size={24} />
            </div>
            <h3 style={styles.boxTitle}>1. Comprar Insumos</h3>
            <p style={styles.boxDesc}>
              A primeira coisa a se fazer no sistema é <b>LANÇAR UMA ENTRADA DE INSUMO</b>. É aqui que você informa o que comprou, quanto pagou e carrega o seu estoque das matérias-primas bases.<br/><br/>
              <b>Dica:</b> Registre quilos usando casas decimais (Ex: 0.5 para 500g).
            </p>
            <Link to="/dashboard/estoque/entrada" style={{ color: "#f59e0b", fontSize: "13px", textDecoration: "none", fontWeight: 600, marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px", width: "100%" }}>
              Lançar Compra
            </Link>
          </div>

          {/* Box 2: Ficha Técnica e Cadastro de Produto */}
          <div style={styles.boxStyle}>
            <div style={styles.iconWrapper("#8b5cf6")}>
              <Calculator size={24} />
            </div>
            <h3 style={styles.boxTitle}>2. Ficha Técnica</h3>
            <p style={styles.boxDesc}>
              Com os insumos em estoque, vá até o <b>CADASTRAR PRODUTO</b>. Crie o seu "Produto Final" e vincule quais insumos (e qual quantidade) ele gasta em sua receita para fabricar 1 unidade.<br/><br/> Configure também o banco de horas!
            </p>
            <Link to="/dashboard/estoque/cadastro-produto" style={{ color: "#8b5cf6", fontSize: "13px", textDecoration: "none", fontWeight: 600, marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px", width: "100%" }}>
              Cadastrar Produto e Ficha
            </Link>
          </div>

          {/* Box 3: Produção */}
          <div style={styles.boxStyle}>
            <div style={styles.iconWrapper("#3b82f6")}>
              <Building2 size={24} />
            </div>
            <h3 style={styles.boxTitle}>3. Linha de Produção</h3>
            <p style={styles.boxDesc}>
              Vá na aba <b>PRODUÇÃO</b> para gerar Ordens de Produção. O sistema baterá o seu alvo e a sua Ficha Técnica, descontando os seus insumos automaticamente e transformando-os em estoque pro Produto Final!
            </p>
            <Link to="/dashboard/producao" style={{ color: "#3b82f6", fontSize: "13px", textDecoration: "none", fontWeight: 600, marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px", width: "100%" }}>
              Ir para Produção
            </Link>
          </div>

          {/* Box 4: Vendas & Finanças */}
          <div style={styles.boxStyle}>
            <div style={styles.iconWrapper("#10b981")}>
              <ShoppingCart size={24} />
            </div>
            <h3 style={styles.boxTitle}>4. Vendas & PDV</h3>
            <p style={styles.boxDesc}>
              Esvazie seu estoque rentabilizando! Seus vendedores lançam as vendas do "Produto Final". Isso alimentará tudo: As Comissões, seu Histórico de faturamento e subtrai o Estoque Final.
            </p>
            <Link to="/dashboard/vendas" style={{ color: "#10b981", fontSize: "13px", textDecoration: "none", fontWeight: 600, marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px", width: "100%" }}>
              Lançar Venda Final
            </Link>
          </div>

        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div style={styles.card}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>🔥 Dicas de Uso</h2>
          
          <div style={styles.tipCard}>
            <Lightbulb size={24} color="#60a5fa" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: "0 0 4px 0", fontWeight: 700, color: "#e2e8f0" }}>Sempre converta para a mesma Unidade</h4>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px", lineHeight: 1.5 }}>
                Se você comprar um carretel de 1KG por R$100,00 e sua receita consome apenas 30 gramas, na aba de produção você deve inserir <b>0.03</b> (isso representa os 30 gramas).
              </p>
            </div>
          </div>

          <div style={styles.tipCard}>
            <Lightbulb size={24} color="#60a5fa" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: "0 0 4px 0", fontWeight: 700, color: "#e2e8f0" }}>Use Insumos "UND" para Caixas/Embalagens</h4>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px", lineHeight: 1.5 }}>
                Nem tudo pesa em quilos. Uma caixa de envio ou um adesivo não será fracionado, então na hora de registrar a entrada, selecione "UND" e use números inteiros (1, 2, 10 pacotes).
              </p>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>❓ Dúvidas Frequentes</h2>
          
          <div style={{ paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "12px" }}>
            <h4 style={{ margin: "0 0 4px 0", fontWeight: 600, fontSize: "14px", color: "#cbd5e1" }}>Como apago um lançamento incorreto?</h4>
            <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>Apenas quem é o <b>Administrador</b> da conta possui privilégios de exclusão. Se o seu perfil não for Admin, solicite ao dono da conta.</p>
          </div>

          <div style={{ paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "12px" }}>
            <h4 style={{ margin: "0 0 4px 0", fontWeight: 600, fontSize: "14px", color: "#cbd5e1" }}>O Dashboard financeiro não está atualizando</h4>
            <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>O painel calcula os lucros baseado no status "Pago". Verifique se a sua venda está com status "Pendente" dentro de Contas a Receber.</p>
          </div>

          <div style={{ paddingBottom: "12px" }}>
            <h4 style={{ margin: "0 0 4px 0", fontWeight: 600, fontSize: "14px", color: "#cbd5e1" }}>Precisa de Suporte Técnico?</h4>
            <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>Nossa equipe de suporte monitora a estabilidade do sistema. Caso enfrente bugs graves (telas em branco, não salvar), limpe o cache do do navegador ou tente atualizar a página primeiro.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
