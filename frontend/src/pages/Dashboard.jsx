import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { TrendingUp, Users, FolderKanban, DollarSign, Activity, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import moment from 'moment';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
const VEHICLE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];
const TYPE_COLORS = ['#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('this_month');
  const [stats, setStats] = useState({
    recentExpensesList: [], totalExpensesPeriod: 0, activeEmployees: 0, activeProjects: 0,
    expenseTrend: [{ name: 'Week 1', expenses: 0, income: 0 }], expenseByCategory: [], expenseByType: [],
    totalCash: 0, totalCreditOwed: 0, activeBanks: [], activeToday: 0, recentWorkRecords: [],
    projectsByStatus: [], topProjects: [], upcomingDeadlines: [], vehicleStatus: [],
    payrollDistribution: [], moduleUsage: [], recentHires: [], recentTransactionsList: [], recentActivity: []
  });

  useEffect(() => { fetchDashboard(); }, [timeRange]);

  const fetchDashboard = async () => {
    try {
      const { data } = await apiClient.get(`/dashboard?timeRange=${timeRange}`);
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats', error);
    }
  };

  const isAdmin = ['Super Admin'].includes(user.role);
  const isFinancial = ['Super Admin', 'Accountant'].includes(user.role);
  const isProjectOps = ['Super Admin', 'Project Manager'].includes(user.role);
  const isHROps = ['Super Admin', 'HR'].includes(user.role);

  return (
    <div className="animate-fade-in relative" style={{ paddingBottom: '3rem' }}>
      
      {/* Header and Filter */}
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Global Executive Dashboard</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Real-time analytical overview spanning all core operational modules.</p>
        </div>
        
        {isFinancial && (
          <select 
            className="form-input" 
            style={{ width: '200px', fontWeight: 600, color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="this_year">This Year</option>
            <option value="all_time">All Time Tracker</option>
          </select>
        )}
      </div>

      {/* ROW 1: Top Line KPIs */}
      <div className="grid grid-cols-4 gap-6" style={{ marginBottom: '2rem' }}>
        {isFinancial && (
          <div className="card flex items-center gap-4">
            <div className="logo-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
              <DollarSign />
            </div>
            <div>
              <p className="form-label mb-1">Period Spendings</p>
              <h3>AED {stats.totalExpensesPeriod.toLocaleString()}</h3>
            </div>
          </div>
        )}
        
        {isHROps && (
          <div className="card flex items-center gap-4">
            <div className="logo-icon" style={{ background: '#d1fae5', color: '#047857' }}>
              <Users />
            </div>
            <div>
              <p className="form-label mb-1">Active Employees</p>
              <h3>{stats.activeEmployees}</h3>
            </div>
          </div>
        )}

        {isProjectOps && (
          <div className="card flex items-center gap-4">
            <div className="logo-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
              <FolderKanban />
            </div>
            <div>
              <p className="form-label mb-1">Active Projects</p>
              <h3>{stats.activeProjects}</h3>
            </div>
          </div>
        )}

        <div className="card flex items-center gap-4">
          <div className="logo-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}>
            <TrendingUp />
          </div>
          <div>
            <p className="form-label mb-1">System Status</p>
            <h3>Online (Secured)</h3>
          </div>
        </div>
      </div>

      {/* ROW 2: Primary Financial Trends */}
      {isFinancial && (
        <div className="grid grid-cols-3 gap-6" style={{ marginBottom: '2rem' }}>
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="flex justify-between">
              <h3 style={{ marginBottom: '1.5rem' }}>Cash Flow Matrix (Deposits vs Expenses)</h3>
            </div>
            <div style={{ height: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.expenseTrend}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => `AED ${value.toLocaleString()}`} />
                  <Legend />
                  <Area type="monotone" dataKey="income" name="Operating Income (Deposits)" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expenses" name="Expenditures" stroke="#f59e0b" fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card flex-col justify-between">
            <h3 style={{ marginBottom: '1.5rem' }}>Absolute Global Treasury</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Real-time standalone snapshot of active Accounts (Independent of timeframe).
            </p>
            <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
              <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Liquid Cash</p>
              <h2 style={{ color: '#0f172a', marginTop: '0.25rem' }}>AED {stats.totalCash.toLocaleString()}</h2>
            </div>
            <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #ef4444' }}>
              <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding Credit Debt</p>
              <h2 style={{ color: '#0f172a', marginTop: '0.25rem' }}>AED {stats.totalCreditOwed.toLocaleString()}</h2>
            </div>
          </div>
        </div>
      )}

      {/* ROW 3: Project Logistics & Labor */}
      <div className="grid grid-cols-3 gap-6" style={{ marginBottom: '2rem' }}>
        {isProjectOps && (
          <div className="card" style={{ gridColumn: isHROps ? 'span 2' : 'span 3' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Top 5 Active Projects By Budget Capacity</h3>
            <div style={{ height: '300px' }}>
              {stats.topProjects.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topProjects} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => `AED ${value.toLocaleString()}`} />
                    <Bar dataKey="budget" name="Approved Budget" fill="var(--color-primary)" radius={[0,4,4,0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', paddingTop: '4rem', color: '#94a3b8' }}>No active projects found.</div>
              )}
            </div>
          </div>
        )}

        {isHROps && (
          <div className="card" style={{ gridColumn: isProjectOps ? 'span 1' : 'span 3' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Daily Labor Pulse (24H)</h3>
            <div className="flex gap-4 items-center" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>{stats.activeToday}</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>active personnel checks logged today against {stats.activeEmployees} employed base.</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {stats.recentWorkRecords.slice(0, 3).map(rec => (
                <div key={rec._id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9rem', color: '#0f172a' }}>{rec.employeeId?.name || 'Unknown'}</span>
                  <span className={`badge ${rec.status === 'Present' ? 'badge-success' : 'badge-danger'}`} style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem' }}>{rec.status}</span>
                </div>
              ))}
              {stats.recentWorkRecords.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', fontSize: '0.9rem' }}>No check-ins today</div>}
            </div>
          </div>
        )}
      </div>

      {/* ROW 4: Micro Financial Splitting */}
      {isFinancial && (
        <div className="grid grid-cols-3 gap-6" style={{ marginBottom: '2rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Period Payroll Distribution</h3>
            <div style={{ height: '260px' }}>
              {stats.payrollDistribution.reduce((a, b) => a + b.value, 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.payrollDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} hide/>
                    <Tooltip formatter={(value) => `AED ${value.toLocaleString()}`} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4,4,0,0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', paddingTop: '4rem', color: '#94a3b8' }}>No payroll data inside this period.</div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Expenditure Types</h3>
            <div style={{ height: '260px' }}>
              {stats.expenseByType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.expenseByType} cx="50%" cy="50%" innerRadius={0} outerRadius={85} dataKey="value">
                      {stats.expenseByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `AED ${value.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', paddingTop: '4rem', color: '#94a3b8' }}>No expenses inside this period.</div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Category Breakdowns</h3>
            <div style={{ height: '260px' }}>
              {stats.expenseByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.expenseByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                      {stats.expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `AED ${value.toLocaleString()}`} />
                    <Legend wrapperStyle={{ fontSize: '12px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', paddingTop: '4rem', color: '#94a3b8' }}>No expenses inside this period.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ROW 5: System Operational Analytics */}
      {isAdmin && (
        <div className="grid grid-cols-3 gap-6" style={{ marginBottom: '2rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Software Module Heatmap</h3>
            <div style={{ height: '300px' }}>
              {stats.moduleUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.moduleUsage} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#06b6d4" radius={[0,4,4,0]} barSize={15} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', paddingTop: '4rem' }}>No usage logged.</div>
              )}
            </div>
          </div>

          <div className="card" style={{ gridColumn: 'span 2' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Active Bank Reserves (Excluding Credit)</h3>
            <div style={{ height: '300px' }}>
              {stats.activeBanks.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.activeBanks} margin={{ top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => `AED ${value.toLocaleString()}`} />
                    <Bar dataKey="balance" fill="#10b981" radius={[4,4,0,0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
               ) : (
                 <div style={{ textAlign: 'center', color: '#94a3b8', paddingTop: '4rem' }}>No cash banks available.</div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* USER REQUESTED ROW A: Vehicle Fleet & Recent Expenses */}
      <div className="grid grid-cols-2 gap-6" style={{ marginBottom: '2rem' }}>
        {isProjectOps && (
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Vehicle Fleet Distribution</h3>
            <div style={{ height: '300px' }}>
              {stats.vehicleStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.vehicleStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                      {stats.vehicleStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={VEHICLE_COLORS[index % VEHICLE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
               ) : (
                 <div style={{ textAlign: 'center', paddingTop: '4rem', color: '#94a3b8' }}>No vehicles registered.</div>
               )}
            </div>
          </div>
        )}

        {isFinancial && (
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Recent Expenses</h3>
            <div className="data-table-container border-0 h-[300px] overflow-y-auto" style={{ border: 'none', height: '300px' }}>
              <table className="data-table">
                <tbody>
                  {stats.recentExpensesList.map(exp => (
                    <tr key={exp._id}>
                      <td><span className={`badge ${exp.type === 'Office' ? 'badge-info' : 'badge-warning'}`}>{exp.category}</span></td>
                      <td style={{ fontWeight: 600, color: '#ef4444', textAlign: 'right' }}>AED {exp.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {stats.recentExpensesList.length === 0 && <tr><td colSpan="2" style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>No records</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* USER REQUESTED ROW B: Account Transactions + Recent Hires + Deadlines */}
      <div className="grid grid-cols-3 gap-6" style={{ marginBottom: '2rem' }}>
        {isFinancial && (
          <div className="card" style={{ gridColumn: (!isHROps && !isProjectOps) ? 'span 3' : 'span 1' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Account Transactions</h3>
            <div className="data-table-container border-0" style={{ border: 'none' }}>
              <table className="data-table">
                <tbody>
                  {stats.recentTransactionsList.slice(0, 5).map(tx => (
                    <tr key={tx._id}>
                      <td>{tx.accountId?.name || 'Bank'}</td>
                      <td style={{ fontWeight: 600, color: tx.type === 'Deposit' ? '#10b981' : '#ef4444', textAlign: 'right' }}>
                        {tx.type === 'Deposit' ? '+' : '-'} {tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {stats.recentTransactionsList.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>No records</div>}
            </div>
          </div>
        )}

        {isHROps && (
          <div className="card" style={{ gridColumn: (!isFinancial && !isProjectOps) ? 'span 3' : 'span 1' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} color="#10b981"/> Recent Employee Hires
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats.recentHires.map(emp => (
                <div key={emp._id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.8rem', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: 500, color: '#0f172a' }}>{emp.name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{moment(emp.createdAt).format('MMM D')}</div>
                </div>
              ))}
              {stats.recentHires.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>No recent hires</div>}
            </div>
          </div>
        )}

        {isProjectOps && (
          <div className="card" style={{ gridColumn: (!isFinancial && !isHROps) ? 'span 3' : 'span 1' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="var(--color-primary)"/> Upcoming Deadlines
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats.upcomingDeadlines.map(proj => (
                <div key={proj._id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.8rem', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: 500, color: '#0f172a' }}>{proj.name}</div>
                  <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>{moment(proj.expectedCompletionDate).format('MMM D, YY')}</div>
                </div>
              ))}
              {stats.upcomingDeadlines.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>No pending deadlines</div>}
            </div>
          </div>
        )}
      </div>

      {/* FINAL ROW: Audit Logs */}
      {isAdmin && (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--color-primary)"/> Real-Time Global Audit Traces
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentActivity.map(act => (
              <div key={act._id} style={{ display: 'flex', gap: '0.8rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#0f172a' }}>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{act.userId?.name || 'System'}</span> {act.action.toLowerCase()} {act.module}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>{moment(act.timestamp).fromNow()}</p>
                </div>
              </div>
            ))}
            {stats.recentActivity.length === 0 && <div style={{ color: '#94a3b8', padding: '1rem' }}>No recent system traces detected.</div>}
          </div>
        </div>
      )}

    </div>
  );
}
