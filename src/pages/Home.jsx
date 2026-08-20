import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { mapProductCard } from '../lib/mapProduct';
import { ProductCard, Spinner, Card } from '../components/ui';

export default function Home() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    // No GET /api/categories exists on the API yet — the category row and top-vendors
    // strip below are derived from the fetched products instead of a dedicated endpoint.
    api
      .get('/products', { params: { limit: 8, sort: 'newest' } })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data?.data ?? []);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = [];
  const vendors = [];
  const seenCategories = new Set();
  const seenVendors = new Set();
  for (const p of products) {
    const c = p.categoryId;
    if (c?._id && !seenCategories.has(c._id)) {
      seenCategories.add(c._id);
      categories.push(c);
    }
    const v = p.vendorId;
    if (v?._id && !seenVendors.has(v._id)) {
      seenVendors.add(v._id);
      vendors.push(v);
    }
  }

  return (
    <div>
      <section className="max-w-7xl mx-auto px-4 pt-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest via-forest-dark to-forest-deep text-white shadow-card min-h-[240px] md:min-h-[320px] flex items-center">
          <div className="relative z-10 p-8 md:p-14 max-w-xl">
            <span className="inline-block px-3 py-1 rounded-full bg-gold text-ink text-[11px] font-bold tracking-wide">
              {t('home.heroTag')}
            </span>
            <h1 className="mt-4 text-3xl md:text-5xl font-extrabold leading-tight">
              {t('home.heroTitle')}
            </h1>
            <p className="mt-3 text-white/85 text-sm md:text-lg">{t('home.heroSub')}</p>
            <Link
              to="/browse"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gold hover:bg-gold-light text-ink font-bold shadow-glow transition"
            >
              {t('home.heroCta')}
            </Link>
          </div>
        </div>
      </section>

      {status === 'loading' && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {status === 'error' && (
        <p className="max-w-7xl mx-auto px-4 py-16 text-center text-crimson">{t('common.error')}</p>
      )}

      {status === 'ready' && (
        <>
          {categories.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 pt-10">
              <h2 className="text-xl md:text-2xl font-extrabold mb-4">{t('home.shopByCategory')}</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/browse?category=${c.slug}`}
                    className="shrink-0 px-4 py-2.5 rounded-full bg-white dark:bg-slate-800 ring-1 ring-black/10 dark:ring-white/15 text-sm font-medium hover:bg-forest hover:text-white dark:hover:bg-forest transition"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="max-w-7xl mx-auto px-4 pt-10">
            <div className="flex items-end justify-between mb-5">
              <h2 className="text-xl md:text-2xl font-extrabold">{t('home.featured')}</h2>
              <Link to="/browse" className="text-sm font-semibold text-forest hover:text-forest-dark">
                {t('home.viewAll')}
              </Link>
            </div>
            {products.length === 0 ? (
              <p className="text-ink/60 dark:text-slate-400">{t('common.noResults')}</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => (
                  <ProductCard key={p._id} product={mapProductCard(p)} />
                ))}
              </div>
            )}
          </section>

          {vendors.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 pt-10 pb-14">
              <h2 className="text-xl md:text-2xl font-extrabold mb-5">{t('home.topVendors')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {vendors.map((v) => (
                  <Card key={v.id} className="p-4">
                    <h3 className="font-bold">{v.storeName}</h3>
                    <Link
                      to={`/store/${v.slug}`}
                      className="mt-3 w-full inline-flex items-center justify-center py-2 rounded-xl bg-forest/10 hover:bg-forest hover:text-white text-forest font-semibold text-sm transition"
                    >
                      {t('home.visitStore')}
                    </Link>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
