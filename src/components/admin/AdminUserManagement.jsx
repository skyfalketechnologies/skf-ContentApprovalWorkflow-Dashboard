import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (userId, newRole) => {
    setUpdatingUserId(userId);
    setError('');
    setSuccess('');
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(`User role updated to ${newRole}`);
      fetchUsers();
    }
    setUpdatingUserId(null);
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <h2>All Users</h2>
      <p>Promote or demote users between Creator, Reviewer, and Admin.</p>
      {error && <div style={{ color: 'red', marginBottom: '12px' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: '12px' }}>{success}</div>}
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
              <th>Email</th>
              <th>Current Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px' }}>{user.full_name || '—'}</td>
                <td style={{ padding: '12px' }}>{user.email || '—'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: user.role === 'admin' ? '#e9d5ff' : user.role === 'reviewer' ? '#dcfce7' : '#dbeafe',
                    color: user.role === 'admin' ? '#6b21a5' : user.role === 'reviewer' ? '#166534' : '#1e40af'
                  }}>
                    {user.role || 'creator'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {user.role !== 'admin' && (
                      <>
                        {user.role !== 'creator' && (
                          <button
                            onClick={() => updateRole(user.id, 'creator')}
                            disabled={updatingUserId === user.id}
                            style={{ padding: '4px 10px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            Make Creator
                          </button>
                        )}
                        {user.role !== 'reviewer' && (
                          <button
                            onClick={() => updateRole(user.id, 'reviewer')}
                            disabled={updatingUserId === user.id}
                            style={{ padding: '4px 10px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            Make Reviewer
                          </button>
                        )}
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => updateRole(user.id, 'admin')}
                            disabled={updatingUserId === user.id}
                            style={{ padding: '4px 10px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            Make Admin
                          </button>
                        )}
                      </>
                    )}
                    {user.role === 'admin' && (
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Admin (protected)</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan="4" style={{ padding: '32px', textAlign: 'center' }}>No users found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}