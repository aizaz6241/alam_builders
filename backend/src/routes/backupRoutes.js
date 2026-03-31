const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const { generateMasterSnapshot, executeMasterRestore } = require('../utils/backupService');

// Configure Multer for processing physical JSON file uploads into Memory buffers
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max limit to handle huge enterprises safely
});

// @desc    Generate and immediately trigger a master REST download of all Collections
// @route   GET /api/backup/download
// @access  Private (Super Admin Only)
router.get('/download', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const snapshot = await generateMasterSnapshot();
    
    // Force the client browser to immediately download this payload as a physical file
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=alam-builders-snapshot-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    
    res.send(JSON.stringify(snapshot, null, 2));
  } catch (error) {
    console.error('Error serving manual download snapshot:', error);
    res.status(500).json({ message: 'Server error generating physical download stream' });
  }
});

// @desc    Accept client JSON snapshot, wipe MongoDB, and restore entirely
// @route   POST /api/backup/restore
// @access  Private (Super Admin Only)
router.post('/restore', protect, authorize('Super Admin'), upload.single('snapshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No snapshot file received' });
    }

    const fileBuffer = req.file.buffer.toString('utf-8');
    const snapshotData = JSON.parse(fileBuffer);

    if (Object.keys(snapshotData).length === 0) {
      return res.status(400).json({ message: 'Snapshot schema validation failed or file is empty' });
    }

    await executeMasterRestore(snapshotData);
    res.json({ message: 'Catastrophic recovery successful. Entire database has been forcefully resurrected.' });
  } catch (error) {
    console.error('Error executing catastrophic restoration:', error);
    res.status(500).json({ message: 'Critical failure executing database recovery override' });
  }
});

module.exports = router;
