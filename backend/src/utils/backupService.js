const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const BACKUP_DIR = path.join(__dirname, '../../backups');

// Ensure backups directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generates a master JSON object containing an array of every document across every registered Mongoose Model
const generateMasterSnapshot = async () => {
  const snapshot = {};
  const models = mongoose.modelNames();

  for (const modelName of models) {
    const Model = mongoose.model(modelName);
    const data = await Model.find({}).lean(); // lean() strips Mongoose overhead for pure JSON
    snapshot[modelName] = data;
  }

  return snapshot;
};

// Takes a validated master JSON object, wipes the current DB, and re-inserts everything exactly
const executeMasterRestore = async (snapshotData) => {
  const models = mongoose.modelNames();

  // We operate inside a massive Promise collection for absolute speed
  for (const modelName of models) {
    if (snapshotData[modelName] && Array.isArray(snapshotData[modelName])) {
      const Model = mongoose.model(modelName);
      console.log(`[RESTORE] Wiping and restoring collection: ${modelName} (${snapshotData[modelName].length} docs)`);
      
      await Model.deleteMany({});
      if (snapshotData[modelName].length > 0) {
        await Model.insertMany(snapshotData[modelName]);
      }
    }
  }
};

// Automated Task triggered by Cron
const runAutomatedBackup = async () => {
  console.log('[BACKUP] Initiating automated background database snapshot...');
  try {
    const snapshot = await generateMasterSnapshot();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `alam-builders-snapshot-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));
    console.log(`[BACKUP] Successfully saved automated snapshot to: ${filepath}`);

    // Optional: Keep only the 14 most recent backups to save disk space
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));
    if (files.length > 14) {
      files.sort((a, b) => fs.statSync(path.join(BACKUP_DIR, a)).mtime.getTime() - fs.statSync(path.join(BACKUP_DIR, b)).mtime.getTime());
      const oldestFile = files[0];
      fs.unlinkSync(path.join(BACKUP_DIR, oldestFile));
      console.log(`[BACKUP] Rotated out ancient backup: ${oldestFile}`);
    }
  } catch (error) {
    console.error('[BACKUP] CRITICAL ERROR generating automated snapshot:', error);
  }
};

// Initialize Cron Schedule (Every 24 hours at 00:00 midnight)
const initBackupCron = () => {
  cron.schedule('0 0 * * *', () => {
    runAutomatedBackup();
  });
  console.log('[BACKUP] Remote node-cron scheduler activated for daily midnight dumps.');
};

module.exports = {
  generateMasterSnapshot,
  executeMasterRestore,
  runAutomatedBackup,
  initBackupCron
};
