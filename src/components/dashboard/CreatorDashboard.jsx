import { useMemo, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useSupabaseRealtime } from '../../hooks/useSupabaseRealtime'
import { DraftCard } from './DraftCard'
import { DraftForm } from '../forms/DraftForm'
import { AuditTrail } from '../common/AuditTrail'
import { AssignReviewers, saveDraftAssignments } from '../forms/AssignReviewers'

export function CreatorDashboard({ profile, filter = 'all' }) {
  const [searchParams] = useSearchParams()
  const draftIdFromUrl = searchParams.get('draftId')
  
  const [showForm, setShowForm] = useState(false)
  const [editingDraft, setEditingDraft] = useState(null)
  const [selectedDraftForAudit, setSelectedDraftForAudit] = useState(null)
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  
  const [selectedReviewers, setSelectedReviewers] = useState([])
  const [reviewDeadline, setReviewDeadline] = useState('')

  const { data: drafts, setData: setDrafts, loading, error: draftsError } = useSupabaseRealtime(
    'content_drafts',
    'creator_id',
    profile.id
  )

  const visibleDrafts = useMemo(() => {
    return drafts.filter((draft) => filter === 'all' ? true : draft.status === filter)
  }, [drafts, filter])

  const pageTitle = {
    all: 'All Drafts',
    draft: 'Drafts',
    pending_review: 'Pending Drafts',
    approved: 'Approved Drafts',
    changes_requested: 'Changes Requested'
  }[filter] || 'Drafts'

  const handleEdit = useCallback(async (draft) => {
    setEditingDraft(draft)
    
    const { data: assignments } = await supabase
      .from('draft_assignments')
      .select('reviewer_id')
      .eq('draft_id', draft.id)
    
    if (assignments && assignments.length > 0) {
      setSelectedReviewers(assignments.map(a => a.reviewer_id))
    } else {
      setSelectedReviewers([])
    }
    
    if (draft.review_by) {
      const formattedDate = new Date(draft.review_by).toISOString().split('T')[0]
      setReviewDeadline(formattedDate)
    } else {
      setReviewDeadline('')
    }
    
    setShowForm(true)
  }, [])

  useEffect(() => {
    const openDraftFromUrl = async () => {
      if (draftIdFromUrl && drafts.length > 0) {
        const draftToOpen = drafts.find(d => d.id === draftIdFromUrl)
        if (draftToOpen) {
          const allowedStatuses = {
            '/creator/drafts': ['draft'],
            '/creator/pending': ['pending_review'],
            '/creator/approved': ['approved'],
            '/creator/changes-requested': ['changes_requested']
          }
          const currentPath = window.location.pathname
          const allowed = allowedStatuses[currentPath] || []
          
          if (allowed.includes(draftToOpen.status) && filter === 'draft') {
            await handleEdit(draftToOpen)
          }
        }
      }
    }
    
    openDraftFromUrl()
  }, [draftIdFromUrl, drafts, filter, handleEdit])

  const handleDelete = async (draftId) => {
    if (!confirm('Are you sure you want to delete this draft?')) return

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
      setActionError('Draft was not deleted.')
      return
    }

    setDrafts((currentDrafts) => currentDrafts.filter((draft) => draft.id !== draftId))
    setActionMessage('Draft deleted successfully.')
  }

  const handleSubmit = async (draftId) => {
    setActionError('')
    setActionMessage('')

    const { data: assignments, error: assignError } = await supabase
      .from('draft_assignments')
      .select('reviewer_id')
      .eq('draft_id', draftId)

    if (assignError) {
      setActionError('Error checking assignments: ' + assignError.message)
      return
    }

    if (!assignments || assignments.length === 0) {
      setActionError('Cannot submit: No reviewers assigned.')
      return
    }

    const { data: draft, error: draftError } = await supabase
      .from('content_drafts')
      .select('review_by')
      .eq('id', draftId)
      .single()

    if (draftError) {
      setActionError('Error checking deadline: ' + draftError.message)
      return
    }

    if (!draft?.review_by) {
      setActionError('Cannot submit: No review deadline set.')
      return
    }

    const { data, error } = await supabase
      .from('content_drafts')
      .update({ status: 'pending_review' })
      .eq('id', draftId)
      .eq('creator_id', profile.id)
      .in('status', ['draft', 'changes_requested'])
      .select('*')

    if (error) {
      setActionError('Error submitting for review: ' + error.message)
      return
    }

    if (!data?.length) {
      setActionError('Draft was not submitted.')
      return
    }

    setDrafts((currentDrafts) => currentDrafts.map((draft) => draft.id === draftId ? data[0] : draft))
    setActionMessage('Draft submitted for review.')
  }

  const handleSaveDraft = async (draftData) => {
    setActionError('')
    setActionMessage('')
    
    let draftId
    
    if (editingDraft) {
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
      draftId = editingDraft.id
    } else {
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
      draftId = data.id
    }
    
    if (selectedReviewers.length > 0 && reviewDeadline && draftId) {
      const result = await saveDraftAssignments(draftId, selectedReviewers, reviewDeadline)
      if (!result.success) {
        setActionError('Draft saved but assignment error: ' + result.error)
      }
    }
    
    setActionMessage(editingDraft ? 'Draft updated successfully.' : 'Draft created successfully.')
    
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