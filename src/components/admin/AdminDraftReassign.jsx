import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';

export function AdminDraftReassign() {
  const [pendingDrafts, setPendingDrafts] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [newReviewerId, setNewReviewerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: drafts } = await supabase
      .from('content_drafts')
      .select('id, title, status, review_by')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false });
    const { data: revs } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'reviewer')
      .eq('is_active', true);
    setPendingDrafts(drafts || []);
    setReviewers(revs || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (draft) => {
    setSelectedDraft(draft);
    setNewReviewerId('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDraft(null);
    setNewReviewerId('');
  };

  const handleReassign = async () => {
    if (!selectedDraft || !newReviewerId) return;
    setSubmitting(true);
    try {
      // Delete existing assignments
      const { error: delError } = await supabase
        .from('draft_assignments')
        .delete()
        .eq('draft_id', selectedDraft.id);
      if (delError) throw new Error(delError.message);

      // Create new assignment
      const { error: insError } = await supabase
        .from('draft_assignments')
        .insert({
          draft_id: selectedDraft.id,
          reviewer_id: newReviewerId,
          status: 'pending',
          assigned_at: new Date().toISOString()
        });
      if (insError) throw new Error(insError.message);

      alert(`Reassigned "${selectedDraft.title}" successfully`);
      await fetchData();
      closeModal();
    } catch (err) {
      alert('Error reassigning: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading drafts...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '8px' }}>Reassign Pending Drafts</h2>
      <p style={{ color: '#475569', marginBottom: '24px' }}>
        Select a draft to move it to a different reviewer.
      </p>

      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Title</th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Deadline</th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingDrafts.map((draft) => (
              <tr key={draft.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{draft.title}</td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>
                  {draft.review_by ? new Date(draft.review_by).toLocaleDateString() : 'No deadline'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button
                    type="button"
                    onClick={() => openModal(draft)}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    Reassign
                  </button>
                </td>
              </tr>
            ))}
            {pendingDrafts.length === 0 && (
              <tr>
                <td colSpan="3" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                  No pending drafts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && selectedDraft && (
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
              maxWidth: '480px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Reassign Draft</h3>
            <p style={{ color: '#475569', marginBottom: '20px' }}>
              <strong>{selectedDraft.title}</strong>
            </p>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Select new reviewer
              </label>
              <select
                value={newReviewerId}
                onChange={(e) => setNewReviewerId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="">-- Choose reviewer --</option>
                {reviewers.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.full_name || r.email}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
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
                type="button"
                onClick={handleReassign}
                disabled={!newReviewerId || submitting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: newReviewerId && !submitting ? 'pointer' : 'not-allowed',
                  opacity: newReviewerId && !submitting ? 1 : 0.6
                }}
              >
                {submitting ? 'Reassigning...' : 'Confirm Reassignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}