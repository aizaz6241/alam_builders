const Expense = require('../models/Expense');
const Employee = require('../models/Employee');
const Project = require('../models/Project');

// @desc    Get dashboard stats
// @route   GET /api/dashboard
// @access  Public
const getDashboardStats = async (req, res) => {
  try {
    // 1. Get recent expenses (last 5)
    const recentExpenses = await Expense.find().sort({ date: -1 }).limit(5);

    // 2. Get total expenses for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const expensesThisMonth = await Expense.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalExpensesThisMonth = expensesThisMonth.length > 0 ? expensesThisMonth[0].total : 0;

    // 3. Get total active employees
    const activeEmployees = await Employee.countDocuments({ status: 'Active' });

    // 4. Get active projects
    const activeProjects = await Project.countDocuments({ status: { $in: ['In Progress', 'Pending'] } });

    res.json({
      recentExpenses,
      totalExpensesThisMonth,
      activeEmployees,
      activeProjects
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats
};
