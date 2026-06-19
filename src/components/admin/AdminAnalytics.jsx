import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

// Professional color palette
const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const CHART_COLORS = {
  indigo: '#4F46E5',
  emerald: '#10B981',
  amber: '#F59E0B',
  rose: '#EF4444',
  purple: '#8B5CF6'
};

// Custom Tooltip with modern design
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid #E5E7EB',
        fontSize: '14px',
        minWidth: '120px'
      }}>
        <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#1F2937' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: '4px 0', color: entry.color || '#4B5563' }}>
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function AdminAnalytics() {
  const [dailyData, setDailyData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [reviewerWorkload, setReviewerWorkload] = useState([]);
  const [avgApprovalTime, setAvgApprovalTime] = useState(0);
  const [totalDrafts, setTotalDrafts] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { count: total, error: totalError } = await supabase
        .from('content_drafts')
        .select('*', { count: 'exact', head: true })
        .is('archived_at', null);
      if (!totalError) setTotalDrafts(total || 0);

      const { data: allDrafts, error: statusError } = await supabase
        .from('content_drafts')
        .select('status')
        .is('archived_at', null);
      if (!statusError && allDrafts) {
        const counts = {};
        allDrafts.forEach(d => { counts[d.status] = (counts[d.status] || 0) + 1; });
        const formatted = Object.entries(counts).map(([status, count]) => ({ status, count }));
        setStatusData(formatted);
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: dailyRaw, error: dailyError } = await supabase
        .from('content_drafts')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .is('archived_at', null);
      if (!dailyError && dailyRaw) {
        const dailyCounts = {};
        dailyRaw.forEach(d => {
          const date = d.created_at.split('T')[0];
          dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        });
        const formatted = Object.entries(dailyCounts)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setDailyData(formatted);
      }

      const { data: approved, error: avgError } = await supabase
        .from('content_drafts')
        .select('created_at, updated_at')
        .eq('status', 'approved')
        .is('archived_at', null);
      if (!avgError && approved && approved.length > 0) {
        let totalHours = 0;
        approved.forEach(d => {
          const created = new Date(d.created_at);
          const updated = new Date(d.updated_at);
          const hours = (updated - created) / (1000 * 60 * 60);
          totalHours += hours;
        });
        setAvgApprovalTime(Math.round((totalHours / approved.length) * 10) / 10);
      }

      const { data: reviewers, error: revError } = await supabase
        .from('reviewer_performance')
        .select('full_name, pending_count')
        .eq('is_active', true)
        .order('pending_count', { ascending: false });
      if (!revError) setReviewerWorkload(reviewers || []);

    } catch (err) {
      console.error('Analytics fetch error:', err);
    }
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

  if (loading) return <div style={{ padding: '24px' }}>Loading analytics...</div>;

  return (
    <div style={{ background: '#F9FAFB', borderRadius: '24px', padding: '24px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', marginTop: 0, marginBottom: '24px' }}>
        Analytics Dashboard
      </h2>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {[
          { label: 'Total Drafts', value: totalDrafts },
          { label: 'Pending Reviews', value: statusData.find(s => s.status === 'pending_review')?.count || 0 },
          { label: 'Approved Drafts', value: statusData.find(s => s.status === 'approved')?.count || 0 },
          { label: 'Avg Approval Time', value: `${avgApprovalTime} hrs` }
        ].map((card, idx) => (
          <div key={idx} style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>
              {card.label}
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1F2937' }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Draft Submissions Chart (reverted to simple Line) */}
      <div style={{ marginBottom: '32px', backgroundColor: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', marginTop: 0, marginBottom: '16px' }}>
          Draft Submissions (Last 30 Days)
        </h3>
        {dailyData.length === 0 ? (
          <p style={{ color: '#6B7280', padding: '20px 0' }}>No draft submissions in the last 30 days.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 14, paddingTop: 12 }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={CHART_COLORS.indigo}
                  strokeWidth={3}
                  dot={{ fill: CHART_COLORS.indigo, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Submissions"
                />
              </LineChart>
            </ResponsiveContainer>
            <button
              type="button"
              onClick={() => exportCSV(dailyData, 'daily_submissions')}
              style={{
                marginTop: '12px',
                padding: '6px 16px',
                backgroundColor: '#F3F4F6',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#374151'
              }}
            >
              Export CSV
            </button>
          </>
        )}
      </div>

      {/* Status Distribution Pie Chart */}
      <div style={{ marginBottom: '32px', backgroundColor: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', marginTop: 0, marginBottom: '16px' }}>
          Draft Status Distribution
        </h3>
        {statusData.length === 0 ? (
          <p style={{ color: '#6B7280', padding: '20px 0' }}>No status data available.</p>
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
                  innerRadius={60}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 14, paddingTop: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <button
              type="button"
              onClick={() => exportCSV(statusData, 'status_distribution')}
              style={{
                marginTop: '12px',
                padding: '6px 16px',
                backgroundColor: '#F3F4F6',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#374151'
              }}
            >
              Export CSV
            </button>
          </>
        )}
      </div>

      {/* Reviewer Workload Bar Chart */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', marginTop: 0, marginBottom: '16px' }}>
          Reviewer Workload (Pending Assignments)
        </h3>
        {reviewerWorkload.length === 0 ? (
          <p style={{ color: '#6B7280', padding: '20px 0' }}>No active reviewers found.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reviewerWorkload} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="full_name"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 14, paddingTop: 12 }} />
                <Bar
                  dataKey="pending_count"
                  fill={CHART_COLORS.amber}
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                  name="Pending Assignments"
                />
              </BarChart>
            </ResponsiveContainer>
            <button
              type="button"
              onClick={() => exportCSV(reviewerWorkload, 'reviewer_workload')}
              style={{
                marginTop: '12px',
                padding: '6px 16px',
                backgroundColor: '#F3F4F6',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#374151'
              }}
            >
              Export CSV
            </button>
          </>
        )}
      </div>
    </div>
  );
}