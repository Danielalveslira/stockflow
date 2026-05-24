import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import PageHeader from '../components/layout/PageHeader'
import Modal from '../components/ui/Modal'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { fmt, fmtDate } from '../utils/format'

/* ── Formulário de cliente ─────────────────────── */
function CustomerForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? { name: '', phone: '', notes: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nome obrigatório'); return }
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="grid-2">
        <div className="field">
          <label>Nome *</label>
          <input className="input" value={form.name} onChange={set('name')} placeholder="Nome do cliente" autoFocus />
        </div>
        <div className="field">
          <label>Telefone</label>
          <input className="input" value={form.phone} onChange={set('phone')} placeholder="(11) 99999-9999" />
        </div>
      </div>
      <div className="field">
        <label>Observações</label>
        <input className="input" value={form.notes} onChange={set('notes')} placeholder="Ex: cliente frequente, preferências..." />
      </div>
      {error && <p style={{ fontSize: 13, color: 'var(--danger)', background: 'var(--danger-dim)', padding: '8px 12px', borderRadius: 6 }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : initial ? 'Salvar' : 'Cadastrar cliente'}
        </button>
      </div>
    </div>
  )
}

/* ── Modal de recebimento ──────────────────────── */
function PayDebtModal({ debt, onPay, onClose }) {
  const remaining = debt.amount - (debt.paid_amount ?? 0)
  const [partial, setPartial] = useState('')
  const [saving,  setSaving]  = useState(false)

  const handlePay = async (amount) => {
    setSaving(true)
    await onPay(amount)
    setSaving(false)
    onClose()
  }

  const partialNum  = Number(partial) || 0
  const partialValid = partialNum > 0 && partialNum < remaining

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Resumo */}
      <div style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '16px' }}>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>Valor em aberto</p>
        <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--danger)', fontFamily: 'DM Mono, monospace' }}>
          {fmt(remaining)}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6, wordBreak: 'break-word' }} title={debt.description}>
          {debt.description} · {fmtDate(debt.sale_date)}
        </p>
      </div>

      {/* Pagar tudo */}
      <button
        className="btn btn-primary"
        onClick={() => handlePay(remaining)}
        disabled={saving}
        style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 14, fontWeight: 700 }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        {saving ? 'Registrando...' : `Pagou tudo — ${fmt(remaining)}`}
      </button>

      {/* Divisor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>ou pagamento parcial</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      {/* Parcial */}
      <div className="field">
        <label>Valor recebido agora</label>
        <input
          className="input"
          type="number" min="0.01" step="0.01"
          value={partial}
          onChange={(e) => setPartial(e.target.value)}
          placeholder="R$ 0,00"
        />
      </div>

      {partialValid && (
        <p style={{ fontSize: 12, color: 'var(--warning)', marginTop: -6 }}>
          Restará {fmt(remaining - partialNum)} após esse pagamento
        </p>
      )}

      <button
        className="btn btn-ghost"
        onClick={() => handlePay(partialNum)}
        disabled={saving || !partialValid}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        Registrar pagamento parcial
      </button>

      <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
        Qualquer recebimento é lançado no Fluxo de Caixa como receita de Fiado.
      </p>

      <button className="btn btn-ghost" onClick={onClose} style={{ width: '100%', justifyContent: 'center', color: 'var(--text-3)' }}>
        Cancelar
      </button>
    </div>
  )
}

