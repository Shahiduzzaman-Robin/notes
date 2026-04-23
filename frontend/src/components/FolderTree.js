"use client";
import { useState, useEffect } from 'react';
import { Folder, ChevronRight, ChevronDown, FileText, Plus, MoreVertical, Edit2, Trash2, FolderPlus, Kanban } from 'lucide-react';
import useStore from '../store/useStore';
import Modal from './Modal';

export default function FolderTree({ folders, notes = [], boards = [], parentId = null, depth = 0, type = 'all' }) {
  const { 
    activeNoteId, setActiveNoteId, addNote, 
    activeBoardId, setActiveBoardId, createBoard,
    addFolder, updateFolder, deleteFolder, globalSearchQuery 
  } = useStore();
  
  const [expandedFolders, setExpandedFolders] = useState({});
  const [modal, setModal] = useState({ isOpen: false, type: '', folder: null, value: '' });

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const matchesSearch = (item, itemType) => {
    if (!globalSearchQuery) return true;
    const query = globalSearchQuery.toLowerCase();
    if (itemType === 'note') {
      const inTitle = (item.title || '').toLowerCase().includes(query);
      const inContent = (item.content || '').toLowerCase().includes(query);
      const inTags = (item.tags || []).some(t => t.toLowerCase().includes(query));
      return inTitle || inContent || inTags;
    } else if (itemType === 'board') {
      return (item.name || '').toLowerCase().includes(query);
    }
    return false;
  };

  const currentFolders = folders.filter(f => f.parentFolder === parentId);
  const currentNotes = type === 'boards' ? [] : notes.filter(n => n.folder === parentId).filter(n => matchesSearch(n, 'note'));
  const currentBoards = type === 'notes' ? [] : boards.filter(b => b.folder === parentId).filter(b => matchesSearch(b, 'board'));

  useEffect(() => {
    if (globalSearchQuery) {
      const newExpanded = { ...expandedFolders };
      folders.forEach(f => {
        const hasNoteMatch = notes.some(n => n.folder === f._id && matchesSearch(n, 'note'));
        const hasBoardMatch = boards.some(b => b.folder === f._id && matchesSearch(b, 'board'));
        if (hasNoteMatch || hasBoardMatch) newExpanded[f._id] = true;
      });
      setExpandedFolders(newExpanded);
    }
  }, [globalSearchQuery, folders, notes, boards]);

  const handleAddSubNote = async (folderId) => {
    const newNote = await addNote({ title: '', content: '', folder: folderId });
    if (newNote) {
      setActiveNoteId(newNote._id);
    }
    if (!expandedFolders[folderId]) toggleFolder(folderId);
  };

  const handleAddSubBoard = (folderId) => {
    setModal({ isOpen: true, type: 'createBoard', folder: { _id: folderId }, value: '' });
  };

  const handleAddSubFolder = (folderId) => {
    setModal({ isOpen: true, type: 'create', folder: { _id: folderId }, value: '' });
  };

  const handleRenameFolder = (folder) => {
    setModal({ isOpen: true, type: 'rename', folder, value: folder.name });
  };

  const handleDeleteFolder = (folder) => {
    setModal({ isOpen: true, type: 'delete', folder, value: '' });
  };

  const handleModalSubmit = async () => {
    if (modal.type === 'create') {
      if (modal.value.trim()) {
        await addFolder({ name: modal.value, parentFolder: modal.folder._id, type });
        if (!expandedFolders[modal.folder._id]) toggleFolder(modal.folder._id);
      }
    } else if (modal.type === 'createBoard') {
      if (modal.value.trim()) {
        const newBoard = await createBoard(modal.value, modal.folder._id);
        if (newBoard) {
          setActiveBoardId(newBoard._id);
          // Assuming we want to switch tab or just show it?
          // page.js handles tab state, FolderTree just handles clicking
        }
        if (!expandedFolders[modal.folder._id]) toggleFolder(modal.folder._id);
      }
    } else if (modal.type === 'rename') {
      if (modal.value.trim() && modal.value !== modal.folder.name) {
        await updateFolder(modal.folder._id, { name: modal.value }, type);
      }
    } else if (modal.type === 'delete') {
      await deleteFolder(modal.folder._id, type);
    }
    setModal({ isOpen: false, type: '', folder: null, value: '' });
  };

  return (
    <div className="folder-tree" style={{ marginLeft: depth > 0 ? '12px' : '0' }}>
      {currentFolders.map(folder => (
        <div key={folder._id} className="folder-item-container">
          <div 
            className="folder-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              gap: '4px',
              position: 'relative',
              transition: 'background 0.1s'
            }}
            onClick={() => toggleFolder(folder._id)}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {expandedFolders[folder._id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Folder size={14} className="text-primary" />
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {folder.name}
            </span>
            
            <div className="folder-actions">
              <button onClick={(e) => { e.stopPropagation(); handleAddSubFolder(folder._id); }} title="New Subfolder" className="action-btn">
                <FolderPlus size={12} />
              </button>
              {type !== 'boards' && (
                <button onClick={(e) => { e.stopPropagation(); handleAddSubNote(folder._id); }} title="New Note" className="action-btn">
                  <Plus size={12} />
                </button>
              )}
              {type !== 'notes' && (
                <button onClick={(e) => { e.stopPropagation(); handleAddSubBoard(folder._id); }} title="New Board" className="action-btn">
                  <Kanban size={12} />
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); handleRenameFolder(folder); }} title="Rename" className="action-btn">
                <Edit2 size={12} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }} title="Delete" className="action-btn danger">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          
          {expandedFolders[folder._id] && (
            <FolderTree 
              folders={folders} 
              notes={notes} 
              boards={boards}
              parentId={folder._id} 
              depth={depth + 1} 
              type={type}
            />
          )}
        </div>
      ))}

      {/* Boards List */}
      {currentBoards.map(board => (
        <div 
          key={board._id}
          onClick={() => setActiveBoardId(board._id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '13px',
            padding: '4px 8px 4px 22px',
            borderRadius: '4px',
            cursor: 'pointer',
            color: board._id === activeBoardId ? 'var(--text-color)' : 'var(--text-secondary)',
            fontWeight: board._id === activeBoardId ? 600 : 400,
            background: board._id === activeBoardId ? 'var(--hover-bg)' : 'transparent',
            transition: 'background 0.1s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            gap: '8px'
          }}
          onMouseOver={(e) => { if (board._id !== activeBoardId) e.currentTarget.style.background = 'var(--hover-bg)' }}
          onMouseOut={(e) => { if (board._id !== activeBoardId) e.currentTarget.style.background = 'transparent' }}
        >
          <Kanban size={14} style={{ opacity: 0.7 }} />
          <span>{board.name}</span>
        </div>
      ))}

      {/* Notes List */}
      {currentNotes.map(note => (
        <div 
          key={note._id}
          onClick={() => setActiveNoteId(note._id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '13px',
            padding: '4px 8px 4px 22px',
            borderRadius: '4px',
            cursor: 'pointer',
            color: note._id === activeNoteId ? 'var(--text-color)' : 'var(--text-secondary)',
            fontWeight: note._id === activeNoteId ? 600 : 400,
            background: note._id === activeNoteId ? 'var(--hover-bg)' : 'transparent',
            transition: 'background 0.1s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            gap: '8px'
          }}
          onMouseOver={(e) => { if (note._id !== activeNoteId) e.currentTarget.style.background = 'var(--hover-bg)' }}
          onMouseOut={(e) => { if (note._id !== activeNoteId) e.currentTarget.style.background = 'transparent' }}
        >
          <FileText size={14} style={{ opacity: 0.7 }} />
          <span>{note.title || 'Untitled'}</span>
        </div>
      ))}

      <Modal 
        isOpen={modal.isOpen} 
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={
          modal.type === 'create' ? 'Create Subfolder' : 
          modal.type === 'createBoard' ? 'Create New Board' :
          modal.type === 'rename' ? 'Rename Folder' : 
          'Delete Folder'
        }
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setModal({ ...modal, isOpen: false })} style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: 'var(--text-secondary)', background: 'transparent' }}>
              Cancel
            </button>
            <button onClick={handleModalSubmit} style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: '#fff', background: modal.type === 'delete' ? '#ef4444' : 'var(--primary)', border: 'none', fontWeight: 500, cursor: 'pointer' }}>
              {modal.type === 'delete' ? 'Delete' : 'Save'}
            </button>
          </div>
        }
      >
        {modal.type === 'delete' ? (
          <p>Are you sure you want to delete <strong>{modal.folder?.name}</strong>? All contents will be moved to the root.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {modal.type === 'createBoard' ? 'Board Name' : 'Folder Name'}
            </label>
            <input 
              autoFocus
              type="text"
              value={modal.value}
              onChange={(e) => setModal({ ...modal, value: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') handleModalSubmit(); }}
              placeholder="Enter name..."
              style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--hover-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', outline: 'none', fontSize: '14px' }}
            />
          </div>
        )}
      </Modal>

      <style jsx>{`
        .folder-tree { display: flex; flex-direction: column; gap: 1px; }
        .action-btn { padding: 2px; border-radius: 3px; color: var(--text-secondary); opacity: 0; transition: opacity 0.1s, background 0.1s; }
        .folder-item:hover .action-btn { opacity: 1; }
        .action-btn:hover { background: var(--border-color); color: var(--text-color); }
        .action-btn.danger:hover { color: #ef4444; }
        .folder-actions { display: flex; gap: 2px; }
      `}</style>
    </div>
  );
}
