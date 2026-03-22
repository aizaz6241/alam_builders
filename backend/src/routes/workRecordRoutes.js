const express = require('express');
const router = express.Router();
const {
  getWorkRecords,
  createWorkRecord,
  getWorkRecordsByEmployee,
  deleteWorkRecord
} = require('../controllers/workRecordController');

router.route('/').get(getWorkRecords).post(createWorkRecord);
router.route('/:id').delete(deleteWorkRecord);
router.route('/employee/:employeeId').get(getWorkRecordsByEmployee);

module.exports = router;
