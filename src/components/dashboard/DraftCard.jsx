import { StatusBadge } from '../common/StatusBadge'

export function DraftCard({ draft, role, onEdit, onDelete, onSubmit, onReview, onViewAudit }) {
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
      
      <div className="card-actions">
        {role === 'creator' && draft.status === 'draft' && (
          <>
            <button onClick={onEdit} className="btn btn-primary" type="button">Edit</button>
            <button onClick={onDelete} className="btn btn-danger" type="button">Delete</button>
            <button onClick={onSubmit} className="btn btn-secondary btn-submit" type="button">Submit for Review</button>
          </>
        )}
        
        {role === 'reviewer' && draft.status === 'pending_review' && (
          <button onClick={onReview} className="btn btn-primary" type="button">Review Draft</button>
        )}
        
        {role === 'creator' && draft.status !== 'draft' && draft.status !== 'pending_review' && (
          <span className="status-message">
            This draft has been {draft.status}
          </span>
        )}
      </div>
    </div>
  )
}