import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import PageHeader from '../components/layout/PageHeader'
import Modal from '../components/ui/Modal'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'

const PAGES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'sales',     label: 'Caixa'       },
  { key: 'inventory', label: 'Estoque'     },
  { key: 'cashflow',  label: 'Fluxo de Caixa' },
]

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      style={{
        width: 36, height: 20, borderRadius: 99, border: 'none',
        background: checked ? 'var(--primary)' : 'var(--bg-3)',
        position: 'relative', cursor: disabled ? 'default' : 'pointer',
        transition: 'background .2s', flexShrink: 0,
        outline: '1px solid var(--border)',
        opacity: disabled ? .4 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: 2,
        left: checked ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff', transition: 'left .2s',
        boxShadow: '0 1px 3px #0004',
      }} />
    </button>
  )
}

export default function Users() {
  const currentProfile = useAuthStore((s) => s.profile)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
    setUsers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  const togglePermission = async (userId, page) => {
    const user = users.find((u) => u.id === userId)
    const newPerms = { ...user.permissions, [page]: !user.permissions?.[page] }
    await supabase.from('profiles').update({ permissions: newPerms }).eq('id', userId)
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, permissions: newPerms } : u))
  }

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'operator' : 'admin'
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u))
  }

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      setFormError('Preencha todos os campos'); return
    }
    if (form.password.length < 6) {
      setFormError('Senha mínima de 6 caracteres'); return
    }
    setCreating(true)
    setFormError('')

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } },
    })

    if (error) {
      setFormError(error.message)
      setCreating(false)
      return
    }

    setCreating(false)
    setModal(false)
    setForm({ name: '', email: '', password: '' })
    setTimeout(loadUsers, 800)
  }

  return (
    <div className="page">
      <PageHeader
        title="Usuários"
        subtitle={`${users.length} usuário(s) cadastrado(s)`}
        action={
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo usuário
          </button>
        }
      />

      {loading ? (
        <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Carregando...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {users.map((user) => {
            const isMe = user.id === currentProfile?.id
            const isAdmin = user.role === 'admin'

            return (
              <div key={user.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Header do usuário */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={user.name} size={38} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</p>
                      {isMe && <Badge variant="info">Você</Badge>}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                      {user.id === currentProfile?.id
                        ? currentProfile?.id?.slice(0, 8) + '...'
                        : user.id?.slice(0, 8) + '...'}
                    </p>
                  </div>

                  {/* Toggle Admin */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Admin</span>
                    <Toggle
                      checked={isAdmin}
                      onChange={() => !isMe && toggleRole(user.id, user.role)}
                      disabled={isMe}
                    />
                  </div>
                </div>

                {/* Permissões — só mostra para operators */}
                {!isAdmin && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>
                      Permissões de acesso
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                      {PAGES.map(({ key, label }) => (
                        <div key={key} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', background: 'var(--bg-3)',
                          borderRadius: 8, border: '1px solid var(--border)',
                        }}>
                          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
                          <Toggle
                            checked={user.permissions?.[key] === true}
                            onChange={() => togglePermission(user.id, key)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      Admins têm acesso total a todas as telas.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal criar usuário */}
      <Modal open={modal} onClose={() => { setModal(false); setFormError('') }} title="Novo usuário" width={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Nome *</label>
            <input className="input" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nome completo" />
          </div>
          <div className="field">
            <label>Email *</label>
            <input className="input" type="email" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="email@exemplo.com" />
          </div>
          <div className="field">
            <label>Senha inicial *</label>
            <input className="input" type="password" value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Mínimo 6 caracteres" />
          </div>

          {formError && (
            <p style={{ fontSize: 13, color: 'var(--danger)', background: 'var(--danger-dim)', padding: '8px 12px', borderRadius: 6 }}>
              {formError}
            </p>
          )}

          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
            O usuário criado terá acesso somente ao Caixa por padrão. Você pode alterar as permissões depois.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
              {creating ? 'Criando...' : 'Criar usuário'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}