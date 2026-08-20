import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  X,
  ChevronDown,
  Search,
  Moon,
  Sun,
  Bell,
  UserRound,
  Heart,
  ShoppingBag,
  Smartphone,
  Coffee,
  CookingPot,
  WashingMachine,
  Shirt,
  Sparkles,
  Armchair,
  ShoppingCart,
  Home as HomeIcon,
  LayoutGrid,
  PackageSearch,
  Store,
  Globe,
} from 'lucide-react';
import { useUiStore } from '../store/uiStore';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { Modal } from './ui';

const LANG_NAME = { en: 'English', am: 'አማርኛ', ar: 'العربية' };

const CATEGORIES = [
  { slug: 'electronics', key: 'categories.electronics', Icon: Smartphone },
  { slug: 'fashion', key: 'categories.fashion', Icon: ShoppingBag },
  { slug: 'coffee-spice', key: 'categories.coffeeSpice', Icon: Coffee },
  { slug: 'home-kitchen', key: 'categories.homeKitchen', Icon: CookingPot },
  { slug: 'appliances', key: 'categories.appliances', Icon: WashingMachine },
  { slug: 'habesha-kemis', key: 'categories.habeshaKemis', Icon: Shirt },
  { slug: 'cosmetics', key: 'categories.cosmetics', Icon: Sparkles },
  { slug: 'furniture', key: 'categories.furniture', Icon: Armchair },
  { slug: 'supermarket', key: 'categories.supermarket', Icon: ShoppingCart },
];

const MOBILE_NAV_ITEMS = [
  { key: 'home', to: '/', labelKey: 'nav.home', Icon: HomeIcon },
  { key: 'categories', to: '/browse', labelKey: 'nav.categories', Icon: LayoutGrid },
  { key: 'trackOrder', to: '/orders', labelKey: 'topbar.trackOrder', Icon: PackageSearch },
  { key: 'wishlist', to: '/wishlist', labelKey: 'nav.wishlist', Icon: Heart },
  { key: 'account', to: null, labelKey: 'nav.account', Icon: UserRound },
  { key: 'sell', to: '/vendor', labelKey: 'topbar.sellOnKitman', Icon: Store },
];

export default function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cycleLanguage = useUiStore((s) => s.cycleLanguage);
  const language = useUiStore((s) => s.language);
  const dark = useUiStore((s) => s.dark);
  const toggleDark = useUiStore((s) => s.toggleDark);
  const cartCount = useCartStore((s) => s.count());
  const token = useAuthStore((s) => s.token);

  const [catOpen, setCatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/browse?q=${encodeURIComponent(query.trim())}` : '/browse');
  };

  return (
    <header className="sticky top-0 z-40 bg-cream/95 dark:bg-ink/95 backdrop-blur border-b border-black/5 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center gap-3 md:gap-6">
        <button
          onClick={() => setMenuOpen(true)}
          className="md:hidden p-2 -ms-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
          aria-label={t('header.menu')}
        >
          <Menu className="w-6 h-6" />
        </button>

        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-forest text-white font-extrabold text-lg">
            ኪ
          </span>
          <span className="hidden sm:block leading-none">
            <span className="block text-xl font-extrabold tracking-tight text-forest dark:text-forest-light">
              {t('brand')}
            </span>
            <span className="block text-[10px] tracking-[0.25em] text-ink/50 dark:text-slate-400 uppercase">
              Marketplace
            </span>
          </span>
        </Link>

        <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-2xl relative">
          <div className="flex w-full rounded-2xl ring-1 ring-black/10 dark:ring-white/15 focus-within:ring-2 focus-within:ring-forest bg-white dark:bg-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setCatOpen((v) => !v)}
              className="flex items-center gap-1 px-4 text-sm text-ink/70 dark:text-slate-300 border-e border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <span>{t('header.allCategories')}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('common.search')}
              className="flex-1 px-4 py-3 bg-transparent outline-none text-sm placeholder:text-ink/40 dark:placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="px-5 bg-forest hover:bg-forest-dark text-white transition"
              aria-label={t('common.search')}
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          {catOpen && (
            <div
              onMouseLeave={() => setCatOpen(false)}
              className="absolute top-full mt-2 start-0 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-card ring-1 ring-black/5 dark:ring-white/10 p-2 z-50"
            >
              {CATEGORIES.map(({ slug, key, Icon }) => (
                <Link
                  key={slug}
                  to={`/browse?category=${slug}`}
                  onClick={() => setCatOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-forest/5 dark:hover:bg-white/5 text-sm"
                >
                  <Icon className="w-4 h-4 text-forest" />
                  <span>{t(key)}</span>
                </Link>
              ))}
            </div>
          )}
        </form>

        <div className="flex items-center gap-1 md:gap-2 ms-auto">
          <button
            onClick={toggleDark}
            className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition"
            aria-label={t('header.theme')}
          >
            {dark ? <Sun className="w-5 h-5 text-gold" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            className="relative p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition"
            aria-label={t('header.notifications')}
          >
            <Bell className="w-5 h-5" />
          </button>
          <Link
            to={token ? '/profile' : '/login'}
            className="hidden md:flex items-center gap-2 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            <UserRound className="w-5 h-5" />
            <span className="text-sm font-medium">{t('nav.account')}</span>
          </Link>
          <Link
            to="/wishlist"
            className="relative p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition"
            aria-label={t('nav.wishlist')}
          >
            <Heart className="w-5 h-5" />
          </Link>
          <Link
            to="/cart"
            className="relative p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition"
            aria-label={t('nav.cart')}
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -end-0.5 min-w-4 h-4 px-1 grid place-items-center text-[10px] font-bold text-white bg-crimson rounded-full">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <form onSubmit={submitSearch} className="md:hidden px-4 pb-3">
        <div className="flex w-full rounded-2xl ring-1 ring-black/10 dark:ring-white/15 bg-white dark:bg-slate-800 overflow-hidden">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('common.search')}
            className="flex-1 px-4 py-2.5 bg-transparent outline-none text-sm placeholder:text-ink/40 dark:placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="px-4 bg-forest text-white"
            aria-label={t('common.search')}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </form>

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} variant="drawer">
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <span className="text-xl font-extrabold text-forest dark:text-forest-light">
            {t('brand')}
          </span>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-1.5 -me-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
            aria-label={t('header.menu')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pb-4">
          <button
            onClick={cycleLanguage}
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-full bg-white dark:bg-slate-800 ring-1 ring-black/5 dark:ring-white/10 shadow-soft text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <Globe className="w-4 h-4 text-forest shrink-0" />
            <span>{LANG_NAME[language]}</span>
          </button>
        </div>

        <nav className="flex flex-col px-2 pb-5" aria-label={t('header.menu')}>
          {MOBILE_NAV_ITEMS.map(({ key, to, labelKey, Icon }) => (
            <Link
              key={key}
              to={key === 'account' ? (token ? '/profile' : '/login') : to}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-[15px] font-medium hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              <Icon className="w-5 h-5 text-forest shrink-0" />
              <span>{t(labelKey)}</span>
            </Link>
          ))}
        </nav>
      </Modal>
    </header>
  );
}
