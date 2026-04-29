const Note = require('../models/Note');

const getNotes = async (req, res) => {
  try {
    let query = { user: req.user._id };
    
    // Simple search implementation
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }
    
    const notes = await Note.find(query).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createNote = async (req, res) => {
  try {
    const { title, content, isPinned, tags, folder } = req.body;
    const note = new Note({
      user: req.user._id,
      title,
      content,
      isPinned,
      tags,
      folder
    });
    const createdNote = await note.save();
    res.status(201).json(createdNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateNote = async (req, res) => {
  try {
    const { title, content, isPinned, tags, folder } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (isPinned !== undefined) updates.isPinned = isPinned;
    if (tags !== undefined) updates.tags = tags;
    if (folder !== undefined) updates.folder = folder;

    const updatedNote = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedNote) return res.status(404).json({ message: 'Note not found or not authorized' });
    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

    await Note.deleteOne({ _id: note._id });
    res.json({ message: 'Note removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getNotes, getNoteById, createNote, updateNote, deleteNote };
