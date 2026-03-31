import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiClient } from '../services/api';
import { Plus, CreditCard, Wallet, Landmark, X, Activity, Trash2 } from 'lucide-react';
import moment from 'moment';

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  
  // Forms
  const [newAccountForm, setNewAccountForm] = useState({ name: '', type: 'Bank Account', balance: '', creditLimit: '' });
  const [fundForm, setFundForm] = useState({ accountId: null, amount: '', date: moment().format('YYYY-MM-DD'), description: '' });
  const [selectedAccount, setSelectedAccount] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const [accRes, txRes] = await Promise.all([
        apiClient.get('/accounts'),
        apiClient.get('/accounts/transactions/all')
      ]);
      setAccounts(accRes.data);
      setTransactions(txRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/accounts', newAccountForm);
      setShowAddModal(false);
      setNewAccountForm({ name: '', type: 'Bank Account', balance: '', creditLimit: '' });
      fetchAccounts();
    } catch (err) {
      alert('Error creating account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post(`/accounts/${fundForm.accountId}/transaction`, { 
        amount: fundForm.amount,
        date: fundForm.date,
        description: fundForm.description
      });
      setShowFundModal(false);
      setFundForm({ accountId: null, amount: '', date: moment().format('YYYY-MM-DD'), description: '' });
      setSelectedAccount(null);
      fetchAccounts();
    } catch (err) {
      alert('Error adding funds/paying bill');
    } finally {
      setSubmitting(false);
    }
  };

  const openFundModal = (account) => {
    setSelectedAccount(account);
    setFundForm({ accountId: account._id, amount: '', date: moment().format('YYYY-MM-DD'), description: '' });
    setShowFundModal(true);
  };

  const calculateTotalBalance = () => {
    return accounts.filter(a => a.type !== 'Credit Card').reduce((sum, a) => sum + a.balance, 0);
  };

  const calculateTotalOwed = () => {
    return accounts.filter(a => a.type === 'Credit Card').reduce((sum, a) => sum + Math.abs(Math.min(0, a.balance)), 0);
  };

  const handleDeleteAccount = async (id) => {
    if (window.confirm('Are you absolutely sure you want to delete this account? Expenses linked to it will gracefully display as "Legacy".')) {
      try {
        await apiClient.delete(`/accounts/${id}`);
        fetchAccounts();
      } catch (err) {
        alert('Error deleting account');
      }
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading accounts...</div>;

  return (
    <>
    <div className="animate-fade-in relative">
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Financial Accounts</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Manage your bank accounts, cash wallets, and credit cards</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
          <Plus size={20} /> Add Account
        </button>
      </div>

      <div className="responsive-row" style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ flex: 1, borderLeft: '4px solid #10b981' }}>
          <h3 style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginBottom: '0.5rem' }}>Total Liquid Assets</h3>
          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#10b981' }}>
            AED {calculateTotalBalance().toLocaleString()}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Available cash and bank balances</p>
        </div>
        <div className="card" style={{ flex: 1, borderLeft: '4px solid #f43f5e' }}>
          <h3 style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginBottom: '0.5rem' }}>Total Credit/Loans Owed</h3>
          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#f43f5e' }}>
            AED {calculateTotalOwed().toLocaleString()}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Outstanding credit card balances</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {accounts.map(account => (
          <div key={account._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="flex justify-between items-start" style={{ marginBottom: '1.5rem' }}>
              <div className="flex items-center gap-3">
                <div style={{ 
                  padding: '12px', borderRadius: '12px', 
                  background: account.type === 'Bank Account' ? '#eff6ff' : account.type === 'Credit Card' ? '#fdf2f8' : '#ecfdf5',
                  color: account.type === 'Bank Account' ? '#3b82f6' : account.type === 'Credit Card' ? '#ec4899' : '#10b981'
                }}>
                  {account.type === 'Bank Account' ? <Landmark size={24} /> : account.type === 'Credit Card' ? <CreditCard size={24} /> : <Wallet size={24} />}
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>{account.name}</h3>
                  <span className="badge" style={{ marginTop: '0.4rem', display: 'inline-block', background: '#f1f5f9', color: '#64748b' }}>{account.type}</span>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteAccount(account._id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.2rem', opacity: 0.7 }}
                title="Delete Account"
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                {account.type === 'Credit Card' ? 'Current Owed Balance' : 'Available Balance'}
              </p>
              <div style={{ 
                fontSize: '1.8rem', fontWeight: 'bold', 
                color: account.type === 'Credit Card' && account.balance < 0 ? 'var(--color-danger)' : 'var(--color-text)' 
              }}>
                AED {Math.abs(account.balance).toLocaleString()}
                {account.type === 'Credit Card' && account.balance < 0 && <span style={{ fontSize: '1rem', color: 'var(--color-danger)', marginLeft: '8px' }}>(Owed)</span>}
              </div>
              
              {account.type === 'Credit Card' && account.creditLimit > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <div className="flex justify-between" style={{ fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--color-text-muted)' }}>
                    <span>Credit Usage</span>
                    <span>AED {Math.abs(account.balance).toLocaleString()} / {account.creditLimit.toLocaleString()}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      background: 'var(--color-primary)', 
                      width: `${Math.min(100, (Math.abs(account.balance) / account.creditLimit) * 100)}%` 
                    }}></div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
              <button 
                className={`btn ${account.type === 'Credit Card' ? 'btn-outline' : 'btn-primary'}`} 
                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}
                onClick={() => openFundModal(account)}
              >
                <Activity size={18} /> 
                {account.type === 'Credit Card' ? 'Pay Card Bill' : 'Deposit Funds'}
              </button>
            </div>
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem' }}>
            <Landmark size={48} style={{ color: '#cbd5e1', margin: '0 auto 1.5rem' }} />
            <h3>No Accounts Found</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Add your first bank account or credit card to start tracking source funds.</p>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>Add Account</button>
          </div>
        )}
      </div>

      {/* Transaction History Table */}
      <div className="card" style={{ marginTop: '2.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Transaction History</h3>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Account</th>
                <th>Type</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? transactions.map(tx => (
                <tr key={tx._id}>
                  <td style={{ color: 'var(--color-text-muted)' }}>{moment(tx.date).format('MMM D, YYYY')}</td>
                  <td style={{ fontWeight: 500 }}>{tx.accountId ? tx.accountId.name : 'Unknown Account'}</td>
                  <td>
                    <span className={`badge ${tx.type === 'Deposit' ? 'badge-success' : 'badge-info'}`} style={{ 
                      background: tx.type === 'Deposit' ? '#dcfce7' : '#e0e7ff',
                      color: tx.type === 'Deposit' ? '#16a34a' : '#4f46e5'
                    }}>
                      {tx.type}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{tx.description || '-'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: tx.type === 'Deposit' ? '#10b981' : '#f43f5e' }}>
                    {tx.type === 'Deposit' ? '+' : ''}AED {tx.amount.toLocaleString()}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No recent transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Add Account Modal */}
    {showAddModal && createPortal(
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
            <h2>Add New Account</h2>
            <button onClick={() => setShowAddModal(false)} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleAddAccount}>
            <div className="form-group">
              <label className="form-label">Account Name</label>
              <input 
                required type="text" className="form-input" placeholder="e.g. Dubai Islamic Bank"
                value={newAccountForm.name} onChange={e => setNewAccountForm({...newAccountForm, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <select 
                required className="form-input" 
                value={newAccountForm.type} onChange={e => setNewAccountForm({...newAccountForm, type: e.target.value})}
              >
                <option value="Bank Account">Bank Account</option>
                <option value="Cash">Cash Wallet</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>
            
            {newAccountForm.type === 'Credit Card' ? (
              <>
                <div className="form-group">
                  <label className="form-label">Current Owed Balance</label>
                  <input 
                    type="number" min="0" className="form-input" placeholder="0"
                    value={Math.abs(newAccountForm.balance) || ''} 
                    onChange={e => setNewAccountForm({...newAccountForm, balance: -Math.abs(e.target.value)})}
                  />
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>Enter the amount you currently owe. Leave 0 if fully paid.</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Total Credit Limit (Optional)</label>
                  <input 
                    type="number" min="0" className="form-input" placeholder="e.g. 20000"
                    value={newAccountForm.creditLimit} onChange={e => setNewAccountForm({...newAccountForm, creditLimit: e.target.value})}
                  />
                </div>
              </>
            ) : (
              <div className="form-group">
                <label className="form-label">Initial Balance (AED)</label>
                <input 
                  required type="number" step="0.01" className="form-input" placeholder="0.00"
                  value={newAccountForm.balance} onChange={e => setNewAccountForm({...newAccountForm, balance: e.target.value})}
                />
              </div>
            )}
            
            <div className="flex gap-4" style={{ marginTop: '2rem' }}>
              <button type="button" className="btn btn-outline flex-1" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )}

    {/* Add Funds / Pay Bill Modal */}
    {showFundModal && selectedAccount && createPortal(
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
            <h2>{selectedAccount.type === 'Credit Card' ? 'Pay Credit Card Bill' : 'Deposit Funds'}</h2>
            <button onClick={() => setShowFundModal(false)} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleAddFunds}>
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Account</p>
              <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>{selectedAccount.name}</h3>
            </div>
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Date</label>
              <input 
                required type="date" className="form-input"
                value={fundForm.date} onChange={e => setFundForm({...fundForm, date: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {selectedAccount.type === 'Credit Card' ? 'Payment Amount (AED)' : 'Deposit Amount (AED)'}
              </label>
              <input 
                required type="number" step="0.01" min="0.01" className="form-input" placeholder="0.00"
                value={fundForm.amount} onChange={e => setFundForm({...fundForm, amount: e.target.value})}
              />
              {selectedAccount.type === 'Credit Card' && (
                <p style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.4rem' }}>
                  This payment will reduce your owed balance.
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <input 
                type="text" className="form-input" placeholder="e.g. Bank Transfer"
                value={fundForm.description} onChange={e => setFundForm({...fundForm, description: e.target.value})}
              />
            </div>
            
            <div className="flex gap-4" style={{ marginTop: '2rem' }}>
              <button type="button" className="btn btn-outline flex-1" onClick={() => setShowFundModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
                {submitting ? 'Processing...' : 'Confirm'}
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
