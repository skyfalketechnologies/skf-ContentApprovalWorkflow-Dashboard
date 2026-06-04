import { StatusBadge } from '../common/StatusBadge'

export function DraftCard({ draft, role, onEdit, onDelete, onSubmit, onReview, onViewAudit }) {
  // Determine if creator can edit or submit this draft (draft or changes_requested)
  const canEdit = role === 'creator' && (draft.status === 'draft' || draft.status === 'changes_requested')
  const canDelete = role === 'creator' && draft.status === 'draft'
  const canSubmit = role === 'creator' && (draft.status === 'draft' || draft.status === 'changes_requested')
  const isReviewable = role === 'reviewer' && draft.status === 'pending_review'

  return (
    <div className="draft-card">
      <div className="draft-card-header">
        <div>
          <h3 className="draft-card-title">{draft.title}</h3>
          <StatusBadge status={draft.status} />
        </div>
        <button 
          onClick={onViewAudit}
          className="btn btn-secondary"
          type="button"
        >
          View Audit
        </button>
      </div>
      
      <p className="draft-card-body">
        {draft.body.length > 200 ? draft.body.substring(0, 200) + '...' : draft.body}
      </p>

      {/* Show a friendly message when changes were requested */}
      {role === 'creator' && draft.status === 'changes_requested' && (
        <div style={{ 
          backgroundColor: '#fff7ed', 
          borderLeft: '4px solid #f97316', 
          padding: '12px', 
          marginBottom: '16px',
          borderRadius: '8px'
        }}>
          <strong> Changes requested:</strong> Please review the feedback below and resubmit when ready.
        </div>
      )}
      
      <div className="card-actions">
        {role === 'creator' && (
          <>
            {canEdit && (
              <button onClick={onEdit} className="btn btn-primary" type="button">Edit</button>
            )}
            {canDelete && (
              <button onClick={onDelete} className="btn btn-danger" type="button">Delete</button>
            )}
            {canSubmit && (
              <button onClick={onSubmit} className="btn btn-secondary btn-submit" type="button">
                {draft.status === 'changes_requested' ? 'Resubmit for Review' : 'Submit for Review'}
              </button>
            )}
            {!canEdit && !canDelete && !canSubmit && draft.status !== 'draft' && draft.status !== 'changes_requested' && (
              <span className="status-message">This draft has been {draft.status}</span>
            )}
          </>
        )}
        
        {role === 'reviewer' && isReviewable && (
          <button onClick={onReview} className="btn btn-primary" type="button">Review Draft</button>
        )}
        
        {role === 'reviewer' && !isReviewable && draft.status !== 'pending_review' && (
          <span className="status-message">This draft is {draft.status}</span>
        )}
      </div>
    </div>
  )
}