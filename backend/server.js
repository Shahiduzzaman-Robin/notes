const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const boardRoutes = require('./routes/boardRoutes');
const taskRoutes = require('./routes/taskRoutes');
const folderRoutes = require('./routes/folderRoutes');
const syncRoutes = require('./routes/syncRoutes');


const app = express();

app.use(morgan('dev'));
app.use(cors({
  origin: ['https://noteall.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => res.status(200).json({ status: 'ok', message: 'Backend is live' }));
app.get('/api', (req, res) => res.status(200).json({ status: 'ok', message: 'API is live' }));

// Use a function to mount routes both with and without /api prefix for maximum compatibility
const mountRoutes = (router) => {
  router.use('/auth', authRoutes);
  router.use('/notes', noteRoutes);
  router.use('/boards', boardRoutes);
  router.use('/tasks', taskRoutes);
  router.use('/folders', folderRoutes);
  router.use('/sync', syncRoutes);
};

mountRoutes(app); // Mount at root
const apiRouter = express.Router();
mountRoutes(apiRouter);
app.use('/api', apiRouter); // Also mount at /api


const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/productivity-app';

if (!process.env.MONGO_URI && !process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: No production MongoDB URI found, falling back to local database.');
}

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Only start the server if not running on Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
