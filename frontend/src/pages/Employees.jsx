import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { Plus, Search, Edit2, X, Trash2 } from 'lucide-react';
import moment from 'moment';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
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

      {/* Employee Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
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
        </div>
      )}
    </div>
  );
}
