import { useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useSupabaseRealtime } from '../../hooks/useSupabaseRealtime'
import { DraftDetailView } from './DraftDetailView'
import { AssignReviewers } from '../forms/AssignReviewers'
import { saveDraftAssignments } from '../../utils/draftAssignments'

export function CreatorDashboard({ profile, filter = 'all' }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const draftIdFromUrl = searchParams.get('draftId')

  const [showForm, setShowForm] = useState(false)
  const [editingDraft, setEditingDraft] = useState(null)
  const [manuallySelectedDraft, setManuallySelectedDraft] = useState(null)
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
    return drafts.filter((draft) => (filter === 'all' ? true : draft.status === filter))
  }, [drafts, filter])

  const pageTitle = {
    all: 'All Drafts',
    draft: 'Drafts',
    pending_review: 'Pending Reviews',
    approved: 'Approved Content',
    changes_requested: 'Changes Requested'
  }[filter] || 'Drafts'

  const selectedDraftForDetail = useMemo(() => {
    if (manuallySelectedDraft) {
      const freshDraft = drafts.find((draft) => draft.id === manuallySelectedDraft.id)
      return freshDraft || manuallySelectedDraft
    }
    if (!draftIdFromUrl || drafts.length === 0) return null
    return drafts.find((draft) => draft.id === draftIdFromUrl) || null
  }, [manuallySelectedDraft, draftIdFromUrl, drafts])

  const resetFormState = useCallback(() => {
    setShowForm(false)
    setEditingDraft(null)
    setSelectedReviewers([])
    setReviewDeadline('')
  }, [])

  const closeDetailView = useCallback(() => {
    setManuallySelectedDraft(null)
    if (draftIdFromUrl) {
      const next = new URLSearchParams(searchParams)
      next.delete('draftId')
      setSearchParams(next)
    }
  }, [draftIdFromUrl, searchParams, setSearchParams])

  const loadDrafts = useCallback(async () => {
    const { data, error } = await supabase
      .from('content_drafts')
      .select('*')
      .eq('creator_id', profile.id)
      .order('created_at', { ascending: false })
    if (error) {
      setActionError('Error refreshing drafts: ' + error.message)
      return
    }
    if (data) setDrafts(data)
  }, [profile.id, setDrafts])

  const handleEdit = useCallback(async (draft) => {
    setActionError('')
    setActionMessage('')
    setEditingDraft(draft)

    const { data: assignments, error } = await supabase
      .from('draft_assignments')
      .select('reviewer_id')
      .eq('draft_id', draft.id)
    if (error) {
      setActionError('Error loading reviewer assignments: ' + error.message)
      setSelectedReviewers([])
    } else {
      const ids = assignments?.map(a => a.reviewer_id) || []
      setSelectedReviewers([...new Set(ids)])
    }

    if (draft.review_by) {
      setReviewDeadline(new Date(draft.review_by).toISOString().split('T')[0])
    } else {
      setReviewDeadline('')
    }
    setShowForm(true)
  }, [])

  const handleDelete = async (draftId) => {
    if (!draftId) {
      setActionError('Invalid draft ID')
      return false
    }
    if (!window.confirm('Are you sure you want to delete this draft?')) return false

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
      return false
    }
    if (!data?.length) {
      setActionError('Draft was not deleted.')
      return false
    }

    setDrafts(current => current.filter(d => d.id !== draftId))
    setActionMessage('Draft deleted successfully.')
    setTimeout(() => setActionMessage(''), 3000)
    closeDetailView()
    return true
  }

  const handleSubmit = async (draftId) => {
    if (!draftId) {
      setActionError('Invalid draft ID')
      return false
    }
    setActionError('')
    setActionMessage('')

    const { data: assignments, error: assignError } = await supabase
      .from('draft_assignments')
      .select('reviewer_id')
      .eq('draft_id', draftId)

    if (assignError) {
      setActionError('Error checking assignments: ' + assignError.message)
      return false
    }
    if (!assignments?.length) {
      setActionError('Cannot submit: No reviewers assigned.')
      return false
    }

    const { data: draft, error: draftError } = await supabase
      .from('content_drafts')
      .select('review_by')
      .eq('id', draftId)
      .single()

    if (draftError) {
      setActionError('Error checking deadline: ' + draftError.message)
      return false
    }
    if (!draft?.review_by) {
      setActionError('Cannot submit: No review deadline set.')
      return false
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
      return false
    }
    if (!data?.length) {
      setActionError('Draft was not submitted.')
      return false
    }

    setDrafts(current => current.map(d => (d.id === draftId ? data[0] : d)))
    setActionMessage('Draft submitted for review.')
    setTimeout(() => setActionMessage(''), 3000)
    await loadDrafts()
    return true
  }

  const handleSaveDraft = async (draftData) => {
    setActionError('')
    setActionMessage('')

    const isUpdating = Boolean(editingDraft?.id)
    let draftId

    if (isUpdating) {
      const { error } = await supabase
        .from('content_drafts')
        .update({
          title: draftData.title,
          body: draftData.body,
          updated_at: new Date().toISOString()
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
      if (!data?.id) {
        setActionError('Draft created but no ID returned')
        return false
      }
      draftId = data.id
    }

    const result = await saveDraftAssignments(draftId, selectedReviewers, reviewDeadline)
    if (!result.success) {
      setActionError(result.error)
      return false
    }

    setActionMessage(isUpdating ? 'Draft updated successfully.' : 'Draft created successfully.')
    setTimeout(() => setActionMessage(''), 3000)

    await loadDrafts()
    resetFormState()
    return true
  }

  const handleCancelForm = () => {
    resetFormState()
    setActionError('')
    setActionMessage('')
  }

  const rowStyle = { cursor: 'pointer' }

  if (loading) return <div>Loading...</div>

  if (selectedDraftForDetail) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <DraftDetailView
          draft={selectedDraftForDetail}
          onClose={closeDetailView}
          onUpdate={loadDrafts}
          currentUserId={profile.id}
          currentUserRole="creator"
          onEditDraft={handleEdit}
          onDeleteDraft={handleDelete}
          onSubmitDraft={handleSubmit}
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
          <p style={{ margin: '8px 0 0 0', color: '#475569' }}>{visibleDrafts.length} draft(s)</p>
        </div>

        {/* ✅ ONLY show "New Draft" button when filter === 'draft' */}
        {filter === 'draft' && !showForm && (
          <button
            onClick={() => {
              setActionError('')
              setActionMessage('')
              setEditingDraft({ title: '', body: '' })
              setSelectedReviewers([])
              setReviewDeadline('')
              setShowForm(true)
            }}
            className="btn btn-primary"
          >
            + New Draft
          </button>
        )}
      </div>

      {draftsError && <div style={{ marginBottom: '16px', color: '#991b1b' }}>Error: {draftsError}</div>}
      {actionError && <div style={{ marginBottom: '16px', color: '#991b1b' }}>{actionError}</div>}
      {actionMessage && <div style={{ marginBottom: '16px', color: '#166534' }}>{actionMessage}</div>}

      {showForm && (
        <div style={{
          marginBottom: '32px',
          padding: '20px',
          border: '2px solid #cbd5e1',
          backgroundColor: '#ffffff',
          borderRadius: '12px'
        }}>
          <h2 style={{ marginBottom: '16px' }}>{editingDraft?.id ? 'Edit Draft' : 'Create New Draft'}</h2>
          <input
            type="text"
            placeholder="Title"
            value={editingDraft?.title || ''}
            onChange={e => setEditingDraft(prev => ({ ...prev, title: e.target.value }))}
            className="form-input"
            style={{ marginBottom: '12px' }}
          />
          <textarea
            placeholder="Content"
            value={editingDraft?.body || ''}
            onChange={e => setEditingDraft(prev => ({ ...prev, body: e.target.value }))}
            rows="8"
            className="form-textarea"
            style={{ marginBottom: '12px' }}
          />
          <AssignReviewers
            value={selectedReviewers}
            deadlineValue={reviewDeadline}
            onAssignmentsChange={setSelectedReviewers}
            onDeadlineChange={setReviewDeadline}
          />
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              onClick={async () => {
                const title = editingDraft?.title || ''
                const body = editingDraft?.body || ''
                if (!title || !body) {
                  setActionError('Please fill in title and content')
                  return
                }
                await handleSaveDraft({ title, body })
              }}
              className="btn btn-primary"
            >
              {editingDraft?.id ? 'Update Draft' : 'Create Draft'}
            </button>
            <button onClick={handleCancelForm} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {!showForm && (
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
                </tr>
              </thead>
              <tbody>
                {visibleDrafts.map((draft, index) => (
                  <tr
                    key={draft.id}
                    onClick={() => setManuallySelectedDraft(draft)}
                    style={{
                      ...rowStyle,
                      borderBottom: index === visibleDrafts.length - 1 ? 'none' : '1px solid #e2e8f0'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                  >
                    <td style={{ padding: '16px', fontWeight: '500' }}>{draft.title}</td>
                    <td style={{ padding: '16px', color: '#475569', fontSize: '14px' }}>
                      {draft.body.length > 60 ? draft.body.substring(0, 60) + '...' : draft.body}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: draft.status === 'draft' ? '#6b7280' : draft.status === 'pending_review' ? '#eab308' : draft.status === 'approved' ? '#22c55e' : '#f97316',
                        color: 'white'
                      }}>
                        {draft.status === 'draft' ? 'Draft' : draft.status === 'pending_review' ? 'Pending' : draft.status === 'approved' ? 'Approved' : 'Changes Requested'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#475569', fontSize: '14px' }}>
                      {new Date(draft.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {visibleDrafts.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                      No drafts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}