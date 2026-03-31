const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const Expense = require('../models/Expense');
const AccountTransaction = require('../models/AccountTransaction');

// Get all accounts with calculated total spent
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find().sort({ createdAt: -1 });
    
    // We can also aggregate total expenses tied to each account if we want
    // But for performance, we'll return accounts. They already have current 'balance'.
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ message: 'Server error fetching accounts' });
  }
});

// Get all account transaction history ledger
router.get('/transactions/all', async (req, res) => {
  try {
    const transactions = await AccountTransaction.find()
      .populate('accountId', 'name type')
      .sort({ date: -1, createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching account transactions:', error);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
});

// Create a new account
router.post('/', async (req, res) => {
  try {
    const { name, type, balance, creditLimit } = req.body;
    
    const account = new Account({
      name,
      type,
      balance: Number(balance) || 0,
      creditLimit: Number(creditLimit) || 0
    });
    
    const savedAccount = await account.save();
    res.status(201).json(savedAccount);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ message: 'Server error creating account' });
  }
});

// Add funds to account / Pay credit card bill
router.post('/:id/transaction', async (req, res) => {
  try {
    const { amount } = req.body;
    const accountId = req.params.id;
    
    const account = await Account.findById(accountId);
    if (!account) return res.status(404).json({ message: 'Account not found' });
    
    // Adding funds increases the balance.
    // For bank/cash, it increases available money. 
    // For credit cards, it increases the balance back towards 0 (pays off the negative debt).
    account.balance += Number(amount);
    
    const updatedAccount = await account.save();
    
    // Log the transaction physically in the ledger
    const transaction = new AccountTransaction({
      accountId: account._id,
      type: account.type === 'Credit Card' ? 'Payment' : 'Deposit',
      amount: Number(amount),
      date: req.body.date || new Date(),
      description: req.body.description || (account.type === 'Credit Card' ? 'Credit Card Bill Payment' : 'Funds Deposited')
    });
    await transaction.save();

    res.json(updatedAccount);
  } catch (error) {
    console.error('Error processing account transaction:', error);
    res.status(500).json({ message: 'Server error processing transaction' });
  }
});

// Delete an account
router.delete('/:id', async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found' });
    
    // Expenses loosely retain the accountId ID and display cleanly as 'Legacy' on the frontend
    await account.deleteOne();
    
    res.json({ message: 'Account removed' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Server error deleting account' });
  }
});

module.exports = router;
