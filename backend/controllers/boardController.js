const Board = require('../models/Board');
const Task = require('../models/Task');

const getBoards = async (req, res) => {
  try {
    const boards = await Board.find({ user: req.user._id });
    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBoard = async (req, res) => {
  try {
    const { name, columns } = req.body;
    const defaultColumns = [
      { id: 'todo', title: 'To Do', order: 0 },
      { id: 'inprogress', title: 'In Progress', order: 1 },
      { id: 'done', title: 'Done', order: 2 }
    ];
    
    const board = new Board({
      user: req.user._id,
      name: name || 'New Board',
      columns: columns || defaultColumns
    });
    
    const createdBoard = await board.save();
    res.status(201).json(createdBoard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (board.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

    board.name = req.body.name || board.name;
    if (req.body.columns) board.columns = req.body.columns;

    const updatedBoard = await board.save();
    res.json(updatedBoard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (board.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

    await Board.deleteOne({ _id: board._id });
    // Also delete tasks associated with this board
    await Task.deleteMany({ board: board._id });
    
    res.json({ message: 'Board removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBoards, createBoard, updateBoard, deleteBoard };
