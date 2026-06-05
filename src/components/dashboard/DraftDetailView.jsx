import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { StatusBadge } from '../common/StatusBadge'
import { ExportButton } from '../common/ExportButton'

export function DraftDetailView({ draft, onClose, onUpdate, isEditable, currentUserId }) {
  const [title, setTitle] = useState(draft.title)
  const [body, setBody] = useState(draft.body)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('content_drafts')
      .update({ title, body, updated_at: new Date() })
      .eq('id', draft.id)
      .eq('creator_id', currentUserId)

    if (updateError) {
      setError('Error saving: ' + updateError.message)
      setSaving(false)
      return
    }

    setIsEditing(false)
    setSaving(false)
    if (onUpdate) onUpdate()
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '2px solid #cbd5e1',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px'
    }}>
      {/* Header with back button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <StatusBadge status={draft.status} />
          {draft.status === 'approved' && (
            <ExportButton title={draft.title} body={draft.body} />
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing && isEditable ? (
        <>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows="12"
            className="form-textarea"
            style={{ marginBottom: '16px' }}
          />
          {error && <div style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: '28px', marginBottom: '16px' }}>{draft.title}</h1>
          <div style={{ color: '#475569', lineHeight: '1.6', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
            {draft.body}
          </div>
          {isEditable && (
            <button onClick={() => setIsEditing(true)} className="btn btn-primary">
              Edit Draft
            </button>
          )}
        </>
      )}

      {/* Metadata */}
      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '13px', color: '#6b7280' }}>
        <div>Created: {new Date(draft.created_at).toLocaleString()}</div>
        <div>Last updated: {new Date(draft.updated_at).toLocaleString()}</div>
        {draft.review_by && (
          <div>Review deadline: {new Date(draft.review_by).toLocaleDateString()}</div>
        )}
      </div>
    </div>
  )
}