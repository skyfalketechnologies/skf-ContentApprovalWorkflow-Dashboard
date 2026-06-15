import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabaseRealtime } from '../../hooks/useSupabaseRealtime.js'

// feature: dashboard landing page with quick status cards and greeting
export function HomeSummary({ profile }) {
  const navigate = useNavigate()
  const isCreator = profile.role === 'creator'
  const { data: drafts, loading, error } = useSupabaseRealtime(
    'content_drafts',
    isCreator ? 'creator_id' : undefined,
    isCreator ? profile.id : undefined
  )

  const counts = useMemo(() => {
    return drafts.reduce(
      (acc, draft) => {
        acc[draft.status] = (acc[draft.status] || 0) + 1
        return acc
      },
      { draft: 0, pending_review: 0, approved: 0, rejected: 0 }
    )
  }, [drafts])

  const time = new Date().getHours()
  const greeting = time < 12 ? 'Good morning' : time < 18 ? 'Good afternoon' : 'Good evening'

  const cards = isCreator
    ? [
        { key: 'draft', label: 'Drafts', count: counts.draft, route: '/creator', color: '#64748b' },
        { key: 'pending_review', label: 'Pending', count: counts.pending_review, route: '/creator/pending', color: '#eab308' },
        { key: 'approved', label: 'Approved', count: counts.approved, route: '/creator/approved', color: '#22c55e' },
        { key: 'rejected', label: 'Rejected', count: counts.rejected, route: '/creator/rejected', color: '#ef4444' }
      ]
    : [
        { key: 'pending_review', label: 'Pending', count: counts.pending_review, route: '/reviewer/pending', color: '#eab308' },
        { key: 'approved', label: 'Approved', count: counts.approved, route: '/reviewer/approved', color: '#22c55e' },
        { key: 'rejected', label: 'Rejected', count: counts.rejected, route: '/reviewer/rejected', color: '#ef4444' }
      ]

  if (loading) {
    return <div className="dashboard-card">Loading summary...</div>
  }

  if (error) {
    return <div className="dashboard-card">Error loading summary: {error}</div>
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '28px', margin: 0 }}>{greeting}, {profile.full_name}!</h1>
          <p style={{ margin: '12px 0 0 0', color: '#475569' }}>
            Track drafts and review progress from your dashboard.
          </p>
        </div>
      </div>

      <div className="summary-grid">
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            className="summary-card"
            onClick={() => navigate(card.route)}
            style={{ borderColor: card.color }}
          >
            <p className="summary-card-label" style={{ color: card.color, marginBottom: '8px' }}>{card.label}</p>
            <p className="summary-card-count">{card.count}</p>
            <p className="summary-card-label">Tap to view</p>
          </button>
        ))}
      </div>
    </div>
  )
}
