const { check } = require('express-validator');
const { validateResults } = require('../utils/handleValidator');

exports.validateDeliveryNote = [
  check('project').notEmpty().withMessage('Project ID is required'),
  check('client').notEmpty().withMessage('Client ID is required'),
  check('type').isIn(['simple', 'multiple']).withMessage('Invalid type, must be "simple" or "multiple"'),
  (req, res, next) => validateResults(req, res, next),
];
