import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export default function Login() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) { setError('Preencha todos os campos'); return }
    setLoading(true)
    setError('')
    const result = await login(email, password)
    setLoading(false)
    if (result.error) {
      setError('Email ou senha incorretos')
    } else {
      navigate('/sales')
    }
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)',
    }}>
      <div style={{
        width: 380, background: 'var(--bg-2)',
        border: '1px solid var(--border)', borderRadius: 14, padding: 36,
        boxShadow: 'var(--shadow)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)', letterSpacing: '-.02em' }}>
            StockFlow
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 5 }}>
            Entre com sua conta para continuar
          </p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Email</label>
            <input
              className="input" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoFocus
            />
          </div>

          <div className="field">
            <label>Senha</label>
            <input
              className="input" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && (
            <p style={{
              fontSize: 13, color: 'var(--danger)',
              background: 'var(--danger-dim)', padding: '9px 12px', borderRadius: 6,
            }}>
              {error}
            </p>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 4, fontSize: 14 }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  )
}