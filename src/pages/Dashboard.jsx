import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import PageHeader from '../components/layout/PageHeader'
import MetricCard from '../components/ui/MetricCard'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import { fmt, fmtDate } from '../utils/format'

export default function Dashboard() {
  const products = useStore((s) => s.products)
  const transactions = useStore((s) => s.transactions)

  const metrics = useMemo(() => {
    const income = transactions.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0)
    const expense = transactions.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
    return {
      balance: income - expense,
      income,
      expense,
      totalProducts: products.length,
    }
  }, [transactions, products])

  const recentTransactions = useMemo(() =>
    [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    [transactions]
  )

  const critical = useMemo(() =>
    products.filter((p) => p.qty === 0 || p.qty <= p.minQty).slice(0, 5),
    [products]
  )

  return (
    <div className="page">
      <PageHeader title="Dashboard" subtitle="Visão geral do seu negócio" />

      {/* Metrics */}
      <div className="grid-4">
        <MetricCard
          label="Saldo" value={fmt(metrics.balance)}
          variant={metrics.balance >= 0 ? 'success' : 'danger'}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}
        />
        <MetricCard
          label="Receitas" value={fmt(metrics.income)} variant="success"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>}
        />
        <MetricCard
          label="Despesas" value={fmt(metrics.expense)} variant="danger"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>}
        />
        <MetricCard
          label="Produtos" value={metrics.totalProducts} sub={`${critical.length} alertas`}
          variant={critical.length > 0 ? 'warning' : 'default'}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8l-9-4-9 4v8l9 4 9-4z"/></svg>}
        />
      </div>

      {/* Bottom row */}
      <div className="grid-2">
        {/* Recent transactions */}
        <div className="card">
          <p style={{ fontWeight: 600, marginBottom: 16 }}>Transações recentes</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recentTransactions.map((t) => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 0', borderBottom: '1px solid var(--border)',
              }}>
                <span style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: t.type === 'income' ? 'var(--primary-dim)' : 'var(--danger-dim)',
                  color: t.type === 'income' ? 'var(--primary)' : 'var(--danger)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
                }}>
                  {t.type === 'income' ? '↑' : '↓'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.description}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmtDate(t.date)}</p>
                </div>
                <span style={{
                  fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 600, flexShrink: 0,
                  color: t.type === 'income' ? 'var(--primary)' : 'var(--danger)',
                }}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Critical stock */}
        <div className="card">
          <p style={{ fontWeight: 600, marginBottom: 16 }}>Estoque crítico</p>
          {critical.length === 0 ? (
            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Todos os produtos estão com estoque adequado.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {critical.map((p) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <Avatar name={p.responsible} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.responsible}</p>
                  </div>
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
  )
}
