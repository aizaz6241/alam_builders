const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  type: { type: String, enum: ['Personal', 'Office'], required: true },
  category: { type: String, required: true }, // Salary, Diesel, Material, Rent, Food, etc.
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  receiptImage: { type: String }, // URL or Base64
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' } // Optional reference
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
