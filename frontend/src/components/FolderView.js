"use client";
import { FileText, Kanban, Plus, ChevronRight } from 'lucide-react';
import useStore from '../store/useStore';

export default function FolderView({ folderId, type }) {
  const { notes, boards, noteFolders, boardFolders, setActiveNoteId, setActiveBoardId, addNote, createBoard } = useStore();
  
  const currentFolder = [...noteFolders, ...boardFolders].find(f => f._id === folderId);
  const currentNotes = notes.filter(n => n.folder === folderId);
  const currentBoards = boards.filter(b => b.folder === folderId);

  if (!currentFolder) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', opacity: 0.5, fontSize: '14px' }}>
        <span>{type === 'notes' ? 'Personal Notes' : 'Management'}</span>
        <ChevronRight size={14} />
        <span>{currentFolder.name}</span>
      </div>

      <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '40px', color: 'var(--text-color)' }}>{currentFolder.name}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
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
                  {note.content?.substring(0, 60) || 'No content'}
                </p>
              </div>
            ))}
            <div 
              onClick={() => addNote({ title: '', content: '', folder: folderId })}
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
                color: 'var(--text-secondary)'
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
              onClick={() => createBoard('New Board', folderId)}
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
                color: 'var(--text-secondary)'
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
    </div>
  );
}
