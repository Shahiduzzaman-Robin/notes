const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  columns: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    order: { type: Number, default: 0 }
  }],
  folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null }
}, { timestamps: true });

boardSchema.index({ user: 1 });
boardSchema.index({ folder: 1 });

module.exports = mongoose.model('Board', boardSchema);
