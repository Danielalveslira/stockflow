import { NavLink } from 'react-router-dom'
import { useStore } from '../../store/useStore'

const NAV = [
  {
    to: '/dashboard', label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    to: '/sales', label: 'Caixa',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
    ),
  },
  {
    to: '/inventory', label: 'Estoque',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8l-9-4-9 4v8l9 4 9-4z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    to: '/cashflow', label: 'Fluxo de Caixa',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
  },
]

const linkStyle = ({ isActive }) => ({
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '9px 12px', borderRadius: 8,
  fontSize: 13, fontWeight: 500,
  color: isActive ? 'var(--primary)' : 'var(--text-2)',
  background: isActive ? 'var(--primary-dim)' : 'transparent',
  transition: 'all .15s',
})

export default function Sidebar() {
  const alerts = useStore((s) =>
    s.products.filter((p) => p.qty === 0 || p.qty <= p.minQty).length
  )

  return (
    <aside style={{
      width: 'var(--sidebar-w)', flexShrink: 0,
      background: 'var(--bg-2)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', padding: '20px 12px',
    }}>
      {/* Logo */}
      <div style={{ padding: '4px 12px 20px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', letterSpacing: '-.02em' }}>
          StockFlow
        </span>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} style={linkStyle}>
            {icon}
            <span style={{ flex: 1 }}>{label}</span>
            {to === '/inventory' && alerts > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700, background: 'var(--warning-dim)',
                color: 'var(--warning)', borderRadius: 99, padding: '1px 6px',
              }}>
                {alerts}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '12px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 11, color: 'var(--text-3)' }}>StockFlow v1.0</p>
      </div>
    </aside>
  )
}
