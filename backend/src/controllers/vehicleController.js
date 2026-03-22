const Vehicle = require('../models/Vehicle');

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Public
const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({});
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a vehicle
// @route   POST /api/vehicles
// @access  Public
const createVehicle = async (req, res) => {
  try {
    const { registrationNumber, type, makeModel, status, malkiyaExpiry, usageType } = req.body;
    const vehicle = new Vehicle({
      registrationNumber, type, makeModel, status, malkiyaExpiry, usageType
    });
    const createdVehicle = await vehicle.save();
    res.status(201).json(createdVehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
// @access  Public
const updateVehicle = async (req, res) => {
  try {
    const { registrationNumber, type, makeModel, status, malkiyaExpiry, usageType } = req.body;
    const vehicle = await Vehicle.findById(req.params.id);

    if (vehicle) {
      if (registrationNumber) vehicle.registrationNumber = registrationNumber;
      if (type) vehicle.type = type;
      if (makeModel !== undefined) vehicle.makeModel = makeModel;
      if (status) vehicle.status = status;
      if (malkiyaExpiry !== undefined) vehicle.malkiyaExpiry = malkiyaExpiry;
      if (usageType) vehicle.usageType = usageType;
      
      const updatedVehicle = await vehicle.save();
      res.json(updatedVehicle);
    } else {
      res.status(404).json({ message: 'Vehicle not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
// @access  Public
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (vehicle) {
      await vehicle.deleteOne();
      res.json({ message: 'Vehicle removed' });
    } else {
      res.status(404).json({ message: 'Vehicle not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle
};
