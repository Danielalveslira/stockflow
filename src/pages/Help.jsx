import { useState } from 'react'

/* ── Dados do FAQ ─────────────────────────────── */
const SECTIONS = [
  {
    id: 'inicio',
    icon: '🚀',
    title: 'Primeiros passos',
    color: '#00d68f',
    items: [
      {
        q: 'Qual é o fluxo correto para começar a usar o sistema?',
        a: `Siga essa ordem para configurar tudo certo:

1. Cadastre seus **fornecedores** (menu Fornecedores)
2. Cadastre seus **produtos** no Estoque — com código de barras, custo e preço de venda
3. Configure sua **chave PIX** em Ajustes
4. Crie os **usuários** da equipe (menu Usuários)
5. Registre suas **contas a pagar** recorrentes (aluguel, energia...)

Pronto! O sistema já está preparado para o dia a dia.`,
        tip: 'Dica: o primeiro usuário criado no Supabase vira administrador automaticamente.',
      },
      {
        q: 'Como o sistema salva os dados? Posso perder alguma coisa?',
        a: `Todos os dados são salvos automaticamente em tempo real no **Supabase** (banco de dados PostgreSQL na nuvem). Cada ação — cadastrar produto, finalizar venda, receber compra — é gravada imediatamente.

**Sobre o plano gratuito:** o projeto pausa automaticamente após 1 semana sem uso. Ao abrir o sistema, ele "acorda" em até 30 segundos. Os dados nunca são apagados.

**Recomendação:** exporte relatórios em Excel semanalmente como backup local.`,
      },
    ],
  },
  {
    id: 'caixa',
    icon: '🛒',
    title: 'Caixa e vendas',
    color: '#5b8af0',
    items: [
      {
        q: 'Como funciona o leitor de código de barras?',
        a: `O campo do Caixa aceita **3 formas** de leitura:

**Leitor USB ou Bluetooth** → plug and play. O leitor digita o código rapidamente e pressiona Enter automaticamente. O sistema detecta essa velocidade e adiciona o produto ao carrinho.

**Câmera** → clique no ícone de câmera ao lado do campo. Suportado no Chrome e Edge. Funciona com o celular apontado para a embalagem.

**Digitação manual** → digite o código no campo e pressione Enter.`,
        tip: 'Dica: o campo de código de barras tem foco automático ao abrir o Caixa. Pode sair escaneando imediatamente.',
      },
      {
        q: 'Como funciona o PIX com QR Code automático?',
        a: `Ao selecionar **PIX** como forma de pagamento e clicar em Finalizar venda:

1. O sistema gera o QR Code com o valor exato (já com desconto, se houver)
2. O cliente escaneia com qualquer app bancário
3. Você confirma o recebimento no seu app do banco
4. Clica em **"Confirmar pagamento recebido"**

O QR Code segue o padrão **EMV BR Code** do Banco Central — funciona em todos os bancos brasileiros.

⚠️ Configure sua chave PIX em **Ajustes** antes de usar.`,
        tip: 'Segurança: o QR Code é gerado localmente no seu dispositivo. A chave PIX não sai do sistema.',
      },
      {
        q: 'Como fazer uma venda no fiado?',
        a: `Na tela do Caixa:

1. Adicione os produtos normalmente ao carrinho
2. Ative o toggle **"Venda no fiado"** (aparece acima dos botões de pagamento)
3. Selecione o cliente na lista
4. Clique em **Finalizar venda**

O estoque é descontado automaticamente. A dívida aparece na página **Clientes** vinculada ao cliente selecionado.

Quando o cliente pagar, acesse Clientes → clique no cliente → clique em **"Receber"** ao lado da dívida.`,
        tip: 'O cliente precisa estar cadastrado antes para aparecer na lista. Cadastre em Clientes → Novo cliente.',
      },
      {
        q: 'Quais atalhos de teclado existem no Caixa?',
        a: null,
        table: [
          ['Tecla', 'Ação'],
          ['F2', 'Finalizar venda'],
          ['Esc', 'Limpar o carrinho inteiro'],
          ['Delete', 'Remover item selecionado (clique no item primeiro)'],
          ['Enter (no campo)', 'Confirmar código de barras digitado manualmente'],
        ],
      },
    ],
  },
  {
    id: 'estoque',
    icon: '📦',
    title: 'Estoque inteligente',
    color: '#f5a623',
    items: [
      {
        q: 'O que é a Classificação ABC e como usar?',
        a: `É uma técnica baseada no **princípio de Pareto (80/20)** que divide seus produtos em 3 grupos pelo valor que representam no estoque:

**Classe A** → produtos que representam ~80% do valor total. São os mais importantes — nunca deixe faltar. Negocie preços melhores com o fornecedor desses itens.

**Classe B** → representam ~15% do valor. Atenção moderada. Mantenha estoque mínimo controlado.

**Classe C** → representam ~5% do valor. São muitos produtos mas pouco dinheiro. Se um produto Classe C ficar parado há semanas, considere fazer promoção ou parar de vender.

💡 **Com poucos produtos cadastrados** a classificação pode parecer distorcida. Ela fica mais precisa e útil à medida que você cadastra o estoque completo.`,
        tip: 'Use o filtro "Classe C" na tabela do Estoque para ver rapidamente quais produtos têm baixo giro.',
      },
      {
        q: 'O que é o Ponto de Reposição e como ele é calculado?',
        a: `O **ponto de reposição** é o momento certo de fazer um novo pedido para não ficar sem estoque antes da mercadoria chegar.

**Cálculo:** Consumo médio diário × Prazo do fornecedor + Estoque mínimo

**Exemplo prático:**
- Arroz: vende ~5 unidades por dia
- Fornecedor demora 3 dias para entregar
- Estoque mínimo: 10 unidades
- **Ponto de reposição: 5 × 3 + 10 = 25 unidades**

Quando o estoque chegar em 25 unidades, o sistema exibe o alerta **"Pedir!"** em laranja.

Configure o **Prazo do fornecedor** e o **Estoque mínimo** ao cadastrar cada produto.`,
      },
      {
        q: 'O que é o Custo Médio Ponderado?',
        a: `É a forma que o sistema usa para atualizar o custo de um produto quando você compra a um preço diferente do atual.

**Por que isso importa?** Se você comprou 10 unidades de Arroz a R$5 e depois comprou mais 10 a R$6, qual é o custo real? O sistema calcula:

**(10 × R$5 + 10 × R$6) ÷ 20 = R$5,50**

O custo do produto é atualizado para **R$5,50**, mantendo a margem de lucro sempre precisa nos relatórios.

Isso acontece automaticamente quando você marca um pedido de compra como **"Recebido"**.`,
        tip: 'Se o estoque estiver zerado quando a compra chegar, o sistema usa o custo da nova remessa diretamente.',
      },
      {
        q: 'Como funcionam os alertas de validade?',
        a: `Ao cadastrar um produto com **Data de validade**, o sistema monitora automaticamente e exibe alertas:

- **Verde** → mais de 30 dias para vencer
- **Amarelo** → vence nos próximos 30 dias
- **Vermelho** → vence em até 7 dias ou já venceu

Os alertas aparecem no topo da página de **Estoque** e na tabela de produtos. No **Dashboard** também aparece um resumo dos produtos críticos.`,
      },
      {
        q: 'Como funciona a Previsão de Demanda?',
        a: `O sistema analisa o histórico de vendas para sugerir quanto pedir na próxima compra.

Os cards de **"Sugestões de reposição"** aparecem no topo do Estoque quando um produto está com estoque baixo. A sugestão considera:

- Quantidade mínima configurada no produto
- Quantidade atual em estoque
- Crescimento ou queda das vendas recentes

É uma **estimativa inteligente** — o dono sempre tem a palavra final sobre quanto pedir.`,
      },
    ],
  },
  {
    id: 'compras',
    icon: '🚚',
    title: 'Compras e fornecedores',
    color: '#a78bfa',
    items: [
      {
        q: 'Qual é o fluxo correto de uma compra?',
        a: null,
        steps: [
          ['Cadastre o fornecedor', 'Menu Fornecedores → Novo fornecedor. Guarde o contato, CNPJ e observações de prazo de entrega.'],
          ['Crie o pedido', 'Menu Compras → Novo pedido. Selecione o fornecedor, data e os produtos — sempre selecionando pelo dropdown para vincular ao produto do estoque.'],
          ['Aguarde a entrega', 'O pedido fica com status "Aguardando". Você pode cancelar se necessário.'],
          ['Receba a mercadoria', 'Quando chegar, abra o pedido e clique "Marcar como recebido".'],
          ['Tudo automático', 'O estoque sobe + o custo médio é recalculado + a despesa é registrada no Fluxo de Caixa.'],
        ],
      },
      {
        q: 'Devo cadastrar o produto antes ou criar a compra antes?',
        a: `**Cadastre o produto primeiro.** O fluxo correto é:

1. Cadastra o produto no **Estoque** com preço de venda e código de barras
2. Nas compras futuras, seleciona esse produto pelo dropdown
3. O sistema cuida de atualizar o estoque e o custo médio automaticamente

O campo "Ou digitar nome..." no pedido de compra existe apenas para produtos que você **não vende no caixa** (sacolas, material de limpeza da loja, etc). Para esses, o estoque não é atualizado automaticamente.`,
        tip: 'Regra de ouro: produto que vai ser vendido no caixa → sempre cadastrar no Estoque primeiro.',
      },
    ],
  },
  {
    id: 'financeiro',
    icon: '💰',
    title: 'Financeiro',
    color: '#00d68f',
    items: [
      {
        q: 'Como interpretar o DRE Gerencial nos Relatórios?',
        a: `O **DRE (Demonstração do Resultado)** mostra seu lucro real do período:

**Receita Bruta de Vendas**
→ tudo que entrou pelas vendas no caixa

**(-) Custo das Mercadorias Vendidas (CMV)**
→ estimado pela margem média dos produtos cadastrados

**= Lucro Bruto**
→ quanto sobrou depois de descontar o custo dos produtos

**(-) Despesas Operacionais**
→ contas pagas (aluguel, energia, etc.) + outras despesas lançadas

**= Resultado Operacional**
→ seu lucro ou prejuízo real do período

O **Fiado em aberto** aparece separado — é dinheiro que você já vendeu mas ainda não recebeu.`,
        tip: 'O DRE fica mais preciso quanto mais detalhadas forem as despesas cadastradas em Contas a Pagar.',
      },
      {
        q: 'Como funcionam as Contas a Pagar?',
        a: `Cadastre todas as suas despesas fixas e variáveis em **Contas a Pagar**:

- **Aluguel, energia, água, internet** → use recorrência "Mensal"
- **Boletos de fornecedores** → contas únicas com a data de vencimento

O sistema monitora os vencimentos e exibe alertas:
- 🔴 Vencida ou vence hoje
- 🟡 Vence em até 7 dias
- ⚪ Vence em mais de 7 dias

Ao clicar **"Pagar"**, a conta é marcada como paga e a despesa é **lançada automaticamente no Fluxo de Caixa**. Não precisa registrar duas vezes.`,
        tip: 'Configure as contas mensais com recorrência "Mensal" para não precisar cadastrar todo mês.',
      },
      {
        q: 'O que acontece no sistema quando recebo um fiado?',
        a: `Quando você clica em "Receber" no perfil do cliente, o sistema:

1. **Marca a dívida como paga** no cadastro do cliente
2. **Registra uma receita** no Fluxo de Caixa com a descrição "Fiado recebido — [Nome do cliente]"
3. **Atualiza o Dashboard** — saldo e receitas sobem em tempo real
4. **Aparece nos Relatórios** — DRE e gráficos de receita

O valor fica visível em todos os lugares que mostram receitas do período.`,
      },
    ],
  },
  {
    id: 'usuarios',
    icon: '👥',
    title: 'Usuários e acessos',
    color: '#ff5f5f',
    items: [
      {
        q: 'Como criar um funcionário no sistema?',
        a: `Apenas o **administrador** pode criar usuários. Vá em **Usuários → Novo usuário**:

1. Preencha nome, e-mail e senha inicial
2. O funcionário começa com acesso apenas ao **Caixa**
3. Use os toggles para liberar outras telas conforme necessário

O funcionário pode acessar o sistema pelo navegador com o e-mail e senha definidos.`,
        tip: 'Para funcionários de caixa, deixe apenas o acesso "Caixa" liberado. Isso evita que vejam informações financeiras.',
      },
      {
        q: 'Qual a diferença entre Administrador e Operador?',
        a: null,
        table: [
          ['Permissão', 'Administrador', 'Operador'],
          ['Caixa', '✅', '✅ (padrão)'],
          ['Dashboard', '✅', '⚙️ configurável'],
          ['Estoque', '✅', '⚙️ configurável'],
          ['Fluxo de Caixa', '✅', '⚙️ configurável'],
          ['Compras', '✅', '⚙️ configurável'],
          ['Relatórios', '✅', '⚙️ configurável'],
          ['Clientes', '✅', '⚙️ configurável'],
          ['Usuários', '✅', '❌'],
          ['Ajustes', '✅', '❌'],
        ],
      },
    ],
  },
]

