import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { mapProductCard } from '../lib/mapProduct';
import { ProductCard, Spinner } from '../components/ui';
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from '../lib/categoryIcons';

export default function Browse() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  // The API supports filtering by `category` (slug or id) — we pass whatever is
  // present in the `category` query param (slug is supported by the backend).
  const category = searchParams.get('category') || '';
  const page = Number(searchParams.get('page')) || 1;

  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    api
      .get('/products', { params: { limit: 100 } })
      .then((res) => {
        const payload = res.data || {};
        const items = payload.data ?? payload.items ?? payload ?? [];
        const seen = new Set();
        const cats = [];
        for (const p of items ?? []) {
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
        const payload = res.data || {};
        const items = payload.data ?? payload.items ?? payload ?? [];
        setResult({
          items: items ?? [],
          page: payload.page ?? payload.currentPage ?? 1,
          pages: payload.pages ?? payload.totalPages ?? 1,
          total: payload.total ?? items.length ?? 0,
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

  const activeCategoryName = categories.find((c) => c.slug === category)?.name;

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">{t('browse.title')}</h1>
          {status === 'ready' && (
            <p className="text-sm text-ink/60 dark:text-slate-400 mt-0.5">
              <span className="font-semibold text-ink dark:text-slate-200">{result.total}</span>{' '}
              {t('browse.results')}
              {activeCategoryName ? ` · ${activeCategoryName}` : ''}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-6 mt-6">
        {categories.length > 0 && (
          <aside className="hidden lg:block w-56 shrink-0">
            <h3 className="font-bold mb-3 text-sm">{t('browse.category')}</h3>
            <div className="space-y-1">
              <button
                onClick={() => setCategory('')}
                className={`block w-full text-start px-3 py-2 rounded-xl text-sm transition ${
                  !category
                    ? 'bg-forest text-white font-semibold'
                    : 'hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {t('browse.allCategories')}
              </button>
              {categories.map((c) => {
                const known = CATEGORY_ICONS[c.slug];
                const Icon = known?.Icon ?? DEFAULT_CATEGORY_ICON;
                const label = known ? t(known.i18nKey) : c.name;
                return (
                  <button
                    key={c._id}
                    onClick={() => setCategory(c.slug)}
                    className={`flex items-center gap-2 w-full text-start px-3 py-2 rounded-xl text-sm transition ${
                      category === c.slug
                        ? 'bg-forest text-white font-semibold'
                        : 'hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        <div className="flex-1 min-w-0">
          {categories.length > 0 && (
            <div className="flex lg:hidden gap-2 overflow-x-auto pb-4">
              <button
                onClick={() => setCategory('')}
                className={`shrink-0 px-3.5 py-2 rounded-full text-sm ring-1 ring-black/10 dark:ring-white/15 transition ${
                  !category ? 'bg-forest text-white' : ''
                }`}
              >
                {t('browse.allCategories')}
              </button>
              {categories.map((c) => {
                const known = CATEGORY_ICONS[c.slug];
                const Icon = known?.Icon ?? DEFAULT_CATEGORY_ICON;
                const label = known ? t(known.i18nKey) : c.name;
                return (
                  <button
                    key={c._id}
                    onClick={() => setCategory(c.slug)}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm ring-1 ring-black/10 dark:ring-white/15 transition ${
                      category === c.slug ? 'bg-forest text-white' : ''
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {status === 'loading' && (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          )}

          {status === 'error' && (
            <p className="py-16 text-center text-crimson">{t('common.error')}</p>
          )}

          {status === 'ready' && result.items.length === 0 && (
            <p className="py-16 text-center text-ink/60 dark:text-slate-400">
              {t('common.noResults')}
            </p>
          )}

          {status === 'ready' && result.items.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {result.items.map((p) => (
                  <ProductCard key={p._id} product={mapProductCard(p)} />
                ))}
              </div>

              {result.pages > 1 && (
                <nav
                  aria-label={t('browse.pageOf', { page: result.page, pages: result.pages })}
                  className="flex items-center justify-center gap-1.5 mt-8"
                >
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    aria-label={t('browse.prevPage')}
                    className="grid place-items-center w-10 h-10 rounded-xl ring-1 ring-black/10 dark:ring-white/15 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    ‹
                  </button>
                  {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
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
                    onClick={() => setPage(page + 1)}
                    disabled={page >= result.pages}
                    aria-label={t('browse.nextPage')}
                    className="grid place-items-center w-10 h-10 rounded-xl ring-1 ring-black/10 dark:ring-white/15 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    ›
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
