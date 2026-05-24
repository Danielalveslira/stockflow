import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import PageHeader from '../components/layout/PageHeader'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { fmt, fmtDate } from '../utils/format'

const BILL_CATEGORIES = ['Aluguel','Energia','Água','Internet','Fornecedor','Funcionário','Imposto','Manutenção','Operacional','Outros']
const RECURRENCE = [
  { value: 'none',    label: 'Única'   },
  { value: 'monthly', label: 'Mensal'  },
]

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0)
  const due   = new Date(dateStr + 'T00:00:00')
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24))
}

function BillStatusBadge({ bill }) {
  const days = daysUntil(bill.due_date)
  if (bill.status === 'paid')    return <Badge variant="success">Pago</Badge>
  if (days < 0)                  return <Badge variant="danger">Vencida {Math.abs(days)}d atrás</Badge>
  if (days === 0)                return <Badge variant="danger">Vence hoje!</Badge>
  if (days <= 3)                 return <Badge variant="danger">Vence em {days}d</Badge>
  if (days <= 7)                 return <Badge variant="warning">Vence em {days}d</Badge>
  return <Badge variant="neutral">Vence em {days}d</Badge>
}

function BillForm({ onSave, onCancel }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ description: '', amount: '', dueDate: today, category: 'Operacional', recurrence: 'none', notes: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    const errs = {}
    if (!form.description.trim()) errs.description = 'Obrigatório'
    if (!form.amount || isNaN(form.amount)) errs.amount = 'Valor inválido'
    if (!form.dueDate) errs.dueDate = 'Obrigatório'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    await onSave({ ...form, amount: Number(form.amount) })
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="grid-2">
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Descrição *</label>
          <input className={`input ${errors.description ? 'input-error' : ''}`} value={form.description}
            onChange={set('description')} placeholder="Ex: Aluguel de março" />
          {errors.description && <span className="field-error">{errors.description}</span>}
        </div>
        <div className="field">
          <label>Valor (R$) *</label>
          <input className={`input ${errors.amount ? 'input-error' : ''}`} type="number" min="0" step="0.01"
            value={form.amount} onChange={set('amount')} placeholder="0,00" />
          {errors.amount && <span className="field-error">{errors.amount}</span>}
        </div>
        <div className="field">
          <label>Vencimento *</label>
          <input className={`input ${errors.dueDate ? 'input-error' : ''}`} type="date"
            value={form.dueDate} onChange={set('dueDate')} />
          {errors.dueDate && <span className="field-error">{errors.dueDate}</span>}
        </div>
        <div className="field">
          <label>Categoria</label>
          <select className="input" value={form.category} onChange={set('category')}>
            {BILL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Recorrência</label>
          <select className="input" value={form.recurrence} onChange={set('recurrence')}>
            {RECURRENCE.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Observações</label>
          <input className="input" value={form.notes} onChange={set('notes')} placeholder="Número do boleto, contrato..." />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Adicionar conta'}
        </button>
      </div>
    </div>
  )
}

export default function Bills() {
  const bills     = useStore((s) => s.bills)
  const addBill   = useStore((s) => s.addBill)
  const payBill   = useStore((s) => s.payBill)
  const deleteBill = useStore((s) => s.deleteBill)

  const [modal,  setModal]  = useState(false)
  const [filter, setFilter] = useState('pending')
  const [paying, setPaying] = useState(null)
  const [toast,  setToast]  = useState(null)

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000) }

  const filtered = useMemo(() => {
    if (filter === 'all')      return bills
    if (filter === 'pending')  return bills.filter((b) => b.status !== 'paid')
    if (filter === 'paid')     return bills.filter((b) => b.status === 'paid')
    if (filter === 'overdue')  return bills.filter((b) => b.status !== 'paid' && daysUntil(b.due_date) < 0)
    return bills
  }, [bills, filter])

  const metrics = useMemo(() => {
    const open    = bills.filter((b) => b.status !== 'paid')
    const overdue = open.filter((b) => daysUntil(b.due_date) < 0)
    const week    = open.filter((b) => { const d = daysUntil(b.due_date); return d >= 0 && d <= 7 })
    return {
      totalOpen:    open.reduce((s, b) => s + b.amount, 0),
      totalOverdue: overdue.reduce((s, b) => s + b.amount, 0),
      countWeek:    week.length,
      totalPaid:    bills.filter((b) => b.status === 'paid').reduce((s, b) => s + b.amount, 0),
    }
  }, [bills])

  const handlePay = async (bill) => {
    setPaying(bill.id)
    try {
      await payBill(bill.id, bill.amount)
      showToast('success', `"${bill.description}" marcada como paga e lançada no Fluxo de Caixa.`)
    } catch {
      showToast('error', 'Erro ao registrar pagamento.')
    } finally {
      setPaying(null)
    }
  }

  const FILTERS = [
    { key: 'pending', label: 'Em aberto' },
    { key: 'overdue', label: 'Vencidas' },
    { key: 'paid',    label: 'Pagas' },
    { key: 'all',     label: 'Todas' },
  ]

  return (
    <div className="page">
      <PageHeader
        title="Contas a Pagar"
        subtitle="Controle de vencimentos e despesas"
        action={
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nova conta
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid-4">
        {[
          { label: 'Total em aberto', value: fmt(metrics.totalOpen), color: 'var(--warning)' },
          { label: 'Vencidas',        value: fmt(metrics.totalOverdue), color: metrics.totalOverdue > 0 ? 'var(--danger)' : 'var(--text-3)' },
          { label: 'Vencem em 7 dias', value: metrics.countWeek + ' conta(s)', color: metrics.countWeek > 0 ? 'var(--warning)' : 'var(--text-3)' },
          { label: 'Pago no período', value: fmt(metrics.totalPaid), color: 'var(--primary)' },
        ].map((k) => (
          <div key={k.label} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>{k.label}</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map((f) => (
            <button key={f.key}
              className={filter === f.key ? 'btn btn-primary' : 'btn btn-ghost'}
              style={{ fontSize: 12, padding: '6px 14px' }}
              onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        {/* Legenda */}
        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { color: 'var(--danger)', label: 'Vencida / urgente' },
            { color: 'var(--warning)', label: 'Vence em breve' },
            { color: 'var(--info)', label: 'Em dia' },
            { color: 'var(--primary)', label: 'Paga' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState title="Nenhuma conta" message="Adicione contas a pagar para controlar seus vencimentos." action={<button className="btn btn-primary" onClick={() => setModal(true)}>Nova conta</button>} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered
            .sort((a, b) => a.due_date.localeCompare(b.due_date))
            .map((bill) => {
              const days = daysUntil(bill.due_date)
              const isOverdue = bill.status !== 'paid' && days < 0
              return (
                <div key={bill.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, borderColor: isOverdue ? 'var(--danger)' : undefined }}>
                  {/* Bolinha de status */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: bill.status === 'paid' ? 'var(--primary-dim)' : isOverdue ? 'var(--danger-dim)' : 'var(--bg-3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18,
                    }}>
                      {bill.category === 'Aluguel' ? '🏠' : bill.category === 'Energia' ? '⚡' : bill.category === 'Água' ? '💧' : bill.category === 'Funcionário' ? '👤' : '📄'}
                    </div>
                    {/* Bolinha indicadora */}
                    <span style={{
                      position: 'absolute', top: -3, right: -3,
                      width: 12, height: 12, borderRadius: '50%',
                      border: '2px solid var(--bg-2)',
                      background: bill.status === 'paid'
                        ? 'var(--primary)'
                        : isOverdue || daysUntil(bill.due_date) <= 3
                          ? 'var(--danger)'
                          : daysUntil(bill.due_date) <= 7
                            ? 'var(--warning)'
                            : 'var(--info)',
                      boxShadow: bill.status !== 'paid' && (isOverdue || daysUntil(bill.due_date) <= 3)
                        ? '0 0 6px var(--danger)' : 'none',
                    }} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{bill.description}</p>
                      <BillStatusBadge bill={bill} />
                      {bill.recurrence === 'monthly' && <Badge variant="info">Mensal</Badge>}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                      {bill.category} · Vence {fmtDate(bill.due_date)}
                      {bill.notes ? ` · ${bill.notes}` : ''}
                    </p>
                  </div>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, fontWeight: 700, color: bill.status === 'paid' ? 'var(--primary)' : isOverdue ? 'var(--danger)' : 'var(--text)', flexShrink: 0 }}>
                    {fmt(bill.amount)}
                  </span>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {bill.status !== 'paid' && (
                      <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 12px' }}
                        onClick={() => handlePay(bill)} disabled={paying === bill.id}>
                        {paying === bill.id ? '...' : 'Pagar'}
                      </button>
                    )}
                    <button className="btn-icon" onClick={() => deleteBill(bill.id)} style={{ color: 'var(--danger)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                    </button>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nova conta a pagar" width={520}>
        <BillForm onSave={async (data) => { await addBill(data); setModal(false); showToast('success', 'Conta adicionada!') }} onCancel={() => setModal(false)} />
      </Modal>

      {toast && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 200, background: toast.type === 'success' ? 'var(--primary)' : 'var(--danger)', color: toast.type === 'success' ? '#000' : '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, boxShadow: 'var(--shadow)', animation: 'fadeIn .2s ease' }}>
          {toast.msg}
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  )
}