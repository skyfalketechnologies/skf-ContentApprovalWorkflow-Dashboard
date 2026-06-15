import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient.js'

export function AuditTrail({ draftId, onClose }) {
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchAuditTrail() {
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

      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*, reviewer:profiles!reviewer_id(full_name)')
        .eq('draft_id', draftId)
        .order('created_at', { ascending: true })

      if (commentsError) console.error('Error fetching comments:', commentsError)

      const events = []

      events.push({
        type: 'create',
        timestamp: draft.created_at,
        user: draft.creator?.full_name || 'Unknown',
        comment: null
      })

      if (comments && comments.length > 0) {
        events.push({
          type: 'submit',
          timestamp: draft.updated_at,
          user: draft.creator?.full_name || 'Unknown',
          comment: null
        })
      }

      for (const comment of comments) {
        events.push({
          type: 'review',
          timestamp: comment.created_at,
          user: comment.reviewer?.full_name || 'Reviewer',
          comment: comment.comment_text,
        })
      }

      events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

      if (isMounted) {
        setTimeline(events)
        setLoading(false)
      }
    }

    fetchAuditTrail()
    return () => { isMounted = false }
  }, [draftId])

  const formatEvent = (event) => {
    switch (event.type) {
      case 'create':
        return { label: 'Draft created', detail: null }
      case 'submit':
        return { label: 'Submitted for review', detail: null }
      case 'review': {
        const truncated = event.comment.length > 100
          ? event.comment.substring(0, 100) + '...'
          : event.comment
        return { label: 'Review', detail: `Feedback: "${truncated}"` }
      }
      default:
        return { label: 'Event', detail: null }
    }
  }

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
              <p className="status-message">No events recorded.</p>
            ) : (
              timeline.map((event, idx) => {
                const { label, detail } = formatEvent(event)
                return (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-header">
                      <strong>{label}</strong>
                      <span>{new Date(event.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="timeline-meta">By: {event.user}</div>
                    {detail && <div className="timeline-details">{detail}</div>}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}