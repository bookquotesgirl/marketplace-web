import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from './useAuth';

// Wishlist membership is server state (like orders/products), so it isn't cached in a
// Zustand store — each page that needs it calls this hook and fetches once per mount.
// GET /api/wishlist is buyer-only (401 for guests, 403 for vendor/admin accounts).
export function useWishlist() {
  const { isAuthed, user } = useAuth();
  const isBuyer = isAuthed && user?.role === 'buyer';
  const [ids, setIds] = useState(new Set());
  const [loading, setLoading] = useState(isBuyer);

  useEffect(() => {
    if (!isBuyer) {
      setIds(new Set());
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .get('/wishlist')
      .then((res) => {
        if (cancelled) return;
        const items = res.data?.wishlist?.items ?? [];
        setIds(new Set(items.map((i) => i.productId?._id ?? i.productId)));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isBuyer]);

  // Optimistic toggle, rolled back if the request fails.
  const toggle = useCallback(
    (productId) => {
      if (!isBuyer) return Promise.reject(new Error('not-a-buyer'));
      const wasSaved = ids.has(productId);
      setIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(productId);
        else next.add(productId);
        return next;
      });
      const request = wasSaved
        ? api.delete(`/wishlist/${productId}`)
        : api.post('/wishlist', { productId });
      return request.catch((err) => {
        setIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(productId);
          else next.delete(productId);
          return next;
        });
        throw err;
      });
    },
    [ids, isBuyer]
  );

  return { ids, loading, isBuyer, has: (id) => ids.has(id), toggle };
}
