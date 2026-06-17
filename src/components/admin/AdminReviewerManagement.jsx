import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function AdminReviewerManagement() {
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maxWorkload, setMaxWorkload] = useState(5);
  const [showModal, setShowModal] = useState(false);
  const [newWorkload, setNewWorkload] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
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
    if (error) {
      console.error('Error fetching reviewers:', error);
      setError(error.message);
    } else {
      setReviewers(data || []);
    }
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
    if (error) {
      alert('Failed to update: ' + error.message);
    } else {
      fetchData();
    }
  };

  const openModal = () => {
    setNewWorkload(maxWorkload);
    setShowModal(true);
    setError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setNewWorkload(maxWorkload);
    setError('');
  };

  const saveWorkload = async () => {
    if (newWorkload < 1 || newWorkload > 20) {
      setError('Please enter a value between 1 and 20.');
      return;
    }
    setSaving(true);
    setError('');
    const { error } = await supabase
      .from('system_settings')
      .update({ max_workload: newWorkload, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (error) {
      setError('Error saving: ' + error.message);
      setSaving(false);
      return;
    }
    setMaxWorkload(newWorkload);
    setShowModal(false);
    setSaving(false);
    fetchData(); // Refresh reviewer list to reflect new cap
  };

  if (loading) return <div>Loading reviewer data...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Reviewer Management</h2>
          <p style={{ margin: '4px 0 0 0', color: '#475569' }}>
            Workload cap: <strong>{maxWorkload}</strong> pending assignments max per reviewer.
          </p>
        </div>
        <button
          onClick={openModal}
          style={{
            padding: '8px 16px',
            backgroundColor: '#1e40af',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          ⚙️ Change Max Workload
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '12px' }}>{error}</div>}

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

      {/* Modal */}
      {showModal && (
        <div
          style={{
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
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '420px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Change Max Workload</h3>
            <p style={{ color: '#475569', marginBottom: '16px' }}>
              Set the maximum number of pending assignments a reviewer can have before they are considered "over capacity".
            </p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Maximum pending assignments</label>
              <input
                type="number"
                min="1"
                max="20"
                value={newWorkload}
                onChange={(e) => setNewWorkload(parseInt(e.target.value) || 1)}
                style={{
                  width: '100px',
                  padding: '8px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              {error && <div style={{ color: 'red', marginTop: '8px' }}>{error}</div>}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeModal}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveWorkload}
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1e40af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}