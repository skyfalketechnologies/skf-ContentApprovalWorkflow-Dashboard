import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabaseRealtime } from '../../hooks/useSupabaseRealtime'
import { AuditTrail } from '../common/AuditTrail'

export function AllDraftsPage({ profile }) {
  const navigate = useNavigate()
  const [selectedDraftForAudit, setSelectedDraftForAudit] = useState(null)
  const [timeFilter, setTimeFilter] = useState('all')
  const { data: drafts, loading, error } = useSupabaseRealtime('content_drafts')

  const counts = useMemo(() => {
    const c = { draft: 0, pending_review: 0, approved: 0, changes_requested: 0, rejected: 0 }
    drafts.forEach(d => {
      if (d.status in c) {
        c[d.status]++
      } else {
        c[d.status] = (c[d.status] || 0) + 1
      }
    })
    return c
  }, [drafts])

  const filteredDrafts = useMemo(() => {
    let filtered = drafts
    const now = new Date()
    if (timeFilter === '7days') {
      const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7))
      filtered = filtered.filter(d => new Date(d.created_at) >= sevenDaysAgo)
    } else if (timeFilter === '30days') {
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30))
      filtered = filtered.filter(d => new Date(d.created_at) >= thirtyDaysAgo)
    } else if (timeFilter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      filtered = filtered.filter(d => new Date(d.created_at) >= startOfMonth)
    }
    return filtered
  }, [drafts, timeFilter])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const handleViewDraft = (draft) => {
    const statusRoutes = {
      draft: '/creator/drafts',
      pending_review: '/creator/pending',
      approved: '/creator/approved',
      changes_requested: '/creator/changes-requested'
    }
    const baseRoute = statusRoutes[draft.status] || '/creator'
    navigate(`${baseRoute}?draftId=${draft.id}`)
  }

  const getStatusBadge = (status) => {
    const config = {
      draft: { label: 'Draft', color: '#6b7280' },
      pending_review: { label: 'Pending', color: '#eab308' },
      approved: { label: 'Approved', color: '#22c55e' },
      changes_requested: { label: 'Changes Requested', color: '#f97316' },
      rejected: { label: 'Rejected', color: '#ef4444' }
    }
    const c = config[status] || config.draft
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: c.color,
        color: 'white'
      }}>
        {c.label}
      </span>
    )
  }

  if (loading) return <div className="dashboard-card">Loading dashboard...</div>
  if (error) return <div className="dashboard-card">Error loading data: {error}</div>

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: 0 }}>{greeting}, {profile.full_name}!</h1>
          <p style={{ margin: '8px 0 0 0', color: '#475569' }}>Overview of all content drafts</p>
        </div>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="form-input"
          style={{ width: 'auto' }}
        >
          <option value="all">All</option>
          <option value="7days">Last 7 days</option>
          <option value="30days">Last 30 days</option>
          <option value="month">This month</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid" style={{ marginBottom: '32px' }}>
        <div className="summary-card" style={{ borderColor: '#6b7280', cursor: 'pointer' }} onClick={() => navigate('/creator/drafts')}>
          <div className="summary-card-label">Drafts</div>
          <div className="summary-card-count">{counts.draft || 0}</div>
        </div>
        <div className="summary-card" style={{ borderColor: '#eab308', cursor: 'pointer' }} onClick={() => navigate('/creator/pending')}>
          <div className="summary-card-label">Pending</div>
          <div className="summary-card-count">{counts.pending_review || 0}</div>
        </div>
        <div className="summary-card" style={{ borderColor: '#22c55e', cursor: 'pointer' }} onClick={() => navigate('/creator/approved')}>
          <div className="summary-card-label">Approved</div>
          <div className="summary-card-count">{counts.approved || 0}</div>
        </div>
        <div className="summary-card" style={{ borderColor: '#f97316', cursor: 'pointer' }} onClick={() => navigate('/creator/changes-requested')}>
          <div className="summary-card-label">Changes Requested</div>
          <div className="summary-card-count">{counts.changes_requested || 0}</div>
        </div>
      </div>

      {/* Drafts Table */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #cbd5e1',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{
                backgroundColor: '#f8fafc',
                borderBottom: '2px solid #cbd5e1'
              }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Title</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Preview</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Created</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrafts.map((draft, index) => (
                <tr key={draft.id} style={{
                  borderBottom: index === filteredDrafts.length - 1 ? 'none' : '1px solid #e2e8f0',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '500' }}>{draft.title}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ color: '#475569', fontSize: '14px' }}>
                      {draft.body.length > 80 ? draft.body.substring(0, 80) + '...' : draft.body}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {getStatusBadge(draft.status)}
                  </td>
                  <td style={{ padding: '16px', color: '#475569', fontSize: '14px' }}>
                    {new Date(draft.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleViewDraft(draft)}
                        style={{
                          padding: '6px 16px',
                          backgroundColor: 'transparent',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#1e40af'
                          e.currentTarget.style.color = 'white'
                          e.currentTarget.style.borderColor = '#1e40af'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = '#0f172a'
                          e.currentTarget.style.borderColor = '#cbd5e1'
                        }}
                      >
                        View →
                      </button>
                      <button
                        onClick={() => setSelectedDraftForAudit(draft)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'transparent',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f1f5f9'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        Audit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDrafts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: '#475569' }}>
            No drafts found for the selected time period.
          </div>
        )}
      </div>

      {selectedDraftForAudit && (
        <AuditTrail
          draftId={selectedDraftForAudit.id}
          onClose={() => setSelectedDraftForAudit(null)}
        />
      )}
    </div>
  )
}