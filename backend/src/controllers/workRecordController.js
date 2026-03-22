const WorkRecord = require('../models/WorkRecord');

// @desc    Get all work records
// @route   GET /api/work-records
// @access  Public
const getWorkRecords = async (req, res) => {
  try {
    const workRecords = await WorkRecord.find({})
      .populate('employeeId', 'name salary')
      .populate('projectId', 'name');
    res.json(workRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a work record
// @route   POST /api/work-records
// @access  Public
const createWorkRecord = async (req, res) => {
  try {
    const { employeeId, projectId, date, amountCompleted, normalHours, overtimeHours, unit, description } = req.body;
    
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);
    
    const existingRecord = await WorkRecord.findOne({
      employeeId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    if (existingRecord) {
      return res.status(400).json({ message: 'Attendance already recorded for this employee on this date' });
    }

    const workRecord = new WorkRecord({
      employeeId, projectId, date, amountCompleted, normalHours, overtimeHours, unit, description
    });
    const createdWorkRecord = await workRecord.save();
    res.status(201).json(createdWorkRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get work records by employee ID
// @route   GET /api/work-records/employee/:employeeId
// @access  Public
const getWorkRecordsByEmployee = async (req, res) => {
  try {
    const workRecords = await WorkRecord.find({ employeeId: req.params.employeeId })
      .populate('projectId', 'name');
    res.json(workRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a work record
// @route   DELETE /api/work-records/:id
// @access  Public
const deleteWorkRecord = async (req, res) => {
  try {
    const workRecord = await WorkRecord.findById(req.params.id);
    if (workRecord) {
      await workRecord.deleteOne();
      res.json({ message: 'Work record removed' });
    } else {
      res.status(404).json({ message: 'Work record not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWorkRecords,
  createWorkRecord,
  getWorkRecordsByEmployee,
  deleteWorkRecord
};
