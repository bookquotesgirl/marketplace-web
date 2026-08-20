import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';

// Nav is data-driven so items/labels can be changed without restructuring the shell.
// end:true means NavLink only matches the exact path (prevents /vendor matching all children).
const NAV = [
  { id: 'dashboard',    to: '/vendor',              end: true },
  { id: 'products',     to: '/vendor/products' },
  { id: 'orders',       to: '/vendor/orders' },
  { id: 'payouts',      to: '/vendor/payouts' },
  { id: 'subscription', to: '/vendor/subscription' },
  { id: 'settings',     to: '/vendor/settings' },
];

function SidebarContents({ user, t, onLogout, onNavClick }) {
  const vendor = user?.vendor;
  return (
    <div className="flex flex-col h-full bg-white border-e border-black/5">
      {/* Brand + store identity */}
      <div className="p-4 pb-3 border-b border-black/5">
        <Link to="/" className="text-xl font-extrabold text-forest">
          {t('brand')}
        </Link>
        {vendor && (
          <div className="mt-3 flex items-center gap-2.5">
            {vendor.logoUrl ? (
              <img
                src={vendor.logoUrl}
                alt={vendor.storeName}
                className="w-8 h-8 rounded-lg object-cover shrink-0"
              />
            ) : (
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-forest/10 text-forest font-extrabold text-sm shrink-0">
                {vendor.storeName?.[0]?.toUpperCase() ?? 'V'}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{vendor.storeName}</p>
              {vendor.plan && (
                <p className="text-[11px] text-ink/50">{vendor.plan.name}</p>
              )}
            </div>
          </div>
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
                  ? 'bg-forest/10 text-forest'
                  : 'text-ink/60 hover:bg-black/5 hover:text-ink'
              }`
            }
          >
            {t(`vendor.nav.${item.id}`)}
          </NavLink>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="p-2 border-t border-black/5 space-y-0.5">
        {vendor?.slug && (
          <Link
            to={`/store/${vendor.slug}`}
            className="block px-3 py-2.5 rounded-2xl text-sm font-semibold text-ink/60 hover:bg-black/5 hover:text-ink transition"
          >
            {t('common.viewStore')}
          </Link>
        )}
        <button
          onClick={onLogout}
          className="w-full text-start px-3 py-2.5 rounded-2xl text-sm font-semibold text-crimson hover:bg-crimson/10 transition"
        >
          {t('common.logout')}
        </button>
      </div>
    </div>
  );
}

export default function VendorShell() {
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
    <div className="min-h-screen bg-cream">
      {/* Desktop sidebar — fixed, full height */}
      <aside className="hidden lg:block fixed inset-y-0 start-0 w-64 z-20">
        <SidebarContents user={user} t={t} onLogout={handleLogout} />
      </aside>

      {/* Mobile backdrop */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-ink/30 backdrop-blur-sm z-30"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer — slides from inline-start edge (left in LTR, right in RTL) */}
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

      {/* Main area — offset by sidebar on large screens */}
      <div className="lg:ms-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-black/5 px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="grid place-items-center w-9 h-9 rounded-xl hover:bg-black/5 transition"
            aria-label={t('common.menu')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-extrabold text-forest">{t('brand')}</span>
        </div>

        {/* Page outlet */}
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
