import { useState, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useStore } from '../store/useStore'
import PageHeader from '../components/layout/PageHeader'
import Badge from '../components/ui/Badge'
import { fmt, fmtDate, calcMargin } from '../utils/format'
import { calcABC, getExpiryStatus } from '../utils/inventoryAnalytics'

/* ── Cores ────────────────────────────────────────── */
const C = {
  primary: '#00d68f', danger: '#ff5f5f', warning: '#f5a623',
  info: '#5b8af0', purple: '#a78bfa', border: '#2a2a30', text3: '#5a5a6a',
}
const PIE_COLORS = [C.primary, C.info, C.warning, C.purple, C.danger]
const PAYMENT_LABELS = { dinheiro: 'Dinheiro', pix: 'PIX', debito: 'Débito', credito: 'Crédito' }

/* ── Tooltip customizado ──────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: '0 8px 32px #00000040', minWidth: 140 }}>
      {label && <p style={{ color: 'var(--text-3)', marginBottom: 8, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <span style={{ color: 'var(--text-2)' }}>{p.name}</span>
            </div>
            <span style={{ fontWeight: 700, color: p.color, fontFamily: 'DM Mono, monospace' }}>
              {typeof p.value === 'number' && p.value > 100 ? fmt(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Card de seção ────────────────────────────────── */
function SectionCard({ title, children, action }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <p style={{ fontWeight: 600, fontSize: 15 }}>{title}</p>
        {action}
      </div>
      {children}
    </div>
  )
}

/* ── KPI ──────────────────────────────────────────── */
function KPI({ label, value, color }) {
  return (
    <div style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '12px 14px' }}>
      <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 700, color: color ?? 'var(--text)' }}>{value}</p>
    </div>
  )
}

/* ── Seletor de período ───────────────────────────── */
const PERIODS = [
  { key: '7',   label: '7 dias'  },
  { key: '30',  label: '30 dias' },
  { key: '90',  label: '90 dias' },
  { key: '365', label: '1 ano'   },
  { key: 'all', label: 'Tudo'    },
]

function PeriodSelector({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {PERIODS.map((p) => (
        <button key={p.key} onClick={() => onChange(p.key)}
          style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
            cursor: 'pointer', border: 'none', transition: 'all .15s',
            background: value === p.key ? 'var(--primary)' : 'var(--bg-3)',
            color: value === p.key ? '#000' : 'var(--text-3)',
          }}>
          {p.label}
        </button>
      ))}
    </div>
  )
}

/* ── Exportar Excel ───────────────────────────────── */
async function exportExcel(sheets) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  sheets.forEach(({ name, data }) => {
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, name)
  })
  XLSX.writeFile(wb, `StockFlow_Relatorio_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`)
}

/* ── Exportar PDF ─────────────────────────────────── */
async function exportPDF(sections) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF()
  const date = new Date().toLocaleDateString('pt-BR')

  doc.setFontSize(18)
  doc.setTextColor(0, 214, 143)
  doc.text('StockFlow — Relatório', 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 130)
  doc.text(`Gerado em ${date}`, 14, 26)

  let y = 34
  sections.forEach(({ title, head, body }) => {
    doc.setFontSize(12)
    doc.setTextColor(30, 30, 40)
    doc.text(title, 14, y)
    autoTable(doc, {
      startY: y + 4,
      head: [head],
      body,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [0, 214, 143], textColor: 0, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 248] },
    })
    y = doc.lastAutoTable.finalY + 14
  })

  doc.save(`StockFlow_Relatorio_${date.replace(/\//g, '-')}.pdf`)
}

