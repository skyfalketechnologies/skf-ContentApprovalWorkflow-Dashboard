import { useState } from 'react'  
import { supabase } from './lib/supabaseClient'
import { useAuth } from './hooks/useAuth'
import { CreatorDashboard } from './components/dashboard/CreatorDashboard'
import { ReviewerDashboard } from './components/dashboard/ReviewerDashboard'
import './index.css'



function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAuthError('')
    setAuthMessage('')
    
    let result
    if (isSignUp) {
      result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0],
            role: 'creator' // Default role
          }
        }
      })
    } else {
      result = await supabase.auth.signInWithPassword({ email, password })
    }
    
    if (result.error) {
      console.error('Supabase auth error:', result.error)
      setAuthError(result.error.message)
    } else {
      if (isSignUp && !result.data.session) {
        setAuthMessage('Account created. Check your email to confirm it before signing in.')
      }
      onLogin()
    }
    setLoading(false)
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #cbd5e1',
        borderRadius: '4px',
        padding: '32px',
        width: '400px',
        maxWidth: '90%'
      }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>
          Content Approval Dashboard
        </h1>
        <p style={{ color: '#475569', marginBottom: '24px' }}>
          {isSignUp ? 'Create a new account' : 'Sign in to your account'}
        </p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '2px solid #cbd5e1',
                borderRadius: '4px'
              }}
              required
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '2px solid #cbd5e1',
                borderRadius: '4px'
              }}
              required
            />
          </div>
          
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginBottom: '12px' }}
          >
          {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        {authError && (
          <div style={{
            marginTop: '12px',
            padding: '10px 12px',
            border: '1px solid #fecaca',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            fontSize: '14px'
          }}>
            {authError}
          </div>
        )}

        {authMessage && (
          <div style={{
            marginTop: '12px',
            padding: '10px 12px',
            border: '1px solid #bbf7d0',
            backgroundColor: '#f0fdf4',
            color: '#166534',
            fontSize: '14px'
          }}>
            {authMessage}
          </div>
        )}
        
        <button
          onClick={() => {
            setIsSignUp(!isSignUp)
            setAuthError('')
            setAuthMessage('')
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#1e40af',
            cursor: 'pointer',
            width: '100%',
            marginTop: '12px'
          }}
        >
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </div>
    </div>
  )
}

function Dashboard() {
  const { profile, profileError, signOut } = useAuth()
  
  if (!profile) {
    return (
      <div style={{ padding: '24px' }}>
        <h2>Profile unavailable</h2>
        <p>
          {profileError || 'Your account is signed in, but no profile row was found.'}
        </p>
        <button onClick={signOut}>Sign Out</button>
      </div>
    )
  }
  
  return (
    <div>
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '2px solid #cbd5e1',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0 }}>Welcome, {profile.full_name || 'User'}</h2>
          <p style={{ margin: '4px 0 0 0', color: '#475569', fontSize: '14px' }}>
            Role: {profile.role}
          </p>
        </div>
        <button onClick={signOut} style={{
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          cursor: 'pointer'
        }}>
          Sign Out
        </button>
      </div>
      
      {profile.role === 'creator' ? <CreatorDashboard /> : <ReviewerDashboard />}
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      Loading...
    </div>
  }
  
  return user ? <Dashboard /> : <LoginForm onLogin={() => {}} />
}
