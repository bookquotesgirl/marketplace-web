import { useEffect, useRef, useState } from 'react';
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
  BellOff,
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
  LogOut,
  LayoutDashboard,
  Shield,
} from 'lucide-react';
import { useUiStore } from '../store/uiStore';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { resolveAssetUrl } from '../lib/api';
import { Modal } from './ui';
import LanguagePicker from './LanguagePicker';

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

// Static mobile nav items — role-sensitive destinations resolved at render time.
const MOBILE_NAV_ITEMS = [
  { key: 'home',       to: '/',       labelKey: 'nav.home',           Icon: HomeIcon },
  { key: 'categories', to: '/browse', labelKey: 'nav.categories',     Icon: LayoutGrid },
  { key: 'trackOrder', to: '/orders', labelKey: 'topbar.trackOrder',  Icon: PackageSearch },
  { key: 'wishlist',   to: '/wishlist', labelKey: 'nav.wishlist',     Icon: Heart },
  { key: 'account',   to: null,       labelKey: 'nav.account',        Icon: UserRound },
  { key: 'sell',      to: null,       labelKey: 'topbar.sellOnKitman', Icon: Store },
];

function initial(name) {
  return (name || '?').trim().charAt(0).toUpperCase() || '?';
}

function AccountAvatar({ user, size = 'sm' }) {
  const [broken, setBroken] = useState(false);
  const src = user?.avatar && !broken ? resolveAssetUrl(user.avatar) : null;
  const cls = size === 'lg'
    ? 'w-9 h-9 rounded-full object-cover bg-forest/10 shrink-0'
    : 'w-7 h-7 rounded-full object-cover bg-forest/10 shrink-0';
  const spanCls = size === 'lg'
    ? 'grid place-items-center w-9 h-9 rounded-full bg-forest text-white text-sm font-bold shrink-0'
    : 'grid place-items-center w-7 h-7 rounded-full bg-forest text-white text-xs font-bold shrink-0';

  if (src) {
    return <img src={src} alt="" onError={() => setBroken(true)} className={cls} />;
  }
  return <span className={spanCls}>{initial(user?.name)}</span>;
}

