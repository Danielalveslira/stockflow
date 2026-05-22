import { useMemo, useState } from 'react'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import { fmt, fmtDate } from '../../utils/format'

const FILTERS = ['Todas', 'Receitas', 'Despesas']

export default function TransactionTable({ transactions, onDelete }) {
  const [filter, setFilter] = useState('Todas')

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        if (filter === 'Receitas') return t.type === 'income'
        if (filter === 'Despesas') return t.type === 'expense'
        return true
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [transactions, filter])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 6 }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            className={filter === f ? 'btn btn-primary' : 'btn btn-ghost'}
            style={{ padding: '6px 14px', fontSize: 12 }}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState title="Nenhuma transação" message="Nenhuma transação encontrada para este filtro." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Responsável</th>
                <th>Data</th>
                <th>Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Badge variant={t.type === 'income' ? 'success' : 'danger'}>
                      {t.type === 'income' ? '↑ Receita' : '↓ Despesa'}
                    </Badge>
                  </td>
                  <td>{t.description}</td>
                  <td style={{ color: 'var(--text-3)' }}>{t.category}</td>
                  <td>{t.responsible}</td>
                  <td style={{ color: 'var(--text-3)', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
                    {fmtDate(t.date)}
                  </td>
                  <td style={{
                    fontFamily: 'DM Mono, monospace', fontWeight: 600,
                    color: t.type === 'income' ? 'var(--primary)' : 'var(--danger)',
                  }}>
                    {t.type === 'income' ? '+' : '-'} {fmt(t.amount)}
                  </td>
                  <td>
                    <button className="btn-icon" onClick={() => onDelete(t.id)}
                      style={{ color: 'var(--danger)' }} title="Excluir">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
