import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

// Helper to get tomorrow's date in YYYY-MM-DD format
function getTomorrowDate() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

export function AssignReviewers({
  value = [],
  deadlineValue = '',
  onAssignmentsChange,
  onDeadlineChange
}) {
  const [reviewers, setReviewers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const fetchReviewers = async () => {
      setLoading(true)
      setError('')
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'reviewer')
        .order('full_name', { ascending: true })

      if (!mounted) return
      if (fetchError) {
        setError('Error loading reviewers: ' + fetchError.message)
        setReviewers([])
      } else {
        setReviewers(data || [])
      }
      setLoading(false)
    }
    fetchReviewers()
    return () => { mounted = false }
  }, [])

  const selectedReviewerIds = [...new Set((value || []).filter(Boolean))]

  const toggleReviewer = (reviewerId) => {
    const isSelected = selectedReviewerIds.includes(reviewerId)
    if (isSelected) {
      onAssignmentsChange(selectedReviewerIds.filter(id => id !== reviewerId))
      return
    }
    if (selectedReviewerIds.length >= 3) return
    onAssignmentsChange([...new Set([...selectedReviewerIds, reviewerId])])
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <h3 style={{ marginBottom: '12px' }}>Assign Reviewers</h3>
      {error && <div style={{ marginBottom: '12px', color: '#991b1b' }}>{error}</div>}
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="review-deadline" style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
          Review Deadline
        </label>
        <input
          id="review-deadline"
          type="date"
          value={deadlineValue || ''}
          min={getTomorrowDate()}   // ✅ Only allow dates from tomorrow onward
          onChange={(e) => onDeadlineChange(e.target.value)}
          className="form-input"
        />
      </div>
      <div>
        <p style={{ marginBottom: '8px', fontWeight: '500' }}>Select up to 3 reviewers</p>
        {loading ? (
          <div>Loading reviewers...</div>
        ) : reviewers.length === 0 ? (
          <div style={{ color: '#6b7280' }}>No reviewers available.</div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {reviewers.map((reviewer) => {
              const isChecked = selectedReviewerIds.includes(reviewer.id)
              const disableUnchecked = !isChecked && selectedReviewerIds.length >= 3
              return (
                <label
                  key={reviewer.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    backgroundColor: disableUnchecked ? '#f8fafc' : '#ffffff',
                    opacity: disableUnchecked ? 0.7 : 1,
                    cursor: disableUnchecked ? 'not-allowed' : 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={disableUnchecked}
                    onChange={() => toggleReviewer(reviewer.id)}
                  />
                  <div>
                    <div style={{ fontWeight: '500' }}>{reviewer.full_name || reviewer.email}</div>
                    <div style={{ fontSize: '13px', color: '#475569' }}>{reviewer.email}</div>
                  </div>
                </label>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}