import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function AdminSettings() {
  const [maxWorkload, setMaxWorkload] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('max_workload')
        .single();
      if (!error && data) {
        setMaxWorkload(data.max_workload);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setMessage('');
    const { error } = await supabase
      .from('system_settings')
      .update({ max_workload: maxWorkload, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage('✅ Workload cap updated successfully.');
    }
    setSaving(false);
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div style={{ maxWidth: '600px' }}>
      <h2>System Settings</h2>
      <p>Set the maximum number of pending assignments a reviewer can have before they are considered "over capacity".</p>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
          Maximum pending assignments per reviewer
        </label>
        <input
          type="number"
          min="1"
          max="20"
          value={maxWorkload}
          onChange={(e) => setMaxWorkload(parseInt(e.target.value) || 1)}
          style={{
            width: '100px',
            padding: '8px',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '16px'
          }}
        />
      </div>
      <button
        onClick={saveSettings}
        disabled={saving}
        style={{
          padding: '8px 20px',
          backgroundColor: '#1e40af',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.6 : 1
        }}
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
      {message && (
        <div style={{ marginTop: '16px', color: message.startsWith('Error') ? 'red' : 'green' }}>
          {message}
        </div>
      )}
    </div>
  );
}