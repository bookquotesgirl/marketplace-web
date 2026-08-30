import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useCartStore } from './cartStore';

// Token persisted to sessionStorage — survives page refresh, cleared when tab closes.
// Never goes to localStorage per security policy.
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: ({ user, token }) => {
        set({ user, token });
        // Load this user's cart from their scoped localStorage key.
        useCartStore.getState()._loadForUser(user._id);
      },
      logout: () => {
        // Clear in-memory cart without wiping storage so the user's
        // items are restored on next login. Then clear auth state.
        useCartStore.getState()._clearForLogout();
        set({ user: null, token: null });
      },
    }),
    {
      name: 'kitman-auth',
      storage: createJSONStorage(() => sessionStorage),
      // After sessionStorage is rehydrated on page reload, restore the
      // user's cart from their scoped localStorage key.
      onRehydrateStorage: () => (state) => {
        if (state?.user?._id) {
          useCartStore.getState()._loadForUser(state.user._id);
        }
        // Remove the old shared cart key so no stale data can leak.
        try { localStorage.removeItem('kitman-cart'); } catch (_) { /* ignore */ }
      },
    }
  )
);
