const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validatorMail } = require("../validators/mail");
const { send } = require("../controllers/mail");

/**
 * @swagger
 * tags:
 *   name: Email
 *   description: Endpoints for sending emails
 */

/**
 * @swagger
 * /api/mail:
 *   post:
 *     summary: Send an email using OAuth2 (Gmail)
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - from
 *             properties:
 *               to:
 *                 type: string
 *                 example: recipient@gmail.com
 *               from:
 *                 type: string
 *                 example: youraccount@gmail.com
 *               subject:
 *                 type: string
 *                 example: Verification Code
 *               text:
 *                 type: string
 *                 example: "Your code is: 123456"
 *               verificationCode:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Error sending email
 */
router.post("/", auth, validatorMail, send);

module.exports = router;
