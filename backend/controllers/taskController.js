const Task = require('../models/Task');

const getTasks = async (req, res) => {
  try {
    // Allows filtering by boardId if provided
    let query = { user: req.user._id };
    if (req.query.boardId) {
      query.board = req.query.boardId;
    }
    
    const tasks = await Task.find(query).sort({ order: 1, createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { board, columnId, title, description, dueDate, priority, type, tags, checklist, order } = req.body;
    
    const task = new Task({
      user: req.user._id,
      board,
      columnId,
      title,
      description,
      dueDate,
      priority,
      type,
      tags,
      checklist,
      order: order || 0
    });
    
    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const allowedUpdates = ['title', 'description', 'dueDate', 'priority', 'type', 'tags', 'checklist', 'order', 'columnId', 'board'];
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!task) return res.status(404).json({ message: 'Task not found or not authorized' });
    res.json(task);
  } catch (error) {
    console.error('Update Task Error:', error);
    res.status(500).json({ message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

    await Task.deleteOne({ _id: task._id });
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTaskOrder = async (req, res) => {
  // To handle dragging and dropping tasks
  try {
    const { tasks } = req.body; // Array of { id, columnId, order }
    
    for (let t of tasks) {
      await Task.updateOne(
        { _id: t.id, user: req.user._id },
        { $set: { columnId: t.columnId, order: t.order } }
      );
    }
    
    res.json({ message: 'Tasks updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, updateTaskOrder };
