import { useSearchParams } from 'react-router-dom';
import { AdminReviewerManagement } from './AdminReviewerManagement.jsx';
import { AdminDraftReassign } from './AdminDraftReassign.jsx';
import { AdminAnalytics } from './AdminAnalytics.jsx';
import { AdminUserManagement } from './AdminUserManagement.jsx';
import { AdminSettings } from './AdminSettings.jsx';

export function AdminDashboard() {
  const [searchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const validTabs = ['analytics', 'reviewers', 'reassign', 'users', 'settings'];
  const tab = validTabs.includes(rawTab) ? rawTab : 'analytics';

  const renderContent = () => {
    switch (tab) {
      case 'reviewers':
        return <AdminReviewerManagement />;
      case 'reassign':
        return <AdminDraftReassign />;
      case 'users':
        return <AdminUserManagement />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <AdminAnalytics />;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Admin Dashboard</h1>
      {renderContent()}
    </div>
  );
}