import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { TrendingUp, Users, FolderKanban, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    recentExpenses: [],
    totalExpensesThisMonth: 0,
    activeEmployees: 0,
    activeProjects: 0
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await apiClient.get('/dashboard');
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats', error);
      }
    };
    fetchDashboard();
  }, []);

  const chartData = [
    { name: 'Week 1', expenses: stats.totalExpensesThisMonth * 0.2 },
    { name: 'Week 2', expenses: stats.totalExpensesThisMonth * 0.3 },
    { name: 'Week 3', expenses: stats.totalExpensesThisMonth * 0.15 },
    { name: 'Week 4', expenses: stats.totalExpensesThisMonth * 0.35 },
  ];

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-4 gap-6" style={{ marginBottom: '2rem' }}>
        <div className="card flex items-center gap-4">
          <div className="logo-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
            <DollarSign />
          </div>
          <div>
            <p className="form-label">This Month Expenses</p>
            <h3>AED {stats.totalExpensesThisMonth.toLocaleString()}</h3>
          </div>
        </div>
        
        <div className="card flex items-center gap-4">
          <div className="logo-icon" style={{ background: '#d1fae5', color: '#047857' }}>
            <Users />
          </div>
          <div>
            <p className="form-label">Active Employees</p>
            <h3>{stats.activeEmployees}</h3>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="logo-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
            <FolderKanban />
          </div>
          <div>
            <p className="form-label">Active Projects</p>
            <h3>{stats.activeProjects}</h3>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="logo-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}>
            <TrendingUp />
          </div>
          <div>
            <p className="form-label">Productivity Rating</p>
            <h3>94%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Expense Trend</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="expenses" fill="var(--color-primary)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Recent Expenses</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentExpenses.map(expense => (
                  <tr key={expense._id}>
                    <td>
                      <span className={`badge ${expense.type === 'Office' ? 'badge-info' : 'badge-warning'}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600' }}>AED {expense.amount}</td>
                    <td>{new Date(expense.date).toLocaleDateString()}</td>
                  </tr>
                ))}
                {stats.recentExpenses.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center' }}>No recent expenses</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
