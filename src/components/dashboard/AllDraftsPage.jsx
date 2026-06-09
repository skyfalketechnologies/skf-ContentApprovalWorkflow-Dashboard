import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabaseRealtime } from '../../hooks/useSupabaseRealtime'

export function AllDraftsPage({ profile }) {
  const navigate = useNavigate()
  const [timeFilter, setTimeFilter] = useState('all')
  const { data: allDrafts, loading, error } = useSupabaseRealtime('content_drafts')

  // Filter out archived drafts
  const drafts = useMemo(() => {
    return (allDrafts || []).filter(draft => !draft.archived_at)
  }, [allDrafts])

  const counts = useMemo(() => {
    const nextCounts = {
      draft: 0,
      pending_review: 0,
      approved: 0,
      changes_requested: 0,
      rejected: 0
    }

    drafts.forEach((draft) => {
      if (draft.status in nextCounts) {
        nextCounts[draft.status] += 1
      } else {
        nextCounts[draft.status] = (nextCounts[draft.status] || 0) + 1
      }
    })

    return nextCounts
  }, [drafts])

  const filteredDrafts = useMemo(() => {
    const now = new Date()

    if (timeFilter === '7days') {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(now.getDate() - 7)
      return drafts.filter((draft) => new Date(draft.created_at) >= sevenDaysAgo)
    }

    if (timeFilter === '30days') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(now.getDate() - 30)
      return drafts.filter((draft) => new Date(draft.created_at) >= thirtyDaysAgo)
    }

    return drafts
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

    const currentConfig = config[status] || config.draft

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          backgroundColor: currentConfig.color,
          color: 'white'
        }}
      >
        {currentConfig.label}
      </span>
    )
  }

  const rowStyle = {
    cursor: 'pointer'
  }

  if (loading) {
    return <div className="dashboard-card">Loading dashboard...</div>
  }

  if (error) {
    return <div className="dashboard-card">Error loading data: {error}</div>
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '28px', margin: 0 }}>
            {greeting}, {profile.full_name}!
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#475569' }}>
            Overview of all content drafts          </p>
        </div>

        <select
          value={timeFilter}
          onChange={(event) => setTimeFilter(event.target.value)}
          className="form-input"
          style={{ width: 'auto' }}
        >
          <option value="all">All time</option>
          <option value="7days">Last 7 days</option>
          <option value="30days">Last 30 days</option>
        </select>
      </div>

      <div className="summary-grid" style={{ marginBottom: '32px' }}>
        <div
          className="summary-card"
          style={{ borderColor: '#6b7280', cursor: 'pointer' }}
          onClick={() => navigate('/creator/drafts')}
        >
          <div className="summary-card-label">Drafts</div>
          <div className="summary-card-count">{counts.draft || 0}</div>
        </div>

        <div
          className="summary-card"
          style={{ borderColor: '#eab308', cursor: 'pointer' }}
          onClick={() => navigate('/creator/pending')}
        >
          <div className="summary-card-label">Pending</div>
          <div className="summary-card-count">{counts.pending_review || 0}</div>
        </div>

        <div
          className="summary-card"
          style={{ borderColor: '#22c55e', cursor: 'pointer' }}
          onClick={() => navigate('/creator/approved')}
        >
          <div className="summary-card-label">Approved</div>
          <div className="summary-card-count">{counts.approved || 0}</div>
        </div>

        <div
          className="summary-card"
          style={{ borderColor: '#f97316', cursor: 'pointer' }}
          onClick={() => navigate('/creator/changes-requested')}
        >
          <div className="summary-card-label">Changes Requested</div>
          <div className="summary-card-count">{counts.changes_requested || 0}</div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          border: '2px solid #cbd5e1',
          borderRadius: '12px',
          overflow: 'hidden'
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
              {filteredDrafts.map((draft, index) => (
                <tr
                  key={draft.id}
                  onClick={() => handleViewDraft(draft)}
                  style={{
                    ...rowStyle,
                    borderBottom:
                      index === filteredDrafts.length - 1 ? 'none' : '1px solid #e2e8f0'
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.backgroundColor = '#f8fafc'
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.backgroundColor = '#ffffff'
                  }}
                >
                  <td style={{ padding: '16px', fontWeight: '500' }}>{draft.title}</td>
                  <td style={{ padding: '16px', color: '#475569', fontSize: '14px' }}>
                    {draft.body.length > 80 ? draft.body.substring(0, 80) + '...' : draft.body}
                  </td>
                  <td style={{ padding: '16px' }}>{getStatusBadge(draft.status)}</td>
                  <td style={{ padding: '16px', color: '#475569', fontSize: '14px' }}>
                    {new Date(draft.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}

              {filteredDrafts.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                    No drafts found for the selected time period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}