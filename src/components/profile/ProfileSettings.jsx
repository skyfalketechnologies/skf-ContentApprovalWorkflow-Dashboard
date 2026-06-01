import { useState } from 'react'

export function ProfileSettings({ profile, onUpdateProfile, onClose }) {
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!fullName.trim()) {
      setError('Please enter your display name.')
      return
    }

    setSaving(true)
    const { error: updateError } = await onUpdateProfile({ fullName })
    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setMessage('Profile updated.')
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #cbd5e1',
        borderRadius: '4px',
        width: '420px',
        maxWidth: '90%',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Profile Settings</h2>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}
            type="button"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Display name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="form-input"
              required
            />
          </div>

          {error && (
            <div style={{ marginBottom: '12px', color: '#991b1b', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ marginBottom: '12px', color: '#166534', fontSize: '14px' }}>
              {message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
