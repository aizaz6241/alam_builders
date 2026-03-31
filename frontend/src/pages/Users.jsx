import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiClient } from '../services/api';
import { Plus, X, Trash2, KeyRound } from 'lucide-react';
import moment from 'moment';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Project Manager' });

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      alert('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/auth/users', form);
      setShowAddModal(false);
      setForm({ name: '', email: '', password: '', role: 'Project Manager' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id, role) => {
    if (role === 'Super Admin') return alert('Cannot delete Super Admin profiles');
    if (window.confirm('Are you sure you want to revoke and delete this user?')) {
      try {
        await apiClient.delete(`/auth/users/${id}`);
        fetchUsers();
      } catch (err) {
        alert('Error deleting user');
      }
    }
  };

  const handleForceReset = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.put(`/auth/users/${resetTarget._id}/password`, { newPassword: resetPassword });
      setShowResetModal(false);
      alert(`Password explicitly overridden for ${resetTarget.name}`);
    } catch (err) {
      alert('Error bypassing and overriding password');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading users...</div>;

  return (
    <>
      <div className="animate-fade-in relative">
        <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>User Management</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>Manage employee login access and RBAC permissions</p>
          </div>
          <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
            <Plus size={20} /> Issue Credential
          </button>
        </div>

        <div className="card">
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email Address</th>
                  <th>Assigned Role</th>
                  <th>Registered Date</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td style={{ fontWeight: 600 }}>{user.name}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{user.email}</td>
                    <td>
                      <span className="badge" style={{ 
                        background: user.role === 'Super Admin' ? '#fef08a' : user.role === 'Accountant' ? '#e0e7ff' : user.role === 'HR' ? '#fce7f3' : '#f1f5f9',
                        color: user.role === 'Super Admin' ? '#b45309' : user.role === 'Accountant' ? '#4f46e5' : user.role === 'HR' ? '#be185d' : '#475569'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{moment(user.createdAt).format('MMM D, YYYY')}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => { setResetTarget(user); setResetPassword(''); setShowResetModal(true); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', marginRight: '12px' }}
                        title="Force User Password Reset"
                      >
                        <KeyRound size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user._id, user.role)} 
                        style={{ background: 'none', border: 'none', cursor: user.role === 'Super Admin' ? 'not-allowed' : 'pointer', color: user.role === 'Super Admin' ? '#cbd5e1' : '#f43f5e' }}
                        disabled={user.role === 'Super Admin'}
                        title="Revoke and Delete User"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2>Issue Access Credential</h2>
              <button onClick={() => setShowAddModal(false)} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Full Name</label>
                <input required type="text" className="form-input" placeholder="e.g. John Doe" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Email Address</label>
                <input required type="email" className="form-input" placeholder="john@alambuilders.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Temporary Password</label>
                <input required type="text" className="form-input" placeholder="password123" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">System Role</label>
                <select className="form-input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="Project Manager">Project Manager</option>
                  <option value="HR">HR</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>
              
              <div className="flex gap-4">
                <button type="button" className="btn btn-outline flex-1" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Login'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {showResetModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2>Force Remote Reset</h2>
              <button onClick={() => setShowResetModal(false)} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              You are manually forcibly superseding the encrypted password for <strong>{resetTarget?.name}</strong>. They will immediately lose access via their old credentials.
            </p>
            <form onSubmit={handleForceReset}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">New Direct Password</label>
                <input required type="text" className="form-input" placeholder="Type new secure key" value={resetPassword} onChange={e => setResetPassword(e.target.value)} />
              </div>
              
              <div className="flex gap-4">
                <button type="button" className="btn btn-outline flex-1" onClick={() => setShowResetModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1" style={{ background: '#f59e0b', color: 'white', border: 'none' }} disabled={submitting}>
                  {submitting ? 'Overriding...' : 'Override Key'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
