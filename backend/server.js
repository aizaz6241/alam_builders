const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Connect to database
const connectDB = require('./src/config/db');
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const employeeRoutes = require('./src/routes/employeeRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const workRecordRoutes = require('./src/routes/workRecordRoutes');
const expenseRoutes = require('./src/routes/expenseRoutes');
const salaryAdvanceRoutes = require('./src/routes/salaryAdvanceRoutes');
const vehicleRoutes = require('./src/routes/vehicleRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const backupRoutes = require('./src/routes/backupRoutes');
const salaryPaymentRoutes = require('./src/routes/salaryPaymentRoutes');
const accountRoutes = require('./src/routes/accounts');
const authRoutes = require('./src/routes/auth');
const activityLogRoutes = require('./src/routes/activityLogs');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

const { protect, authorize } = require('./src/middleware/auth');
const ActivityLog = require('./src/models/ActivityLog');
const { initBackupCron } = require('./src/utils/backupService');

// Global Activity Logging Middleware
const activityLogger = (req, res, next) => {
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;
    res.send.apply(res, arguments);

    if (res.statusCode >= 200 && res.statusCode < 300 && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
      if (req.user) {
        let action = req.method === 'POST' ? 'Created' : req.method === 'PUT' ? 'Updated' : 'Deleted';
        let detailUrl = req.originalUrl.replace('/api/', '');
        let moduleName = detailUrl.split('/')[0].toUpperCase();
        
        ActivityLog.create({
          userId: req.user._id,
          action: action,
          module: moduleName,
          details: `${action} record in ${moduleName} endpoint.`
        }).catch(err => console.error('Error logging activity:', err));
      }
    }
  };
  next();
};

app.get('/api/health', (req, res) => {
  res.json({ message: 'API is running...' });
});

app.use('/api/auth', authRoutes); // Internal protection
app.use('/api/activity-logs', activityLogRoutes); // Internal protection

app.use(protect); // Secure everything below
app.use(activityLogger); // Track everything below

// Granular RBAC Wrapping
app.use('/api/employees', authorize('Super Admin', 'HR', 'Accountant'), employeeRoutes);
app.use('/api/projects', authorize('Super Admin', 'Project Manager'), projectRoutes);
app.use('/api/work-records', authorize('Super Admin', 'HR', 'Project Manager'), workRecordRoutes);
app.use('/api/expenses', authorize('Super Admin', 'Accountant'), expenseRoutes);
app.use('/api/salary-advances', authorize('Super Admin', 'HR', 'Accountant'), salaryAdvanceRoutes);
app.use('/api/vehicles', authorize('Super Admin', 'Project Manager'), vehicleRoutes);
app.use('/api/dashboard', dashboardRoutes); // Inherently protected, all authenticated roles can read generic dashboard
app.use('/api/salary-payments', authorize('Super Admin', 'HR', 'Accountant'), salaryPaymentRoutes);
app.use('/api/accounts', authorize('Super Admin', 'Accountant'), accountRoutes);
app.use('/api/backup', backupRoutes);

const seedAdmin = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      await User.create({
        name: 'System Admin',
        email: 'admin@alambuilders.com',
        password: hashedPassword,
        role: 'Super Admin'
      });
      console.log('Default Super Admin seeded: admin@alambuilders.com / admin123');
    }
  } catch (error) {
    console.error('Error seeding admin', error);
  }
};
seedAdmin();

const PORT = process.env.PORT || 5000;

initBackupCron();

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
