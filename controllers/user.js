const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { generateCode } = require('../utils/codeGenerator');

// Function to generate a random verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register
exports.registerUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: 'Email is already registered' });

    const verificationCode = generateVerificationCode();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ email, password: hashedPassword, verificationCode });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      email: user.email,
      verificationCode: verificationCode,
      token: token
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error registering user' });
  }
};

// Verification
exports.verifyCode = async (req, res) => {
  const { code } = req.body;

  if (!code) return res.status(400).json({ message: 'Verification code is required' });

  try {
    const user = await User.findOne({ verificationCode: code });
    if (!user) return res.status(404).json({ message: 'Invalid verification code' });

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    res.status(200).json({ message: 'User successfully verified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error verifying code' });
  }
};

// Login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return res.status(401).json({ message: 'Incorrect password' });

  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.status(200).json({
    email: user.email,
    isVerified: user.isVerified,
    token: token,
  });
};

// Personal onboarding
exports.updateUserData = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { firstName, lastName, nif } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.firstName = firstName;
    user.lastName = lastName;
    user.nif = nif;
    await user.save();

    res.status(200).json({ message: 'Data successfully updated', firstName, lastName, nif });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating user data' });
  }
};

// Company onboarding
exports.updateCompanyData = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { companyName, companyCif, companyAddress, companyStreet, companyNumber, companyPostal, companyCity, companyProvince, isAutonomous } = req.body.company;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (isAutonomous) {
      user.companyName = user.firstName + ' ' + user.lastName;
      user.companyCif = user.nif;
      user.companyAddress = `${user.firstName} ${user.lastName} Address`;
    } else {
      if (!companyName || !companyCif || !companyAddress || !companyStreet || !companyNumber || !companyPostal || !companyCity || !companyProvince) {
        return res.status(400).json({ message: 'All company fields are required' });
      }

      const cifPattern = /^[A-Z0-9]{9}$/;
      if (!cifPattern.test(companyCif)) {
        return res.status(400).json({ message: 'The CIF is not in a valid format' });
      }

      Object.assign(user, {
        companyName,
        companyCif,
        companyAddress,
        companyStreet,
        companyNumber,
        companyPostal,
        companyCity,
        companyProvince
      });
    }

    await user.save();
    res.status(200).json({ message: 'Company data successfully updated', company: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating company data' });
  }
};

// GET /me (from JWT)
exports.getUserFromToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error getting user' });
  }
};

// DELETE /delete?soft=false
exports.deleteUser = async (req, res) => {
  try {
    const { soft } = req.query;

    if (soft === 'false') {
      await User.findByIdAndDelete(req.user.id);
      return res.json({ message: 'User permanently deleted' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { status: 'inactive' },
      { new: true }
    );

    res.json({ message: 'User deactivated', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

// POST /recover
exports.recoverPasswordInit = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const recoveryCode = generateVerificationCode();
  user.recoveryCode = recoveryCode;
  await user.save();

  console.log(`Recovery code for ${email}: ${recoveryCode}`);

  const response = { message: 'Recovery code sent' };
  if (process.env.NODE_ENV === 'test') {
    response.code = recoveryCode;
  }
  res.status(200).json(response);
};

// POST /reset-password
exports.recoverPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user || user.recoveryCode !== code) {
    return res.status(400).json({ message: 'Incorrect code or invalid user' });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.recoveryCode = undefined;
  await user.save();

  res.json({ message: 'Password successfully updated' });
};

// POST /invite
exports.inviteGuest = async (req, res) => {
  const { email } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email is already registered' });

  const newGuest = await User.create({
    email,
    role: 'guest',
    status: 'pending',
    invitedBy: req.user.id
  });

  res.json({ message: 'User invited successfully', guest: newGuest });
};
