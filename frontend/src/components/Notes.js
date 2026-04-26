"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import useStore from '../store/useStore';
import { Trash2, FileText, Clock, AlignLeft, Tag, X, Folder, Download } from 'lucide-react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';

const TiptapEditor = dynamic(() => import('./TiptapEditor'), { ssr: false });

export default function Notes() {
  const { notes, updateNote, deleteNote, activeNoteId, setActiveNoteId, noteFolders } = useStore();
  const [currentNote, setCurrentNote] = useState({ title: '', content: '', tags: [], folder: null });
  const [tagInput, setTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [lastSavedNote, setLastSavedNote] = useState({ title: '', content: '', tags: [], folder: null });

  // Sync state with store
  useEffect(() => {
    if (activeNoteId) {
      const note = notes.find(n => n._id === activeNoteId);
      if (note) {
        setCurrentNote(note);
        setLastSavedNote(note);
      }
    } else {
      setCurrentNote({ title: '', content: '', tags: [], folder: null });
    }
  }, [activeNoteId, notes]);

  // Auto-save logic
  useEffect(() => {
    if (!currentNote._id) return;
    
    const timer = setTimeout(() => {
      // Safety Guard: Don't allow saving empty content if the note is known to have content in the store
      const noteInStore = notes.find(n => n._id === currentNote._id);
      const isAccidentalWipe = noteInStore?.content && !currentNote.content;
      
      const hasChanges = 
        currentNote.title !== lastSavedNote.title || 
        (currentNote.content !== lastSavedNote.content && !isAccidentalWipe) ||
        JSON.stringify(currentNote.tags) !== JSON.stringify(lastSavedNote.tags) ||
        currentNote.folder !== lastSavedNote.folder;

      if (hasChanges) {
        updateNote(currentNote._id, {
          title: currentNote.title,
          content: currentNote.content,
          tags: currentNote.tags,
          folder: currentNote.folder
        });
        setLastSavedNote(currentNote);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentNote, lastSavedNote, updateNote]);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      if (!currentNote.tags?.includes(tagInput.trim())) {
        const newTags = [...(currentNote.tags || []), tagInput.trim()];
        setCurrentNote(prev => ({ ...prev, tags: newTags }));
      }
      setTagInput('');
      setIsAddingTag(false);
    }
  };

  const removeTag = (tagToRemove) => {
    const newTags = currentNote.tags.filter(t => t !== tagToRemove);
    setCurrentNote(prev => ({ ...prev, tags: newTags }));
  };

  const handleExportPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.querySelector('.ProseMirror');
    const opt = {
      margin: 10,
      filename: `${currentNote.title || 'note'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      await deleteNote(currentNote._id);
      setActiveNoteId(null);
    }
  };

  if (!currentNote._id) {
    return (
      <div className="no-note-selected">
        <FileText size={48} strokeWidth={1} style={{ marginBottom: '20px', opacity: 0.2 }} />
        <h3>Select a note to view or edit</h3>
        <p>Choose from your library or create a new one to get started.</p>
        <style jsx>{`
          .no-note-selected { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-secondary); background: var(--bg-color); height: 100%; }
          h3 { font-weight: 500; margin-bottom: 8px; color: var(--text-color); }
        `}</style>
      </div>
    );
  }

  const updatedAt = currentNote.updatedAt ? format(new Date(currentNote.updatedAt), 'MMM d, h:mm a') : 'Just now';
  const wordCount = currentNote.content ? currentNote.content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(w => w.length > 0).length : 0;

  return (
    <div className="notes-layout">
      <style jsx>{`
        .notes-layout { display: flex; height: 100%; overflow: hidden; width: 100%; }
        .notes-editor-container { flex: 1; display: flex; background: var(--bg-color); overflow: hidden; }
        #editor-scroll-container { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
        .notes-editor-inner { max-width: 900px; width: 100%; padding: 60px 80px; margin: 0 auto; }
        .notes-metadata-panel { width: 300px; border-left: 1px solid var(--border-color); background: var(--sidebar-bg); display: flex; flex-direction: column; flex-shrink: 0; }
        
        .meta-group { display: flex; flex-direction: column; gap: 16px; }
        .meta-item { display: flex; align-items: center; gap: 12px; }
        .meta-icon { color: var(--text-secondary); opacity: 0.7; }
        .meta-content { display: flex; flex-direction: column; }
        .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 2px; }
        .meta-value { font-size: 13px; color: var(--text-color); font-weight: 500; }
        .meta-select { background: transparent; border: none; color: var(--text-color); font-size: 13px; font-weight: 500; outline: none; padding: 0; cursor: pointer; }
        .tag-pill { display: inline-flex; align-items: center; gap: 4px; background: var(--hover-bg); padding: 2px 10px; border-radius: 14px; font-size: 12px; border: 1px solid var(--border-color); }
        .tag-input { background: transparent; border: 1px solid var(--primary); color: var(--text-color); font-size: 12px; padding: 2px 10px; border-radius: 14px; outline: none; width: 100px; }
        .add-tag-btn { color: var(--text-secondary); font-size: 12px; padding: 2px 10px; border-radius: 14px; background: transparent; border: 1px dashed var(--border-color); cursor: pointer; }
        
        .action-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; background: var(--hover-bg); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-color); font-size: 13px; font-weight: 500; cursor: pointer; margin-bottom: 8px; transition: all 0.2s; text-align: left; }
        .action-btn:hover { background: var(--border-color); transform: translateY(-1px); }
        .action-btn.delete { color: var(--danger); border-color: rgba(239, 68, 68, 0.2); }
        .action-btn.delete:hover { background: rgba(239, 68, 68, 0.1); }
      `}</style>

      <div className="notes-editor-container">
        <div id="editor-scroll-container">
          <div className="notes-editor-inner">
            <input
              type="text"
              className="note-title-input"
              value={currentNote.title || ''}
              onChange={(e) => setCurrentNote(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Note Title"
              style={{
                fontSize: '32px',
                fontWeight: '700',
                border: 'none',
                outline: 'none',
                width: '100%',
                marginBottom: '20px',
                background: 'transparent',
                color: 'var(--text-color)'
              }}
            />
            <TiptapEditor
              noteId={currentNote._id}
              initialContent={currentNote.content || ''}
              onChange={(content) => setCurrentNote(prev => ({ ...prev, content }))}
              onSave={() => updateNote(currentNote._id, { content: currentNote.content })}
            />
          </div>
        </div>
      </div>

      <div className="notes-metadata-panel">
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} /> Note Properties
          </h3>

          <div className="meta-group">
            <div className="meta-item">
              <div className="meta-icon"><Clock size={16} /></div>
              <div className="meta-content">
                <span className="meta-label">Last Modified</span>
                <span className="meta-value">{updatedAt}</span>
              </div>
            </div>

            <div className="meta-item">
              <div className="meta-icon"><AlignLeft size={16} /></div>
              <div className="meta-content">
                <span className="meta-label">Words</span>
                <span className="meta-value">{wordCount} words</span>
              </div>
            </div>

            <div className="meta-item">
              <div className="meta-icon"><Folder size={16} /></div>
              <div className="meta-content">
                <span className="meta-label">Folder</span>
                <select 
                  className="meta-select"
                  value={currentNote.folder || ''}
                  onChange={(e) => setCurrentNote(prev => ({ ...prev, folder: e.target.value || null }))}
                >
                  <option value="">No Folder</option>
                  {noteFolders.map(f => (
                    <option key={f._id} value={f._id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="meta-item" style={{ alignItems: 'flex-start' }}>
              <div className="meta-icon" style={{ marginTop: '4px' }}><Tag size={16} /></div>
              <div className="meta-content">
                <span className="meta-label">Tags</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {currentNote.tags?.map(tag => (
                    <span key={tag} className="tag-pill">
                      {tag}
                      <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeTag(tag)} />
                    </span>
                  ))}
                  {isAddingTag ? (
                    <input
                      autoFocus
                      className="tag-input"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      onBlur={() => setIsAddingTag(false)}
                      placeholder="Tag name..."
                    />
                  ) : (
                    <button className="add-tag-btn" onClick={() => setIsAddingTag(true)}>+ Add Tag</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
            <button className="action-btn" onClick={handleExportPDF}>
              <Download size={16} /> Export as PDF
            </button>
            <button className="action-btn delete" onClick={handleDelete}>
              <Trash2 size={16} /> Delete Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
