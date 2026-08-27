import { createContext, useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Store, UserCheck, ShoppingBag, Wallet,
  Users, BadgePercent, Settings, Tag, ArrowLeft, LogOut, X,
  Globe, Bell, Moon, Sun, Menu,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { useLanguage } from '../../hooks/useLanguage';

export const AdminShellContext = createContext({ openDrawer: () => {} });

const NAV = [
  { id: 'overview',      to: '/admin',                end: true,  Icon: LayoutDashboard },
  { id: 'vendors',       to: '/admin/vendors',                    Icon: Store,       subtitleKey: 'admin.vendors.subtitle' },
  { id: 'approvals',     to: '/admin/approvals',                  Icon: UserCheck },
  { id: 'orders',        to: '/admin/orders',                     Icon: ShoppingBag, subtitleKey: 'admin.orders.subtitle' },
  { id: 'payouts',       to: '/admin/payouts',                    Icon: Wallet },
  { id: 'customers',     to: '/admin/customers',                  Icon: Users },
  { id: 'subscriptions', to: '/admin/subscriptions',              Icon: BadgePercent, subtitleKey: 'admin.subscriptions.subtitle' },
  { id: 'settings',      to: '/admin/settings',                   Icon: Settings },
  { id: 'categories',    to: '/admin/categories',                 Icon: Tag,         subtitleKey: 'admin.categories.subtitle' },
];

function SidebarContents({ t, onLogout, onNavClick, onClose }) {
  return (
    <>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 py-2">
        <span className="grid place-items-center w-9 h-9 rounded-2xl bg-blue-600 text-white font-extrabold shadow-[0_6px_18px_-6px_rgba(37,99,235,0.8)] text-base select-none">
          ኪ
        </span>
        <div className="leading-none">
          <div className="font-extrabold">{t('brand')}</div>
          <div className="text-[10px] tracking-[0.18em] text-slate-500 uppercase">Admin</div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden ms-auto grid place-items-center w-8 h-8 rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
          aria-label={t('common.menu')}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 mt-2 overflow-y-auto">
        {NAV.map(({ id, to, end, Icon }) => (
          <NavLink
            key={id}
            to={to}
            end={end}
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-[0_8px_22px_-8px_rgba(37,99,235,0.7)]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/5'
              }`
            }
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            {t(`admin.nav.${id}`)}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08] space-y-0.5">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/5 transition"
        >
          <ArrowLeft className="w-[18px] h-[18px] rtl:rotate-180 shrink-0" />
          {t('common.backToSite')}
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-rose-600 hover:bg-rose-500/10 transition"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {t('common.logout')}
        </button>
      </div>
    </>
  );
}

export default function AdminShell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const dark = useUiStore((s) => s.dark);
  const toggleDark = useUiStore((s) => s.toggleDark);
  const { cycleLanguage } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const profileInitial = (user?.name ?? 'A')[0].toUpperCase();

  const activeNav = [...NAV]
    .sort((a, b) => b.to.length - a.to.length)
    .find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))
    ?? NAV[0];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <AdminShellContext.Provider value={{ openDrawer: () => setDrawerOpen(true) }}>
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#eef2f9] via-[#e9eef7] to-[#e6ecf6] dark:from-[#080b11] dark:via-[#0a0e15] dark:to-[#080b11]" />
      <div className="fixed -top-32 start-1/4 -z-10 w-[38rem] h-[38rem] rounded-full bg-blue-400/30 dark:bg-blue-500/10 blur-[140px]" />
      <div className="fixed top-1/3 end-0 -z-10 w-[32rem] h-[32rem] rounded-full bg-sky-300/30 dark:bg-sky-500/10 blur-[140px]" />
      <div className="fixed bottom-0 start-1/3 -z-10 w-[30rem] h-[30rem] rounded-full bg-indigo-300/25 dark:bg-indigo-500/10 blur-[130px]" />

      <div className="min-h-screen overflow-x-hidden p-3 sm:p-4 lg:p-6">
        <div className="max-w-[1500px] mx-auto lg:flex lg:gap-6">
          {/* Mobile backdrop */}
          {drawerOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Sidebar */}
          <aside
            className={`fixed lg:sticky top-3 lg:top-6 start-3 lg:start-0 bottom-3 lg:bottom-auto z-[60] lg:z-auto w-64 shrink-0 lg:self-start lg:h-[calc(100vh-3rem)] flex flex-col rounded-[1.75rem] bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] [backdrop-filter:blur(28px)_saturate(180%)] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.20)] dark:shadow-[0_14px_44px_-14px_rgba(0,0,0,.5)] p-3.5 transition-transform duration-300 ${
              drawerOpen
                ? 'translate-x-0 rtl:translate-x-0'
                : '-translate-x-[110%] rtl:translate-x-[110%] lg:translate-x-0 lg:rtl:translate-x-0'
            }`}
          >
            <SidebarContents
              t={t}
              onLogout={handleLogout}
              onNavClick={() => setDrawerOpen(false)}
              onClose={() => setDrawerOpen(false)}
            />
          </aside>

          {/* Page content */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Shared top bar */}
            <div className="flex items-center gap-3 rounded-[1.5rem] px-3 sm:px-4 h-16 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] [backdrop-filter:blur(28px)_saturate(180%)] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)]">
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden grid place-items-center w-10 h-10 -ms-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition"
                aria-label={t('common.menu')}
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-extrabold leading-none truncate">
                  {t(`admin.nav.${activeNav.id}`)}
                </h1>
                {activeNav.subtitleKey && (
                  <p className="text-[11px] text-slate-500 mt-0.5">{t(activeNav.subtitleKey)}</p>
                )}
              </div>
              <div className="ms-auto flex items-center gap-1">
                <button
                  onClick={cycleLanguage}
                  className="grid place-items-center w-10 h-10 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition"
                  aria-label={t('header.language')}
                >
                  <Globe className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleDark}
                  className="grid place-items-center w-10 h-10 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition"
                  aria-label={t('header.theme')}
                >
                  {dark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
                </button>
                <button
                  className="relative grid place-items-center w-10 h-10 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition"
                  aria-label={t('header.notifications')}
                >
                  <Bell className="w-5 h-5" />
                </button>
                <span className="grid place-items-center w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-extrabold ms-0.5 select-none">
                  {profileInitial}
                </span>
              </div>
            </div>

            <Outlet />
          </div>
        </div>
      </div>
    </AdminShellContext.Provider>
  );
}
