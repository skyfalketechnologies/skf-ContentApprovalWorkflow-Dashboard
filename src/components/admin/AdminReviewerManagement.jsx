import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';

export function AdminReviewerManagement() {
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maxWorkload, setMaxWorkload] = useState(5);

  const fetchData = async () => {
    setLoading(true);
    // Get max_workload setting
    const { data: settings } = await supabase
      .from('system_settings')
      .select('max_workload')
      .single();
    if (settings) setMaxWorkload(settings.max_workload);

    // Get reviewer performance data
    const { data, error } = await supabase
      .from('reviewer_performance')
      .select('*')
      .order('full_name');
    if (!error) setReviewers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleActive = async (id, currentActive) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !currentActive })
      .eq('id', id);
    if (error) alert('Failed to update: ' + error.message);
    else fetchData();
  };

  if (loading) return <div>Loading reviewer data...</div>;

  return (
    <div>
      <h2>Reviewer Management</h2>
      <p>Workload cap: {maxWorkload} pending assignments max per reviewer.</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
            <th>Email</th>
            <th>Pending</th>
            <th>Avg Response (hrs)</th>
            <th>Approval Rate</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviewers.map(r => (
            <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px' }}>{r.full_name || '—'}</td>
              <td>{r.email}</td>
              <td style={{ color: r.pending_count >= maxWorkload ? '#dc2626' : '#166534' }}>
                {r.pending_count} / {maxWorkload}
                {r.pending_count >= maxWorkload && ' (over cap)'}
              </td>
              <td>{r.avg_response_hours ?? '—'}</td>
              <td>{r.approval_rate_percent ?? '—'}%</td>
              <td>{r.is_active ? 'Active' : 'Suspended'}</td>
              <td>
                <button
                  onClick={() => toggleActive(r.id, r.is_active)}
                  style={{
                    backgroundColor: r.is_active ? '#f97316' : '#22c55e',
                    color: 'white',
                    border: 'none',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {r.is_active ? 'Suspend' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
          {reviewers.length === 0 && (
            <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center' }}>No reviewers found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}