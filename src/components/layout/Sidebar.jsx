import { useState } from 'react'
import { NavLink } from 'react-router-dom'

// Icons (same as before, plus a new one for All Drafts)
const AllDraftsIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
)

const DraftIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const ClockIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const XCircleIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const CollapseSidebarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <polyline points="16 15 13 12 16 9" />
  </svg>
)

const ExpandSidebarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <polyline points="13 9 16 12 13 15" />
  </svg>
)

const LogoIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="14" y="14" width="8" height="8" rx="2" />
    <rect x="2" y="2" width="8" height="8" rx="2" />
    <path d="M7 14v1a2 2 0 0 0 2 2h1" />
    <path d="M14 7h1a2 2 0 0 1 2 2v1" />
  </svg>
)

const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const LogOutIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

export function Sidebar({ profile, onSignOut, onOpenProfileSettings }) {
  const [collapsed, setCollapsed] = useState(false)
  if (!profile) return null

  const creatorLinks = [
    { to: '/', icon: AllDraftsIcon, label: 'All Drafts', end: true },        // points to index
    { to: '/creator/drafts', icon: DraftIcon, label: 'Drafts' },
    { to: '/creator/pending', icon: ClockIcon, label: 'Pending' },
    { to: '/creator/approved', icon: CheckCircleIcon, label: 'Approved' },
    { to: '/creator/changes-requested', icon: XCircleIcon, label: 'Changes Requested' }
  ]

  const reviewerLinks = [
    { to: '/', icon: AllDraftsIcon, label: 'All Drafts', end: true },
    { to: '/reviewer/pending', icon: ClockIcon, label: 'Pending' },
    { to: '/reviewer/approved', icon: CheckCircleIcon, label: 'Approved' },
    { to: '/reviewer/changes-requested', icon: XCircleIcon, label: 'Changes Requested' }
  ]

  const links = profile.role === 'creator' ? creatorLinks : reviewerLinks

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo">
          <LogoIcon />
          {!collapsed && <span className="brand-name">Content Flow</span>}
        </div>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setCollapsed(v => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ExpandSidebarIcon /> : <CollapseSidebarIcon />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {links.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end || false}
              className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
            >
              <Icon />
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && <div className="sidebar-footer-meta">Role: {profile.role}</div>}
        <button className="btn btn-secondary" onClick={onOpenProfileSettings}>
          <SettingsIcon />
          {!collapsed && <span>Profile Settings</span>}
        </button>
        <button className="btn btn-secondary" onClick={onSignOut}>
          <LogOutIcon />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}