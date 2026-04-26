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
  Plus,
  FolderPlus,
  Menu,
  X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import useStore from '../store/useStore';
import Notes from '../components/Notes';
import KanbanBoard from '../components/KanbanBoard';
import FolderTree from '../components/FolderTree';
import FolderView from '../components/FolderView';
import Modal from '../components/Modal';

export default function Home() {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { 
    globalSearchQuery, setGlobalSearchQuery, 
    boards, activeBoardId, setActiveBoardId, 
    notes, fetchNotes, activeNoteId, setActiveNoteId, addNote,
    noteFolders, boardFolders, fetchFolders, addFolder, fetchBoards,
    activeFolderId, setActiveFolderId, activeTab, setActiveTab
  } = useStore();
  const router = useRouter();
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newBoardName, setNewBoardName] = useState('');
  const [newNoteName, setNewNoteName] = useState('');
  const [targetFolderId, setTargetFolderId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const { changePassword } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchNotes();
      fetchFolders();
      fetchBoards();
    }
  }, [user, loading, router, fetchNotes, fetchFolders, fetchBoards]);

  useEffect(() => {
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) setActiveTab(savedTab);
  }, [setActiveTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setActiveFolderId(null, tab);
  };

  const handleAddNote = (e) => {
    if (e) e.stopPropagation();
    setNewNoteName('');
    setTargetFolderId(null);
    setIsNoteModalOpen(true);
  };

  const handleNoteCreateSubmit = async () => {
    if (newNoteName.trim()) {
      setActiveTab('notes');
      const newNote = await addNote({ title: newNoteName, content: '', folder: targetFolderId });
      if (newNote) {
        setActiveNoteId(newNote._id);
      }
      setNewNoteName('');
      setIsNoteModalOpen(false);
    }
  };

  const handleAddFolder = (e) => {
    e.stopPropagation();
    setIsFolderModalOpen(true);
  };

  const handleFolderCreateSubmit = async () => {
    if (newFolderName.trim()) {
      await addFolder({ name: newFolderName, type: activeTab === 'notes' ? 'notes' : 'boards' });
      setNewFolderName('');
      setIsFolderModalOpen(false);
    }
  };

  const handleBoardCreateSubmit = async () => {
    if (newBoardName.trim()) {
      const newBoard = await createBoard(newBoardName);
      if (newBoard) {
        setActiveBoardId(newBoard._id);
        setActiveTab('boards');
      }
      setNewBoardName('');
      setIsBoardModalOpen(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    
    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordData.new.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    const res = await changePassword(passwordData.current, passwordData.new);
    if (res.success) {
      setPasswordSuccess('Password updated successfully!');
      setPasswordData({ current: '', new: '', confirm: '' });
      setTimeout(() => setIsSettingsModalOpen(false), 2000);
    } else {
      setPasswordError(res.message);
    }
  };

  if (loading || !user) {
    return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <Modal 
        isOpen={isFolderModalOpen} 
        onClose={() => setIsFolderModalOpen(false)}
        title="Create New Folder"
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setIsFolderModalOpen(false)}
              style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: 'var(--text-secondary)', background: 'transparent' }}
            >
              Cancel
            </button>
            <button 
              onClick={handleFolderCreateSubmit}
              style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: '#fff', background: 'var(--primary)', border: 'none', fontWeight: 500, cursor: 'pointer' }}
            >
              Create
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Folder Name</label>
          <input 
            autoFocus
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleFolderCreateSubmit(); }}
            placeholder="Enter name..."
            style={{ 
              padding: '10px 12px', 
              borderRadius: '8px', 
              background: 'var(--hover-bg)', 
              border: '1px solid var(--border-color)', 
              color: 'var(--text-color)',
              outline: 'none',
              fontSize: '14px'
            }}
          />
        </div>
      </Modal>

      <Modal 
        isOpen={isNoteModalOpen} 
        onClose={() => setIsNoteModalOpen(false)}
        title="Create New Note"
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setIsNoteModalOpen(false)}
              style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: 'var(--text-secondary)', background: 'transparent' }}
            >
              Cancel
            </button>
            <button 
              onClick={handleNoteCreateSubmit}
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
            autoFocus
            type="text"
            value={newNoteName}
            onChange={(e) => setNewNoteName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNoteCreateSubmit(); }}
            placeholder="Enter title..."
            style={{ 
              padding: '10px 12px', 
              borderRadius: '8px', 
              background: 'var(--hover-bg)', 
              border: '1px solid var(--border-color)', 
              color: 'var(--text-color)',
              outline: 'none',
              fontSize: '14px'
            }}
          />
        </div>
      </Modal>

      <Modal 
        isOpen={isBoardModalOpen} 
        onClose={() => setIsBoardModalOpen(false)}
        title="Create New Board"
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setIsBoardModalOpen(false)}
              style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: 'var(--text-secondary)', background: 'transparent' }}
            >
              Cancel
            </button>
            <button 
              onClick={handleBoardCreateSubmit}
              style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: '#fff', background: 'var(--primary)', border: 'none', fontWeight: 500, cursor: 'pointer' }}
            >
              Create
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Board Name</label>
          <input 
            autoFocus
            type="text"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleBoardCreateSubmit(); }}
            placeholder="Enter board name..."
            style={{ 
              padding: '10px 12px', 
              borderRadius: '8px', 
              background: 'var(--hover-bg)', 
              border: '1px solid var(--border-color)', 
              color: 'var(--text-color)',
              outline: 'none',
              fontSize: '14px'
            }}
          />
        </div>
      </Modal>

      <Modal 
        isOpen={isSettingsModalOpen} 
        onClose={() => { setIsSettingsModalOpen(false); setPasswordError(''); setPasswordSuccess(''); }}
        title="User Settings"
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setIsSettingsModalOpen(false)}
              style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: 'var(--text-secondary)', background: 'transparent' }}
            >
              Cancel
            </button>
            <button 
              onClick={handlePasswordChange}
              style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: '#fff', background: 'var(--primary)', border: 'none', fontWeight: 500, cursor: 'pointer' }}
            >
              Update Password
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Change Password</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Update your account security.</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Current Password</label>
            <input 
              type="password"
              value={passwordData.current}
              onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
              style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--hover-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', outline: 'none', fontSize: '14px' }}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>New Password</label>
            <input 
              type="password"
              value={passwordData.new}
              onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
              style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--hover-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', outline: 'none', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Confirm New Password</label>
            <input 
              type="password"
              value={passwordData.confirm}
              onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
              style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--hover-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', outline: 'none', fontSize: '14px' }}
            />
          </div>

          {passwordError && <p style={{ margin: 0, fontSize: '12px', color: 'var(--danger)' }}>{passwordError}</p>}
          {passwordSuccess && <p style={{ margin: 0, fontSize: '12px', color: '#10b981' }}>{passwordSuccess}</p>}
        </div>
      </Modal>
      <div 
        className={`${styles.sidebarOverlay} ${isSidebarOpen ? styles.active : ''}`} 
        onClick={() => setIsSidebarOpen(false)} 
      />
      <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
        <div className={styles.brand} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layout className="text-primary" />
            <span>Notes by Robin</span>
          </div>
          <button 
            className={styles.menuBtn} 
            onClick={() => setIsSidebarOpen(false)}
            style={{ marginRight: 0 }}
          >
            <X size={20} />
          </button>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className={styles.sectionLabel}>Notes</div>
          <div 
            className={`${styles.navItem} ${activeTab === 'notes' ? styles.active : ''}`}
            onClick={() => handleTabChange('notes')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={18} />
              <span>Personal Notes</span>
            </div>
            {activeTab === 'notes' && (
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  onClick={(e) => handleAddFolder(e)}
                  style={{ padding: '4px', borderRadius: '4px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                  title="New Folder"
                >
                  <FolderPlus size={14} />
                </button>
                <button 
                  onClick={(e) => handleAddNote(e)}
                  style={{ padding: '4px', borderRadius: '4px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                  title="New Note"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Hierarchical Folder Tree for Notes */}
          <div style={{ marginLeft: '12px', marginTop: '4px', marginBottom: '8px' }}>
            <FolderTree folders={noteFolders} notes={notes} boards={boards} type="notes" />
          </div>

          <div className={styles.sidebarDivider} />
          
          <div className={styles.sectionLabel}>Management</div>
          <div 
            className={`${styles.navItem} ${activeTab === 'boards' ? styles.active : ''}`}
            onClick={() => handleTabChange('boards')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Kanban size={18} />
              <span>Workflow Tracker</span>
            </div>
            {activeTab === 'boards' && (
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  onClick={(e) => handleAddFolder(e)}
                  style={{ padding: '4px', borderRadius: '4px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                  title="New Folder"
                >
                  <FolderPlus size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsBoardModalOpen(true); }}
                  style={{ padding: '4px', borderRadius: '4px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                  title="New Board"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Hierarchical Folder Tree for Boards */}
          <div style={{ marginLeft: '12px', marginTop: '4px', marginBottom: '8px' }}>
            <FolderTree folders={boardFolders} notes={notes} boards={boards} type="boards" />
          </div>
        </nav>

        <div className={styles.userProfile}>
          <div className={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.name}</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => setIsSettingsModalOpen(true)} className={styles.logoutBtn} style={{ color: 'var(--text-secondary)' }}>Settings</button>
              <span style={{ color: 'var(--border-color)' }}>•</span>
              <button onClick={logout} className={styles.logoutBtn}>Logout</button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <header className={styles.topbar}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className={styles.menuBtn} onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
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

        <main className={styles.contentArea} style={{ padding: (activeTab === 'notes' && activeNoteId) ? '0' : undefined }}>
          {(activeFolderId || (activeTab === 'notes' && !activeNoteId) || (activeTab === 'boards' && !activeBoardId)) ? (
            <FolderView folderId={activeFolderId} type={activeTab} />
          ) : activeTab === 'notes' ? (
            <Notes />
          ) : (
            <KanbanBoard />
          )}
        </main>
      </div>
    </div>
  );
}