export default function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dark = useUiStore((s) => s.dark);
  const toggleDark = useUiStore((s) => s.toggleDark);
  const { count: cartCount } = useCart();
  const { token, user, logout } = useAuth();
  const isAuthed = Boolean(token);
  const role = user?.role; // 'buyer' | 'vendor' | 'admin'

  const [catOpen, setCatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState('');
  const notifRef = useRef(null);
  const accountRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Close notifications popover on outside click or Escape.
  useEffect(() => {
    if (!notifOpen) return undefined;
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setNotifOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [notifOpen]);

  // Close account dropdown on outside click or Escape.
  useEffect(() => {
    if (!accountOpen) return undefined;
    const onClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setAccountOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/browse?q=${encodeURIComponent(query.trim())}` : '/browse');
  };

  // Resolve the mobile nav destination for each item.
  function mobileNavDest(key) {
    if (key === 'account') {
      if (!isAuthed) return '/login';
      if (role === 'vendor') return '/vendor';
      if (role === 'admin') return '/admin';
      return '/profile';
    }
    if (key === 'sell') {
      return role === 'vendor' ? '/vendor' : '/vendor/register';
    }
    return MOBILE_NAV_ITEMS.find((i) => i.key === key)?.to ?? '/';
  }

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
          <LanguagePicker variant="header" />

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition"
              aria-label={t('header.notifications')}
              aria-haspopup="true"
              aria-expanded={notifOpen}
            >
              <Bell className="w-5 h-5" />
            </button>
            {notifOpen && (
              <div
                role="menu"
                aria-label={t('header.notifications')}
                className="absolute top-full mt-2 end-0 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-card ring-1 ring-black/5 dark:ring-white/10 z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-black/5 dark:border-white/10">
                  <span className="text-sm font-bold">{t('header.notifications')}</span>
                </div>
                <div className="px-4 py-8 text-center">
                  <BellOff className="w-6 h-6 mx-auto text-ink/30 dark:text-slate-500" />
                  <p className="mt-2 text-sm text-ink/60 dark:text-slate-400">
                    {t('header.noNotifications')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Desktop account — dropdown when authed, plain link when not */}
          {isAuthed ? (
            <div className="relative hidden md:block" ref={accountRef}>
              <button
                onClick={() => setAccountOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={accountOpen}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition max-w-[12rem]"
              >
                <AccountAvatar user={user} />
                <span className="text-sm font-medium truncate min-w-0">
                  {user?.name || t('nav.account')}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-ink/40 dark:text-slate-500 shrink-0" />
              </button>

              {accountOpen && (
                <div
                  role="menu"
                  className="absolute top-full mt-2 end-0 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-card ring-1 ring-black/5 dark:ring-white/10 py-1.5 z-50 overflow-hidden"
                >
                  {/* Identity header */}
                  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-black/5 dark:border-white/10">
                    <AccountAvatar user={user} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{user?.name}</p>
                      <p className="text-[11px] text-ink/45 dark:text-slate-500 capitalize">{role}</p>
                    </div>
                  </div>

                  {/* Profile — buyer only (/profile is buyer-protected) */}
                  {role === 'buyer' && (
                    <Link
                      to="/profile"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
                    >
                      <UserRound className="w-4 h-4 text-forest shrink-0" />
                      {t('account.nav.profile')}
                    </Link>
                  )}

                  {/* Vendor Dashboard */}
                  {role === 'vendor' && (
                    <Link
                      to="/vendor"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
                    >
                      <LayoutDashboard className="w-4 h-4 text-forest shrink-0" />
                      {t('nav.vendorDashboard')}
                    </Link>
                  )}

                  {/* Admin Console */}
                  {role === 'admin' && (
                    <Link
                      to="/admin"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
                    >
                      <Shield className="w-4 h-4 text-forest shrink-0" />
                      {t('nav.adminConsole')}
                    </Link>
                  )}

                  {/* Logout */}
                  <button
                    role="menuitem"
                    onClick={() => { setAccountOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-crimson hover:bg-crimson/10 transition border-t border-black/5 dark:border-white/10 mt-1 pt-2"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {t('common.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden md:flex items-center gap-2 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              <UserRound className="w-5 h-5" />
              <span className="text-sm font-medium">{t('nav.login')}</span>
            </Link>
          )}

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

      {/* Mobile search bar */}
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

      {/* Mobile drawer */}
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
          <LanguagePicker variant="header" />
        </div>

        <nav className="flex flex-col px-2 pb-5" aria-label={t('header.menu')}>
          {MOBILE_NAV_ITEMS.map(({ key, labelKey, Icon }) => {
            // Hide "Sell on Kitman" for admins (irrelevant role).
            if (key === 'sell' && role === 'admin') return null;

            const dest = mobileNavDest(key);
            const isAccount = key === 'account';

            return (
              <Link
                key={key}
                to={dest}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-[15px] font-medium hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                {isAccount && isAuthed ? (
                  <AccountAvatar user={user} size="sm" />
                ) : (
                  <Icon className="w-5 h-5 text-forest shrink-0" />
                )}
                <span className="truncate">
                  {isAccount
                    ? isAuthed ? user?.name || t('nav.account') : t('nav.login')
                    : t(labelKey)}
                </span>
              </Link>
            );
          })}

          {/* Role-specific dashboard shortcut */}
          {role === 'vendor' && (
            <Link
              to="/vendor"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-[15px] font-medium hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              <LayoutDashboard className="w-5 h-5 text-forest shrink-0" />
              <span>{t('nav.vendorDashboard')}</span>
            </Link>
          )}
          {role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-[15px] font-medium hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              <Shield className="w-5 h-5 text-forest shrink-0" />
              <span>{t('nav.adminConsole')}</span>
            </Link>
          )}
        </nav>

        {/* Mobile logout — authed users only */}
        {isAuthed && (
          <div className="px-2 pb-5 border-t border-black/5 dark:border-white/10 pt-2">
            <button
              onClick={() => { setMenuOpen(false); handleLogout(); }}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[15px] font-medium text-crimson hover:bg-crimson/10 transition"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span>{t('common.logout')}</span>
            </button>
          </div>
        )}
      </Modal>
    </header>
  );
}
