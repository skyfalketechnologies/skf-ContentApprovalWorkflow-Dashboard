import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

// feature: page shell that combines sidebar navigation with main content area
export function MainLayout({ profile, onSignOut, onOpenProfileSettings }) {
  return (
    <div className="app-layout">
      <Sidebar
        profile={profile}
        onSignOut={onSignOut}
        onOpenProfileSettings={onOpenProfileSettings}
      />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
