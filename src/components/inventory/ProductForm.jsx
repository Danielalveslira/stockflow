import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { calcMargin } from '../../utils/format'
import BarcodeInput from '../barcode/BarcodeInput'

/* ── Categorias pré-definidas ─────────────────── */
const DEFAULT_CATEGORIES = [
  'Açougue', 'Aves e Ovos', 'Carnes', 'Frios e Embutidos',
  'Frutas', 'Legumes e Verduras', 'Padaria e Confeitaria',
  'Laticínios', 'Iogurtes', 'Queijos', 'Manteiga e Margarina',
  'Arroz e Feijão', 'Grãos e Cereais', 'Macarrão e Massas', 'Molhos e Temperos',
  'Azeite e Óleos', 'Farinhas e Misturas', 'Conservas', 'Enlatados',
  'Sopas e Caldos', 'Açúcar e Adoçantes', 'Sal', 'Café e Chá',
  'Achocolatados', 'Biscoitos e Bolachas', 'Pão de Forma', 'Snacks e Salgadinhos',
  'Chocolates e Doces', 'Sorvetes', 'Sobremesas',
  'Água', 'Refrigerantes', 'Sucos', 'Bebidas Energéticas',
  'Cervejas', 'Vinhos', 'Destilados', 'Bebidas Quentes',
  'Detergentes', 'Desinfetantes', 'Sabão', 'Limpadores Multiuso',
  'Cuidados com Roupa', 'Limpeza Banheiro', 'Limpeza Cozinha', 'Descartáveis',
  'Sabonetes', 'Shampoo e Condicionador', 'Creme e Loção', 'Desodorante',
  'Absorventes', 'Fraldas', 'Produtos Masculinos', 'Maquiagem e Perfumes',
  'Ração Cães', 'Ração Gatos', 'Pet Acessórios',
  'Bebê Alimentação', 'Bebê Higiene', 'Bebê Cuidados',
  'Materiais de Escritório', 'Pilhas e Eletrônicos', 'Outros',
]

/* ── Dropdown genérico (categoria e responsável) ─ */
function ComboField({ label, value, onChange, options, placeholder, error }) {
  const [query,  setQuery]  = useState(value ?? '')
  const [open,   setOpen]   = useState(false)
  const wrapRef             = useRef(null)

  // Sincroniza quando o form é resetado (edição → novo)
  useEffect(() => { setQuery(value ?? '') }, [value])

  // Fecha ao clicar fora
  useEffect(() => {
    const h = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const matches = options.filter((o) =>
    !query.trim() || o.toLowerCase().includes(query.toLowerCase())
  )

  const select = (opt) => {
    setQuery(opt)
    onChange(opt)
    setOpen(false)
  }

  return (
    <div className="field" ref={wrapRef} style={{ position: 'relative' }}>
      <label>{label}</label>
      <input
        className={`input ${error ? 'input-error' : ''}`}
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
      />
      {error && <span className="field-error">{error}</span>}

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
          maxHeight: 220, overflowY: 'auto', zIndex: 300,
        }}>
          {matches.length === 0 ? (
            <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-3)' }}>
              Nova opção: "{query}"
            </div>
          ) : (
            matches.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => select(opt)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '9px 14px', fontSize: 13, background: 'transparent',
                  color: opt === value ? 'var(--primary)' : 'var(--text-2)',
                  fontWeight: opt === value ? 600 : 400,
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer', transition: 'background .1s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {opt}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

/* ── Helper de campo ──────────────────────────── */
function Field({ label, error, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}

const EMPTY = {
  name: '', category: '', responsible: '', qty: '', minQty: '',
  cost: '', price: '', barcode: '', expiryDate: '', leadTimeDays: '3',
}

/* ── Formulário principal ─────────────────────── */
export default function ProductForm({ initial = null, onSave, onCancel }) {
  const products = useStore((s) => s.products)

  // Responsáveis já cadastrados no sistema (únicos, ordenados)
  const responsibles = [...new Set(products.map((p) => p.responsible).filter(Boolean))].sort()

  const [form, setForm] = useState(
    initial
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

      {/* ── Informações básicas ── */}
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>
          Informações básicas
        </p>
        <div className="grid-2">
          <Field label="Nome *" error={errors.name}>
            <input
              className={`input ${errors.name ? 'input-error' : ''}`}
              value={form.name}
              onChange={set('name')}
              placeholder="Nome do produto"
            />
          </Field>

          {/* Categoria com dropdown */}
          <ComboField
            label="CATEGORIA"
            value={form.category}
            onChange={(v) => setForm((f) => ({ ...f, category: v }))}
            options={DEFAULT_CATEGORIES}
            placeholder="Selecionar ou digitar nova..."
          />

          {/* Responsável com dropdown dinâmico */}
          <ComboField
            label="RESPONSÁVEL *"
            value={form.responsible}
            onChange={(v) => setForm((f) => ({ ...f, responsible: v }))}
            options={responsibles}
            placeholder="Selecionar ou digitar novo nome..."
            error={errors.responsible}
          />

          <Field label="Código de barras">
            <BarcodeInput
              value={form.barcode}
              onChange={(v) => setForm((f) => ({ ...f, barcode: v }))}
              onScan={(code) => setForm((f) => ({ ...f, barcode: code }))}
              placeholder="Escanear ou digitar..."
            />
          </Field>
        </div>
      </div>

      {/* ── Estoque ── */}
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>
          Estoque
        </p>
        <div className="grid-2">
          <Field label="Qtd. atual">
            <input className="input" type="number" min="0" value={form.qty} onChange={set('qty')} placeholder="0" />
          </Field>
          <Field label="Estoque mínimo (alerta)">
            <input className="input" type="number" min="0" value={form.minQty} onChange={set('minQty')} placeholder="0" />
          </Field>
          <Field label="Prazo do fornecedor (dias)">
            <input className="input" type="number" min="1" value={form.leadTimeDays} onChange={set('leadTimeDays')} placeholder="3" />
          </Field>
          <Field label="Data de validade">
            <input className="input" type="date" value={form.expiryDate ?? ''} onChange={set('expiryDate')} />
          </Field>
        </div>
      </div>

      {/* ── Preços ── */}
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>
          Preços
        </p>
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