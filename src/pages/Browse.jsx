import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { mapProductCard } from '../lib/mapProduct';
import { ProductCard, Spinner, Select } from '../components/ui';

export default function Browse() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  // No GET /api/categories endpoint exists yet, and the products API filters by the
  // category's Mongo _id (not slug) — so `category` here holds an _id, derived below.
  const category = searchParams.get('category') || '';
  const page = Number(searchParams.get('page')) || 1;

  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    api
      .get('/products', { params: { limit: 100 } })
      .then((res) => {
        const seen = new Set();
        const cats = [];
        for (const p of res.data?.data ?? []) {
          const c = p.categoryId;
          if (c?._id && !seen.has(c._id)) {
            seen.add(c._id);
            cats.push(c);
          }
        }
        setCategories(cats);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    api
      .get('/products', { params: { category: category || undefined, page, limit: 12 } })
      .then((res) => {
        if (cancelled) return;
        setResult({
          items: res.data?.data ?? [],
          page: res.data?.currentPage ?? 1,
          pages: res.data?.totalPages ?? 1,
          total: res.data?.total ?? 0,
        });
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [category, page]);

  const setCategory = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('category', value);
    else next.delete('category');
    next.set('page', '1');
    setSearchParams(next);
  };

  const setPage = (nextPage) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <h1 className="text-2xl md:text-3xl font-extrabold">{t('browse.title')}</h1>
        <div className="w-full sm:w-56">
          <Select label={t('browse.category')} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">{t('browse.allCategories')}</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {status === 'loading' && (
        <div className="py-16 grid place-items-center">
          <Spinner />
        </div>
      )}

      {status === 'error' && <p className="mt-8 text-center text-ink/60">{t('common.error')}</p>}

      {status === 'ready' && (
        <>
          {result.items.length === 0 ? (
            <p className="mt-8 text-ink/60">{t('common.noResults')}</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {result.items.map((p) => (
                <ProductCard key={p._id} product={mapProductCard(p)} />
              ))}
            </div>
          )}

          {result.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 rounded-xl ring-1 ring-black/10 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5"
              >
                {t('browse.prev')}
              </button>
              <span className="text-sm text-ink/60">{t('browse.pageOf', { page: result.page, pages: result.pages })}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= result.pages}
                className="px-4 py-2 rounded-xl ring-1 ring-black/10 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5"
              >
                {t('browse.next')}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
