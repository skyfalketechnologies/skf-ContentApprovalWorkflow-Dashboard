import { useState } from 'react'

export function ReviewComment({ draft, onClose, onSubmit }) {
  const [comment, setComment] = useState('')
  const [decision, setDecision] = useState('')

  const handleSubmit = () => {
    if (!decision) {
      alert('Please select Approve or Request Changes')
      return
    }
    if (!comment.trim()) {
      alert('Please provide a comment explaining your decision')
      return
    }
    // Pass either 'approved' or 'changes_requested'
    onSubmit(decision, comment)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2>Review Draft</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          <div className="form-card">
            <h3 style={{ margin: '0 0 8px 0' }}>{draft.title}</h3>
            <p style={{ margin: 0, color: '#475569' }}>{draft.body}</p>
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Decision</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                value="approved"
                checked={decision === 'approved'}
                onChange={(e) => setDecision(e.target.value)}
              />
              Approve
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="changes_requested"
                checked={decision === 'changes_requested'}
                onChange={(e) => setDecision(e.target.value)}
              />
              Request Changes
            </label>
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Comment (required)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="4"
            className="form-textarea"
            placeholder={decision === 'changes_requested' ? 'Describe what changes are needed...' : 'Explain your approval...'}
            required
          />
        </div>

        <div className="modal-actions">
          <button onClick={handleSubmit} className="btn btn-primary" type="button">
            Submit Review
          </button>
          <button onClick={onClose} className="btn btn-secondary" type="button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}