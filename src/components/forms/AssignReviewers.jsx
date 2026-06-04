import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

/**
 * AssignReviewers Component
 * 
 * Purpose: Allows creators to select reviewers for their draft and set a review deadline.
 * Used when creating a new draft or editing an existing draft that hasn't been submitted yet.
 * 
 * Props:
 * - draftId: UUID of the draft being created/edited (null for new drafts)
 * - onAssignmentsChange: Callback function to notify parent component of selected reviewers
 * - onDeadlineChange: Callback function to notify parent of selected deadline
 * - existingAssignments: Array of existing reviewer IDs (for editing)
 * - existingDeadline: Existing review_by date (for editing)
 * 
 * Features:
 * - Fetches all users with role = 'reviewer'
 * - Shows reviewer workload (pending assignments count)
 * - Prevents selecting overloaded reviewers (optional, shows warning)
 * - Multiple selection of reviewers (2-3 recommended)
 * - Date picker for review deadline
 * - Visual indicators for reviewer availability
 */
export function AssignReviewers({ 
  draftId = null, 
  onAssignmentsChange, 
  onDeadlineChange,
  existingAssignments = [],
  existingDeadline = null
}) {
  const [reviewers, setReviewers] = useState([])
  const [selectedReviewers, setSelectedReviewers] = useState([])
  const [reviewDeadline, setReviewDeadline] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  /**
   * Fetch all reviewers from the database when component mounts
   * Also loads existing assignments if editing an existing draft
   */
  useEffect(() => {
    fetchReviewers()
    
    // If editing existing draft, load existing assignments and deadline
    if (existingAssignments.length > 0) {
      setSelectedReviewers(existingAssignments)
    }
    
    if (existingDeadline) {
      // Format date for input field (YYYY-MM-DD)
      const formattedDate = new Date(existingDeadline).toISOString().split('T')[0]
      setReviewDeadline(formattedDate)
    }
  }, [])

  /**
   * Notify parent component whenever selected reviewers or deadline changes
   */
  useEffect(() => {
    if (onAssignmentsChange) {
      onAssignmentsChange(selectedReviewers)
    }
  }, [selectedReviewers, onAssignmentsChange])

  useEffect(() => {
    if (onDeadlineChange && reviewDeadline) {
      onDeadlineChange(reviewDeadline)
    }
  }, [reviewDeadline, onDeadlineChange])

  /**
   * Fetches all users with role = 'reviewer'
   * Also calculates their current workload (pending assignments count)
   */
  const fetchReviewers = async () => {
    setLoading(true)
    setError('')

    // Fetch all reviewers from profiles table
    const { data: reviewersData, error: reviewersError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'reviewer')
      .order('full_name', { ascending: true })

    if (reviewersError) {
      setError('Error fetching reviewers: ' + reviewersError.message)
      setLoading(false)
      return
    }

    // For each reviewer, get their current pending assignment count
    const reviewersWithLoad = await Promise.all(
      reviewersData.map(async (reviewer) => {
        // Count pending assignments for this reviewer
        const { count, error: countError } = await supabase
          .from('draft_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('reviewer_id', reviewer.id)
          .eq('status', 'pending')

        return {
          ...reviewer,
          pendingCount: count || 0,
          isOverloaded: (count || 0) >= 5  // Consider overloaded if 5+ pending drafts
        }
      })
    )

    setReviewers(reviewersWithLoad)
    setLoading(false)
  }

  /**
   * Toggle selection of a reviewer
   * Allows selecting 1-3 reviewers (prevents selecting too many)
   */
  const toggleReviewer = (reviewerId) => {
    setError('')
    
    // Check if reviewer is already selected
    if (selectedReviewers.includes(reviewerId)) {
      // Remove from selection
      setSelectedReviewers(selectedReviewers.filter(id => id !== reviewerId))
    } else {
      // Add to selection (limit to 3 reviewers maximum)
      if (selectedReviewers.length >= 3) {
        setError('You can assign a maximum of 3 reviewers per draft.')
        return
      }
      setSelectedReviewers([...selectedReviewers, reviewerId])
    }
  }

  /**
   * Checks if a reviewer can be selected (not overloaded)
   */
  const canSelectReviewer = (reviewer) => {
    return !reviewer.isOverloaded || selectedReviewers.includes(reviewer.id)
  }

  /**
   * Saves assignments to the database (called when draft is saved/submitted)
   * This function is called by the parent component, not automatically
   */
  const saveAssignments = async () => {
    if (!draftId) return { success: false, error: 'No draft ID provided' }
    
    if (selectedReviewers.length === 0) {
      return { success: false, error: 'Please select at least one reviewer' }
    }
    
    if (!reviewDeadline) {
      return { success: false, error: 'Please set a review deadline' }
    }

    setSaving(true)
    setError('')

    // First, delete any existing assignments for this draft
    const { error: deleteError } = await supabase
      .from('draft_assignments')
      .delete()
      .eq('draft_id', draftId)

    if (deleteError) {
      setSaving(false)
      return { success: false, error: deleteError.message }
    }

    // Insert new assignments for selected reviewers
    const assignments = selectedReviewers.map(reviewerId => ({
      draft_id: draftId,
      reviewer_id: reviewerId,
      status: 'pending'
    }))

    const { error: insertError } = await supabase
      .from('draft_assignments')
      .insert(assignments)

    setSaving(false)

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    // Update reviewer_load counts (increment each reviewer's load by 1)
    for (const reviewerId of selectedReviewers) {
      // Get current load
      const { data: profile } = await supabase
        .from('profiles')
        .select('reviewer_load')
        .eq('id', reviewerId)
        .single()
      
      const currentLoad = profile?.reviewer_load || 0
      
      // Update with new load
      await supabase
        .from('profiles')
        .update({ reviewer_load: currentLoad + 1 })
        .eq('id', reviewerId)
    }

    return { success: true, error: null }
  }

  /**
   * Get warning message for overloaded reviewer
   */
  const getReviewerWarning = (reviewer) => {
    if (reviewer.isOverloaded) {
      return `⚠️ This reviewer has ${reviewer.pendingCount} pending drafts. Consider choosing someone else.`
    }
    if (reviewer.pendingCount > 2) {
      return `📋 This reviewer has ${reviewer.pendingCount} pending drafts.`
    }
    return null
  }

  if (loading) {
    return (
      <div className="form-field">
        <label className="form-label">Assign Reviewers</label>
        <div className="status-message">Loading reviewers...</div>
      </div>
    )
  }

  return (
    <div className="assign-reviewers-section">
      {/* Reviewer Selection */}
      <div className="form-field">
        <label className="form-label">
          Assign Reviewers (1-3 reviewers)
          <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
            Required
          </span>
        </label>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '12px',
          marginTop: '8px'
        }}>
          {reviewers.map((reviewer) => {
            const isSelected = selectedReviewers.includes(reviewer.id)
            const canSelect = canSelectReviewer(reviewer)
            const warning = getReviewerWarning(reviewer)
            
            return (
              <div
                key={reviewer.id}
                onClick={() => canSelect && toggleReviewer(reviewer.id)}
                style={{
                  padding: '12px',
                  border: `2px solid ${isSelected ? '#22c55e' : '#cbd5e1'}`,
                  borderRadius: '8px',
                  cursor: canSelect ? 'pointer' : 'not-allowed',
                  backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                  opacity: canSelect ? 1 : 0.6,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>
                      {reviewer.full_name || reviewer.email?.split('@')[0] || 'Reviewer'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {reviewer.email}
                    </div>
                    {warning && (
                      <div style={{ fontSize: '11px', color: '#eab308', marginTop: '4px' }}>
                        {warning}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500',
                      backgroundColor: reviewer.pendingCount === 0 ? '#dcfce7' : 
                                     reviewer.pendingCount <= 2 ? '#fef3c7' : '#fee2e2',
                      color: reviewer.pendingCount === 0 ? '#166534' : 
                             reviewer.pendingCount <= 2 ? '#92400e' : '#991b1b'
                    }}>
                      {reviewer.pendingCount} pending
                    </div>
                    {isSelected && (
                      <div style={{ fontSize: '20px', color: '#22c55e', marginTop: '4px' }}>✓</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {reviewers.length === 0 && (
          <div className="status-message" style={{ marginTop: '8px' }}>
            No reviewers available. Please contact an admin to add reviewers.
          </div>
        )}

        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
          Selected: {selectedReviewers.length} reviewer(s)
        </div>
        
        {error && (
          <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
            {error}
          </div>
        )}
      </div>

      {/* Review Deadline Picker */}
      <div className="form-field">
        <label className="form-label">
          Review Deadline
          <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
            Required
          </span>
        </label>
        <input
          type="date"
          value={reviewDeadline}
          onChange={(e) => setReviewDeadline(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="form-input"
          style={{ width: '100%' }}
        />
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
          Reviewers will be notified of this deadline. Set a realistic date (minimum 1 day from now).
        </div>
      </div>

      {/* Hidden save function – call from parent */}
      {/* The parent component should call saveAssignments() when the draft is saved */}
    </div>
  )
}

// Export the saveAssignments function as a separate utility
export const saveDraftAssignments = async (draftId, reviewerIds, deadline) => {
  if (!draftId) return { success: false, error: 'No draft ID provided' }
  
  if (!reviewerIds || reviewerIds.length === 0) {
    return { success: false, error: 'Please select at least one reviewer' }
  }
  
  if (!deadline) {
    return { success: false, error: 'Please set a review deadline' }
  }

  // First, delete any existing assignments for this draft
  const { error: deleteError } = await supabase
    .from('draft_assignments')
    .delete()
    .eq('draft_id', draftId)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  // Insert new assignments
  const assignments = reviewerIds.map(reviewerId => ({
    draft_id: draftId,
    reviewer_id: reviewerId,
    status: 'pending'
  }))

  const { error: insertError } = await supabase
    .from('draft_assignments')
    .insert(assignments)

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  // Update the draft with the deadline
  const { error: deadlineError } = await supabase
    .from('content_drafts')
    .update({ review_by: deadline })
    .eq('id', draftId)

  if (deadlineError) {
    return { success: false, error: deadlineError.message }
  }

  // Update reviewer_load counts
  for (const reviewerId of reviewerIds) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('reviewer_load')
      .eq('id', reviewerId)
      .single()
    
    const currentLoad = profile?.reviewer_load || 0
    await supabase
      .from('profiles')
      .update({ reviewer_load: currentLoad + 1 })
      .eq('id', reviewerId)
  }

  return { success: true, error: null }
}