/* ── Componente de item FAQ ───────────────────── */
function FaqItem({ item, color, isOpen, onToggle }) {
  return (
    <div style={{
      borderRadius: 10,
      border: `1px solid ${isOpen ? color + '44' : 'var(--border)'}`,
      background: isOpen ? color + '08' : 'var(--bg-2)',
      overflow: 'hidden',
      transition: 'border-color .2s, background .2s',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 18px', background: 'transparent', cursor: 'pointer',
          gap: 12, textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500, color: isOpen ? color : 'var(--text)', lineHeight: 1.4 }}>
          {item.q}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ flexShrink: 0, color: isOpen ? color : 'var(--text-3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {isOpen && (
        <div style={{ padding: '0 18px 18px' }}>
          <div style={{ width: '100%', height: 1, background: 'var(--border)', marginBottom: 16 }} />

          {/* Texto */}
          {item.a && (
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.8 }}>
              {item.a.split('\n').map((line, i) => {
                if (!line.trim()) return <div key={i} style={{ height: 8 }} />
                // Negrito com **texto**
                const parts = line.split(/(\*\*[^*]+\*\*)/)
                return (
                  <p key={i} style={{ margin: '2px 0' }}>
                    {parts.map((part, j) =>
                      part.startsWith('**') && part.endsWith('**')
                        ? <strong key={j} style={{ color: 'var(--text)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
                        : part
                    )}
                  </p>
                )
              })}
            </div>
          )}

          {/* Steps */}
          {item.steps && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {item.steps.map(([title, desc], i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: color + '22', color, fontSize: 12, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{i + 1}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{title}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tabela */}
          {item.table && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {item.table[0].map((h, i) => (
                      <th key={i} style={{ background: color + '22', color }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {item.table.slice(1).map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} style={{
                          color: cell === '✅' ? 'var(--primary)' : cell === '❌' ? 'var(--danger)' : cell === '⚙️ configurável' ? 'var(--warning)' : undefined,
                          fontWeight: j === 0 ? 500 : 400,
                        }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tip */}
          {item.tip && (
            <div style={{
              marginTop: 14, display: 'flex', gap: 10, padding: '10px 14px',
              background: color + '15', borderRadius: 8,
              border: `1px solid ${color}33`,
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
              <p style={{ fontSize: 12, color, lineHeight: 1.6 }}>{item.tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Página ────────────────────────────────────── */
export default function Help() {
  const [openItem,    setOpenItem]    = useState(null)
  const [activeSection, setActiveSection] = useState(null)
  const [search, setSearch] = useState('')

  const toggle = (key) => setOpenItem((prev) => prev === key ? null : key)

  const filteredSections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      !search.trim() ||
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      (item.a ?? '').toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((s) => s.items.length > 0)

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Central de Ajuda</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Tudo que você precisa saber para dominar o StockFlow</p>
      </div>

      {/* Busca */}
      <div className="search-wrap">
        <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="input"
          placeholder="Buscar em todas as dúvidas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ fontSize: 14, padding: '11px 12px 11px 36px' }}
        />
      </div>

      {/* Navegação rápida (só sem busca) */}
      {!search && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                background: 'var(--bg-2)', border: '1px solid var(--border)',
                color: 'var(--text-2)', cursor: 'pointer', textDecoration: 'none',
                transition: 'all .15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.color = s.color }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
            >
              <span>{s.icon}</span> {s.title}
            </a>
          ))}
        </div>
      )}

      {/* Resultado da busca */}
      {search && (
        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {filteredSections.reduce((acc, s) => acc + s.items.length, 0)} resultado(s) para "{search}"
        </p>
      )}

      {/* Seções */}
      {filteredSections.map((section) => (
        <div key={section.id} id={section.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Título da seção */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 36, height: 36, borderRadius: 10, fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: section.color + '20',
            }}>{section.icon}</span>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: section.color }}>{section.title}</h2>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{section.items.length} tópico(s)</p>
            </div>
          </div>

          {/* Items */}
          {section.items.map((item, i) => {
            const key = `${section.id}-${i}`
            return (
              <FaqItem
                key={key}
                item={item}
                color={section.color}
                isOpen={openItem === key}
                onToggle={() => toggle(key)}
              />
            )
          })}
        </div>
      ))}

      {filteredSections.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🔍</p>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Nada encontrado para "{search}"</p>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Tente outras palavras-chave.</p>
        </div>
      )}
    </div>
  )
}