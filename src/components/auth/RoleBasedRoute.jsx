import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function RoleBasedRoute({ children, allowedRoles }) {
  const { profile, loading } = useAuth()
  
  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh' 
    }}>Loading...</div>
  }
  
  if (!profile) {
    return <Navigate to="/login" />
  }
  
  if (!allowedRoles.includes(profile.role)) {
    // Redirect to appropriate dashboard based on role
    if (profile.role === 'creator') {
      return <Navigate to="/creator" />
    } else if (profile.role === 'reviewer') {
      return <Navigate to="/reviewer" />
    }
    return <Navigate to="/" />
  }
  
  return children
}