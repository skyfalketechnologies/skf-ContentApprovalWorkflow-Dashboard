import { useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useSupabaseRealtime } from '../../hooks/useSupabaseRealtime'
import { DraftCard } from './DraftCard'
import { DraftForm } from '../forms/DraftForm'
import { AuditTrail } from '../common/AuditTrail'
import { AssignReviewers, saveDraftAssignments } from '../forms/AssignReviewers'

/**
 * CreatorDashboard Component
 * 
 * Purpose: Allows creators to manage their drafts (create, edit, delete, submit)
 * 
 * Features:
 * - View drafts filtered by status (all, draft, pending, approved, changes_requested)
 * - Create new drafts with reviewer assignment and deadline
 * - Edit existing drafts (only if status is 'draft' or 'changes_requested')
 * - Delete drafts (only if status is 'draft')
 * - Submit drafts for review (requires at least one reviewer assigned)
 * - View audit trail for each draft
 */
export function CreatorDashboard({ profile, filter = 'all' }) {
  const [showForm, setShowForm] = useState(false)
  const [editingDraft, setEditingDraft] = useState(null)
  const [selectedDraftForAudit, setSelectedDraftForAudit] = useState(null)
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  
  // State for reviewer assignment (only used when creating/editing)
  const [selectedReviewers, setSelectedReviewers] = useState([])
  const [reviewDeadline, setReviewDeadline] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: drafts, setData: setDrafts, loading, error: draftsError } = useSupabaseRealtime(
    'content_drafts',
    'creator_id',
    profile.id
  )

  // Filter drafts based on selected filter
  const visibleDrafts = useMemo(() => {
    return drafts.filter((draft) => filter === 'all' ? true : draft.status === filter)
  }, [drafts, filter])

  // Page title based on filter
  const pageTitle = {
    all: 'All Drafts',
    draft: 'Drafts',
    pending_review: 'Pending Drafts',
    approved: 'Approved Drafts',
    changes_requested: 'Changes Requested'
  }[filter] || 'Drafts'

  /**
   * Delete a draft (only allowed if status is 'draft')
   */
  const handleDelete = async (draftId) => {
    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) return

    setActionError('')
    setActionMessage('')

    const { data, error } = await supabase
      .from('content_drafts')
      .delete()
      .eq('id', draftId)
      .eq('creator_id', profile.id)
      .eq('status', 'draft')
      .select('id')

    if (error) {
      setActionError('Error deleting draft: ' + error.message)
      return
    }

    if (!data?.length) {
      setActionError('Draft was not deleted. It may no longer be in draft status, or your account does not have permission.')
      return
    }

    setDrafts((currentDrafts) => currentDrafts.filter((draft) => draft.id !== draftId))
    setActionMessage('Draft deleted successfully.')
  }

  /**
   * Submit a draft for review
   * Requires at least one reviewer assigned and a deadline set
   */
  const handleSubmit = async (draftId) => {
    setActionError('')
    setActionMessage('')
    setIsSubmitting(true)

    // First, check if this draft has any assignments
    const { data: assignments, error: assignError } = await supabase
      .from('draft_assignments')
      .select('reviewer_id')
      .eq('draft_id', draftId)

    if (assignError) {
      setActionError('Error checking assignments: ' + assignError.message)
      setIsSubmitting(false)
      return
    }

    if (!assignments || assignments.length === 0) {
      setActionError('Cannot submit: No reviewers assigned. Please edit the draft and add reviewers.')
      setIsSubmitting(false)
      return
    }

    // Check if deadline is set
    const { data: draft, error: draftError } = await supabase
      .from('content_drafts')
      .select('review_by')
      .eq('id', draftId)
      .single()

    if (draftError) {
      setActionError('Error checking deadline: ' + draftError.message)
      setIsSubmitting(false)
      return
    }

    if (!draft?.review_by) {
      setActionError('Cannot submit: No review deadline set. Please edit the draft and set a deadline.')
      setIsSubmitting(false)
      return
    }

    // Update draft status to pending_review
    const { data, error } = await supabase
      .from('content_drafts')
      .update({ status: 'pending_review' })
      .eq('id', draftId)
      .eq('creator_id', profile.id)
      .in('status', ['draft', 'changes_requested'])
      .select('*')

    if (error) {
      setActionError('Error submitting for review: ' + error.message)
      setIsSubmitting(false)
      return
    }

    if (!data?.length) {
      setActionError('Draft was not submitted. It may no longer be editable, or your account does not have permission.')
      setIsSubmitting(false)
      return
    }

    setDrafts((currentDrafts) => currentDrafts.map((draft) => draft.id === draftId ? data[0] : draft))
    setActionMessage('Draft submitted for review. Reviewers have been notified.')
    setIsSubmitting(false)
  }

  /**
   * Open edit form for a draft
   * Also loads existing assignments and deadline for editing
   */
  const handleEdit = async (draft) => {
    setEditingDraft(draft)
    
    // Load existing assignments for this draft
    const { data: assignments } = await supabase
      .from('draft_assignments')
      .select('reviewer_id')
      .eq('draft_id', draft.id)
    
    if (assignments && assignments.length > 0) {
      setSelectedReviewers(assignments.map(a => a.reviewer_id))
    } else {
      setSelectedReviewers([])
    }
    
    // Load existing deadline
    if (draft.review_by) {
      const formattedDate = new Date(draft.review_by).toISOString().split('T')[0]
      setReviewDeadline(formattedDate)
    } else {
      setReviewDeadline('')
    }
    
    setShowForm(true)
  }

  /**
   * Save a new draft or update existing one
   * Handles reviewer assignments and deadline
   */
  const handleSaveDraft = async (draftData) => {
    setActionError('')
    setActionMessage('')
    
    let savedDraftId = editingDraft?.id
    
    if (editingDraft) {
      // Update existing draft (only title and body, status remains unchanged)
      const { error } = await supabase
        .from('content_drafts')
        .update({ 
          title: draftData.title, 
          body: draftData.body,
          updated_at: new Date()
        })
        .eq('id', editingDraft.id)
        .eq('creator_id', profile.id)
      
      if (error) {
        setActionError('Error updating draft: ' + error.message)
        return false
      }
      savedDraftId = editingDraft.id
    } else {
      // Create new draft
      const { data, error } = await supabase
        .from('content_drafts')
        .insert({
          title: draftData.title,
          body: draftData.body,
          creator_id: profile.id,
          status: 'draft'
        })
        .select()
        .single()
      
      if (error) {
        setActionError('Error creating draft: ' + error.message)
        return false
      }
      savedDraftId = data.id
    }
    
    // Save reviewer assignments and deadline
    if (selectedReviewers.length > 0 && reviewDeadline) {
      const result = await saveDraftAssignments(savedDraftId, selectedReviewers, reviewDeadline)
      if (!result.success) {
        setActionError('Draft saved but assignment error: ' + result.error)
      }
    }
    
    setActionMessage(editingDraft ? 'Draft updated successfully.' : 'Draft created successfully.')
    
    // Refresh the drafts list
    const { data: refreshedDrafts } = await supabase
      .from('content_drafts')
      .select('*')
      .eq('creator_id', profile.id)
      .order('created_at', { ascending: false })
    
    if (refreshedDrafts) {
      setDrafts(refreshedDrafts)
    }
    
    return true
  }

  const handleSaveComplete = async (draftData) => {
    const success = await handleSaveDraft(draftData)
    if (success) {
      setShowForm(false)
      setEditingDraft(null)
      setSelectedReviewers([])
      setReviewDeadline('')
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingDraft(null)
    setSelectedReviewers([])
    setReviewDeadline('')
    setActionError('')
    setActionMessage('')
  }

  if (loading) return <div>Loading drafts...</div>

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', margin: 0 }}>{pageTitle}</h1>
          <p style={{ margin: '8px 0 0 0', color: '#475569' }}>
            Showing {visibleDrafts.length} draft(s) for this view.
          </p>
        </div>
        {(filter === 'all' || filter === 'draft' || filter === 'changes_requested') && (
          <button
            onClick={() => {
              setEditingDraft(null)
              setSelectedReviewers([])
              setReviewDeadline('')
              setShowForm(true)
            }}
            className="btn btn-primary"
            style={{ fontSize: '14px' }}
          >
            + New Draft
          </button>
        )}
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

      {showForm && (
        <div style={{
          marginBottom: '32px',
          padding: '20px',
          border: '2px solid #cbd5e1',
          backgroundColor: '#ffffff',
          borderRadius: '12px'
        }}>
          <DraftForm
            draft={editingDraft}
            userId={profile.id}
            onSave={handleSaveComplete}
            onCancel={handleCancelForm}
          />
          
          {/* Reviewer Assignment Section (only shown for new drafts or drafts that can be edited) */}
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #cbd5e1' }}>
            <AssignReviewers
              draftId={editingDraft?.id || null}
              onAssignmentsChange={setSelectedReviewers}
              onDeadlineChange={setReviewDeadline}
              existingAssignments={selectedReviewers}
              existingDeadline={reviewDeadline}
            />
          </div>
        </div>
      )}

      <div className="drafts-grid">
        {visibleDrafts.map((draft) => (
          <DraftCard
            key={draft.id}
            draft={draft}
            role="creator"
            onEdit={() => handleEdit(draft)}
            onDelete={() => handleDelete(draft.id)}
            onSubmit={() => handleSubmit(draft.id)}
            onViewAudit={() => setSelectedDraftForAudit(draft)}
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

      {selectedDraftForAudit && (
        <AuditTrail
          draftId={selectedDraftForAudit.id}
          onClose={() => setSelectedDraftForAudit(null)}
        />
      )}
    </div>
  )
}