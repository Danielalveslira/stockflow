import { useState } from 'react'
import { useStore } from '../store/useStore'
import PageHeader from '../components/layout/PageHeader'
import ProductTable from '../components/inventory/ProductTable'
import ProductForm from '../components/inventory/ProductForm'
import Modal from '../components/ui/Modal'

export default function Inventory() {
  const products = useStore((s) => s.products)
  const addProduct = useStore((s) => s.addProduct)
  const updateProduct = useStore((s) => s.updateProduct)
  const deleteProduct = useStore((s) => s.deleteProduct)

  const [modal, setModal] = useState(null) // null | 'add' | { editing: product }

  const handleSave = (data) => {
    if (modal?.editing) {
      updateProduct(modal.editing.id, data)
    } else {
      addProduct(data)
    }
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

      <div className="card">
        <ProductTable
          products={products}
          onEdit={(p) => setModal({ editing: p })}
          onDelete={deleteProduct}
        />
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.editing ? 'Editar produto' : 'Novo produto'}
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
