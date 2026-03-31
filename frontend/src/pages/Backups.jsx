import React, { useState } from 'react';
import { apiClient } from '../services/api';
import { HardDrive, Download, UploadCloud, AlertTriangle } from 'lucide-react';
import moment from 'moment';

export default function Backups() {
  const [loading, setLoading] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);

  const handleManualDownload = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/backup/download', {
        responseType: 'blob' // Essential for receiving pure file streams
      });
      
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `alam-builders-snapshot-${moment().format('YYYY-MM-DD_HH-mm')}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error initiating download', err);
      alert('Failed to generate master snapshot stream.');
    } finally {
      setLoading(false);
    }
  };

  const handleCatastrophicRestore = async (e) => {
    e.preventDefault();
    if (!restoreFile) return alert('Please attach a .json snapshot file.');
    if (!window.confirm('WARNING: This will instantly annihilate the current live database and replace it entirely with your attached file. THIS ACTION CANNOT BE UNDONE. Type "YES" in the next box to confirm.')) return;
    
    // Fallback native prompt
    const confirmText = prompt('Type YES to irrevocably override the database');
    if (confirmText !== 'YES') return alert('Restoration safely aborted.');
    
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('snapshot', restoreFile);
      
      const response = await apiClient.post('/backup/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' } // Express Multer binding
      });
      
      alert(response.data.message || 'Database resurrected. UI will now formally reload.');
      window.location.reload(); // Hard force full DOM remount mapping newly resurrected states
    } catch (err) {
      console.error('Restoration Failed:', err);
      alert(err.response?.data?.message || 'CRITICAL FAILURE: Failed to execute database wipe protocol.');
    } finally {
      setLoading(false);
      setRestoreFile(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <HardDrive size={26} color="var(--color-primary)" /> Catastrophic System Backups
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Physical database isolation controls. Safeguard against hardware failures or accidental global deletions.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        
        {/* DOWNLOAD CARD */}
        <div className="card flex-col" style={{ borderTop: '4px solid #3b82f6' }}>
          <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Download size={22} color="#3b82f6" /> Clone Active Database</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
              Triggers the absolute extraction of every User, Expense, Payload, Vehicle, and Project array inside the live node. Compresses them natively into a cross-platform JSON Master Snapshot and downloads it locally to your physical machine.
            </p>
          </div>
          <div style={{ paddingTop: '1.5rem', alignSelf: 'flex-start', width: '100%' }}>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', background: '#3b82f6', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)' }}
              onClick={handleManualDownload}
              disabled={loading}
            >
              <Download size={18} /> {loading ? 'Aggregating Engine...' : 'Download Master Snapshot'}
            </button>
          </div>
        </div>

        {/* RESTORE CARD */}
        <div className="card flex-col" style={{ borderTop: '4px solid #ef4444' }}>
          <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={22} color="#ef4444" /> Catastrophic Execution Restore</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
              Submitting a Master Snapshot into this portal will universally pause the Application server, completely annihilate the live database vectors, and reconstruct every array back to the exact physical architecture contained in your file.
            </p>
          </div>
          <div style={{ paddingTop: '1.5rem', width: '100%' }}>
            <form onSubmit={handleCatastrophicRestore} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div 
                style={{ 
                  border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '1.5rem', 
                  textAlign: 'center', cursor: 'pointer', background: '#f8fafc', transition: 'all 0.2s'
                }}
              >
                <UploadCloud size={32} color="#94a3b8" style={{ margin: '0 auto 0.5rem' }} />
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={(e) => setRestoreFile(e.target.files[0])}
                  required
                  style={{ width: '100%' }}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', background: '#ef4444', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}
                disabled={loading || !restoreFile}
              >
                <AlertTriangle size={18} /> {loading ? 'Reconstructing DB Matrix...' : 'Annihilate & Restore from File'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
