const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { validateProject } = require("../validators/project");
const { validationResult } = require("express-validator");
const projectController = require("../controllers/project");

const checkValidations = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Endpoints for managing projects
 */

/**
 * @swagger
 * /api/project:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, client]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Alpha Project
 *               description:
 *                 type: string
 *                 example: This project is about...
 *               client:
 *                 type: string
 *                 example: 661f9b86c2ea4d9c12345678
 *     responses:
 *       201:
 *         description: Project created successfully
 */
router.post("/", auth, validateProject, checkValidations, projectController.createProject);

/**
 * @swagger
 * /api/project/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               client:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 */
router.put("/:id", auth, validateProject, checkValidations, projectController.updateProject);

/**
 * @swagger
 * /api/project:
 *   get:
 *     summary: Get all projects for the user or their company
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects successfully retrieved
 */
router.get("/", auth, projectController.getAllProjects);

/**
 * @swagger
 * /api/project/{id}:
 *   get:
 *     summary: Get a specific project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project found
 *       404:
 *         description: Project not found
 */
router.get("/:id", auth, projectController.getProjectById);

/**
 * @swagger
 * /api/project/archive/{id}:
 *   patch:
 *     summary: Archive a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project successfully archived
 */
router.patch("/archive/:id", auth, projectController.archiveProject);

/**
 * @swagger
 * /api/project/restore/{id}:
 *   patch:
 *     summary: Restore an archived project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project successfully restored
 */
router.patch("/restore/:id", auth, projectController.restoreProject);

/**
 * @swagger
 * /api/project/{id}:
 *   delete:
 *     summary: Permanently delete a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted successfully
 */
router.delete("/:id", auth, projectController.deleteProject);

module.exports = router;
