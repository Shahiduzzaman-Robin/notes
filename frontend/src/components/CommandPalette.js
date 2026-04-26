"use client";
import { useState, useEffect, useRef } from 'react';
import { Search, FileText, Kanban, Folder, Command, ArrowDown, ArrowUp, CornerDownLeft } from 'lucide-react';
import useStore from '../store/useStore';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const { notes, boards, noteFolders, boardFolders, setActiveNoteId, setActiveBoardId, setActiveFolderId, setActiveTab } = useStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const filteredResults = query.trim() === '' ? [] : [
    ...notes.filter(n => n.title?.toLowerCase().includes(query.toLowerCase())).map(n => ({ ...n, type: 'note', icon: FileText })),
    ...boards.filter(b => b.name?.toLowerCase().includes(query.toLowerCase())).map(b => ({ ...b, type: 'board', icon: Kanban })),
    ...noteFolders.filter(f => f.name?.toLowerCase().includes(query.toLowerCase())).map(f => ({ ...f, type: 'folder-notes', icon: Folder })),
    ...boardFolders.filter(f => f.name?.toLowerCase().includes(query.toLowerCase())).map(f => ({ ...f, type: 'folder-boards', icon: Folder })),
  ].slice(0, 8);

  const handleSelect = (item) => {
    if (item.type === 'note') {
      setActiveTab('notes');
      setActiveNoteId(item._id);
    } else if (item.type === 'board') {
      setActiveTab('boards');
      setActiveBoardId(item._id);
    } else if (item.type === 'folder-notes') {
      setActiveTab('notes');
      setActiveFolderId(item._id, 'notes');
    } else if (item.type === 'folder-boards') {
      setActiveTab('boards');
      setActiveFolderId(item._id, 'boards');
    }
    setIsOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
      handleSelect(filteredResults[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={() => setIsOpen(false)}>
      <div className="command-palette-container" onClick={e => e.stopPropagation()}>
        <div className="command-palette-search">
          <Search size={20} className="search-icon" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Search for notes, boards, folders..." 
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={onKeyDown}
          />
          <div className="search-badge">ESC</div>
        </div>

        <div className="command-palette-results">
          {query.trim() === '' ? (
            <div className="empty-state">
              <Command size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
              <p>Type to start searching...</p>
              <div className="shortcuts-tip">
                <span><ArrowUp size={12} /> <ArrowDown size={12} /> to navigate</span>
                <span><CornerDownLeft size={12} /> to open</span>
              </div>
            </div>
          ) : filteredResults.length > 0 ? (
            filteredResults.map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={`${item.type}-${item._id}`}
                  className={`result-item ${index === selectedIndex ? 'selected' : ''}`}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => handleSelect(item)}
                >
                  <Icon size={18} className="item-icon" />
                  <div className="item-details">
                    <span className="item-name">{item.title || item.name}</span>
                    <span className="item-type">{item.type.replace('-', ' ')}</span>
                  </div>
                  {index === selectedIndex && <CornerDownLeft size={14} className="enter-icon" />}
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <p>No results found for "{query}"</p>
            </div>
          )}
        </div>

        <div className="command-palette-footer">
          <div className="footer-item"><ArrowUp size={12} /><ArrowDown size={12} /> Navigate</div>
          <div className="footer-item"><CornerDownLeft size={12} /> Open</div>
          <div className="footer-item">ESC Close</div>
        </div>
      </div>

      <style jsx>{`
        .command-palette-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          padding-top: 20vh;
          z-index: 10000;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .command-palette-container {
          width: 600px;
          max-height: 450px;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideUp 0.2s ease-out;
        }

        @keyframes slideUp {
          from { transform: translateY(10px); }
          to { transform: translateY(0); }
        }

        .command-palette-search {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color);
          gap: 12px;
        }

        .search-icon { color: var(--primary); }
        
        .command-palette-search input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-color);
          font-size: 16px;
          outline: none;
        }

        .search-badge {
          font-size: 10px;
          padding: 4px 8px;
          background: var(--hover-bg);
          border-radius: 4px;
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        .command-palette-results {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          min-height: 200px;
        }

        .result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.1s;
        }

        .result-item.selected {
          background: var(--primary-light);
          color: var(--primary);
        }

        .item-icon { opacity: 0.6; }
        .result-item.selected .item-icon { opacity: 1; }

        .item-details {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .item-name { font-size: 14px; font-weight: 500; }
        .item-type { font-size: 11px; opacity: 0.5; text-transform: capitalize; }

        .enter-icon { opacity: 0.5; }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-secondary);
          padding: 40px;
        }

        .shortcuts-tip {
          display: flex;
          gap: 16px;
          margin-top: 12px;
          font-size: 12px;
          opacity: 0.5;
        }

        .shortcuts-tip span { display: flex; alignItems: center; gap: 4px; }

        .command-palette-footer {
          padding: 10px 20px;
          background: var(--hover-bg);
          border-top: 1px solid var(--border-color);
          display: flex;
          gap: 20px;
          font-size: 11px;
          color: var(--text-secondary);
        }

        .footer-item { display: flex; align-items: center; gap: 6px; }
      `}</style>
    </div>
  );
}
