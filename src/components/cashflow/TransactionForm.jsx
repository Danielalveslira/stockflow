import { useState } from 'react'

const CATEGORIES = {
  income: ['Vendas', 'Serviços', 'Investimento', 'Outros'],
  expense: ['Compras', 'Operacional', 'Salários', 'Marketing', 'Outros'],
}

const EMPTY = { type: 'income', description: '', category: '', amount: '', date: '', responsible: '' }

function Field({ label, error, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}

export default function TransactionForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY, date: new Date().toISOString().split('T')[0] })
  const [errors, setErrors] = useState({})

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const err = {}
    if (!form.description.trim()) err.description = 'Obrigatório'
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) err.amount = 'Valor inválido'
    if (!form.date) err.date = 'Obrigatório'
    return err
  }

  const handleSubmit = () => {
    const err = validate()
    if (Object.keys(err).length) { setErrors(err); return }
    onSave({ ...form, amount: Number(form.amount) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Type toggle */}
      <div style={{ display: 'flex', gap: 8 }}>
        {['income', 'expense'].map((type) => (
          <button
            key={type}
            className={form.type === type ? 'btn btn-primary' : 'btn btn-ghost'}
            onClick={() => setForm((f) => ({ ...f, type, category: '' }))}
          >
            {type === 'income' ? '↑ Receita' : '↓ Despesa'}
          </button>
        ))}
      </div>

      <div className="grid-2">
        <Field label="Descrição *" error={errors.description}>
          <input className={`input ${errors.description ? 'input-error' : ''}`} value={form.description}
            onChange={set('description')} placeholder="Descrição da transação" />
        </Field>
        <Field label="Categoria">
          <select className="input" value={form.category} onChange={set('category')}>
            <option value="">Selecionar...</option>
            {CATEGORIES[form.type].map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Valor (R$) *" error={errors.amount}>
          <input className={`input ${errors.amount ? 'input-error' : ''}`} type="number"
            min="0" step="0.01" value={form.amount} onChange={set('amount')} placeholder="0,00" />
        </Field>
        <Field label="Data *" error={errors.date}>
          <input className={`input ${errors.date ? 'input-error' : ''}`} type="date"
            value={form.date} onChange={set('date')} />
        </Field>
        <Field label="Responsável">
          <input className="input" value={form.responsible} onChange={set('responsible')} placeholder="Nome" />
        </Field>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSubmit}>Registrar</button>
      </div>
    </div>
  )
}
