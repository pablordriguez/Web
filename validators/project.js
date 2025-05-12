// validators/project.js
const { body } = require("express-validator");

exports.validateProject = [
  body("name")
    .notEmpty().withMessage("Project name is required")
    .isLength({ max: 100 }).withMessage("Name is too long"),
  body("client")
    .notEmpty().withMessage("You must provide the associated client ID")
];
