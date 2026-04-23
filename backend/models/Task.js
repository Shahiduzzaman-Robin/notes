const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  columnId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  dueDate: { type: Date },
  priority: { type: String, enum: ['low', 'medium', 'high', 'none'], default: 'none' },
  type: { type: String, default: 'Task' },
  tags: [String],
  checklist: [{
    text: String,
    completed: { type: Boolean, default: false }
  }],
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
