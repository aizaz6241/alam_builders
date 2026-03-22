const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  clientCompany: { type: String, required: true },
  startDate: { type: Date, required: true },
  expectedCompletionDate: { type: Date },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed', 'On Hold'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
