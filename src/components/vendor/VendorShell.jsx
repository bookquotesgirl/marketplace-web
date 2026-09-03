import { createContext, useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Package, ShoppingBag, Wallet, BadgePercent,
  Settings, ExternalLink, LogOut, X, BadgeCheck,
  Menu, Bell, Moon, Sun, ArrowLeft,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import LanguagePicker from '../LanguagePicker';

// Exposed so child pages can open the mobile sidebar drawer.
export const VendorShellContext = createContext({ openDrawer: () => {} });

const NAV = [
  { id: 'dashboard',    to: '/vendor',              end: true,  Icon: LayoutDashboard },
  { id: 'products',     to: '/vendor/products',                 Icon: Package },
  { id: 'orders',       to: '/vendor/orders',                   Icon: ShoppingBag },
  { id: 'payouts',      to: '/vendor/payouts',                  Icon: Wallet },
  { id: 'subscription', to: '/vendor/subscription',             Icon: BadgePercent },
  { id: 'settings',     to: '/vendor/settings',                 Icon: Settings },
];

function SidebarContents({ user, t, onLogout, onNavClick, onClose, counts }) {
  const vendor = user?.vendor;
  const initials = vendor?.storeName?.[0]?.toUpperCase() ?? 'V';

  return (
    <>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 py-2">
        <span className="grid place-items-center w-9 h-9 rounded-2xl bg-forest text-white font-extrabold shadow-sm text-base select-none">
          ኪ
        </span>
        <div className="leading-none">
          <div className="font-extrabold">{t('brand')}</div>
          <div className="text-[10px] tracking-[0.18em] text-ink/40 dark:text-slate-500 uppercase">Seller</div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden ms-auto grid place-items-center w-8 h-8 rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
          aria-label={t('common.menu')}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Store identity */}
      {vendor && (
        <div className="flex items-center gap-2.5 mt-2 mb-3 p-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/5">
          {vendor.logoUrl ? (
            <img
              src={vendor.logoUrl}
              alt={vendor.storeName}
              className="w-9 h-9 rounded-xl object-cover shrink-0"
            />
          ) : (
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-forest/10 text-forest font-extrabold text-sm shrink-0">
              {initials}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-sm font-bold truncate">
              {vendor.storeName}
              <BadgeCheck className="w-3.5 h-3.5 text-forest shrink-0" />
            </div>
            {vendor.plan?.name && (
              <div className="text-[11px] text-ink/45 dark:text-slate-500">{vendor.plan.name}</div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, to, end, Icon }) => {
          const count = counts?.[id];
          return (
            <NavLink
              key={id}
              to={to}
              end={end}
              onClick={onNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-forest text-white shadow-[0_6px_20px_-6px_rgba(11,122,75,0.6)]'
                    : 'text-ink/60 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <span className="flex-1">{t(`vendor.nav.${id}`)}</span>
                  {count > 0 && (
                    <span
                      className={`grid place-items-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-forest/10 text-forest'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/10 space-y-0.5">
        {vendor?.slug && (
          <Link
            to={`/store/${vendor.slug}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-ink/60 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/5 transition"
          >
            <ExternalLink className="w-[18px] h-[18px]" />
            {t('common.viewStore')}
          </Link>
        )}
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-ink/60 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/5 transition"
        >
          <ArrowLeft className="w-[18px] h-[18px] rtl:rotate-180 shrink-0" />
          {t('common.backToSite')}
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-crimson hover:bg-crimson/10 transition"
        >
          <LogOut className="w-[18px] h-[18px]" />
          {t('common.logout')}
        </button>
      </div>
    </>
  );
}

export default function VendorShell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const dark = useUiStore((s) => s.dark);
  const toggleDark = useUiStore((s) => s.toggleDark);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [counts, setCounts] = useState({});

  // Sidebar-level "needs attention" badge (orders awaiting fulfillment) — same field the
  // dashboard's own "Needs attention" card uses (GET /vendor/dashboard).
  useEffect(() => {
    let cancelled = false;
    api
      .get('/vendor/dashboard')
      .then(({ data }) => {
        if (!cancelled) setCounts({ orders: data?.needsAttention?.ordersToFulfill ?? 0 });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const activeNav = [...NAV]
    .sort((a, b) => b.to.length - a.to.length)
    .find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))
    ?? NAV[0];

  const profileInitial = (user?.name ?? 'V')[0].toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <VendorShellContext.Provider value={{ openDrawer: () => setDrawerOpen(true) }}>
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-[#eef1ef] dark:bg-[#0a0e0c]" />
      <div className="fixed -top-24 start-1/4 -z-10 w-[32rem] h-[32rem] rounded-full bg-emerald-300/25 dark:bg-emerald-500/10 blur-[130px]" />
      <div className="fixed bottom-0 end-1/4 -z-10 w-[28rem] h-[28rem] rounded-full bg-teal-200/25 dark:bg-teal-500/10 blur-[130px]" />

      <div className="min-h-screen p-3 sm:p-4 lg:p-6">
        <div className="max-w-[1440px] mx-auto lg:flex lg:gap-6">
          {/* Mobile backdrop */}
          {drawerOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-ink/30 backdrop-blur-sm z-50"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Sidebar */}
          <aside
            className={`fixed lg:sticky top-3 lg:top-6 start-3 lg:start-0 bottom-3 lg:bottom-auto z-[60] lg:z-auto w-64 shrink-0 lg:self-start lg:h-[calc(100vh-3rem)] flex flex-col rounded-[1.75rem] bg-white/70 dark:bg-white/[0.06] backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] p-3.5 transition-transform duration-300 ${
              drawerOpen
                ? 'translate-x-0 rtl:translate-x-0'
                : '-translate-x-[110%] rtl:translate-x-[110%] lg:translate-x-0 lg:rtl:translate-x-0'
            }`}
          >
            <SidebarContents
              user={user}
              t={t}
              onLogout={handleLogout}
              onNavClick={() => setDrawerOpen(false)}
              onClose={() => setDrawerOpen(false)}
              counts={counts}
            />
          </aside>

          {/* Page content */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Shared top bar */}
            <div className="relative z-10 flex items-center gap-3 rounded-[1.5rem] px-3 sm:px-4 h-16 bg-white/70 dark:bg-white/[0.06] backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)]">
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden grid place-items-center w-10 h-10 -ms-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition"
                aria-label={t('common.menu')}
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-base sm:text-lg font-extrabold leading-none truncate">
                {t(`vendor.nav.${activeNav.id}`)}
              </h1>
              <div className="ms-auto flex items-center gap-1">
                <LanguagePicker variant="shell" />
                <button
                  onClick={toggleDark}
                  className="grid place-items-center w-10 h-10 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition"
                  aria-label={t('header.theme')}
                >
                  {dark ? <Sun className="w-5 h-5 text-gold" /> : <Moon className="w-5 h-5" />}
                </button>
                <button
                  className="relative grid place-items-center w-10 h-10 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition"
                  aria-label={t('header.notifications')}
                >
                  <Bell className="w-5 h-5" />
                </button>
                <span className="grid place-items-center w-9 h-9 rounded-full bg-forest text-white text-sm font-extrabold ms-0.5 select-none">
                  {profileInitial}
                </span>
              </div>
            </div>

            <Outlet />
          </div>
        </div>
      </div>
    </VendorShellContext.Provider>
  );
}
