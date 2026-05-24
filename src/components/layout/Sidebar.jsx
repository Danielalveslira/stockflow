import { NavLink } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { useAuthStore } from '../../store/useAuthStore'
import Avatar from '../ui/Avatar'

const NAV = [
  { to: '/reports', label: 'Relatórios', page: 'reports',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { to: '/dashboard', label: 'Dashboard', page: 'dashboard',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
  { to: '/sales', label: 'Caixa', page: 'sales',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> },
  { to: '/inventory', label: 'Estoque', page: 'inventory',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8l-9-4-9 4v8l9 4 9-4z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> },
  { to: '/customers', label: 'Clientes', page: 'customers',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { to: '/bills', label: 'Contas a Pagar', page: 'bills',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  { to: '/cashflow', label: 'Fluxo de Caixa', page: 'cashflow',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  { to: '/purchases', label: 'Compras', page: 'purchases',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
  { to: '/suppliers', label: 'Fornecedores', page: 'suppliers',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
  { to: '/settings', label: 'Ajustes', page: 'settings',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  { to: '/help', label: 'Ajuda', page: 'help',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  { to: '/users', label: 'Usuários', page: 'users',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
]

const linkStyle = ({ isActive }) => ({
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '9px 12px', borderRadius: 8,
  fontSize: 13, fontWeight: 500,
  color: isActive ? 'var(--primary)' : 'var(--text-2)',
  background: isActive ? 'var(--primary-dim)' : 'transparent',
  transition: 'all .15s',
})

export default function Sidebar({ open, onClose, theme, toggleTheme }) {
  const alerts   = useStore((s) => s.products.filter((p) => p.qty === 0 || p.qty <= p.minQty).length)
  const bills    = useStore((s) => s.bills)
  const profile  = useAuthStore((s) => s.profile)
  const can      = useAuthStore((s) => s.can)
  const logout   = useAuthStore((s) => s.logout)

  // Contas críticas: vencidas ou vencendo em até 3 dias
  const today = new Date(); today.setHours(0,0,0,0)
  const billsUrgent   = bills.filter((b) => {
    if (b.status === 'paid') return false
    const d = new Date(b.due_date + 'T00:00:00')
    const days = Math.ceil((d - today) / (1000 * 60 * 60 * 24))
    return days <= 3
  }).length
  const billsWarning  = bills.filter((b) => {
    if (b.status === 'paid') return false
    const d = new Date(b.due_date + 'T00:00:00')
    const days = Math.ceil((d - today) / (1000 * 60 * 60 * 24))
    return days > 3 && days <= 7
  }).length
  const billsBadge    = billsUrgent > 0
    ? { count: billsUrgent, bg: 'var(--danger-dim)', color: 'var(--danger)' }
    : billsWarning > 0
      ? { count: billsWarning, bg: 'var(--warning-dim)', color: 'var(--warning)' }
      : null

  return (
    <aside
      className={`sf-sidebar ${open ? 'open' : ''}`}
      style={{
        width: 'var(--sidebar-w)', flexShrink: 0,
        background: 'var(--bg-2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '20px 12px',
        transition: 'background .2s, border-color .2s',
      }}
    >
      {/* Logo + fechar (mobile) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px 20px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', letterSpacing: '-.02em' }}>
          StockFlow
        </span>
        <button className="btn-icon" onClick={onClose}
          style={{ display: 'none' }}
          id="sidebar-close"
          aria-label="Fechar menu">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <style>{`@media (max-width: 768px) { #sidebar-close { display: flex !important; } }`}</style>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.filter(({ page }) => can(page)).map(({ to, label, page, icon }) => (
          <NavLink key={to} to={to} style={linkStyle} onClick={onClose}>
            {icon}
            <span style={{ flex: 1 }}>{label}</span>
            {to === '/inventory' && alerts > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--warning-dim)', color: 'var(--warning)', borderRadius: 99, padding: '1px 6px' }}>
                {alerts}
              </span>
            )}
            {to === '/bills' && billsBadge && (
              <span style={{ fontSize: 10, fontWeight: 700, background: billsBadge.bg, color: billsBadge.color, borderRadius: 99, padding: '1px 6px' }}>
                {billsBadge.count}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>

        {/* Toggle tema */}
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '8px 12px', borderRadius: 8,
            fontSize: 13, color: 'var(--text-3)', background: 'transparent',
            cursor: 'pointer', transition: 'all .15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-3)'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
        >
          {theme === 'dark'
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </button>

        {/* Usuário */}
        {profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px' }}>
            <Avatar name={profile.name} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.name}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {profile.role === 'admin' ? 'Administrador' : 'Operador'}
              </p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '8px 12px', borderRadius: 8,
            fontSize: 13, color: 'var(--text-3)', background: 'transparent',
            cursor: 'pointer', transition: 'all .15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-3)'; e.currentTarget.style.color = 'var(--danger)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </button>
      </div>
    </aside>
  )
}