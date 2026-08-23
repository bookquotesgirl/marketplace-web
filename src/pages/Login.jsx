import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import api from '../lib/api';

// Language label shown on the toggle button — mirrors Header.jsx.
const LANG_LABEL = { en: 'EN', am: 'አማ', ar: 'ع' };

// Hero feature list — inline SVG icons (Lucide shapes; no icon library needed).
const FEATURES = [
  {
    key: 'feature1',
    icon: (
      // package icon
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    key: 'feature2',
    icon: (
      // wallet icon
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
      </svg>
    ),
  },
  {
    key: 'feature3',
    icon: (
      // truck icon
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
];

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const cycleLanguage = useUiStore((s) => s.cycleLanguage);
  const toggleDark = useUiStore((s) => s.toggleDark);
  const dark = useUiStore((s) => s.dark);
  const language = useUiStore((s) => s.language);

  const [form, setForm] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (e) => {
    let val = e.target.value.trim();
    if (val.startsWith('+251'))     val = val.slice(4);
    else if (val.startsWith('251')) val = val.slice(3);
    else if (val.startsWith('0'))   val = val.slice(1);
    setForm((f) => ({ ...f, phone: val }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        phone: '+251' + form.phone,
        password: form.password,
      });
      setAuth({ user: data.user, token: data.token });
      if (data.user.role === 'vendor') navigate('/vendor', { replace: true });
      else if (data.user.role === 'admin') navigate('/admin', { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream dark:bg-ink dark:text-slate-100">
      {/* ── Minimal top bar ──────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto w-full px-4 h-16 flex items-center justify-between shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-forest text-white font-extrabold text-lg shadow-glow">
            ኪ
          </span>
          <span className="text-xl font-extrabold tracking-tight text-forest">{t('brand')}</span>
        </Link>
        <div className="flex items-center gap-1">
          {/* Language cycle */}
          <button
            onClick={cycleLanguage}
            aria-label={t('auth.toggleLanguage')}
            className="inline-flex items-center gap-1.5 px-3 h-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-sm font-medium transition"
          >
            {/* globe icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{LANG_LABEL[language]}</span>
          </button>
          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            aria-label={t('auth.toggleDark')}
            className="grid place-items-center w-10 h-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            {dark ? (
              // sun icon
              <svg className="w-5 h-5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              // moon icon
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Auth layout ──────────────────────────────────────────────────── */}
      <main className="flex-1 grid lg:grid-cols-2">
        {/* Hero / brand panel */}
        <div className="hidden lg:flex flex-col justify-center gap-6 p-14 bg-gradient-to-br from-forest to-forest-deep text-white relative overflow-hidden">
          {/* Decorative gold orb */}
          <div className="absolute -top-20 -end-20 w-72 h-72 rounded-full bg-gold/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-md">
            <h1 className="text-4xl font-extrabold leading-tight">{t('auth.heroTitle')}</h1>
            <p className="mt-4 text-white/85 text-lg">{t('auth.heroSub')}</p>

            <div className="mt-8 space-y-3">
              {FEATURES.map((f) => (
                <div key={f.key} className="flex items-center gap-3">
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-white/15 shrink-0">
                    {f.icon}
                  </span>
                  <span className="text-white/90">{t(`auth.${f.key}`)}</span>
                </div>
              ))}
            </div>

            {/* Payment method badges */}
            <div className="mt-8 flex flex-wrap gap-2">
              {['Telebirr', 'CBE Birr', 'ArifPay', 'Cash on Delivery'].map((p) => (
                <span key={p} className="px-2.5 py-1 rounded-md bg-white/15 text-white text-[11px] font-bold">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            {/* Tabs — Sign in active, Create account links to /register */}
            <div className="flex gap-1 p-1 rounded-2xl bg-black/5 dark:bg-white/10 mb-6">
              <span className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center bg-white dark:bg-slate-800 shadow-soft text-forest">
                {t('auth.signIn')}
              </span>
              <Link
                to="/register"
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center text-ink/60 dark:text-slate-300 hover:text-ink dark:hover:text-white transition"
              >
                {t('auth.createAccount')}
              </Link>
            </div>

            <h2 className="text-2xl font-extrabold">{t('auth.welcomeBack')}</h2>
            <p className="text-sm text-ink/60 dark:text-slate-400 mt-1">{t('auth.continueWithPhone')}</p>

            {location.state?.resetSuccess && (
              <p className="mt-3 text-sm font-medium text-forest bg-forest/10 rounded-xl px-3 py-2" role="status">
                {t('auth.resetSuccess')}
              </p>
            )}

            <form onSubmit={submit} className="mt-5 space-y-3" noValidate>
              {/* Phone with +251 prefix */}
              <label className="block">
                <span className="block text-xs font-semibold text-ink/60 dark:text-slate-400 mb-1.5">
                  {t('auth.phone')}
                </span>
                <div className="flex rounded-xl ring-1 ring-black/10 dark:ring-white/15 focus-within:ring-2 focus-within:ring-forest bg-cream/40 dark:bg-slate-900 overflow-hidden">
                  <span className="grid place-items-center px-3 text-sm text-ink/60 dark:text-slate-400 border-e border-black/10 dark:border-white/10 shrink-0">
                    +251
                  </span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={handlePhoneChange}
                    autoComplete="tel"
                    placeholder="911 234 567"
                    required
                    className="flex-1 px-3 py-3 bg-transparent outline-none"
                  />
                </div>
              </label>

              {/* Password */}
              <label className="block">
                <span className="block text-xs font-semibold text-ink/60 dark:text-slate-400 mb-1.5">
                  {t('auth.password')}
                </span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-3 rounded-xl ring-1 ring-black/10 dark:ring-white/15 bg-cream/40 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-forest"
                />
                <Link
                  to="/forgot-password"
                  className="block text-xs text-forest font-semibold mt-1.5 text-end hover:underline"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </label>

              {error && (
                <p className="text-sm text-crimson font-medium" role="alert">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full shadow-glow mt-2"
              >
                {loading ? t('common.loading') : t('auth.submit')}
                {!loading && (
                  <svg className="w-4 h-4 rtl:rotate-180 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                )}
              </Button>
            </form>

            <p className="text-[11px] text-ink/50 dark:text-slate-400 text-center mt-5">
              {t('auth.terms')}
            </p>

            <Link
              to="/vendor/register"
              className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-forest hover:underline"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              {t('auth.sellerCta')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
