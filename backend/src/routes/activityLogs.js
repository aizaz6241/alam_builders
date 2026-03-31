const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate('userId', 'name role')
      .sort({ timestamp: -1 })
      .limit(300); // Prevent massive payloads natively
    res.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ message: 'Server error fetching activity logs' });
  }
});

module.exports = router;
