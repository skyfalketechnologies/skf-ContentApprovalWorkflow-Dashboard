import { useSearchParams } from 'react-router-dom';
import { AdminReviewerManagement } from './AdminReviewerManagement';
import { AdminDraftReassign } from './AdminDraftReassign';
import { AdminAnalytics } from './AdminAnalytics';

export function AdminDashboard() {
  const [searchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const validTabs = ['analytics', 'reviewers', 'reassign'];
  const tab = validTabs.includes(rawTab) ? rawTab : 'analytics';

  const renderContent = () => {
    switch (tab) {
      case 'reviewers':
        return <AdminReviewerManagement />;
      case 'reassign':
        return <AdminDraftReassign />;
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