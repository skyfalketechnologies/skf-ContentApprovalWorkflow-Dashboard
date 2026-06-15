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
import { ProfileSettings } from './components/profile/ProfileSettings.jsx'
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

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <h1 className="auth-title">{isSignUp ? 'Sign Up' : 'Sign In'}</h1>
        <p className="auth-subtitle">
          {isSignUp ? 'Create a new creator account' : 'Sign in to your account'}
        </p>
        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <>
              <div className="form-field">
                <label className="form-label">Display name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-field" style={{ fontSize: '13px', color: '#475569', marginTop: '-8px', marginBottom: '12px' }}>
                <em>New accounts are created as Creators. To become a Reviewer, ask an Admin to promote your account.</em>
              </div>
            </>
          )}
          <div className="form-field">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>
        {authError && <div className="status-message error">{authError}</div>}
        {authMessage && <div className="status-message success">{authMessage}</div>}
        <button
          onClick={() => {
            setIsSignUp(!isSignUp)
            setAuthError('')
            setAuthMessage('')
          }}
          className="auth-toggle"
        >
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const { user, profile, profileError, authError, loading, signOut, updateProfile } = useAuth()
  const [showProfileSettings, setShowProfileSettings] = useState(false)
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
                onOpenProfileSettings={() => setShowProfileSettings(true)}
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

      {showProfileSettings && (
        <ProfileSettings
          profile={profile}
          onUpdateProfile={updateProfile}
          onClose={() => setShowProfileSettings(false)}
        />
      )}
    </Router>
  )
}