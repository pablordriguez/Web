const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const { auth } = require('../middleware/auth'); // Corrected import
const upload = require('../middleware/upload');
const { uploadLogo } = require('../controllers/uploadLogo');
const { inviteGuest } = require('../controllers/inviteGuest');

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Endpoints related to users
 */

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Base endpoint to check the availability of the user service
 *     tags: [User]
 *     responses:
 *       200:
 *         description: OK - Base route /api/user available
 */
router.get('/', (req, res) => {
  res.status(200).json({ message: 'OK - /api/user base route' });
});

// Register
router.post('/register', userController.registerUser);

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/user'
 *     responses:
 *       201:
 *         description: User registered successfully
 */

// Verification
/**
 * @swagger
 * /api/user/validation:
 *   put:
 *     summary: Validate the code received by email
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: User successfully verified
 */
router.put('/validation', userController.verifyCode);

// Login
/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/login'
 *     responses:
 *       200:
 *         description: User successfully authenticated
 */
router.post('/login', userController.loginUser);

// Personal onboarding
/**
 * @swagger
 * /api/user/onboarding:
 *   put:
 *     summary: Save the user's personal data
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               nif:
 *                 type: string
 *     responses:
 *       200:
 *         description: Personal data updated
 */
router.put('/onboarding', auth, userController.updateUserData);

// Company data
/**
 * @swagger
 * /api/user/company:
 *   patch:
 *     summary: Save or update company data
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company:
 *                 type: object
 *                 properties:
 *                   companyName:
 *                     type: string
 *                   companyCif:
 *                     type: string
 *                   companyAddress:
 *                     type: string
 *     responses:
 *       200:
 *         description: Company data updated
 */
router.patch('/company', auth, userController.updateCompanyData);

// Get profile of the authenticated user
/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Get the information of the logged-in user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data
 */
router.get('/me', auth, userController.getUserFromToken);

// Upload logo
/**
 * @swagger
 * /api/user/logo:
 *   patch:
 *     summary: Upload the company logo
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo uploaded successfully
 */
router.patch('/logo', auth, upload.single('logo'), uploadLogo);

// Additional functionalities (point 6)
/**
 * @swagger
 * /api/user/delete:
 *   delete:
 *     summary: Delete user (hard or soft delete)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: soft
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           example: false
 *     responses:
 *       200:
 *         description: User deleted or archived
 */
router.delete('/delete', auth, userController.deleteUser);

/**
 * @swagger
 * /api/user/recover:
 *   post:
 *     summary: Start password recovery process
 *     tags: [User]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Recovery code sent
 */
router.post('/recover', userController.recoverPasswordInit);

/**
 * @swagger
 * /api/user/reset-password:
 *   post:
 *     summary: Change password with recovery code
 *     tags: [User]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated
 */
router.post('/reset-password', userController.recoverPassword);

/**
 * @swagger
 * /api/user/invite:
 *   post:
 *     summary: Invite a user as a guest
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User invited successfully
 */
router.post('/invite', auth, inviteGuest);

module.exports = router;
