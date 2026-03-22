const mongoose = require('mongoose');

const salaryAdvanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SalaryAdvance', salaryAdvanceSchema);
