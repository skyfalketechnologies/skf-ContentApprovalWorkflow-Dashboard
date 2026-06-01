import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { useSupabaseRealtime } from '../../hooks/useSupabaseRealtime'
import { DraftCard } from './DraftCard'
import { DraftForm } from '../forms/DraftForm'
import { AuditTrail } from '../common/AuditTrail'

export function CreatorDashboard() {
  const { profile } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editingDraft, setEditingDraft] = useState(null)
  const [selectedDraftForAudit, setSelectedDraftForAudit] = useState(null)
  
  const { data: drafts, loading } = useSupabaseRealtime(
    'content_drafts',
    'creator_id',
    profile?.id
  )

  const handleDelete = async (draftId) => {
    if (!confirm('Are you sure you want to delete this draft?')) return
    
    const { error } = await supabase
      .from('content_drafts')
      .delete()
      .eq('id', draftId)
      .eq('status', 'draft')
    
    if (error) {
      alert('Error deleting draft: ' + error.message)
    }
  }

  const handleSubmit = async (draftId) => {
    const { error } = await supabase
      .from('content_drafts')
      .update({ 
        status: 'pending_review',
        updated_at: new Date()
      })
      .eq('id', draftId)
    
    if (error) {
      alert('Error submitting for review: ' + error.message)
    }
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
        <h1 style={{ fontSize: '28px', fontWeight: '600', margin: 0 }}>
          My Content Drafts
        </h1>
        <button
          onClick={() => {
            setEditingDraft(null)
            setShowForm(true)
          }}
          style={{
            backgroundColor: '#1e40af',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          + New Draft
        </button>
      </div>

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
        {drafts.map(draft => (
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
        {drafts.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px', 
            backgroundColor: '#f9fafb',
            border: '2px solid #e5e7eb'
          }}>
            <p>No drafts yet. Create your first draft!</p>
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