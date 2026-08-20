import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';

// Nav is data-driven so items/labels can be changed without restructuring the shell.
const NAV = [
  { id: 'overview',       to: '/admin',                end: true },
  { id: 'vendors',        to: '/admin/vendors' },
  { id: 'approvals',      to: '/admin/approvals' },
  { id: 'orders',         to: '/admin/orders' },
  { id: 'payouts',        to: '/admin/payouts' },
  { id: 'customers',      to: '/admin/customers' },
  { id: 'subscriptions',  to: '/admin/subscriptions' },
  { id: 'settings',       to: '/admin/settings' },
];

function SidebarContents({ user, t, onLogout, onNavClick }) {
  return (
    <div className="flex flex-col h-full bg-ink text-slate-300">
      {/* Brand */}
      <div className="p-4 pb-3 border-b border-white/10">
        <Link to="/" className="text-xl font-extrabold text-white">
          {t('brand')}
        </Link>
        {user && (
          <p className="text-[11px] text-slate-400 mt-1 truncate">{user.name}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.end}
            onClick={onNavClick}
            className={({ isActive }) =>
              `block px-3 py-2.5 rounded-2xl text-sm font-semibold transition ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {t(`admin.nav.${item.id}`)}
          </NavLink>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="p-2 border-t border-white/10 space-y-0.5">
        <Link
          to="/"
          className="block px-3 py-2.5 rounded-2xl text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition"
        >
          {t('common.backToSite')}
        </Link>
        <button
          onClick={onLogout}
          className="w-full text-start px-3 py-2.5 rounded-2xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition"
        >
          {t('common.logout')}
        </button>
      </div>
    </div>
  );
}

export default function AdminShell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Desktop sidebar — fixed, full height */}
      <aside className="hidden lg:block fixed inset-y-0 start-0 w-64 z-20">
        <SidebarContents user={user} t={t} onLogout={handleLogout} />
      </aside>

      {/* Mobile backdrop */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 start-0 w-64 z-40 transition-transform duration-200 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
        }`}
      >
        <SidebarContents
          user={user}
          t={t}
          onLogout={handleLogout}
          onNavClick={() => setDrawerOpen(false)}
        />
      </aside>

      {/* Main area */}
      <div className="lg:ms-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 bg-ink text-white px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="grid place-items-center w-9 h-9 rounded-xl hover:bg-white/10 transition"
            aria-label={t('common.menu')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-extrabold">{t('brand')}</span>
        </div>

        {/* Page outlet */}
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
