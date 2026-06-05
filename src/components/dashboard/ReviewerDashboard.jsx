import { useMemo, useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { DraftDetailView } from './DraftDetailView'

export function ReviewerDashboard({ filter = 'pending_review' }) {
  const [selectedDraftForDetail, setSelectedDraftForDetail] = useState(null)
  const [myAssignments, setMyAssignments] = useState([])
  const [myWorkload, setMyWorkload] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)

  const fetchMyAssignments = async (reviewerId) => {
    setLoading(true)

    const { data: assignments, error } = await supabase
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
      .eq('reviewer_id', reviewerId)

    if (error) {
      console.error('Error loading assignments:', error)
      setLoading(false)
      return
    }

    const draftsWithDetails = assignments
      .filter(a => a.content_drafts)
      .map(a => ({
        ...a.content_drafts,
        assignmentId: a.id,
        assignmentStatus: a.status
      }))

    setMyAssignments(draftsWithDetails)
    setMyWorkload(draftsWithDetails.filter(d => d.status === 'pending_review').length)
    setLoading(false)
  }

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        await fetchMyAssignments(user.id)
      }
    }
    getCurrentUser()
  }, [])

  const visibleDrafts = useMemo(() => {
    return myAssignments.filter(draft => draft.status === filter)
  }, [myAssignments, filter])

  const pageTitle = {
    pending_review: 'Pending Reviews',
    approved: 'Approved Reviews',
    changes_requested: 'Changes Requested'
  }[filter] || 'Reviews'

  const isEditable = false

  const getStatusBadge = (status) => {
    const config = {
      draft: { label: 'Draft', color: '#6b7280' },
      pending_review: { label: 'Pending', color: '#eab308' },
      approved: { label: 'Approved', color: '#22c55e' },
      changes_requested: { label: 'Changes Requested', color: '#f97316' }
    }
    const c = config[status] || config.draft
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: c.color,
        color: 'white'
      }}>
        {c.label}
      </span>
    )
  }

  if (loading) return <div>Loading...</div>

  if (selectedDraftForDetail) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <DraftDetailView
          draft={selectedDraftForDetail}
          onClose={() => setSelectedDraftForDetail(null)}
          onUpdate={async () => {
            if (userId) await fetchMyAssignments(userId)
          }}
          isEditable={isEditable}
          currentUserId={userId}
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: 0 }}>{pageTitle}</h1>
          <p style={{ margin: '8px 0 0 0', color: '#475569' }}>
            {visibleDrafts.length} draft(s) assigned to you
          </p>
        </div>
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '8px'
        }}>
          <span>Your workload: </span>
          <strong>{myWorkload}</strong> <span>pending</span>
        </div>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #cbd5e1',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '16px', textAlign: 'left' }}>Title</th>
                <th style={{ padding: '16px', textAlign: 'left' }}>Preview</th>
                <th style={{ padding: '16px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'left' }}>Created</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleDrafts.map((draft, index) => (
                <tr key={draft.id} style={{
                  borderBottom: index === visibleDrafts.length - 1 ? 'none' : '1px solid #e2e8f0'
                }}>
                  <td style={{ padding: '16px', fontWeight: '500' }}>{draft.title}</td>
                  <td style={{ padding: '16px', color: '#475569', fontSize: '14px' }}>
                    {draft.body.length > 60 ? draft.body.substring(0, 60) + '...' : draft.body}
                  </td>
                  <td style={{ padding: '16px' }}>{getStatusBadge(draft.status)}</td>
                  <td style={{ padding: '16px', color: '#475569', fontSize: '14px' }}>
                    {new Date(draft.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button
                      onClick={() => setSelectedDraftForDetail(draft)}
                      style={{
                        padding: '6px 16px',
                        backgroundColor: '#1e40af',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
              {visibleDrafts.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                    No drafts assigned to you.
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