import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5005/api';

const useStore = create((set, get) => ({
  notes: [],
  boards: [],
  tasks: [],
  activeBoardId: null,
  activeNoteId: null,
  isLoadingBoards: true,
  globalSearchQuery: '',
  
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),
  setActiveNoteId: (id) => set({ activeNoteId: id }),
  
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
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axios.put(`${API_URL}/notes/${id}`, updates, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      set((state) => ({
        notes: state.notes.map(n => n._id === id ? res.data : n)
      }));
    } catch (error) {
      console.error(error);
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
      if (res.data.length > 0 && !get().activeBoardId) {
        set({ activeBoardId: res.data[0]._id });
        get().fetchTasks(res.data[0]._id);
      }
    } catch (error) {
      console.error(error);
      set({ isLoadingBoards: false });
    }
  },
  createBoard: async (name) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axios.post(`${API_URL}/boards`, { name }, {
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
  setActiveBoardId: (id) => {
    set({ activeBoardId: id });
    get().fetchTasks(id);
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
