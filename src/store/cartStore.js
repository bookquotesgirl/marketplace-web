import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// Cart persists to localStorage so it survives refresh (per plan).
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // { productId, variantId, title, price, qty, vendor }
      add: (item) =>
        set((s) => {
          const i = s.items.findIndex(
            (x) => x.productId === item.productId && x.variantId === item.variantId
          );
          if (i > -1) {
            const items = [...s.items];
            items[i] = { ...items[i], qty: items[i].qty + (item.qty || 1) };
            return { items };
          }
          return { items: [...s.items, { ...item, qty: item.qty || 1 }] };
        }),
      updateQty: (productId, variantId, qty) =>
        set((s) => ({
          items: s.items.map((x) =>
            x.productId === productId && x.variantId === variantId ? { ...x, qty } : x
          ),
        })),
      remove: (productId, variantId) =>
        set((s) => ({
          items: s.items.filter((x) => !(x.productId === productId && x.variantId === variantId)),
        })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, x) => n + x.qty, 0),
      total: () => get().items.reduce((n, x) => n + x.price * x.qty, 0),
    }),
    { name: 'kitman-cart' }
  )
);
