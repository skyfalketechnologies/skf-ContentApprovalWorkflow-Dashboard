import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabaseRealtime } from '../../hooks/useSupabaseRealtime'
import { DraftCard } from './DraftCard'
import { AuditTrail } from '../common/AuditTrail'

export function AllDraftsPage({ profile }) {
  const navigate = useNavigate()
  const [selectedDraftForAudit, setSelectedDraftForAudit] = useState(null)
  const [timeFilter, setTimeFilter] = useState('all')
  const { data: drafts, loading, error } = useSupabaseRealtime('content_drafts')

  // Count drafts by status – fixed hasOwnProperty issue
  const counts = useMemo(() => {
    const c = { draft: 0, pending_review: 0, approved: 0, changes_requested: 0, rejected: 0 }
    drafts.forEach(d => {
      if (d.status in c) {
        c[d.status]++
      } else {
        // fallback for any unexpected status
        c[d.status] = (c[d.status] || 0) + 1
      }
    })
    return c
  }, [drafts])

  // Time filter
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

  if (loading) return <div>Loading dashboard...</div>
  if (error) return <div>Error loading drafts: {error}</div>

  const cards = [
    { status: 'draft', label: 'Drafts', color: '#6b7280', route: profile.role === 'creator' ? '/creator/drafts' : null },
    { status: 'pending_review', label: 'Pending', color: '#eab308', route: profile.role === 'creator' ? '/creator/pending' : '/reviewer/pending' },
    { status: 'approved', label: 'Approved', color: '#22c55e', route: profile.role === 'creator' ? '/creator/approved' : '/reviewer/approved' },
    { status: 'changes_requested', label: 'Changes Requested', color: '#f97316', route: profile.role === 'creator' ? '/creator/changes-requested' : '/reviewer/changes-requested' }
  ]

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
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
          <p style={{ margin: '8px 0 0 0', color: '#475569' }}>Welcome to your content dashboard</p>
        </div>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="form-input"
          style={{ width: 'auto' }}
        >
          <option value="all">All time</option>
          <option value="7days">Last 7 days</option>
          <option value="30days">Last 30 days</option>
          <option value="month">This month</option>
        </select>
      </div>

      <div className="summary-grid" style={{ marginBottom: '32px' }}>
        {cards.map(card => (
          <div
            key={card.status}
            className="summary-card"
            style={{ borderColor: card.color, cursor: card.route ? 'pointer' : 'default' }}
            onClick={() => card.route && navigate(card.route)}
          >
            <div className="summary-card-label">{card.label}</div>
            <div className="summary-card-count">{counts[card.status] || 0}</div>
          </div>
        ))}
      </div>

      <div className="drafts-grid">
        {filteredDrafts.length === 0 ? (
          <div className="status-message" style={{ textAlign: 'center', padding: '48px' }}>No drafts found.</div>
        ) : (
          filteredDrafts.map(draft => (
            <DraftCard
              key={draft.id}
              draft={draft}
              role={profile.role}
              onViewAudit={() => setSelectedDraftForAudit(draft)}
              onEdit={() => {}}
              onDelete={() => {}}
              onSubmit={() => {}}
            />
          ))
        )}
      </div>

      {selectedDraftForAudit && (
        <AuditTrail draftId={selectedDraftForAudit.id} onClose={() => setSelectedDraftForAudit(null)} />
      )}
    </div>
  )
}