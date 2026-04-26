const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/summarize', protect, aiController.summarizeNote);
router.post('/chat', protect, aiController.chatWithNote);
router.post('/suggest-tags', protect, aiController.suggestTags);

module.exports = router;
