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
const salaryPaymentRoutes = require('./src/routes/salaryPaymentRoutes');
const accountRoutes = require('./src/routes/accounts');

app.get('/api/health', (req, res) => {
  res.json({ message: 'API is running...' });
});

app.use('/api/employees', employeeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/work-records', workRecordRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/salary-advances', salaryAdvanceRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/salary-payments', salaryPaymentRoutes);
app.use('/api/accounts', accountRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
