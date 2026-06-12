import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { DraftDetailView } from './DraftDetailView';

// Only these draft statuses are visible to reviewers
const REVIEWER_VISIBLE_DRAFT_STATUSES = ['pending_review', 'approved', 'changes_requested'];

export function ReviewerDashboard({ filter = 'pending_review' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const draftIdFromUrl = searchParams.get('draftId');

  const [manuallySelectedDraft, setManuallySelectedDraft] = useState(null);
  const [myAssignments, setMyAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);

  const fetchMyAssignments = useCallback(async (reviewerId) => {
    if (!reviewerId) return;
    setLoading(true);
    setError('');

    const { data: assignments, error } = await supabase
      .from('draft_assignments')
      .select(`
        id,
        status,
        reviewed_at,
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
          profiles!creator_id (
            full_name,
            email
          )
        )
      `)
      .eq('reviewer_id', reviewerId)
      .in('content_drafts.status', REVIEWER_VISIBLE_DRAFT_STATUSES)
      .is('content_drafts.archived_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading assignments:', error);
      setError(error.message || 'Failed to load reviewer drafts');
      setMyAssignments([]);
      setLoading(false);
      return;
    }

    // Normalize data and add client‑side guard
    const draftsWithDetails = (assignments || [])
      .filter((assignment) => assignment.content_drafts)
      .map((assignment) => ({
        ...assignment.content_drafts,
        assignmentId: assignment.id,
        assignmentStatus: assignment.status,
        reviewedAt: assignment.reviewed_at,
      }))
      .filter((draft) => REVIEWER_VISIBLE_DRAFT_STATUSES.includes(draft.status));

    setMyAssignments(draftsWithDetails);
    setLoading(false);
  }, []);

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting current user:', userError);
        setError(userError.message || 'Failed to load current user');
        setLoading(false);
        return;
      }
      if (user) {
        setUserId(user.id);
        await fetchMyAssignments(user.id);
      } else {
        setUserId(null);
        setMyAssignments([]);
        setLoading(false);
      }
    };
    getCurrentUser();
  }, [fetchMyAssignments]);

  // ✅ Correct filtering logic: uses both draft.status and assignmentStatus
  const visibleDrafts = useMemo(() => {
    return myAssignments.filter((draft) => {
      // Hard guard: never show drafts with invalid global status
      if (!REVIEWER_VISIBLE_DRAFT_STATUSES.includes(draft.status)) {
        return false;
      }
      if (filter === 'pending_review') {
        // Pending tab: draft must be pending_review AND assignment still pending
        return draft.status === 'pending_review' && draft.assignmentStatus === 'pending';
      }
      if (filter === 'approved') {
        // Approved tab: reviewer’s decision was approved
        return draft.assignmentStatus === 'approved';
      }
      if (filter === 'changes_requested') {
        // Changes Requested tab: reviewer’s decision was changes_requested
        return draft.assignmentStatus === 'changes_requested';
      }
      return true; // fallback (should never happen)
    });
  }, [myAssignments, filter]);

  const selectedDraftForDetail = useMemo(() => {
    if (manuallySelectedDraft) return manuallySelectedDraft;
    if (!draftIdFromUrl) return null;
    return myAssignments.find((draft) => draft.id === draftIdFromUrl) || null;
  }, [manuallySelectedDraft, draftIdFromUrl, myAssignments]);

  const closeDetailView = useCallback(() => {
    setManuallySelectedDraft(null);
    if (draftIdFromUrl) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('draftId');
      setSearchParams(nextParams);
    }
  }, [draftIdFromUrl, searchParams, setSearchParams]);

  const refreshData = useCallback(async () => {
    if (userId) await fetchMyAssignments(userId);
  }, [userId, fetchMyAssignments]);

  // Helper for status badge styling (optional, can reuse your existing function)
  const getStatusBadge = (status) => {
    const config = {
      draft: { label: 'Draft', color: '#6b7280' },
      pending_review: { label: 'Pending', color: '#eab308' },
      approved: { label: 'Approved', color: '#22c55e' },
      changes_requested: { label: 'Changes Requested', color: '#f97316' },
    };
    const current = config[status] || config.draft;
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          backgroundColor: current.color,
          color: 'white',
        }}
      >
        {current.label}
      </span>
    );
  };

  if (loading) return <div>Loading reviewer dashboard...</div>;
  if (error) return <div style={{ color: '#991b1b' }}>{error}</div>;

  if (selectedDraftForDetail) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <DraftDetailView
          draft={selectedDraftForDetail}
          onClose={closeDetailView}
          onUpdate={refreshData}
          currentUserId={userId}
          currentUserRole="reviewer"
        />
      </div>
    );
  }

  const pageTitle = {
    pending_review: 'Pending Reviews',
    approved: 'Approved Reviews',
    changes_requested: 'Changes Requested',
  }[filter] || 'Reviews';

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '28px', margin: 0 }}>{pageTitle}</h1>
          <p style={{ margin: '8px 0 0 0', color: '#475569' }}>
            {visibleDrafts.length} draft(s) assigned to you
          </p>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          border: '2px solid #cbd5e1',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '16px', textAlign: 'left' }}>Title</th>
                <th style={{ padding: '16px', textAlign: 'left' }}>Preview</th>
                <th style={{ padding: '16px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'left' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {visibleDrafts.map((draft, index) => (
                <tr
                  key={draft.id}
                  onClick={() => setManuallySelectedDraft(draft)}
                  style={{
                    cursor: 'pointer',
                    borderBottom:
                      index === visibleDrafts.length - 1 ? 'none' : '1px solid #e2e8f0',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  <td style={{ padding: '16px', fontWeight: '500' }}>{draft.title}</td>
                  <td style={{ padding: '16px', color: '#475569', fontSize: '14px' }}>
                    {draft.body?.length > 60 ? draft.body.substring(0, 60) + '...' : draft.body}
                  </td>
                  <td style={{ padding: '16px' }}>{getStatusBadge(draft.status)}</td>
                  <td style={{ padding: '16px', color: '#475569', fontSize: '14px' }}>
                    {new Date(draft.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {visibleDrafts.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                    No drafts assigned to you.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}