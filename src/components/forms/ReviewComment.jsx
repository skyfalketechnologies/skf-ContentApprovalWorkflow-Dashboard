import { useState } from 'react'

export function ReviewComment({ draft, onClose, onSubmit }) {
  const [comment, setComment] = useState('')
  const [decision, setDecision] = useState('')

  const handleSubmit = () => {
    if (!decision) {
      alert('Please select Approve or Reject')
      return
    }
    if (!comment.trim()) {
      alert('Please provide a comment explaining your decision')
      return
    }
    onSubmit(decision, comment)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #cbd5e1',
        borderRadius: '4px',
        width: '500px',
        maxWidth: '90%',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Review Draft</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>
        
        <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>{draft.title}</h3>
          <p style={{ margin: 0, color: '#475569' }}>{draft.body}</p>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Decision
          </label>
          <div style={{ display: 'flex', gap: '16px' }}>
            <label style={{ cursor: 'pointer' }}>
              <input
                type="radio"
                value="approved"
                checked={decision === 'approved'}
                onChange={(e) => setDecision(e.target.value)}
                style={{ marginRight: '8px' }}
              />
              Approve
            </label>
            <label style={{ cursor: 'pointer' }}>
              <input
                type="radio"
                value="rejected"
                checked={decision === 'rejected'}
                onChange={(e) => setDecision(e.target.value)}
                style={{ marginRight: '8px' }}
              />
              Reject
            </label>
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Comment (required)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="4"
            style={{
              width: '100%',
              padding: '8px',
              border: '2px solid #cbd5e1',
              borderRadius: '4px',
              fontFamily: 'inherit'
            }}
            placeholder="Explain your decision..."
            required
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleSubmit} className="btn-primary">
            Submit Review
          </button>
          <button onClick={onClose} style={{
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}