import { Navigate } from 'react-router-dom'

/**
 * ProtectedRoute — guards both authentication and role-based access.
 *
 * Usage:
 *   <ProtectedRoute>                          — any logged-in user
 *   <ProtectedRoute roles={['ADMIN','HR_OFFICER']}>  — role-restricted
 */
export default function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />

  // Role check (optional)
  if (roles && roles.length > 0) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!roles.includes(user?.role)) {
      // Redirect to dashboard with a toast-friendly flag
      return <Navigate to="/dashboard" replace state={{ accessDenied: true }} />
    }
  }

  return children
}
