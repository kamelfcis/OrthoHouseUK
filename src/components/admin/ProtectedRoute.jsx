import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { appUser, loading, canAccessAdmin, isAdmin } = useAuth()

  if (loading) {
    return <div className="admin-loading">Loading...</div>
  }

  if (!appUser || !canAccessAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}

export default ProtectedRoute

