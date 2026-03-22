import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { Plus, Search, Calendar, X, HandCoins, Edit, Trash2, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import moment from 'moment';

export default function SalaryAdvance() {
  const [advances, setAdvances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [workRecords, setWorkRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [processMonth, setProcessMonth] = useState(moment().format('YYYY-MM'));
  const [normalWorkingHours] = useState(Number(localStorage.getItem('normalWorkingHours')) || 8);

  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [advanceForm, setAdvanceForm] = useState({
    employeeId: '',
    date: moment().format('YYYY-MM-DD'),
    amount: '',
    description: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    employeeId: '',
    date: moment().format('YYYY-MM-DD'),
    month: processMonth,
    amount: '',
    description: ''
  });
  
  const [selectedEmpInfo, setSelectedEmpInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [editingAdvanceId, setEditingAdvanceId] = useState(null);
  const [historyFilterMonth, setHistoryFilterMonth] = useState('');
  const [appliedHistoryMonth, setAppliedHistoryMonth] = useState('');
  
  // Analytics State
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [selectedAnalyticsName, setSelectedAnalyticsName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [advRes, empRes, workRes, payRes] = await Promise.all([
        apiClient.get('/salary-advances'),
        apiClient.get('/employees'),
        apiClient.get('/work-records'),
        apiClient.get('/salary-payments')
      ]);
      setAdvances(advRes.data);
      setEmployees(empRes.data.filter(e => e.status === 'Active'));
      setWorkRecords(workRes.data);
      setPayments(payRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payroll data', error);
      setLoading(false);
    }
  };

  const monthStart = moment(processMonth, 'YYYY-MM').startOf('month');
  const monthEnd = moment(processMonth, 'YYYY-MM').endOf('month');

  const calculatePayroll = () => {
    return employees.map(emp => {
      const empRecords = workRecords.filter(r => 
        (r.employeeId?._id === emp._id || r.employeeId === emp._id) &&
        moment(r.date).isBetween(monthStart, monthEnd, 'day', '[]')
      );
      
      const totalHours = empRecords.reduce((sum, r) => sum + (r.amountCompleted || 0), 0);
      
      const empAdvances = advances.filter(a => 
        (a.employeeId?._id === emp._id || a.employeeId === emp._id) &&
        moment(a.date).isBetween(monthStart, monthEnd, 'day', '[]')
      );
      
      const totalAdvances = empAdvances.reduce((sum, a) => sum + (a.amount || 0), 0);

      const empPayments = payments.filter(p => 
        (p.employeeId?._id === emp._id || p.employeeId === emp._id) &&
        p.month === processMonth
      );
      
      const totalPaid = empPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const hourlyRate = emp.salary ? (emp.salary / 30 / normalWorkingHours) : 0;
      const grossPay = totalHours * hourlyRate;

      const prevRecords = workRecords.filter(r => 
        (r.employeeId?._id === emp._id || r.employeeId === emp._id) &&
        moment(r.date).isBefore(monthStart, 'day')
      );
      const prevTotalHours = prevRecords.reduce((sum, r) => sum + (r.amountCompleted || 0), 0);
      const prevGrossPay = prevTotalHours * hourlyRate;

      const prevAdvances = advances.filter(a => 
        (a.employeeId?._id === emp._id || a.employeeId === emp._id) &&
        moment(a.date).isBefore(monthStart, 'day')
      );
      const prevTotalAdvances = prevAdvances.reduce((sum, a) => sum + (a.amount || 0), 0);

      const prevPayments = payments.filter(p => 
        (p.employeeId?._id === emp._id || p.employeeId === emp._id) &&
        p.month < processMonth
      );
      const prevTotalPaid = prevPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      const previousSalary = prevGrossPay - prevTotalAdvances - prevTotalPaid;

      const netPayable = grossPay + previousSalary - totalAdvances - totalPaid;
      
      return { ...emp, totalHours, hourlyRate, grossPay, totalAdvances, totalPaid, previousSalary, netPayable };
    });
  };

  const handleGiveAdvance = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingAdvanceId) {
        await apiClient.put(`/salary-advances/${editingAdvanceId}`, {
          ...advanceForm,
          amount: Number(advanceForm.amount)
        });
      } else {
        await apiClient.post('/salary-advances', {
          ...advanceForm,
          amount: Number(advanceForm.amount)
        });
      }
      setShowAdvanceModal(false);
      setEditingAdvanceId(null);
      setAdvanceForm({
        employeeId: '',
        date: moment().format('YYYY-MM-DD'),
        amount: '',
        description: ''
      });
      const { data } = await apiClient.get('/salary-advances');
      setAdvances(data);
    } catch (error) {
      console.error('Error saving advance', error);
      alert(error.response?.data?.message || 'Failed to save advance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdvance = async (id) => {
    if (window.confirm('Are you sure you want to delete this advance record?')) {
      try {
        await apiClient.delete(`/salary-advances/${id}`);
        const { data } = await apiClient.get('/salary-advances');
        setAdvances(data);
      } catch (error) {
        console.error('Error deleting advance', error);
        alert(error.response?.data?.message || 'Failed to delete advance');
      }
    }
  };

  const openEditAdvanceModal = (adv) => {
    setEditingAdvanceId(adv._id);
    setAdvanceForm({
      employeeId: adv.employeeId?._id || adv.employeeId,
      date: moment(adv.date).format('YYYY-MM-DD'),
      amount: adv.amount,
      description: adv.description || ''
    });
    setShowAdvanceModal(true);
  };

  const openAnalyticsModal = (emp) => {
    const daysInMonth = moment(processMonth, 'YYYY-MM').daysInMonth();
    const data = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = moment(processMonth, 'YYYY-MM').date(i).format('YYYY-MM-DD');
      
      const recordsOnDay = workRecords.filter(r => 
        (r.employeeId?._id === emp._id || r.employeeId === emp._id) &&
        moment(r.date).format('YYYY-MM-DD') === dateStr
      );
      
      const hoursThatDay = recordsOnDay.reduce((sum, r) => sum + (r.amountCompleted || 0), 0);
      const earnedThatDay = hoursThatDay * emp.hourlyRate;
      
      data.push({
        date: `${i}`,
        fullDate: moment(dateStr).format('MMM D, YYYY'),
        earned: Number(earnedThatDay.toFixed(2)),
        hours: hoursThatDay
      });
    }
    
    setAnalyticsData(data);
    setSelectedAnalyticsName(emp.name);
    setShowAnalyticsModal(true);
  };

  const openPaymentModal = (emp) => {
    setSelectedEmpInfo(emp);
    setPaymentForm({
      employeeId: emp._id,
      date: moment().format('YYYY-MM-DD'),
      month: processMonth,
      amount: Math.ceil(emp.netPayable > 0 ? emp.netPayable : 0),
      description: 'Monthly Salary Payment'
    });
    setShowPaymentModal(true);
  };

  const handlePaySalary = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/salary-payments', {
        ...paymentForm,
        amount: Number(paymentForm.amount)
      });
      setShowPaymentModal(false);
      const { data } = await apiClient.get('/salary-payments');
      setPayments(data);
    } catch (error) {
      console.error('Error recording payment', error);
      alert(error.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="card">Loading payroll data...</div>;

  const payrollData = calculatePayroll();

  const displayAdvances = appliedHistoryMonth 
    ? advances.filter(a => {
        const start = moment(appliedHistoryMonth, 'YYYY-MM').startOf('month');
        const end = moment(appliedHistoryMonth, 'YYYY-MM').endOf('month');
        return moment(a.date).isBetween(start, end, 'day', '[]');
      })
    : advances;

  return (
    <div className="animate-fade-in relative">
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div className="flex items-center gap-4">
          <div className="form-group" style={{ margin: 0, width: '300px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--color-text-muted)' }} />
            <input type="text" className="form-input" placeholder="Search payroll records..." style={{ paddingLeft: '2.5rem' }} />
          </div>
          <div className="form-group flex items-center gap-2" style={{ margin: 0 }}>
            <Calendar size={20} style={{ color: 'var(--color-primary)' }} />
            <input 
              type="month" 
              value={processMonth} 
              onChange={e => {
                setProcessMonth(e.target.value);
                setPaymentForm(prev => ({...prev, month: e.target.value}));
              }} 
              className="form-input" 
            />
          </div>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-primary" onClick={() => {
            setEditingAdvanceId(null);
            setAdvanceForm({ employeeId: '', date: moment().format('YYYY-MM-DD'), amount: '', description: '' });
            setShowAdvanceModal(true);
          }}>
            <Plus size={18} />
            <span>Give Advance</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('summary')}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
            fontWeight: activeTab === 'summary' ? '600' : '400',
            color: activeTab === 'summary' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            borderBottom: activeTab === 'summary' ? '2px solid var(--color-primary)' : '2px solid transparent'
          }}
        >
          Payroll Summary
        </button>
        <button 
          onClick={() => setActiveTab('advances')}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', 
            fontWeight: activeTab === 'advances' ? '600' : '400',
            color: activeTab === 'advances' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            borderBottom: activeTab === 'advances' ? '2px solid var(--color-primary)' : '2px solid transparent'
          }}
        >
          Advances History
        </button>
      </div>

      {activeTab === 'summary' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
          <h3>Payroll Summary for {moment(processMonth, 'YYYY-MM').format('MMMM YYYY')}</h3>
          <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
            Hourly calculated from {normalWorkingHours} hrs/day
          </span>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Total Hrs</th>
                <th>Calculated Salary</th>
                <th>Previous Salary</th>
                <th>Advances</th>
                <th>Paid</th>
                <th>Net Payable</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {payrollData.length > 0 ? payrollData.map(emp => (
                <tr key={emp._id}>
                  <td style={{ fontWeight: 500 }}>{emp.name}</td>
                  <td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{emp.totalHours > 0 ? `${emp.totalHours} hrs` : '-'}</td>
                  <td style={{ color: '#16a34a' }}>AED {emp.grossPay.toFixed(2)}</td>
                  <td style={{ color: emp.previousSalary < 0 ? 'var(--color-danger)' : (emp.previousSalary > 0 ? '#0284c7' : 'inherit'), fontWeight: emp.previousSalary !== 0 ? 600 : 400 }}>
                    {emp.previousSalary < 0 ? '-' : ''}AED {Math.abs(emp.previousSalary).toFixed(2)}
                  </td>
                  <td style={{ color: emp.totalAdvances > 0 ? 'var(--color-danger)' : 'inherit' }}>
                    AED {emp.totalAdvances.toFixed(2)}
                  </td>
                  <td style={{ color: emp.totalPaid > 0 ? '#0284c7' : 'inherit' }}>
                    AED {emp.totalPaid.toFixed(2)}
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '1.1rem' }}>AED {emp.netPayable.toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="flex justify-center gap-2">
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.4rem', borderColor: '#38bdf8', color: '#0284c7' }}
                        title="Daily Analytics"
                        onClick={() => openAnalyticsModal(emp)}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '0.4rem', minWidth: 'auto', background: '#2563eb' }}
                        title="Pay Salary"
                        onClick={() => openPaymentModal(emp)}
                      >
                        <HandCoins size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No active employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeTab === 'advances' && (
        <div className="card">
        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
          <h3>Advances History {appliedHistoryMonth ? `(${moment(appliedHistoryMonth, 'YYYY-MM').format('MMMM YYYY')})` : '(All Time)'}</h3>
          <div className="flex gap-2">
            <input 
              type="month" 
              className="form-input" 
              style={{ width: 'auto', padding: '0.3rem 0.6rem' }}
              value={historyFilterMonth}
              onChange={(e) => setHistoryFilterMonth(e.target.value)}
            />
            <button 
              className="btn btn-primary"
              style={{ padding: '0.4rem 1rem' }}
              onClick={() => setAppliedHistoryMonth(historyFilterMonth)}
            >
              Filter
            </button>
            {appliedHistoryMonth && (
              <button 
                className="btn btn-outline"
                style={{ padding: '0.4rem 1rem' }}
                onClick={() => { setHistoryFilterMonth(''); setAppliedHistoryMonth(''); }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee Name</th>
                <th>Amount Given</th>
                <th>Notes</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayAdvances.length > 0 ? displayAdvances.map(adv => (
                <tr key={adv._id}>
                  <td>{moment(adv.date).format('MMM D, YYYY')}</td>
                  <td style={{ fontWeight: 500 }}>{adv.employeeId?.name || 'Unknown'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-danger)' }}>AED {adv.amount.toLocaleString()}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{adv.description || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="flex justify-center gap-2">
                      <button className="btn btn-outline" style={{ padding: '0.3rem', borderColor: '#cbd5e1' }} title="Edit" onClick={() => openEditAdvanceModal(adv)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.3rem', color: 'var(--color-danger)', borderColor: '#fca5a5' }} title="Delete" onClick={() => handleDeleteAdvance(adv._id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No salary advances found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {showPaymentModal && selectedEmpInfo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2>Pay Salary - {selectedEmpInfo.name}</h2>
              <button onClick={() => setShowPaymentModal(false)} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <div className="flex justify-between mb-2">
                <span style={{ color: 'var(--color-text-muted)' }}>Gross Salary:</span>
                <span style={{ fontWeight: 600, color: '#16a34a' }}>AED {selectedEmpInfo.grossPay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span style={{ color: 'var(--color-text-muted)' }}>Previous Unpaid:</span>
                <span style={{ fontWeight: 600, color: selectedEmpInfo.previousSalary < 0 ? 'var(--color-danger)' : '#0284c7' }}>
                  {selectedEmpInfo.previousSalary < 0 ? '-' : ''}AED {Math.abs(selectedEmpInfo.previousSalary).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span style={{ color: 'var(--color-text-muted)' }}>Advances:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>-AED {selectedEmpInfo.totalAdvances.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span style={{ color: 'var(--color-text-muted)' }}>Already Paid:</span>
                <span style={{ fontWeight: 600, color: '#0284c7' }}>-AED {selectedEmpInfo.totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between" style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid #cbd5e1' }}>
                <span style={{ fontWeight: 600 }}>Net Payable:</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>AED {selectedEmpInfo.netPayable.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handlePaySalary}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Payment Date</label>
                <input 
                  required 
                  type="date" 
                  className="form-input"
                  value={paymentForm.date}
                  onChange={e => setPaymentForm({...paymentForm, date: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Amount to Pay (AED)</label>
                <input 
                  required 
                  type="number" 
                  min="1"
                  className="form-input"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                />
              </div>
              <div className="flex gap-4" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline flex-1" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdvanceModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2>{editingAdvanceId ? 'Edit Salary Advance' : 'Record Salary Advance'}</h2>
              <button onClick={() => { setShowAdvanceModal(false); setEditingAdvanceId(null); }} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleGiveAdvance}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Employee</label>
                <select 
                  required
                  className="form-input"
                  value={advanceForm.employeeId}
                  onChange={e => setAdvanceForm({...advanceForm, employeeId: e.target.value})}
                >
                  <option value="">Select an employee...</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Advance Date</label>
                <input 
                  required 
                  type="date" 
                  className="form-input"
                  value={advanceForm.date}
                  onChange={e => setAdvanceForm({...advanceForm, date: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Amount (AED)</label>
                <input 
                  required 
                  type="number" 
                  min="1"
                  className="form-input"
                  placeholder="e.g. 50"
                  value={advanceForm.amount}
                  onChange={e => setAdvanceForm({...advanceForm, amount: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Notes/Description (Optional)</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. Medical emergency"
                  value={advanceForm.description}
                  onChange={e => setAdvanceForm({...advanceForm, description: e.target.value})}
                />
              </div>
              <div className="flex gap-4">
                <button type="button" className="btn btn-outline flex-1" onClick={() => setShowAdvanceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingAdvanceId ? 'Update Advance' : 'Record Advance')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAnalyticsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '800px', padding: '2rem' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <div className="flex-col">
                <h2 style={{ marginBottom: '0.2rem' }}>Daily Earnings Analytics</h2>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  {selectedAnalyticsName} — {moment(processMonth, 'YYYY-MM').format('MMMM YYYY')}
                </span>
              </div>
              <button onClick={() => setShowAnalyticsModal(false)} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ width: '100%', height: '350px', marginTop: '2rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tickFormatter={(value) => `AED ${value}`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tickFormatter={(value) => `${value}h`} />
                  <Tooltip 
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                     labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || `Day ${label}`}
                     formatter={(value, name) => [
                       name === 'earned' ? `AED ${value}` : `${value} Hours`, 
                       name === 'earned' ? 'Salary Earned' : 'Hours Logged'
                     ]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="earned" name="earned" stroke="var(--color-primary)" strokeWidth={3} activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="hours" name="hours" stroke="#10b981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex justify-end" style={{ marginTop: '2rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowAnalyticsModal(false)}>Close View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
