import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export function ReviewerHome() {
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({
    pending_review: 0,
    approved: 0,
    changes_requested: 0
  })

  useEffect(() => {
    const fetchAssignedDrafts = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('draft_assignments')
        .select(`
          id,
          status,
          draft_id,
          content_drafts (
            id,
            title,
            body,
            status,
            created_at,
            updated_at,
            review_by,
            creator_id,
            profiles!creator_id (full_name, email)
          )
        `)
        .eq('reviewer_id', user.id)

      if (error) {
        console.error('Error loading assignments:', error)
        setLoading(false)
        return
      }

      const draftsWithDetails = (data || [])
        .filter((assignment) => assignment.content_drafts)
        .map((assignment) => ({
          ...assignment.content_drafts,
          assignmentId: assignment.id,
          assignmentStatus: assignment.status
        }))

      setAssignments(draftsWithDetails)

      // Compute counts
      const pending = draftsWithDetails.filter(d => d.status === 'pending_review').length
      const approved = draftsWithDetails.filter(d => d.status === 'approved').length
      const changesRequested = draftsWithDetails.filter(d => d.status === 'changes_requested').length

      setCounts({
        pending_review: pending,
        approved,
        changes_requested: changesRequested
      })

      setLoading(false)
    }

    fetchAssignedDrafts()
  }, [])

  const getStatusBadge = (status) => {
    const config = {
      draft: { label: 'Draft', color: '#6b7280' },
      pending_review: { label: 'Pending', color: '#eab308' },
      approved: { label: 'Approved', color: '#22c55e' },
      changes_requested: { label: 'Changes Requested', color: '#f97316' }
    }
    const currentConfig = config[status] || config.draft
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          backgroundColor: currentConfig.color,
          color: 'white'
        }}
      >
        {currentConfig.label}
      </span>
    )
  }

  const rowStyle = { cursor: 'pointer' }

  // Show only the 5 most recent drafts (by created_at)
  const recentDrafts = [...assignments]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading your dashboard...</div>
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', margin: 0 }}>Reviewer Dashboard</h1>
        <p style={{ margin: '8px 0 0 0', color: '#475569' }}>
          Overview of drafts assigned to you
        </p>
      </div>

      {/* Stat Cards */}
      <div className="summary-grid" style={{ marginBottom: '32px' }}>
        <div
          className="summary-card"
          style={{ borderColor: '#eab308', cursor: 'pointer' }}
          onClick={() => navigate('/reviewer/pending')}
        >
          <div className="summary-card-label">Pending</div>
          <div className="summary-card-count">{counts.pending_review}</div>
        </div>
        <div
          className="summary-card"
          style={{ borderColor: '#22c55e', cursor: 'pointer' }}
          onClick={() => navigate('/reviewer/approved')}
        >
          <div className="summary-card-label">Approved</div>
          <div className="summary-card-count">{counts.approved}</div>
        </div>
        <div
          className="summary-card"
          style={{ borderColor: '#f97316', cursor: 'pointer' }}
          onClick={() => navigate('/reviewer/changes-requested')}
        >
          <div className="summary-card-label">Changes Requested</div>
          <div className="summary-card-count">{counts.changes_requested}</div>
        </div>
      </div>

      {/* Recent Drafts Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '2px solid #cbd5e1',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Recent Drafts</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '16px', textAlign: 'left' }}>Title</th>
                <th style={{ padding: '16px', textAlign: 'left' }}>Preview</th>
                <th style={{ padding: '16px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'left' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentDrafts.map((draft, index) => (
                <tr
                  key={draft.id}
                  onClick={() => {
                    // Navigate to the appropriate filtered page with draftId
                    const routeMap = {
                      pending_review: '/reviewer/pending',
                      approved: '/reviewer/approved',
                      changes_requested: '/reviewer/changes-requested'
                    }
                    const baseRoute = routeMap[draft.status] || '/reviewer/pending'
                    navigate(`${baseRoute}?draftId=${draft.id}`)
                  }}
                  style={{
                    ...rowStyle,
                    borderBottom: index === recentDrafts.length - 1 ? 'none' : '1px solid #e2e8f0'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  <td style={{ padding: '16px', fontWeight: '500' }}>{draft.title}</td>
                  <td style={{ padding: '16px', color: '#475569', fontSize: '14px' }}>
                    {draft.body.length > 60 ? draft.body.substring(0, 60) + '...' : draft.body}
                  </td>
                  <td style={{ padding: '16px' }}>{getStatusBadge(draft.status)}</td>
                  <td style={{ padding: '16px', color: '#475569', fontSize: '14px' }}>
                    {new Date(draft.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recentDrafts.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                    No drafts assigned to you yet.
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