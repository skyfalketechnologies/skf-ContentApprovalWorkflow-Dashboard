import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh' 
    }}>Loading...</div>
  }
  
  return user ? children : <Navigate to="/login" />
}