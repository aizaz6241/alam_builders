const express = require('express');
const router = express.Router();
const {
  getSalaryAdvances,
  createSalaryAdvance,
  getAdvancesByEmployee,
  updateSalaryAdvance,
  deleteSalaryAdvance
} = require('../controllers/salaryAdvanceController');

router.route('/').get(getSalaryAdvances).post(createSalaryAdvance);
router.route('/employee/:employeeId').get(getAdvancesByEmployee);
router.route('/:id').put(updateSalaryAdvance).delete(deleteSalaryAdvance);

module.exports = router;
