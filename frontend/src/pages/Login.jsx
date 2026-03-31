import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f1f5f9' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', borderRadius: '16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ background: 'var(--color-primary)', color: 'white', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 'bold', margin: '0 auto 1rem', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)' }}>AB</div>
          <h2 style={{ color: '#1e293b' }}>Alam Builders</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>Secure Corporate Portal</p>
        </div>

        {error && (
          <div style={{ padding: '0.85rem', background: '#fee2e2', color: '#ef4444', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.2rem' }}>
            <label className="form-label" style={{ fontWeight: 600, color: '#475569' }}>Registered Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" style={{ padding: '0.75rem' }} placeholder="admin@alambuilders.com" />
          </div>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" style={{ fontWeight: 600, color: '#475569' }}>Secure Password</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" style={{ padding: '0.75rem' }} placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 600 }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>
      </div>
    </div>
  );
}
