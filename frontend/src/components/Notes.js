"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import useStore from '../store/useStore';
import { Plus, Edit2, Trash2, Pin, Search, FileText, MoreHorizontal, Calendar, ChevronLeft, ChevronRight, Clock, AlignLeft, Type, Tag, X, Folder } from 'lucide-react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import Modal from './Modal';

const TiptapEditor = dynamic(() => import('./TiptapEditor'), { ssr: false });

export default function Notes() {
  const { notes, updateNote, deleteNote, globalSearchQuery, activeNoteId, setActiveNoteId, noteFolders } = useStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '', tags: [], folder: null });
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const contentRef = useRef('');

  const handleDownloadPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    
    // Create a temporary element to hold the styled content for PDF
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 40px; font-family: 'Inter', sans-serif; color: #000; background: #fff;">
        <h1 style="font-size: 32px; margin-bottom: 10px; color: #1a1a1a;">${currentNote.title || 'Untitled'}</h1>
        <div style="font-size: 12px; color: #666; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
          Last edited: ${currentNote.updatedAt ? new Date(currentNote.updatedAt).toLocaleString() : 'Just now'}
        </div>
        <div class="tiptap-content">
          ${currentNote.content}
        </div>
      </div>
      <style>
        .tiptap-content table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        .tiptap-content table td, .tiptap-content table th { border: 1px solid #ddd; padding: 8px; }
        .tiptap-content h1 { font-size: 24px; margin-top: 20px; }
        .tiptap-content h2 { font-size: 20px; margin-top: 15px; }
        .tiptap-content p { line-height: 1.6; margin-bottom: 10px; }
        .tiptap-content .search-result-highlight { background: yellow; }
      </style>
    `;

    const opt = {
      margin: [10, 10],
      filename: `${currentNote.title || 'Note'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save();
  };

  useEffect(() => {
    if (activeNoteId) {
      const note = notes.find(n => n._id === activeNoteId);
      if (note) setCurrentNote(note);
    } else {
      setCurrentNote({ title: '', content: '', folder: null });
    }
  }, [activeNoteId, notes]);

  const handleSave = useCallback(async () => {
    const content = contentRef.current;
    if (!currentNote._id) return;
    
    // Safety check: Don't save if content is empty but we know it should have content
    // This prevents accidental wipes during loading glitches
    const existingNote = notes.find(n => n._id === currentNote._id);
    if (existingNote && existingNote.content && !content) {
      console.warn('Blocked accidental note wipe detected');
      return;
    }

    const noteToSave = { ...currentNote, content };
    await updateNote(currentNote._id, noteToSave);
  }, [currentNote, updateNote, notes]);

  const handleFolderChange = async (folderId) => {
    const fid = folderId === 'root' ? null : folderId;
    const updatedNote = { ...currentNote, folder: fid };
    setCurrentNote(updatedNote);
    if (currentNote._id) await updateNote(currentNote._id, updatedNote);
  };

  const handleContentChange = useCallback((html) => {
    contentRef.current = html;
    setCurrentNote(prev => ({ ...prev, content: html }));
  }, []);

  const handleAddTag = async (e) => {
    if (e.key === 'Enter' && newTag.trim()) {
      const updatedTags = [...(currentNote.tags || []), newTag.trim()];
      const updatedNote = { ...currentNote, tags: updatedTags };
      setCurrentNote(updatedNote);
      if (currentNote._id) await updateNote(currentNote._id, updatedNote);
      setNewTag('');
      setIsAddingTag(false);
    } else if (e.key === 'Escape') {
      setIsAddingTag(false);
      setNewTag('');
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    const updatedTags = (currentNote.tags || []).filter(t => t !== tagToRemove);
    const updatedNote = { ...currentNote, tags: updatedTags };
    setCurrentNote(updatedNote);
    if (currentNote._id) await updateNote(currentNote._id, updatedNote);
  };

  // Strip HTML for word/char counts
  const plainText = currentNote.content ? currentNote.content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const wordCount = plainText ? plainText.split(/\s+/).filter(w => w.length > 0).length : 0;
  const charCount = plainText ? plainText.length : 0;
  const createdAt = currentNote.createdAt ? format(new Date(currentNote.createdAt), 'MMM d, yyyy h:mm a') : 'Just now';
  const updatedAt = currentNote.updatedAt ? format(new Date(currentNote.updatedAt), 'MMM d, yyyy h:mm a') : 'Just now';

  return (
    <div className="notes-layout" style={{ height: '100%' }}>
      <style>{`
        .notes-layout {
          display: flex;
          gap: 0px;
        }
        .notes-editor-container {
          flex: 1;
          display: flex;
          flex-direction: row;
          background: var(--bg-color);
          width: 100%;
          overflow: hidden;
        }
        #editor-scroll-container::-webkit-scrollbar,
        .notes-metadata-panel::-webkit-scrollbar {
          display: none;
        }
        #editor-scroll-container,
        .notes-metadata-panel {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .notes-editor-inner {
          max-width: 900px;
          width: 100%;
          padding: 60px 80px;
          display: flex;
          flex-direction: column;
          margin: 0 auto;
        }
        .notes-metadata-panel {
          width: 280px;
          border-left: 1px solid var(--border-color);
          padding: 32px 20px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          background: var(--sidebar-bg);
          overflow-y: auto;
          flex-shrink: 0;
        }
        .meta-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .meta-group h4 {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          margin: 0;
          font-weight: 600;
        }
        .meta-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          color: var(--text-color);
        }
        .meta-icon {
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        @media (max-width: 1024px) {
          .notes-metadata-panel {
            display: none;
          }
        }
        @media (max-width: 768px) {
          .notes-editor-inner {
            padding: 20px 16px !important;
          }
        }
        .loading-dots:after {
          content: ' .';
          animation: dots 1s steps(5, end) infinite;
        }
        @keyframes dots {
          0%, 20% { content: ' .'; }
          40% { content: ' . .'; }
          60% { content: ' . . .'; }
          80%, 100% { content: ' . . . .'; }
        }
      `}</style>
      
      {/* Editor Area (The "Page") */}
      <div className="notes-editor-container">
        {currentNote._id ? (
          <>
            <div id="editor-scroll-container" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div className="notes-editor-inner">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '4px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={14} />
                      <span>Notes</span>
                    </div>
                    {currentNote.folder && (() => {
                      const path = [];
                      let currentId = currentNote.folder;
                      while (currentId) {
                        const folder = noteFolders.find(f => f._id === currentId);
                        if (folder) {
                          path.unshift(folder);
                          currentId = folder.parentFolder;
                        } else break;
                      }
                      return (
                        <>
                          {path.map(f => (
                            <div key={f._id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <ChevronRight size={12} style={{ opacity: 0.5 }} />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Folder size={14} style={{ color: 'var(--primary)', opacity: 0.8 }} />
                                <span>{f.name}</span>
                              </div>
                            </div>
                          ))}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ChevronRight size={12} style={{ opacity: 0.5 }} />
                            <span style={{ color: 'var(--text-color)', fontWeight: 500 }}>{currentNote.title || 'Untitled'}</span>
                          </div>
                        </>
                      );
                    })()}
                    {!currentNote.folder && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ChevronRight size={12} style={{ opacity: 0.5 }} />
                        <span style={{ color: 'var(--text-color)', fontWeight: 500 }}>{currentNote.title || 'Untitled'}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', opacity: 0.6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> Last edited {updatedAt}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px', opacity: 0.6 }}>
                  <button onClick={() => setCurrentNote({...currentNote, isPinned: !currentNote.isPinned})} style={{ color: currentNote.isPinned ? 'var(--primary)' : 'inherit', background: 'none', border: 'none', cursor: 'pointer' }}><Pin size={18} /></button>
                  <button onClick={() => setShowDeleteModal(true)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                </div>

                <input 
                  type="text" 
                  value={currentNote.title}
                  onChange={e => {
                    const newNote = {...currentNote, title: e.target.value};
                    setCurrentNote(newNote);
                  }}
                  onBlur={() => handleSave()}
                  placeholder="Untitled"
                  style={{ fontSize: '42px', fontWeight: 700, background: 'transparent', border: 'none', color: 'var(--text-color)', width: '100%', marginBottom: '20px', outline: 'none' }}
                />
                
                <div style={{ flex: 1, minHeight: '500px', position: 'relative' }}>
                  {currentNote.content === undefined && (
                    <div style={{ position: 'absolute', top: '100px', left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                      <div className="loading-dots">Loading content</div>
                    </div>
                  )}
                  <TiptapEditor 
                    noteId={currentNote._id}
                    initialContent={currentNote.content || ''}
                    onChange={handleContentChange}
                    onSave={handleSave}
                    searchQuery={globalSearchQuery}
                  />
                </div>
              </div>
            </div>

            {/* Right Side Metadata Panel */}
            <div className="notes-metadata-panel">
              <div className="meta-group">
                <h4>Properties</h4>
                <div className="meta-item">
                  <AlignLeft size={16} className="meta-icon" />
                  <span style={{ flex: 1 }}>Word Count</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{wordCount}</span>
                </div>
                <div className="meta-item">
                  <AlignLeft size={16} className="meta-icon" />
                  <span style={{ flex: 1 }}>Characters</span>
                  <span>{currentNote.content ? currentNote.content.length : 0}</span>
                </div>
              </div>

              <div className="meta-group">
                <h4>Actions</h4>
                <button 
                  onClick={handleDownloadPDF}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    background: 'var(--hover-bg)', 
                    border: '1px solid var(--border-color)', 
                    color: 'var(--text-color)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <FileText size={16} />
                  Export as PDF
                </button>
              </div>

              <div className="meta-group">
                <h4>History</h4>
                <div className="meta-item">
                  <Calendar size={16} className="meta-icon" style={{ marginTop: '2px' }} />
                  <span style={{ flex: 1 }}>Created</span>
                  <span style={{ color: 'var(--text-secondary)', textAlign: 'right', whiteSpace: 'nowrap' }}>{createdAt}</span>
                </div>
                <div className="meta-item">
                  <Clock size={16} className="meta-icon" style={{ marginTop: '2px' }} />
                  <span style={{ flex: 1 }}>Updated</span>
                  <span style={{ color: 'var(--text-secondary)', textAlign: 'right', whiteSpace: 'nowrap' }}>{updatedAt}</span>
                </div>
              </div>

              <div className="meta-group">
                <h4>Organization</h4>
                <div className="meta-item">
                  <Folder size={16} className="meta-icon" />
                  <span style={{ flex: 1 }}>Folder</span>
                  <select 
                    value={currentNote.folder || 'root'} 
                    onChange={(e) => handleFolderChange(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', outline: 'none', textAlign: 'right', cursor: 'pointer', maxWidth: '140px' }}
                  >
                    <option value="root">No Folder</option>
                    {noteFolders.map(f => (
                      <option key={f._id} value={f._id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="meta-item" style={{ alignItems: 'flex-start' }}>
                  <Tag size={16} className="meta-icon" style={{ marginTop: '2px' }} />
                  <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(currentNote.tags || []).map(t => (
                      <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--hover-bg)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', color: 'var(--text-color)' }}>
                        {t}
                        <X size={12} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => handleRemoveTag(t)} />
                      </span>
                    ))}
                    {isAddingTag ? (
                      <input 
                        autoFocus
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={handleAddTag}
                        onBlur={() => { setIsAddingTag(false); setNewTag(''); }}
                        placeholder="Type tag & Enter"
                        style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)', fontSize: '12px', padding: '2px 8px', borderRadius: '12px', outline: 'none', width: '100px' }}
                      />
                    ) : (
                      <button 
                        onClick={() => setIsAddingTag(true)}
                        style={{ color: 'var(--text-secondary)', fontSize: '12px', padding: '2px 8px', borderRadius: '12px', background: 'transparent', border: '1px dashed var(--border-color)', cursor: 'pointer' }}
                        onMouseOver={e => e.currentTarget.style.color = 'var(--text-color)'}
                        onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                      >
                        + Add tag
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-secondary)' }}>
            <div style={{ maxWidth: '400px', textAlign: 'center' }}>
              <FileText size={64} style={{ marginBottom: '24px', opacity: 0.1 }} />
              <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-color)', marginBottom: '8px' }}>Select a page</h2>
              <p style={{ fontSize: '14px' }}>Choose a note from the sidebar or create a new one to start writing.</p>
            </div>
          </div>
        )}
      </div>
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete this note?"
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setShowDeleteModal(false)} 
              style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: 'var(--text-secondary)', background: 'transparent' }}
            >
              Cancel
            </button>
            <button 
              onClick={async () => {
                await deleteNote(currentNote._id);
                setActiveNoteId(null);
                setShowDeleteModal(false);
              }}
              style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, color: '#fff', background: '#ef4444', border: 'none', cursor: 'pointer' }}
            >
              Delete Note
            </button>
          </div>
        }
      >
        <p>This will permanently remove the note and its content. This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
