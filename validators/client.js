// validators/client.js
const { body } = require("express-validator");

exports.validateClient = [
  body("name")
    .notEmpty().withMessage("The clients name is required")
    .isLength({ max: 100 }).withMessage("The name is too long"),

  body("email")
    .optional()
    .isEmail().withMessage("The email is not valid"),

  body("phone")
    .optional()
    .isMobilePhone("any").withMessage("Invalid phone number"),

  body("address")
    .optional()
    .isLength({ max: 200 }).withMessage("The address is too long")
];
