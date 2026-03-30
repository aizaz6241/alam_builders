import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiClient } from '../services/api';
import { Plus, Search, Edit2, X, Trash2, Eye } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import moment from 'moment';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfileEmp, setSelectedProfileEmp] = useState(null);
  const [profileTab, setProfileTab] = useState('info');
  const [empData, setEmpData] = useState({ payments: [], advances: [], attendance: [] });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileStartDate, setProfileStartDate] = useState(moment().startOf('year').format('YYYY-MM-DD'));
  const [profileEndDate, setProfileEndDate] = useState(moment().endOf('year').format('YYYY-MM-DD'));
  const [normalWorkingHours] = useState(Number(localStorage.getItem('normalWorkingHours')) || 8);

  const openProfileModal = async (emp) => {
    setSelectedProfileEmp(emp);
    setProfileTab('info');
    setShowProfileModal(true);
    setLoadingProfile(true);

    try {
      const [payRes, advRes, attRes] = await Promise.all([
        apiClient.get('/salary-payments'),
        apiClient.get('/salary-advances'),
        apiClient.get('/work-records')
      ]);
      setEmpData({
        payments: payRes.data.filter(p => (p.employeeId?._id || p.employeeId) === emp._id),
        advances: advRes.data.filter(a => (a.employeeId?._id || a.employeeId) === emp._id),
        attendance: attRes.data.filter(w => (w.employeeId?._id || w.employeeId) === emp._id)
      });
    } catch (error) {
      console.error('Error fetching employee profile data', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const getSalaryChartData = () => {
    const grouped = {};
    const filtered = empData.attendance.filter(w => moment(w.date).isBetween(profileStartDate, profileEndDate, 'day', '[]'));
    const hourlyRate = selectedProfileEmp?.salary ? (selectedProfileEmp.salary / 30 / normalWorkingHours) : 0;
    
    filtered.forEach(w => {
       const d = moment(w.date).format('YYYY-MM-DD');
       if(!grouped[d]) grouped[d] = 0;
       grouped[d] += (w.amountCompleted || 0) * hourlyRate;
    });
    return Object.keys(grouped).sort().map(d => ({ date: moment(d).format('DD MMM'), fullDate: moment(d).format('MMM D, YYYY'), amount: Number(grouped[d].toFixed(2)) }));
  };

  const getAttendanceChartData = () => {
    const grouped = {};
    const filtered = empData.attendance.filter(w => moment(w.date).isBetween(profileStartDate, profileEndDate, 'day', '[]'));
    filtered.forEach(w => {
        const d = moment(w.date).format('YYYY-MM-DD');
        if(!grouped[d]) grouped[d] = 0;
        grouped[d] += (w.amountCompleted || 0);
    });
    return Object.keys(grouped).sort().map(d => ({ date: moment(d).format('DD MMM'), fullDate: moment(d).format('MMM D, YYYY'), hours: grouped[d] }));
  };

  const getAdvancesChartData = () => {
    const grouped = {};
    const filtered = empData.advances.filter(a => moment(a.date).isBetween(profileStartDate, profileEndDate, 'day', '[]'));
    filtered.forEach(a => {
        const d = moment(a.date).format('YYYY-MM-DD');
        if(!grouped[d]) grouped[d] = 0;
        grouped[d] += a.amount;
    });
    return Object.keys(grouped).sort().map(d => ({ date: moment(d).format('DD MMM'), fullDate: moment(d).format('MMM D, YYYY'), amount: grouped[d] }));
  };
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    jobRole: '',
    salary: '',
    joiningDate: moment().format('YYYY-MM-DD'),
    status: 'Active'
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data } = await apiClient.get('/employees');
      setEmployees(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '', phone: '', jobRole: '', salary: '', 
      joiningDate: moment().format('YYYY-MM-DD'), status: 'Active'
    });
    setShowModal(true);
  };

  const openEditModal = (emp) => {
    setEditingId(emp._id);
    setFormData({
      name: emp.name,
      phone: emp.phone,
      jobRole: emp.jobRole,
      salary: emp.salary,
      joiningDate: moment(emp.joiningDate).format('YYYY-MM-DD'),
      status: emp.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if(window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await apiClient.delete(`/employees/${id}`);
        fetchEmployees();
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Failed to delete employee.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData, salary: Number(formData.salary) };
      
      if (editingId) {
        await apiClient.put(`/employees/${editingId}`, payload);
      } else {
        await apiClient.post('/employees', payload);
      }
      
      setShowModal(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Failed to save employee. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="card">Loading employees...</div>;

  return (
    <div className="animate-fade-in relative">
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div className="form-group" style={{ margin: 0, width: '300px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--color-text-muted)' }} />
          <input type="text" className="form-input" placeholder="Search employees..." style={{ paddingLeft: '2.5rem' }} />
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>Add Employee</span>
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>Employee Directory</h3>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Salary/Month</th>
                <th>Join Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp._id}>
                  <td style={{ fontWeight: 500 }}>{emp.name}</td>
                  <td>{emp.jobRole}</td>
                  <td>{emp.phone}</td>
                  <td style={{ fontWeight: 600 }}>AED {emp.salary.toLocaleString()}</td>
                  <td>{moment(emp.joiningDate).format('MMM D, YYYY')}</td>
                  <td>
                    <span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', color: '#0284c7', borderColor: '#38bdf8' }} onClick={() => openProfileModal(emp)}>
                        <Eye size={14} /> View
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem' }} onClick={() => openEditModal(emp)}>
                        <Edit2 size={14} /> Edit
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', color: 'var(--color-danger)', borderColor: '#fca5a5' }} onClick={() => handleDelete(emp._id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No employees found. Add your first employee to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Profile Modal */}
      {showProfileModal && selectedProfileEmp && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card animate-fade-in" style={{ width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2>{selectedProfileEmp.name}'s Profile</h2>
              <button onClick={() => setShowProfileModal(false)} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {['info', 'salary', 'attendance', 'advances'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setProfileTab(tab)}
                  style={{ 
                    background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
                    fontWeight: profileTab === tab ? '600' : '400',
                    color: profileTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: profileTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                    textTransform: 'capitalize'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {(profileTab !== 'info') && (
              <div className="flex justify-end gap-2 items-center" style={{ marginBottom: '1rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Select Range:</span>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ width: 'auto', padding: '0.3rem 0.6rem' }}
                  value={profileStartDate}
                  onChange={(e) => setProfileStartDate(e.target.value)}
                />
                <span style={{ color: 'var(--color-text-muted)' }}>to</span>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ width: 'auto', padding: '0.3rem 0.6rem' }}
                  value={profileEndDate}
                  onChange={(e) => setProfileEndDate(e.target.value)}
                />
              </div>
            )}

            {loadingProfile ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading profile data...</div>
            ) : (
              <div>
                {profileTab === 'info' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="card" style={{ background: '#f8fafc', padding: '1.5rem' }}>
                      <h4 style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Basic Details</h4>
                      <p style={{ marginBottom: '0.5rem' }}><strong>Name:</strong> {selectedProfileEmp.name}</p>
                      <p style={{ marginBottom: '0.5rem' }}><strong>Role:</strong> {selectedProfileEmp.jobRole}</p>
                      <p style={{ marginBottom: '0.5rem' }}><strong>Phone:</strong> {selectedProfileEmp.phone}</p>
                      <p><strong>Status:</strong> {selectedProfileEmp.status}</p>
                    </div>
                    <div className="card" style={{ background: '#f8fafc', padding: '1.5rem' }}>
                      <h4 style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Employment</h4>
                      <p style={{ marginBottom: '0.5rem' }}><strong>Salary:</strong> AED {selectedProfileEmp.salary.toLocaleString()}/month</p>
                      <p><strong>Joined:</strong> {moment(selectedProfileEmp.joiningDate).format('MMMM D, YYYY')}</p>
                    </div>
                  </div>
                )}

                {profileTab === 'salary' && (
                  <div>
                    <div style={{ height: '300px', marginBottom: '2rem' }}>
                      <h4 style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Daily Salary Earned</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getSalaryChartData()} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                          <XAxis dataKey="date" tick={{ fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                          <YAxis tick={{ fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tickFormatter={(val) => `AED ${val}`} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                            formatter={(val) => [`AED ${val}`, 'Earned']} 
                            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                          />
                          <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <h4>Daily Earned Salary History</h4>
                    <table className="data-table" style={{ marginTop: '1rem' }}>
                      <thead><tr><th>Date</th><th>Hours Logged</th><th>Calculated Salary (AED)</th></tr></thead>
                      <tbody>
                        {empData.attendance.filter(w => moment(w.date).isBetween(profileStartDate, profileEndDate, 'day', '[]')).sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 30).map((w, i) => {
                          const hourlyRate = selectedProfileEmp?.salary ? (selectedProfileEmp.salary / 30 / normalWorkingHours) : 0;
                          const earned = (w.amountCompleted || 0) * hourlyRate;
                          return (
                            <tr key={i}>
                              <td>{moment(w.date).format('dddd, MMM D, YYYY')}</td>
                              <td>{w.amountCompleted} hrs</td>
                              <td style={{ color: '#16a34a', fontWeight: 600 }}>AED {earned.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                        {empData.attendance.filter(w => moment(w.date).isBetween(profileStartDate, profileEndDate, 'day', '[]')).length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1rem' }}>No salary or attendance records found in this range.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}

                {profileTab === 'attendance' && (
                  <div>
                    <div style={{ height: '300px', marginBottom: '2rem' }}>
                      <h4 style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Daily Attendance (Hours)</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getAttendanceChartData()} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                          <XAxis dataKey="date" tick={{ fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                          <YAxis tick={{ fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tickFormatter={(val) => `${val}h`} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                            formatter={(val) => [`${val} hrs`, 'Logged']} 
                            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                          />
                          <Line type="monotone" dataKey="hours" stroke="#10b981" strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <h4>Attendance Logs</h4>
                    <table className="data-table" style={{ marginTop: '1rem' }}>
                      <thead><tr><th>Date</th><th>Total Hours</th><th>Normal</th><th>Overtime</th></tr></thead>
                      <tbody>
                        {empData.attendance.filter(a => moment(a.date).isBetween(profileStartDate, profileEndDate, 'day', '[]')).sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 30).map((a, i) => (
                          <tr key={i}>
                            <td>{moment(a.date).format('dddd, MMM D, YYYY')}</td>
                            <td style={{ color: '#10b981', fontWeight: 600 }}>{a.amountCompleted} hrs</td>
                            <td>{a.normalHours || 0} hrs</td>
                            <td style={{ color: a.overtimeHours > 0 ? 'var(--color-danger)' : 'inherit' }}>{a.overtimeHours || 0} hrs</td>
                          </tr>
                        ))}
                        {empData.attendance.filter(a => moment(a.date).isBetween(profileStartDate, profileEndDate, 'day', '[]')).length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>No attendance records found in this range.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}

                {profileTab === 'advances' && (
                  <div>
                    <div style={{ height: '300px', marginBottom: '2rem' }}>
                      <h4 style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Daily Advances Given</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getAdvancesChartData()} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                          <XAxis dataKey="date" tick={{ fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                          <YAxis tick={{ fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tickFormatter={(val) => `AED ${val}`} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                            formatter={(val) => [`AED ${val}`, 'Advance']} 
                            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                          />
                          <Line type="monotone" dataKey="amount" stroke="#f43f5e" strokeWidth={3} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <h4>Advance History</h4>
                    <table className="data-table" style={{ marginTop: '1rem' }}>
                      <thead><tr><th>Date</th><th>Amount</th><th>Notes</th></tr></thead>
                      <tbody>
                        {empData.advances.filter(a => moment(a.date).isBetween(profileStartDate, profileEndDate, 'day', '[]')).map((adv, i) => (
                          <tr key={i}>
                            <td>{moment(adv.date).format('MMM D, YYYY')}</td>
                            <td style={{ color: 'var(--color-danger)', fontWeight: 600 }}>AED {adv.amount.toLocaleString()}</td>
                            <td>{adv.description || '-'}</td>
                          </tr>
                        ))}
                        {empData.advances.filter(a => moment(a.date).isBetween(profileStartDate, profileEndDate, 'day', '[]')).length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1rem' }}>No advances found in this range.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Employee Modal */}
      {showModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2>{editingId ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button 
                onClick={() => setShowModal(false)} 
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="form-input" placeholder="e.g. John Doe" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input required type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" placeholder="+1 234 567 890" />
                </div>
                <div className="form-group">
                  <label className="form-label">Job Role</label>
                  <input required type="text" name="jobRole" value={formData.jobRole} onChange={handleInputChange} className="form-input" placeholder="e.g. Site Supervisor" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Monthly Salary (AED)</label>
                  <input required type="number" min="0" name="salary" value={formData.salary} onChange={handleInputChange} className="form-input" placeholder="e.g. 3500" />
                </div>
                <div className="form-group">
                  <label className="form-label">Joining Date</label>
                  <input required type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} className="form-input" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="form-input">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              
              <div className="flex gap-4" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline flex-1" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingId ? 'Update Employee' : 'Save Employee')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
