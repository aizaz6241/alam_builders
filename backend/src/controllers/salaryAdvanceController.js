const SalaryAdvance = require('../models/SalaryAdvance');

// @desc    Get all salary advances
// @route   GET /api/salary-advances
// @access  Public
const getSalaryAdvances = async (req, res) => {
  try {
    const advances = await SalaryAdvance.find({}).populate('employeeId', 'name');
    res.json(advances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a salary advance
// @route   POST /api/salary-advances
// @access  Public
const createSalaryAdvance = async (req, res) => {
  try {
    const { employeeId, date, amount, description } = req.body;
    const advance = new SalaryAdvance({
      employeeId, date, amount, description
    });
    const createdAdvance = await advance.save();
    res.status(201).json(createdAdvance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get salary advance by employee ID
// @route   GET /api/salary-advances/employee/:employeeId
// @access  Public
const getAdvancesByEmployee = async (req, res) => {
  try {
    const advances = await SalaryAdvance.find({ employeeId: req.params.employeeId });
    res.json(advances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a salary advance
// @route   PUT /api/salary-advances/:id
// @access  Public
const updateSalaryAdvance = async (req, res) => {
  try {
    const { employeeId, date, amount, description } = req.body;
    const advance = await SalaryAdvance.findById(req.params.id);
    
    if (advance) {
      advance.employeeId = employeeId || advance.employeeId;
      advance.date = date || advance.date;
      advance.amount = amount || advance.amount;
      advance.description = description !== undefined ? description : advance.description;

      const updatedAdvance = await advance.save();
      res.json(updatedAdvance);
    } else {
      res.status(404).json({ message: 'Salary advance not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a salary advance
// @route   DELETE /api/salary-advances/:id
// @access  Public
const deleteSalaryAdvance = async (req, res) => {
  try {
    const advance = await SalaryAdvance.findById(req.params.id);
    
    if (advance) {
      await advance.deleteOne();
      res.json({ message: 'Salary advance removed' });
    } else {
      res.status(404).json({ message: 'Salary advance not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSalaryAdvances,
  createSalaryAdvance,
  getAdvancesByEmployee,
  updateSalaryAdvance,
  deleteSalaryAdvance
};
