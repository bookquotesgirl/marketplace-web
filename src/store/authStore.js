import { create } from 'zustand';
// Token kept in memory (per plan). Rehydrate-from-refresh comes later.
export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  setAuth: ({ user, token }) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
  isAuthed: () => Boolean(useAuthStore.getState().token),
}));
