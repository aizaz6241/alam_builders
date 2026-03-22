const mongoose = require('mongoose');

const salaryPaymentSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  month: { type: String, required: true },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SalaryPayment', salaryPaymentSchema);
