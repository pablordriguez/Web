const { check } = require('express-validator');

// Validator for NIF (Format: 12345678Z)
const nifValidator = (nif) => {
  const regex = /^[0-9]{8}[A-Za-z]{1}$/;  // Regular expression for Spanish NIF
  return regex.test(nif);
};

// Middleware to validate NIF
const validatorNif = [
  check('nif')
    .exists()
    .withMessage('NIF is required')  // Ensures NIF is provided
    .bail()  // Stops processing if there's an error
    .custom(nifValidator)
    .withMessage('Invalid NIF format'),  // Uses the custom NIF validator
];

module.exports = validatorNif;
