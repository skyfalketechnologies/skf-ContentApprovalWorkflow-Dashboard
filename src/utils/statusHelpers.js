// Status configuration
export const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    color: '#6b7280',
    canEdit: true,
    canDelete: true,
    canSubmit: true,
    nextStatus: 'pending_review'
  },
  pending_review: {
    label: 'Pending Review',
    color: '#eab308',
    canEdit: false,
    canDelete: false,
    canSubmit: false,
    nextStatus: null
  },
  approved: {
    label: 'Approved',
    color: '#22c55e',
    canEdit: false,
    canDelete: false,
    canSubmit: false,
    nextStatus: null
  },
  changes_requested: {
    label: 'Changes Requested',
    color: '#f97316',  // orange
    canEdit: true,
    canDelete: false,
    canSubmit: true,
    nextStatus: 'pending_review'
  }

}

// Helper function to check if draft can be edited
export function canEditDraft(status) {
  return STATUS_CONFIG[status]?.canEdit || false
}

// Helper function to check if draft can be deleted
export function canDeleteDraft(status) {
  return STATUS_CONFIG[status]?.canDelete || false
}

// Helper function to check if draft can be submitted
export function canSubmitDraft(status) {
  return STATUS_CONFIG[status]?.canSubmit || false
}

// Helper function to check if a reviewer can request changes
export function canRequestChanges(status) {
  return status === 'pending_review'
}

// Helper function to get status label
export function getStatusLabel(status) {
  return STATUS_CONFIG[status]?.label || status
}

// Helper function to get status color
export function getStatusColor(status) {
  return STATUS_CONFIG[status]?.color || '#6b7280'
}

// Helper function to format date
export function formatDate(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

// Helper function to truncate text
export function truncateText(text, maxLength = 200) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}