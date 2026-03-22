const express = require('express');
const router = express.Router();
const {
  getEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  addAttendance,
  addLeave
} = require('../controllers/employeeController');

router.route('/').get(getEmployees).post(createEmployee);
router.route('/:id').get(getEmployeeById).put(updateEmployee).delete(deleteEmployee);
router.route('/:id/attendance').post(addAttendance);
router.route('/:id/leaves').post(addLeave);

module.exports = router;
