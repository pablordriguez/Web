const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints for registration, login, and email validation
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@gmail.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: User successfully registered
 *       400:
 *         description: Invalid data
 *       409:
 *         description: The email is already registered
 *       500:
 *         description: Error registering the user
 */
router.post('/register', authController.registerUser);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/login'
 *     responses:
 *       200:
 *         description: Successful login
 *       401:
 *         description: Incorrect password
 *       404:
 *         description: User not found
 */
router.post('/login', authController.loginUser);

/**
 * @swagger
 * /api/auth/validate:
 *   post:
 *     summary: Validate email with verification code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: User successfully validated
 *       400:
 *         description: Invalid code
 *       404:
 *         description: User not found
 */
router.post('/validate', authController.validateEmail);

module.exports = router;
