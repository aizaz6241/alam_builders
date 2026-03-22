import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { Plus, Search, MapPin } from 'lucide-react';
import moment from 'moment';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await apiClient.get('/projects');
      setProjects(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="card">Loading projects...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div className="form-group" style={{ margin: 0, width: '300px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--color-text-muted)' }} />
          <input type="text" className="form-input" placeholder="Search projects..." style={{ paddingLeft: '2.5rem' }} />
        </div>
        <button className="btn btn-primary">
          <Plus size={18} />
          <span>New Project</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {projects.map(proj => (
          <div key={proj._id} className="card flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 style={{ fontSize: '1.1rem' }}>{proj.name}</h3>
              <span className={`badge ${
                proj.status === 'Completed' ? 'badge-success' : 
                proj.status === 'In Progress' ? 'badge-info' : 
                proj.status === 'On Hold' ? 'badge-danger' : 'badge-warning'
              }`}>
                {proj.status}
              </span>
            </div>
            
            <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              <MapPin size={16} />
              <span>{proj.location}</span>
            </div>
            
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Client</span>
                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{proj.clientCompany}</span>
              </div>
              <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Start Date</span>
                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{moment(proj.startDate).format('MMM D, YYYY')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Expected Finish</span>
                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{proj.expectedCompletionDate ? moment(proj.expectedCompletionDate).format('MMM D, YYYY') : 'TBD'}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center" style={{ marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <button className="btn btn-outline" style={{ width: '100%' }}>View Work Records</button>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="card" style={{ gridColumn: 'span 2', textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>No projects available.</p>
            <button className="btn btn-primary">Create Your First Project</button>
          </div>
        )}
      </div>
    </div>
  );
}
