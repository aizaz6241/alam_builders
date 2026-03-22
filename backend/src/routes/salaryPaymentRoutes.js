const express = require('express');
const router = express.Router();
const {
  getSalaryPayments,
  createSalaryPayment
} = require('../controllers/salaryPaymentController');

router.route('/').get(getSalaryPayments).post(createSalaryPayment);

module.exports = router;
