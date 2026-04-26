"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import useStore from '../store/useStore';
import { Plus, Edit2, Trash2, Pin, Search, FileText, MoreHorizontal, Calendar, ChevronLeft, ChevronRight, Clock, AlignLeft, Type, Tag, X, Folder, Sparkles, Send, Bot, RefreshCcw, Download } from 'lucide-react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import Modal from './Modal';
import axios from 'axios';

const TiptapEditor = dynamic(() => import('./TiptapEditor'), { ssr: false });

export default function Notes() {
  const { notes, updateNote, deleteNote, globalSearchQuery, activeNoteId, setActiveNoteId, noteFolders } = useStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '', tags: [], folder: null });
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const contentRef = useRef('');

  const [activeRightTab, setActiveRightTab] = useState('meta');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const handleAISummarize = async () => {
    if (!currentNote.content) return;
    setAiLoading(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/ai/summarize`, {
        content: currentNote.content,
        title: currentNote.title
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAiSummary(res.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIChat = async (e) => {
    e?.preventDefault();
    if (!chatMessage.trim() || aiLoading) return;
    
    const userMsg = { role: 'user', parts: [{ text: chatMessage }] };
    setChatHistory(prev => [...prev, userMsg]);
    const msgToSend = chatMessage;
    setChatMessage('');
    setAiLoading(true);

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/ai/chat`, {
        content: currentNote.content,
        title: currentNote.title,
        message: msgToSend,
        history: chatHistory
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: res.data.reply }] }]);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || "Connection failed. Please check your API Key on Render.";
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: `❌ Error: ${errMsg}` }] }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAISuggestTags = async () => {
    setAiLoading(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/ai/suggest-tags`, {
        content: currentNote.content,
        title: currentNote.title
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const uniqueTags = [...new Set([...(currentNote.tags || []), ...res.data.tags])];
      updateNote(currentNote._id, { ...currentNote, tags: uniqueTags });
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    
    const pdfStyles = `
      <style>
        .pdf-container { font-family: 'Inter', sans-serif; color: #000; background: #fff; width: 100%; padding: 40px; }
        .pdf-title { font-size: 32px; margin-bottom: 10px; color: #1a1a1a; }
        .pdf-meta { font-size: 12px; color: #666; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .tiptap-content table { 
          display: block;
          border-collapse: collapse; 
          width: 100%; 
          margin: 25px 0; 
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .tiptap-content tr { 
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .tiptap-content table td, .tiptap-content table th { border: 1px solid #ddd; padding: 10px; }
        .tiptap-content h1 { font-size: 24px; margin-top: 20px; }
        .tiptap-content h2 { font-size: 20px; margin-top: 15px; }
        .tiptap-content p { line-height: 1.6; margin-bottom: 12px; }
        .tiptap-content .search-result-highlight { background: #ffeb3b; padding: 2px; }
      </style>
    `;

    const element = document.createElement('div');
    element.innerHTML = `
      ${pdfStyles}
      <div class="pdf-container">
        <h1 class="pdf-title">${currentNote.title || 'Untitled'}</h1>
        <div class="pdf-meta">
          Last edited: ${currentNote.updatedAt ? new Date(currentNote.updatedAt).toLocaleString() : 'Just now'}
        </div>
        <div class="tiptap-content">
          ${currentNote.content}
        </div>
      </div>
    `;

    const opt = {
      margin: 15,
      filename: `${currentNote.title || 'Note'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' }
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
        .notes-layout { display: flex; height: 100%; overflow: hidden; }
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
        
        .action-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; background: var(--hover-bg); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-color); font-size: 13px; font-weight: 500; cursor: pointer; margin-bottom: 8px; transition: all 0.2s; }
        .action-btn:hover { background: var(--border-color); transform: translateY(-1px); }
        .action-btn.delete { color: var(--danger); border-color: rgba(239, 68, 68, 0.2); }
        .action-btn.delete:hover { background: rgba(239, 68, 68, 0.1); }

        .ai-card { background: var(--hover-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
        .ai-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .ai-action-icon { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .ai-action-icon:hover { color: var(--primary); background: var(--primary-light); }
        
        .ai-chat-container { display: flex; flex-direction: column; height: 350px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .chat-bubble { max-width: 85%; padding: 8px 12px; border-radius: 12px; font-size: 13px; line-height: 1.4; }
        .chat-bubble.user { align-self: flex-end; background: var(--primary); color: #fff; border-bottom-right-radius: 2px; }
        .chat-bubble.model { align-self: flex-start; background: var(--hover-bg); border: 1px solid var(--border-color); border-bottom-left-radius: 2px; }
        
        .chat-input-wrapper { display: flex; padding: 8px; background: var(--hover-bg); border-top: 1px solid var(--border-color); gap: 8px; }
        .chat-input { flex: 1; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 6px 12px; font-size: 13px; outline: none; color: var(--text-color); }
        .chat-send-btn { background: var(--primary); color: #fff; border: none; border-radius: 8px; padding: 6px 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        
        .loading-dots:after { content: ' .'; animation: dots 1s steps(5, end) infinite; }
        @keyframes dots { 0%, 20% { content: ' .'; } 40% { content: ' . .'; } 60% { content: ' . . .'; } 80%, 100% { content: ' . . . .'; } }
      `}</style>

      <div className="notes-editor-container">
        {currentNote._id ? (
          <>
            <div id="editor-scroll-container">
              <div className="notes-editor-inner">
                {/* Breadcrumbs & Meta info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', opacity: 0.6, fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={14} />
                    <span>Notes</span>
                    <ChevronRight size={12} />
                    <span style={{ color: 'var(--text-color)', fontWeight: 500 }}>{currentNote.title || 'Untitled'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {updatedAt}</span>
                    <button onClick={() => updateNote(currentNote._id, { isPinned: !currentNote.isPinned })} style={{ color: currentNote.isPinned ? 'var(--primary)' : 'inherit', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Pin size={16} fill={currentNote.isPinned ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>

                <input 
                  type="text" 
                  value={currentNote.title}
                  onChange={e => setCurrentNote(prev => ({ ...prev, title: e.target.value }))}
                  onBlur={() => handleSave()}
                  placeholder="Untitled"
                  style={{ fontSize: '42px', fontWeight: 700, background: 'transparent', border: 'none', color: 'var(--text-color)', width: '100%', marginBottom: '24px', outline: 'none' }}
                />

                <div style={{ flex: 1, minHeight: '600px' }}>
                  {currentNote.content === undefined && (
                    <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }} className="loading-dots">
                      Loading content
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

            {/* Right Sidebar */}
            <div className="notes-metadata-panel">
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => setActiveRightTab('meta')}
                  style={{ flex: 1, padding: '14px', fontSize: '12px', fontWeight: 600, color: activeRightTab === 'meta' ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: activeRightTab === 'meta' ? '2px solid var(--primary)' : 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  Properties
                </button>
                <button 
                  onClick={() => setActiveRightTab('ai')}
                  style={{ flex: 1, padding: '14px', fontSize: '12px', fontWeight: 600, color: activeRightTab === 'ai' ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: activeRightTab === 'ai' ? '2px solid var(--primary)' : 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Sparkles size={14} /> AI Assistant
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                {activeRightTab === 'meta' ? (
                  <div className="meta-section">
                    <div className="meta-group">
                      <div className="meta-item">
                        <Clock size={16} className="meta-icon" />
                        <div className="meta-content">
                          <span className="meta-label">Last Edited</span>
                          <span className="meta-value">{updatedAt}</span>
                        </div>
                      </div>
                      <div className="meta-item">
                        <Folder size={16} className="meta-icon" />
                        <div className="meta-content">
                          <span className="meta-label">Location</span>
                          <select 
                            value={currentNote.folder || 'root'} 
                            onChange={(e) => handleFolderChange(e.target.value)}
                            className="meta-select"
                          >
                            <option value="root">No Folder</option>
                            {noteFolders.map(f => (
                              <option key={f._id} value={f._id}>{f.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="meta-item" style={{ alignItems: 'flex-start' }}>
                        <Tag size={16} className="meta-icon" style={{ marginTop: '2px' }} />
                        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {(currentNote.tags || []).map(t => (
                            <span key={t} className="tag-pill">
                              {t}
                              <X size={12} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => handleRemoveTag(t)} />
                            </span>
                          ))}
                          {isAddingTag ? (
                            <input autoFocus value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={handleAddTag} onBlur={() => setIsAddingTag(false)} placeholder="Tag..." className="tag-input" />
                          ) : (
                            <button onClick={() => setIsAddingTag(true)} className="add-tag-btn">+ Tag</button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="meta-group" style={{ marginTop: '40px' }}>
                      <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>Statistics</h4>
                      <div style={{ fontSize: '13px', opacity: 0.8 }}>
                        {wordCount} words • {charCount} characters
                      </div>
                    </div>

                    <div className="meta-group" style={{ marginTop: '40px' }}>
                      <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px' }}>Actions</h4>
                      <button onClick={handleDownloadPDF} className="action-btn">
                        <Download size={16} /> Export as PDF
                      </button>
                      <button onClick={() => setShowDeleteModal(true)} className="action-btn delete">
                        <Trash2 size={16} /> Delete Note
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="ai-section">
                    <div className="ai-card">
                      <div className="ai-card-header">
                        <span style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AlignLeft size={16} color="var(--primary)" /> Smart Summary
                        </span>
                        <button onClick={handleAISummarize} disabled={aiLoading} className="ai-action-icon">
                          <RefreshCcw size={14} className={aiLoading ? 'spin' : ''} />
                        </button>
                      </div>
                      {aiSummary ? (
                        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>{aiSummary.split('\n').map((l, i) => <p key={i} style={{ margin: '4px 0' }}>{l}</p>)}</div>
                      ) : (
                        <p style={{ fontSize: '12px', opacity: 0.5 }}>Click summarize to begin.</p>
                      )}
                    </div>

                    <div className="ai-card">
                      <div className="ai-card-header">
                        <span style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Tag size={16} color="var(--primary)" /> Smart Tags
                        </span>
                        <button onClick={handleAISuggestTags} disabled={aiLoading} className="ai-action-icon">
                          <Plus size={16} />
                        </button>
                      </div>
                      <p style={{ fontSize: '12px', opacity: 0.5 }}>Let AI suggest relevant tags.</p>
                    </div>

                    <div className="ai-chat-container">
                      <div className="chat-messages">
                        {chatHistory.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '20px', opacity: 0.3 }}>
                            <Bot size={32} style={{ marginBottom: '8px' }} />
                            <p style={{ fontSize: '11px' }}>Chat with this note</p>
                          </div>
                        )}
                        {chatHistory.map((m, i) => (
                          <div key={i} className={`chat-bubble ${m.role}`}>{m.parts[0].text}</div>
                        ))}
                        {aiLoading && <div className="chat-bubble model loading-dots">Thinking</div>}
                      </div>
                      <form onSubmit={handleAIChat} className="chat-input-wrapper">
                        <input type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="Ask anything..." className="chat-input" />
                        <button type="submit" disabled={!chatMessage.trim() || aiLoading} className="chat-send-btn"><Send size={14} /></button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-secondary)', padding: '40px', textAlign: 'center' }}>
            <FileText size={64} style={{ marginBottom: '24px', opacity: 0.1 }} />
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-color)', marginBottom: '8px' }}>Select a page</h2>
            <p style={{ fontSize: '14px' }}>Choose a note from the sidebar or create a new one.</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Note"
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowDeleteModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', background: 'transparent' }}>Cancel</button>
            <button onClick={async () => { await deleteNote(currentNote._id); setActiveNoteId(null); setShowDeleteModal(false); }} style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>Delete</button>
          </div>
        }
      >
        <p>Are you sure? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
