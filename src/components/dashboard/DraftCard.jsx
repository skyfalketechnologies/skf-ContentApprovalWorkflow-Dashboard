import { StatusBadge } from '../common/StatusBadge'

export function DraftCard({ draft, role, onEdit, onDelete, onSubmit, onReview, onViewAudit }) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '2px solid #cbd5e1',
      borderRadius: '4px',
      padding: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>{draft.title}</h3>
          <StatusBadge status={draft.status} />
        </div>
        <button 
          onClick={onViewAudit}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #cbd5e1',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          View Audit
        </button>
      </div>
      
      <p style={{ color: '#475569', margin: '16px 0', lineHeight: '1.5' }}>
        {draft.body.length > 200 ? draft.body.substring(0, 200) + '...' : draft.body}
      </p>
      
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        {role === 'creator' && draft.status === 'draft' && (
          <>
            <button onClick={onEdit} style={{
              backgroundColor: '#1e40af',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>Edit</button>
            <button onClick={onDelete} style={{
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>Delete</button>
            <button onClick={onSubmit} style={{
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>Submit for Review</button>
          </>
        )}
        
        {role === 'reviewer' && draft.status === 'pending_review' && (
          <button onClick={onReview} style={{
            backgroundColor: '#1e40af',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>Review Draft</button>
        )}
        
        {role === 'creator' && draft.status !== 'draft' && draft.status !== 'pending_review' && (
          <span style={{ color: '#475569', fontStyle: 'italic' }}>
            This draft has been {draft.status}
          </span>
        )}
      </div>
    </div>
  )
}