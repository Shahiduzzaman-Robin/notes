"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import useStore from '../store/useStore';
import { Trash2, FileText, Clock, AlignLeft, Tag, X, Folder, Download, Share2, Globe, Link, Check, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import Modal from './Modal';

const TiptapEditor = dynamic(() => import('./TiptapEditor'), { ssr: false });

export default function Notes() {
  const { notes, updateNote, deleteNote, activeNoteId, setActiveNoteId, noteFolders, setActiveFolderId } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '', tags: [], folder: null });
  const [tagInput, setTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [lastSavedNote, setLastSavedNote] = useState({ title: '', content: '', tags: [], folder: null });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [showMobileMeta, setShowMobileMeta] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const lastSyncedNoteIdRef = useRef(null);

  // Sync state with store
  useEffect(() => {
    if (activeNoteId) {
      const note = notes.find(n => n._id === activeNoteId);
      if (!note) return;

      const isNewNote = lastSyncedNoteIdRef.current !== activeNoteId;
      const contentArrived = currentNote._id === activeNoteId && !currentNote.content && note.content;
      const metaChanged = currentNote._id === activeNoteId && (currentNote.isPublic !== note.isPublic || currentNote.shareSlug !== note.shareSlug);

      if (isNewNote) {
        // Full reset for new note to prevent state leakage from previous note
        lastSyncedNoteIdRef.current = activeNoteId;
        setCurrentNote({
          ...note,
          isPublic: note.isPublic || false,
          shareSlug: note.shareSlug || ''
        });
        setLastSavedNote(note);
        setIsLoading(false);
      } else if (contentArrived || metaChanged) {
        // Update specific fields for the current note
        setCurrentNote(prev => ({ 
          ...prev, 
          content: note.content,
          isPublic: note.isPublic || false,
          shareSlug: note.shareSlug || ''
        }));
        setLastSavedNote(note);
      }
    } else {
      lastSyncedNoteIdRef.current = null;
      setCurrentNote({ title: '', content: '', tags: [], folder: null });
      setIsLoading(false);
    }
  }, [activeNoteId, notes, currentNote._id, currentNote.content]);

  // Force save helper for redundancy
  const forceSave = useCallback(() => {
    if (!currentNote._id || isLoading) return;
    
    updateNote(currentNote._id, {
      title: currentNote.title,
      content: currentNote.content,
      tags: currentNote.tags,
      folder: currentNote.folder
    });
    setLastSavedNote(currentNote);
  }, [currentNote, updateNote, isLoading]);

  // Auto-save logic
  useEffect(() => {
    if (!currentNote._id || isLoading) return;
    
    const timer = setTimeout(() => {
      // Logic for determining if content is TRULY empty (not just whitespace/formatting)
      const isContentEmpty = !currentNote.content || 
                             currentNote.content === '<p></p>' || 
                             currentNote.content === '<p style="text-align: right;"></p>' ||
                             currentNote.content === '<p style="text-align: center;"></p>';
      
      const hasTitleChange = currentNote.title !== lastSavedNote.title;
      const hasContentChange = currentNote.content !== lastSavedNote.content && !isContentEmpty;
      const hasTagChange = JSON.stringify(currentNote.tags) !== JSON.stringify(lastSavedNote.tags);
      const hasFolderChange = currentNote.folder !== lastSavedNote.folder;

      if (hasTitleChange || hasContentChange || hasTagChange || hasFolderChange) {
        forceSave();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentNote, lastSavedNote, forceSave, isLoading]);

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
    await deleteNote(currentNote._id);
    setActiveNoteId(null);
    setIsDeleteModalOpen(false);
  };

  const handleToggleShare = async (e) => {
    const newVal = e.target.checked;
    // Optimistic local update for instant feedback
    setCurrentNote(prev => ({ ...prev, isPublic: newVal }));
    await updateNote(currentNote._id, { isPublic: newVal });
  };

  const copyShareLink = () => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/share/note/${currentNote.shareSlug}`;
    navigator.clipboard.writeText(shareUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleRegenerateLink = async () => {
    setIsRegenerateModalOpen(true);
  };

  const confirmRegenerate = async () => {
    await updateNote(currentNote._id, { regenerateSlug: true });
    setIsRegenerateModalOpen(false);
  };

  const NoteSkeleton = () => (
    <div className="skeleton-container">
      <div className="skeleton title" />
      <div className="skeleton line short" />
      <div className="skeleton line" />
      <div className="skeleton line" />
      <div className="skeleton line mid" />
      <style jsx>{`
        .skeleton-container { width: 100%; }
        .skeleton { background: var(--hover-bg); border-radius: 4px; position: relative; overflow: hidden; margin-bottom: 12px; }
        .skeleton::after { content: ""; position: absolute; top: 0; right: 0; bottom: 0; left: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); animation: shimmer 1.5s infinite; transform: translateX(-100%); }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .title { height: 42px; width: 60%; margin-bottom: 40px; }
        .line { height: 16px; width: 100%; }
        .line.short { width: 40%; margin-bottom: 24px; }
        .line.mid { width: 70%; }
      `}</style>
    </div>
  );

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
  
  // Improved word and character count logic
  const plainText = currentNote.content 
    ? currentNote.content
        .replace(/<br\s*\/?>/gi, ' ') // Replace breaks with spaces
        .replace(/<\/p>|<\/div>|<\/h\d>|<\/li>|<\/td>|<\/tr>/gi, ' ') // Replace closing tags with spaces
        .replace(/<[^>]*>/g, '') // Strip remaining tags
        .replace(/&nbsp;/g, ' ') // Handle non-breaking spaces
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim() 
    : '';

  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const charCount = plainText.length;

  // Helper to get folder path
  const getFolderPath = () => {
    if (!currentNote.folder) return [];
    const path = [];
    let currentId = currentNote.folder;
    
    let depth = 0;
    while (currentId && depth < 10) {
      const folder = noteFolders.find(f => f._id === currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parentFolder;
        depth++;
      } else {
        break;
      }
    }
    return path;
  };

  const folderPath = getFolderPath();

  return (
    <div className="notes-layout">
      <style jsx>{`
        .notes-layout { display: flex; height: 100%; overflow-x: hidden; width: 100%; }
        .notes-editor-container { flex: 1; display: flex; background: var(--bg-color); overflow-x: hidden; }
        #editor-scroll-container { flex: 1; overflow-y: auto; display: flex; flex-direction: column; overflow-x: hidden; }
        .notes-editor-inner { max-width: 900px; width: 100%; padding: 60px 80px; margin: 0 auto; box-sizing: border-box; }
        .notes-metadata-panel { width: 300px; border-left: 1px solid var(--border-color); background: var(--sidebar-bg); display: flex; flex-direction: column; flex-shrink: 0; }
        
        .breadcrumbs { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: var(--text-secondary); font-size: 13px; opacity: 0.8; }
        .breadcrumb-item { cursor: pointer; transition: color 0.2s; }
        .breadcrumb-item:hover { color: var(--text-color); text-decoration: underline; }
        .breadcrumb-separator { opacity: 0.4; }

        @media (max-width: 1024px) {
          .notes-metadata-panel { 
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            z-index: 100;
            background: var(--bg-color);
            box-shadow: -10px 0 30px rgba(0,0,0,0.1);
            transform: translateX(${showMobileMeta ? '0' : '100%'});
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex !important;
            width: 280px;
          }
          .mobile-meta-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.2);
            backdrop-filter: blur(4px);
            z-index: 99;
            opacity: ${showMobileMeta ? 1 : 0};
            pointer-events: ${showMobileMeta ? 'auto' : 'none'};
            transition: opacity 0.3s ease;
          }
          .notes-editor-inner { padding: 40px; }
          .mobile-only-meta-toggle { display: block !important; }
        }

        @media (max-width: 768px) {
          .notes-layout { flex-direction: column; overflow-x: hidden; }
          .notes-editor-inner { padding: 20px 15px; width: 100%; box-sizing: border-box; }
          .note-title-input { font-size: 24px !important; }
        }

        .mobile-only-meta-toggle { display: none; }
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

        /* Share Modal Styles */
        .share-modal-content { padding: 8px 0; }
        .share-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .share-icon-wrapper { width: 48px; height: 48px; border-radius: 12px; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; }
        .share-info { flex: 1; }
        .share-info h4 { margin: 0 0 4px 0; font-size: 16px; font-weight: 600; }
        .share-info p { margin: 0; font-size: 13px; color: var(--text-secondary); }
        
        .share-link-section { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-color); }
        .link-box { display: flex; align-items: center; gap: 10px; background: var(--hover-bg); border: 1px solid var(--border-color); padding: 8px 12px; border-radius: 10px; }
        .link-icon { color: var(--text-secondary); }
        .link-input { flex: 1; background: transparent; border: none; color: var(--text-color); font-size: 13px; outline: none; text-overflow: ellipsis; }
        .copy-btn { padding: 6px 12px; border-radius: 6px; background: var(--primary); color: white; border: none; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; min-width: 60px; }
        .copy-btn.success { background: #10b981; }
        .share-tip { margin-top: 12px; font-size: 12px; color: var(--text-secondary); opacity: 0.7; font-style: italic; }

        /* Switch Style */
        .switch { position: relative; display: inline-block; width: 46px; height: 24px; cursor: pointer; }
        .switch input { position: absolute; width: 100%; height: 100%; opacity: 0; z-index: 2; cursor: pointer; margin: 0; }
        .slider { position: absolute; cursor: pointer; inset: 0; background-color: var(--border-color); transition: .4s; border-radius: 24px; z-index: 1; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--primary); }
        input:checked + .slider:before { transform: translateX(22px); }
      `}</style>

      <div className="notes-editor-container">
        <div id="editor-scroll-container">
          <div className="notes-editor-inner">
            {isLoading ? (
              <NoteSkeleton />
            ) : (
              <>
                <div className="breadcrumbs">
                  <Folder size={14} style={{ opacity: 0.6 }} />
                  <span className="breadcrumb-item" onClick={() => { setActiveNoteId(null); setActiveFolderId(null); }}>Notes</span>
                  {folderPath.map((folder) => (
                    <React.Fragment key={folder._id}>
                      <span className="breadcrumb-separator">&gt;</span>
                      <span 
                        className="breadcrumb-item"
                        onClick={() => setActiveFolderId(folder._id, 'notes')}
                      >
                        {folder.name}
                      </span>
                    </React.Fragment>
                  ))}
                  <span className="breadcrumb-separator">&gt;</span>
                  <span className="breadcrumb-item current">{currentNote.title || 'Untitled Note'}</span>
                  
                  <div className="mobile-only-meta-toggle" style={{ marginLeft: 'auto', display: 'none' }}>
                    <button 
                      onClick={() => setShowMobileMeta(true)}
                      style={{ padding: '8px', borderRadius: '8px', background: 'var(--hover-bg)', border: 'none', color: 'var(--text-color)' }}
                    >
                      <Share2 size={20} />
                    </button>
                  </div>
                </div>
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
                  onSave={forceSave}
                />

                <Modal
                  isOpen={isDeleteModalOpen}
                  onClose={() => setIsDeleteModalOpen(false)}
                  title="Delete Note"
                  footer={
                    <>
                      <button 
                        onClick={() => setIsDeleteModalOpen(false)} 
                        style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: 'var(--text-secondary)', background: 'transparent' }}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleDelete} 
                        style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: '#fff', background: '#ef4444', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </>
                  }
                >
                </Modal>

                <Modal
                  isOpen={isShareModalOpen}
                  onClose={() => setIsShareModalOpen(false)}
                  title="Share Note to Web"
                >
                  <div className="share-modal-content">
                    <div className="share-header">
                      <div className="share-icon-wrapper">
                        <Globe size={24} />
                      </div>
                      <div className="share-info">
                        <h4>Publish to web</h4>
                        <p>Anyone with the secret link can view this note.</p>
                      </div>
                      <div className="share-toggle-container">
                        <label className="switch">
                          <input 
                            type="checkbox" 
                            checked={currentNote.isPublic || false} 
                            onChange={handleToggleShare}
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>
                    </div>

                    {currentNote.isPublic && (
                      <div className="share-link-section animate-fade-in">
                        <div className="link-box">
                          <Link size={16} className="link-icon" />
                          <input 
                            readOnly 
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/note/${currentNote.shareSlug}`}
                            className="link-input"
                          />
                          <button className={`copy-btn ${copySuccess ? 'success' : ''}`} onClick={copyShareLink}>
                            {copySuccess ? <Check size={16} /> : 'Copy'}
                          </button>
                          <button className="copy-btn" style={{ background: 'var(--hover-bg)', color: 'var(--text-secondary)', marginLeft: '8px' }} onClick={handleRegenerateLink} title="Generate new link">
                            <RefreshCw size={16} />
                          </button>
                        </div>
                        <p className="share-tip">This link is unique and unguessable. Unshare anytime to revoke access.</p>
                      </div>
                    )}

                  </div>
                </Modal>

                <Modal
                  isOpen={isRegenerateModalOpen}
                  onClose={() => setIsRegenerateModalOpen(false)}
                  title="Regenerate Link"
                  footer={
                    <>
                      <button 
                        onClick={() => setIsRegenerateModalOpen(false)} 
                        style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: 'var(--text-secondary)', background: 'transparent' }}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={confirmRegenerate} 
                        style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: '#fff', background: 'var(--primary)', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Regenerate
                      </button>
                    </>
                  }
                >
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                    Are you sure? This will permanently deactivate the current public link. Anyone with the old link will lose access immediately.
                  </p>
                </Modal>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mobile-meta-overlay" onClick={() => setShowMobileMeta(false)} />
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
                <span className="meta-label">Statistics</span>
                <span className="meta-value">{wordCount} words • {charCount} chars</span>
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
            <button className="action-btn" onClick={() => setIsShareModalOpen(true)}>
              <Share2 size={16} /> Share Note
            </button>
            <button className="action-btn" onClick={handleExportPDF}>
              <Download size={16} /> Export as PDF
            </button>
            <button className="action-btn delete" onClick={() => setIsDeleteModalOpen(true)}>
              <Trash2 size={16} /> Delete Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
