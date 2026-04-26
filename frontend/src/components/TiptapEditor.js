"use client";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Extension } from '@tiptap/core';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, CheckSquare,
  Plus, Trash, Columns, Rows, Grid3X3,
  Minus, SquareCode, Type, Subscript as SubIcon, Superscript as SupIcon,
  CirclePlay, Highlighter,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Palette, TableCellsMerge, TableCellsSplit
} from 'lucide-react';
import Modal from './Modal';

const SearchHighlight = Extension.create({
  name: 'searchHighlight',
  addOptions() {
    return {
      searchQuery: '',
    }
  },
  addProseMirrorPlugins() {
    const { searchQuery } = this.options;
    return [
      new Plugin({
        key: new PluginKey('searchHighlight'),
        state: {
          init() { return DecorationSet.empty },
          apply(tr, set) {
            set = set.map(tr.mapping, tr.doc);
            return set;
          },
        },
        props: {
          decorations(state) {
            const { searchQuery } = this.editor.extensionManager.extensions.find(e => e.name === 'searchHighlight').options;
            if (!searchQuery || searchQuery.length < 2) return DecorationSet.empty;

            const decorations = [];
            const { doc } = state;
            const regex = new RegExp(searchQuery, 'gi');

            doc.descendants((node, pos) => {
              if (node.isText) {
                const { text } = node;
                let match;
                while ((match = regex.exec(text)) !== null) {
                  const start = pos + match.index;
                  const end = start + match[0].length;
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'search-result-highlight',
                    })
                  );
                }
              }
            });
            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ]
  },
});

export default function TiptapEditor({ noteId, initialContent, onChange, onSave, searchQuery = '' }) {
  const [isFocused, setIsFocused] = useState(false);
  
  // Slash menu state
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slashStartPos, setSlashStartPos] = useState(null);

  // Table menu state
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [tableMenuPos, setTableMenuPos] = useState({ top: 0, left: 0 });

  // Color menu state
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [colorMenuPos, setColorMenuPos] = useState({ top: 0, left: 0 });

  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const menuRef = useRef(null);

  const SLASH_ITEMS = [
    { title: 'Text', description: 'Plain text paragraph', icon: Type, 
      command: (editor) => editor.chain().focus().setParagraph().run() },
    { title: 'Heading 1', description: 'Large heading', icon: Heading1, 
      command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { title: 'Heading 2', description: 'Medium heading', icon: Heading2, 
      command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { title: 'Heading 3', description: 'Small heading', icon: Heading3, 
      command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { title: 'Bullet List', description: 'Unordered list', icon: List, 
      command: (editor) => editor.chain().focus().toggleBulletList().run() },
    { title: 'Numbered List', description: 'Ordered list', icon: ListOrdered, 
      command: (editor) => editor.chain().focus().toggleOrderedList().run() },
    { title: 'To-do List', description: 'Task checklist', icon: CheckSquare, 
      command: (editor) => editor.chain().focus().toggleTaskList().run() },
    { title: 'Quote', description: 'Blockquote', icon: Quote, 
      command: (editor) => editor.chain().focus().toggleBlockquote().run() },
    { title: 'Code Block', description: 'Code snippet', icon: Code, 
      command: (editor) => editor.chain().focus().toggleCodeBlock().run() },
    { title: 'Divider', description: 'Horizontal line', icon: Minus, 
      command: (editor) => editor.chain().focus().setHorizontalRule().run() },
    { title: 'Highlight', description: 'Highlight text', icon: Highlighter, 
      command: (editor) => editor.chain().focus().toggleHighlight().run() },
    { title: 'Table', description: '3×3 table', icon: Grid3X3, 
      command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { title: 'YouTube', description: 'Embed a video', icon: CirclePlay,
      command: () => setIsYoutubeModalOpen(true) },
  ];

  const TEXT_COLORS = [
    { name: 'Default', color: 'inherit' },
    { name: 'Gray', color: '#787774' },
    { name: 'Brown', color: '#976d57' },
    { name: 'Orange', color: '#d9730d' },
    { name: 'Yellow', color: '#cb912f' },
    { name: 'Green', color: '#448361' },
    { name: 'Blue', color: '#337ea9' },
    { name: 'Purple', color: '#9065b0' },
    { name: 'Pink', color: '#c14c8a' },
    { name: 'Red', color: '#d44c47' },
  ];

  const HIGHLIGHT_COLORS = [
    { name: 'Default', color: 'transparent' },
    { name: 'Gray', color: '#f1f1ef' },
    { name: 'Brown', color: '#f4eeee' },
    { name: 'Orange', color: '#fbeced' },
    { name: 'Yellow', color: '#fbf3db' },
    { name: 'Green', color: '#edf3ec' },
    { name: 'Blue', color: '#ebf5f7' },
    { name: 'Purple', color: '#f5f0f7' },
    { name: 'Pink', color: '#f9f0f5' },
    { name: 'Red', color: '#fdebec' },
  ];

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
      Subscript,
      Superscript,
      Highlight,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Youtube.configure({
        inline: false,
        HTMLAttributes: { class: 'youtube-embed' },
      }),
      Placeholder.configure({ placeholder: 'Type / for commands, or just start writing...' }),
      SearchHighlight.configure({ searchQuery }),
    ],
    content: initialContent || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      handleSlashTracking(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      // 1. Table menu tracking
      const isTable = editor.isActive('table');
      if (isTable) {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        
        // Find the current table element in DOM
        const editorDOM = editor.view.dom;
        const selectionNode = window.getSelection()?.focusNode;
        const tableDOM = selectionNode?.nodeType === 1 ? selectionNode.closest('table') : selectionNode?.parentElement?.closest('table');
        
        if (tableDOM) {
          const rect = tableDOM.getBoundingClientRect();
          const wrapperRect = editorDOM.closest('.tiptap-wrapper').getBoundingClientRect();
          setTableMenuPos({
            top: rect.top - wrapperRect.top - 48, // Show above table
            left: rect.left - wrapperRect.left
          });
          setTableMenuOpen(true);
        }
      } else {
        setTableMenuOpen(false);
      }

      // 2. Typewriter scrolling: if cursor is low on screen, scroll it up
      const { selection } = editor.state;
      const { $from } = selection;
      try {
        const coords = editor.view.coordsAtPos($from.pos);
        const viewportHeight = window.innerHeight;
        if (coords.bottom > viewportHeight * 0.6) {
          const scrollContainer = document.querySelector('[class*="contentArea"]');
          if (scrollContainer) {
            scrollContainer.scrollBy({ top: 100, behavior: 'smooth' });
          }
        }
      } catch (e) {}
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => {
      setIsFocused(false);
      setTimeout(() => {
        setSlashMenuOpen(false);
        setColorMenuOpen(false);
      }, 150);
      onSave();
    }
  });

  // Debounced auto-save logic
  useEffect(() => {
    if (!editor || !isFocused) return;

    const timeout = setTimeout(() => {
      onSave();
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(timeout);
  }, [editor?.state.doc.content, isFocused, onSave]);

  useEffect(() => {
    if (editor && searchQuery !== undefined) {
      editor.setOptions({
        extensions: editor.extensionManager.extensions.map(ext => {
          if (ext.name === 'searchHighlight') {
            return ext.configure({ searchQuery });
          }
          return ext;
        })
      });
      // Force a re-render of the decorations by updating the state
      editor.view.dispatch(editor.state.tr);
    }
  }, [editor, searchQuery]);

  // Track slash input for the menu
  const handleSlashTracking = useCallback((editor) => {
    const { state } = editor;
    const { $from } = state.selection;
    const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
    
    const slashMatch = textBefore.match(/\/([a-zA-Z0-9 ]*)$/);
    if (slashMatch) {
      setSlashQuery(slashMatch[1].toLowerCase());
      setSelectedIndex(0);
      
      if (!slashMenuOpen) {
        const coords = editor.view.coordsAtPos($from.pos);
        const editorRect = editor.view.dom.closest('.tiptap-wrapper').getBoundingClientRect();
        setSlashMenuPos({
          top: coords.bottom - editorRect.top + 4,
          left: coords.left - editorRect.left,
        });
        setSlashStartPos($from.pos - slashMatch[0].length);
        setSlashMenuOpen(true);
      }
    } else {
      if (slashMenuOpen) {
        setSlashMenuOpen(false);
        setSlashStartPos(null);
      }
    }
  }, [slashMenuOpen]);

  // Filtered items
  const filteredItems = SLASH_ITEMS.filter(item =>
    item.title.toLowerCase().includes(slashQuery) ||
    item.description.toLowerCase().includes(slashQuery)
  );

  // Execute a slash command
  const executeSlashCommand = useCallback((item) => {
    if (!editor || slashStartPos === null) return;
    const { state } = editor;
    const { $from } = state.selection;
    const to = $from.pos;
    editor.chain().focus().deleteRange({ from: slashStartPos, to }).run();
    item.command(editor);
    setSlashMenuOpen(false);
    setSlashStartPos(null);
    setSlashQuery('');
  }, [editor, slashStartPos]);

  // Keyboard navigation for slash menu
  useEffect(() => {
    if (!editor || !slashMenuOpen) return;
    const handleKeyDown = (event) => {
      if (!slashMenuOpen) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(filteredItems.length, 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(filteredItems.length, 1));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (filteredItems[selectedIndex]) executeSlashCommand(filteredItems[selectedIndex]);
      } else if (event.key === 'Escape') {
        setSlashMenuOpen(false);
        setSlashStartPos(null);
      }
    };
    const el = editor.view.dom;
    el.addEventListener('keydown', handleKeyDown, true);
    return () => el.removeEventListener('keydown', handleKeyDown, true);
  }, [editor, slashMenuOpen, filteredItems, selectedIndex, executeSlashCommand]);

  // Scroll selected item into view
  useEffect(() => {
    if (menuRef.current && slashMenuOpen) {
      const selected = menuRef.current.querySelector('.slash-item.selected');
      if (selected) selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, slashMenuOpen]);

  // When note ID or initial content changes, sync the editor
  useEffect(() => {
    if (editor && initialContent !== undefined) {
      const currentHTML = editor.getHTML();
      // Only update if the ID changed OR if the content is truly different
      // This prevents cursor jumping and accidental wipes
      if (currentHTML !== initialContent) {
        // Use emitUpdate: false to prevent the editor from calling onChange 
        // with the temporary state during initialization
        editor.commands.setContent(initialContent || '', false);
      }
      setSlashMenuOpen(false);
      setTableMenuOpen(false);
      setColorMenuOpen(false);
    }
  }, [noteId, initialContent, editor]);

  if (!editor) return null;

  const ToolbarButton = ({ onClick, isActive, children, title }) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`toolbar-btn ${isActive ? 'active' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className="tiptap-wrapper" style={{ position: 'relative' }}>
      {/* Formatting Toolbar */}
      {editor && isFocused && (<div className="tiptap-toolbar">
        <div className="toolbar-group">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold (⌘B)">
            <Bold size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic (⌘I)">
            <Italic size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline (⌘U)">
            <UnderlineIcon size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
            <Strikethrough size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Inline Code">
            <Code size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive('subscript')} title="Subscript">
            <SubIcon size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive('superscript')} title="Superscript">
            <SupIcon size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title="Highlight"><Highlighter size={15} /></ToolbarButton>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 size={15} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={15} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 size={15} /></ToolbarButton>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List"><List size={15} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List"><ListOrdered size={15} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Quote"><Quote size={15} /></ToolbarButton>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft size={15} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter size={15} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight size={15} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Align Justify"><AlignJustify size={15} /></ToolbarButton>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              const wrapperRect = e.currentTarget.closest('.tiptap-wrapper').getBoundingClientRect();
              setColorMenuPos({
                top: rect.bottom - wrapperRect.top + 8,
                left: Math.max(0, Math.min(rect.left - wrapperRect.left, window.innerWidth - 300))
              });
              setColorMenuOpen(!colorMenuOpen);
            }}
            title="Text Color"
            className={`toolbar-btn ${colorMenuOpen ? 'active' : ''}`}
          >
            <Palette size={15} />
          </button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code Block"><SquareCode size={15} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule"><Minus size={15} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} isActive={editor.isActive('table')} title="Insert Table"><Grid3X3 size={15} /></ToolbarButton>
          <ToolbarButton onClick={() => setIsYoutubeModalOpen(true)} title="YouTube Embed"><CirclePlay size={15} /></ToolbarButton>
        </div>
      </div>)}

      <Modal isOpen={isYoutubeModalOpen} onClose={() => { setIsYoutubeModalOpen(false); setYoutubeUrlInput(''); }} title="Embed YouTube Video" footer={<button onClick={() => { if (youtubeUrlInput) { editor.commands.setYoutubeVideo({ src: youtubeUrlInput }); setIsYoutubeModalOpen(false); setYoutubeUrlInput(''); } }} style={{ padding: '8px 20px', borderRadius: '6px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Embed Video</button>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Paste a link from YouTube to embed it in your note.</p>
          <input autoFocus type="text" placeholder="https://www.youtube.com/watch?v=..." value={youtubeUrlInput} onChange={(e) => setYoutubeUrlInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && youtubeUrlInput) { editor.commands.setYoutubeVideo({ src: youtubeUrlInput }); setIsYoutubeModalOpen(false); setYoutubeUrlInput(''); } }} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--hover-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', fontSize: '14px', outline: 'none' }} />
        </div>
      </Modal>

      {/* Slash Command Menu */}
      {slashMenuOpen && filteredItems.length > 0 && (
        <div ref={menuRef} className="slash-menu" style={{ top: slashMenuPos.top, left: slashMenuPos.left }}>
          <div className="slash-menu-label">Commands</div>
          {filteredItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className={`slash-item ${index === selectedIndex ? 'selected' : ''}`} onMouseDown={(e) => { e.preventDefault(); executeSlashCommand(item); }} onMouseEnter={() => setSelectedIndex(index)}>
                <div className="slash-item-icon"><Icon size={18} /></div>
                <div className="slash-item-text"><span className="slash-item-title">{item.title}</span><span className="slash-item-desc">{item.description}</span></div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table controls */}
      {tableMenuOpen && (
        <div className="table-bubble-menu" style={{ position: 'absolute', top: tableMenuPos.top, left: tableMenuPos.left, zIndex: 100 }}>
          <button onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add column before"><Columns size={14} /><Plus size={10}/></button>
          <button onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add column after"><Columns size={14} /><Plus size={10}/></button>
          <button onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete column" className="danger"><Columns size={14} /><Trash size={10}/></button>
          <div className="divider" />
          <button onClick={() => editor.chain().focus().addRowBefore().run()} title="Add row before"><Rows size={14} /><Plus size={10}/></button>
          <button onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row after"><Rows size={14} /><Plus size={10}/></button>
          <button onClick={() => editor.chain().focus().deleteRow().run()} title="Delete row" className="danger"><Rows size={14} /><Trash size={10}/></button>
          <div className="divider" />
          <button onClick={() => editor.chain().focus().mergeCells().run()} title="Merge cells"><TableCellsMerge size={14} /></button>
          <button onClick={() => editor.chain().focus().splitCell().run()} title="Split cell"><TableCellsSplit size={14} /></button>
          <div className="divider" />
          <button onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table" className="danger"><Trash size={14} /> Table</button>
        </div>
      )}

      {/* Color Menu */}
      {colorMenuOpen && (
        <div className="slash-menu" style={{ top: colorMenuPos.top, left: colorMenuPos.left, width: '220px', padding: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Color</div>
          {TEXT_COLORS.map(c => (
            <div 
              key={c.name} 
              className="slash-item" 
              onMouseDown={(e) => {
                e.preventDefault();
                if (c.color === 'inherit') editor.chain().focus().unsetColor().run();
                else editor.chain().focus().setColor(c.color).run();
                setColorMenuOpen(false);
              }}
            >
              <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: '1px solid var(--border-color)', background: c.color === 'inherit' ? 'var(--text-color)' : c.color, marginRight: '8px' }} />
              <span style={{ fontSize: '13px' }}>{c.name}</span>
            </div>
          ))}
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 4px' }} />
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Background</div>
          {HIGHLIGHT_COLORS.map(c => (
            <div 
              key={c.name} 
              className="slash-item" 
              onMouseDown={(e) => {
                e.preventDefault();
                if (c.color === 'transparent') editor.chain().focus().unsetHighlight().run();
                else editor.chain().focus().setHighlight({ color: c.color }).run();
                setColorMenuOpen(false);
              }}
            >
              <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: '1px solid var(--border-color)', background: c.color, marginRight: '8px' }} />
              <span style={{ fontSize: '13px' }}>{c.name} Background</span>
            </div>
          ))}
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
