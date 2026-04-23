"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';
import { 
  Layout, 
  FileText, 
  Kanban, 
  Settings, 
  Moon, 
  Sun,
  Search,
  Bell,
  Plus
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import useStore from '../store/useStore';
import Notes from '../components/Notes';
import KanbanBoard from '../components/KanbanBoard';

export default function Home() {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { globalSearchQuery, setGlobalSearchQuery, boards, activeBoardId, setActiveBoardId, notes, fetchNotes, activeNoteId, setActiveNoteId, addNote } = useStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('notes');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchNotes();
    }
  }, [user, loading, router, fetchNotes]);

  useEffect(() => {
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) setActiveTab(savedTab);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('activeTab', tab);
  };

  const handleAddNote = async (e) => {
    e.stopPropagation();
    setActiveTab('notes');
    const newNote = await addNote({ title: '', content: '' });
    if (newNote) {
      setActiveNoteId(newNote._id);
    }
  };

  if (loading || !user) {
    return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.sidebar}>
        <div className={styles.brand}>
          <Layout className="text-primary" />
          <span>Workspace</span>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div 
            className={`${styles.navItem} ${activeTab === 'notes' ? styles.active : ''}`}
            onClick={() => handleTabChange('notes')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={20} />
              <span>Notes</span>
            </div>
            {activeTab === 'notes' && (
              <button 
                onClick={handleAddNote}
                style={{ padding: '4px', borderRadius: '4px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-color)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <Plus size={16} />
              </button>
            )}
          </div>

          {/* Sub-list of Notes */}
          {activeTab === 'notes' && notes && notes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '32px', marginTop: '4px', marginBottom: '8px' }}>
              {notes.filter(n => {
                if (!globalSearchQuery) return true;
                const query = globalSearchQuery.toLowerCase();
                const inTitle = (n.title || '').toLowerCase().includes(query);
                const inContent = (n.content || '').toLowerCase().includes(query);
                const inTags = (n.tags || []).some(t => t.toLowerCase().includes(query));
                return inTitle || inContent || inTags;
              }).map(n => (
                <div 
                  key={n._id}
                  onClick={() => setActiveNoteId(n._id)}
                  style={{
                    fontSize: '13px',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: n._id === activeNoteId ? 'var(--text-color)' : 'var(--text-secondary)',
                    fontWeight: n._id === activeNoteId ? 600 : 400,
                    background: n._id === activeNoteId ? 'var(--hover-bg)' : 'transparent',
                    transition: 'background 0.1s',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  onMouseOver={(e) => { if (n._id !== activeNoteId) e.currentTarget.style.background = 'var(--hover-bg)' }}
                  onMouseOut={(e) => { if (n._id !== activeNoteId) e.currentTarget.style.background = 'transparent' }}
                >
                  {n.title || 'Untitled'}
                </div>
              ))}
            </div>
          )}

          <div 
            className={`${styles.navItem} ${activeTab === 'boards' ? styles.active : ''}`}
            onClick={() => handleTabChange('boards')}
          >
            <Kanban size={20} />
            <span>Workflow Tracker</span>
          </div>
          
          {/* Sub-list of Boards */}
          {activeTab === 'boards' && boards && boards.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '32px', marginTop: '4px', marginBottom: '8px' }}>
              {boards.map(b => (
                <div 
                  key={b._id}
                  onClick={() => setActiveBoardId(b._id)}
                  style={{
                    fontSize: '13px',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: b._id === activeBoardId ? 'var(--text-color)' : 'var(--text-secondary)',
                    fontWeight: b._id === activeBoardId ? 600 : 400,
                    background: b._id === activeBoardId ? 'var(--hover-bg)' : 'transparent',
                    transition: 'background 0.1s'
                  }}
                  onMouseOver={(e) => { if (b._id !== activeBoardId) e.currentTarget.style.background = 'var(--hover-bg)' }}
                  onMouseOut={(e) => { if (b._id !== activeBoardId) e.currentTarget.style.background = 'transparent' }}
                >
                  {b.name}
                </div>
              ))}
            </div>
          )}
        </nav>

        <div className={styles.userProfile}>
          <div className={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.name}</span>
            <button onClick={logout} className={styles.logoutBtn}>Logout</button>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <header className={styles.topbar}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '4px 12px', borderRadius: '4px', width: '240px', border: '1px solid var(--border-color)', background: 'var(--hover-bg)' }}>
            <Search size={16} style={{ color: 'var(--text-secondary)', marginRight: '8px' }} />
            <input 
              type="text" 
              placeholder="Search everywhere..." 
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', width: '100%', color: 'var(--text-color)', fontSize: '13px', outline: 'none' }} 
            />
          </div>

          <div className={styles.headerActions}>
            <button className={styles.iconBtn} onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className={styles.iconBtn}>
              <Bell size={20} />
            </button>
          </div>
        </header>

        <main className={styles.contentArea} style={{ padding: activeTab === 'notes' ? '0' : undefined }}>
          {activeTab === 'notes' ? (
            <Notes />
          ) : (
            <KanbanBoard />
          )}
        </main>
      </div>
    </div>
  );
}
