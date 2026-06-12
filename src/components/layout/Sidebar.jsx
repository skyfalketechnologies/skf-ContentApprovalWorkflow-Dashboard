import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

// Dashboard icon (grid layout)
const DashboardIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
)

const DraftIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const ClockIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const XCircleIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const CollapseSidebarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <polyline points="16 15 13 12 16 9" />
  </svg>
)

const ExpandSidebarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <polyline points="13 9 16 12 13 15" />
  </svg>
)

const LogoIcon = () => (
  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="14" y="14" width="8" height="8" rx="2" />
    <rect x="2" y="2" width="8" height="8" rx="2" />
    <path d="M7 14v1a2 2 0 0 0 2 2h1" />
    <path d="M14 7h1a2 2 0 0 1 2 2v1" />
  </svg>
)

const SettingsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const LogOutIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const ArchiveIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <rect x="3" y="3" width="18" height="4" rx="1" />
    <path d="M5 7v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" />
    <line x1="9" y1="11" x2="15" y2="11" />
  </svg>
)

const UsersIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const RefreshIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
  </svg>
)

export function Sidebar({ profile, onSignOut, onOpenProfileSettings }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  if (!profile) return null

  const currentTab = new URLSearchParams(location.search).get('tab')

  const creatorLinks = [
    { to: '/', icon: DashboardIcon, label: 'Dashboard', end: true },
    { to: '/creator/drafts', icon: DraftIcon, label: 'Drafts' },
    { to: '/creator/pending', icon: ClockIcon, label: 'Pending' },
    { to: '/creator/approved', icon: CheckCircleIcon, label: 'Approved' },
    { to: '/creator/changes-requested', icon: XCircleIcon, label: 'Changes Requested' },
    { to: '/creator/archived', icon: ArchiveIcon, label: 'Archived' }
  ]

  const reviewerLinks = [
    { to: '/reviewer', icon: DashboardIcon, label: 'Dashboard', end: true },
    { to: '/reviewer/pending', icon: ClockIcon, label: 'Pending' },
    { to: '/reviewer/approved', icon: CheckCircleIcon, label: 'Approved' },
    { to: '/reviewer/changes-requested', icon: XCircleIcon, label: 'Changes Requested' }
  ]

  const adminLinks = [
    { to: '/admin?tab=analytics', icon: DashboardIcon, label: 'Analytics', tab: 'analytics' },
    { to: '/admin?tab=reviewers', icon: UsersIcon, label: 'Reviewers', tab: 'reviewers' },
    { to: '/admin?tab=reassign', icon: RefreshIcon, label: 'Reassign Drafts', tab: 'reassign' }
  ]

  let links
  if (profile.role === 'admin') {
    links = adminLinks
  } else if (profile.role === 'reviewer') {
    links = reviewerLinks
  } else {
    links = creatorLinks
  }

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
          const isAdminTabLink = profile.role === 'admin' && item.tab
          const isActiveAdminTab =
            isAdminTabLink &&
            location.pathname === '/admin' &&
            currentTab === item.tab

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end || false}
              className={({ isActive }) => {
                const active = isAdminTabLink ? isActiveAdminTab : isActive
                return active ? 'sidebar-link active' : 'sidebar-link'
              }}
            >
              <Icon />
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && <div className="sidebar-footer-meta">Role: {profile.role}</div>}
        <button type="button" className="btn-sidebar" onClick={onOpenProfileSettings}>
          <SettingsIcon />
          {!collapsed && <span>Profile Settings</span>}
        </button>
        <button type="button" className="btn-sidebar" onClick={onSignOut}>
          <LogOutIcon />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}