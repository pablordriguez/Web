const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { auth } = require('../middleware/auth');
const controller = require('../controllers/deliveryNote');
const { validateDeliveryNote } = require('../validators/deliveryNote');

/**
 * @swagger
 * tags:
 *   name: Delivery Notes
 *   description: Endpoints for managing delivery notes
 */

/**
 * @swagger
 * /api/deliverynote:
 *   post:
 *     summary: Create a new delivery note
 *     tags: [Delivery Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [project, client, type]
 *             properties:
 *               project:
 *                 type: string
 *               client:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [simple, multiple]
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     person:
 *                       type: string
 *                     hours:
 *                       type: number
 *                     material:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       201:
 *         description: Delivery note created
 */
router.post('/', auth, validateDeliveryNote, controller.createNote);

/**
 * @swagger
 * /api/deliverynote:
 *   get:
 *     summary: List all delivery notes for the user or their company
 *     tags: [Delivery Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of delivery notes
 */
router.get('/', auth, controller.getNotes);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   get:
 *     summary: Get a delivery note by ID (includes user, client, and project)
 *     tags: [Delivery Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Delivery note found
 *       404:
 *         description: Delivery note not found
 */
router.get('/:id', auth, controller.getNoteById);

/**
 * @swagger
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     summary: Get the PDF of a delivery note (redirects to IPFS if signed and uploaded)
 *     tags: [Delivery Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF generated or successfully redirected
 *       404:
 *         description: Delivery note not found
 *       500:
 *         description: Error generating or accessing the PDF
 */
router.get('/pdf/:id', auth, controller.getPDF);

/**
 * @swagger
 * /api/deliverynote/sign/{id}:
 *   post:
 *     summary: Sign a delivery note and upload the signature + PDF to the cloud
 *     tags: [Delivery Notes]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - signature
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Delivery note signed
 *       400:
 *         description: Signature missing
 */
router.post('/sign/:id', auth, upload.single('signature'), controller.signNote);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   delete:
 *     summary: Delete a delivery note (only if not signed)
 *     tags: [Delivery Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Delivery note deleted
 *       400:
 *         description: Cannot delete if already signed
 */
router.delete('/:id', auth, controller.deleteNote);

module.exports = router;
