const Note = require('../models/Note');
const Board = require('../models/Board');
const Folder = require('../models/Folder');

exports.getBootstrapData = async (req, res) => {
  try {
    const userId = req.user._id;

    const [notes, noteFolders, boardFolders, boards] = await Promise.all([
      Note.find({ user: userId }).sort({ updatedAt: -1 }),
      Folder.find({ user: userId, type: 'notes' }),
      Folder.find({ user: userId, type: 'boards' }),
      Board.find({ user: userId })
    ]);

    res.json({
      notes,
      noteFolders,
      boardFolders,
      boards
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
