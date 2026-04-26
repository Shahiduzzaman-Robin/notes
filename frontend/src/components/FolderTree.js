"use client";
import { useState, useEffect } from 'react';
import { Folder, ChevronRight, ChevronDown, FileText, Plus, MoreVertical, Edit2, Trash2, FolderPlus, Kanban } from 'lucide-react';
import useStore from '../store/useStore';
import Modal from './Modal';

export default function FolderTree({ folders, notes = [], boards = [], parentId = null, depth = 0, type = 'all' }) {
  const { 
    activeNoteId, setActiveNoteId, addNote, 
    activeBoardId, setActiveBoardId, createBoard,
    activeFolderId, setActiveFolderId,
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
      // Removed inContent check to improve performance significantly
      const inTags = (item.tags || []).some(t => t.toLowerCase().includes(query));
      return inTitle || inTags;
    } else if (itemType === 'board') {
      return (item.name || '').toLowerCase().includes(query);
    }
    return false;
  };

  const currentFolders = folders.filter(f => !f.parentFolder && !parentId || f.parentFolder === parentId);
  const currentNotes = type === 'boards' ? [] : notes.filter(n => (!n.folder && !parentId || n.folder === parentId) && matchesSearch(n, 'note'));
  const currentBoards = type === 'notes' ? [] : boards.filter(b => (!b.folder && !parentId || b.folder === parentId) && matchesSearch(b, 'board'));

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

  // Auto-expand to active note/board
  useEffect(() => {
    if (activeNoteId || activeBoardId) {
      const newExpanded = { ...expandedFolders };
      let found = false;

      const expandPath = (itemId, itemType) => {
        let currentFolderId = null;
        if (itemType === 'note') {
          const note = notes.find(n => n._id === itemId);
          currentFolderId = note?.folder;
        } else {
          const board = boards.find(b => b._id === itemId);
          currentFolderId = board?.folder;
        }

        while (currentFolderId) {
          newExpanded[currentFolderId] = true;
          const folder = folders.find(f => f._id === currentFolderId);
          currentFolderId = folder?.parentFolder;
        }
        found = true;
      };

      if (activeNoteId) expandPath(activeNoteId, 'note');
      if (activeBoardId) expandPath(activeBoardId, 'board');

      if (found) {
        setExpandedFolders(prev => ({ ...prev, ...newExpanded }));
      }
    }
  }, [activeNoteId, activeBoardId, notes, boards, folders]);

  const handleAddSubNote = (folderId) => {
    setModal({ isOpen: true, type: 'createNote', folder: { _id: folderId }, value: '' });
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
        }
        if (!expandedFolders[modal.folder._id]) toggleFolder(modal.folder._id);
      }
    } else if (modal.type === 'createNote') {
      if (modal.value.trim()) {
        const newNote = await addNote({ title: modal.value, content: '', folder: modal.folder._id });
        if (newNote) {
          setActiveNoteId(newNote._id);
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
            <span 
              onClick={(e) => { e.stopPropagation(); setActiveFolderId(folder._id, type); }}
              style={{ 
                flex: 1, 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                fontWeight: activeFolderId === folder._id ? 600 : 400,
                color: activeFolderId === folder._id ? 'var(--text-color)' : 'inherit'
              }}
            >
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

      {currentNotes.map(note => (
        <div 
          key={note._id}
          className="tree-item note-item"
          onClick={() => { setActiveNoteId(note._id); setActiveTab('notes'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px 8px 4px 18px', // Slightly offset to align with folder content
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            color: activeNoteId === note._id ? 'var(--text-color)' : 'var(--text-secondary)',
            gap: '8px',
            background: activeNoteId === note._id ? 'var(--hover-bg)' : 'transparent',
            fontWeight: activeNoteId === note._id ? 600 : 400,
            transition: 'background 0.1s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
          onMouseOut={(e) => e.currentTarget.style.background = activeNoteId === note._id ? 'var(--hover-bg)' : 'transparent'}
        >
          <FileText size={14} style={{ opacity: 0.7, minWidth: '14px' }} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {note.title || 'Untitled'}
          </span>
        </div>
      ))}

      {currentBoards.map(board => (
        <div 
          key={board._id}
          className="tree-item board-item"
          onClick={() => { setActiveBoardId(board._id); setActiveTab('boards'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px 8px 4px 18px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            color: activeBoardId === board._id ? 'var(--text-color)' : 'var(--text-secondary)',
            gap: '8px',
            background: activeBoardId === board._id ? 'var(--hover-bg)' : 'transparent',
            fontWeight: activeBoardId === board._id ? 600 : 400,
            transition: 'background 0.1s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
          onMouseOut={(e) => e.currentTarget.style.background = activeBoardId === board._id ? 'var(--hover-bg)' : 'transparent'}
        >
          <Kanban size={14} style={{ opacity: 0.7, minWidth: '14px' }} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {board.name}
          </span>
        </div>
      ))}

      <Modal 
        isOpen={modal.isOpen} 
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={
          modal.type === 'create' ? 'Create Subfolder' : 
          modal.type === 'createBoard' ? 'Create New Board' :
          modal.type === 'createNote' ? 'Create New Note' :
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
              {modal.type === 'createBoard' ? 'Board Name' : modal.type === 'createNote' ? 'Note Title' : 'Folder Name'}
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
