const SalaryPayment = require('../models/SalaryPayment');
const Expense = require('../models/Expense');
const Employee = require('../models/Employee');
const Account = require('../models/Account');

const getSalaryPayments = async (req, res) => {
  try {
    const payments = await SalaryPayment.find({}).populate('employeeId', 'name');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSalaryPayment = async (req, res) => {
  try {
    const { employeeId, amount, date, month, description, accountId } = req.body;
    
    const payment = new SalaryPayment({
      employeeId, amount, date, month, description
    });
    const createdPayment = await payment.save();

    // Fetch employee to get name for the expense description
    const emp = await Employee.findById(employeeId);
    const empName = emp ? emp.name : 'Unknown Employee';

    // Auto-create a corresponding Business Expense
    const expense = new Expense({
      type: 'Office',
      category: 'Payroll',
      amount: amount,
      date: date || new Date(),
      description: `Salary Payment for ${empName} (${month})`,
      accountId: accountId || undefined
    });
    const savedExpense = await expense.save();

    if (savedExpense.accountId) {
      await Account.findByIdAndUpdate(savedExpense.accountId, { $inc: { balance: -Number(amount) } });
    }

    res.status(201).json(createdPayment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getSalaryPayments,
  createSalaryPayment
};
