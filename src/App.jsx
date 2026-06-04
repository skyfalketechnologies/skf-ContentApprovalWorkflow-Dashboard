import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './hooks/useAuth'
import { CreatorDashboard } from './components/dashboard/CreatorDashboard'
import { ReviewerDashboard } from './components/dashboard/ReviewerDashboard'
import { AllDraftsPage } from './components/dashboard/AllDraftsPage'
import { AdminDashboard } from './components/admin/AdminDashboard'
import { MainLayout } from './components/layout/MainLayout'
import { ProfileSettings } from './components/profile/ProfileSettings'
import { PrivateRoute } from './components/auth/PrivateRoute'
import { RoleBasedRoute } from './components/auth/RoleBasedRoute'
import './index.css'

/**
 * LoginForm Component
 * Handles user authentication (sign in and sign up)
 * Allows new users to choose their role (creator/reviewer)
 */
function LoginForm() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('creator')
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
            role
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
          {isSignUp ? 'Create a new account' : 'Sign in to your account'}
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
              <div className="form-field">
                <label className="form-label">Account type</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="form-input"
                >
                  <option value="creator">Creator</option>
                  <option value="reviewer">Reviewer</option>
                </select>
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
        {authError && (
          <div className="status-message error">{authError}</div>
        )}
        {authMessage && (
          <div className="status-message success">{authMessage}</div>
        )}
        <button
          onClick={() => {
            setIsSignUp(!isSignUp)
            setRole('creator')
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

/**
 * Main App Component
 * 
 * Router is wrapped once at the top level to avoid duplicate Router issues.
 * All routes are nested inside a single Router component.
 * 
 * Authentication flow:
 * 1. Check if user is authenticated (via useAuth hook)
 * 2. If not authenticated, show login routes
 * 3. If authenticated, show protected routes wrapped in PrivateRoute
 * 4. Role-based routes restrict access based on user role
 */
export default function App() {
  const { user, profile, profileError, authError, loading, signOut, updateProfile } = useAuth()
  const [showProfileSettings, setShowProfileSettings] = useState(false)

  // Show loading indicator while checking authentication status
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        Loading...
      </div>
    )
  }

  // Show error if authentication fails
  if (authError) {
    return (
      <div style={{ padding: '24px' }}>
        <h2>Unable to load session</h2>
        <p>{authError}</p>
        <button onClick={signOut} className="btn btn-secondary">Clear Session</button>
      </div>
    )
  }

  // Not authenticated – show login routes only
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

  // User exists but profile is missing (should not happen, but handle gracefully)
  if (!profile) {
    return (
      <div style={{ padding: '24px' }}>
        <h2>Profile unavailable</h2>
        <p>{profileError || 'Your account is signed in, but no profile row was found.'}</p>
        <button onClick={signOut} className="btn btn-danger">Sign Out</button>
      </div>
    )
  }

  // Authenticated user – show full application with all routes
  return (
    <Router>
      <Routes>
        {/* Redirect /login to home if already authenticated */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        
        {/* Main layout route – all authenticated routes go here */}
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
          {/* Home page – All Drafts (read-only view with summary cards) */}
          <Route index element={<AllDraftsPage profile={profile} />} />

          {/* ==================== CREATOR ROUTES ==================== */}
          {/* All Drafts (full list with all statuses) */}
          <Route
            path="creator"
            element={
              <RoleBasedRoute allowedRoles={['creator']}>
                <CreatorDashboard profile={profile} filter="all" />
              </RoleBasedRoute>
            }
          />
          
          {/* Drafts (only status = 'draft' – editable) */}
          <Route
            path="creator/drafts"
            element={
              <RoleBasedRoute allowedRoles={['creator']}>
                <CreatorDashboard profile={profile} filter="draft" />
              </RoleBasedRoute>
            }
          />
          
          {/* Pending Drafts (only status = 'pending_review') */}
          <Route
            path="creator/pending"
            element={
              <RoleBasedRoute allowedRoles={['creator']}>
                <CreatorDashboard profile={profile} filter="pending_review" />
              </RoleBasedRoute>
            }
          />
          
          {/* Approved Drafts */}
          <Route
            path="creator/approved"
            element={
              <RoleBasedRoute allowedRoles={['creator']}>
                <CreatorDashboard profile={profile} filter="approved" />
              </RoleBasedRoute>
            }
          />
          
          {/* Changes Requested Drafts (resubmittable) */}
          <Route
            path="creator/changes-requested"
            element={
              <RoleBasedRoute allowedRoles={['creator']}>
                <CreatorDashboard profile={profile} filter="changes_requested" />
              </RoleBasedRoute>
            }
          />

          {/* ==================== REVIEWER ROUTES ==================== */}
          {/* Pending Reviews */}
          <Route
            path="reviewer/pending"
            element={
              <RoleBasedRoute allowedRoles={['reviewer']}>
                <ReviewerDashboard filter="pending_review" />
              </RoleBasedRoute>
            }
          />
          
          {/* Approved Reviews (history view) */}
          <Route
            path="reviewer/approved"
            element={
              <RoleBasedRoute allowedRoles={['reviewer']}>
                <ReviewerDashboard filter="approved" />
              </RoleBasedRoute>
            }
          />
          
          {/* Changes Requested Reviews */}
          <Route
            path="reviewer/changes-requested"
            element={
              <RoleBasedRoute allowedRoles={['reviewer']}>
                <ReviewerDashboard filter="changes_requested" />
              </RoleBasedRoute>
            }
          />

          {/* ==================== ADMIN ROUTES ==================== */}
          {/* Admin Dashboard – only accessible to users with role = 'admin' */}
          <Route
            path="admin"
            element={
              <RoleBasedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </RoleBasedRoute>
            }
          />

          {/* Catch-all redirect – any unknown route goes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      
      {/* Profile Settings Modal – rendered outside the main route outlet */}
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