import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="p-8 text-center">Chargement…</div>
  if (!user) return <Navigate to="/connexion" state={{ from: location }} replace />
  return children
}

export function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="p-8 text-center">Chargement…</div>
  if (!user) return <Navigate to="/connexion" state={{ from: location }} replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}
