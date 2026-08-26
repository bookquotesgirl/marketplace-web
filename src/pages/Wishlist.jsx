import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, ShoppingBag } from 'lucide-react';
import api from '../lib/api';
import { useCart } from '../hooks/useCart';
import { Spinner } from '../components/ui';

// GET /api/wishlist only populates `title price stock` on each item's product (see
// wishlist.controller.js) — no slug or images, so cards here can't link to the product page
// or show a photo. Documented as a backend gap rather than expanding the populate ourselves.
function itemProductId(item) {
  return item.productId?._id ?? item.productId;
}

export default function Wishlist() {
  const { t } = useTranslation();
  const { add } = useCart();

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/wishlist')
      .then((res) => {
        if (cancelled) return;
        setItems(res.data?.wishlist?.items ?? []);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRemove = (productId) => {
    setBusyId(productId);
    return api
      .delete(`/wishlist/${productId}`)
      .then(() => setItems((prev) => prev.filter((i) => itemProductId(i) !== productId)))
      .finally(() => setBusyId(null));
  };

  const handleMoveToCart = (item) => {
    const productId = itemProductId(item);
    add({ productId, variantId: null, title: item.productId?.title, price: item.productId?.price });
    handleRemove(productId);
  };

  const handleMoveAll = () => {
    items.filter((i) => (i.productId?.stock ?? 0) > 0).forEach(handleMoveToCart);
  };

  if (status === 'loading') {
    return (
      <section className="max-w-7xl mx-auto px-4 py-16 grid place-items-center">
        <Spinner />
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className="max-w-7xl mx-auto px-4 py-16 text-center text-ink/60 dark:text-slate-400">
        {t('common.error')}
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-extrabold">
          {t('wishlist.title')}{' '}
          <span className="text-ink/40 dark:text-slate-500 font-bold text-xl">({items.length})</span>
        </h1>
        {items.length > 0 && (
          <button
            onClick={handleMoveAll}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-forest text-white text-sm font-semibold hover:bg-forest-dark transition"
          >
            <ShoppingBag className="w-4 h-4" />
            {t('wishlist.moveAll')}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-10 py-16 flex flex-col items-center text-center">
          <span className="inline-grid place-items-center w-20 h-20 rounded-full bg-black/5 dark:bg-white/10 mb-4">
            <Heart className="w-10 h-10 text-ink/40" />
          </span>
          <p className="text-lg font-bold">{t('wishlist.emptyTitle')}</p>
          <p className="text-ink/60 dark:text-slate-400 mt-1">{t('wishlist.emptyBody')}</p>
          <Link
            to="/browse"
            className="inline-block mt-6 px-5 h-11 leading-[44px] rounded-2xl font-semibold bg-forest text-white hover:bg-forest-dark"
          >
            {t('orders.browseProducts')}
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const p = item.productId;
            const productId = itemProductId(item);
            const inStock = (p?.stock ?? 0) > 0;
            const busy = busyId === productId;
            return (
              <div
                key={productId}
                className="bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft overflow-hidden"
              >
                <div className="relative aspect-square bg-black/5 grid place-items-center">
                  <span className="text-ink/20 text-5xl font-bold select-none">
                    {p?.title?.[0]?.toUpperCase() ?? '?'}
                  </span>
                  <button
                    onClick={() => handleRemove(productId)}
                    disabled={busy}
                    aria-label={t('common.removeFromWishlist')}
                    className="absolute top-2.5 end-2.5 grid place-items-center w-9 h-9 rounded-full bg-white/95 dark:bg-slate-900/90 text-crimson shadow-soft hover:bg-crimson hover:text-white active:scale-90 transition disabled:opacity-40"
                  >
                    <Heart className="w-[18px] h-[18px]" fill="currentColor" />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold line-clamp-2 h-9">{p?.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-extrabold text-forest">
                      ETB {Number(p?.price ?? 0).toLocaleString()}
                    </span>
                    {!inStock && <span className="text-xs text-crimson font-semibold">{t('product.outOfStock')}</span>}
                  </div>
                  <button
                    onClick={() => handleMoveToCart(item)}
                    disabled={!inStock || busy}
                    className={`mt-3 w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-xl font-semibold text-sm transition active:scale-95 ${
                      inStock
                        ? 'bg-forest/10 text-forest hover:bg-forest hover:text-white'
                        : 'bg-black/5 dark:bg-white/5 text-ink/40 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {t('wishlist.moveToCart')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
