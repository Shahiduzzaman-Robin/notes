const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const { protect } = require('../middleware/authMiddleware');

router.get('/bootstrap', protect, syncController.getBootstrapData);

module.exports = router;
