const Folder = require('../models/Folder');
const Note = require('../models/Note');
const Board = require('../models/Board');

exports.createFolder = async (req, res) => {
  try {
    const { name, parentFolder, type } = req.body;
    const folder = await Folder.create({
      name,
      user: req.user._id,
      parentFolder: parentFolder || null,
      type: type || 'notes'
    });
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFolders = async (req, res) => {
  try {
    const query = { user: req.user._id };
    if (req.query.type) query.type = req.query.type;
    const folders = await Folder.find(query);
    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateFolder = async (req, res) => {
  try {
    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    res.json(folder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFolder = async (req, res) => {
  try {
    // Check if folder exists and belongs to user
    const folder = await Folder.findOne({ _id: req.params.id, user: req.user._id });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    // Find all subfolders (recursive)
    const subfolders = await Folder.find({ parentFolder: folder._id });
    
    // For simplicity, we just set their parent to null or delete them?
    // Let's just set the notes and boards in this folder to have null folder
    await Note.updateMany({ folder: folder._id }, { folder: null });
    await Board.updateMany({ folder: folder._id }, { folder: null });
    
    // Set child folders to have null parent or delete them?
    // Let's set child folders to have null parent
    await Folder.updateMany({ parentFolder: folder._id }, { parentFolder: null });

    await folder.deleteOne();
    res.json({ message: 'Folder removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
