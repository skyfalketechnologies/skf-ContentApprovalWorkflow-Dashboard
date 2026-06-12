import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export function ReviewerHome() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Simple fetch that works (same as debug version)
      const { data, error } = await supabase
        .from('draft_assignments')
        .select('*, content_drafts(*)')
        .eq('reviewer_id', user.id);

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      // Filter out drafts with status 'draft' or archived
      const filtered = (data || [])
        .filter(item => item.content_drafts && !item.content_drafts.archived_at)
        .filter(item => item.content_drafts.status !== 'draft')
        .map(item => ({
          id: item.content_drafts.id,
          title: item.content_drafts.title,
          body: item.content_drafts.body,
          status: item.content_drafts.status,
          created_at: item.content_drafts.created_at,
          assignmentStatus: item.status,
          assignmentId: item.id,
        }));

      setAssignments(filtered);
      setLoading(false);
    };

    fetchData();
  }, []);

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

  // Count based on assignmentStatus (reviewer's own decision)
  const pendingCount = assignments.filter(a => a.assignmentStatus === 'pending').length;
  const approvedCount = assignments.filter(a => a.assignmentStatus === 'approved').length;
  const changesRequestedCount = assignments.filter(a => a.assignmentStatus === 'changes_requested').length;

  // Show only the 5 most recent drafts (by created_at)
  const recentDrafts = [...assignments]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading your dashboard...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', margin: 0 }}>Reviewer Dashboard</h1>
        <p style={{ margin: '8px 0 0 0', color: '#475569' }}>
          Overview of drafts assigned to you
        </p>
      </div>

      {/* Stat Cards */}
      <div className="summary-grid" style={{ marginBottom: '32px' }}>
        <div
          className="summary-card"
          style={{ borderColor: '#eab308', cursor: 'pointer' }}
          onClick={() => navigate('/reviewer/pending')}
        >
          <div className="summary-card-label">Pending</div>
          <div className="summary-card-count">{pendingCount}</div>
        </div>
        <div
          className="summary-card"
          style={{ borderColor: '#22c55e', cursor: 'pointer' }}
          onClick={() => navigate('/reviewer/approved')}
        >
          <div className="summary-card-label">Approved</div>
          <div className="summary-card-count">{approvedCount}</div>
        </div>
        <div
          className="summary-card"
          style={{ borderColor: '#f97316', cursor: 'pointer' }}
          onClick={() => navigate('/reviewer/changes-requested')}
        >
          <div className="summary-card-label">Changes Requested</div>
          <div className="summary-card-count">{changesRequestedCount}</div>
        </div>
      </div>

      {/* Recent Drafts Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '2px solid #cbd5e1',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Recent Drafts</h2>
        </div>
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
              {recentDrafts.map((draft, index) => (
                <tr
                  key={draft.id}
                  onClick={() => {
                    // Navigate to the appropriate filtered page with draftId
                    let route = '/reviewer/pending';
                    if (draft.status === 'approved') route = '/reviewer/approved';
                    else if (draft.status === 'changes_requested') route = '/reviewer/changes-requested';
                    navigate(`${route}?draftId=${draft.id}`);
                  }}
                  style={{
                    cursor: 'pointer',
                    borderBottom: index === recentDrafts.length - 1 ? 'none' : '1px solid #e2e8f0',
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
              {recentDrafts.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                    No drafts assigned to you yet.
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