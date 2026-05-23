import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useStore } from '../store/useStore'
import PageHeader from '../components/layout/PageHeader'
import BarcodeInput from '../components/barcode/BarcodeInput'
import { fmt } from '../utils/format'

const PAYMENTS = [
  { key: 'dinheiro', label: 'Dinheiro' },
  { key: 'pix',     label: 'PIX'     },
  { key: 'debito',  label: 'Débito'  },
  { key: 'credito', label: 'Crédito' },
]

const PAYMENT_ICONS = {
  dinheiro: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg>,
  pix:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m4.5 4.5 15 15M4.5 19.5l15-15"/></svg>,
  debito:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  credito:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
}

/* ── Busca por nome ──────────────────────────────────── */
function ProductSearch({ onSelect }) {
  const products = useStore((s) => s.products)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  const results = useMemo(() => {
    if (query.length < 2) return []
    return products
      .filter((p) => p.qty > 0 && p.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6)
  }, [products, query])

  useEffect(() => {
    const handler = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div className="search-wrap">
        <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="input"
          value={query}
          placeholder="Buscar produto por nome..."
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden',
        }}>
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => { onSelect(p); setQuery(''); setOpen(false) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: 'transparent', cursor: 'pointer',
                borderBottom: '1px solid var(--border)', transition: 'background .1s',
                color: 'var(--text)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{p.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>{p.category} · {p.qty} em estoque</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', fontFamily: 'DM Mono, monospace' }}>
                {fmt(p.price)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Item do carrinho ────────────────────────────────── */
function CartRow({ item, selected, onSelect, onQty, onRemove }) {
  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 14px',
        background: selected ? 'var(--primary-dim)' : 'transparent',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer', transition: 'background .12s',
        borderLeft: selected ? '2px solid var(--primary)' : '2px solid transparent',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>
          {fmt(item.price)} / un.
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button className="btn-icon"
          onClick={(e) => { e.stopPropagation(); onQty(item.productId, item.qty - 1) }}
          style={{ width: 26, height: 26, border: '1px solid var(--border)', borderRadius: 6, fontSize: 16 }}>−</button>
        <input
          type="number" min="1" value={item.qty}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const v = parseInt(e.target.value)
            if (!isNaN(v)) onQty(item.productId, v)
          }}
          onKeyDown={(e) => e.stopPropagation()}
          style={{
            width: 40, textAlign: 'center', fontSize: 14, fontWeight: 600,
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '3px 4px', color: 'var(--text)',
          }}
        />
        <button className="btn-icon"
          onClick={(e) => { e.stopPropagation(); onQty(item.productId, item.qty + 1) }}
          style={{ width: 26, height: 26, border: '1px solid var(--border)', borderRadius: 6, fontSize: 16 }}>+</button>
      </div>
      <span style={{ minWidth: 72, textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 600 }}>
        {fmt(item.qty * item.price)}
      </span>
      <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onRemove(item.productId) }}
        style={{ color: 'var(--danger)', flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}

/* ── Página principal ────────────────────────────────── */
export default function Sales() {
  const findByBarcode = useStore((s) => s.findByBarcode)
  const addSale       = useStore((s) => s.addSale)
  const transactions  = useStore((s) => s.transactions)
  const products      = useStore((s) => s.products)

  const [barcodeInput, setBarcodeInput] = useState('')
  const [cart, setCart] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('dinheiro')
  const [received, setReceived] = useState('')
  const [discount, setDiscount] = useState({ mode: '%', value: '' })
  const [toast, setToast] = useState(null)
  const [finishing, setFinishing] = useState(false)

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 2500)
  }

  /* ── Adiciona produto ao carrinho ── */
  const addToCart = useCallback((product) => {
    if (!product) { showToast('error', 'Produto não encontrado'); return }
    if (product.qty === 0) { showToast('error', `"${product.name}" sem estoque`); return }

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        if (existing.qty >= product.qty) {
          showToast('error', `Estoque máximo: ${product.qty}`)
          return prev
        }
        return prev.map((i) => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i)
      }
      showToast('success', `"${product.name}" adicionado`)
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1, maxQty: product.qty }]
    })
    setBarcodeInput('')
  }, [])

  const handleScan = useCallback((code) => {
    const product = findByBarcode(code)
    if (!product) {
      // Tenta busca parcial por nome
      const byName = products.find((p) => p.name.toLowerCase() === code.toLowerCase())
      addToCart(byName ?? null)
    } else {
      addToCart(product)
    }
  }, [findByBarcode, products, addToCart])

  const handleQty = (productId, newQty) => {
    if (newQty <= 0) { setCart((p) => p.filter((i) => i.productId !== productId)); return }
    setCart((p) => p.map((i) => {
      if (i.productId !== productId) return i
      if (newQty > i.maxQty) { showToast('error', `Máximo: ${i.maxQty}`); return i }
      return { ...i, qty: newQty }
    }))
  }

  /* ── Cálculos ── */
  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.qty * i.price, 0), [cart])

  const discountAmount = useMemo(() => {
    const v = Number(discount.value) || 0
    if (!v) return 0
    return discount.mode === '%' ? (subtotal * v) / 100 : Math.min(v, subtotal)
  }, [subtotal, discount])

  const total = Math.max(0, subtotal - discountAmount)
  const receivedNum = Number(received) || 0
  const change = paymentMethod === 'dinheiro' && receivedNum > 0 ? receivedNum - total : 0
  const insufficientPayment = paymentMethod === 'dinheiro' && received !== '' && receivedNum < total

  /* ── Finalizar venda ── */
  const handleFinalize = useCallback(async () => {
    if (!cart.length || finishing) return
    setFinishing(true)
    try {
      await addSale(cart, paymentMethod, discountAmount)
      setCart([])
      setSelectedId(null)
      setReceived('')
      setDiscount({ mode: '%', value: '' })
      showToast('success', 'Venda finalizada!')
    } catch (e) {
      console.error('[Sales] Erro ao finalizar:', e)
      showToast('error', 'Erro ao finalizar venda. Tente novamente.')
    } finally {
      setFinishing(false)
    }
  }, [cart, paymentMethod, discountAmount, addSale, finishing])

  /* ── Atalhos de teclado ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F2') { e.preventDefault(); handleFinalize() }
      if (e.key === 'Escape') { setCart([]); setSelectedId(null) }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && document.activeElement.tagName !== 'INPUT') {
        setCart((p) => p.filter((i) => i.productId !== selectedId))
        setSelectedId(null)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleFinalize, selectedId])

  /* ── Histórico do dia ── */
  const todayStr = new Date().toISOString().split('T')[0]
  const todaySales = useMemo(() =>
    transactions.filter((t) => t.date === todayStr && t.category === 'Vendas')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10),
    [transactions, todayStr]
  )
  const todayTotal = todaySales.reduce((s, t) => s + t.amount, 0)

  const paymentLabel = { dinheiro: 'Din.', pix: 'PIX', debito: 'Déb.', credito: 'Cré.' }

  return (
    <div className="page">
      <PageHeader
        title="Caixa"
        subtitle={
          <span>
            <kbd style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', fontSize: 11, fontFamily: 'DM Mono, monospace' }}>F2</kbd> finalizar ·{' '}
            <kbd style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', fontSize: 11, fontFamily: 'DM Mono, monospace' }}>Esc</kbd> limpar ·{' '}
            <kbd style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', fontSize: 11, fontFamily: 'DM Mono, monospace' }}>Del</kbd> remover item
          </span>
        }
      />

      <div className="sales-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>

        {/* ── COLUNA ESQUERDA ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Inputs */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <BarcodeInput value={barcodeInput} onChange={setBarcodeInput} onScan={handleScan}
              placeholder="Código de barras — aponte o leitor ou use a câmera..." />
            <div style={{ height: 1, background: 'var(--border)' }} />
            <ProductSearch onSelect={addToCart} />
          </div>

          {/* Carrinho */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Carrinho</span>
              {cart.length > 0 && (
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {cart.reduce((s, i) => s + i.qty, 0)} item(s)
                </span>
              )}
            </div>

            {cart.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-3)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: .25, marginBottom: 8 }}>
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <p style={{ fontSize: 13 }}>Escaneie ou busque um produto</p>
              </div>
            ) : (
              <div>
                {cart.map((item) => (
                  <CartRow
                    key={item.productId}
                    item={item}
                    selected={selectedId === item.productId}
                    onSelect={() => setSelectedId(item.productId === selectedId ? null : item.productId)}
                    onQty={handleQty}
                    onRemove={(id) => { setCart((p) => p.filter((i) => i.productId !== id)); if (selectedId === id) setSelectedId(null) }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── COLUNA DIREITA ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Totais + pagamento */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Subtotal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-2)' }}>
              <span>Subtotal</span>
              <span style={{ fontFamily: 'DM Mono, monospace' }}>{fmt(subtotal)}</span>
            </div>

            {/* Desconto */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em' }}>Desconto</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['%', 'R$'].map((m) => (
                    <button key={m} onClick={() => setDiscount((d) => ({ ...d, mode: m }))}
                      style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                        background: discount.mode === m ? 'var(--primary)' : 'var(--bg-3)',
                        color: discount.mode === m ? '#000' : 'var(--text-3)',
                        border: 'none', cursor: 'pointer',
                      }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <input
                className="input"
                type="number"
                min="0"
                value={discount.value}
                onChange={(e) => setDiscount((d) => ({ ...d, value: e.target.value }))}
                placeholder={discount.mode === '%' ? '0%' : 'R$ 0,00'}
                style={{ fontSize: 13 }}
              />
              {discountAmount > 0 && (
                <span style={{ fontSize: 12, color: 'var(--danger)', textAlign: 'right' }}>
                  − {fmt(discountAmount)}
                </span>
              )}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600 }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)', fontFamily: 'DM Mono, monospace' }}>
                {fmt(total)}
              </span>
            </div>

            {/* Formas de pagamento */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {PAYMENTS.map(({ key, label }) => (
                <button key={key} onClick={() => { setPaymentMethod(key); setReceived('') }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    border: paymentMethod === key ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    background: paymentMethod === key ? 'var(--primary-dim)' : 'var(--bg-3)',
                    color: paymentMethod === key ? 'var(--primary)' : 'var(--text-2)',
                    transition: 'all .15s',
                  }}>
                  {PAYMENT_ICONS[key]}
                  {label}
                </button>
              ))}
            </div>

            {/* Troco (só Dinheiro) */}
            {paymentMethod === 'dinheiro' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="field">
                  <label>Valor recebido <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(vazio = valor exato)</span></label>
                  <input className="input" type="number" min="0" step="0.01"
                    value={received} onChange={(e) => setReceived(e.target.value)}
                    placeholder={total > 0 ? `R$ ${total.toFixed(2).replace('.', ',')}` : 'R$ 0,00'}
                    style={{ fontSize: 13 }} />
                </div>
                {received !== '' && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px',
                    background: insufficientPayment ? 'var(--danger-dim)' : 'var(--primary-dim)',
                    borderRadius: 8,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: insufficientPayment ? 'var(--danger)' : 'var(--primary)' }}>
                      {insufficientPayment ? 'Falta' : 'Troco'}
                    </span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 700, color: insufficientPayment ? 'var(--danger)' : 'var(--primary)' }}>
                      {insufficientPayment ? fmt(total - receivedNum) : fmt(change)}
                    </span>
                  </div>
                )}
                {received === '' && total > 0 && (
                  <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
                    Deixe vazio para cobrar o valor exato
                  </p>
                )}
              </div>
            )}

            {/* Botão finalizar */}
            <button
              className="btn btn-primary"
              onClick={handleFinalize}
              disabled={!cart.length || finishing || insufficientPayment}
              style={{
                width: '100%', justifyContent: 'center', padding: '12px',
                fontSize: 14, fontWeight: 600, opacity: !cart.length ? .4 : 1,
              }}
            >
              {finishing ? 'Finalizando...' : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Finalizar venda
                  <kbd style={{ marginLeft: 6, background: '#00000020', borderRadius: 4, padding: '1px 5px', fontSize: 11 }}>F2</kbd>
                </>
              )}
            </button>

            {cart.length > 0 && (
              <button className="btn btn-ghost" onClick={() => { setCart([]); setSelectedId(null) }}
                style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
                Limpar carrinho <kbd style={{ marginLeft: 4, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontFamily: 'DM Mono, monospace' }}>Esc</kbd>
              </button>
            )}
          </div>

          {/* Histórico do dia */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Vendas hoje</span>
              <span style={{ fontSize: 13, color: 'var(--primary)', fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>
                {fmt(todayTotal)}
              </span>
            </div>
            {todaySales.length === 0 ? (
              <p style={{ padding: '16px 14px', fontSize: 12, color: 'var(--text-3)' }}>Nenhuma venda hoje ainda.</p>
            ) : (
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {todaySales.map((t) => (
                  <div key={t.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 14px', borderBottom: '1px solid var(--border)', fontSize: 12,
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-2)', fontFamily: 'DM Mono, monospace' }}>
                        {t.createdAt ? new Date(t.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                      <span style={{
                        marginLeft: 8, fontSize: 10, fontWeight: 600, padding: '1px 6px',
                        borderRadius: 99, background: 'var(--bg-3)', color: 'var(--text-3)',
                      }}>
                        {paymentLabel[t.paymentMethod] ?? t.paymentMethod}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--primary)', fontWeight: 600 }}>
                      {fmt(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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