import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function AdminDraftReassign() {
  const [pendingDrafts, setPendingDrafts] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [newReviewerId, setNewReviewerId] = useState('');
  const [loading, setLoading] = useState(true);

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

  const handleReassign = async () => {
    if (!selectedDraft || !newReviewerId) return;
    const { error: delError } = await supabase
      .from('draft_assignments')
      .delete()
      .eq('draft_id', selectedDraft.id);
    if (delError) return alert(delError.message);
    const { error: insError } = await supabase
      .from('draft_assignments')
      .insert({
        draft_id: selectedDraft.id,
        reviewer_id: newReviewerId,
        status: 'pending',
        assigned_at: new Date().toISOString()
      });
    if (insError) return alert(insError.message);
    alert('Reassigned successfully');
    setSelectedDraft(null);
    setNewReviewerId('');
    fetchData();
  };

  if (loading) return <div>Loading drafts...</div>;

  return (
    <div>
      <h2>Reassign Pending Drafts</h2>
      <p>Select a draft below to reassign it to a different reviewer.</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr><th style={{ textAlign: 'left', padding: '8px' }}>Title</th><th>Deadline</th><th>Action</th></tr>
        </thead>
        <tbody>
          {pendingDrafts.map(draft => (
            <tr key={draft.id}>
              <td style={{ padding: '8px' }}>{draft.title}</td>
              <td>{draft.review_by ? new Date(draft.review_by).toLocaleDateString() : 'No deadline'}</td>
              <td><button onClick={() => setSelectedDraft(draft)}>Reassign</button></td>
            </tr>
          ))}
          {pendingDrafts.length === 0 && <tr><td colSpan="3" style={{ padding: '32px', textAlign: 'center' }}>No pending drafts found.</td></tr>}
        </tbody>
      </table>

      {selectedDraft && (
        <div style={{ marginTop: '24px', padding: '20px', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
          <h3>Reassign: {selectedDraft.title}</h3>
          <select value={newReviewerId} onChange={e => setNewReviewerId(e.target.value)} style={{ marginRight: '12px', padding: '6px' }}>
            <option value="">Select a reviewer</option>
            {reviewers.map(r => <option key={r.id} value={r.id}>{r.full_name || r.email}</option>)}
          </select>
          <button onClick={handleReassign} disabled={!newReviewerId} style={{ marginRight: '8px' }}>Confirm Reassignment</button>
          <button onClick={() => { setSelectedDraft(null); setNewReviewerId(''); }}>Cancel</button>
        </div>
      )}
    </div>
  );
}