const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  verificationCode: { type: String },
  isVerified: { type: Boolean, default: false },

  // Personal data
  firstName: { type: String },
  lastName: { type: String },
  nif: { type: String },

  // Company data
  isAutonomous: { type: Boolean, default: false },
  companyName: { type: String },
  companyCif: { type: String },
  companyAddress: { type: String },
  companyStreet: { type: String },
  companyNumber: { type: Number },
  companyPostal: { type: Number },
  companyCity: { type: String },
  companyProvince: { type: String },

  // User logo
  logo: { type: String },

  // NEW FIELDS for point 6
  recoveryCode: { type: String },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive'],
    default: 'pending'
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'guest'],
    default: 'user'
  },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
