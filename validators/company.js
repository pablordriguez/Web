const { check } = require('express-validator');

// Middleware to validate company data
const validatorCompany = [
  check('companyName')
    .exists()
    .withMessage('Company name is required')
    .bail(),  // Stops processing if there's already an error
  check('companyCif')
    .exists()
    .withMessage('CIF is required')
    .bail()
    .custom(cifValidator)
    .withMessage('Invalid CIF format'),
  check('companyAddress')
    .exists()
    .withMessage('Company address is required')
    .bail(),
];

module.exports = validatorCompany;
