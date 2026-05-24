import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import PageHeader from '../components/layout/PageHeader'
import ProductTable from '../components/inventory/ProductTable'
import ProductForm from '../components/inventory/ProductForm'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { getExpiryStatus, calcForecast } from '../utils/inventoryAnalytics'
import { fmt } from '../utils/format'

function ExpiryAlert({ products }) {
  const expiring = useMemo(() =>
    products
      .filter((p) => {
        const s = getExpiryStatus(p.expiryDate)
        return s && s.status !== 'ok'
      })
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)),
    [products]
  )

  if (expiring.length === 0) return null

  return (
    <div className="card" style={{ borderColor: 'var(--warning)', borderWidth: 1.5 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--warning)' }}>
          {expiring.length} produto(s) com validade próxima ou vencida
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {expiring.map((p) => {
          const s = getExpiryStatus(p.expiryDate)
          return (
            <div key={p.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px', background: 'var(--bg-3)', borderRadius: 8,
            }}>
              <div>
                <p style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
                  {p.qty} un. em estoque · Validade: {new Date(p.expiryDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Badge variant={s.status === 'expired' ? 'danger' : 'warning'}>
                {s.status === 'expired' ? 'Vencido' : `Vence em ${s.daysLeft}d`}
              </Badge>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ForecastAlert({ products, transactions }) {
  const suggestions = useMemo(() =>
    products
      .filter((p) => p.qty <= (p.minQty ?? 0) * 1.5 || p.qty === 0)
      .map((p) => ({ ...p, suggested: calcForecast(p, transactions) }))
      .slice(0, 4),
    [products, transactions]
  )

  if (suggestions.length === 0) return null

  return (
    <div className="card">
      <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
        💡 Sugestões de reposição
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {suggestions.map((p) => (
          <div key={p.id} style={{
            padding: '10px 12px', background: 'var(--bg-3)',
            borderRadius: 8, border: '1px solid var(--border)',
          }}>
            <p style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>{p.name}</p>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>
              {p.qty} un. em estoque
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Sugestão próx. pedido</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--info)', fontFamily: 'DM Mono, monospace' }}>
                {p.suggested} un.
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Inventory() {
  const products      = useStore((s) => s.products)
  const transactions  = useStore((s) => s.transactions)
  const addProduct    = useStore((s) => s.addProduct)
  const updateProduct = useStore((s) => s.updateProduct)
  const deleteProduct = useStore((s) => s.deleteProduct)

  const [modal, setModal] = useState(null)

  const handleSave = (data) => {
    if (modal?.editing) updateProduct(modal.editing.id, data)
    else addProduct(data)
    setModal(null)
  }

  return (
    <div className="page">
      <PageHeader
        title="Estoque"
        subtitle={`${products.length} produto(s) cadastrado(s)`}
        action={
          <button className="btn btn-primary" onClick={() => setModal('add')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo produto
          </button>
        }
      />

      {/* Alertas de validade */}
      <ExpiryAlert products={products} />

      {/* Sugestões de reposição */}
      <ForecastAlert products={products} transactions={transactions} />

      {/* Tabela */}
      <div className="card">
        <ProductTable
          products={products}
          transactions={transactions}
          onEdit={(p) => setModal({ editing: p })}
          onDelete={deleteProduct}
        />
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.editing ? 'Editar produto' : 'Novo produto'}
        width={580}
      >
        <ProductForm
          initial={modal?.editing ?? null}
          onSave={handleSave}
          onCancel={() => setModal(null)}
        />
      </Modal>
    </div>
  )
}