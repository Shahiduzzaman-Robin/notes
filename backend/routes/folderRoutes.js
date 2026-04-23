const express = require('express');
const router = express.Router();
const { createFolder, getFolders, updateFolder, deleteFolder } = require('../controllers/folderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(createFolder)
  .get(getFolders);

router.route('/:id')
  .put(updateFolder)
  .delete(deleteFolder);

module.exports = router;
