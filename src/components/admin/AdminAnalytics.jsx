import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

export function AdminAnalytics() {
  const [dailyData, setDailyData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [reviewerWorkload, setReviewerWorkload] = useState([]);
  const [avgApprovalTime, setAvgApprovalTime] = useState(0);
  const [totalDrafts, setTotalDrafts] = useState(0);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#eab308', '#22c55e', '#f97316', '#6b7280'];

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    // 1. Daily submissions
    const { data: daily } = await supabase
      .from('daily_submissions')
      .select('*')
      .order('date', { ascending: true });
    setDailyData(daily || []);

    // 2. Status distribution
    const { data: status } = await supabase.rpc('status_distribution');
    setStatusData(status || []);

    // 3. Reviewer workload (pending counts)
    const { data: reviewers } = await supabase
      .from('reviewer_performance')
      .select('full_name, pending_count')
      .eq('is_active', true)
      .order('pending_count', { ascending: false });
    setReviewerWorkload(reviewers || []);

    // 4. Average approval time
    const { data: avgTime } = await supabase.rpc('avg_approval_time_hours');
    setAvgApprovalTime(avgTime || 0);

    // 5. Total drafts (active, not archived)
    const { count } = await supabase
      .from('content_drafts')
      .select('*', { count: 'exact', head: true })
      .is('archived_at', null);
    setTotalDrafts(count || 0);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h])).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div>
      <h2>Analytics Dashboard</h2>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '16px', border: '1px solid #cbd5e1', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
          <div>Total Drafts</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{totalDrafts}</div>
        </div>
        <div style={{ padding: '16px', border: '1px solid #cbd5e1', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
          <div>Pending Reviews</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {statusData.find(s => s.status === 'pending_review')?.count || 0}
          </div>
        </div>
        <div style={{ padding: '16px', border: '1px solid #cbd5e1', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
          <div>Approved Drafts</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {statusData.find(s => s.status === 'approved')?.count || 0}
          </div>
        </div>
        <div style={{ padding: '16px', border: '1px solid #cbd5e1', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
          <div>Avg Approval Time</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{avgApprovalTime} hrs</div>
        </div>
      </div>

      {/* Draft Volume Over Time */}
      <div style={{ marginBottom: '32px' }}>
        <h3>Draft Submissions (Last 30 Days)</h3>
        {dailyData.length === 0 ? (
          <p>No draft submissions in the last 30 days.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(tick) => new Date(tick).toLocaleDateString()} />
                <YAxis />
                <Tooltip labelFormatter={(label) => new Date(label).toLocaleDateString()} />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#1e40af" name="Submissions" />
              </LineChart>
            </ResponsiveContainer>
            <button type="button" onClick={() => exportCSV(dailyData, 'daily_submissions')} style={{ marginTop: '8px' }}>Export CSV</button>
          </>
        )}
      </div>

      {/* Status Distribution Pie Chart */}
      <div style={{ marginBottom: '32px' }}>
        <h3>Draft Status Distribution</h3>
        {statusData.length === 0 ? (
          <p>No status data available.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <button type="button" onClick={() => exportCSV(statusData, 'status_distribution')} style={{ marginTop: '8px' }}>Export CSV</button>
          </>
        )}
      </div>

      {/* Reviewer Workload Bar Chart */}
      <div style={{ marginBottom: '32px' }}>
        <h3>Reviewer Workload (Pending Assignments)</h3>
        {reviewerWorkload.length === 0 ? (
          <p>No active reviewers found.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reviewerWorkload}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="full_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pending_count" fill="#f97316" name="Pending Assignments" />
              </BarChart>
            </ResponsiveContainer>
            <button type="button" onClick={() => exportCSV(reviewerWorkload, 'reviewer_workload')} style={{ marginTop: '8px' }}>Export CSV</button>
          </>
        )}
      </div>
    </div>
  );
}