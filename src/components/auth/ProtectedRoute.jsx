import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

export default function ProtectedRoute({ page, children }) {
  const user = useAuthStore((s) => s.user)
  const can = useAuthStore((s) => s.can)

  if (!user) return <Navigate to="/login" replace />
  if (page && !can(page)) return <Navigate to="/sales" replace />

  return children
}