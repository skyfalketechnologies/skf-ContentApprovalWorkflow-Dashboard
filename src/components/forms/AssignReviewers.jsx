import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function AssignReviewers({ value, deadlineValue, onAssignmentsChange, onDeadlineChange }) {
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [maxWorkload, setMaxWorkload] = useState(5);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      // Get max_workload
      const { data: settings } = await supabase
        .from('system_settings')
        .select('max_workload')
        .single();
      if (settings) setMaxWorkload(settings.max_workload);

      // Get reviewer performance (only active reviewers)
      const { data: perf, error: perfError } = await supabase
        .from('reviewer_performance')
        .select('id, full_name, email, pending_count, is_active')
        .eq('is_active', true);
      if (perfError) {
        setError(perfError.message);
      } else {
        setReviewers(perf || []);
      }
      setLoading(false);
    };
    fetchData();
    return () => { mounted = false };
  }, []);

  const selectedIds = value || [];

  const toggleReviewer = (id) => {
    const isSelected = selectedIds.includes(id);
    if (isSelected) {
      onAssignmentsChange(selectedIds.filter(i => i !== id));
    } else {
      if (selectedIds.length >= 3) return;
      onAssignmentsChange([...selectedIds, id]);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div style={{ marginTop: '16px' }}>
      <h3>Assign Reviewers</h3>
      <div style={{ marginBottom: '16px' }}>
        <label>Review Deadline (must be tomorrow or later)</label>
        <input
          type="date"
          value={deadlineValue || ''}
          min={getTomorrowDate()}
          onChange={(e) => onDeadlineChange(e.target.value)}
          className="form-input"
        />
      </div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {loading ? (
        <div>Loading reviewers...</div>
      ) : reviewers.length === 0 ? (
        <div>No active reviewers available</div>
      ) : (
        reviewers.map(reviewer => {
          const isOverWorkload = reviewer.pending_count >= maxWorkload;
          const isSelected = selectedIds.includes(reviewer.id);
          const disabled = isOverWorkload || (!isSelected && selectedIds.length >= 3);
          return (
            <label
              key={reviewer.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px',
                border: '1px solid #cbd5e1',
                marginBottom: '8px',
                borderRadius: '8px',
                opacity: disabled ? 0.6 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
                backgroundColor: isSelected ? '#e6f7ff' : 'white'
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                disabled={disabled}
                onChange={() => toggleReviewer(reviewer.id)}
              />
              <div>
                <div>{reviewer.full_name || reviewer.email}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {reviewer.email} • {reviewer.pending_count} pending / cap {maxWorkload}
                  {isOverWorkload && <span style={{ color: 'red' }}> (at capacity)</span>}
                </div>
              </div>
            </label>
          );
        })
      )}
      <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
        Max 3 reviewers per draft. Reviewers with {maxWorkload}+ pending are unavailable.
      </div>
    </div>
  );
}