import { useMemo, useState } from 'react'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useStore } from '../store/useStore'
import PageHeader from '../components/layout/PageHeader'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import { fmt, fmtDate } from '../utils/format'

/* ── Cores do tema ────────────────────────────── */
const C = {
  primary:  '#00d68f',
  danger:   '#ff5f5f',
  info:     '#5b8af0',
  warning:  '#f5a623',
  purple:   '#a78bfa',
  border:   '#2a2a30',
  bg2:      '#17171a',
  bg3:      '#1f1f24',
  text2:    '#9898a8',
  text3:    '#5a5a6a',
}

const PAYMENT_COLORS = {
  dinheiro: C.primary,
  pix:      C.info,
  debito:   C.warning,
  credito:  C.purple,
}
const PAYMENT_LABELS = {
  dinheiro: 'Dinheiro',
  pix:      'PIX',
  debito:   'Débito',
  credito:  'Crédito',
}

/* ── Tooltip customizado ──────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-2)',
      border: '1px solid var(--border-2)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 12,
      boxShadow: '0 8px 32px #00000040',
      minWidth: 140,
    }}>
      {label && (
        <p style={{ color: 'var(--text-3)', marginBottom: 8, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          {label}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <span style={{ color: 'var(--text-2)' }}>{p.name}</span>
            </div>
            <span style={{ fontWeight: 700, color: p.color, fontFamily: 'DM Mono, monospace' }}>
              {fmt(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Card de métrica ──────────────────────────── */
function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: C.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</span>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: color + '22', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.text3 }}>{sub}</div>}
    </div>
  )
}

/* ── Cabeçalho de seção ───────────────────────── */
function SectionTitle({ children }) {
  return (
    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>{children}</p>
  )
}

