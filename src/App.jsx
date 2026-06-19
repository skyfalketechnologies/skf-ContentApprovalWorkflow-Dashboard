import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient.js'
import { useAuth } from './hooks/useAuth.js'
import { CreatorDashboard } from './components/dashboard/CreatorDashboard.jsx'
import { ReviewerDashboard } from './components/dashboard/ReviewerDashboard.jsx'
import { ReviewerHome } from './components/dashboard/ReviewerHome.jsx'
import { AllDraftsPage } from './components/dashboard/AllDraftsPage.jsx'
import { AdminDashboard } from './components/admin/AdminDashboard.jsx'
import { MainLayout } from './components/layout/MainLayout.jsx'
import { PrivateRoute } from './components/auth/PrivateRoute.jsx'
import { RoleBasedRoute } from './components/auth/RoleBasedRoute.jsx'
import './index.css'

function LoginForm() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
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
      if (!fullName.trim()) {
        setAuthError('Please enter your display name.')
        setLoading(false)
        return
      }
      result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'creator'
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
      } else {
        navigate('/')
      }
    }
    setLoading(false)
  }

  // Logo icon – same as sidebar
  const LogoIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="14" y="14" width="8" height="8" rx="2" />
      <rect x="2" y="2" width="8" height="8" rx="2" />
      <path d="M7 14v1a2 2 0 0 0 2 2h1" />
      <path d="M14 7h1a2 2 0 0 1 2 2v1" />
    </svg>
  )

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f8fafc',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: '#ffffff',
        border: '2px solid #cbd5e1',
        borderRadius: '20px',
        padding: '40px 32px',
        boxSizing: 'border-box'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: '#0a1a2f' }}>
            <LogoIcon />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', margin: 0, color: '#0f172a' }}>
            Content Flow
          </h1>
          <p style={{ fontSize: '14px', color: '#475569', marginTop: '4px' }}>
            {isSignUp ? 'Create your creator account' : 'Sign in to your dashboard'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <>
              <div className="form-field">
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                  Display name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input"
                  required
                  style={{ width: '100%', padding: '12px 14px', border: '2px solid #cbd5e1', borderRadius: '12px', fontSize: '15px' }}
                />
              </div>
              <div style={{ fontSize: '13px', color: '#475569', marginTop: '-8px', marginBottom: '12px' }}>
                <em>New accounts are created as Creators. To become a Reviewer, ask an Admin to promote your account.</em>
              </div>
            </>
          )}
          <div className="form-field">
            <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
              style={{ width: '100%', padding: '12px 14px', border: '2px solid #cbd5e1', borderRadius: '12px', fontSize: '15px' }}
            />
          </div>
          <div className="form-field">
            <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
              style={{ width: '100%', padding: '12px 14px', border: '2px solid #cbd5e1', borderRadius: '12px', fontSize: '15px' }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#1e40af',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#1d4ed8'
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#1e40af'
            }}
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        {authError && (
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '10px', fontSize: '14px' }}>
            {authError}
          </div>
        )}
        {authMessage && (
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '10px', fontSize: '14px' }}>
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
            marginTop: '20px',
            background: 'none',
            border: 'none',
            color: '#1e40af',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'center',
            padding: '8px'
          }}
        >
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
          Content Flow – content approval dashboard
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { user, profile, profileError, authError, loading, signOut, updateProfile } = useAuth()
  const [profileTimeout, setProfileTimeout] = useState(false)

  // Wait 20 seconds before showing profile error
  useEffect(() => {
    if (!loading && user && !profile && !profileTimeout) {
      const timer = setTimeout(() => {
        setProfileTimeout(true)
      }, 20000) // 20 seconds
      return () => clearTimeout(timer)
    }
  }, [loading, user, profile, profileTimeout])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        Loading...
      </div>
    )
  }

  if (authError) {
    return (
      <div style={{ padding: '24px' }}>
        <h2>Unable to load session</h2>
        <p>{authError}</p>
        <button onClick={signOut} className="btn btn-secondary">Clear Session</button>
      </div>
    )
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    )
  }

  if (!profile) {
    // Show loading indicator while waiting for profile (up to 20 seconds)
    if (!profileTimeout) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column' }}>
          <div>Loading profile data...</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>If this takes more than 20 seconds, please refresh.</div>
        </div>
      )
    }
    // After 20 seconds, show error with sign-out button
    return (
      <div style={{ padding: '24px' }}>
        <h2>Profile unavailable</h2>
        <p>{profileError || 'Your account is signed in, but no profile row was found.'}</p>
        <button onClick={signOut} className="btn btn-danger">Sign Out</button>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout
                profile={profile}
                onSignOut={signOut}
              />
            </PrivateRoute>
          }
        >
          {/* Root route: redirect based on role */}
          <Route
            index
            element={
              profile.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : profile.role === 'reviewer' ? (
                <Navigate to="/reviewer" replace />
              ) : (
                <AllDraftsPage profile={profile} />
              )
            }
          />

          {/* CREATOR ROUTES */}
          <Route
            path="creator"
            element={
              <RoleBasedRoute allowedRoles={['creator']}>
                <CreatorDashboard profile={profile} filter="all" />
              </RoleBasedRoute>
            }
          />
          <Route
            path="creator/drafts"
            element={
              <RoleBasedRoute allowedRoles={['creator']}>
                <CreatorDashboard profile={profile} filter="draft" />
              </RoleBasedRoute>
            }
          />
          <Route
            path="creator/pending"
            element={
              <RoleBasedRoute allowedRoles={['creator']}>
                <CreatorDashboard profile={profile} filter="pending_review" />
              </RoleBasedRoute>
            }
          />
          <Route
            path="creator/approved"
            element={
              <RoleBasedRoute allowedRoles={['creator']}>
                <CreatorDashboard profile={profile} filter="approved" />
              </RoleBasedRoute>
            }
          />
          <Route
            path="creator/changes-requested"
            element={
              <RoleBasedRoute allowedRoles={['creator']}>
                <CreatorDashboard profile={profile} filter="changes_requested" />
              </RoleBasedRoute>
            }
          />
          <Route
            path="creator/archived"
            element={
              <RoleBasedRoute allowedRoles={['creator']}>
                <CreatorDashboard profile={profile} filter="archived" />
              </RoleBasedRoute>
            }
          />

          {/* REVIEWER ROUTES */}
          <Route
            path="reviewer"
            element={
              <RoleBasedRoute allowedRoles={['reviewer']}>
                <ReviewerHome />
              </RoleBasedRoute>
            }
          />
          <Route
            path="reviewer/pending"
            element={
              <RoleBasedRoute allowedRoles={['reviewer']}>
                <ReviewerDashboard filter="pending_review" />
              </RoleBasedRoute>
            }
          />
          <Route
            path="reviewer/approved"
            element={
              <RoleBasedRoute allowedRoles={['reviewer']}>
                <ReviewerDashboard filter="approved" />
              </RoleBasedRoute>
            }
          />
          <Route
            path="reviewer/changes-requested"
            element={
              <RoleBasedRoute allowedRoles={['reviewer']}>
                <ReviewerDashboard filter="changes_requested" />
              </RoleBasedRoute>
            }
          />

          {/* ADMIN ROUTES */}
          <Route
            path="admin"
            element={
              <RoleBasedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </RoleBasedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  )
}