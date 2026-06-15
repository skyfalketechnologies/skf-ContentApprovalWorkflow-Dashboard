import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient.js'
import { StatusBadge } from '../common/StatusBadge.jsx'
import { ExportButton } from '../common/ExportButton.jsx'
import { submitReviewDecision } from '../../utils/reviewActions.js'

export function DraftDetailView({
  draft,
  onClose,
  onUpdate,
  currentUserId,
  currentUserRole,
  onEditDraft,
  onDeleteDraft,
  onArchiveDraft,
  onRestoreDraft,
  onSubmitDraft
}) {
  const [assignedReviewers, setAssignedReviewers] = useState([])
  const [comments, setComments] = useState([])
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [metaError, setMetaError] = useState('')
  const [savingDecision, setSavingDecision] = useState(false)
  const [decisionError, setDecisionError] = useState('')
  const [decisionType, setDecisionType] = useState('approved')
  const [decisionComment, setDecisionComment] = useState('')
  const [myAssignment, setMyAssignment] = useState(null) // 👈 new state for current reviewer

  const isCreator = currentUserRole === 'creator'
  const isReviewer = currentUserRole === 'reviewer'

  const isArchived = draft.archived_at !== null && draft.archived_at !== undefined && draft.archived_at !== ''

  // Load all assignments & comments (for display)
  useEffect(() => {
    let mounted = true

    const loadMeta = async () => {
      setLoadingMeta(true)
      setMetaError('')

      const [assignmentsResponse, commentsResponse] = await Promise.all([
        supabase
          .from('draft_assignments')
          .select(`
            id,
            reviewer_id,
            status,
            profiles!reviewer_id (
              id,
              full_name,
              email
            )
          `)
          .eq('draft_id', draft.id),
        supabase
          .from('comments')
          .select(`
            id,
            comment_text,
            decision,
            created_at,
            reviewer_id,
            profiles!reviewer_id (
              full_name,
              email
            )
          `)
          .eq('draft_id', draft.id)
          .order('created_at', { ascending: true })
      ])

      if (!mounted) return

      if (assignmentsResponse.error) {
        setMetaError('Error loading reviewers: ' + assignmentsResponse.error.message)
        setAssignedReviewers([])
      } else {
        setAssignedReviewers(assignmentsResponse.data || [])
      }

      if (commentsResponse.error) {
        setMetaError((prev) => prev || 'Error loading comments: ' + commentsResponse.error.message)
        setComments([])
      } else {
        setComments(commentsResponse.data || [])
      }

      setLoadingMeta(false)
    }

    loadMeta()
    return () => { mounted = false }
  }, [draft.id])

  // 👇 Direct fetch for current reviewer's assignment (replaces the old myAssignment memo)
  const loadMyAssignment = useCallback(async () => {
    if (!draft?.id || !currentUserId) return
    const { data, error } = await supabase
      .from('draft_assignments')
      .select('id, status')
      .eq('draft_id', draft.id)
      .eq('reviewer_id', currentUserId)
      .maybeSingle()
    if (error) {
      console.error('Failed to load my assignment:', error)
      return
    }
    setMyAssignment(data || null)
  }, [draft?.id, currentUserId])

  useEffect(() => {
    loadMyAssignment()
  }, [loadMyAssignment])

  // Reviewer action allowed – now uses the direct myAssignment state
  const reviewerActionAllowed =
    isReviewer &&
    draft.status === 'pending_review' &&
    Boolean(myAssignment) &&
    myAssignment.status === 'pending'

  const creatorCanEdit = isCreator && !isArchived && (draft.status === 'draft' || draft.status === 'changes_requested')
  const creatorCanDelete = isCreator && !isArchived && draft.status === 'draft'
  const creatorCanArchive = isCreator && !isArchived && draft.status === 'changes_requested'
  const creatorCanSubmit = isCreator && !isArchived && (draft.status === 'draft' || draft.status === 'changes_requested')
  const creatorCanRestore = isCreator && isArchived

  const refreshAll = async () => {
    if (onUpdate) await onUpdate()
  }

  const handleReviewerDecision = async () => {
    if (!reviewerActionAllowed) return

    if (!decisionComment.trim()) {
      setDecisionError('Please enter a comment before submitting your review.')
      return
    }

    setSavingDecision(true)
    setDecisionError('')

    const result = await submitReviewDecision(draft.id, decisionType, decisionComment)

    if (!result.success) {
      setDecisionError('Error submitting review: ' + result.error)
      setSavingDecision(false)
      return
    }

    setDecisionComment('')
    await Promise.all([refreshAll(), loadMyAssignment()]) // 👈 refresh both
    setSavingDecision(false)
  }

  const getAssignmentBadge = (status) => {
    const config = {
      pending: { label: 'Pending', color: '#eab308' },
      approved: { label: 'Approved', color: '#22c55e' },
      changes_requested: { label: 'Changes Requested', color: '#f97316' }
    }
    const current = config[status] || config.pending
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          backgroundColor: current.color,
          color: 'white'
        }}
      >
        {current.label}
      </span>
    )
  }

  const getCommentDecisionBadge = (decision) => {
    if (!decision) return null
    const config = {
      approved: { label: 'Approved', color: '#22c55e' },
      changes_requested: { label: 'Changes Requested', color: '#f97316' }
    }
    const current = config[decision]
    if (!current) return null
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          backgroundColor: current.color,
          color: 'white'
        }}
      >
        {current.label}
      </span>
    )
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '2px solid #cbd5e1',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Back to list
        </button>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusBadge status={draft.status} />
          {draft.status === 'approved' && currentUserRole !== 'reviewer' && (
            <ExportButton title={draft.title} body={draft.body} />
          )}
        </div>
      </div>

      <h1 style={{ fontSize: '28px', marginBottom: '16px' }}>{draft.title}</h1>

      <div
        style={{
          color: '#475569',
          lineHeight: '1.7',
          marginBottom: '24px',
          whiteSpace: 'pre-wrap'
        }}
      >
        {draft.body}
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {creatorCanEdit && (
          <button onClick={() => onEditDraft?.(draft)} className="btn btn-primary">
            Edit Draft
          </button>
        )}
        {creatorCanDelete && (
          <button
            onClick={async () => await onDeleteDraft?.(draft.id)}
            className="btn btn-secondary"
            style={{ backgroundColor: '#ef4444', color: 'white', borderColor: '#ef4444' }}
          >
            Delete
          </button>
        )}
        {creatorCanArchive && (
          <button
            onClick={async () => await onArchiveDraft?.(draft.id)}
            className="btn btn-secondary"
            style={{ backgroundColor: '#6b7280', color: 'white' }}
          >
            Archive
          </button>
        )}
        {creatorCanRestore && (
          <button
            onClick={async () => await onRestoreDraft?.(draft.id)}
            className="btn btn-primary"
            style={{ backgroundColor: '#22c55e' }}
          >
            Restore Draft
          </button>
        )}
        {creatorCanSubmit && (
          <button
            onClick={async () => await onSubmitDraft?.(draft.id)}
            className="btn btn-primary"
            style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
          >
            {draft.status === 'changes_requested' ? 'Resubmit for Review' : 'Submit for Review'}
          </button>
        )}
      </div>

      {reviewerActionAllowed && (
        <div
          style={{
            marginBottom: '24px',
            padding: '16px',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            backgroundColor: '#f8fafc'
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Submit Review</h3>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="radio"
                name="decision"
                value="approved"
                checked={decisionType === 'approved'}
                onChange={(e) => setDecisionType(e.target.value)}
              />
              Approve
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="radio"
                name="decision"
                value="changes_requested"
                checked={decisionType === 'changes_requested'}
                onChange={(e) => setDecisionType(e.target.value)}
              />
              Request Changes
            </label>
          </div>
          <textarea
            value={decisionComment}
            onChange={(e) => setDecisionComment(e.target.value)}
            rows="5"
            className="form-textarea"
            placeholder="Enter your review comment"
            style={{ marginBottom: '12px' }}
          />
          {decisionError && <div style={{ color: '#991b1b', marginBottom: '12px' }}>{decisionError}</div>}
          <button onClick={handleReviewerDecision} disabled={savingDecision} className="btn btn-primary">
            {savingDecision ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      )}

      <div
        style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #e2e8f0',
          fontSize: '13px',
          color: '#6b7280'
        }}
      >
        <div>Created: {new Date(draft.created_at).toLocaleString()}</div>
        <div>Last updated: {new Date(draft.updated_at).toLocaleString()}</div>
        {draft.review_by && <div>Review deadline: {new Date(draft.review_by).toLocaleDateString()}</div>}
      </div>

      <div
        style={{
          marginTop: '24px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          borderRadius: '10px'
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '20px' }}>Assigned Reviewers</h2>
        {loadingMeta ? (
          <div>Loading reviewers...</div>
        ) : metaError ? (
          <div style={{ color: '#991b1b' }}>{metaError}</div>
        ) : assignedReviewers.length === 0 ? (
          <div style={{ color: '#6b7280' }}>No reviewers assigned.</div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {assignedReviewers.map((assignment) => (
              <div
                key={assignment.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600' }}>
                    {assignment.profiles?.full_name || assignment.profiles?.email || 'Reviewer'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    {assignment.profiles?.email || 'No email'}
                  </div>
                </div>
                <div>{getAssignmentBadge(assignment.status)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: '24px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          borderRadius: '10px'
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '20px' }}>Comments</h2>
        {loadingMeta ? (
          <div>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div style={{ color: '#6b7280' }}>No comments yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  padding: '14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginBottom: '8px'
                  }}
                >
                  <div style={{ fontWeight: '600' }}>
                    {comment.profiles?.full_name || comment.profiles?.email || 'Reviewer'}
                  </div>
                  <div style={{ fontSize: '15px', color: '#475569' }}>
                    {new Date(comment.created_at).toLocaleString()}
                  </div>
                </div>
                {comment.decision && <div style={{ marginBottom: '8px' }}>{getCommentDecisionBadge(comment.decision)}</div>}
                <div style={{ color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {comment.comment_text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}