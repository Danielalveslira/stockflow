import { useState } from 'react'
import { calcMargin } from '../../utils/format'
import BarcodeInput from '../barcode/BarcodeInput'

const EMPTY = { name: '', category: '', responsible: '', qty: '', minQty: '', cost: '', price: '', barcode: '', expiryDate: '', leadTimeDays: '3' }

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
  const [form, setForm] = useState(initial
    ? { ...initial, expiryDate: initial.expiryDate ?? '', leadTimeDays: initial.leadTimeDays ?? '3' }
    : EMPTY
  )
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
      qty:          Number(form.qty)          || 0,
      minQty:       Number(form.minQty)       || 0,
      cost:         Number(form.cost)         || 0,
      price:        Number(form.price)        || 0,
      leadTimeDays: Number(form.leadTimeDays) || 3,
      expiryDate:   form.expiryDate || null,
    })
  }

  const margin = calcMargin(form.cost, form.price)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Básico */}
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Informações básicas</p>
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
            <BarcodeInput value={form.barcode}
              onChange={(v) => setForm((f) => ({ ...f, barcode: v }))}
              onScan={(code) => setForm((f) => ({ ...f, barcode: code }))}
              placeholder="Escanear ou digitar..." />
          </Field>
        </div>
      </div>

      {/* Estoque */}
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Estoque</p>
        <div className="grid-2">
          <Field label="Qtd. atual">
            <input className="input" type="number" min="0" value={form.qty} onChange={set('qty')} placeholder="0" />
          </Field>
          <Field label="Estoque mínimo (alerta)">
            <input className="input" type="number" min="0" value={form.minQty} onChange={set('minQty')} placeholder="0" />
          </Field>
          <Field label="Prazo do fornecedor (dias)"
            >
            <input className="input" type="number" min="1" value={form.leadTimeDays} onChange={set('leadTimeDays')} placeholder="3" />
          </Field>
          <Field label="Data de validade">
            <input className="input" type="date" value={form.expiryDate ?? ''} onChange={set('expiryDate')} />
          </Field>
        </div>
      </div>

      {/* Preços */}
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Preços</p>
        <div className="grid-2">
          <Field label="Custo (R$)">
            <input className="input" type="number" min="0" step="0.01" value={form.cost} onChange={set('cost')} placeholder="0,00" />
          </Field>
          <Field label="Preço de venda (R$)">
            <input className="input" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="0,00" />
          </Field>
          <div className="field">
            <label>Margem estimada</label>
            <div className="input" style={{ color: margin > 0 ? 'var(--primary)' : 'var(--text-3)', fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>
              {margin}%
            </div>
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