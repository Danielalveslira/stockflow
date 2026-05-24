import { useMemo, useState } from 'react'
import { useStore } from '../../store/useStore'
import Badge from '../ui/Badge'
import Avatar from '../ui/Avatar'
import EmptyState from '../ui/EmptyState'
import BarcodeLabel from '../barcode/BarcodeLabel'
import Modal from '../ui/Modal'
import { fmt, calcMargin } from '../../utils/format'
import { calcABC, calcReorderPoint, getExpiryStatus } from '../../utils/inventoryAnalytics'

const ABC_COLORS = { A: 'success', B: 'info', C: 'neutral' }

function stockBadge(qty, minQty) {
  if (qty === 0)       return <Badge variant="danger">Esgotado</Badge>
  if (qty <= minQty)   return <Badge variant="warning">Baixo</Badge>
  return <Badge variant="success">OK</Badge>
}

function ExpiryBadge({ expiryDate }) {
  const s = getExpiryStatus(expiryDate)
  if (!s) return null
  const variant = s.status === 'expired' ? 'danger' : s.status === 'critical' ? 'danger' : s.status === 'warning' ? 'warning' : 'neutral'
  return (
    <span title={`Validade: ${new Date(expiryDate).toLocaleDateString('pt-BR')}`}>
      <Badge variant={variant}>
        {s.status === 'expired' ? 'Vencido' : `Val. ${s.label}`}
      </Badge>
    </span>
  )
}

export default function ProductTable({ products, transactions, onEdit, onDelete }) {
  const [search, setSearch]       = useState('')
  const [labelProduct, setLabel]  = useState(null)
  const [abcFilter, setAbcFilter] = useState('all')

  const abcMap     = useMemo(() => calcABC(products, transactions ?? []),     [products, transactions])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.responsible?.toLowerCase().includes(q) || p.barcode?.includes(q)
      const matchAbc    = abcFilter === 'all' || abcMap[p.id] === abcFilter
      return matchSearch && matchAbc
    })
  }, [products, search, abcFilter, abcMap])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-wrap" style={{ flex: '1', minWidth: 200 }}>
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="input" placeholder="Buscar nome, categoria, código..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {/* Filtro ABC */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'A', 'B', 'C'].map((f) => (
            <button key={f}
              onClick={() => setAbcFilter(f)}
              style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all .15s',
                background: abcFilter === f ? 'var(--primary)' : 'var(--bg-3)',
                color: abcFilter === f ? '#000' : 'var(--text-3)',
              }}>
              {f === 'all' ? 'Todos' : `Classe ${f}`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum produto" message="Tente um termo diferente ou adicione um produto." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Código</th>
                <th>Classe</th>
                <th>Responsável</th>
                <th>Estoque</th>
                <th>Ponto Repos.</th>
                <th>Preço</th>
                <th>Margem</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const abc       = abcMap[p.id] ?? 'C'
                const reorder   = calcReorderPoint(p, transactions ?? [])
                const expiry    = getExpiryStatus(p.expiryDate)
                const needOrder = p.qty <= reorder && p.qty > 0

                return (
                  <tr key={p.id}>
                    <td>
                      <div>
                        {p.name}
                        {p.category && <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block' }}>{p.category}</span>}
                        {expiry && expiry.status !== 'ok' && (
                          <div style={{ marginTop: 3 }}><ExpiryBadge expiryDate={p.expiryDate} /></div>
                        )}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--text-3)' }}>
                      {p.barcode || <span style={{ opacity: .4 }}>—</span>}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 24, height: 24, borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: abc === 'A' ? 'var(--primary-dim)' : abc === 'B' ? 'var(--info-dim)' : 'var(--bg-3)',
                        color: abc === 'A' ? 'var(--primary)' : abc === 'B' ? 'var(--info)' : 'var(--text-3)',
                      }} title={abc === 'A' ? 'Alto valor — maior atenção' : abc === 'B' ? 'Valor médio' : 'Baixo giro'}>
                        {abc}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Avatar name={p.responsible} size={24} />
                        {p.responsible}
                      </div>
                    </td>
                    <td>{p.qty} un.</td>
                    <td>
                      <span style={{ fontSize: 12, color: needOrder ? 'var(--warning)' : 'var(--text-3)', fontFamily: 'DM Mono, monospace' }}
                        title={`Pedir quando chegar em ${reorder} un.`}>
                        {needOrder ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            Pedir! ≤{reorder}
                          </span>
                        ) : `≤${reorder} un.`}
                      </span>
                    </td>
                    <td>{fmt(p.price)}</td>
                    <td style={{ color: 'var(--primary)', fontFamily: 'DM Mono, monospace' }}>
                      {calcMargin(p.cost, p.price)}%
                    </td>
                    <td>{stockBadge(p.qty, p.minQty)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button className="btn-icon" onClick={() => setLabel(p)} title="Imprimir etiqueta"
                          style={{ color: 'var(--info)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                            <line x1="7" y1="7" x2="7.01" y2="7"/>
                          </svg>
                        </button>
                        <button className="btn-icon" onClick={() => onEdit(p)} title="Editar">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!labelProduct} onClose={() => setLabel(null)}
        title={`Etiqueta — ${labelProduct?.name ?? ''}`} width={400}>
        <BarcodeLabel product={labelProduct} onClose={() => setLabel(null)} />
      </Modal>
    </div>
  )
}