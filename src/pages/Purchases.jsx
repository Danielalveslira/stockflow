import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import PageHeader from '../components/layout/PageHeader'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { fmt, fmtDate } from '../utils/format'

const STATUS = {
  pending:   { label: 'Aguardando',  variant: 'warning' },
  received:  { label: 'Recebido',    variant: 'success' },
  cancelled: { label: 'Cancelado',   variant: 'danger'  },
}

/* ── Formulário de novo pedido ────────────────── */
function PurchaseForm({ onSave, onCancel }) {
  const suppliers = useStore((s) => s.suppliers)
  const products  = useStore((s) => s.products)

  const [supplierId, setSupplierId] = useState('')
  const [date, setDate]   = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ productId: '', productName: '', qty: 1, cost: '' }])
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const addItem = () => setItems((p) => [...p, { productId: '', productName: '', qty: 1, cost: '' }])

  const setItem = (i, key, val) =>
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item))

  const removeItem = (i) => setItems((p) => p.filter((_, idx) => idx !== i))

  const handleProductChange = (i, productId) => {
    const product = products.find((p) => p.id === productId)
    setItems((prev) => prev.map((item, idx) => idx === i
      ? { ...item, productId, productName: product?.name ?? '', cost: product?.cost ?? '' }
      : item
    ))
  }

  const total = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.cost) || 0), 0)

  const handleSave = async () => {
    if (!items.length) { setError('Adicione ao menos um item'); return }
    const invalid = items.find((i) => !i.productName.trim() || !i.qty || !i.cost)
    if (invalid) { setError('Preencha todos os campos dos itens'); return }
    setSaving(true)
    try {
      await onSave({
        supplierId: supplierId || null,
        date, notes,
        items: items.map((i) => ({
          productId: i.productId || null,
          productName: i.productName,
          qty: Number(i.qty),
          cost: Number(i.cost),
        })),
      })
    } catch (e) {
      setError('Erro ao salvar pedido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="grid-2">
        <div className="field">
          <label>Fornecedor</label>
          <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">Selecionar...</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Data da compra</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {/* Itens */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Itens da compra
          </label>
          <button className="btn btn-ghost" onClick={addItem} style={{ fontSize: 12, padding: '4px 10px' }}>
            + Adicionar item
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 36px', gap: 8 }}>
            {['Produto', 'Qtd', 'Custo unit.', ''].map((h) => (
              <span key={h} style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</span>
            ))}
          </div>

          {items.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 36px', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <select className="input" value={item.productId}
                  onChange={(e) => handleProductChange(i, e.target.value)}
                  style={{ fontSize: 13 }}>
                  <option value="">Selecionar...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {!item.productId && (
                  <input className="input" value={item.productName}
                    onChange={(e) => setItem(i, 'productName', e.target.value)}
                    placeholder="Ou digitar nome..." style={{ fontSize: 12 }} />
                )}
              </div>
              <input className="input" type="number" min="1" value={item.qty}
                onChange={(e) => setItem(i, 'qty', e.target.value)}
                style={{ fontSize: 13, textAlign: 'center' }} />
              <input className="input" type="number" min="0" step="0.01" value={item.cost}
                onChange={(e) => setItem(i, 'cost', e.target.value)}
                placeholder="0,00" style={{ fontSize: 13 }} />
              <button className="btn-icon" onClick={() => removeItem(i)}
                style={{ color: 'var(--danger)', justifyContent: 'center' }}
                disabled={items.length === 1}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Total do pedido:</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)', fontFamily: 'DM Mono, monospace' }}>
            {fmt(total)}
          </span>
        </div>
      </div>

      <div className="field">
        <label>Observações</label>
        <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Prazo de entrega, forma de pagamento..." rows={2}
          style={{ resize: 'vertical' }} />
      </div>

      {error && <p style={{ fontSize: 13, color: 'var(--danger)', background: 'var(--danger-dim)', padding: '8px 12px', borderRadius: 6 }}>{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Criar pedido'}
        </button>
      </div>
    </div>
  )
}

/* ── Card de pedido ───────────────────────────── */
function PurchaseCard({ purchase, onReceive, onCancel }) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading]   = useState(false)
  const st = STATUS[purchase.status] ?? STATUS.pending

  const handleReceive = async () => {
    setLoading(true)
    try { await onReceive(purchase.id) }
    finally { setLoading(false) }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        onClick={() => setExpanded((v) => !v)}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 600, fontSize: 14 }}>
              {purchase.supplier?.name ?? 'Sem fornecedor'}
            </p>
            <Badge variant={st.variant}>{st.label}</Badge>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            {fmtDate(purchase.date)} · {purchase.items?.length ?? 0} item(s)
          </p>
        </div>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 15, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
          {fmt(purchase.total)}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s', color: 'var(--text-3)' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* Itens expandidos */}
      {expanded && (
        <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {(purchase.items ?? []).map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-2)' }}>
                  {item.product_name} <span style={{ color: 'var(--text-3)' }}>× {item.qty}</span>
                </span>
                <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-2)' }}>
                  {fmt(item.qty * item.cost)}
                </span>
              </div>
            ))}
          </div>
          {purchase.notes && (
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12, fontStyle: 'italic' }}>
              {purchase.notes}
            </p>
          )}

          {/* Ações */}
          {purchase.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleReceive} disabled={loading}
                style={{ fontSize: 13 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {loading ? 'Processando...' : 'Marcar como recebido'}
              </button>
              <button className="btn btn-ghost" onClick={() => onCancel(purchase.id)}
                style={{ fontSize: 13, color: 'var(--danger)' }}>
                Cancelar pedido
              </button>
            </div>
          )}
          {purchase.status === 'received' && (
            <p style={{ fontSize: 12, color: 'var(--primary)' }}>
              ✓ Estoque atualizado e despesa registrada automaticamente
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Página principal ─────────────────────────── */
export default function Purchases() {
  const purchases      = useStore((s) => s.purchases)
  const addPurchase    = useStore((s) => s.addPurchase)
  const receivePurchase = useStore((s) => s.receivePurchase)
  const cancelPurchase = useStore((s) => s.cancelPurchase)

  const [modal,  setModal]  = useState(false)
  const [filter, setFilter] = useState('all')
  const [toast,  setToast]  = useState(null)

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = useMemo(() =>
    filter === 'all' ? purchases : purchases.filter((p) => p.status === filter),
    [purchases, filter]
  )

  const handleReceive = async (id) => {
    try {
      await receivePurchase(id)
      showToast('success', 'Pedido recebido! Estoque e fluxo de caixa atualizados.')
    } catch {
      showToast('error', 'Erro ao processar recebimento.')
    }
  }

  const handleSave = async (data) => {
    await addPurchase(data)
    setModal(false)
    showToast('success', 'Pedido criado com sucesso!')
  }

  const totals = useMemo(() => ({
    pending:  purchases.filter((p) => p.status === 'pending').reduce((s, p) => s + p.total, 0),
    received: purchases.filter((p) => p.status === 'received').reduce((s, p) => s + p.total, 0),
    count:    purchases.filter((p) => p.status === 'pending').length,
  }), [purchases])

  const FILTERS = [
    { key: 'all',       label: 'Todos'      },
    { key: 'pending',   label: 'Aguardando' },
    { key: 'received',  label: 'Recebidos'  },
    { key: 'cancelled', label: 'Cancelados' },
  ]

  return (
    <div className="page">
      <PageHeader
        title="Compras"
        subtitle="Pedidos e gestão de fornecedores"
        action={
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo pedido
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid-3">
        {[
          { label: 'Em aberto', value: fmt(totals.pending), sub: `${totals.count} pedido(s)`, color: 'var(--warning)' },
          { label: 'Total comprado', value: fmt(totals.received), sub: 'pedidos recebidos', color: 'var(--primary)' },
          { label: 'Total de pedidos', value: purchases.length, sub: 'todos os status', color: 'var(--info)' },
        ].map((k) => (
          <div key={k.label} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>{k.label}</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{k.sub}</span>
          </div>
        ))}
      </div>

      {/* Filtros */}
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

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Nenhum pedido"
            message="Crie um pedido de compra para reabastecer o estoque."
            action={<button className="btn btn-primary" onClick={() => setModal(true)}>Novo pedido</button>}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((p) => (
            <PurchaseCard
              key={p.id}
              purchase={p}
              onReceive={handleReceive}
              onCancel={cancelPurchase}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Novo pedido de compra" width={620}>
        <PurchaseForm onSave={handleSave} onCancel={() => setModal(false)} />
      </Modal>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 200,
          background: toast.type === 'success' ? 'var(--primary)' : 'var(--danger)',
          color: toast.type === 'success' ? '#000' : '#fff',
          padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500,
          boxShadow: 'var(--shadow)', animation: 'fadeIn .2s ease',
        }}>
          {toast.msg}
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  )
}