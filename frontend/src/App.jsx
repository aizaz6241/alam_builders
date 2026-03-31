import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Users, FolderKanban, Activity, CreditCard, Car, LayoutDashboard, Banknote, FileText, Menu, X, Landmark, LogOut, Shield, KeyRound, HardDrive } from 'lucide-react';
import './index.css';

import { apiClient } from './services/api';

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Projects from './pages/Projects';
import Expenses from './pages/Expenses';
import WorkRecords from './pages/WorkRecords';
import Vehicles from './pages/Vehicles';
import SalaryAdvance from './pages/SalaryAdvance';
import Reports from './pages/Reports';
import Accounts from './pages/Accounts';
import UsersAdmin from './pages/Users';
import ActivityLogs from './pages/ActivityLogs';
import BackupsAdmin from './pages/Backups';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  return children;
};

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  if (!user) return null;

  const navItems = [
    { path: '/', name: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'HR', 'Accountant', 'Project Manager'] },
    { path: '/expenses', name: 'Expenses', icon: CreditCard, roles: ['Super Admin', 'Accountant'] },
    { path: '/employees', name: 'Employees', icon: Users, roles: ['Super Admin', 'HR', 'Accountant'] },
    { path: '/projects', name: 'Projects', icon: FolderKanban, roles: ['Super Admin', 'Project Manager'] },
    { path: '/work-records', name: 'Attendance', icon: Activity, roles: ['Super Admin', 'HR', 'Project Manager'] },
    { path: '/vehicles', name: 'Vehicles', icon: Car, roles: ['Super Admin', 'Project Manager'] },
    { path: '/salary', name: 'Payroll', icon: Banknote, roles: ['Super Admin', 'HR', 'Accountant'] },
    { path: '/reports', name: 'Reports', icon: FileText, roles: ['Super Admin', 'Accountant'] },
    { path: '/accounts', name: 'Accounts', icon: Landmark, roles: ['Super Admin', 'Accountant'] },
    { path: '/users', name: 'System Access', icon: Shield, roles: ['Super Admin'] },
    { path: '/activity-logs', name: 'Audit Logs', icon: FileText, roles: ['Super Admin'] },
    { path: '/backups', name: 'System Backups', icon: HardDrive, roles: ['Super Admin'] }
  ];

  const permittedNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">AB</div>
          <h2>Alam Builders</h2>
          <button className="close-sidebar-btn" onClick={toggleSidebar} type="button">
            <X size={24} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {permittedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                to={item.path} 
                key={item.name}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (window.innerWidth <= 768) {
                    toggleSidebar();
                  }
                }}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div style={{ marginTop: 'auto', padding: '2rem 1.5rem' }}>
          <button onClick={logout} className="nav-item" style={{ background: 'none', border: 'none', width: '100%', color: '#ef4444', fontWeight: 600 }}>
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

const Header = ({ toggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  const [showPassModal, setShowPassModal] = useState(false);
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '' });
  const [passLoading, setPassLoading] = useState(false);

  if (!user) return null;

  const handlePassChange = async (e) => {
    e.preventDefault();
    setPassLoading(true);
    try {
      await apiClient.put('/auth/profile/password', passForm);
      setShowPassModal(false);
      setPassForm({ currentPassword: '', newPassword: '' });
      alert('Password formally rotated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error executing password change');
    } finally {
      setPassLoading(false);
    }
  };

  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'Dashboard';
      case '/expenses': return 'Expense Management';
      case '/employees': return 'Employee Directory';
      case '/projects': return 'Project Hub';
      case '/work-records': return 'Attendance Records';
      case '/vehicles': return 'Vehicle Fleet';
      case '/salary': return 'Payroll & Advances';
      case '/reports': return 'Business Reports';
      case '/accounts': return 'Financial Accounts';
      case '/users': return 'User Authentication Access';
      case '/activity-logs': return 'Global Audit Ledgers';
      default: return 'Overview';
    }
  };

  return (
    <header className="top-header">
      <div className="flex items-center gap-4">
        <button className="menu-btn" onClick={toggleSidebar} type="button">
          <Menu size={24} />
        </button>
        <div className="header-title">
          <h1>{getPageTitle()}</h1>
        </div>
      </div>
      <div className="header-profile" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={() => setShowPassModal(true)} 
          className="btn-icon" 
          style={{ width: '36px', height: '36px', background: '#f8fafc', border: '1px solid #e2e8f0' }}
          title="Change Personal Password"
        >
          <KeyRound size={16} color="#64748b" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{user.role}</span>
          </div>
        </div>
      </div>

      {showPassModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2>Update Account Password</h2>
              <button onClick={() => setShowPassModal(false)} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePassChange}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Current Active Password</label>
                <input required type="password" placeholder="••••••••" className="form-input" value={passForm.currentPassword} onChange={e => setPassForm({...passForm, currentPassword: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">New Password</label>
                <input required type="password" placeholder="••••••••" className="form-input" value={passForm.newPassword} onChange={e => setPassForm({...passForm, newPassword: e.target.value})} />
              </div>
              
              <div className="flex gap-4">
                <button type="button" className="btn btn-outline flex-1" onClick={() => setShowPassModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={passLoading}>
                  {passLoading ? 'Updating' : 'Confirm Save'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

const AppContent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="app-layout">
      {user && <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(false)} />}
      <main className="main-content" style={{ marginLeft: user ? undefined : '0' }}>
        {user && <Header toggleSidebar={() => setIsSidebarOpen(true)} />}
        <div className="page-content" style={{ padding: user ? undefined : '0' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/expenses" element={<PrivateRoute allowedRoles={['Super Admin', 'Accountant']}><Expenses /></PrivateRoute>} />
            <Route path="/employees" element={<PrivateRoute allowedRoles={['Super Admin', 'HR', 'Accountant']}><Employees /></PrivateRoute>} />
            <Route path="/projects" element={<PrivateRoute allowedRoles={['Super Admin', 'Project Manager']}><Projects /></PrivateRoute>} />
            <Route path="/work-records" element={<PrivateRoute allowedRoles={['Super Admin', 'HR', 'Project Manager']}><WorkRecords /></PrivateRoute>} />
            <Route path="/vehicles" element={<PrivateRoute allowedRoles={['Super Admin', 'Project Manager']}><Vehicles /></PrivateRoute>} />
            <Route path="/salary" element={<PrivateRoute allowedRoles={['Super Admin', 'HR', 'Accountant']}><SalaryAdvance /></PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute allowedRoles={['Super Admin', 'Accountant']}><Reports /></PrivateRoute>} />
            <Route path="/accounts" element={<PrivateRoute allowedRoles={['Super Admin', 'Accountant']}><Accounts /></PrivateRoute>} />
            <Route path="/users" element={<PrivateRoute allowedRoles={['Super Admin']}><UsersAdmin /></PrivateRoute>} />
            <Route path="/activity-logs" element={<PrivateRoute allowedRoles={['Super Admin']}><ActivityLogs /></PrivateRoute>} />
            <Route path="/backups" element={<PrivateRoute allowedRoles={['Super Admin']}><BackupsAdmin /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
