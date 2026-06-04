import { useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useSupabaseRealtime } from '../../hooks/useSupabaseRealtime'
import { DraftCard } from './DraftCard'
import { DraftForm } from '../forms/DraftForm'
import { AuditTrail } from '../common/AuditTrail'

export function CreatorDashboard({ profile, filter = 'all' }) {
  const [showForm, setShowForm] = useState(false)
  const [editingDraft, setEditingDraft] = useState(null)
  const [selectedDraftForAudit, setSelectedDraftForAudit] = useState(null)
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  const { data: drafts, setData: setDrafts, loading, error: draftsError } = useSupabaseRealtime(
    'content_drafts',
    'creator_id',
    profile.id
  )

  const visibleDrafts = useMemo(() => {
    return drafts.filter((draft) => filter === 'all' ? true : draft.status === filter)
  }, [drafts, filter])

  const pageTitle = {
    all: 'My Content Drafts',
    pending_review: 'Pending Drafts',
    approved: 'Approved Drafts',
    changes_requested: 'Changes Requested'
  }[filter] || 'Drafts'

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
      setActionError('Draft was not deleted. It may no longer be in draft status, or your account does not have permission.')
      return
    }

    setDrafts((currentDrafts) => currentDrafts.filter((draft) => draft.id !== draftId))
    setActionMessage('Draft deleted.')
  }

  const handleSubmit = async (draftId) => {
    setActionError('')
    setActionMessage('')

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
      setActionError('Draft was not submitted. It may no longer be editable, or your account does not have permission.')
      return
    }

    setDrafts((currentDrafts) => currentDrafts.map((draft) => draft.id === draftId ? data[0] : draft))
    setActionMessage('Draft submitted for review.')
  }

  const handleEdit = (draft) => {
    setEditingDraft(draft)
    setShowForm(true)
  }

  const handleSaveComplete = () => {
    setShowForm(false)
    setEditingDraft(null)
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
        <button
          onClick={() => {
            setEditingDraft(null)
            setShowForm(true)
          }}
          className="btn btn-primary"
          style={{ fontSize: '14px' }}
        >
          + New Draft
        </button>
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
          backgroundColor: '#ffffff'
        }}>
          <DraftForm
            draft={editingDraft}
            userId={profile.id}
            onSave={handleSaveComplete}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div style={{ display: 'grid', gap: '16px' }}>
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