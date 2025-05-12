const { check } = require('express-validator');
const handleValidator = require('../utils/handleValidator');  // Make sure handleValidator is correctly configured

// Register validator
const validatorRegister = [
  check('email').exists().isEmail().withMessage('Email is required'),
  check('password')
    .exists()
    .isLength({ min: 8 })
    .withMessage('Password is required'),
  (req, res, next) => {
    return handleValidator(req, res, next);
  },
];

// Verification code validator
const validatorVerify = [
  check('code')
    .exists()
    .isLength({ min: 6 })
    .withMessage('Verification code is required'),
  (req, res, next) => {
    return handleValidator(req, res, next);
  },
];

// Login validator
const validatorLogin = [
  check('email').exists().isEmail().withMessage('Email is required'),
  check('password')
    .exists()
    .isLength({ min: 8 })
    .withMessage('Password is required'),
  (req, res, next) => {
    return handleValidator(req, res, next);
  },
];

module.exports = { validatorRegister, validatorVerify, validatorLogin };