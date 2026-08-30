import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import api, { resolveAssetUrl } from '../lib/api';
import { mapProductCard } from '../lib/mapProduct';
import { ProductCard, Spinner } from '../components/ui';
import { useWishlist } from '../hooks/useWishlist';

// Public vendor storefront — GET /api/vendors/:slug. Real backend data only: no follower/sales
// counters or follow/chat actions, since none of that exists on the Vendor model or API yet.
export default function Store() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const wishlist = useWishlist();

  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    api
      .get(`/vendors/${slug}`, { params: { page, limit: 12 } })
      .then((res) => {
        if (cancelled) return;
        const payload = res.data?.data ?? res.data ?? {};
        setVendor(payload.vendorProfile ?? null);
        const p = payload.products ?? {};
        setProducts({
          items: p.data ?? p.items ?? [],
          page: p.currentPage ?? p.page ?? 1,
          pages: p.totalPages ?? p.pages ?? 1,
          total: p.total ?? 0,
        });
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus(err.response?.status === 404 ? 'notfound' : 'error');
      });
    return () => { cancelled = true; };
  }, [slug, page]);

  const handleToggleWishlist = (productId) => {
    if (!wishlist.isBuyer) {
      navigate('/login');
      return;
    }
    wishlist.toggle(productId).catch(() => {});
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (status === 'notfound' || !vendor) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-lg font-semibold">{t('store.notFound')}</p>
        <Link to="/browse" className="mt-3 inline-block text-sm font-semibold text-forest hover:underline">
          {t('store.backToBrowse')}
        </Link>
      </section>
    );
  }

  if (status === 'error') {
    return <p className="py-24 text-center text-crimson">{t('common.error')}</p>;
  }

  const logo = resolveAssetUrl(vendor.logoUrl);
  const banner = resolveAssetUrl(vendor.bannerUrl);

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      {/* Banner + logo + identity */}
      <div className="relative rounded-3xl overflow-hidden shadow-card">
        {banner ? (
          <img src={banner} alt="" className="w-full h-40 md:h-60 object-cover" />
        ) : (
          <div className="w-full h-40 md:h-60 bg-gradient-to-br from-forest to-forest-dark" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-7">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {logo ? (
              <img
                src={logo}
                alt={vendor.storeName}
                className="w-20 h-20 md:w-28 md:h-28 rounded-2xl object-cover ring-4 ring-white/90 dark:ring-slate-800 shadow-glow shrink-0"
              />
            ) : (
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl ring-4 ring-white/90 dark:ring-slate-800 bg-forest text-white grid place-items-center text-3xl font-extrabold shadow-glow shrink-0 select-none">
                {vendor.storeName?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="flex-1 text-white min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold truncate">{vendor.storeName}</h1>
                {vendor.status === 'approved' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-forest text-white text-[11px] font-bold shrink-0">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    {t('store.verified')}
                  </span>
                )}
              </div>
              {vendor.tagline && <p className="text-sm text-white/90 mt-1">{vendor.tagline}</p>}
              {vendor.showRatingsReviews !== false && vendor.rating > 0 && (
                <span className="inline-flex items-center gap-1 mt-1.5 text-sm text-white/90">
                  <Star className="w-4 h-4 fill-gold text-gold" />
                  <b>{Number(vendor.rating).toFixed(1)}</b>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {vendor.bio && (
        <p className="mt-5 text-ink/70 dark:text-slate-300 max-w-3xl">{vendor.bio}</p>
      )}

      {Array.isArray(vendor.deliveryZones) && vendor.deliveryZones.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {vendor.deliveryZones.map((z) => (
            <span
              key={z._id ?? z.zone}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/10 text-xs font-semibold"
            >
              <MapPin className="w-3.5 h-3.5 text-forest" />
              {z.zone} · ETB {Number(z.fee).toLocaleString()}
            </span>
          ))}
        </div>
      )}

      {/* Products */}
      <h2 className="mt-8 text-lg font-extrabold">{t('store.productsTitle')}</h2>

      {products.items.length === 0 ? (
        <p className="py-16 text-center text-ink/60 dark:text-slate-400">{t('store.noProducts')}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
            {products.items.map((p) => (
              <ProductCard
                key={p._id}
                product={mapProductCard(p)}
                wishlisted={wishlist.has(p._id)}
                onToggleWishlist={() => handleToggleWishlist(p._id)}
              />
            ))}
          </div>

          {products.pages > 1 && (
            <nav
              aria-label={t('browse.pageOf', { page: products.page, pages: products.pages })}
              className="flex items-center justify-center gap-1.5 mt-8"
            >
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                aria-label={t('browse.prevPage')}
                className="grid place-items-center w-10 h-10 rounded-xl ring-1 ring-black/10 dark:ring-white/15 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none"
              >
                ‹
              </button>
              {Array.from({ length: products.pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  aria-current={n === page ? 'page' : undefined}
                  className={`grid place-items-center w-10 h-10 rounded-xl font-semibold transition ${
                    n === page
                      ? 'bg-forest text-white'
                      : 'ring-1 ring-black/10 dark:ring-white/15 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= products.pages}
                aria-label={t('browse.nextPage')}
                className="grid place-items-center w-10 h-10 rounded-xl ring-1 ring-black/10 dark:ring-white/15 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none"
              >
                ›
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
