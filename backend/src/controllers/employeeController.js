const Employee = require('../models/Employee');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Public
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({});
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an employee
// @route   POST /api/employees
// @access  Public
const createEmployee = async (req, res) => {
  try {
    const { name, phone, jobRole, salary, joiningDate, status } = req.body;
    const employee = new Employee({
      name, phone, jobRole, salary, joiningDate, status
    });
    const createdEmployee = await employee.save();
    res.status(201).json(createdEmployee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Public
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (employee) {
      res.json(employee);
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Public
const updateEmployee = async (req, res) => {
  try {
    const { name, phone, jobRole, salary, joiningDate, status } = req.body;
    const employee = await Employee.findById(req.params.id);

    if (employee) {
      employee.name = name || employee.name;
      employee.phone = phone || employee.phone;
      employee.jobRole = jobRole || employee.jobRole;
      employee.salary = salary || employee.salary;
      employee.joiningDate = joiningDate || employee.joiningDate;
      employee.status = status || employee.status;

      const updatedEmployee = await employee.save();
      res.json(updatedEmployee);
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Add attendance
// @route   POST /api/employees/:id/attendance
// @access  Public
const addAttendance = async (req, res) => {
  try {
    const { date, status } = req.body;
    const employee = await Employee.findById(req.params.id);

    if (employee) {
      employee.attendance.push({ date, status });
      await employee.save();
      res.status(201).json(employee);
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Add leave
// @route   POST /api/employees/:id/leaves
// @access  Public
const addLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    const employee = await Employee.findById(req.params.id);

    if (employee) {
      employee.leaves.push({ startDate, endDate, reason });
      await employee.save();
      res.status(201).json(employee);
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Public
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (employee) {
      await employee.deleteOne();
      res.json({ message: 'Employee removed' });
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  addAttendance,
  addLeave
};
