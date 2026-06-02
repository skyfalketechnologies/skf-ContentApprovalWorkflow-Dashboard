// React hooks: useState manages local component state (like form inputs, modal visibility)
import { useState } from 'react'

// React Router DOM components:
// BrowserRouter (aliased as Router) – enables client-side routing
// Routes – container for individual Route definitions
// Route – maps a URL path to a component
// Navigate – redirects to another URL (used for role-based redirects)
// useNavigate – hook to programmatically navigate (used inside LoginForm after login)
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'

// Supabase client instance – pre-configured to talk to your backend
import { supabase } from './lib/supabaseClient'

// Custom authentication hook – returns user, profile, loading state, signOut, updateProfile
import { useAuth } from './hooks/useAuth'

// Main dashboard components for different user roles
import { CreatorDashboard } from './components/dashboard/CreatorDashboard'
import { ReviewerDashboard } from './components/dashboard/ReviewerDashboard'

// Home page component – shows summary cards with draft counts
import { HomeSummary } from './components/dashboard/HomeSummary'

// Layout wrapper – contains the sidebar and an Outlet for nested routes
import { MainLayout } from './components/layout/MainLayout'

// Modal component for updating user's display name
import { ProfileSettings } from './components/profile/ProfileSettings'

// Route guards:
// PrivateRoute – ensures user is logged in before accessing protected pages
// RoleBasedRoute – ensures user has the correct role (creator/reviewer) for a page
import { PrivateRoute } from './components/auth/PrivateRoute'
import { RoleBasedRoute } from './components/auth/RoleBasedRoute'

// Global CSS – contains flat design variables and class styles
import './index.css'

// feature: login/signup UI and role selection for Supabase authentication
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
        {/* the actual loginForm labels and input*/}
        <h1 className="auth-title">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </h1>
        <p className="auth-subtitle">
          {isSignUp ? 'Create a new account' : 'Sign in to your account'}
        </p>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Display name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Account type
                </label>
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

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
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
              className="form-input"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>         {/*closes the form elements*/}

        {authError && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            border: '1px solid #fecaca',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            fontSize: '14px',
            borderRadius: '6px'
          }}>
            {authError}
          </div>
        )}

        {authMessage && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            border: '1px solid #bbf7d0',
            backgroundColor: '#f0fdf4',
            color: '#166534',
            fontSize: '14px',
            borderRadius: '6px'
          }}>
            {authMessage}
          </div>
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

// feature: main application router and layout wrapper
export default function App() {

  //destructures useAuth variables so that they can be used directly
  const { user, profile, profileError, authError, loading, signOut, updateProfile } = useAuth()

  //when the page first loads...the settings are hidden
  const [showProfileSettings, setShowProfileSettings] = useState(false)

  //when authentication state is still eing resolved...displays loading to prevent flickering or showing incorrect UI
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        Loading...
      </div>
    )
  }

  //if there's an authentication error it displays the error message and a button to sign you out allowing you to log in and try again
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
          <Route path="/login" element={<LoginForm />} />{/*when the URL is /login it shows the LoginForm */}
          <Route path="*" element={<Navigate to="/login" replace />} />{/* for all other paths they redirect to login....replaces the URL with /login so that user Cannot click back to a protected page*/}
        </Routes>
      </Router>
    )
  }

  if (!profile) {
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
        <Route path="/login" element={<Navigate to="/" replace />} />{/*prevents going back to login page after authentication*/}
        <Route
          path="/"
          element={
            <PrivateRoute>{/*Authentication is checked before accessing this*/}
            {/*Passes the user's profile data, the signOut function to be used in the sideBar and the settings modal*/}
              <MainLayout
                profile={profile}
                onSignOut={signOut}
                onOpenProfileSettings={() => setShowProfileSettings(true)}
              />
            </PrivateRoute>
          }
        >
          <Route index element={<HomeSummary profile={profile} />} />
          <Route
            path="creator"
            element={
              <RoleBasedRoute allowedRoles={[ 'creator' ]}>
                <CreatorDashboard profile={profile} filter="all" />
              </RoleBasedRoute>
            }
          />
          <Route
            path="creator/pending"
            element={
              <RoleBasedRoute allowedRoles={[ 'creator' ]}>
                <CreatorDashboard profile={profile} filter="pending_review" />
              </RoleBasedRoute>
            }
          />
          <Route
            path="creator/approved"
            element={
              <RoleBasedRoute allowedRoles={[ 'creator' ]}>
                <CreatorDashboard profile={profile} filter="approved" />
              </RoleBasedRoute>
            }
          />
          <Route
            path="creator/rejected"
            element={
              <RoleBasedRoute allowedRoles={[ 'creator' ]}>
                <CreatorDashboard profile={profile} filter="rejected" />
              </RoleBasedRoute>
            }
          />
          <Route
            path="reviewer/pending"
            element={
              <RoleBasedRoute allowedRoles={[ 'reviewer' ]}>
                <ReviewerDashboard filter="pending_review" />
              </RoleBasedRoute>
            }
          />
          <Route
            path="reviewer/approved"
            element={
              <RoleBasedRoute allowedRoles={[ 'reviewer' ]}>
                <ReviewerDashboard filter="approved" />
              </RoleBasedRoute>
            }
          />
          <Route
            path="reviewer/rejected"
            element={
              <RoleBasedRoute allowedRoles={[ 'reviewer' ]}>
                <ReviewerDashboard filter="rejected" />
              </RoleBasedRoute>
            }
          />
          {/*If any other route is written apart from the ones defined above, it will be redirected to homepage */}
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
