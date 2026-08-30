import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import api from '../lib/api';
import { mapProductCard } from '../lib/mapProduct';
import { ProductCard, ProductCardSkeleton, Toast } from '../components/ui';
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from '../lib/categoryIcons';
import { useWishlist } from '../hooks/useWishlist';

const PAGE_SIZE = 12;

// GET /api/search only accepts `q` and returns the full match list with no
// server-side sort/pagination, so in search mode we sort + page on the client.
const price = (p) => p.basePrice ?? p.price ?? 0;
const SORTS = {
  relevance: null, // keep the API's text-score order
  price_asc: (a, b) => price(a) - price(b),
  price_desc: (a, b) => price(b) - price(a),
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
};

export default function Browse() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const wishlist = useWishlist();

  const handleToggleWishlist = (productId) => {
    if (!wishlist.isBuyer) {
      navigate('/login');
      return;
    }
    wishlist.toggle(productId).catch(() => setToast(t('common.error')));
  };

  const query = (searchParams.get('q') || '').trim();
  const isSearch = query.length > 0;
  // The API supports filtering by `category` (slug or id) — we pass whatever is
  // present in the `category` query param (slug is supported by the backend).
  const category = searchParams.get('category') || '';
  const page = Number(searchParams.get('page')) || 1;
  const sort = searchParams.get('sort') || 'relevance';

  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [toast, setToast] = useState('');

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

    const request = isSearch
      ? api.get('/search', { params: { q: query } })
      : api.get('/products', {
          params: { category: category || undefined, page, limit: PAGE_SIZE },
        });

    request
      .then((res) => {
        if (cancelled) return;
        const payload = res.data || {};
        const items = payload.data ?? payload.items ?? payload ?? [];

        if (isSearch) {
          // Whole result set in hand — sort + slice locally.
          const cmp = SORTS[sort];
          const sorted = cmp ? [...items].sort(cmp) : items;
          const total = sorted.length;
          const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
          const safePage = Math.min(page, pages);
          setResult({
            items: sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
            page: safePage,
            pages,
            total,
          });
        } else {
          setResult({
            items: items ?? [],
            page: payload.page ?? payload.currentPage ?? 1,
            pages: payload.pages ?? payload.totalPages ?? 1,
            total: payload.total ?? items.length ?? 0,
          });
        }
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [isSearch, query, category, page, sort]);

  const patchParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next);
  };

  const setCategory = (value) => patchParams({ category: value, page: '1' });
  const setPage = (nextPage) => patchParams({ page: String(nextPage) });
  const setSort = (value) => patchParams({ sort: value === 'relevance' ? '' : value, page: '1' });
  const clearSearch = () => navigate('/browse');

  const activeCategoryName = categories.find((c) => c.slug === category)?.name;
  const heading = isSearch ? t('browse.searchTitle', { query }) : t('browse.title');

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-extrabold break-words">{heading}</h1>
          {status === 'ready' && (
            <p className="text-sm text-ink/60 dark:text-slate-400 mt-0.5">
              <span className="font-semibold text-ink dark:text-slate-200">{result.total}</span>{' '}
              {t('browse.results')}
              {!isSearch && activeCategoryName ? ` · ${activeCategoryName}` : ''}
            </p>
          )}
        </div>

        {isSearch && (
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="browse-sort">
              {t('browse.sortBy')}
            </label>
            <select
              id="browse-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-sm rounded-xl ring-1 ring-black/10 dark:ring-white/15 bg-white dark:bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-forest"
            >
              <option value="relevance">{t('browse.sortRelevance')}</option>
              <option value="price_asc">{t('browse.sortPriceAsc')}</option>
              <option value="price_desc">{t('browse.sortPriceDesc')}</option>
              <option value="rating">{t('browse.sortRating')}</option>
            </select>
          </div>
        )}
      </div>

      {isSearch && (
        <button
          onClick={clearSearch}
          className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-sm ring-1 ring-black/10 dark:ring-white/15 hover:bg-black/5 dark:hover:bg-white/5 transition"
        >
          <X className="w-4 h-4" />
          {t('browse.clearSearch')}
        </button>
      )}

      <div className="flex gap-6 mt-6">
        {!isSearch && categories.length > 0 && (
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
          {!isSearch && categories.length > 0 && (
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
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }, (_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}

          {status === 'error' && (
            <div className="py-16 text-center">
              <p className="text-crimson">{t('common.error')}</p>
              <button
                onClick={() => patchParams({})}
                className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold ring-1 ring-black/10 dark:ring-white/15 hover:bg-black/5 dark:hover:bg-white/5"
              >
                {t('common.retry')}
              </button>
            </div>
          )}

          {status === 'ready' && result.items.length === 0 && (
            <p className="py-16 text-center text-ink/60 dark:text-slate-400">
              {isSearch ? t('browse.noSearchResults', { query }) : t('common.noResults')}
            </p>
          )}

          {status === 'ready' && result.items.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {result.items.map((p) => (
                  <ProductCard
                    key={p._id}
                    product={mapProductCard(p)}
                    wishlisted={wishlist.has(p._id)}
                    onToggleWishlist={() => handleToggleWishlist(p._id)}
                  />
                ))}
              </div>

              {result.pages > 1 && (
                <nav
                  aria-label={t('browse.pageOf', { page: result.page, pages: result.pages })}
                  className="flex flex-wrap items-center justify-center gap-1.5 mt-8"
                >
                  <button
                    onClick={() => setPage(result.page - 1)}
                    disabled={result.page <= 1}
                    aria-label={t('browse.prevPage')}
                    className="grid place-items-center w-10 h-10 rounded-xl ring-1 ring-black/10 dark:ring-white/15 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    ‹
                  </button>
                  {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      aria-current={n === result.page ? 'page' : undefined}
                      className={`grid place-items-center w-10 h-10 rounded-xl font-semibold transition ${
                        n === result.page
                          ? 'bg-forest text-white'
                          : 'ring-1 ring-black/10 dark:ring-white/15 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(result.page + 1)}
                    disabled={result.page >= result.pages}
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

      <Toast show={Boolean(toast)} variant="error" onDismiss={() => setToast('')}>
        {toast}
      </Toast>
    </section>
  );
}
