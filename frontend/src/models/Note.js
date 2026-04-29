import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'Untitled' },
  content: { type: String, default: '' },
  isPinned: { type: Boolean, default: false },
  tags: [{ type: String }],
  folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null }
}, { timestamps: true });

noteSchema.index({ user: 1 });
noteSchema.index({ folder: 1 });
noteSchema.index({ title: 'text', content: 'text', tags: 'text' });

export default mongoose.models.Note || mongoose.model('Note', noteSchema);
