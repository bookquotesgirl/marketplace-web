import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { mapProductCard } from '../lib/mapProduct';
import { ProductCard, Spinner } from '../components/ui';

export default function Home() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    Promise.all([
      api.get('/products', { params: { limit: 8, sort: 'newest' } }),
      api.get('/categories'),
    ])
      .then(([productsRes, categoriesRes]) => {
        if (cancelled) return;
        setProducts(productsRes.data.items ?? []);
        setCategories(categoriesRes.data ?? []);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const vendors = [];
  const seen = new Set();
  for (const p of products) {
    if (p.vendor && !seen.has(p.vendor.id)) {
      seen.add(p.vendor.id);
      vendors.push(p.vendor);
    }
  }

  return (
    <div>
      <section className="max-w-7xl mx-auto px-4 pt-6">
        <div className="rounded-3xl overflow-hidden shadow-card bg-forest-deep">
          <div className="max-w-xl px-6 py-10 md:px-12 md:py-16">
            <span className="inline-block px-3 py-1 rounded-full bg-gold text-ink text-[11px] font-bold tracking-wide">
              {t('home.heroTag')}
            </span>
            <h1 className="mt-4 text-3xl md:text-5xl font-extrabold text-white leading-tight">
              {t('home.heroTitle')}
            </h1>
            <p className="mt-3 text-white/85 text-sm md:text-lg">{t('home.heroSubtitle')}</p>
            <Link
              to="/browse"
              className="mt-6 inline-flex items-center justify-center h-11 px-5 rounded-2xl font-semibold bg-gold text-ink hover:bg-gold-light transition"
            >
              {t('home.heroCta')}
            </Link>
          </div>
        </div>
      </section>

      {status === 'loading' && (
        <div className="max-w-7xl mx-auto px-4 py-16 grid place-items-center">
          <Spinner />
        </div>
      )}

      {status === 'error' && (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-ink/60">{t('common.error')}</div>
      )}

      {status === 'ready' && (
        <>
          {categories.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 pt-10">
              <h2 className="text-xl md:text-2xl font-extrabold">{t('home.categories')}</h2>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/browse?category=${c.slug}`}
                    className="shrink-0 px-4 py-2.5 rounded-2xl ring-1 ring-black/10 bg-white text-sm font-semibold hover:ring-forest hover:text-forest transition"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="max-w-7xl mx-auto px-4 pt-10">
            <h2 className="text-xl md:text-2xl font-extrabold">{t('home.featured')}</h2>
            {products.length === 0 ? (
              <p className="mt-4 text-ink/60">{t('common.noResults')}</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={mapProductCard(p)} />
                ))}
              </div>
            )}
          </section>

          {vendors.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 py-10">
              <h2 className="text-xl md:text-2xl font-extrabold">{t('home.topVendors')}</h2>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {vendors.map((v) => (
                  <Link
                    key={v.id}
                    to={`/store/${v.slug}`}
                    className="p-4 rounded-2xl bg-white ring-1 ring-black/5 shadow-soft hover:shadow-card transition text-center"
                  >
                    <span className="font-semibold text-sm">{v.storeName}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
