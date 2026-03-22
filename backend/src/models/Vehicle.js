const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  registrationNumber: { type: String, required: true, unique: true },
  type: { type: String, required: true }, // e.g., Truck, Crane, Car
  makeModel: { type: String },
  malkiyaExpiry: { type: Date },
  usageType: { type: String, enum: ['Personal', 'Business'], default: 'Business' },
  status: { type: String, enum: ['Active', 'Under Maintenance', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
