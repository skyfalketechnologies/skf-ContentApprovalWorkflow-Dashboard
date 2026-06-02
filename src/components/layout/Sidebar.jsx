import { useState } from 'react'
import { NavLink } from 'react-router-dom'

// feature: collapsible navigation sidebar for creator/reviewer pages
// feature: uses flat design and active link highlighting
export function Sidebar({ profile, onSignOut, onOpenProfileSettings }) {
  const [collapsed, setCollapsed] = useState(false)

  const creatorLinks = [
    { to: '/creator', icon: '📄', label: 'All Drafts' },
    { to: '/creator/pending', icon: '⏳', label: 'Pending' },
    { to: '/creator/approved', icon: '✅', label: 'Approved' },
    { to: '/creator/rejected', icon: '❌', label: 'Rejected' }
  ]

  const reviewerLinks = [
    { to: '/reviewer/pending', icon: '⏳', label: 'Pending' },
    { to: '/reviewer/approved', icon: '✅', label: 'Approved' },
    { to: '/reviewer/rejected', icon: '❌', label: 'Rejected' }
  ]

  const links = profile.role === 'creator' ? creatorLinks : reviewerLinks

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setCollapsed((value) => !value)}
      >
        <span>{collapsed ? '☰' : '⏴'}</span>
        {!collapsed && <span className="sidebar-label">Menu</span>}
      </button>

      <div className="sidebar-brand">
        <span className="sidebar-icon">🏁</span>
        {!collapsed && <div>
          <h2 className="sidebar-heading">Approval</h2>
          <div style={{ fontSize: '13px', color: '#475569' }}>{profile.full_name}</div>
        </div>}
      </div>

      <nav className="sidebar-nav">
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-footer-meta">
            Role: {profile.role}
          </div>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onOpenProfileSettings}
        >
          {!collapsed ? 'Profile Settings' : '⚙️'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onSignOut}>
          {!collapsed ? 'Sign Out' : '⏏'}
        </button>
      </div>
    </aside>
  )
}
