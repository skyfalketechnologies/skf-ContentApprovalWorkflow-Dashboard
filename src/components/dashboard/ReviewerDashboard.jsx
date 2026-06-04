import { useMemo, useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { ReviewComment } from '../forms/ReviewComment'
import { AuditTrail } from '../common/AuditTrail'

/**
 * ReviewerDashboard Component
 * 
 * Purpose: Allows reviewers to see drafts assigned to them and provide feedback
 * 
 * Features:
 * - Shows ONLY drafts assigned to the logged-in reviewer
 * - Displays deadlines and overdue indicators
 * - Shows workload (pending assignments count)
 * - Allows approval or request changes with comments
 * - Updates reviewer_load automatically when responding
 */
export function ReviewerDashboard({ filter = 'pending_review' }) {
  const [selectedDraft, setSelectedDraft] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [auditDraft, setAuditDraft] = useState(null)
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [myAssignments, setMyAssignments] = useState([])
  const [myWorkload, setMyWorkload] = useState(0)
  const [loading, setLoading] = useState(true)

  /**
   * Fetch all drafts assigned to the current reviewer
   * Also calculates deadline status (overdue, due soon, etc.)
   */
  const fetchMyAssignments = async (reviewerId) => {
    setLoading(true)
    setActionError('')

    // Get all assignments for this reviewer with status 'pending'
    const { data: assignments, error: assignError } = await supabase
      .from('draft_assignments')
      .select(`
        id,
        status,
        assigned_at,
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
          profiles!creator_id (
            full_name,
            email
          )
        )
      `)
      .eq('reviewer_id', reviewerId)
      .eq('status', 'pending')

    if (assignError) {
      setActionError('Error loading assignments: ' + assignError.message)
      setLoading(false)
      return
    }

    // Process assignments to add deadline status
    const processedAssignments = assignments.map(assignment => {
      const draft = assignment.content_drafts
      const deadline = draft?.review_by ? new Date(draft.review_by) : null
      const now = new Date()
      
      let deadlineStatus = 'none'
      let daysUntilDeadline = null
      
      if (deadline) {
        daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
        if (now > deadline) {
          deadlineStatus = 'overdue'
        } else if (daysUntilDeadline <= 2) {
          deadlineStatus = 'due_soon'
        } else if (daysUntilDeadline <= 7) {
          deadlineStatus = 'upcoming'
        }
      }
      
      return {
        ...assignment,
        draft: {
          ...draft,
          deadlineStatus,
          deadlineDate: deadline,
          creatorName: draft?.profiles?.full_name || draft?.profiles?.email || 'Unknown',
          daysUntilDeadline
        }
      }
    })

    setMyAssignments(processedAssignments)
    setMyWorkload(processedAssignments.length)
    setLoading(false)
  }

  // Get current user and fetch assignments on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await fetchMyAssignments(user.id)
      }
    }
    getCurrentUser()
  }, [])

  /**
   * Filter assignments based on the selected filter
   */
  const visibleAssignments = useMemo(() => {
    if (filter === 'pending_review') {
      return myAssignments.filter(a => a.draft?.status === 'pending_review')
    } else if (filter === 'approved') {
      return myAssignments.filter(a => a.draft?.status === 'approved')
    } else if (filter === 'changes_requested') {
      return myAssignments.filter(a => a.draft?.status === 'changes_requested')
    }
    return myAssignments
  }, [myAssignments, filter])

  // Page title based on filter
  const pageTitle = {
    pending_review: 'Pending Reviews',
    approved: 'Approved Reviews',
    changes_requested: 'Changes Requested'
  }[filter] || 'Reviews'

  /**
   * Handle review submission (approve or request changes)
   */
  const handleReview = async (draftId, decision, commentText) => {
    if (!commentText.trim()) {
      setActionError('Please provide a comment explaining your decision.')
      return
    }

    setActionError('')
    setActionMessage('')
    setLoading(true)

    // 1. Update the draft status
    const { data: updatedDrafts, error: draftError } = await supabase
      .from('content_drafts')
      .update({ status: decision })
      .eq('id', draftId)
      .eq('status', 'pending_review')
      .select('id, status')

    if (draftError) {
      setActionError('Error updating draft status: ' + draftError.message)
      setLoading(false)
      return
    }

    if (!updatedDrafts?.length) {
      setActionError('Draft was not reviewed. It may no longer be pending review.')
      setLoading(false)
      return
    }

    // 2. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      setActionError(userError?.message || 'Could not identify the signed-in reviewer.')
      setLoading(false)
      return
    }

    // 3. Save the comment
    const { error: commentError } = await supabase
      .from('comments')
      .insert({
        draft_id: draftId,
        reviewer_id: user.id,
        comment_text: commentText
      })

    if (commentError) {
      setActionError('Error saving comment: ' + commentError.message)
      setLoading(false)
      return
    }

    // 4. Update the assignment status
    const { error: assignError } = await supabase
      .from('draft_assignments')
      .update({ 
        status: decision === 'approved' ? 'approved' : 'changes_requested',
        responded_at: new Date()
      })
      .eq('draft_id', draftId)
      .eq('reviewer_id', user.id)

    if (assignError) {
      console.error('Error updating assignment:', assignError)
    }

    // 5. Update reviewer_load (decrement by 1)
    const { data: profile } = await supabase
      .from('profiles')
      .select('reviewer_load')
      .eq('id', user.id)
      .single()
    
    const currentLoad = profile?.reviewer_load || 0
    await supabase
      .from('profiles')
      .update({ reviewer_load: Math.max(0, currentLoad - 1) })
      .eq('id', user.id)

    // 6. Refresh assignments
    await fetchMyAssignments(user.id)

    const successMessage = decision === 'approved' 
      ? 'Draft approved successfully.' 
      : 'Changes requested. The author has been notified.'

    setActionMessage(successMessage)
    setShowReviewModal(false)
    setSelectedDraft(null)
    setLoading(false)
  }

  /**
   * Get deadline badge color and text
   */
  const getDeadlineInfo = (deadlineStatus, daysUntil) => {
    switch (deadlineStatus) {
      case 'overdue':
        return { color: '#ef4444', text: 'Overdue', icon: '🔴' }
      case 'due_soon':
        return { color: '#eab308', text: `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`, icon: '🟡' }
      case 'upcoming':
        return { color: '#22c55e', text: `Due in ${daysUntil} days`, icon: '🟢' }
      default:
        return { color: '#6b7280', text: 'No deadline', icon: '⚪' }
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div>Loading your assignments...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Workload Summary Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '12px'
      }}>
        <div>
          <span style={{ fontSize: '14px', color: '#475569' }}>Your workload</span>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{myWorkload}</div>
          <span style={{ fontSize: '12px', color: '#475569' }}>pending reviews</span>
        </div>
        <div style={{
          width: '200px',
          height: '8px',
          backgroundColor: '#e2e8f0',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(100, (myWorkload / 10) * 100)}%`,
            height: '100%',
            backgroundColor: myWorkload > 5 ? '#ef4444' : myWorkload > 2 ? '#eab308' : '#22c55e',
            transition: 'width 0.3s ease'
          }} />
        </div>
        <div>
          {myWorkload > 5 && (
            <span style={{ fontSize: '12px', color: '#ef4444' }}>
              ⚠️ High workload - consider reassigning some drafts
            </span>
          )}
        </div>
      </div>

      {/* Page Header */}
      <div style={{
        borderBottom: '2px solid #cbd5e1',
        paddingBottom: '16px',
        marginBottom: '24px'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', margin: 0 }}>{pageTitle}</h1>
        <p style={{ color: '#475569', marginTop: '8px' }}>
          {visibleAssignments.length} draft(s) assigned to you
        </p>
      </div>

      {/* Error and Success Messages */}
      {actionError && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '8px' }}>
          {actionError}
        </div>
      )}

      {actionMessage && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '8px' }}>
          {actionMessage}
        </div>
      )}

      {/* Drafts List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {visibleAssignments.map((assignment) => {
          const draft = assignment.draft
          const deadlineInfo = getDeadlineInfo(draft.deadlineStatus, draft.daysUntilDeadline)
          
          return (
            <div key={assignment.id} style={{
              backgroundColor: '#ffffff',
              border: '2px solid #cbd5e1',
              borderRadius: '12px',
              padding: '20px'
            }}>
              {/* Deadline Banner */}
              {(draft.deadlineStatus === 'overdue' || draft.deadlineStatus === 'due_soon') && (
                <div style={{
                  marginBottom: '12px',
                  padding: '8px 12px',
                  backgroundColor: draft.deadlineStatus === 'overdue' ? '#fef2f2' : '#fefce8',
                  borderLeft: `4px solid ${deadlineInfo.color}`,
                  borderRadius: '4px'
                }}>
                  <span style={{ fontSize: '13px', color: deadlineInfo.color }}>
                    {deadlineInfo.icon} {deadlineInfo.text}
                  </span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>{draft.title}</h3>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    By {draft.creatorName} • Created {new Date(draft.created_at).toLocaleDateString()}
                  </div>
                  {draft.deadlineDate && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      Review by: {new Date(draft.deadlineDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setAuditDraft(draft)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'transparent',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  View Audit
                </button>
              </div>
              
              <p style={{ color: '#475569', margin: '12px 0', lineHeight: '1.5' }}>
                {draft.body.length > 200 ? draft.body.substring(0, 200) + '...' : draft.body}
              </p>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                {draft.status === 'pending_review' && (
                  <button 
                    onClick={() => {
                      setSelectedDraft(draft)
                      setShowReviewModal(true)
                    }} 
                    style={{
                      backgroundColor: '#1e40af',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Review Draft
                  </button>
                )}
                {draft.status !== 'pending_review' && (
                  <span style={{ color: '#475569', fontStyle: 'italic' }}>
                    This draft has been {draft.status === 'approved' ? 'approved' : 'returned for changes'}
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {visibleAssignments.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            backgroundColor: '#f9fafb',
            border: '2px solid #e5e7eb',
            borderRadius: '12px'
          }}>
            <p>No drafts assigned to you match this filter.</p>
            {myWorkload === 0 && (
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                You're all caught up! Check back later for new assignments.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
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

      {/* Audit Trail Modal */}
      {auditDraft && (
        <AuditTrail draftId={auditDraft.id} onClose={() => setAuditDraft(null)} />
      )}
    </div>
  )
}