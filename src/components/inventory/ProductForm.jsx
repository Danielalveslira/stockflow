import { useState } from 'react'
import { calcMargin } from '../../utils/format'
import BarcodeInput from '../barcode/BarcodeInput'

const EMPTY = { name: '', category: '', responsible: '', qty: '', minQty: '', cost: '', price: '', barcode: '' }

function Field({ label, error, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}

export default function ProductForm({ initial = null, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY)
  const [errors, setErrors] = useState({})

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const err = {}
    if (!form.name.trim()) err.name = 'Obrigatório'
    if (!form.responsible.trim()) err.responsible = 'Obrigatório'
    return err
  }

  const handleSubmit = () => {
    const err = validate()
    if (Object.keys(err).length) { setErrors(err); return }
    onSave({
      ...form,
      qty: Number(form.qty) || 0,
      minQty: Number(form.minQty) || 0,
      cost: Number(form.cost) || 0,
      price: Number(form.price) || 0,
    })
  }

  const margin = calcMargin(form.cost, form.price)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="grid-2">
        <Field label="Nome *" error={errors.name}>
          <input className={`input ${errors.name ? 'input-error' : ''}`} value={form.name}
            onChange={set('name')} placeholder="Nome do produto" />
        </Field>

        <Field label="Categoria">
          <input className="input" value={form.category} onChange={set('category')} placeholder="Ex: Bebidas" />
        </Field>

        <Field label="Responsável *" error={errors.responsible}>
          <input className={`input ${errors.responsible ? 'input-error' : ''}`} value={form.responsible}
            onChange={set('responsible')} placeholder="Nome do responsável" />
        </Field>

        <Field label="Código de barras">
          <BarcodeInput
            value={form.barcode}
            onChange={(v) => setForm((f) => ({ ...f, barcode: v }))}
            onScan={(code) => setForm((f) => ({ ...f, barcode: code }))}
            placeholder="Escanear ou digitar..."
          />
        </Field>

        <Field label="Estoque atual">
          <input className="input" type="number" min="0" value={form.qty} onChange={set('qty')} placeholder="0" />
        </Field>

        <Field label="Estoque mínimo">
          <input className="input" type="number" min="0" value={form.minQty} onChange={set('minQty')} placeholder="0" />
        </Field>

        <Field label="Custo (R$)">
          <input className="input" type="number" min="0" step="0.01" value={form.cost} onChange={set('cost')} placeholder="0,00" />
        </Field>

        <Field label="Preço de venda (R$)">
          <input className="input" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="0,00" />
        </Field>

        <div className="field" style={{ justifyContent: 'flex-end' }}>
          <label>Margem estimada</label>
          <div className="input" style={{
            color: margin > 0 ? 'var(--primary)' : 'var(--text-3)',
            fontFamily: 'DM Mono, monospace', fontWeight: 600,
          }}>
            {margin}%
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSubmit}>
          {initial ? 'Salvar alterações' : 'Adicionar produto'}
        </button>
      </div>
    </div>
  )
}
