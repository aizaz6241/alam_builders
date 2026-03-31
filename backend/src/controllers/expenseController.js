const Expense = require('../models/Expense');
const Account = require('../models/Account');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Public
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({}).populate('vehicleId', 'registrationNumber').populate('accountId', 'name type');
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an expense
// @route   POST /api/expenses
// @access  Public
const createExpense = async (req, res) => {
  try {
    const { type, category, amount, date, description, receiptImage, vehicleId, accountId } = req.body;
    const expense = new Expense({
      type, category, amount, date, description, receiptImage, vehicleId, accountId: accountId || undefined
    });
    const createdExpense = await expense.save();

    if (createdExpense.accountId) {
      await Account.findByIdAndUpdate(createdExpense.accountId, { $inc: { balance: -Number(amount) } });
    }

    res.status(201).json(createdExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Public
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (expense) {
      const { type, category, amount, date, description, receiptImage, vehicleId, accountId } = req.body;
      
      const newAmount = amount !== undefined ? Number(amount) : expense.amount;
      const oldAmount = expense.amount;
      const oldAccountId = expense.accountId ? expense.accountId.toString() : null;
      
      let newAccountId = oldAccountId;
      if (accountId !== undefined) {
        newAccountId = (accountId === '' || accountId === 'null' || accountId === null) ? null : accountId;
      }

      if (oldAccountId !== newAccountId) {
         if (oldAccountId) await Account.findByIdAndUpdate(oldAccountId, { $inc: { balance: oldAmount } });
         if (newAccountId) await Account.findByIdAndUpdate(newAccountId, { $inc: { balance: -newAmount } });
      } else if (oldAccountId === newAccountId && oldAccountId) {
         const diff = newAmount - oldAmount;
         if (diff !== 0) await Account.findByIdAndUpdate(oldAccountId, { $inc: { balance: -diff } });
      }

      expense.type = type !== undefined ? type : expense.type;
      expense.category = category !== undefined ? category : expense.category;
      expense.amount = newAmount;
      expense.date = date !== undefined ? date : expense.date;
      expense.description = description !== undefined ? description : expense.description;
      expense.receiptImage = receiptImage !== undefined ? receiptImage : expense.receiptImage;
      
      if (vehicleId === null || vehicleId === undefined || vehicleId === '') {
          expense.vehicleId = undefined;
      } else {
          expense.vehicleId = vehicleId;
      }

      if (newAccountId === null) {
          expense.accountId = undefined;
      } else {
          expense.accountId = newAccountId;
      }

      const updatedExpense = await expense.save();
      res.json(updatedExpense);
    } else {
      res.status(404).json({ message: 'Expense not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Public
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (expense) {
      if (expense.accountId) {
        await Account.findByIdAndUpdate(expense.accountId, { $inc: { balance: expense.amount } });
      }
      await expense.deleteOne();
      res.json({ message: 'Expense removed' });
    } else {
      res.status(404).json({ message: 'Expense not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense
};
