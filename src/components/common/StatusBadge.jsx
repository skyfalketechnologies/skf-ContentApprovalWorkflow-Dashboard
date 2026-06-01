export function StatusBadge({ status }) {
  const statusConfig = {
    draft: { color: '#6b7280', label: 'Draft' },
    pending_review: { color: '#eab308', label: 'Pending Review' },
    approved: { color: '#22c55e', label: 'Approved' },
    rejected: { color: '#ef4444', label: 'Rejected' }
  }

  const config = statusConfig[status] || statusConfig.draft

  return (
    <span style={{
      backgroundColor: config.color,
      color: 'white',
      padding: '4px 12px',
      fontSize: '12px',
      fontWeight: '500',
      display: 'inline-block'
    }}>
      {config.label}
    </span>
  )
}