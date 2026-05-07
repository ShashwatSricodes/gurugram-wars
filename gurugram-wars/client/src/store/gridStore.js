import { create } from 'zustand';

export const useGridStore = create((set, get) => ({
  cells: {},
  user: null,
  onlineCount: 0,
  leaderboard: [],
  toasts: [],
  cooldownUntil: null,

  setUser: (user) => set({ user }),

  loadGridState: (cellArray) => {
    const cells = {};
    cellArray.forEach(c => { cells[c.cellId] = c; });
    set({ cells });
  },

  updateCell: (cell) => set((state) => ({
    cells: { ...state.cells, [cell.cellId]: cell }
  })),

  // NEW
  removeCell: (cellId) => set((state) => {
    const cells = { ...state.cells };
    delete cells[cellId];
    return { cells };
  }),

  setOnlineCount: (count) => set({ onlineCount: count }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setCooldown: (ms) => set({ cooldownUntil: Date.now() + ms }),

  addToast: (toast) => {
    const id = Date.now() + Math.random();
    set((state) => ({
      toasts: [...state.toasts.slice(-4), { ...toast, id }]
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }));
    }, 3000);
  },
}));