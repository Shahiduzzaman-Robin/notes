"use client";
import React, { useEffect, useState } from 'react';
import createPortal from 'react-dom';
import useStore from '../store/useStore';
import Modal from './Modal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, MoreVertical, MoreHorizontal, Calendar, ChevronLeft, ChevronRight, Edit2, Trash2, Check, X, Settings, Kanban, Folder, Layout, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';


// Simple debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default function KanbanBoard() {
  const { boards, tasks, activeBoardId, fetchBoards, createBoard, updateBoard, deleteBoard, setActiveBoardId, addTask, updateTask, deleteTask, reorderTasks, globalSearchQuery, isLoadingBoards, boardFolders, setActiveFolderId } = useStore();
  const [newTaskText, setNewTaskText] = useState({});
  const [editingBoardId, setEditingBoardId] = useState(null);
  const [editingBoardName, setEditingBoardName] = useState('');
  const [showBoardMenu, setShowBoardMenu] = useState(null);
  const [isAddingBoard, setIsAddingBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [localTask, setLocalTask] = useState(null);
  const [isDescFocused, setIsDescFocused] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);



  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  useEffect(() => {
    if (selectedTask) {
      setLocalTask(selectedTask);
    } else {
      setLocalTask(null);
    }
  }, [selectedTask]);

  const handleUpdateTaskDetail = async (id, updates) => {
    const updatedTask = await updateTask(id, updates);
    if (selectedTask && selectedTask._id === id && updatedTask) {
      setSelectedTask(updatedTask);
    }
  };

  const handleMoveTask = async (task, direction) => {
    const currentIndex = columns.findIndex(col => col.id === task.columnId);
    let newIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1;

    if (newIndex >= 0 && newIndex < columns.length) {
      const nextColumnId = columns[newIndex].id;
      await updateTask(task._id, { columnId: nextColumnId });
    }
  };

  const handleAddSubtask = async () => {
    if (!selectedTask) return;
    const newChecklist = [...(selectedTask.checklist || []), { text: 'New subtask', completed: false }];
    handleUpdateTaskDetail(selectedTask._id, { checklist: newChecklist });
  };

  const toggleSubtask = async (index) => {
    if (!selectedTask) return;
    const newChecklist = [...selectedTask.checklist];
    newChecklist[index].completed = !newChecklist[index].completed;
    handleUpdateTaskDetail(selectedTask._id, { checklist: newChecklist });
  };

  const removeSubtask = async (index) => {
    if (!selectedTask) return;
    const newChecklist = selectedTask.checklist.filter((_, i) => i !== index);
    handleUpdateTaskDetail(selectedTask._id, { checklist: newChecklist });
  };

  const updateSubtaskText = async (index, text) => {
    if (!localTask) return;
    const newChecklist = [...localTask.checklist];
    newChecklist[index].text = text;
    setLocalTask({ ...localTask, checklist: newChecklist });
    debouncedUpdate(localTask._id, { checklist: newChecklist });
  };

  if (isLoadingBoards) {
    return <div style={{ height: 'calc(100vh - 120px)' }} />;
  }

  if (boards.length === 0) {
    return (
      <div style={{
        height: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 40px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '80px',
          maxWidth: '1000px',
          width: '100%',
          animation: 'fadeInUp 0.8s ease-out'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              left: '-20px',
              right: '20px',
              bottom: '20px',
              background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)',
              borderRadius: '24px',
              opacity: 0.1,
              filter: 'blur(40px)',
              zIndex: -1
            }} />
            <img
              src="/kanban_empty.png"
              alt="Kanban Illustration"
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '24px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                display: 'block'
              }}
            />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                width: 'fit-content',
                padding: '6px 12px',
                background: 'rgba(35, 131, 226, 0.1)',
                color: 'var(--primary)',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Get Started
              </div>
              <h1 style={{
                fontSize: '48px',
                fontWeight: 800,
                color: 'var(--text-color)',
                lineHeight: 1.1,
                margin: 0
              }}>
                Organize your work <br />
                <span style={{ color: 'var(--primary)' }}>visually.</span>
              </h1>
              <p style={{
                fontSize: '18px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                maxWidth: '400px',
                margin: 0
              }}>
                Create a board to start organizing your projects into beautiful visual columns and interactive cards.
              </p>
            </div>

            <button
              onClick={() => createBoard('Main Workspace')}
              style={{
                width: 'fit-content',
                padding: '14px 32px',
                background: 'var(--primary)',
                color: 'white',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 10px 20px rgba(35, 131, 226, 0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 30px rgba(35, 131, 226, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(35, 131, 226, 0.3)';
              }}
            >
              <Plus size={20} /> Create your first board
            </button>
          </div>
        </div>
        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  const activeBoard = boards.find(b => b._id === activeBoardId) || boards[0];
  const columns = activeBoard.columns.sort((a, b) => a.order - b.order);

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} style={{
          backgroundColor: 'rgba(135, 253, 0, 0.6)',
          color: 'inherit',
          padding: '0',
          borderRadius: '1px'
        }}>{part}</mark>
        : part
    );
  };

  const renderContentWithLinksAndHighlights = (content) => {
    if (!content) return null;
    const parts = content.split(/(https?:\/\/[^\s]+)/g);
    return parts.map((part, i) => {
      if (part.match(/https?:\/\/[^\s]+/)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
          {highlightText(part, globalSearchQuery)}
        </a>;
      }
      return highlightText(part, globalSearchQuery);
    });
  };

  const getTasksByColumn = (colId) => tasks.filter(t => t.columnId === colId).sort((a, b) => a.order - b.order);

  const getFilteredTasksByColumn = (colId) => {
    const colTasks = getTasksByColumn(colId);
    if (!globalSearchQuery) return colTasks;
    const query = globalSearchQuery.toLowerCase();
    return colTasks.filter(t =>
      t.title.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query)) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Get all tasks for this board
    const currentTasks = [...tasks];
    const taskDragged = currentTasks.find(t => t._id === draggableId);
    if (!taskDragged) return;

    // Separate tasks by column to make reordering easier
    const sourceTasks = currentTasks.filter(t => t.columnId === source.droppableId).sort((a, b) => a.order - b.order);
    
    let updatedTasks = [];

    if (source.droppableId === destination.droppableId) {
      // Reordering within the same column
      const reorderedColumnTasks = [...sourceTasks];
      reorderedColumnTasks.splice(source.index, 1);
      reorderedColumnTasks.splice(destination.index, 0, taskDragged);

      // Create final array with updated orders
      const otherTasks = currentTasks.filter(t => t.columnId !== source.droppableId);
      updatedTasks = [
        ...otherTasks,
        ...reorderedColumnTasks.map((t, idx) => ({ ...t, order: idx }))
      ];
    } else {
      // Moving between columns
      const destTasks = currentTasks.filter(t => t.columnId === destination.droppableId).sort((a, b) => a.order - b.order);
      
      const newSourceTasks = [...sourceTasks];
      newSourceTasks.splice(source.index, 1);

      const newDestTasks = [...destTasks];
      // Create a NEW object for the dragged task to avoid mutation
      const updatedTaskDragged = { ...taskDragged, columnId: destination.droppableId };
      newDestTasks.splice(destination.index, 0, updatedTaskDragged);

      const otherTasks = currentTasks.filter(t => t.columnId !== source.droppableId && t.columnId !== destination.droppableId);
      
      updatedTasks = [
        ...otherTasks,
        ...newSourceTasks.map((t, idx) => ({ ...t, order: idx })),
        ...newDestTasks.map((t, idx) => ({ ...t, order: idx }))
      ];
    }

    reorderTasks(updatedTasks);
  };

  const moveTaskColumn = async (task, newColumnIndex) => {
    const newColumn = columns[newColumnIndex];
    if (newColumn) {
      await updateTask(task._id, { columnId: newColumn.id });
    }
  };

  const handleAddTask = async (colId) => {
    const title = newTaskText[colId];
    if (!title || title.trim() === '') return;

    await addTask({
      title,
      board: activeBoardId,
      columnId: colId,
      order: getTasksByColumn(colId).length
    });

    setNewTaskText({ ...newTaskText, [colId]: '' });
  };

  const handleCreateBoard = async () => {
    if (newBoardName.trim() === '') return;
    await createBoard(newBoardName);
    setNewBoardName('');
    setIsAddingBoard(false);
  };

  const startEditingBoard = (board) => {
    setEditingBoardId(board._id);
    setEditingBoardName(board.name);
    setShowBoardMenu(null);
  };

  const handleUpdateBoard = async () => {
    if (editingBoardName.trim() === '') return;
    await updateBoard(editingBoardId, editingBoardName);
    setEditingBoardId(null);
  };
  const handleDeleteBoard = (id, name) => {
    setBoardToDelete({ id, name });
    setShowBoardMenu(null);
  };
  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Breadcrumbs for Board */}
      <style jsx>{`
        .breadcrumbs { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: var(--text-secondary); font-size: 13px; opacity: 0.8; }
        .breadcrumb-item { cursor: pointer; transition: color 0.2s; }
        .breadcrumb-item:hover { color: var(--text-color); text-decoration: underline; }
        .breadcrumb-separator { opacity: 0.4; }
        
        .kanban-board-container {
          display: flex;
          gap: 24px;
          flex: 1;
          padding: 10px 4px 40px 4px;
          overflow-x: auto;
          scroll-behavior: smooth;
        }
        .kanban-column {
          min-width: 300px;
          width: 300px;
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 20px;
          padding: 16px;
          border: 1px solid var(--border-color);
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          backdrop-filter: blur(10px);
          max-height: calc(100vh - 200px);
          overflow: hidden;
          transition: background 0.3s ease, border-color 0.3s ease;
        }
        .new-board-btn {
          padding: 8px 16px;
          background: var(--hover-bg);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .new-board-btn:hover {
          background: var(--border-color);
          color: var(--text-color);
        }
        .menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          background: none;
          border: none;
          color: var(--text-color);
          cursor: pointer;
          transition: all 0.2s;
        }
        .menu-item:hover { background: var(--hover-bg); }
        .menu-item.danger { color: #f43f5e; }
        .menu-item.danger:hover { background: rgba(244, 63, 94, 0.08); }
        .progress-stat { display: flex; align-items: center; gap: 8px; }
        @media (max-width: 1024px) {
          .kanban-board-container { gap: 20px; }
          .kanban-column { min-width: 280px; width: 280px; }
        }
        @media (max-width: 768px) {
          .kanban-board-container { flex-direction: column; overflow-x: hidden; gap: 24px; padding: 0 0 40px 0; }
          .kanban-column { min-width: 100%; width: 100%; }
        }
      `}</style>

      <div className="breadcrumbs" style={{ padding: '0 4px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Folder size={14} style={{ opacity: 0.6 }} />
        <span className="breadcrumb-item" onClick={() => { setActiveBoardId(null); setActiveFolderId(null, 'boards'); }}>Workflow</span>
        {(() => {
          const path = [];
          let currentId = activeBoard.folder;
          let depth = 0;
          while (currentId && depth < 10) {
            const folder = boardFolders.find(f => f._id === currentId);
            if (folder) {
              path.unshift(folder);
              currentId = folder.parentFolder;
              depth++;
            } else break;
          }
          return (
            <>
              {path.map(f => (
                <React.Fragment key={f._id}>
                  <span className="breadcrumb-separator">&gt;</span>
                  <span 
                    className="breadcrumb-item"
                    onClick={() => setActiveFolderId(f._id, 'boards')}
                  >
                    {f.name}
                  </span>
                </React.Fragment>
              ))}
              <span className="breadcrumb-separator">&gt;</span>
              <span className="breadcrumb-item current">{activeBoard.name}</span>
            </>
          );
        })()}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', alignItems: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 50 }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {activeBoard && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {editingBoardId === activeBoard._id ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '12px', background: 'var(--hover-bg)', border: '1px solid var(--border-color)' }}
                >
                  <input
                    autoFocus
                    value={editingBoardName}
                    onChange={(e) => setEditingBoardName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateBoard()}
                    style={{ background: 'none', border: 'none', color: 'var(--text-color)', fontWeight: 700, fontSize: '28px', outline: 'none', width: '240px' }}
                  />
                  <button onClick={handleUpdateBoard} style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer' }}><Check size={24} /></button>
                  <button onClick={() => setEditingBoardId(null)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </motion.div>
              ) : (
                <>
                  <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, color: 'var(--text-color)', letterSpacing: '-0.02em' }}>
                    {activeBoard.name}
                  </h1>
                  <button
                    onClick={() => setShowBoardMenu(showBoardMenu === activeBoard._id ? null : activeBoard._id)}
                    style={{
                      padding: '8px',
                      borderRadius: '10px',
                      color: 'var(--text-secondary)',
                      background: showBoardMenu === activeBoard._id ? 'var(--hover-bg)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <MoreHorizontal size={22} />
                  </button>
                </>
              )}

              <AnimatePresence>
                {showBoardMenu === activeBoard._id && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '0',
                      marginTop: '12px',
                      zIndex: 1000,
                      borderRadius: '14px',
                      padding: '8px',
                      minWidth: '180px',
                      background: 'var(--bg-color)',
                      border: '1px solid var(--border-color)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <button
                      onClick={() => startEditingBoard(activeBoard)}
                      className="menu-item"
                    >
                      <Edit2 size={16} /> Rename Board
                    </button>
                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '6px 8px' }} />
                    <button
                      onClick={() => handleDeleteBoard(activeBoard._id, activeBoard.name)}
                      className="menu-item danger"
                    >
                      <Trash2 size={16} /> Delete Board
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {isAddingBoard ? (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--primary)', background: 'rgba(35, 131, 226, 0.05)' }}
            >
              <input
                autoFocus
                placeholder="Board name..."
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
                style={{ background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '15px', fontWeight: 500, outline: 'none', width: '140px' }}
              />
              <button onClick={handleCreateBoard} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}><Check size={18} /></button>
              <button onClick={() => setIsAddingBoard(false)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </motion.div>
          ) : (
            <button
              onClick={() => setIsAddingBoard(true)}
              className="new-board-btn"
            >
              <Plus size={18} /> New Board
            </button>
          )}
        </div>

        {(() => {
          const totalTasks = columns.reduce((acc, col) => acc + getFilteredTasksByColumn(col.id).length, 0);
          const doneColumn = columns.find(c => c.title && (c.title.toLowerCase() === 'done' || c.title.toLowerCase() === 'completed')) || columns[columns.length - 1];
          const inProgressColumn = columns.find(c => c.title && (c.title.toLowerCase() === 'in progress' || c.title.toLowerCase() === 'doing' || c.title.toLowerCase() === 'progress'));
          const doneTasksCount = doneColumn ? getFilteredTasksByColumn(doneColumn.id).length : 0;
          const inProgressTasksCount = inProgressColumn ? getFilteredTasksByColumn(inProgressColumn.id).length : 0;
          const percentDone = totalTasks === 0 ? 0 : Math.round((doneTasksCount / totalTasks) * 100);

          if (totalTasks === 0) return null;

          return (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '10px 20px', background: 'var(--hover-bg)', borderRadius: '100px', border: '1px solid var(--border-color)' }}
            >
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: 500 }}>
                <span className="progress-stat">
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-secondary)', opacity: 0.4 }} />
                  {totalTasks - doneTasksCount - inProgressTasksCount}
                </span>
                {inProgressColumn && (
                  <span className="progress-stat">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                    {inProgressTasksCount}
                  </span>
                )}
                <span className="progress-stat">
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  {doneTasksCount}
                </span>
              </div>

              <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '80px', height: '6px', borderRadius: '3px', background: 'rgba(0,0,0,0.05)', overflow: 'hidden', position: 'relative' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentDone}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)' }} 
                  />
                </div>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-color)', width: '40px' }}>
                  {percentDone}%
                </span>
              </div>
            </motion.div>
          );
        })()}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board-container">
          {columns.map((col, cIndex) => (
            <div key={col.id} className="kanban-column" style={{
              background: cIndex === 0 ? 'rgba(239, 68, 68, 0.03)' : cIndex === 1 ? 'rgba(245, 158, 11, 0.03)' : 'rgba(16, 185, 129, 0.03)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '8px', 
                    background: cIndex === 0 ? 'rgba(239, 68, 68, 0.1)' : cIndex === 1 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                    color: cIndex === 0 ? '#ef4444' : cIndex === 1 ? '#f59e0b' : '#10b981', 
                    fontSize: '11px', 
                    fontWeight: 800,
                    letterSpacing: '0.05em'
                  }}>
                    {col.title.toUpperCase()}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, opacity: 0.6 }}>
                    {getFilteredTasksByColumn(col.id).length}
                  </span>
                </div>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      minHeight: '200px',
                      padding: '4px 8px',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      scrollbarWidth: 'none',
                      transition: 'background 0.2s ease',
                      background: snapshot.isDraggingOver ? 'var(--hover-bg)' : 'transparent',
                      borderRadius: '4px'
                    }}
                  >
                    {getFilteredTasksByColumn(col.id).map((task, index) => {
                      return (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => {
                            const cardContent = (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  marginBottom: snapshot.isDragging ? 0 : '8px',
                                  outline: 'none',
                                  zIndex: 10000
                                }}
                              >
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  onClick={() => setSelectedTask(task)}
                                  style={{
                                    position: 'relative',
                                    padding: '16px',
                                    borderRadius: '16px',
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid var(--border-color)',
                                    boxShadow: snapshot.isDragging ? '0 20px 40px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.03)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    cursor: 'pointer'
                                  }}
                                  whileHover={{ scale: 1.01, borderColor: 'var(--primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
                                >
                                  <div className="card-actions" style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '2px', background: 'var(--bg-color)', borderRadius: '4px', padding: '2px' }}>
                                    {cIndex > 0 && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleMoveTask(task, 'left'); }}
                                        style={{ padding: '2px', borderRadius: '4px', color: 'var(--text-secondary)', background: 'none', border: 'none' }}
                                        title="Move Left"
                                      >
                                        <ChevronLeft size={14} />
                                      </button>
                                    )}
                                    {cIndex < columns.length - 1 && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleMoveTask(task, 'right'); }}
                                        style={{ padding: '2px', borderRadius: '4px', color: 'var(--text-secondary)', background: 'none', border: 'none' }}
                                        title="Move Right"
                                      >
                                        <ChevronRight size={14} />
                                      </button>
                                    )}
                                  </div>

                                  {(task.priority && task.priority !== 'none') && (
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', paddingRight: '40px' }}>
                                      <span style={{
                                        fontSize: '10px',
                                        padding: '1px 5px',
                                        borderRadius: '3px',
                                        fontWeight: 700,
                                        background: task.priority === 'high' ? '#ffebf0' : task.priority === 'medium' ? '#fff9db' : '#eefcf1',
                                        color: task.priority === 'high' ? '#ff4d4d' : task.priority === 'medium' ? '#fab005' : '#0ca678'
                                      }}>
                                        {task.priority.toUpperCase()}
                                      </span>
                                    </div>
                                  )}

                                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-color)', lineHeight: 1.5, paddingRight: '32px' }}>
                                    {highlightText(task.title, globalSearchQuery)}
                                  </h4>

                                  {(task.description || task.dueDate || (task.checklist && task.checklist.length > 0)) && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                      {task.dueDate && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                          <Calendar size={12} />
                                          <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                                        </div>
                                      )}

                                      {task.checklist && task.checklist.length > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                          <Check size={12} />
                                          <span>{task.checklist.filter(c => c.completed).length}/{task.checklist.length}</span>
                                        </div>
                                      )}

                                      {task.description && (
                                        <div style={{ color: 'var(--text-secondary)' }}>
                                          <MoreHorizontal size={12} />
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {task.tags && task.tags.length > 0 && (
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                                      {task.tags.map((tag, i) => (
                                        <span key={i} style={{ fontSize: '10px', color: 'var(--text-secondary)', background: 'var(--hover-bg)', padding: '1px 4px', borderRadius: '3px' }}>
                                          #{highlightText(tag, globalSearchQuery)}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </motion.div>
                              </div>
                            );

                            if (snapshot.isDragging && typeof document !== 'undefined') {
                              return createPortal(cardContent, document.body);
                            }
                            return cardContent;
                          }}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}

                    <motion.div 
                      layout
                      style={{ marginTop: '4px' }}
                    >
                      <div style={{
                        padding: '12px',
                        borderRadius: '12px',
                        border: '2px dashed var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                        fontWeight: 500,
                        background: 'rgba(255,255,255,0.2)',
                        transition: 'all 0.2s',
                        cursor: 'text'
                      }}>
                        <Plus size={16} />
                        <input
                          type="text"
                          placeholder="Add new task..."
                          value={newTaskText[col.id] || ''}
                          onChange={(e) => setNewTaskText({ ...newTaskText, [col.id]: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTask(col.id)}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: 'var(--text-color)', 
                            outline: 'none',
                            width: '100%',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </motion.div>
                  </div>
                )}
              </Droppable>
            </div>
          ))}


        </div>
      </DragDropContext>
      {localTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }} onClick={() => setSelectedTask(null)}>
          <div style={{
            width: '600px',
            maxHeight: '90vh',
            background: 'var(--bg-color)',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Kanban size={20} color="var(--primary)" />
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Task Details</h2>
              </div>
              <button onClick={() => setSelectedTask(null)} style={{ color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Title</label>
                <input
                  value={localTask.title || ''}
                  onChange={(e) => {
                    setLocalTask({ ...localTask, title: e.target.value });
                  }}
                  onBlur={() => {
                    handleUpdateTaskDetail(localTask._id, localTask);
                  }}
                  style={{ width: '100%', padding: '10px', fontSize: '16px', fontWeight: 500, borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--hover-bg)', color: 'var(--text-color)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Priority</label>
                <select
                  value={localTask.priority || 'none'}
                  onChange={(e) => {
                    const newPriority = e.target.value;
                    setLocalTask({ ...localTask, priority: newPriority });
                    handleUpdateTaskDetail(localTask._id, { priority: newPriority });
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--hover-bg)', color: 'var(--text-color)', outline: 'none' }}
                >
                  <option value="none">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Description</label>
                {isDescFocused ? (
                  <textarea
                    autoFocus
                    rows={4}
                    value={localTask.description || ''}
                    onChange={(e) => {
                      setLocalTask({ ...localTask, description: e.target.value });
                    }}
                    onBlur={() => {
                      setIsDescFocused(false);
                      handleUpdateTaskDetail(localTask._id, localTask);
                    }}
                    placeholder="Add a more detailed description..."
                    style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--hover-bg)', color: 'var(--text-color)', outline: 'none', resize: 'none', fontSize: '14px' }}
                  />
                ) : (
                  <div
                    onClick={() => setIsDescFocused(true)}
                    style={{ width: '100%', padding: '12px', minHeight: '80px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--hover-bg)', color: 'var(--text-color)', fontSize: '14px', whiteSpace: 'pre-wrap', cursor: 'text' }}
                  >
                    {localTask.description ? renderContentWithLinksAndHighlights(localTask.description) : (
                      <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Add a more detailed description...</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Subtasks</label>
                  <button onClick={handleAddSubtask} style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: 600 }}>+ Add</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {localTask.checklist && localTask.checklist.map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '6px', background: 'var(--hover-bg)' }}>
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleSubtask(index)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <input
                        value={item.text}
                        onChange={(e) => updateSubtaskText(index, e.target.value)}
                        style={{ flex: 1, background: 'none', border: 'none', color: item.completed ? 'var(--text-secondary)' : 'var(--text-color)', textDecoration: item.completed ? 'line-through' : 'none', outline: 'none' }}
                      />
                      <button onClick={() => removeSubtask(index)} style={{ color: '#ef4444', padding: '4px' }}><Trash2 size={14} /></button>
                    </div>
                  ))}
                  {(!localTask.checklist || localTask.checklist.length === 0) && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>No subtasks yet.</p>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Tags (comma separated)</label>
                <input
                  value={localTask.tagsString !== undefined ? localTask.tagsString : (localTask.tags ? localTask.tags.join(', ') : '')}
                  onChange={(e) => {
                    setLocalTask({ ...localTask, tagsString: e.target.value });
                  }}
                  onBlur={(e) => {
                    const newTags = e.target.value.split(',').map(s => s.trim()).filter(s => s !== '');
                    const updatedTask = { ...localTask, tags: newTags };
                    delete updatedTask.tagsString; // clear local string so it formats from array
                    setLocalTask(updatedTask);
                    handleUpdateTaskDetail(localTask._id, updatedTask);
                  }}
                  placeholder="e.g. urgent, backend, design"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--hover-bg)', color: 'var(--text-color)', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ padding: '20px 24px', background: 'var(--hover-bg)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 500 }}
              >
                <Trash2 size={16} /> Delete Task
              </button>
              <button
                onClick={() => setSelectedTask(null)}
                style={{ padding: '8px 20px', background: 'var(--primary)', color: 'white', borderRadius: '6px', fontWeight: 600 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete this task?"
        footer={
          <>
            <button
              onClick={() => setShowDeleteModal(false)}
              style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--text-color)', background: 'var(--hover-bg)', border: '1px solid var(--border-color)' }}
            >
              Cancel
            </button>
            <button
              onClick={() => { deleteTask(localTask._id); setSelectedTask(null); setShowDeleteModal(false); }}
              style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              Delete
            </button>
          </>
        }
      >
        <p>This will permanently remove the task and all its subtasks. This action cannot be undone.</p>
      </Modal>

      <Modal
        isOpen={!!boardToDelete}
        onClose={() => setBoardToDelete(null)}
        title="Delete board?"
        footer={
          <>
            <button
              onClick={() => setBoardToDelete(null)}
              style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--text-color)', background: 'var(--hover-bg)', border: '1px solid var(--border-color)' }}
            >
              Cancel
            </button>
            <button
              onClick={async () => { await deleteBoard(boardToDelete.id); setBoardToDelete(null); }}
              style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              Delete
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete "{boardToDelete?.name}"? All tasks will be permanently lost. This action cannot be undone.</p>
      </Modal>

      <style jsx>{`
        div:hover > button {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
