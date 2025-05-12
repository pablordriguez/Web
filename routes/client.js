const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const clientController = require("../controllers/client");
const { validateClient } = require("../validators/client");
const { validationResult } = require("express-validator");

const checkValidations = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Endpoints for client management
 */

/**
 * @swagger
 * /api/client:
 *   post:
 *     summary: Create a new client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: XYZ Company
 *               email:
 *                 type: string
 *                 example: contact@company.com
 *               phone:
 *                 type: string
 *                 example: "+34123456789"
 *               address:
 *                 type: string
 *                 example: 123 Fake Street, Madrid
 *     responses:
 *       201:
 *         description: Client successfully created
 */
router.post("/", auth, validateClient, checkValidations, clientController.createClient);

/**
 * @swagger
 * /api/client/{id}:
 *   put:
 *     summary: Update an existing client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Client updated
 */
router.put("/:id", auth, validateClient, checkValidations, clientController.updateClient);

/**
 * @swagger
 * /api/client:
 *   get:
 *     summary: Get all clients for the user or their company
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of clients
 */
router.get("/", auth, clientController.getAllClients);

/**
 * @swagger
 * /api/client/{id}:
 *   get:
 *     summary: Get a client by ID
 *     tags: [Clients]
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
 *         description: Client found
 *       404:
 *         description: Client not found
 */
router.get("/:id", auth, clientController.getClientById);

/**
 * @swagger
 * /api/client/archive/{id}:
 *   patch:
 *     summary: Archive (soft delete) a client
 *     tags: [Clients]
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
 *         description: Client successfully archived
 */
router.patch("/archive/:id", auth, clientController.archiveClient);

/**
 * @swagger
 * /api/client/restore/{id}:
 *   patch:
 *     summary: Restore an archived client
 *     tags: [Clients]
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
 *         description: Client successfully restored
 */
router.patch("/restore/:id", auth, clientController.restoreClient);

/**
 * @swagger
 * /api/client/{id}:
 *   delete:
 *     summary: Permanently delete a client (hard delete)
 *     tags: [Clients]
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
 *         description: Client deleted
 */
router.delete("/:id", auth, clientController.deleteClient);

module.exports = router;
