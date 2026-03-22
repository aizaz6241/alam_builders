import React, { useState } from 'react';
import { apiClient } from '../services/api';
import { X } from 'lucide-react';
import moment from 'moment';

export default function AddVehicleModal({ onClose, onSuccess, vehicle }) {
  const [submitting, setSubmitting] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    registrationNumber: vehicle?.registrationNumber || '',
    type: vehicle?.type || 'Truck', // Default
    makeModel: vehicle?.makeModel || '',
    malkiyaExpiry: vehicle?.malkiyaExpiry ? moment(vehicle.malkiyaExpiry).format('YYYY-MM-DD') : '',
    usageType: vehicle?.usageType || 'Business', // Default to Business
    status: vehicle?.status || 'Active'
  });

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (vehicle) {
        await apiClient.put(`/vehicles/${vehicle._id}`, vehicleForm);
      } else {
        await apiClient.post('/vehicles', vehicleForm);
      }
      onSuccess();
    } catch (error) {
      console.error('Error recording vehicle', error);
      alert(error.response?.data?.message || 'Failed to record vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem', overflowY: 'auto'
    }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', margin: '2rem auto', position: 'relative' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
          <h2>{vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
          <button onClick={onClose} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleAddVehicle}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Vehicle Registration Number</label>
            <input 
              required 
              type="text" 
              className="form-input"
              placeholder="e.g. D-12345"
              value={vehicleForm.registrationNumber}
              onChange={e => setVehicleForm({...vehicleForm, registrationNumber: e.target.value})}
            />
          </div>
          
          <div className="flex gap-4" style={{ marginBottom: '1rem' }}>
            <div className="form-group flex-1" style={{ marginBottom: 0 }}>
              <label className="form-label">Vehicle Type</label>
              <select 
                required
                className="form-input"
                value={vehicleForm.type}
                onChange={e => setVehicleForm({...vehicleForm, type: e.target.value})}
              >
                <option value="Truck">Truck</option>
                <option value="Car">Car</option>
                <option value="Crane">Crane</option>
                <option value="Excavator">Excavator</option>
                <option value="Pickup">Pickup</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group flex-1" style={{ marginBottom: 0 }}>
              <label className="form-label">Usage Category</label>
              <select 
                required
                className="form-input"
                value={vehicleForm.usageType}
                onChange={e => setVehicleForm({...vehicleForm, usageType: e.target.value})}
              >
                <option value="Business">Business</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Make & Model</label>
            <input 
              required
              type="text" 
              className="form-input"
              placeholder="e.g. Toyota Hilux 2024"
              value={vehicleForm.makeModel}
              onChange={e => setVehicleForm({...vehicleForm, makeModel: e.target.value})}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Malkiya Expiry Date</label>
            <input 
              required
              type="date" 
              className="form-input"
              value={vehicleForm.malkiyaExpiry}
              onChange={e => setVehicleForm({...vehicleForm, malkiyaExpiry: e.target.value})}
            />
          </div>

          <div className="flex gap-4">
            <button type="button" className="btn btn-outline flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
              {submitting ? 'Saving...' : (vehicle ? 'Update Vehicle' : 'Register Vehicle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
