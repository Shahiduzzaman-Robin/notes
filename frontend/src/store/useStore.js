import { create } from 'zustand';
import axios from 'axios';

const API_URL = '/api';

const useStore = create((set, get) => ({
  notes: [],
  boards: [],
  tasks: [],
  noteFolders: [],
  boardFolders: [],
  activeBoardId: null,
  activeNoteId: null,
  activeFolderId: null,
  isLoadingBoards: true,
  isLoadingFolders: true,
  globalSearchQuery: '',
  activeTab: 'notes',
  isLoading: false,
  
  bootstrap: async () => {
    try {
      set({ isLoading: true });
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        set({ isLoading: false });
        return;
      }

      console.log('Syncing data from:', API_URL);
      const start = Date.now();

      const res = await axios.get(`${API_URL}/sync/bootstrap`, {
        headers: { Authorization: `Bearer ${user.token}` },
        timeout: 10000 // 10 second timeout
      });

      console.log(`Sync completed in ${Date.now() - start}ms`);

      set({ 
        notes: res.data.notes || [],
        noteFolders: (res.data.folders || []).filter(f => f.type === 'notes'),
        boardFolders: (res.data.folders || []).filter(f => f.type === 'boards'),
        boards: res.data.boards || [],
        tasks: res.data.tasks || [],
        isLoading: false,
        isLoadingFolders: false,
        isLoadingBoards: false
      });
    } catch (error) {
      console.error('Bootstrap failed:', error.message);
      if (error.code === 'ECONNABORTED') {
        console.error('Request timed out');
      }
      set({ isLoading: false });
    }
  },
  setActiveTab: (tab) => {
    set({ activeTab: tab });
    localStorage.setItem('activeTab', tab);
  },
  setActiveNoteId: async (id) => {
    if (!id) {
      set({ activeNoteId: null });
      return;
    }
    set({ activeNoteId: id, activeFolderId: null, activeBoardId: null, activeTab: 'notes' });

    // Lazy-load: if bootstrap didn't include content, fetch it now
    const currentNote = get().notes.find(n => n._id === id);
    if (currentNote && currentNote.content === undefined) {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const res = await axios.get(`${API_URL}/notes/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        set((state) => ({
          notes: state.notes.map(n => n._id === id ? res.data : n)
        }));
      } catch (error) {
        console.error('Failed to fetch note content:', error);
      }
    }
  },
  setActiveBoardId: (id) => {
    set({ activeBoardId: id, activeFolderId: null, activeNoteId: null, activeTab: 'boards' });
    get().fetchTasks(id);
  },
  setActiveFolderId: (id, type) => set({ activeFolderId: id, activeNoteId: null, activeBoardId: null, activeTab: type || get().activeTab }),
  
  // Folder Actions
  fetchFolders: async () => {
    try {
      set({ isLoadingFolders: true });
      const user = JSON.parse(localStorage.getItem('user'));
      
      const [notesRes, boardsRes] = await Promise.all([
        axios.get(`${API_URL}/folders?type=notes`, {
          headers: { Authorization: `Bearer ${user.token}` }
        }),
        axios.get(`${API_URL}/folders?type=boards`, {
          headers: { Authorization: `Bearer ${user.token}` }
        })
      ]);

      set({ 
        noteFolders: notesRes.data, 
        boardFolders: boardsRes.data, 
        isLoadingFolders: false 
      });
    } catch (error) {
      console.error(error);
      set({ isLoadingFolders: false });
    }
  },
  addFolder: async (folderData) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axios.post(`${API_URL}/folders`, folderData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const type = folderData.type || 'notes';
      const key = type === 'notes' ? 'noteFolders' : 'boardFolders';
      set((state) => ({ [key]: [...state[key], res.data] }));
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  updateFolder: async (id, updates, type = 'notes') => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axios.put(`${API_URL}/folders/${id}`, updates, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const key = type === 'notes' ? 'noteFolders' : 'boardFolders';
      set((state) => ({
        [key]: state[key].map(f => f._id === id ? res.data : f)
      }));
    } catch (error) {
      console.error(error);
    }
  },
  deleteFolder: async (id, type = 'notes') => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await axios.delete(`${API_URL}/folders/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const key = type === 'notes' ? 'noteFolders' : 'boardFolders';
      set((state) => ({ 
        [key]: state[key].filter(f => f._id !== id),
      }));
      get().fetchNotes();
      get().fetchBoards();
    } catch (error) {
      console.error(error);
    }
  },
  
  // Note Actions
  fetchNotes: async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axios.get(`${API_URL}/notes`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      set({ notes: res.data });
    } catch (error) {
      console.error(error);
    }
  },
  addNote: async (noteData) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axios.post(`${API_URL}/notes`, noteData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      set((state) => ({ notes: [res.data, ...state.notes] }));
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  updateNote: async (id, updates) => {
    // Optimistic Update: update local state immediately
    set((state) => ({
      notes: state.notes.map(n => n._id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n)
    }));

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axios.put(`${API_URL}/notes/${id}`, updates, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      // Update with final data from server (id, correct timestamps, etc.)
      set((state) => ({
        notes: state.notes.map(n => n._id === id ? res.data : n)
      }));
    } catch (error) {
      console.error('Failed to sync note with server:', error);
      // Optional: rollback state if critical, but for auto-save, we usually just log it
    }
  },
  deleteNote: async (id) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await axios.delete(`${API_URL}/notes/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      set((state) => ({ notes: state.notes.filter(n => n._id !== id) }));
    } catch (error) {
      console.error(error);
    }
  },

  // Board Actions
  fetchBoards: async () => {
    try {
      set({ isLoadingBoards: true });
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axios.get(`${API_URL}/boards`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      set({ boards: res.data, isLoadingBoards: false });
    } catch (error) {
      console.error(error);
      set({ isLoadingBoards: false });
    }
  },
  createBoard: async (name, folderId = null) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axios.post(`${API_URL}/boards`, { name, folder: folderId }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      set((state) => ({ boards: [...state.boards, res.data] }));
      if (!get().activeBoardId) {
        set({ activeBoardId: res.data._id });
      }
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  updateBoard: async (id, name) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axios.put(`${API_URL}/boards/${id}`, { name }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      set((state) => ({
        boards: state.boards.map(b => b._id === id ? res.data : b)
      }));
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  deleteBoard: async (id) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await axios.delete(`${API_URL}/boards/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const remainingBoards = get().boards.filter(b => b._id !== id);
      set({ boards: remainingBoards });
      if (get().activeBoardId === id) {
        const nextBoardId = remainingBoards.length > 0 ? remainingBoards[0]._id : null;
        set({ activeBoardId: nextBoardId });
        if (nextBoardId) get().fetchTasks(nextBoardId);
      }
    } catch (error) {
      console.error(error);
    }
  },


  // Task Actions
  fetchTasks: async (boardId) => {
    if (!boardId) return;
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axios.get(`${API_URL}/tasks?boardId=${boardId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      set({ tasks: res.data });
    } catch (error) {
      console.error(error);
    }
  },
  addTask: async (taskData) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axios.post(`${API_URL}/tasks`, taskData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      set((state) => ({ tasks: [...state.tasks, res.data] }));
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  updateTask: async (id, updates) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axios.put(`${API_URL}/tasks/${id}`, updates, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      set((state) => ({
        tasks: state.tasks.map(t => t._id === id ? res.data : t)
      }));
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  deleteTask: async (id) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await axios.delete(`${API_URL}/tasks/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      set((state) => ({ tasks: state.tasks.filter(t => t._id !== id) }));
    } catch (error) {
      console.error(error);
    }
  },
  reorderTasks: async (tasks) => {
    // Expected to receive array of all tasks in the board to update them optimistically
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      set({ tasks });
      
      const payload = tasks.map((t, idx) => ({ id: t._id, columnId: t.columnId, order: idx }));
      await axios.put(`${API_URL}/tasks/reorder`, { tasks: payload }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
    } catch (error) {
      console.error(error);
    }
  }
}));

export default useStore;
