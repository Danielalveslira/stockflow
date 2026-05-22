import { useMemo, useState } from 'react'
import Badge from '../ui/Badge'
import Avatar from '../ui/Avatar'
import EmptyState from '../ui/EmptyState'
import BarcodeLabel from '../barcode/BarcodeLabel'
import Modal from '../ui/Modal'
import { fmt, calcMargin } from '../../utils/format'

function stockBadge(qty, minQty) {
  if (qty === 0) return <Badge variant="danger">Esgotado</Badge>
  if (qty <= minQty) return <Badge variant="warning">Baixo</Badge>
  return <Badge variant="success">OK</Badge>
}

export default function ProductTable({ products, onEdit, onDelete }) {
  const [search, setSearch] = useState('')
  const [labelProduct, setLabelProduct] = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return products
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.responsible?.toLowerCase().includes(q) ||
      p.barcode?.includes(q)
    )
  }, [products, search])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Search */}
      <div className="search-wrap" style={{ maxWidth: 300 }}>
        <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="input"
          placeholder="Buscar nome, categoria, código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState title="Nenhum produto" message="Tente um termo diferente ou adicione um produto." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Código de barras</th>
                <th>Responsável</th>
                <th>Estoque</th>
                <th>Preço</th>
                <th>Margem</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div>
                      {p.name}
                      {p.category && <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block' }}>{p.category}</span>}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--text-3)' }}>
                    {p.barcode || <span style={{ color: 'var(--text-3)', opacity: .5 }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Avatar name={p.responsible} size={24} />
                      {p.responsible}
                    </div>
                  </td>
                  <td>{p.qty} un.</td>
                  <td>{fmt(p.price)}</td>
                  <td style={{ color: 'var(--primary)', fontFamily: 'DM Mono, monospace' }}>
                    {calcMargin(p.cost, p.price)}%
                  </td>
                  <td>{stockBadge(p.qty, p.minQty)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      {/* Etiqueta */}
                      <button className="btn-icon" onClick={() => setLabelProduct(p)} title="Imprimir etiqueta"
                        style={{ color: 'var(--info)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                          <line x1="7" y1="7" x2="7.01" y2="7"/>
                        </svg>
                      </button>
                      {/* Editar */}
                      <button className="btn-icon" onClick={() => onEdit(p)} title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      {/* Excluir */}
                      <button className="btn-icon" onClick={() => onDelete(p.id)} title="Excluir"
                        style={{ color: 'var(--danger)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                          <path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Label modal */}
      <Modal
        open={!!labelProduct}
        onClose={() => setLabelProduct(null)}
        title={`Etiqueta — ${labelProduct?.name ?? ''}`}
        width={400}
      >
        <BarcodeLabel
          product={labelProduct}
          onClose={() => setLabelProduct(null)}
        />
      </Modal>
    </div>
  )
}
