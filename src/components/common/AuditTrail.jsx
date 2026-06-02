import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export function AuditTrail({ draftId, onClose }) {
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchAuditTrail() {
      // Fetch draft details with creator info
      const { data: draft, error: draftError } = await supabase
        .from('content_drafts')
        .select('*, creator:profiles!creator_id(full_name)')
        .eq('id', draftId)
        .single()

      if (draftError) {
        console.error('Error fetching draft:', draftError)
        if (isMounted) setLoading(false)
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

      if (isMounted) {
        setTimeline(timelineEvents)
        setLoading(false)
      }
    }

    fetchAuditTrail()

    return () => {
      isMounted = false
    }
  }, [draftId])

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2>Audit Trail</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        {loading ? (
          <p>Loading timeline...</p>
        ) : (
          <div>
            {timeline.length === 0 ? (
              <p className="status-message">No timeline events available.</p>
            ) : (
              timeline.map((event, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-header">
                    <strong>{event.event}</strong>
                    <span>{new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="timeline-meta">By: {event.user}</div>
                  {event.details && (
                    <div className="timeline-details">
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