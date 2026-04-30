import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add a positive or negative number']
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    default: 'General'
  },
  date: {
    type: Date,
    default: Date.now
  },
  details: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
