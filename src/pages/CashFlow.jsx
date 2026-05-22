import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import PageHeader from '../components/layout/PageHeader'
import TransactionTable from '../components/cashflow/TransactionTable'
import TransactionForm from '../components/cashflow/TransactionForm'
import MetricCard from '../components/ui/MetricCard'
import Modal from '../components/ui/Modal'
import { fmt } from '../utils/format'

export default function CashFlow() {
  const transactions = useStore((s) => s.transactions)
  const addTransaction = useStore((s) => s.addTransaction)
  const deleteTransaction = useStore((s) => s.deleteTransaction)

  const [modal, setModal] = useState(false)

  const metrics = useMemo(() => {
    const income = transactions.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0)
    const expense = transactions.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
    return { income, expense, balance: income - expense }
  }, [transactions])

  const handleSave = (data) => {
    addTransaction(data)
    setModal(false)
  }

  return (
    <div className="page">
      <PageHeader
        title="Fluxo de Caixa"
        subtitle={`${transactions.length} transação(ões) registrada(s)`}
        action={
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nova transação
          </button>
        }
      />

      <div className="grid-3">
        <MetricCard label="Saldo" value={fmt(metrics.balance)}
          variant={metrics.balance >= 0 ? 'success' : 'danger'}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}
        />
        <MetricCard label="Total receitas" value={fmt(metrics.income)} variant="success"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>}
        />
        <MetricCard label="Total despesas" value={fmt(metrics.expense)} variant="danger"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>}
        />
      </div>

      <div className="card">
        <TransactionTable transactions={transactions} onDelete={deleteTransaction} />
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nova transação">
        <TransactionForm onSave={handleSave} onCancel={() => setModal(false)} />
      </Modal>
    </div>
  )
}
