import { create } from 'zustand';

// User-scoped localStorage key. Returns null for unauthenticated sessions.
const storageKey = (uid) => (uid ? `kitman-cart:${uid}` : null);

function readItems(uid) {
  const key = storageKey(uid);
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function writeItems(uid, items) {
  const key = storageKey(uid);
  if (!key) return; // guest session — in-memory only, no persistence
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (_) {
    // localStorage unavailable (private browsing quota, etc.) — silently skip
  }
}

export const useCartStore = create((set, get) => ({
  // _userId is set by authStore on login/logout/hydration.
  // Never import authStore here — that would create a circular dependency.
  _userId: null,
  items: [], // { productId, variantId, title, price, qty, vendor }

  // Called by authStore after setAuth / onRehydrateStorage.
  _loadForUser: (userId) => {
    const items = readItems(userId);
    set({ _userId: userId, items });
  },

  // Called by authStore on logout. Clears in-memory cart without
  // touching storage so the user's cart is restored on next login.
  _clearForLogout: () => {
    set({ _userId: null, items: [] });
  },

  add: (item) =>
    set((s) => {
      const i = s.items.findIndex(
        (x) => x.productId === item.productId && x.variantId === item.variantId
      );
      let items;
      if (i > -1) {
        items = [...s.items];
        items[i] = { ...items[i], qty: items[i].qty + (item.qty || 1) };
      } else {
        items = [...s.items, { ...item, qty: item.qty || 1 }];
      }
      writeItems(s._userId, items);
      return { items };
    }),

  updateQty: (productId, variantId, qty) =>
    set((s) => {
      const items = s.items.map((x) =>
        x.productId === productId && x.variantId === variantId ? { ...x, qty } : x
      );
      writeItems(s._userId, items);
      return { items };
    }),

  remove: (productId, variantId) =>
    set((s) => {
      const items = s.items.filter(
        (x) => !(x.productId === productId && x.variantId === variantId)
      );
      writeItems(s._userId, items);
      return { items };
    }),

  // Clears the cart AND persists the empty state (used after checkout).
  clear: () =>
    set((s) => {
      writeItems(s._userId, []);
      return { items: [] };
    }),

  count: () => get().items.reduce((n, x) => n + x.qty, 0),
  total: () => get().items.reduce((n, x) => n + x.price * x.qty, 0),
}));
