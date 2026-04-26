"use client";
import { FileText, Kanban, Plus, ChevronRight, Folder } from 'lucide-react';
import { useState } from 'react';
import useStore from '../store/useStore';
import Modal from './Modal';

export default function FolderView({ folderId, type }) {
  const { notes, boards, noteFolders, boardFolders, setActiveNoteId, setActiveBoardId, setActiveFolderId, addNote, createBoard } = useStore();
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  
  const allFolders = type === 'notes' ? noteFolders : boardFolders;
  const currentFolder = folderId 
    ? allFolders.find(f => f._id === folderId) 
    : { name: type === 'notes' ? 'Personal Notes' : 'Management', _id: null };

  const subFolders = allFolders.filter(f => f.parentFolder === (folderId || null));
  const currentNotes = notes.filter(n => n.folder === (folderId || null));
  const currentBoards = boards.filter(b => b.folder === (folderId || null));

  if (!currentFolder && folderId) return null;

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', opacity: 0.5, fontSize: '14px' }}>
        <span>{type === 'notes' ? 'Personal Notes' : 'Management'}</span>
        {folderId && (
          <>
            <ChevronRight size={14} />
            <span>{currentFolder.name}</span>
          </>
        )}
      </div>

      <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '40px', color: 'var(--text-color)' }}>{currentFolder.name}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {/* Folders first */}
        {subFolders.map(folder => (
          <div 
            key={folder._id} 
            onClick={() => setActiveFolderId(folder._id, type)}
            style={{ 
              padding: '16px', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)', 
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: 'var(--bg-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'none'; }}
          >
            <Folder size={24} style={{ color: 'var(--primary)', opacity: 0.8 }} />
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{folder.name}</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Folder</span>
          </div>
        ))}

        {type === 'notes' ? (
          <>
            {currentNotes.map(note => (
              <div 
                key={note._id} 
                onClick={() => setActiveNoteId(note._id)}
                style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-color)', 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'var(--bg-color)'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'none'; }}
              >
                <FileText size={24} style={{ marginBottom: '12px', color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{note.title || 'Untitled'}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {stripHtml(note.content).substring(0, 100) || 'No content'}
                </p>
              </div>
            ))}
            <div 
              onClick={() => { setNewName(''); setIsNoteModalOpen(true); }}
              style={{ 
                padding: '16px', 
                borderRadius: '12px', 
                border: '1px dashed var(--border-color)', 
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--text-secondary)',
                minHeight: '120px'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <Plus size={24} />
              <span style={{ fontSize: '14px' }}>New Note</span>
            </div>
          </>
        ) : (
          <>
            {currentBoards.map(board => (
              <div 
                key={board._id} 
                onClick={() => setActiveBoardId(board._id)}
                style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-color)', 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'var(--bg-color)'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'none'; }}
              >
                <Kanban size={24} style={{ marginBottom: '12px', color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{board.name}</h3>
              </div>
            ))}
            <div 
              onClick={() => { setNewName(''); setIsBoardModalOpen(true); }}
              style={{ 
                padding: '16px', 
                borderRadius: '12px', 
                border: '1px dashed var(--border-color)', 
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--text-secondary)',
                minHeight: '120px'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <Plus size={24} />
              <span style={{ fontSize: '14px' }}>New Board</span>
            </div>
          </>
        )}
      </div>

      <Modal 
        isOpen={isNoteModalOpen} 
        onClose={() => setIsNoteModalOpen(false)}
        title="Create New Note"
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setIsNoteModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: 'var(--text-secondary)', background: 'transparent' }}>Cancel</button>
            <button 
              onClick={async () => {
                if (newName.trim()) {
                  const newNote = await addNote({ title: newName, content: '', folder: folderId });
                  if (newNote) setActiveNoteId(newNote._id);
                  setIsNoteModalOpen(false);
                }
              }} 
              style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: '#fff', background: 'var(--primary)', border: 'none', fontWeight: 500, cursor: 'pointer' }}
            >
              Create Note
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Note Title</label>
          <input 
            autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)} 
            onKeyDown={(e) => { 
              if (e.key === 'Enter' && newName.trim()) {
                (async () => {
                  const newNote = await addNote({ title: newName, content: '', folder: folderId });
                  if (newNote) setActiveNoteId(newNote._id);
                  setIsNoteModalOpen(false);
                })();
              }
            }}
            placeholder="Enter title..." 
            style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--hover-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', outline: 'none', fontSize: '14px' }} 
          />
        </div>
      </Modal>

      <Modal 
        isOpen={isBoardModalOpen} 
        onClose={() => setIsBoardModalOpen(false)}
        title="Create New Board"
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setIsBoardModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: 'var(--text-secondary)', background: 'transparent' }}>Cancel</button>
            <button 
              onClick={async () => {
                if (newName.trim()) {
                  const newBoard = await createBoard(newName, folderId);
                  if (newBoard) setActiveBoardId(newBoard._id);
                  setIsBoardModalOpen(false);
                }
              }} 
              style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: '#fff', background: 'var(--primary)', border: 'none', fontWeight: 500, cursor: 'pointer' }}
            >
              Create Board
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Board Name</label>
          <input 
            autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)} 
            onKeyDown={(e) => { 
              if (e.key === 'Enter' && newName.trim()) {
                (async () => {
                  const newBoard = await createBoard(newName, folderId);
                  if (newBoard) setActiveBoardId(newBoard._id);
                  setIsBoardModalOpen(false);
                })();
              }
            }}
            placeholder="Enter name..." 
            style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--hover-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', outline: 'none', fontSize: '14px' }} 
          />
        </div>
      </Modal>
      </div>
    </div>
  );
}
