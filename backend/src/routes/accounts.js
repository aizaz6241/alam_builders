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

// Update a transaction
router.put('/transactions/:id', async (req, res) => {
  try {
    const { amount, date, description } = req.body;
    const tx = await AccountTransaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    const newAmount = Number(amount);
    if (isNaN(newAmount)) return res.status(400).json({ message: 'Invalid amount' });

    const account = await Account.findById(tx.accountId);
    if (account) {
      // Historical physical balance correction
      const diff = newAmount - tx.amount;
      account.balance += diff;
      await account.save();
    }

    tx.amount = newAmount;
    if (date) tx.date = date;
    if (description !== undefined) tx.description = description;

    await tx.save();
    res.json(tx);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Server error updating transaction' });
  }
});

// Delete a transaction
router.delete('/transactions/:id', async (req, res) => {
  try {
    const tx = await AccountTransaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    // Reverse the balance impact natively
    const account = await Account.findById(tx.accountId);
    if (account) {
      account.balance -= tx.amount;
      await account.save();
    }
    
    await tx.deleteOne();
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Server error deleting transaction' });
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

// Get monthly statement for an account
router.get('/:id/statement/:month', async (req, res) => {
  try {
    const { id, month } = req.params;
    const account = await Account.findById(id);
    if (!account) return res.status(404).json({ message: 'Account not found' });

    // Validate month string e.g. "2026-02"
    const monthStart = new Date(`${month}-01T00:00:00.000Z`);
    const monthYear = parseInt(month.split('-')[0]);
    const monthNum = parseInt(month.split('-')[1]);
    const nextMonthStart = new Date(Date.UTC(monthNum === 12 ? monthYear + 1 : monthYear, monthNum === 12 ? 0 : monthNum, 1));

    const allExpenses = await Expense.find({ accountId: id });
    const allTransactions = await AccountTransaction.find({ accountId: id });

    let expensesDuring = [];
    let paymentsDuring = [];
    let borrowedThisMonth = 0;
    let paidThisMonth = 0;

    let expensesAfterAmount = 0;
    let paymentsAfterAmount = 0;

    allExpenses.forEach(exp => {
      const expDate = new Date(exp.date);
      if (expDate >= monthStart && expDate < nextMonthStart) {
        expensesDuring.push(exp);
        borrowedThisMonth += exp.amount;
      } else if (expDate >= nextMonthStart) {
        expensesAfterAmount += exp.amount;
      }
    });

    allTransactions.forEach(tx => {
      const txDate = new Date(tx.date);
      if (txDate >= monthStart && txDate < nextMonthStart) {
        paymentsDuring.push(tx);
        paidThisMonth += tx.amount;
      } else if (txDate >= nextMonthStart) {
        paymentsAfterAmount += tx.amount;
      }
    });

    // The Mathematical Backtrack Formula!
    // CurrentBalance = EndingBalance + PaymentsAfter - ExpensesAfter
    // Thus: EndingBalance = CurrentBalance - PaymentsAfter + ExpensesAfter
    const closingBalance = account.balance - paymentsAfterAmount + expensesAfterAmount;

    // ClosingBalance = OpeningBalance + PaymentsDuring - ExpensesDuring
    // Thus: OpeningBalance = ClosingBalance - PaymentsDuring + ExpensesDuring
    const openingBalance = closingBalance - paidThisMonth + borrowedThisMonth;

    let monthlyLedger = [
      ...expensesDuring.map(e => ({ 
        type: 'Borrowed', 
        expenseType: e.type || e.category, // Capture Personal/Office natively
        date: e.date, 
        amount: e.amount, 
        description: e.description || e.category, 
        originalId: e._id 
      })),
      ...paymentsDuring.map(p => ({ 
        type: p.type === 'Payment' ? 'Paid' : 'Deposited', 
        date: p.date, 
        amount: p.amount, 
        description: p.description, 
        originalId: p._id 
      }))
    ];
    monthlyLedger.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      openingBalance,
      closingBalance,
      borrowedThisMonth,
      paidThisMonth,
      ledger: monthlyLedger
    });

  } catch (error) {
    console.error('Error generating statement:', error);
    res.status(500).json({ message: 'Server error generating statement' });
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
