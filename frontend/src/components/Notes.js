"use client";
import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { Plus, Edit2, Trash2, Pin, Search, FileText, MoreHorizontal, Calendar, ChevronLeft, Clock, AlignLeft, Type, Tag, X } from 'lucide-react';
import { format } from 'date-fns';

export default function Notes() {
  const { notes, updateNote, deleteNote, globalSearchQuery, activeNoteId, setActiveNoteId } = useStore();
  const [isContentFocused, setIsContentFocused] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '', tags: [] });
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (activeNoteId) {
      const note = notes.find(n => n._id === activeNoteId);
      if (note) setCurrentNote(note);
    } else {
      setCurrentNote({ title: '', content: '' });
    }
  }, [activeNoteId]);

  const handleSave = async () => {
    if (currentNote.title.trim() === '' && currentNote.content.trim() === '') return;
    if (currentNote._id) {
      await updateNote(currentNote._id, currentNote);
    }
  };

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

  const wordCount = currentNote.content ? currentNote.content.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
  const charCount = currentNote.content ? currentNote.content.length : 0;
  const createdAt = currentNote.createdAt ? format(new Date(currentNote.createdAt), 'MMM d, yyyy h:mm a') : 'Just now';
  const updatedAt = currentNote.updatedAt ? format(new Date(currentNote.updatedAt), 'MMM d, yyyy h:mm a') : 'Just now';

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
    
    // First split by links
    const parts = content.split(/(https?:\/\/[^\s]+)/g);
    return parts.map((part, i) => {
      if (part.match(/https?:\/\/[^\s]+/)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
          {highlightText(part, globalSearchQuery)}
        </a>;
      }
      // Then apply highlights to the text parts
      return highlightText(part, globalSearchQuery);
    });
  };

  const resizeTextarea = (target) => {
    const scrollContainer = document.getElementById('editor-scroll-container');
    const oldScrollPos = scrollContainer ? scrollContainer.scrollTop : 0;
    const oldHeight = target.style.height ? parseInt(target.style.height) : target.scrollHeight;

    target.style.height = 'auto';
    const newHeight = target.scrollHeight;
    target.style.height = newHeight + 'px';

    if (scrollContainer) {
      const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 150;
      if (newHeight > oldHeight && isNearBottom) {
        scrollContainer.scrollTop = oldScrollPos + (newHeight - oldHeight);
      } else {
        scrollContainer.scrollTop = oldScrollPos;
      }
    }
  };

  const handleKeyDown = (e) => {
    const { selectionStart, selectionEnd, value } = e.target;
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const lineText = value.substring(lineStart, selectionStart);

    // Auto-convert symbols on Space
    if (e.key === ' ') {
      if (lineText.trim() === '[]' || lineText.trim().toLowerCase() === '/todo') {
        e.preventDefault();
        const markerLength = lineText.trim().length;
        const newValue = value.substring(0, selectionStart - markerLength) + '[ ] ' + value.substring(selectionEnd);
        setCurrentNote({...currentNote, content: newValue});
        return;
      }
      if (lineText.trim() === '-' || lineText.trim() === '*') {
        e.preventDefault();
        const newValue = value.substring(0, selectionStart - 1) + '• ' + value.substring(selectionEnd);
        setCurrentNote({...currentNote, content: newValue});
        return;
      }
    }

    if (e.key === 'Enter') {
      const bulletMatch = lineText.match(/^(\s*[•\-*]\s+)/);
      const numberMatch = lineText.match(/^(\s*)(\d+)\.\s+/);
      const todoMatch = lineText.match(/^(\s*\[[ xX]\]\s+)/);
      
      if (bulletMatch) {
        if (lineText.trim() === '-' || lineText.trim() === '*' || lineText.trim() === '•') {
          e.preventDefault();
          const newValue = value.substring(0, lineStart) + value.substring(selectionEnd);
          setCurrentNote({...currentNote, content: newValue});
          return;
        }
        e.preventDefault();
        const marker = bulletMatch[1];
        const newValue = value.substring(0, selectionStart) + '\n' + marker + value.substring(selectionEnd);
        setCurrentNote({...currentNote, content: newValue});
        setTimeout(() => {
          e.target.selectionStart = e.target.selectionEnd = selectionStart + 1 + marker.length;
          resizeTextarea(e.target);
        }, 0);
      } else if (numberMatch) {
        if (lineText.trim().match(/^\d+\.$/)) {
          e.preventDefault();
          const newValue = value.substring(0, lineStart) + value.substring(selectionEnd);
          setCurrentNote({...currentNote, content: newValue});
          return;
        }
        e.preventDefault();
        const indent = numberMatch[1];
        const nextNum = parseInt(numberMatch[2]) + 1;
        const marker = `${indent}${nextNum}. `;
        const newValue = value.substring(0, selectionStart) + '\n' + marker + value.substring(selectionEnd);
        setCurrentNote({...currentNote, content: newValue});
        setTimeout(() => {
          e.target.selectionStart = e.target.selectionEnd = selectionStart + 1 + marker.length;
          resizeTextarea(e.target);
        }, 0);
      } else if (todoMatch) {
        if (lineText.trim().match(/^\[[ xX]\]$/)) {
          e.preventDefault();
          const newValue = value.substring(0, lineStart) + value.substring(selectionEnd);
          setCurrentNote({...currentNote, content: newValue});
          return;
        }
        e.preventDefault();
        const marker = "[ ] "; 
        const newValue = value.substring(0, selectionStart) + '\n' + marker + value.substring(selectionEnd);
        setCurrentNote({...currentNote, content: newValue});
        setTimeout(() => {
          e.target.selectionStart = e.target.selectionEnd = selectionStart + 1 + marker.length;
        }, 0);
      }
    }
    
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Un-indent (remove up to 4 spaces from start of line)
        const fullLineEnd = value.indexOf('\n', lineStart);
        const end = fullLineEnd === -1 ? value.length : fullLineEnd;
        const fullLineText = value.substring(lineStart, end);
        const match = fullLineText.match(/^ {1,4}/);
        if (match) {
          const spacesToRemove = match[0].length;
          const newValue = value.substring(0, lineStart) + fullLineText.substring(spacesToRemove) + value.substring(end);
          setCurrentNote({...currentNote, content: newValue});
          setTimeout(() => {
            e.target.selectionStart = e.target.selectionEnd = Math.max(lineStart, selectionStart - spacesToRemove);
            resizeTextarea(e.target);
          }, 0);
        }
      } else {
        // Indent (add 4 spaces at start of line)
        const fullLineEnd = value.indexOf('\n', lineStart);
        const end = fullLineEnd === -1 ? value.length : fullLineEnd;
        const fullLineText = value.substring(lineStart, end);
        
        let newLineText = fullLineText;
        let cursorOffset = 4;
        
        // Reset number to 1. if it's a numbered list
        const numberMatch = fullLineText.match(/^(\s*)(\d+)\.\s+(.*)/);
        if (numberMatch) {
            const oldNumber = numberMatch[2];
            newLineText = `${numberMatch[1]}1. ${numberMatch[3]}`;
            cursorOffset = 4 + (1 - oldNumber.length);
        }
        
        const newValue = value.substring(0, lineStart) + '    ' + newLineText + value.substring(end);
        setCurrentNote({...currentNote, content: newValue});
        setTimeout(() => {
          e.target.selectionStart = e.target.selectionEnd = selectionStart + cursorOffset;
          resizeTextarea(e.target);
        }, 0);
      }
    }
  };

  const toggleCheckbox = (lineIdx) => {
    const lines = currentNote.content.split('\n');
    const line = lines[lineIdx];
    const match = line.match(/^(\s*)\[(x| )\](.*)/i);
    if (match) {
      const currentStatus = match[2].toLowerCase() === 'x';
      const newStatus = currentStatus ? ' ' : 'x';
      lines[lineIdx] = `${match[1]}[${newStatus}]${match[3]}`;
      const newContent = lines.join('\n');
      const updatedNote = { ...currentNote, content: newContent };
      setCurrentNote(updatedNote);
      updateNote(currentNote._id, updatedNote);
    }
  };

  const renderContentWithLists = (content) => {
    if (!content || content.trim() === '') return <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Click to start writing...</span>;
    
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bullet list detection
      const bulletMatch = line.match(/^(\s*[•\-*]\s+)(.*)/);
      if (bulletMatch) {
        const indentSpaces = bulletMatch[1].match(/^(\s*)/)[1];
        return (
          <div key={idx} style={{ display: 'flex', gap: '0px', marginBottom: '0px' }}>
            <span style={{ whiteSpace: 'pre' }}>{indentSpaces}</span>
            <span style={{ color: 'var(--text-color)', width: '2ch', flexShrink: 0 }}>• </span>
            <div style={{ flex: 1 }}>{renderContentWithLinksAndHighlights(bulletMatch[2])}</div>
          </div>
        );
      }

      // Numbered list detection
      const numberMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
      if (numberMatch) {
        const indentSpaces = numberMatch[1];
        const marker = `${numberMatch[2]}. `;
        return (
          <div key={idx} style={{ display: 'flex', gap: '0px', marginBottom: '0px' }}>
            <span style={{ whiteSpace: 'pre' }}>{indentSpaces}</span>
            <span style={{ color: 'var(--text-color)', width: `${marker.length}ch`, flexShrink: 0 }}>{marker}</span>
            <div style={{ flex: 1 }}>{renderContentWithLinksAndHighlights(numberMatch[3])}</div>
          </div>
        );
      }

      // Checkboxes (Todo list) detection
      const todoMatch = line.match(/^(\s*)\[(x| )\]\s*(.*)/i);
      if (todoMatch) {
        const indentSpaces = todoMatch[1];
        const checked = todoMatch[2].toLowerCase() === 'x';
        return (
          <div key={idx} style={{ display: 'flex', gap: '0px', marginBottom: '0px', alignItems: 'flex-start' }}>
            <span style={{ whiteSpace: 'pre' }}>{indentSpaces}</span>
            <div 
              onClick={(e) => { e.stopPropagation(); toggleCheckbox(idx); }}
              style={{ 
                marginTop: '4px',
                width: '4ch', 
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                cursor: 'pointer'
              }}
            >
              <div style={{ 
                width: '18px', 
                height: '18px', 
                borderRadius: '3px', 
                border: `2px solid ${checked ? 'var(--primary)' : 'var(--border-color)'}`, 
                background: checked ? 'var(--primary)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.1s'
              }}>
                {checked && <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '1px' }} />}
              </div>
            </div>
            <div style={{ flex: 1, textDecoration: checked ? 'line-through' : 'none', opacity: checked ? 0.5 : 1, transition: 'all 0.2s' }}>
              {renderContentWithLinksAndHighlights(todoMatch[3])}
            </div>
          </div>
        );
      }

      return (
        <div key={idx} style={{ minHeight: '1.6em', marginBottom: '0px' }}>
          {renderContentWithLinksAndHighlights(line)}
        </div>
      );
    });
  };

  const handleNoteContentClick = (e) => {
    const selection = window.getSelection();
    let offset = 0;
    
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preSelectionRange = range.cloneRange();
      const container = e.currentTarget;
      preSelectionRange.selectNodeContents(container);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      
      offset = preSelectionRange.toString().length;
    }

    const scrollContainer = document.getElementById('editor-scroll-container');
    const scrollPos = scrollContainer ? scrollContainer.scrollTop : 0;

    setIsContentFocused(true);
    
    setTimeout(() => {
      const textarea = document.querySelector('textarea[name="note-content"]');
      if (textarea) {
        textarea.focus();
        if (offset > 0) {
          const safeOffset = Math.min(offset, textarea.value.length);
          textarea.setSelectionRange(safeOffset, safeOffset);
        }
      }
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollPos;
      }
    }, 0);
  };

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
      `}</style>
      
      {/* Editor Area (The "Page") */}
      <div className="notes-editor-container">
        {currentNote._id ? (
          <>
            <div id="editor-scroll-container" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div className="notes-editor-inner">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', opacity: 0.6 }}>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> Last edited {updatedAt}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setCurrentNote({...currentNote, isPinned: !currentNote.isPinned})} style={{ color: currentNote.isPinned ? 'var(--primary)' : 'inherit' }}><Pin size={18} /></button>
                    <button onClick={() => setShowDeleteModal(true)} style={{ color: 'var(--danger)' }}><Trash2 size={18} /></button>
                  </div>
                </div>

                <input 
                  type="text" 
                  value={currentNote.title}
                  onChange={e => {
                    const newNote = {...currentNote, title: e.target.value};
                    setCurrentNote(newNote);
                  }}
                  onBlur={handleSave}
                  placeholder="Untitled"
                  style={{ fontSize: '42px', fontWeight: 700, background: 'transparent', border: 'none', color: 'var(--text-color)', width: '100%', marginBottom: '20px', outline: 'none' }}
                />
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '500px', position: 'relative' }}>
                  {isContentFocused ? (
                    <textarea 
                      name="note-content"
                      value={currentNote.content}
                      onChange={e => {
                        const newNote = {...currentNote, content: e.target.value};
                        setCurrentNote(newNote);
                        resizeTextarea(e.target);
                      }}
                      onFocus={e => {
                        resizeTextarea(e.target);
                      }}
                      onKeyDown={handleKeyDown}
                      onBlur={() => {
                        setIsContentFocused(false);
                        handleSave();
                      }}
                      placeholder="Press Enter to continue with an empty page..."
                      style={{ width: '100%', height: 'auto', minHeight: '500px', resize: 'none', background: 'transparent', border: 'none', color: 'var(--text-color)', fontSize: '16px', lineHeight: '1.6', outline: 'none', overflow: 'hidden', padding: '0', margin: '0', fontFamily: 'inherit' }}
                    />
                  ) : (
                    <div 
                      onClick={handleNoteContentClick}
                      style={{ width: '100%', height: 'auto', minHeight: '500px', color: 'var(--text-color)', fontSize: '16px', lineHeight: '1.6', whiteSpace: 'pre-wrap', cursor: 'text', padding: '0', margin: '0', border: 'none', fontFamily: 'inherit' }}
                    >
                      {renderContentWithLists(currentNote.content)}
                    </div>
                  )}
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
                  <Type size={16} className="meta-icon" />
                  <span style={{ flex: 1 }}>Characters</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{charCount}</span>
                </div>
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
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }} onClick={() => setShowDeleteModal(false)}>
          <div style={{ background: 'var(--bg-color)', padding: '24px', borderRadius: '12px', width: '360px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-color)', marginBottom: '8px' }}>Delete this note?</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>This will permanently remove the note and its content. This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowDeleteModal(false)} 
                style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--text-color)', background: 'var(--hover-bg)', border: '1px solid var(--border-color)' }}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  await deleteNote(currentNote._id);
                  setActiveNoteId(null);
                  setShowDeleteModal(false);
                }} 
                style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, color: 'white', background: '#eb5757', border: 'none' }}
              >
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
