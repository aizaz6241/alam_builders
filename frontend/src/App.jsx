import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Users, FolderKanban, Activity, CreditCard, Car, LayoutDashboard, Banknote, FileText, Menu, X } from 'lucide-react';
import './index.css';

// Layout Component
const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/expenses', name: 'Expenses', icon: CreditCard },
    { path: '/employees', name: 'Employees', icon: Users },
    { path: '/projects', name: 'Projects', icon: FolderKanban },
    { path: '/work-records', name: 'Attendance', icon: Activity },
    { path: '/vehicles', name: 'Vehicles', icon: Car },
    { path: '/salary', name: 'Payroll', icon: Banknote },
    { path: '/reports', name: 'Reports', icon: FileText },
  ];

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
          {navItems.map((item) => {
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
      </div>
    </>
  );
};

const Header = ({ toggleSidebar }) => {
  const location = useLocation();
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
      <div className="header-profile">
        <div className="avatar">A</div>
        <div className="user-info">
          <span className="user-name">Admin User</span>
          <span className="user-role">Manager</span>
        </div>
      </div>
    </header>
  );
};

import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Projects from './pages/Projects';
import Expenses from './pages/Expenses';
import WorkRecords from './pages/WorkRecords';
import Vehicles from './pages/Vehicles';
import SalaryAdvance from './pages/SalaryAdvance';
import Reports from './pages/Reports';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="app-layout">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(false)} />
        <main className="main-content">
          <Header toggleSidebar={() => setIsSidebarOpen(true)} />
          <div className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/work-records" element={<WorkRecords />} />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/salary" element={<SalaryAdvance />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
