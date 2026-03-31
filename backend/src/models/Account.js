const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['Bank Account', 'Credit Card', 'Cash']
  },
  balance: { type: Number, default: 0 },
  creditLimit: { type: Number, default: 0 }, 
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);
