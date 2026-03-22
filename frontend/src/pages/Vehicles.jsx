import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { Plus, Search, Car, PenTool, Trash2, X } from 'lucide-react';
import moment from 'moment';
import AddVehicleModal from '../components/AddVehicleModal';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyVehicle, setHistoryVehicle] = useState(null);
  const [vehicleHistory, setVehicleHistory] = useState([]);

  const fetchVehicles = async () => {
    try {
      const { data } = await apiClient.get('/vehicles');
      setVehicles(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching vehicles', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSuccess = () => {
    setShowAddModal(false);
    setEditingVehicle(null);
    fetchVehicles();
  };

  const handleDeleteVehicle = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this vehicle?')) {
      try {
        await apiClient.delete(`/vehicles/${id}`);
        fetchVehicles();
      } catch (error) {
        console.error('Error deleting vehicle', error);
        alert(error.response?.data?.message || 'Failed to delete vehicle');
      }
    }
  };

  const handleOpenHistory = async (vehicle) => {
    try {
      setHistoryVehicle(vehicle);
      const { data } = await apiClient.get('/expenses');
      setVehicleHistory(data.filter(exp => exp.vehicleId && exp.vehicleId._id === vehicle._id));
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error fetching vehicle history', error);
      alert('Failed to load vehicle history');
    }
  };

  if (loading) return <div className="card">Loading vehicles fleet...</div>;

  return (
    <>
      <div className="animate-fade-in relative">
        <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
          <div className="form-group" style={{ margin: 0, width: '300px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--color-text-muted)' }} />
            <input type="text" className="form-input" placeholder="Search vehicles..." style={{ paddingLeft: '2.5rem' }} />
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            <span>Add Vehicle</span>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {vehicles.map(vehicle => (
            <div key={vehicle._id} className="card flex-col items-center gap-4" style={{ textAlign: 'center', position: 'relative' }}>
              <span className={`badge ${vehicle.usageType === 'Personal' ? 'badge-warning' : 'badge-info'}`} style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.7rem' }}>
                {vehicle.usageType || 'Business'}
              </span>
              
              <div className="logo-icon" style={{ background: '#f8fafc', color: 'var(--color-secondary)', width: '60px', height: '60px', fontSize: '1.5rem', boxShadow: 'none', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
                <Car size={30} />
              </div>
              
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{vehicle.registrationNumber}</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{vehicle.makeModel} ({vehicle.type})</p>
              </div>
              
              <div style={{ width: '100%', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                <strong>Malkiya Expiry:</strong><br/>
                {vehicle.malkiyaExpiry ? (
                  <span style={{ color: moment(vehicle.malkiyaExpiry).isBefore(moment()) ? 'var(--color-danger)' : 'inherit', fontWeight: 500 }}>
                    {moment(vehicle.malkiyaExpiry).format('MMM D, YYYY')}
                  </span>
                ) : 'Not Provided'}
              </div>

              <span className={`badge ${
                vehicle.status === 'Active' ? 'badge-success' : 
                vehicle.status === 'Under Maintenance' ? 'badge-warning' : 'badge-danger'
              }`}>
                {vehicle.status}
              </span>
              
              <div className="flex gap-2" style={{ width: '100%', marginTop: '0.5rem' }}>
                <button className="btn btn-outline flex-1" style={{ fontSize: '0.85rem' }} onClick={() => handleOpenHistory(vehicle)}>History</button>
                <button className="btn btn-outline flex-1" style={{ fontSize: '0.85rem' }} onClick={() => { setEditingVehicle(vehicle); setShowAddModal(true); }}>
                  <PenTool size={14} /> Edit
                </button>
                <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--color-danger)', borderColor: '#fca5a5' }} onClick={() => handleDeleteVehicle(vehicle._id)} title="Delete Vehicle">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          
          {vehicles.length === 0 && (
            <div className="card" style={{ gridColumn: 'span 4', textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>No vehicles in the fleet.</p>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>Register First Vehicle</button>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddVehicleModal 
          vehicle={editingVehicle}
          onClose={() => { setShowAddModal(false); setEditingVehicle(null); }} 
          onSuccess={handleSuccess} 
        />
      )}

      {showHistoryModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2>Expense History - {historyVehicle?.registrationNumber}</h2>
              <button onClick={() => setShowHistoryModal(false)} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            
            {vehicleHistory.length > 0 ? (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicleHistory.map(exp => (
                      <tr key={exp._id}>
                        <td>{moment(exp.date).format('MMM D, YYYY')}</td>
                        <td style={{ fontWeight: 500 }}>{exp.category}</td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{exp.description}</td>
                        <td style={{ fontWeight: 600, color: 'var(--color-danger)' }}>AED {exp.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                  No expenses recorded directly for this vehicle.
                </div>
            )}
            
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button className="btn btn-outline" onClick={() => setShowHistoryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
