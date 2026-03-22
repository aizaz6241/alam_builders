import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { Plus, Search, X, Users, Settings } from 'lucide-react';
import moment from 'moment';

export default function WorkRecords() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(moment().format('YYYY-MM-DD'));
  const [hoursMap, setHoursMap] = useState({});
  
  const [normalWorkingHours, setNormalWorkingHours] = useState(Number(localStorage.getItem('normalWorkingHours')) || 8);
  const [tempSettingsHours, setTempSettingsHours] = useState(normalWorkingHours);

  const fetchRecords = async () => {
    try {
      const { data } = await apiClient.get('/work-records');
      setRecords(data.sort((a,b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error('Error fetching attendance records', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data } = await apiClient.get('/employees');
      const activeEmps = data.filter(e => e.status === 'Active');
      setEmployees(activeEmps);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchEmployees();
  }, []);

  const openAddModal = () => {
    setAttendanceDate(moment().format('YYYY-MM-DD'));
    const initialHours = {};
    employees.forEach(emp => {
      initialHours[emp._id] = '';
    });
    setHoursMap(initialHours);
    setShowAttendanceModal(true);
  };

  const openSettingsModal = () => {
    setTempSettingsHours(normalWorkingHours);
    setShowSettingsModal(true);
  };

  const saveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('normalWorkingHours', tempSettingsHours);
    setNormalWorkingHours(Number(tempSettingsHours));
    setShowSettingsModal(false);
  };

  const handleHoursChange = (empId, val) => {
    setHoursMap(prev => ({ ...prev, [empId]: val }));
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const submissions = [];
      for (const emp of employees) {
        const hours = hoursMap[emp._id];
        if (hours && Number(hours) > 0) {
          const totalHrs = Number(hours);
          let normalHrs = totalHrs;
          let overtimeHrs = 0;
          
          if (totalHrs > normalWorkingHours) {
            normalHrs = normalWorkingHours;
            overtimeHrs = totalHrs - normalWorkingHours;
          }
          
          submissions.push(
            apiClient.post('/work-records', {
              employeeId: emp._id,
              date: attendanceDate,
              amountCompleted: totalHrs,
              normalHours: normalHrs,
              overtimeHours: overtimeHrs,
              unit: 'Hours',
              description: 'Daily Attendance'
            })
          );
        }
      }
      
      if (submissions.length > 0) {
        await Promise.all(submissions);
      }
      
      setShowAttendanceModal(false);
      fetchRecords();
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Delete this attendance record?')) {
      try {
        await apiClient.delete(`/work-records/${id}`);
        fetchRecords();
      } catch (error) {
        console.error('Error deleting record', error);
      }
    }
  };

  if (loading) return <div className="card">Loading attendance records...</div>;

  const groupedRecords = {};
  records.forEach(rec => {
    const dateStr = moment(rec.date).format('YYYY-MM-DD');
    if (!groupedRecords[dateStr]) groupedRecords[dateStr] = [];
    groupedRecords[dateStr].push(rec);
  });
  const sortedDates = Object.keys(groupedRecords).sort((a,b) => new Date(b) - new Date(a));

  return (
    <div className="animate-fade-in relative">
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div className="form-group" style={{ margin: 0, width: '300px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--color-text-muted)' }} />
          <input type="text" className="form-input" placeholder="Search attendance..." style={{ paddingLeft: '2.5rem' }} />
        </div>
        <div className="flex gap-4">
          <button className="btn btn-outline" onClick={openSettingsModal}>
            <Settings size={18} />
            <span>Set Normal Hours</span>
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            <span>Add Attendance</span>
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>Attendance Log</h3>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee Name</th>
                <th>Total Hours</th>
                <th>Normal</th>
                <th>Overtime</th>
                <th>Earned</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedDates.map(dateStr => (
                <React.Fragment key={dateStr}>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <td colSpan="7" style={{ fontWeight: '600', color: 'var(--color-primary)', borderBottom: '2px solid #e2e8f0', padding: '0.8rem 1rem' }}>
                      {moment(dateStr).format('dddd, MMMM D, YYYY')}
                    </td>
                  </tr>
                  {groupedRecords[dateStr].map(rec => {
                    const hourlyRate = rec.employeeId?.salary ? (rec.employeeId.salary / 30 / normalWorkingHours) : 0;
                    const earned = hourlyRate * rec.amountCompleted;
                    return (
                      <tr key={rec._id}>
                        <td style={{ color: 'var(--color-text-muted)' }}>{moment(rec.date).format('MMM D')}</td>
                        <td style={{ fontWeight: 500 }}>{rec.employeeId?.name || 'Unknown User'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{rec.amountCompleted} hrs</td>
                        <td>{rec.normalHours !== undefined ? rec.normalHours : Math.min(rec.amountCompleted, normalWorkingHours)} hrs</td>
                        <td style={{ color: (rec.overtimeHours > 0 ? 'var(--color-danger)' : 'inherit') }}>
                          {rec.overtimeHours !== undefined ? rec.overtimeHours : (rec.amountCompleted > normalWorkingHours ? rec.amountCompleted - normalWorkingHours : 0)} hrs
                        </td>
                        <td style={{ fontWeight: 600, color: '#16a34a' }}>AED {earned.toFixed(2)}</td>
                        <td>
                          <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', color: 'var(--color-danger)', borderColor: '#fca5a5' }} onClick={() => handleDelete(rec._id)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No attendance records found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2>Set Normal Working Hours</h2>
              <button onClick={() => setShowSettingsModal(false)} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={saveSettings}>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Normal Hours (per day)</label>
                <input 
                  required 
                  type="number" 
                  min="0" max="24" 
                  value={tempSettingsHours} 
                  onChange={e => setTempSettingsHours(e.target.value)} 
                  className="form-input" 
                />
                <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Any hours logged above this limit will automatically be categorized as Overtime.
                </p>
              </div>
              <div className="flex gap-4">
                <button type="button" className="btn btn-outline flex-1" onClick={() => setShowSettingsModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1">Save Settings</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2>Add Daily Attendance</h2>
              <button onClick={() => setShowAttendanceModal(false)} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={24} />
              </button>
            </div>

            {employees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <Users size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
                <h3 style={{ marginBottom: '1rem' }}>No Active Employees</h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>You need to add employees before you can record attendance.</p>
                <button className="btn btn-primary" onClick={() => { setShowAttendanceModal(false); navigate('/employees'); }}>
                  Go to Employees
                </button>
              </div>
            ) : (
             <form onSubmit={handleBulkSubmit}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Attendance Date</label>
                  <input required type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="form-input" />
                </div>
                
                <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: 'var(--color-secondary)' }}>Log Hours Worked</h4>
                  <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem' }}>Normal rate: {normalWorkingHours} hrs/day</span>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem', maxHeight: '350px', overflowY: 'auto', marginBottom: '2rem' }}>
                  {(() => {
                    const recordsForDate = records.filter(r => moment(r.date).format('YYYY-MM-DD') === attendanceDate);
                    const recordedEmpIds = recordsForDate.map(r => r.employeeId?._id || r.employeeId);
                    const availableEmps = employees.filter(emp => !recordedEmpIds.includes(emp._id));
                    
                    if (availableEmps.length === 0) {
                      return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>All employees have attendance logged for this date.</div>;
                    }
                    
                    return availableEmps.map(emp => (
                      <div key={emp._id} className="flex justify-between items-center" style={{ padding: '0.8rem 0', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ fontWeight: 500 }}>{emp.name} <br/><small style={{ color: 'var(--color-text-muted)', fontWeight: 'normal' }}>{emp.jobRole}</small></span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            min="0"
                            max="24"
                            step="0.5"
                            placeholder="0" 
                            className="form-input" 
                            style={{ width: '80px', textAlign: 'center' }}
                            value={hoursMap[emp._id] || ''}
                            onChange={e => handleHoursChange(emp._id, e.target.value)}
                          />
                          <span style={{ color: 'var(--color-text-muted)' }}>hrs</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
                
                <div className="flex gap-4">
                  <button type="button" className="btn btn-outline flex-1" onClick={() => setShowAttendanceModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save All Attendance'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
