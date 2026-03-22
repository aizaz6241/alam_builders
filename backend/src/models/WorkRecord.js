const mongoose = require('mongoose');

const workRecordSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  date: { type: Date, required: true },
  amountCompleted: { type: Number, required: true },
  normalHours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  unit: { type: String, required: true }, // e.g. cubic meters, hours
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('WorkRecord', workRecordSchema);
