const express = require('express');
const router = express.Router();
const storageController = require('../controllers/storage');

// Routes for file storage
router.post('/upload', storageController.uploadFile);
router.get('/files', storageController.getFiles);

module.exports = router;
