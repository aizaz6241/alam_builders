const Expense = require('../models/Expense');
const Employee = require('../models/Employee');
const Project = require('../models/Project');
const Account = require('../models/Account');
const AccountTransaction = require('../models/AccountTransaction');
const ActivityLog = require('../models/ActivityLog');
const WorkRecord = require('../models/WorkRecord');
const Vehicle = require('../models/Vehicle');
const SalaryPayment = require('../models/SalaryPayment');
const SalaryAdvance = require('../models/SalaryAdvance');

const getDashboardStats = async (req, res) => {
  try {
    const timeRange = req.query.timeRange || 'this_month';
    let startDate = new Date();
    let endDate = new Date();
    
    if (timeRange === 'this_month') {
      startDate.setDate(1);
      startDate.setHours(0,0,0,0);
    } else if (timeRange === 'last_month') {
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setDate(1);
      startDate.setHours(0,0,0,0);
      endDate.setDate(0);
      endDate.setHours(23,59,59,999);
    } else if (timeRange === 'last_3_months') {
      startDate.setMonth(startDate.getMonth() - 2); 
      startDate.setDate(1);
      startDate.setHours(0,0,0,0);
    } else if (timeRange === 'this_year') {
      startDate.setMonth(0, 1);
      startDate.setHours(0,0,0,0);
    } else if (timeRange === 'all_time') {
      startDate = new Date(2000, 0, 1); 
    }

    const isYearly = timeRange === 'this_year' || timeRange === 'last_3_months' || timeRange === 'all_time';
    const groupBy = isYearly ? { $month: "$date" } : { $week: "$date" };

    // Basic Metrics
    const activeEmployees = await Employee.countDocuments({ status: 'Active' });
    const activeProjects = await Project.countDocuments({ status: { $in: ['In Progress', 'Pending'] } });
    const recentExpensesList = await Expense.find().sort({ date: -1 }).limit(5);

    // Global Time-bound sums
    const expensesPeriod = await Expense.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalExpensesPeriod = expensesPeriod.length > 0 ? expensesPeriod[0].total : 0;

    // Multi-Dimensional Analytical Streams
    const rawExpenseTrend = await Expense.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: groupBy, amount: { $sum: "$amount" } } },
      { $sort: { "_id": 1 } }
    ]);

    const rawIncomeTrend = await AccountTransaction.aggregate([
      { $match: { type: 'Deposit', date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: groupBy, amount: { $sum: "$amount" } } },
      { $sort: { "_id": 1 } }
    ]);

    const masterMap = {};
    rawExpenseTrend.forEach(t => {
      const key = isYearly ? `Month ${t._id}` : `Week ${t._id}`;
      masterMap[key] = { name: key, expenses: t.amount, income: 0, sortId: t._id };
    });
    rawIncomeTrend.forEach(t => {
      const key = isYearly ? `Month ${t._id}` : `Week ${t._id}`;
      if (!masterMap[key]) {
        masterMap[key] = { name: key, expenses: 0, income: t.amount, sortId: t._id };
      } else {
        masterMap[key].income = t.amount;
      }
    });

    let expenseTrend = Object.values(masterMap).sort((a,b) => a.sortId - b.sortId);
    if (expenseTrend.length === 0) {
      expenseTrend = [{ name: isYearly ? 'Month 1' : 'Week 1', expenses: 0, income: 0 }];
    }

    const expenseByCategory = await Expense.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$category", value: { $sum: "$amount" } } },
      { $project: { name: "$_id", value: 1, _id: 0 } }
    ]);

    const expenseByType = await Expense.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$type", value: { $sum: "$amount" } } },
      { $project: { name: "$_id", value: 1, _id: 0 } }
    ]);

    // Financial Standalone (Accounts ignore timelines)
    const accounts = await Account.find();
    let totalCash = 0;
    let totalCreditOwed = 0;
    accounts.forEach(acc => {
      if (acc.type === 'Bank Account' || acc.type === 'Cash Wallet') {
        totalCash += acc.balance;
      } else if (acc.type === 'Credit Card' && acc.balance < 0) {
        totalCreditOwed += Math.abs(acc.balance);
      }
    });
    
    const activeBanks = accounts
      .filter(a => a.type !== 'Credit Card')
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5)
      .map(b => ({ name: b.name, balance: b.balance }));

    // HR Operations
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todayEnd = new Date();
    todayEnd.setHours(23,59,59,999);

    const activeToday = await WorkRecord.countDocuments({ date: { $gte: todayStart, $lte: todayEnd }, status: 'Present' });
    const recentWorkRecords = await WorkRecord.find().populate('employeeId', 'name position').sort({ date: -1 }).limit(4);
    
    // Project Logistics
    const projectsByStatus = await Project.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { name: "$_id", value: "$count", _id: 0 } }
    ]);
    
    const topProjects = await Project.find({ status: { $in: ['In Progress', 'Pending'] } })
      .sort({ budget: -1 }).limit(5).select('name budget status');

    const upcomingDeadlines = await Project.find({ status: { $ne: 'Completed' } })
      .sort({ expectedCompletionDate: 1 }).limit(5).select('name expectedCompletionDate status');

    // Vehicles
    const vehicleStatus = await Vehicle.aggregate([
      { $group: { _id: "$status", value: { $sum: 1 } } },
      { $project: { name: "$_id", value: 1, _id: 0 } }
    ]);

    // Payroll Distribution
    const totalSalaries = await SalaryPayment.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalAdvances = await SalaryAdvance.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const payrollDistribution = [
      { name: 'Cleared Salaries', value: totalSalaries.length ? totalSalaries[0].total : 0 },
      { name: 'Issued Advances', value: totalAdvances.length ? totalAdvances[0].total : 0 }
    ];

    // Module Usage Graph
    const moduleUsage = await ActivityLog.aggregate([
      { $group: { _id: "$module", count: { $sum: 1 } } },
      { $project: { name: "$_id", value: "$count", _id: 0 } },
      { $sort: { value: -1 } },
      { $limit: 6 }
    ]);

    // Secondary Lists
    const recentHires = await Employee.find().sort({ createdAt: -1 }).limit(5).select('name position createdAt');
    const recentTransactionsList = await AccountTransaction.find().populate('accountId', 'name').sort({ date: -1 }).limit(6);
    
    let recentActivity = [];
    if (req.user && req.user.role === 'Super Admin') {
      recentActivity = await ActivityLog.find()
        .populate('userId', 'name role')
        .sort({ timestamp: -1 })
        .limit(6);
    }

    res.json({
      timeRange,
      recentExpensesList,
      totalExpensesPeriod,
      expenseTrend,
      expenseByCategory,
      expenseByType,
      totalCash,
      totalCreditOwed,
      activeBanks,
      activeEmployees,
      activeProjects,
      recentActivity,
      activeToday,
      recentWorkRecords,
      projectsByStatus,
      topProjects,
      upcomingDeadlines,
      vehicleStatus,
      payrollDistribution,
      moduleUsage,
      recentHires,
      recentTransactionsList
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ message: 'Server error loading dashboard metrics' });
  }
};

module.exports = { getDashboardStats };