export default function Dashboard() {
  const products     = useStore((s) => s.products)
  const transactions = useStore((s) => s.transactions)
  const bills        = useStore((s) => s.bills)
  const customers    = useStore((s) => s.customers)

  /* ── KPIs ──────────────────────────────────── */
  const kpis = useMemo(() => {
    const income  = transactions.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0)
    const expense = transactions.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
    const critical = products.filter((p) => p.qty === 0 || p.qty <= p.minQty).length
    return { balance: income - expense, income, expense, totalProducts: products.length, critical }
  }, [transactions, products])

  /* ── Receitas x Despesas — últimos 7 dias ─── */
  const barData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayTxs  = transactions.filter((t) => t.date === dateStr)
      days.push({
        dia: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
        Receitas: dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        Despesas: dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      })
    }
    return days
  }, [transactions])

  /* ── Evolução do saldo — período selecionável ── */
  const PERIODS = [
    { key: 'hoje',   label: 'Hoje'    },
    { key: 'semana', label: '7 dias'  },
    { key: 'mes',    label: '30 dias' },
    { key: 'ano',    label: '1 ano'   },
    { key: 'tudo',   label: 'Tudo'    },
  ]
  const [period, setPeriod] = useState('semana')

  const areaData = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date))

    let days = 0
    const now = new Date()

    if (period === 'hoje')   days = 0
    if (period === 'semana') days = 6
    if (period === 'mes')    days = 29
    if (period === 'ano')    days = 364

    // Para 'tudo', usa todas as datas únicas das transações
    if (period === 'tudo') {
      const allDates = [...new Set(sorted.map((t) => t.date))].sort()
      if (!allDates.length) return []
      let balance = 0
      return allDates.map((dateStr) => {
        sorted.filter((t) => t.date === dateStr).forEach((t) => {
          balance += t.type === 'income' ? t.amount : -t.amount
        })
        const [y, m, d] = dateStr.split('-')
        return { dia: `${d}/${m}`, Saldo: parseFloat(balance.toFixed(2)) }
      })
    }

    // Saldo acumulado antes do período
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - days)
    cutoff.setHours(0, 0, 0, 0)
    let runningBalance = 0
    sorted.forEach((t) => {
      if (new Date(t.date) < cutoff)
        runningBalance += t.type === 'income' ? t.amount : -t.amount
    })

    const result = []
    for (let i = days; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      sorted.filter((t) => t.date === dateStr).forEach((t) => {
        runningBalance += t.type === 'income' ? t.amount : -t.amount
      })
      const label = period === 'hoje'
        ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : period === 'ano'
          ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          : d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })
      result.push({ dia: label, Saldo: parseFloat(runningBalance.toFixed(2)) })
    }
    return result
  }, [transactions, period])

  /* ── Distribuição por pagamento ───────────── */
  const pieData = useMemo(() => {
    const map = {}
    transactions
      .filter((t) => t.type === 'income' && t.paymentMethod)
      .forEach((t) => { map[t.paymentMethod] = (map[t.paymentMethod] || 0) + t.amount })
    return Object.entries(map).map(([key, value]) => ({
      name: PAYMENT_LABELS[key] ?? key,
      value: parseFloat(value.toFixed(2)),
      color: PAYMENT_COLORS[key] ?? C.text2,
    }))
  }, [transactions])

  /* ── Transações recentes ──────────────────── */
  const recent = useMemo(() =>
    [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    [transactions]
  )

  /* ── Estoque crítico ──────────────────────── */
  const critical = useMemo(() =>
    products.filter((p) => p.qty === 0 || p.qty <= p.minQty).slice(0, 5),
    [products]
  )

  const axisProps = {
    tick: { fill: C.text3, fontSize: 11 },
    axisLine: false,
    tickLine: false,
  }

  return (
    <div className="page">
      <PageHeader title="Dashboard" subtitle="Visão geral do seu negócio" />


      {/* Alertas de contas e fiado */}
      {(() => {
        const today = new Date().toISOString().split('T')[0]
        const urgent = bills.filter((b) => b.status !== 'paid' && b.due_date <= today)
        const week   = bills.filter((b) => { if (b.status === 'paid') return false; const d = new Date(b.due_date + 'T00:00:00'); const t = new Date(); t.setHours(0,0,0,0); const diff = Math.ceil((d-t)/(1000*60*60*24)); return diff > 0 && diff <= 7 })
        const fiado  = customers.reduce((s,c) => s + (c.debts??[]).filter(d=>d.status!=='paid').reduce((ds,d)=>ds+(d.amount-(d.paid_amount??0)),0), 0)
        if (!urgent.length && !week.length && !fiado) return null
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {urgent.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--danger-dim)', borderRadius: 10, border: '1px solid var(--danger)44' }}>
                <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 500 }}>⚠️ {urgent.length} conta(s) vencida(s) ou vencendo hoje</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)', fontFamily: 'DM Mono, monospace' }}>{urgent.reduce((s,b)=>s+b.amount,0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span>
              </div>
            )}
            {week.length > 0 && !urgent.length && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--warning-dim)', borderRadius: 10, border: '1px solid var(--warning)44' }}>
                <span style={{ fontSize: 13, color: 'var(--warning)', fontWeight: 500 }}>📅 {week.length} conta(s) vencem nos próximos 7 dias</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning)', fontFamily: 'DM Mono, monospace' }}>{week.reduce((s,b)=>s+b.amount,0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span>
              </div>
            )}
            {fiado > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--warning-dim)', borderRadius: 10, border: '1px solid var(--warning)44' }}>
                <span style={{ fontSize: 13, color: 'var(--warning)', fontWeight: 500 }}>📒 Total em fiado a receber</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning)', fontFamily: 'DM Mono, monospace' }}>{fiado.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span>
              </div>
            )}
          </div>
        )
      })()}

      {/* KPIs */}
      <div className="grid-4">
        <KpiCard label="Saldo" value={fmt(kpis.balance)}
          color={kpis.balance >= 0 ? C.primary : C.danger}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}
        />
        <KpiCard label="Receitas" value={fmt(kpis.income)} color={C.primary}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>}
        />
        <KpiCard label="Despesas" value={fmt(kpis.expense)} color={C.danger}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>}
        />
        <KpiCard label="Produtos" value={kpis.totalProducts}
          sub={kpis.critical > 0 ? `${kpis.critical} com alerta` : 'Estoque OK'}
          color={kpis.critical > 0 ? C.warning : C.primary}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8l-9-4-9 4v8l9 4 9-4z"/></svg>}
        />
      </div>

      {/* Receitas x Despesas + Pagamentos */}
      <div className="chart-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

        {/* Bar chart */}
        <div className="card">
          <SectionTitle>Receitas × Despesas — últimos 7 dias</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barGap={4} barSize={18}>
              <CartesianGrid vertical={false} stroke={C.border} strokeDasharray="4 4" />
              <XAxis dataKey="dia" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} width={48} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: C.bg3 }} />
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ color: C.text2, fontSize: 12 }}>{v}</span>} />
              <Bar dataKey="Receitas" fill={C.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill={C.danger}  radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut pagamentos */}
        <div className="card">
          <SectionTitle>Pagamentos</SectionTitle>
          {pieData.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 13, color: C.text3 }}>Sem dados ainda</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                    dataKey="value" paddingAngle={3} stroke="none">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {pieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: C.text2 }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: d.color, fontWeight: 600 }}>
                      {fmt(d.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Evolução do saldo + listas */}
      <div className="chart-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

        {/* Area chart saldo com seletor de período */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Evolução do saldo</p>
            <div style={{ display: 'flex', gap: 4 }}>
              {PERIODS.map(({ key, label }) => (
                <button key={key} onClick={() => setPeriod(key)}
                  style={{
                    padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                    cursor: 'pointer', border: 'none', transition: 'all .15s',
                    background: period === key ? C.primary : C.bg3,
                    color: period === key ? '#000' : C.text3,
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.primary} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.primary} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={C.border} strokeDasharray="4 4" />
              <XAxis dataKey="dia" {...axisProps} interval="preserveStartEnd" />
              <YAxis {...axisProps} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} width={48} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: C.primary, strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="Saldo" stroke={C.primary} strokeWidth={2}
                fill="url(#gradSaldo)" dot={false} activeDot={{ r: 4, fill: C.primary, stroke: 'var(--bg-2)', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lado direito: transações recentes + estoque crítico */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Transações recentes */}
          <div className="card" style={{ flex: 1 }}>
            <SectionTitle>Recentes</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recent.map((t) => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 0', borderBottom: `1px solid ${C.border}`,
                }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    background: t.type === 'income' ? C.primary + '22' : C.danger + '22',
                    color: t.type === 'income' ? C.primary : C.danger,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                  }}>
                    {t.type === 'income' ? '↑' : '↓'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.description}
                    </p>
                    <p style={{ fontSize: 10, color: C.text3, margin: 0 }}>{fmtDate(t.date)}</p>
                  </div>
                  <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', fontWeight: 600, flexShrink: 0,
                    color: t.type === 'income' ? C.primary : C.danger }}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Estoque crítico — sempre visível */}
          <div className="card">
            <SectionTitle>Estoque crítico</SectionTitle>
            {critical.length === 0 ? (
              <p style={{ fontSize: 12, color: C.text3 }}>Todos os produtos estão com estoque adequado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {critical.map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={p.responsible} size={24} />
                    <p style={{ flex: 1, fontSize: 12, color: C.text2, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </p>
                    <Badge variant={p.qty === 0 ? 'danger' : 'warning'}>
                      {p.qty === 0 ? 'Esgotado' : `${p.qty} un.`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}