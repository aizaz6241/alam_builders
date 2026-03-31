const mongoose = require('mongoose');

const accountTransactionSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  type: { type: String, enum: ['Deposit', 'Payment'], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AccountTransaction', accountTransactionSchema);
