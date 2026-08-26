import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Token persisted to sessionStorage — survives page refresh, cleared when tab closes.
// Never goes to localStorage per security policy.
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: ({ user, token }) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'kitman-auth', storage: createJSONStorage(() => sessionStorage) }
  )
);
