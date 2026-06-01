import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export function AuditTrail({ draftId, onClose }) {
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuditTrail()
  }, [draftId])

  async function fetchAuditTrail() {
    // Fetch draft details with creator info
    const { data: draft, error: draftError } = await supabase
      .from('content_drafts')
      .select('*, creator:profiles!creator_id(full_name)')
      .eq('id', draftId)
      .single()

    if (draftError) {
      console.error('Error fetching draft:', draftError)
      setLoading(false)
      return
    }

    // Fetch review comments
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*, reviewer:profiles!reviewer_id(full_name)')
      .eq('draft_id', draftId)
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
    }

    const timelineEvents = []

    // Event 1: Draft Created
    if (draft) {
      timelineEvents.push({
        event: 'Draft Created',
        timestamp: draft.created_at,
        user: draft.creator?.full_name || 'Unknown',
        details: `Title: "${draft.title}"`
      })

      // Event 2: Submitted for Review (if status changed from draft)
      if (draft.status !== 'draft') {
        timelineEvents.push({
          event: 'Submitted for Review',
          timestamp: draft.updated_at,
          user: draft.creator?.full_name || 'Unknown',
          details: 'Status changed to: Pending Review'
        })
      }

      // Event 3: Final Decision (if approved or rejected)
      if (draft.status === 'approved' || draft.status === 'rejected') {
        const lastComment = comments?.[comments.length - 1]
        if (lastComment) {
          timelineEvents.push({
            event: `Final Decision: ${draft.status.toUpperCase()}`,
            timestamp: lastComment.created_at,
            user: lastComment.reviewer?.full_name || 'Reviewer',
            details: `Comment: ${lastComment.comment_text}`
          })
        }
      }
    }

    setTimeline(timelineEvents)
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        border: '2px solid #cbd5e1',
        borderRadius: '4px',
        width: '600px',
        maxWidth: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Audit Trail</h2>
          <button 
            onClick={onClose} 
            style={{ 
              border: 'none', 
              background: 'none', 
              fontSize: '24px', 
              cursor: 'pointer',
              padding: '0 8px'
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <p>Loading timeline...</p>
        ) : (
          <div>
            {timeline.length === 0 ? (
              <p style={{ color: '#475569' }}>No timeline events available.</p>
            ) : (
              timeline.map((event, index) => (
                <div key={index} style={{
                  borderLeft: '3px solid #1e40af',
                  paddingLeft: '16px',
                  marginBottom: '24px',
                  paddingBottom: index !== timeline.length - 1 ? '16px' : 0,
                  borderBottom: index !== timeline.length - 1 ? '1px solid #e5e7eb' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <strong style={{ fontSize: '16px' }}>{event.event}</strong>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>
                    By: {event.user}
                  </div>
                  {event.details && (
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                      {event.details}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}