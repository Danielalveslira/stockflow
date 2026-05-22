import { useEffect, useRef } from 'react'
import { fmt } from '../../utils/format'

/**
 * Etiqueta com código de barras gerado via JsBarcode.
 * Inclui botão de impressão (abre janela de impressão com CSS limpo).
 */
export default function BarcodeLabel({ product, onClose }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!product?.barcode) return

    const render = async () => {
      const JsBarcode = (await import('jsbarcode')).default
      JsBarcode(svgRef.current, product.barcode, {
        format: 'CODE128',
        width: 2,
        height: 56,
        displayValue: true,
        fontSize: 12,
        margin: 6,
        background: '#ffffff',
        lineColor: '#000000',
      })
    }

    render()
  }, [product?.barcode])

  const handlePrint = () => {
    const svgHtml = svgRef.current?.outerHTML ?? ''
    const win = window.open('', '_blank', 'width=400,height=300')
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Etiqueta - ${product.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: sans-serif; display: flex; justify-content: center; padding: 16px; }
          .label {
            border: 1px solid #ccc; border-radius: 8px;
            padding: 12px 16px; text-align: center;
            width: fit-content;
          }
          .name { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
          .price { font-size: 18px; font-weight: 700; margin-top: 6px; }
          .category { font-size: 10px; color: #888; margin-bottom: 4px; }
          @media print { body { padding: 0; } .label { border: none; } }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="category">${product.category ?? ''}</div>
          <div class="name">${product.name}</div>
          ${svgHtml}
          <div class="price">${fmt(product.price)}</div>
        </div>
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `)
    win.document.close()
  }

  if (!product?.barcode) {
    return (
      <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-3)', fontSize: 13 }}>
        Este produto não tem código de barras cadastrado.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
      {/* Preview da etiqueta */}
      <div style={{
        background: '#fff', color: '#000', padding: '16px 24px',
        borderRadius: 10, textAlign: 'center', border: '1px solid var(--border)',
        minWidth: 240,
      }}>
        {product.category && (
          <p style={{ fontSize: 10, color: '#888', marginBottom: 4, textTransform: 'uppercase' }}>
            {product.category}
          </p>
        )}
        <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{product.name}</p>
        <svg ref={svgRef} />
        <p style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>{fmt(product.price)}</p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" onClick={onClose}>Fechar</button>
        <button className="btn btn-primary" onClick={handlePrint}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Imprimir etiqueta
        </button>
      </div>
    </div>
  )
}
