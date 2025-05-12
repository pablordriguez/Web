const { check } = require('express-validator');
const { validateResults } = require('../utils/handleValidator');

const emailValidator = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

const validatorMail = [
  check('to')
    .exists().withMessage('Recipient email is required')
    .isEmail().withMessage('Invalid email format')
    .custom(emailValidator).withMessage('Invalid recipient email'),

  check('from')
    .exists().withMessage('Sender email is required')
    .isEmail().withMessage('Invalid email format')
    .custom(emailValidator).withMessage('Invalid sender email'),

  (req, res, next) => validateResults(req, res, next)
];

module.exports = { validatorMail };