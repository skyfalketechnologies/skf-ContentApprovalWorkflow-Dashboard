import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

/**
 * AdminDashboard Component
 * 
 * Purpose: Allows admin users to manage all system users, promote/demote roles,
 *          and monitor reviewer workload.
 * 
 * Access: Only users with role = 'admin' can access this page.
 * 
 * Features:
 * - View all registered users with their emails, names, and current roles
 * - Promote any non-admin user to reviewer role
 * - Demote reviewers back to creator role
 * - View reviewer workload (pending assignments count)
 * - Color-coded status indicators for reviewer availability
 */
export function AdminDashboard() {
  // State management
  const [users, setUsers] = useState([])           // List of all users with their profile data
  const [loading, setLoading] = useState(true)     // Loading state while fetching data
  const [error, setError] = useState('')           // Error message to display
  const [success, setSuccess] = useState('')       // Success message after role update
  const [updatingUserId, setUpdatingUserId] = useState(null)  // Track which user is being updated (disables button)

  /**
   * Fetch all users when component mounts
   * This runs once when the admin dashboard loads
   */
  useEffect(() => {
    fetchUsers()
  }, [])

  /**
   * Fetches all users from the database
   * 
   * Steps:
   * 1. Get all profiles from the profiles table
   * 2. For each profile, fetch the email from auth.users (Supabase auth table)
   * 3. Combine profile data with email into a single user object
   * 4. Update state with the complete user list
   */
  const fetchUsers = async () => {
    setLoading(true)
    setError('')

    // Step 1: Fetch all profiles (contains role, full_name, etc.)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })  // Newest users first

    if (profilesError) {
      setError('Error fetching users: ' + profilesError.message)
      setLoading(false)
      return
    }

    // Step 2: For each profile, fetch the email from auth.users
    // Promise.all runs all these queries in parallel for better performance
    const usersWithDetails = await Promise.all(
      profiles.map(async (profile) => {
        // Query the auth.users table to get the email for this user ID
        const { data: authData, error: authError } = await supabase
          .from('auth.users')
          .select('email')
          .eq('id', profile.id)
          .single()

        return {
          ...profile,                    // Spread all profile fields (id, full_name, role, etc.)
          email: authData?.email || 'Email not available'  // Add email field
        }
      })
    )

    setUsers(usersWithDetails)
    setLoading(false)
  }

  /**
   * Updates a user's role (creator, reviewer, or admin)
   * 
   * @param {string} userId - The UUID of the user to update
   * @param {string} newRole - The new role ('creator', 'reviewer', or 'admin')
   * 
   * Note: Admin role cannot be changed via this function (admin users are protected)
   */
  const updateUserRole = async (userId, newRole) => {
    setUpdatingUserId(userId)  // Disable button for this specific user
    setError('')
    setSuccess('')

    // Update the role in the profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      setError('Error updating role: ' + error.message)
    } else {
      setSuccess(`User role updated to ${newRole}`)
      fetchUsers()  // Refresh the user list to show updated roles
    }

    setUpdatingUserId(null)  // Re-enable the button
  }

  /**
   * Returns CSS class for role badge (currently not used, kept for future styling)
   */
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple'
      case 'reviewer': return 'bg-green'
      case 'creator': return 'bg-blue'
      default: return 'bg-gray'
    }
  }

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="dashboard-card">Loading users...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage users and reviewer assignments</p>
        </div>
      </div>

      {/* Error Message Display */}
      {error && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* Success Message Display */}
      {success && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '8px' }}>
          {success}
        </div>
      )}

      {/* Section 1: All Users Table */}
      <div className="page-section">
        <h2 style={{ marginBottom: '20px' }}>All Users</h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Email</th>
                <th style={{ padding: '12px' }}>Full Name</th>
                <th style={{ padding: '12px' }}>Current Role</th>
                <th style={{ padding: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  {/* Email Column */}
                  <td style={{ padding: '12px' }}>{user.email}</td>
                  
                  {/* Full Name Column */}
                  <td style={{ padding: '12px' }}>{user.full_name || '—'}</td>
                  
                  {/* Role Badge Column */}
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: user.role === 'admin' ? '#e9d5ff' : user.role === 'reviewer' ? '#dcfce7' : '#dbeafe',
                      color: user.role === 'admin' ? '#6b21a5' : user.role === 'reviewer' ? '#166534' : '#1e40af'
                    }}>
                      {user.role || 'creator'}
                    </span>
                  </td>
                  
                  {/* Actions Column - Role management buttons */}
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Admin users cannot be modified (prevents privilege escalation) */}
                      {user.role !== 'admin' && (
                        <>
                          {/* Show "Make Reviewer" button if user is not already a reviewer */}
                          {user.role !== 'reviewer' && (
                            <button
                              onClick={() => updateUserRole(user.id, 'reviewer')}
                              disabled={updatingUserId === user.id}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#22c55e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              {updatingUserId === user.id ? 'Updating...' : 'Make Reviewer'}
                            </button>
                          )}
                          
                          {/* Show "Make Creator" button if user is not already a creator */}
                          {user.role !== 'creator' && user.role !== 'admin' && (
                            <button
                              onClick={() => updateUserRole(user.id, 'creator')}
                              disabled={updatingUserId === user.id}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              {updatingUserId === user.id ? 'Updating...' : 'Make Creator'}
                            </button>
                          )}
                        </>
                      )}
                      {/* Admin users cannot be changed */}
                      {user.role === 'admin' && (
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Admin (cannot change)</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state when no users exist */}
        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            No users found.
          </div>
        )}
      </div>

      {/* Section 2: Reviewer Workload Monitoring */}
      <div className="page-section" style={{ marginTop: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>Reviewer Workload</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Reviewer Name</th>
                <th style={{ padding: '12px' }}>Pending Assignments</th>
                <th style={{ padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Filter only users with role = 'reviewer' */}
              {users.filter(u => u.role === 'reviewer').map((reviewer) => {
                // Get the reviewer's current workload count
                // reviewer_load is updated when assignments are created/completed
                const pendingCount = reviewer.reviewer_load || 0
                return (
                  <tr key={reviewer.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px' }}>{reviewer.full_name || reviewer.email}</td>
                    <td style={{ padding: '12px' }}>{pendingCount}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        // Color coding based on workload:
                        // Red: Overloaded (>5 pending drafts)
                        // Yellow: Moderate (3-5 pending drafts)
                        // Green: Available (0-2 pending drafts)
                        backgroundColor: pendingCount > 5 ? '#fee2e2' : pendingCount > 2 ? '#fef3c7' : '#dcfce7',
                        color: pendingCount > 5 ? '#991b1b' : pendingCount > 2 ? '#92400e' : '#166534'
                      }}>
                        {pendingCount > 5 ? 'Overloaded' : pendingCount > 2 ? 'Moderate' : 'Available'}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {/* Empty state when no reviewers exist */}
              {users.filter(u => u.role === 'reviewer').length === 0 && (
                <tr>
                  <td colSpan="3" style={{ padding: '48px', textAlign: 'center' }}>
                    No reviewers yet. Promote some users to reviewer using the buttons above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}