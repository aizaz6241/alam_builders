import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { Plus, Search, Receipt, X, Edit, Trash2 } from 'lucide-react';
import moment from 'moment';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [workRecords, setWorkRecords] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Office');
  
  const [normalWorkingHours] = useState(Number(localStorage.getItem('normalWorkingHours')) || 8);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  
  const [expenseForm, setExpenseForm] = useState({
    type: 'Office',
    category: '',
    amount: '',
    date: moment().format('YYYY-MM-DD'),
    description: '',
    employeeId: '',
    month: moment().format('YYYY-MM'),
    vehicleId: '',
    liters: '',
    currentKm: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expRes, empRes, vehRes, workRes, advRes, payRes] = await Promise.all([
        apiClient.get('/expenses'),
        apiClient.get('/employees'),
        apiClient.get('/vehicles'),
        apiClient.get('/work-records'),
        apiClient.get('/salary-advances'),
        apiClient.get('/salary-payments')
      ]);
      setExpenses(expRes.data);
      setEmployees(empRes.data);
      setVehicles(vehRes.data);
      setWorkRecords(workRes.data);
      setAdvances(advRes.data);
      setPayments(payRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data', error);
      setLoading(false);
    }
  };

  const calculateNetPayable = (empId, processMonth) => {
    if (!empId || !processMonth) return undefined;
    const emp = employees.find(e => e._id === empId);
    if (!emp) return undefined;

    const monthStart = moment(processMonth, 'YYYY-MM').startOf('month');
    const monthEnd = moment(processMonth, 'YYYY-MM').endOf('month');

    // Current Month calculations
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

    // Previous Month calculations (Carryover)
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
    return Math.max(0, netPayable); // Never return negative capacity for expense
  };

  const handleRecordExpense = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (expenseForm.type === 'Office' && expenseForm.category === 'Payroll') {
        // Technically editing a direct Salary Payment directly from this panel is discouraged
        // BUT if it enters here, it acts as standard post. (We disable EDIT button for Payroll).
        await apiClient.post('/salary-payments', {
          employeeId: expenseForm.employeeId,
          month: expenseForm.month,
          amount: Number(expenseForm.amount),
          date: expenseForm.date,
          description: expenseForm.description
        });
      } else {
        // Log generic expense or Vehicle-specific expense
        let finalDescription = expenseForm.description;
        if (expenseForm.category === 'Diesel') {
          finalDescription = `${finalDescription} (Liters: ${expenseForm.liters})`.trim();
        }

        const payload = {
          ...expenseForm,
          description: finalDescription,
          amount: Number(expenseForm.amount)
        };

        if (!payload.vehicleId) {
          delete payload.vehicleId;
        }

        if (expenseForm.category === 'Diesel' || expenseForm.category === 'Maintenance') {
          payload.vehicleId = expenseForm.vehicleId;
        }

        if (editingExpenseId) {
          await apiClient.put(`/expenses/${editingExpenseId}`, payload);
        } else {
          await apiClient.post('/expenses', payload);
        }
      }
      
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Error saving expense', error);
      alert(error.response?.data?.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you absolutely sure you want to delete this expense record permanently?')) {
      try {
        await apiClient.delete(`/expenses/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting expense', error);
        alert(error.response?.data?.message || 'Failed to delete expense');
      }
    }
  };

  const openEditExpense = (exp) => {
    setEditingExpenseId(exp._id);
    
    let cleanDesc = exp.description || '';
    let extractedLiters = '';

    // Regex out the explicitly tracked strings if they exist to powerfully reload the form natively!
    if (exp.category === 'Diesel') {
      const literMatch = cleanDesc.match(/\(Liters: ([\d.]+)\)/);
      if (literMatch) extractedLiters = literMatch[1];
    }
    
    // Strip the structural brackets directly off the rendered string so user edits pristine description
    cleanDesc = cleanDesc.replace(/\(Liters: [\d.]+\)/g, '').replace('will be seamlessly appended to this description', '').trim();

    setExpenseForm({
      type: exp.type,
      category: exp.category,
      amount: exp.amount,
      date: moment(exp.date).format('YYYY-MM-DD'),
      description: cleanDesc,
      employeeId: '',
      month: moment().format('YYYY-MM'),
      vehicleId: exp.vehicleId ? exp.vehicleId._id : '',
      liters: extractedLiters,
      currentKm: ''
    });
    
    setShowExpenseModal(true);
  };

  const closeModal = () => {
    setShowExpenseModal(false);
    setEditingExpenseId(null);
    setExpenseForm({
      type: activeTab,
      category: '',
      amount: '',
      date: moment().format('YYYY-MM-DD'),
      description: '',
      employeeId: '',
      month: moment().format('YYYY-MM'),
      vehicleId: '',
      liters: '',
      currentKm: ''
    });
  };

  if (loading) return <div className="card">Loading expenses...</div>;

  const displayExpenses = expenses.filter(exp => exp.type === activeTab);
  
  // Sort descending by date
  displayExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Group explicitly by date string
  const groupedExpenses = displayExpenses.reduce((groups, exp) => {
    const dateStr = moment(exp.date).format('YYYY-MM-DD');
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(exp);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => new Date(b) - new Date(a));

  // Calculate the strict Net Payable limit using the global formula
  let maxSalaryLimit = undefined;
  if (expenseForm.type === 'Office' && expenseForm.category === 'Payroll' && expenseForm.employeeId && expenseForm.month) {
    const rawLimit = calculateNetPayable(expenseForm.employeeId, expenseForm.month);
    // Ceil it exactly like the payroll view does to prevent tiny decimal blockades natively
    if (rawLimit !== undefined) {
      maxSalaryLimit = Math.ceil(rawLimit);
    }
  }

  return (
    <>
      <div className="animate-fade-in relative">
        <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
          <div className="form-group" style={{ margin: 0, width: '300px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--color-text-muted)' }} />
            <input type="text" className="form-input" placeholder="Search expenses..." style={{ paddingLeft: '2.5rem' }} />
          </div>
          <button className="btn btn-primary" onClick={() => {
            setExpenseForm(prev => ({ ...prev, type: activeTab, category: '' }));
            setShowExpenseModal(true);
          }}>
            <Plus size={18} />
            <span>Record Expense</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
          <button 
            onClick={() => setActiveTab('Office')}
            style={{ 
              background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
              fontWeight: activeTab === 'Office' ? '600' : '400',
              color: activeTab === 'Office' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'Office' ? '2px solid var(--color-primary)' : '2px solid transparent'
            }}
          >
            Business Expenses
          </button>
          <button 
            onClick={() => setActiveTab('Personal')}
            style={{ 
              background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', 
              fontWeight: activeTab === 'Personal' ? '600' : '400',
              color: activeTab === 'Personal' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'Personal' ? '2px solid var(--color-primary)' : '2px solid transparent'
            }}
          >
            Personal Expenses
          </button>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>{activeTab === 'Office' ? 'Business' : 'Personal'} Expense Log</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Veh/Ref</th>
                  <th>Amount</th>
                  <th>Receipt</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedDates.length > 0 ? sortedDates.map(dateStr => (
                  <React.Fragment key={dateStr}>
                    {/* Explicit Date Header Row */}
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <td colSpan="8" style={{ fontWeight: '600', color: 'var(--color-primary)', padding: '0.8rem 1rem' }}>
                        {moment(dateStr).format('dddd, MMMM D, YYYY')}
                      </td>
                    </tr>
                    {groupedExpenses[dateStr].map(exp => (
                      <tr key={exp._id}>
                        <td style={{ paddingLeft: '1.5rem', color: 'var(--color-text-muted)' }}>{moment(exp.date).format('h:mm A')}</td>
                        <td style={{ fontWeight: 500 }}>{exp.category}</td>
                        <td>
                          <span className={`badge ${exp.type === 'Office' ? 'badge-info' : 'badge-warning'}`}>
                            {exp.type === 'Office' ? 'Business' : 'Personal'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{exp.description || '-'}</td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{exp.vehicleId ? exp.vehicleId.registrationNumber : '-'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--color-danger)' }}>AED {exp.amount.toLocaleString()}</td>
                        <td>
                          {exp.receiptImage ? (
                            <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem' }}><Receipt size={14} /> View</button>
                          ) : '-'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="flex justify-center gap-2">
                            {exp.category !== 'Payroll' && ( // Prevent direct local editing of synchronized Salary logs
                              <button className="btn btn-outline" style={{ padding: '0.3rem', borderColor: '#cbd5e1' }} title="Edit" onClick={() => openEditExpense(exp)}>
                                <Edit size={16} />
                              </button>
                            )}
                            <button className="btn btn-outline" style={{ padding: '0.3rem', color: 'var(--color-danger)', borderColor: '#fca5a5' }} title="Delete" onClick={() => handleDeleteExpense(exp._id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                )) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                      No {activeTab === 'Office' ? 'Business' : 'Personal'} expenses recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showExpenseModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem', overflowY: 'auto'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', margin: '2rem auto' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2>{editingExpenseId ? 'Edit Expense' : 'Record New Expense'}</h2>
              <button onClick={closeModal} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleRecordExpense}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Expense Type</label>
                <select 
                  required
                  className="form-input"
                  value={expenseForm.type}
                  onChange={e => setExpenseForm({...expenseForm, type: e.target.value, category: ''})}
                >
                  <option value="Office">Business</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Category</label>
                {expenseForm.type === 'Office' ? (
                  <select 
                    required
                    className="form-input"
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                  >
                    <option value="">Select a Category...</option>
                    {!editingExpenseId && <option value="Payroll">Payroll</option>}
                    <option value="Diesel">Diesel</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Rent">Rent</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <input 
                    required 
                    type="text" 
                    className="form-input"
                    placeholder="e.g. Shopping, Utilities, Medical"
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                  />
                )}
              </div>

              {/* Dynamic Render for Payroll */}
              {expenseForm.type === 'Office' && expenseForm.category === 'Payroll' && !editingExpenseId && (
                <div className="flex gap-4" style={{ marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div className="form-group flex-1" style={{ marginBottom: 0 }}>
                    <label className="form-label">Select Employee</label>
                    <select 
                      required
                      className="form-input"
                      value={expenseForm.employeeId}
                      onChange={e => setExpenseForm({...expenseForm, employeeId: e.target.value})}
                    >
                      <option value="">Choose Employee...</option>
                      {employees.filter(e => e.status === 'Active').map(emp => (
                        <option key={emp._id} value={emp._id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group flex-1" style={{ marginBottom: 0 }}>
                    <label className="form-label">Salary Month</label>
                    <input 
                      required
                      type="month" 
                      className="form-input"
                      value={expenseForm.month}
                      onChange={e => setExpenseForm({...expenseForm, month: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Render for Diesel */}
              {expenseForm.type === 'Office' && expenseForm.category === 'Diesel' && (
                <div className="flex gap-4" style={{ marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div className="form-group flex-1" style={{ marginBottom: 0 }}>
                    <label className="form-label">Select Vehicle</label>
                    <select 
                      required
                      className="form-input"
                      value={expenseForm.vehicleId}
                      onChange={e => setExpenseForm({...expenseForm, vehicleId: e.target.value})}
                    >
                      <option value="">Vehicle...</option>
                      {vehicles.map(veh => (
                        <option key={veh._id} value={veh._id}>{veh.registrationNumber} ({veh.type})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group flex-1" style={{ marginBottom: 0 }}>
                    <label className="form-label">Liters</label>
                    <input 
                      required
                      type="number" 
                      min="1"
                      className="form-input"
                      placeholder="e.g. 50"
                      value={expenseForm.liters}
                      onChange={e => setExpenseForm({...expenseForm, liters: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Render for Maintenance */}
              {expenseForm.type === 'Office' && expenseForm.category === 'Maintenance' && (
                <div className="flex gap-4" style={{ marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div className="form-group flex-1" style={{ marginBottom: 0 }}>
                    <label className="form-label">Select Vehicle</label>
                    <select 
                      required
                      className="form-input"
                      value={expenseForm.vehicleId}
                      onChange={e => setExpenseForm({...expenseForm, vehicleId: e.target.value})}
                    >
                      <option value="">Choose Vehicle...</option>
                      {vehicles.map(veh => (
                        <option key={veh._id} value={veh._id}>{veh.registrationNumber} ({veh.type})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Date</label>
                <input 
                  required 
                  type="date" 
                  className="form-input"
                  value={expenseForm.date}
                  onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">
                  Amount (AED)
                  {maxSalaryLimit !== undefined && !editingExpenseId && (
                    <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                      (Net Payable Max: AED {maxSalaryLimit.toLocaleString()})
                    </span>
                  )}
                </label>
                <input 
                  required 
                  type="number" 
                  min="1"
                  max={(!editingExpenseId && maxSalaryLimit !== undefined) ? maxSalaryLimit : undefined}
                  className="form-input"
                  placeholder="e.g. 1500"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">
                  Description / Notes
                  {expenseForm.category === 'Diesel' && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                      (Liters will be seamlessly appended to this description)
                    </span>
                  )}
                </label>
                <input 
                  required
                  type="text" 
                  className="form-input"
                  placeholder="Brief description of the expense"
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                />
              </div>
              <div className="flex gap-4">
                <button type="button" className="btn btn-outline flex-1" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={submitting || (!editingExpenseId && maxSalaryLimit !== undefined && maxSalaryLimit <= 0)}>
                  {submitting ? 'Processing...' : (editingExpenseId ? 'Update Expense' : 'Record Request')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