/* ── Página principal ──────────────────────────── */
export default function Customers() {
  const customers      = useStore((s) => s.customers)
  const addCustomer    = useStore((s) => s.addCustomer)
  const updateCustomer = useStore((s) => s.updateCustomer)
  const deleteCustomer = useStore((s) => s.deleteCustomer)
  const payDebt        = useStore((s) => s.payDebt)

  const [modal,     setModal]     = useState(null)
  const [payModal,  setPayModal]  = useState(null)
  const [expanded,  setExpanded]  = useState(null)
  const [search,    setSearch]    = useState('')

  /* ── Total fiado ── */
  const totalDebt = useMemo(() =>
    customers.reduce((s, c) =>
      s + (c.debts ?? [])
        .filter((d) => d.status !== 'paid')
        .reduce((ds, d) => ds + (d.amount - (d.paid_amount ?? 0)), 0),
      0
    ), [customers]
  )

  /* ── Busca ── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.notes?.toLowerCase().includes(q)
    )
  }, [customers, search])

  const handleSave = async (data) => {
    if (modal?.editing) await updateCustomer(modal.editing.id, data)
    else await addCustomer(data)
    setModal(null)
  }

  return (
    <div className="page">
      <PageHeader
        title="Clientes"
        subtitle={`${customers.length} cliente(s) · ${fmt(totalDebt)} em fiado`}
        action={
          <button className="btn btn-primary" onClick={() => setModal('add')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo cliente
          </button>
        }
      />

      {/* Busca inteligente */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="search-wrap" style={{ flex: 1 }}>
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="input"
            placeholder="Buscar por nome, telefone ou observação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <button className="btn btn-ghost" onClick={() => setSearch('')} style={{ fontSize: 12, flexShrink: 0 }}>
            Limpar
          </button>
        )}
      </div>

      {search && (
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: -8 }}>
          {filtered.length} cliente(s) encontrado(s)
        </p>
      )}

      {/* Alerta de fiado */}
      {totalDebt > 0 && (
        <div className="card" style={{ borderColor: 'var(--warning)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--warning)' }}>Total em fiado em aberto</span>
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--warning)', fontFamily: 'DM Mono, monospace' }}>{fmt(totalDebt)}</span>
        </div>
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title={search ? 'Nenhum cliente encontrado' : 'Nenhum cliente'}
            message={search ? `Sem resultados para "${search}"` : 'Cadastre clientes para registrar vendas no fiado.'}
            action={!search ? <button className="btn btn-primary" onClick={() => setModal('add')}>Cadastrar cliente</button> : null}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((c) => {
            const openDebts = (c.debts ?? []).filter((d) => d.status !== 'paid')
            const totalOwed = openDebts.reduce((s, d) => s + (d.amount - (d.paid_amount ?? 0)), 0)
            const isExpanded = expanded === c.id

            return (
              <div key={c.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Header do cliente */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }}
                  onClick={() => setExpanded(isExpanded ? null : c.id)}
                >
                  <Avatar name={c.name} size={38} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {c.phone || 'Sem telefone'}{c.notes ? ` · ${c.notes}` : ''}
                    </p>
                  </div>

                  {totalOwed > 0 ? (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600 }}>FIADO</p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--danger)', fontFamily: 'DM Mono, monospace' }}>{fmt(totalOwed)}</p>
                    </div>
                  ) : (
                    <Badge variant="success">Em dia</Badge>
                  )}

                  <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <button className="btn-icon" onClick={() => setModal({ editing: c })}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button className="btn-icon" onClick={() => deleteCustomer(c.id)} style={{ color: 'var(--danger)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>

                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s', color: 'var(--text-3)' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>

                {/* Detalhes expandidos */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px' }}>
                    {openDebts.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Nenhum fiado em aberto.</p>
                    ) : (
                      <>
                        <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
                          Fiado em aberto
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {openDebts.map((d) => {
                            const remaining = d.amount - (d.paid_amount ?? 0)
                            return (
                              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 8 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  {/* Nome dos produtos com tooltip */}
                                  <p
                                    style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    title={d.description}
                                  >
                                    {d.description}
                                  </p>
                                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                                    {fmtDate(d.sale_date)}
                                    {d.status === 'partial' && ` · Pago parcial: ${fmt(d.paid_amount)} de ${fmt(d.amount)}`}
                                  </p>
                                </div>
                                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, color: 'var(--danger)', fontSize: 15, flexShrink: 0 }}>
                                  {fmt(remaining)}
                                </span>
                                <button
                                  className="btn btn-primary"
                                  style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}
                  onClick={() => setPayModal({ debt: d, customerId: c.id })}
                                >
                                  Receber
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}

                    {/* Histórico pago */}
                    {(c.debts ?? []).filter((d) => d.status === 'paid').length > 0 && (
                      <details style={{ marginTop: 14 }}>
                        <summary style={{ fontSize: 12, color: 'var(--text-3)', cursor: 'pointer', marginBottom: 8 }}>
                          Ver histórico pago ({(c.debts ?? []).filter((d) => d.status === 'paid').length})
                        </summary>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                          {(c.debts ?? []).filter((d) => d.status === 'paid').map((d) => (
                            <div key={d.id} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--border)',
                            }}>
                              <span style={{ color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}
                                title={d.description}>
                                {d.description} · {fmtDate(d.sale_date)}
                              </span>
                              <span style={{ color: 'var(--primary)', fontFamily: 'DM Mono, monospace', fontWeight: 600, flexShrink: 0 }}>
                                {fmt(d.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modais */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.editing ? 'Editar cliente' : 'Novo cliente'} width={480}>
        <CustomerForm initial={modal?.editing ?? null} onSave={handleSave} onCancel={() => setModal(null)} />
      </Modal>

      {payModal && (
        <Modal open onClose={() => setPayModal(null)} title="Receber pagamento de fiado" width={420}>
          <PayDebtModal
            debt={payModal.debt}
            onPay={(amount) => payDebt(payModal.debt.id, amount, payModal.customerId)}
            onClose={() => setPayModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}