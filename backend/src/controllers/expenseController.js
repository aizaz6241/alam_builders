const Expense = require('../models/Expense');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Public
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({}).populate('vehicleId', 'registrationNumber');
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
    const { type, category, amount, date, description, receiptImage, vehicleId } = req.body;
    const expense = new Expense({
      type, category, amount, date, description, receiptImage, vehicleId
    });
    const createdExpense = await expense.save();
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
      const { type, category, amount, date, description, receiptImage, vehicleId } = req.body;
      expense.type = type !== undefined ? type : expense.type;
      expense.category = category !== undefined ? category : expense.category;
      expense.amount = amount !== undefined ? amount : expense.amount;
      expense.date = date !== undefined ? date : expense.date;
      expense.description = description !== undefined ? description : expense.description;
      expense.receiptImage = receiptImage !== undefined ? receiptImage : expense.receiptImage;
      
      // Explicitly allow clearing vehicleId if not provided (for changing category tracking)
      if (vehicleId === null || vehicleId === undefined || vehicleId === '') {
          expense.vehicleId = undefined;
      } else {
          expense.vehicleId = vehicleId;
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
