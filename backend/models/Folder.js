const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  type: { type: String, enum: ['notes', 'boards'], default: 'notes' }
}, { timestamps: true });

folderSchema.index({ user: 1 });

module.exports = mongoose.model('Folder', folderSchema);
