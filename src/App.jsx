import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { useStore } from './store/useStore'
import { useTheme } from './hooks/useTheme'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Sidebar from './components/layout/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import CashFlow from './pages/CashFlow'
import Sales from './pages/Sales'
import Users from './pages/Users'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Customers from './pages/Customers'
import Bills from './pages/Bills'
import Help from './pages/Help'
import Purchases from './pages/Purchases'
import Suppliers from './pages/Suppliers'

function Spinner() {
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--bg)',
    }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
        stroke="var(--primary)" strokeWidth="2"
        style={{ animation: 'spin 1s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function AppShell({ theme, toggleTheme }) {
  const loadAll   = useStore((s) => s.loadAll)
  const dbLoading = useStore((s) => s.loading)
  const dbError   = useStore((s) => s.error)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { loadAll() }, [loadAll])

  if (dbLoading) return <Spinner />
  if (dbError) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8, background:'var(--bg)' }}>
      <p style={{ color: 'var(--danger)', fontWeight: 600 }}>Erro ao carregar dados</p>
      <p style={{ color: 'var(--text-3)', fontSize: 13 }}>{dbError}</p>
    </div>
  )

  return (
    <div className="app-shell">
      {/* Overlay mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        {/* Header mobile */}
        <div className="mobile-header">
          <button
            className="btn-icon"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
            style={{ padding: 6 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>StockFlow</span>
          <button
            className="btn-icon"
            onClick={toggleTheme}
            style={{ marginLeft: 'auto' }}
            aria-label="Alternar tema"
          >
            {theme === 'dark'
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
        </div>

        <main className="app-main">
          <Routes>
            <Route path="/"          element={<Navigate to="/sales" replace />} />
            <Route path="/reports" element={<ProtectedRoute page="reports"><Reports /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute page="dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="/sales"     element={<ProtectedRoute page="sales"><Sales /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute page="inventory"><Inventory /></ProtectedRoute>} />
            <Route path="/cashflow"  element={<ProtectedRoute page="cashflow"><CashFlow /></ProtectedRoute>} />
            <Route path="/purchases" element={<ProtectedRoute page="purchases"><Purchases /></ProtectedRoute>} />
            <Route path="/suppliers" element={<ProtectedRoute page="suppliers"><Suppliers /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute page="help"><Help /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute page="customers"><Customers /></ProtectedRoute>} />
            <Route path="/bills" element={<ProtectedRoute page="bills"><Bills /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute page="settings"><Settings /></ProtectedRoute>} />
            <Route path="/users"     element={<ProtectedRoute page="users"><Users /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const initAuth   = useAuthStore((s) => s.init)
  const authLoading = useAuthStore((s) => s.loading)
  const user       = useAuthStore((s) => s.user)
  const { theme, toggle } = useTheme()

  useEffect(() => { initAuth() }, [initAuth])

  if (authLoading) return <Spinner />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/sales" replace /> : <Login />} />
        <Route path="/*"     element={user ? <AppShell theme={theme} toggleTheme={toggle} /> : <Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}