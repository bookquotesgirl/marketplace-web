import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { Spinner } from '../../components/ui';

const TABS = [
  { id: 'profile', to: '/profile', end: true },
  { id: 'addresses', to: '/profile/addresses' },
  { id: 'security', to: '/profile/security' },
];

function initials(name) {
  return (name || '')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AccountLayout() {
  const { t } = useTranslation();

  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    api
      .get('/me/profile')
      .then((res) => {
        if (cancelled) return;
        setProfile(res.data.profile);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading') {
    return (
      <section className="max-w-6xl mx-auto px-4 py-16 grid place-items-center">
        <Spinner />
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-ink/60 dark:text-slate-400">{t('common.error')}</p>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-5">{t('account.title')}</h1>

      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6 items-start">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24">
          <div className="hidden lg:flex flex-col items-center bg-white dark:bg-slate-800 rounded-3xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft p-5 mb-4 text-center">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <span className="grid place-items-center w-20 h-20 rounded-full bg-forest text-white text-2xl font-extrabold">
                {initials(profile.name)}
              </span>
            )}
            <h2 className="font-bold mt-3">{profile.name}</h2>
            <p className="text-xs text-ink/50 dark:text-slate-400 mt-0.5">{profile.phone}</p>
            {profile.isPhoneVerified && (
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-forest/10 text-forest text-[11px] font-bold">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
                </svg>
                {t('account.verifiedPhone')}
              </span>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft p-2">
            <div className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
              {TABS.map((tab) => (
                <NavLink
                  key={tab.id}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    `shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                      isActive
                        ? 'bg-forest text-white'
                        : 'text-ink/70 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
                    }`
                  }
                >
                  {t(`account.nav.${tab.id}`)}
                </NavLink>
              ))}
              <Link
                to="/orders"
                className="shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-ink/70 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                {t('account.nav.orders')}
              </Link>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="mt-5 lg:mt-0">
          <Outlet context={{ profile, setProfile }} />
        </div>
      </div>
    </section>
  );
}
