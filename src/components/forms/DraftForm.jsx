import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export function DraftForm({ draft, userId, onSave, onCancel }) {
  const [title, setTitle] = useState(draft?.title || '')
  const [body, setBody] = useState(draft?.body || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      alert('Please fill in both title and body')
      return
    }

    setSaving(true)

    if (draft) {
      // Update existing draft
      const { error } = await supabase
        .from('content_drafts')
        .update({ title, body, updated_at: new Date() })
        .eq('id', draft.id)
      
      if (error) {
        alert('Error updating draft: ' + error.message)
      } else {
        onSave()
      }
    } else {
      // Create new draft
      const { error } = await supabase
        .from('content_drafts')
        .insert({
          title,
          body,
          creator_id: userId,
          status: 'draft'
        })
      
      if (error) {
        alert('Error creating draft: ' + error.message)
      } else {
        onSave()
      }
    }
    
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '2px solid #cbd5e1',
            borderRadius: '4px',
            fontSize: '16px'
          }}
          required
        />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Content
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows="8"
          style={{
            width: '100%',
            padding: '8px',
            border: '2px solid #cbd5e1',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'inherit'
          }}
          required
        />
      </div>
      
      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : draft ? 'Update Draft' : 'Create Draft'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}