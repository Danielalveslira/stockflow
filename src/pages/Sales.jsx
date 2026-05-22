import { useState, useCallback } from 'react'
import { useStore } from '../store/useStore'
import PageHeader from '../components/layout/PageHeader'
import BarcodeInput from '../components/barcode/BarcodeInput'
import { fmt } from '../utils/format'

function CartItem({ item, onQty, onRemove }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0', borderBottom: '1px solid var(--border)',
    }}>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 500, fontSize: 13 }}>{item.name}</p>
        <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.barcode}</p>
      </div>

      {/* Qty controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button className="btn-icon" onClick={() => onQty(item.productId, item.qty - 1)}
          style={{ width: 26, height: 26, border: '1px solid var(--border)', borderRadius: 6 }}>
          −
        </button>
        <span style={{ minWidth: 24, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{item.qty}</span>
        <button className="btn-icon" onClick={() => onQty(item.productId, item.qty + 1)}
          style={{ width: 26, height: 26, border: '1px solid var(--border)', borderRadius: 6 }}>
          +
        </button>
      </div>

      {/* Subtotal */}
      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 600, minWidth: 80, textAlign: 'right' }}>
        {fmt(item.qty * item.price)}
      </span>

      {/* Remove */}
      <button className="btn-icon" onClick={() => onRemove(item.productId)}
        style={{ color: 'var(--danger)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}

export default function Sales() {
  const findByBarcode = useStore((s) => s.findByBarcode)
  const addSale = useStore((s) => s.addSale)

  const [barcodeInput, setBarcodeInput] = useState('')
  const [cart, setCart] = useState([])
  const [toast, setToast] = useState(null) // { type: 'success'|'error', msg }
  const [done, setDone] = useState(false)

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 2500)
  }

  const handleScan = useCallback((code) => {
    const product = findByBarcode(code)

    if (!product) {
      showToast('error', `Produto não encontrado: ${code}`)
      return
    }
    if (product.qty === 0) {
      showToast('error', `"${product.name}" está sem estoque!`)
      return
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        if (existing.qty >= product.qty) {
          showToast('error', `Estoque insuficiente (${product.qty} disponível)`)
          return prev
        }
        return prev.map((i) => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i)
      }
      showToast('success', `"${product.name}" adicionado`)
      return [...prev, {
        productId: product.id,
        name: product.name,
        barcode: product.barcode,
        price: product.price,
        qty: 1,
        maxQty: product.qty,
      }]
    })
    setBarcodeInput('')
  }, [findByBarcode])

  const handleQty = (productId, newQty) => {
    if (newQty <= 0) {
      setCart((p) => p.filter((i) => i.productId !== productId))
      return
    }
    setCart((p) => p.map((i) => {
      if (i.productId !== productId) return i
      if (newQty > i.maxQty) { showToast('error', `Estoque máximo: ${i.maxQty}`); return i }
      return { ...i, qty: newQty }
    }))
  }

  const total = cart.reduce((s, i) => s + i.qty * i.price, 0)
  const totalItems = cart.reduce((s, i) => s + i.qty, 0)

  const handleFinalize = () => {
    if (!cart.length) return
    addSale(cart)
    setCart([])
    setDone(true)
    setTimeout(() => setDone(false), 3000)
    showToast('success', 'Venda registrada com sucesso!')
  }

  return (
    <div className="page">
      <PageHeader
        title="Caixa"
        subtitle="Escaneie os produtos para iniciar a venda"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* Left: scanner + cart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Scanner input */}
          <div className="card">
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Escanear produto
            </p>
            <BarcodeInput
              value={barcodeInput}
              onChange={setBarcodeInput}
              onScan={handleScan}
              placeholder="Aponte o leitor ou use a câmera..."
            />
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
              Leitor USB: aponte e escaneie • Câmera: clique no ícone à direita
            </p>
          </div>

          {/* Cart */}
          <div className="card">
            <p style={{ fontWeight: 600, marginBottom: 4 }}>
              Carrinho
              {cart.length > 0 && (
                <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-3)' }}>
                  {totalItems} item(s)
                </span>
              )}
            </p>

            {cart.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-3)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: .3, marginBottom: 8 }}>
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <p style={{ fontSize: 13 }}>Carrinho vazio</p>
              </div>
            ) : (
              <div>
                {cart.map((item) => (
                  <CartItem
                    key={item.productId}
                    item={item}
                    onQty={handleQty}
                    onRemove={(id) => setCart((p) => p.filter((i) => i.productId !== id))}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: totals + finalize */}
        <div className="card" style={{ position: 'sticky', top: 0 }}>
          <p style={{ fontWeight: 600, marginBottom: 16 }}>Resumo</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cart.map((i) => (
              <div key={i.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-2)' }}>{i.name} ×{i.qty}</span>
                <span style={{ fontFamily: 'DM Mono, monospace' }}>{fmt(i.qty * i.price)}</span>
              </div>
            ))}
          </div>

          {cart.length > 0 && <div className="divider" style={{ margin: '14px 0' }} />}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Total</span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>
              {fmt(total)}
            </span>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleFinalize}
            disabled={cart.length === 0}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14, opacity: cart.length === 0 ? .4 : 1 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Finalizar venda
          </button>

          {cart.length > 0 && (
            <button
              className="btn btn-ghost"
              onClick={() => setCart([])}
              style={{ width: '100%', justifyContent: 'center', marginTop: 8, fontSize: 13 }}
            >
              Limpar carrinho
            </button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 200,
          background: toast.type === 'success' ? 'var(--primary)' : 'var(--danger)',
          color: toast.type === 'success' ? '#000' : '#fff',
          padding: '10px 18px', borderRadius: 8,
          fontSize: 13, fontWeight: 500,
          boxShadow: 'var(--shadow)',
          animation: 'fadeIn .2s ease',
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }`}</style>
    </div>
  )
}
