import React from 'react';
import { FileText, Download } from 'lucide-react';

export default function Reports() {
  const reports = [
    { name: 'Monthly Expense Report', desc: 'Detailed breakdown of all personal and office expenses.' },
    { name: 'Employee Payroll Report', desc: 'Summary of salaries, advances, and remaining pay.' },
    { name: 'Project Productivity Report', desc: 'Work records mapping to specific active projects.' },
    { name: 'Vehicle Usage & Maintenance', desc: 'Expenses tied to the vehicle fleet.' }
  ];

  return (
    <div className="animate-fade-in">
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Business Reports & Analytics</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>Download comprehensive data sheets for your business operations.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {reports.map((report, idx) => (
          <div key={idx} className="card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="logo-icon" style={{ background: '#f8fafc', color: 'var(--color-primary)', width: '50px', height: '50px', boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                <FileText size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>{report.name}</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{report.desc}</p>
              </div>
            </div>
            <button className="btn btn-outline" style={{ border: 'none', background: '#f1f5f9', color: 'var(--color-info)' }}>
              <Download size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
