import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home as HomeIcon, LayoutGrid, Search, SearchX } from 'lucide-react';
import api from '../lib/api';
import { CATEGORY_ICONS } from '../lib/categoryIcons';

export default function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api
      .get('/categories')
      .then((res) => setCategories(res.data?.data ?? []))
      .catch(() => {});
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/browse?q=${encodeURIComponent(query.trim())}` : '/browse');
  };

  return (
    <section className="max-w-2xl mx-auto px-4 py-16 md:py-24 text-center">
      <div className="relative inline-grid place-items-center mb-6">
        <div className="w-40 h-40 md:w-52 md:h-52 rounded-[2rem] bg-gradient-to-br from-forest via-forest-dark to-forest-deep shadow-glow grid place-items-center">
          <span className="text-white text-6xl md:text-7xl font-extrabold tracking-tight">404</span>
        </div>
        <span className="absolute -bottom-3 -end-3 grid place-items-center w-12 h-12 rounded-2xl bg-gold text-ink shadow-lg">
          <SearchX className="w-6 h-6" />
        </span>
      </div>

      <h1 className="text-2xl md:text-3xl font-extrabold">{t('notFound.title')}</h1>
      <p className="text-ink/60 dark:text-slate-400 mt-2 max-w-md mx-auto">{t('notFound.subtitle')}</p>

      <form onSubmit={submitSearch} className="mt-6 max-w-md mx-auto">
        <div className="flex rounded-2xl ring-1 ring-black/10 dark:ring-white/15 focus-within:ring-2 focus-within:ring-forest bg-white dark:bg-slate-800 overflow-hidden">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('common.search')}
            className="flex-1 px-4 py-3 bg-transparent outline-none text-sm placeholder:text-ink/40 dark:placeholder:text-slate-400"
          />
          <button
            type="submit"
            aria-label={t('common.search')}
            className="px-5 bg-forest hover:bg-forest-dark text-white transition"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-forest text-white font-bold shadow-glow hover:bg-forest-dark transition"
        >
          <HomeIcon className="w-5 h-5" />
          {t('notFound.backHome')}
        </Link>
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl ring-1 ring-black/10 dark:ring-white/15 font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition"
        >
          <LayoutGrid className="w-5 h-5" />
          {t('notFound.browseShop')}
        </Link>
      </div>

      {categories.length > 0 && (
        <div className="mt-10">
          <p className="text-xs uppercase tracking-wide text-ink/40 dark:text-slate-500 mb-3">
            {t('notFound.popularCategories')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.slice(0, 6).map((c) => {
              const known = CATEGORY_ICONS[c.slug];
              const label = known ? t(known.i18nKey) : c.name;
              return (
                <Link
                  key={c._id}
                  to={`/browse?category=${c.slug}`}
                  className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 ring-1 ring-black/5 dark:ring-white/10 text-sm font-medium hover:text-forest hover:ring-forest/30 transition"
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