/* ── Página principal ─────────────────────────────── */
export default function Reports() {
  const products     = useStore((s) => s.products)
  const transactions = useStore((s) => s.transactions)
  const purchases    = useStore((s) => s.purchases)
  const bills        = useStore((s) => s.bills)
  const customers    = useStore((s) => s.customers)

  const [period, setPeriod] = useState('30')

  /* ── Filtro de período ── */
  const filteredTx = useMemo(() => {
    if (period === 'all') return transactions
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - Number(period))
    return transactions.filter((t) => new Date(t.date) >= cutoff)
  }, [transactions, period])

  /* ── Vendas ── */
  const salesMetrics = useMemo(() => {
    const sales   = filteredTx.filter((t) => t.type === 'income' && t.category === 'Vendas')
    const total   = sales.reduce((s, t) => s + t.amount, 0)
    const byDay   = {}
    sales.forEach((t) => {
      const d = t.date
      byDay[d] = (byDay[d] || 0) + t.amount
    })
    const byDayArr = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        dia: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        Vendas: parseFloat(v.toFixed(2)),
      }))

    const byPayment = {}
    sales.forEach((t) => {
      const k = t.paymentMethod ?? 'dinheiro'
      byPayment[k] = (byPayment[k] || 0) + t.amount
    })
    const byPaymentArr = Object.entries(byPayment).map(([k, v]) => ({
      name: PAYMENT_LABELS[k] ?? k,
      value: parseFloat(v.toFixed(2)),
    }))

    return { total, count: sales.length, byDayArr, byPaymentArr }
  }, [filteredTx])

  /* ── Estoque ── */
  const stockMetrics = useMemo(() => {
    const sorted  = [...products].sort((a, b) => b.qty * b.price - a.qty * a.price)
    const critical = products.filter((p) => p.qty === 0 || p.qty <= p.minQty)
    const totalValue = products.reduce((s, p) => s + p.qty * p.cost, 0)
    const avgMargin  = products.length
      ? products.reduce((s, p) => s + parseFloat(calcMargin(p.cost, p.price)), 0) / products.length
      : 0

    // Top 8 por valor em estoque
    const byValue = sorted.slice(0, 8).map((p) => ({
      name: p.name.length > 16 ? p.name.slice(0, 14) + '…' : p.name,
      Valor: parseFloat((p.qty * p.cost).toFixed(2)),
    }))

    return { totalValue, avgMargin, critical, byValue }
  }, [products])

  /* ── Fluxo de Caixa ── */
  const cashMetrics = useMemo(() => {
    const income  = filteredTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = filteredTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    const byDay = {}
    filteredTx.forEach((t) => {
      if (!byDay[t.date]) byDay[t.date] = { dia: '', Receitas: 0, Despesas: 0 }
      byDay[t.date].dia = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      if (t.type === 'income')  byDay[t.date].Receitas += t.amount
      if (t.type === 'expense') byDay[t.date].Despesas += t.amount
    })
    const byDayArr = Object.values(byDay)
      .sort((a, b) => a.dia.localeCompare(b.dia))
      .map((d) => ({ ...d, Receitas: parseFloat(d.Receitas.toFixed(2)), Despesas: parseFloat(d.Despesas.toFixed(2)) }))

    // Saldo acumulado
    let balance = 0
    const balanceArr = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, d]) => {
        balance += d.Receitas - d.Despesas
        return { dia: d.dia, Saldo: parseFloat(balance.toFixed(2)) }
      })

    return { income, expense, balance: income - expense, byDayArr, balanceArr }
  }, [filteredTx])

  /* ── Compras ── */
  const purchaseMetrics = useMemo(() => {
    const received = purchases.filter((p) => p.status === 'received')
    const total    = received.reduce((s, p) => s + p.total, 0)

    const bySupplier = {}
    received.forEach((p) => {
      const name = p.supplier?.name ?? 'Sem fornecedor'
      bySupplier[name] = (bySupplier[name] || 0) + p.total
    })
    const bySupplierArr = Object.entries(bySupplier)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))

    return { total, count: received.length, bySupplierArr }
  }, [purchases])


  const abcMap = useMemo(() => calcABC(products, transactions), [products, transactions])

  const expiringProducts = useMemo(() =>
    products.filter((p) => {
      const s = getExpiryStatus(p.expiryDate)
      return s && (s.status === 'warning' || s.status === 'critical' || s.status === 'expired')
    }).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)),
    [products]
  )


  /* ── DRE Gerencial ─────────────────────── */
  const dreData = useMemo(() => {
    const grossRevenue = filteredTx.filter((t) => t.type === 'income' && t.category === 'Vendas').reduce((s, t) => s + t.amount, 0)
    // CMV = receita × (1 - margem_media)
    const avgMargin = products.length
      ? products.reduce((s, p) => s + (p.price > 0 ? (p.price - p.cost) / p.price : 0), 0) / products.length
      : 0.3
    const cmv = grossRevenue * (1 - avgMargin)
    const grossProfit = grossRevenue - cmv
    const opExpenses = filteredTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const netProfit = grossProfit - opExpenses
    const totalFiado = customers.reduce((s, c) => s + (c.debts ?? []).filter((d) => d.status !== 'paid').reduce((ds, d) => ds + (d.amount - (d.paid_amount ?? 0)), 0), 0)
    return { grossRevenue: parseFloat(grossRevenue.toFixed(2)), cmv: parseFloat(cmv.toFixed(2)), grossProfit: parseFloat(grossProfit.toFixed(2)), opExpenses: parseFloat(opExpenses.toFixed(2)), netProfit: parseFloat(netProfit.toFixed(2)), totalFiado: parseFloat(totalFiado.toFixed(2)) }
  }, [filteredTx, products, customers])

  const axisProps = { tick: { fill: C.text3, fontSize: 11 }, axisLine: false, tickLine: false }

  /* ── Exportar tudo ── */
  const handleExportExcel = () => exportExcel([
    {
      name: 'Vendas',
      data: filteredTx.filter((t) => t.type === 'income' && t.category === 'Vendas').map((t) => ({
        Data: fmtDate(t.date), Descrição: t.description,
        Pagamento: PAYMENT_LABELS[t.paymentMethod] ?? t.paymentMethod,
        Valor: t.amount,
      })),
    },
    {
      name: 'Estoque',
      data: products.map((p) => ({
        Produto: p.name, Categoria: p.category, Responsável: p.responsible,
        Estoque: p.qty, 'Estoque mín.': p.minQty,
        Custo: p.cost, 'Preço venda': p.price,
        Margem: calcMargin(p.cost, p.price) + '%',
        'Valor em estoque': (p.qty * p.cost).toFixed(2),
      })),
    },
    {
      name: 'Fluxo de Caixa',
      data: filteredTx.map((t) => ({
        Data: fmtDate(t.date), Tipo: t.type === 'income' ? 'Receita' : 'Despesa',
        Descrição: t.description, Categoria: t.category, Valor: t.amount,
        Responsável: t.responsible,
      })),
    },
    {
      name: 'Compras',
      data: purchases.map((p) => ({
        Data: fmtDate(p.date), Fornecedor: p.supplier?.name ?? '—',
        Status: p.status === 'received' ? 'Recebido' : p.status === 'pending' ? 'Aguardando' : 'Cancelado',
        Total: p.total, Observações: p.notes ?? '',
      })),
    },
  ])

  const handleExportPDF = () => exportPDF([
    {
      title: 'Vendas',
      head: ['Data', 'Descrição', 'Pagamento', 'Valor'],
      body: filteredTx.filter((t) => t.type === 'income' && t.category === 'Vendas')
        .map((t) => [fmtDate(t.date), t.description, PAYMENT_LABELS[t.paymentMethod] ?? t.paymentMethod, fmt(t.amount)]),
    },
    {
      title: 'Estoque',
      head: ['Produto', 'Qtd', 'Custo', 'Preço', 'Margem', 'Status'],
      body: products.map((p) => [
        p.name, p.qty, fmt(p.cost), fmt(p.price),
        calcMargin(p.cost, p.price) + '%',
        p.qty === 0 ? 'Esgotado' : p.qty <= p.minQty ? 'Baixo' : 'OK',
      ]),
    },
    {
      title: 'Fluxo de Caixa',
      head: ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor'],
      body: filteredTx.map((t) => [
        fmtDate(t.date), t.type === 'income' ? 'Receita' : 'Despesa',
        t.description, t.category, fmt(t.amount),
      ]),
    },
    {
      title: 'Compras',
      head: ['Data', 'Fornecedor', 'Status', 'Total'],
      body: purchases.map((p) => [
        fmtDate(p.date), p.supplier?.name ?? '—',
        p.status === 'received' ? 'Recebido' : p.status === 'pending' ? 'Aguardando' : 'Cancelado',
        fmt(p.total),
      ]),
    },
  ])

  return (
    <div className="page">
      <PageHeader
        title="Relatórios"
        subtitle="Análises de vendas, estoque, caixa e compras"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={handleExportPDF} style={{ fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              Exportar PDF
            </button>
            <button className="btn btn-primary" onClick={handleExportExcel} style={{ fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
              Exportar Excel
            </button>
          </div>
        }
      />

      {/* Seletor de período global */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Período:</span>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* ── VENDAS ── */}
      <SectionCard title="Vendas">
        <div className="grid-4" style={{ marginBottom: 20 }}>
          <KPI label="Total vendido" value={fmt(salesMetrics.total)} color="var(--primary)" />
          <KPI label="Nº de vendas"  value={salesMetrics.count} />
          <KPI label="Ticket médio"  value={salesMetrics.count ? fmt(salesMetrics.total / salesMetrics.count) : fmt(0)} />
          <KPI label="Melhor forma"  value={salesMetrics.byPaymentArr.sort((a,b)=>b.value-a.value)[0]?.name ?? '—'} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10, fontWeight: 500 }}>Vendas por dia</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesMetrics.byDayArr} barSize={14}>
                <CartesianGrid vertical={false} stroke={C.border} strokeDasharray="4 4" />
                <XAxis dataKey="dia" {...axisProps} interval="preserveStartEnd" />
                <YAxis {...axisProps} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} width={42} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-3)' }} />
                <Bar dataKey="Vendas" fill={C.primary} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10, fontWeight: 500 }}>Por forma de pagamento</p>
            {salesMetrics.byPaymentArr.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-3)', paddingTop: 20 }}>Sem dados</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={salesMetrics.byPaymentArr} cx="50%" cy="50%" innerRadius={35} outerRadius={58}
                      dataKey="value" paddingAngle={3} stroke="none">
                      {salesMetrics.byPaymentArr.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
                  {salesMetrics.byPaymentArr.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span style={{ color: 'var(--text-2)' }}>{d.name}</span>
                      </div>
                      <span style={{ color: PIE_COLORS[i % PIE_COLORS.length], fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── ESTOQUE ── */}
      <SectionCard title="Estoque">
        <div className="grid-4" style={{ marginBottom: 20 }}>
          <KPI label="Valor total"    value={fmt(stockMetrics.totalValue)} color="var(--info)" />
          <KPI label="Produtos"       value={products.length} />
          <KPI label="Margem média"   value={stockMetrics.avgMargin.toFixed(1) + '%'} color="var(--primary)" />
          <KPI label="Alertas"        value={stockMetrics.critical.length} color={stockMetrics.critical.length > 0 ? 'var(--warning)' : 'var(--primary)'} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10, fontWeight: 500 }}>Top produtos por valor em estoque</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stockMetrics.byValue} layout="vertical" barSize={14}>
                <CartesianGrid horizontal={false} stroke={C.border} strokeDasharray="4 4" />
                <XAxis type="number" {...axisProps} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" {...axisProps} width={90} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-3)' }} />
                <Bar dataKey="Valor" fill={C.info} radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10, fontWeight: 500 }}>Estoque crítico</p>
            {stockMetrics.critical.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--primary)' }}>✓ Todos OK</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stockMetrics.critical.map((p) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{p.name}</span>
                    <Badge variant={p.qty === 0 ? 'danger' : 'warning'}>
                      {p.qty === 0 ? 'Esgotado' : `${p.qty} un.`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>Margem por produto</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[...products].sort((a, b) => parseFloat(calcMargin(b.cost, b.price)) - parseFloat(calcMargin(a.cost, a.price))).slice(0, 5).map((p) => {
                  const m = parseFloat(calcMargin(p.cost, p.price))
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{p.name}</span>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 600, color: m >= 30 ? C.primary : m >= 15 ? C.warning : C.danger }}>
                        {m}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── FLUXO DE CAIXA ── */}
      <SectionCard title="Fluxo de Caixa">
        <div className="grid-4" style={{ marginBottom: 20 }}>
          <KPI label="Receitas"  value={fmt(cashMetrics.income)}  color="var(--primary)" />
          <KPI label="Despesas"  value={fmt(cashMetrics.expense)} color="var(--danger)"  />
          <KPI label="Saldo"     value={fmt(cashMetrics.balance)} color={cashMetrics.balance >= 0 ? 'var(--primary)' : 'var(--danger)'} />
          <KPI label="Transações" value={filteredTx.length} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10, fontWeight: 500 }}>Receitas × Despesas</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cashMetrics.byDayArr} barGap={3} barSize={10}>
                <CartesianGrid vertical={false} stroke={C.border} strokeDasharray="4 4" />
                <XAxis dataKey="dia" {...axisProps} interval="preserveStartEnd" />
                <YAxis {...axisProps} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} width={42} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-3)' }} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{v}</span>} />
                <Bar dataKey="Receitas" fill={C.primary} radius={[3,3,0,0]} />
                <Bar dataKey="Despesas" fill={C.danger}  radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10, fontWeight: 500 }}>Evolução do saldo</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={cashMetrics.balanceArr}>
                <defs>
                  <linearGradient id="gradRep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.primary} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={C.primary} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={C.border} strokeDasharray="4 4" />
                <XAxis dataKey="dia" {...axisProps} interval="preserveStartEnd" />
                <YAxis {...axisProps} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} width={42} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="Saldo" stroke={C.primary} strokeWidth={2} dot={false}
                  activeDot={{ r: 4, fill: C.primary, stroke: 'var(--bg-2)', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </SectionCard>



      {/* ── DRE GERENCIAL ── */}
      <SectionCard title="DRE Gerencial — Resultado do Período">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Receita Bruta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>Receita Bruta de Vendas</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Total de vendas no caixa</p>
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)', fontFamily: 'DM Mono, monospace' }}>{fmt(dreData.grossRevenue)}</span>
          </div>

          {/* CMV */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)' }}>(-) Custo das Mercadorias Vendidas</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Estimado pela margem média dos produtos</p>
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)', fontFamily: 'DM Mono, monospace' }}>- {fmt(dreData.cmv)}</span>
          </div>

          {/* Lucro Bruto */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', margin: '8px 0', background: 'var(--bg-3)', borderRadius: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 700 }}>= Lucro Bruto</p>
            <span style={{ fontSize: 18, fontWeight: 700, color: dreData.grossProfit >= 0 ? 'var(--primary)' : 'var(--danger)', fontFamily: 'DM Mono, monospace' }}>{fmt(dreData.grossProfit)}</span>
          </div>

          {/* Despesas Operacionais */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)' }}>(-) Despesas Operacionais</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Contas pagas + outras despesas lançadas</p>
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)', fontFamily: 'DM Mono, monospace' }}>- {fmt(dreData.opExpenses)}</span>
          </div>

          {/* Resultado */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px', margin: '8px 0', background: dreData.netProfit >= 0 ? 'var(--primary-dim)' : 'var(--danger-dim)', borderRadius: 8, border: `1px solid ${dreData.netProfit >= 0 ? 'var(--primary)' : 'var(--danger)'}44` }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: dreData.netProfit >= 0 ? 'var(--primary)' : 'var(--danger)' }}>= Resultado Operacional</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Lucro ou prejuízo do período</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: dreData.netProfit >= 0 ? 'var(--primary)' : 'var(--danger)', fontFamily: 'DM Mono, monospace' }}>{fmt(dreData.netProfit)}</span>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                Margem: {dreData.grossRevenue > 0 ? ((dreData.netProfit / dreData.grossRevenue) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>

          {/* Fiado em aberto */}
          {dreData.totalFiado > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--warning-dim)', borderRadius: 8, marginTop: 8 }}>
              <p style={{ fontSize: 13, color: 'var(--warning)', fontWeight: 500 }}>📒 Fiado em aberto (a receber)</p>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--warning)', fontFamily: 'DM Mono, monospace' }}>{fmt(dreData.totalFiado)}</span>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── CLASSIFICAÇÃO ABC + GIRO ── */}
      <SectionCard title="Classificação ABC & Giro de Estoque">
        <div className="grid-3" style={{ marginBottom: 20 }}>
          <KPI label="Classe A (alto valor)"  value={products.filter((p) => abcMap[p.id] === 'A').length + ' produtos'} color="var(--primary)" />
          <KPI label="Classe B (médio)"        value={products.filter((p) => abcMap[p.id] === 'B').length + ' produtos'} color="var(--info)" />
          <KPI label="Classe C (baixo giro)"   value={products.filter((p) => abcMap[p.id] === 'C').length + ' produtos'} color="var(--text-3)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10, fontWeight: 500 }}>Distribuição por classe</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['A', 'B', 'C'].map((cls) => {
                const prods = products.filter((p) => abcMap[p.id] === cls)
                const pct   = products.length ? Math.round((prods.length / products.length) * 100) : 0
                const color = cls === 'A' ? 'var(--primary)' : cls === 'B' ? 'var(--info)' : 'var(--text-3)'
                return (
                  <div key={cls}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-2)' }}>Classe {cls}</span>
                      <span style={{ color, fontWeight: 600 }}>{prods.length} produtos ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 99, transition: 'width .4s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10, fontWeight: 500 }}>Produtos vencendo em 30 dias</p>
            {expiringProducts.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--primary)' }}>✓ Nenhum produto próximo ao vencimento</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {expiringProducts.map((p) => {
                  const s = getExpiryStatus(p.expiryDate)
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-2)' }}>{p.name}</span>
                      <span style={{ color: s.status === 'expired' ? 'var(--danger)' : 'var(--warning)', fontWeight: 600 }}>
                        {s.status === 'expired' ? 'Vencido' : `${s.daysLeft}d`}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── COMPRAS ── */}
      <SectionCard title="Compras">
        <div className="grid-3" style={{ marginBottom: 20 }}>
          <KPI label="Total comprado"  value={fmt(purchaseMetrics.total)}   color="var(--warning)" />
          <KPI label="Pedidos recebidos" value={purchaseMetrics.count} />
          <KPI label="Fornecedores"    value={purchaseMetrics.bySupplierArr.length} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10, fontWeight: 500 }}>Compras por fornecedor</p>
            {purchaseMetrics.bySupplierArr.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Sem compras recebidas</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={purchaseMetrics.bySupplierArr} layout="vertical" barSize={14}>
                  <CartesianGrid horizontal={false} stroke={C.border} strokeDasharray="4 4" />
                  <XAxis type="number" {...axisProps} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" {...axisProps} width={90} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-3)' }} />
                  <Bar dataKey="value" name="Total" fill={C.warning} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10, fontWeight: 500 }}>Últimos pedidos</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {purchases.slice(0, 6).map((p) => {
                const st = p.status === 'received' ? 'success' : p.status === 'cancelled' ? 'danger' : 'warning'
                return (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <div>
                      <p style={{ fontWeight: 500, color: 'var(--text)' }}>{p.supplier?.name ?? 'Sem fornecedor'}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmtDate(p.date)}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Badge variant={st}>{p.status === 'received' ? 'Recebido' : p.status === 'pending' ? 'Aguardando' : 'Cancelado'}</Badge>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 600, color: 'var(--text)' }}>{fmt(p.total)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}