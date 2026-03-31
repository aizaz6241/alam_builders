import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import moment from 'moment';
import { Search } from 'lucide-react';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await apiClient.get('/activity-logs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
      alert('Error fetching activity logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const searchLow = searchTerm.toLowerCase();
    return log.module.toLowerCase().includes(searchLow) || 
           log.action.toLowerCase().includes(searchLow) || 
           (log.userId && log.userId.name.toLowerCase().includes(searchLow));
  });

  if (loading) return <div style={{ padding: '2rem' }}>Loading activity ledger...</div>;

  return (
    <div className="animate-fade-in relative">
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Global Activity Ledger</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Read-only audit log tracking physical system modifications</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Search size={20} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Search logs by Module, Action, or User..." 
            className="form-input" 
            style={{ flex: 1, border: 'none', background: 'transparent' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-container">
          <table className="data-table">
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th>Timestamp</th>
                <th>Author</th>
                <th>Action</th>
                <th>Module Target</th>
                <th>Payload Reference</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log._id}>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    {moment(log.timestamp).format('MMM D, YYYY h:mm A')}
                  </td>
                  <td>
                    {log.userId ? (
                      <div>
                        <div style={{ fontWeight: 600 }}>{log.userId.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>{log.userId.role}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>System generated</span>
                    )}
                  </td>
                  <td>
                    <span className="badge" style={{ 
                      background: log.action === 'Created' ? '#dcfce7' : log.action === 'Deleted' ? '#fee2e2' : '#e0e7ff',
                      color: log.action === 'Created' ? '#16a34a' : log.action === 'Deleted' ? '#ef4444' : '#4f46e5'
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{log.module}</td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{log.details}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    No audit records match your search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
