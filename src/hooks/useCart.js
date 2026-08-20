import { useCartStore } from '../store/cartStore';

// Thin selector hook over cartStore — the app-facing API for cart state.
export function useCart() {
  const items = useCartStore((s) => s.items);
  const add = useCartStore((s) => s.add);
  const updateQty = useCartStore((s) => s.updateQty);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const count = useCartStore((s) => s.count());
  const total = useCartStore((s) => s.total());
  return { items, add, updateQty, remove, clear, count, total };
}
