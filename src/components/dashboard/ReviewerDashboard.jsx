import { useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useSupabaseRealtime } from '../../hooks/useSupabaseRealtime'
import { DraftCard } from './DraftCard'
import { ReviewComment } from '../forms/ReviewComment'
import { AuditTrail } from '../common/AuditTrail'

export function ReviewerDashboard({ filter = 'pending_review' }) {
  const [selectedDraft, setSelectedDraft] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [auditDraft, setAuditDraft] = useState(null)
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  const { data: drafts, loading, error: draftsError } = useSupabaseRealtime('content_drafts')

  const visibleDrafts = useMemo(() => {
    return drafts.filter((draft) => draft.status === filter)
  }, [drafts, filter])

  const pageTitle = {
    pending_review: 'Pending Reviews',
    approved: 'Approved Reviews',
    changes_requested: 'Changes Requested'
  }[filter] || 'Reviews'

  const handleReview = async (draftId, decision, commentText) => {
    if (!commentText.trim()) {
      setActionError('Please provide a comment explaining your decision.')
      return
    }

    setActionError('')
    setActionMessage('')

    const { data: updatedDrafts, error: draftError } = await supabase
      .from('content_drafts')
      .update({ status: decision })
      .eq('id', draftId)
      .eq('status', 'pending_review')
      .select('id, status')

    if (draftError) {
      setActionError('Error updating draft status: ' + draftError.message)
      return
    }

    if (!updatedDrafts?.length) {
      setActionError('Draft was not reviewed. It may no longer be pending review, or your account does not have reviewer permission.')
      return
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      setActionError(userError?.message || 'Could not identify the signed-in reviewer.')
      return
    }

    const { error: commentError } = await supabase
      .from('comments')
      .insert({
        draft_id: draftId,
        reviewer_id: user.id,
        comment_text: commentText
      })

    if (commentError) {
      setActionError('Error saving comment: ' + commentError.message)
    } else {
      const successMessage = decision === 'approved' ? 'Draft approved.' : 'Changes requested. The author has been notified.'
      setActionMessage(successMessage)
      setShowReviewModal(false)
      setSelectedDraft(null)
    }
  }

  if (loading) return <div>Loading drafts...</div>

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        borderBottom: '2px solid #cbd5e1',
        paddingBottom: '16px',
        marginBottom: '32px'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', margin: 0 }}>{pageTitle}</h1>
        <p style={{ color: '#475569', marginTop: '8px' }}>
          {visibleDrafts.length} draft(s) in this view
        </p>
      </div>

      {draftsError && (
        <div style={{ marginBottom: '16px', color: '#991b1b' }}>
          Error loading drafts: {draftsError}
        </div>
      )}

      {actionError && (
        <div style={{ marginBottom: '16px', color: '#991b1b' }}>
          {actionError}
        </div>
      )}

      {actionMessage && (
        <div style={{ marginBottom: '16px', color: '#166534' }}>
          {actionMessage}
        </div>
      )}

      <div style={{ display: 'grid', gap: '16px' }}>
        {visibleDrafts.map((draft) => (
          <DraftCard
            key={draft.id}
            draft={draft}
            role="reviewer"
            onReview={() => {
              setSelectedDraft(draft)
              setShowReviewModal(true)
            }}
            onViewAudit={() => setAuditDraft(draft)}
          />
        ))}

        {visibleDrafts.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            backgroundColor: '#f9fafb',
            border: '2px solid #e5e7eb'
          }}>
            <p>No drafts match this filter yet.</p>
          </div>
        )}
      </div>

      {showReviewModal && selectedDraft && (
        <ReviewComment
          draft={selectedDraft}
          onClose={() => {
            setShowReviewModal(false)
            setSelectedDraft(null)
          }}
          onSubmit={(decision, comment) => handleReview(selectedDraft.id, decision, comment)}
        />
      )}

      {auditDraft && (
        <AuditTrail draftId={auditDraft.id} onClose={() => setAuditDraft(null)} />
      )}
    </div>
  )
}