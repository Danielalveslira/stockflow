import { useState } from 'react'
import { useStore } from '../store/useStore'
import PageHeader from '../components/layout/PageHeader'
import Modal from '../components/ui/Modal'
import Avatar from '../components/ui/Avatar'
import EmptyState from '../components/ui/EmptyState'

const EMPTY = { name: '', phone: '', email: '', cnpj: '', notes: '' }

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  )
}

function SupplierForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nome é obrigatório'); return }
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="grid-2">
        <Field label="Nome *">
          <input className="input" value={form.name} onChange={set('name')} placeholder="Nome do fornecedor" />
        </Field>
        <Field label="Telefone">
          <input className="input" value={form.phone} onChange={set('phone')} placeholder="(11) 99999-9999" />
        </Field>
        <Field label="Email">
          <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="contato@fornecedor.com" />
        </Field>
        <Field label="CNPJ">
          <input className="input" value={form.cnpj} onChange={set('cnpj')} placeholder="00.000.000/0001-00" />
        </Field>
      </div>
      <Field label="Observações">
        <textarea className="input" value={form.notes} onChange={set('notes')}
          placeholder="Condições de pagamento, prazo de entrega..." rows={3}
          style={{ resize: 'vertical' }} />
      </Field>
      {error && <p style={{ fontSize: 13, color: 'var(--danger)', background: 'var(--danger-dim)', padding: '8px 12px', borderRadius: 6 }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : (initial ? 'Salvar alterações' : 'Cadastrar fornecedor')}
        </button>
      </div>
    </div>
  )
}

export default function Suppliers() {
  const suppliers      = useStore((s) => s.suppliers)
  const addSupplier    = useStore((s) => s.addSupplier)
  const updateSupplier = useStore((s) => s.updateSupplier)
  const deleteSupplier = useStore((s) => s.deleteSupplier)
  const [modal, setModal] = useState(null)

  const handleSave = async (data) => {
    if (modal?.editing) await updateSupplier(modal.editing.id, data)
    else await addSupplier(data)
    setModal(null)
  }

  return (
    <div className="page">
      <PageHeader
        title="Fornecedores"
        subtitle={`${suppliers.length} fornecedor(es) cadastrado(s)`}
        action={
          <button className="btn btn-primary" onClick={() => setModal('add')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo fornecedor
          </button>
        }
      />

      {suppliers.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Nenhum fornecedor"
            message="Cadastre seus fornecedores para agilizar os pedidos de compra."
            action={<button className="btn btn-primary" onClick={() => setModal('add')}>Cadastrar fornecedor</button>}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {suppliers.map((s) => (
            <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar name={s.name} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</p>
                <div style={{ display: 'flex', gap: 16, marginTop: 3, flexWrap: 'wrap' }}>
                  {s.phone && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>📞 {s.phone}</span>}
                  {s.email && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>✉ {s.email}</span>}
                  {s.cnpj  && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>CNPJ: {s.cnpj}</span>}
                </div>
                {s.notes && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{s.notes}</p>}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button className="btn-icon" onClick={() => setModal({ editing: s })} title="Editar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button className="btn-icon" onClick={() => deleteSupplier(s.id)} title="Excluir"
                  style={{ color: 'var(--danger)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.editing ? 'Editar fornecedor' : 'Novo fornecedor'}
        width={560}
      >
        <SupplierForm
          initial={modal?.editing ?? null}
          onSave={handleSave}
          onCancel={() => setModal(null)}
        />
      </Modal>
    </div>
  )
}