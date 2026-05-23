import { useEffect, useRef, useState } from 'react'

const SIZES = [
  { key: 'p', label: 'Pequena',  w: 50,  h: 25, font: { cat: 6,  name: 9,  price: 12, bar: 28 } },
  { key: 'm', label: 'Média',    w: 80,  h: 40, font: { cat: 7,  name: 11, price: 16, bar: 40 } },
  { key: 'g', label: 'Grande',   w: 100, h: 60, font: { cat: 8,  name: 13, price: 20, bar: 52 } },
]

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

export default function BarcodeLabel({ product, onClose }) {
  const svgRef  = useRef(null)
  const [size,   setSize]   = useState('m')
  const [copies, setCopies] = useState(1)
  const [store,  setStore]  = useState('')
  const [ready,  setReady]  = useState(false)

  const sel = SIZES.find((s) => s.key === size)

  useEffect(() => {
    if (!product?.barcode) return
    setReady(false)
    const render = async () => {
      const JsBarcode = (await import('jsbarcode')).default
      JsBarcode(svgRef.current, product.barcode, {
        format: 'CODE128', width: 1.8, height: sel.font.bar,
        displayValue: true, fontSize: 9, margin: 4,
        background: '#ffffff', lineColor: '#000000',
      })
      setReady(true)
    }
    render()
  }, [product?.barcode, size])

  const handlePrint = () => {
    if (!ready) return
    const svgHtml = svgRef.current?.outerHTML ?? ''
    const f = sel.font
    const storeRow = store
      ? `<div class="store">${store.toUpperCase()}</div>` : ''
    const catRow = product.category
      ? `<div class="cat">${product.category.toUpperCase()}</div>` : ''

    const label = `
      <div class="label">
        ${storeRow}${catRow}
        <div class="name">${product.name}</div>
        <div class="bar">${svgHtml}</div>
        <div class="price">${fmt(product.price)}</div>
      </div>`

    const win = window.open('', '_blank', 'width=620,height=520')
    win.document.write(`<!DOCTYPE html><html><head>
<title>Etiqueta — ${product.name}</title>
<style>
@page { margin:0; size:${sel.w}mm ${sel.h}mm; }
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Arial,sans-serif;background:#fff;display:flex;flex-wrap:wrap;align-content:flex-start;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.label{width:${sel.w}mm;height:${sel.h}mm;padding:3mm 4mm;display:flex;flex-direction:column;align-items:center;justify-content:space-between;overflow:hidden;page-break-inside:avoid;}
.store{font-size:${f.cat}px;color:#aaa;letter-spacing:.5px;}
.cat{font-size:${f.cat}px;color:#777;letter-spacing:.3px;}
.name{font-size:${f.name}px;font-weight:700;color:#000;text-align:center;line-height:1.2;}
.bar{display:flex;justify-content:center;width:100%;}
.bar svg{max-width:100%;height:auto;}
.price{font-size:${f.price}px;font-weight:900;color:#000;letter-spacing:-.5px;}
</style></head><body>
${Array(copies).fill(label).join('')}
<script>window.onload=function(){setTimeout(function(){window.print();},300);}<\/script>
</body></html>`)
    win.document.close()
  }

  if (!product?.barcode) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
        Este produto não tem código de barras cadastrado.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Tamanho */}
      <div className="field">
        <label>Tamanho</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {SIZES.map((s) => (
            <button key={s.key} onClick={() => setSize(s.key)}
              style={{
                padding: '10px 8px', borderRadius: 8, cursor: 'pointer',
                border: size === s.key ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: size === s.key ? 'var(--primary-dim)' : 'var(--bg-3)',
                color: size === s.key ? 'var(--primary)' : 'var(--text-2)',
                transition: 'all .15s', textAlign: 'center',
              }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 11, opacity: .65, marginTop: 2 }}>{s.w}×{s.h} mm</div>
            </button>
          ))}
        </div>
      </div>

      {/* Cópias + loja numa linha */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, alignItems: 'end' }}>
        <div className="field">
          <label>Cópias</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
            <button onClick={() => setCopies((c) => Math.max(1, c - 1))}
              style={{ width: 38, height: 38, fontSize: 20, color: 'var(--text-2)', background: 'var(--bg-3)', cursor: 'pointer', flexShrink: 0, borderRight: '1px solid var(--border)' }}>−</button>
            <input
              type="number" min="1" max="100" value={copies}
              onChange={(e) => setCopies(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
              style={{ width: 48, height: 38, textAlign: 'center', border: 'none', background: 'var(--bg-3)', color: 'var(--text)', fontSize: 15, fontWeight: 600, outline: 'none' }}
            />
            <button onClick={() => setCopies((c) => Math.min(100, c + 1))}
              style={{ width: 38, height: 38, fontSize: 20, color: 'var(--text-2)', background: 'var(--bg-3)', cursor: 'pointer', flexShrink: 0, borderLeft: '1px solid var(--border)' }}>+</button>
          </div>
        </div>

        <div className="field">
          <label>Nome da loja <span style={{ color: 'var(--text-3)', fontWeight: 400, textTransform: 'none' }}>(opcional)</span></label>
          <input className="input" value={store} onChange={(e) => setStore(e.target.value)}
            placeholder="Ex: Mercadinho João" />
        </div>
      </div>

      {/* Preview */}
      <div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
          Preview
        </span>
        <div style={{
          marginTop: 8, background: '#f5f5f3', borderRadius: 10,
          padding: '24px 16px', display: 'flex', justifyContent: 'center',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            background: '#fff', borderRadius: 8,
            border: '1.5px dashed #d0d0cc',
            padding: '12px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 5, minWidth: 160, maxWidth: 260, width: '100%',
            boxShadow: '0 2px 12px #00000012',
          }}>
            {store && (
              <span style={{ fontSize: 9, color: '#bbb', letterSpacing: '.6px', fontFamily: 'Arial, sans-serif' }}>
                {store.toUpperCase()}
              </span>
            )}
            {product.category && (
              <span style={{ fontSize: 10, color: '#888', letterSpacing: '.3px', fontFamily: 'Arial, sans-serif' }}>
                {product.category.toUpperCase()}
              </span>
            )}
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111', textAlign: 'center', lineHeight: 1.3, fontFamily: 'Arial, sans-serif' }}>
              {product.name}
            </span>
            <svg ref={svgRef} style={{ maxWidth: '100%' }} />
            <span style={{ fontSize: 20, fontWeight: 900, color: '#000', fontFamily: 'Arial, sans-serif', letterSpacing: '-.5px' }}>
              {fmt(product.price)}
            </span>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onClose}>Fechar</button>
        <button className="btn btn-primary" onClick={handlePrint} disabled={!ready}
          style={{ opacity: ready ? 1 : .5 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Imprimir {copies > 1 ? `${copies} etiquetas` : 'etiqueta'}
        </button>
      </div>
    </div>
  )
}