import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { DraftDetailView } from './DraftDetailView.jsx';

const REVIEWER_VISIBLE_STATUSES = ['pending_review', 'approved', 'changes_requested'];

export function ReviewerDashboard({ filter = 'pending_review' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const draftIdFromUrl = searchParams.get('draftId');
  const [manuallySelectedDraft, setManuallySelectedDraft] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState('');

  const fetchAssignments = useCallback(async (reviewerId) => {
    if (!reviewerId) return;
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('draft_assignments')
      .select(`
        id,
        status,
        responded_at,
        draft_id,
        content_drafts!inner (
          id,
          title,
          body,
          status,
          created_at,
          updated_at,
          review_by,
          creator_id,
          archived_at,
          profiles!creator_id (full_name, email)
        )
      `)
      .eq('reviewer_id', reviewerId)
      .in('content_drafts.status', REVIEWER_VISIBLE_STATUSES)
      .is('content_drafts.archived_at', null);
    if (error) {
      console.error('Error loading assignments:', error);
      setError(error.message);
      setAssignments([]);
      setLoading(false);
      return;
    }
    const normalized = (data || [])
      .filter(a => a.content_drafts)
      .map(a => ({
        ...a.content_drafts,
        assignmentId: a.id,
        assignmentStatus: a.status,
        respondedAt: a.responded_at,
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setAssignments(normalized);
    setLoading(false);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchAssignments(user.id);
      } else {
        setLoading(false);
      }
    };
    getUser();
  }, [fetchAssignments]);

  // ✅ Clear selected draft when filter changes (sidebar navigation)
  useEffect(() => {
    setManuallySelectedDraft(null);
    if (draftIdFromUrl) {
      const params = new URLSearchParams(searchParams);
      params.delete('draftId');
      setSearchParams(params);
    }
  }, [filter]);

  const visibleDrafts = useMemo(() => {
    return assignments.filter(d => {
      if (!REVIEWER_VISIBLE_STATUSES.includes(d.status)) return false;
      if (filter === 'pending_review') return d.status === 'pending_review' && d.assignmentStatus === 'pending';
      if (filter === 'approved') return d.assignmentStatus === 'approved';
      if (filter === 'changes_requested') return d.assignmentStatus === 'changes_requested';
      return false;
    });
  }, [assignments, filter]);

  const selectedDraft = useMemo(() => {
    if (manuallySelectedDraft) return manuallySelectedDraft;
    if (!draftIdFromUrl) return null;
    return assignments.find(d => d.id === draftIdFromUrl) || null;
  }, [manuallySelectedDraft, draftIdFromUrl, assignments]);

  const closeDetail = () => {
    setManuallySelectedDraft(null);
    if (draftIdFromUrl) {
      const params = new URLSearchParams(searchParams);
      params.delete('draftId');
      setSearchParams(params);
    }
  };

  const refresh = useCallback(async () => {
    if (userId) await fetchAssignments(userId);
  }, [userId, fetchAssignments]);

  const getBadge = (status) => {
    const config = {
      draft: { label: 'Draft', color: '#6b7280' },
      pending_review: { label: 'Pending', color: '#eab308' },
      approved: { label: 'Approved', color: '#22c55e' },
      changes_requested: { label: 'Changes Requested', color: '#f97316' },
    };
    const c = config[status] || config.draft;
    return <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: c.color, color: 'white' }}>{c.label}</span>;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  if (selectedDraft) {
    return <DraftDetailView draft={selectedDraft} onClose={closeDetail} onUpdate={refresh} currentUserId={userId} currentUserRole="reviewer" />;
  }

  const titles = { pending_review: 'Pending Reviews', approved: 'Approved Reviews', changes_requested: 'Changes Requested' };
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>{titles[filter] || 'Reviews'}</h1>
      <p>{visibleDrafts.length} draft(s) assigned to you</p>
      <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'auto', background: 'white' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
              <th style={{ padding: '16px', textAlign: 'left' }}>Title</th><th>Preview</th><th>Status</th><th>Created</th>
            </tr>
          </thead>
          <tbody>
            {visibleDrafts.map((d, i) => (
              <tr key={d.id} onClick={() => setManuallySelectedDraft(d)} style={{ cursor: 'pointer', borderBottom: i === visibleDrafts.length-1 ? 'none' : '1px solid #e2e8f0' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                <td style={{ padding: '16px', fontWeight: 500 }}>{d.title}</td>
                <td style={{ padding: '16px', color: '#475569' }}>{d.body?.length > 60 ? d.body.substring(0,60)+'...' : d.body}</td>
                <td style={{ padding: '16px' }}>{getBadge(d.status)}</td>
                <td style={{ padding: '16px', color: '#475569' }}>{new Date(d.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {visibleDrafts.length === 0 && <tr><td colSpan="4" style={{ padding: '48px', textAlign: 'center' }}>No drafts assigned to you.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}