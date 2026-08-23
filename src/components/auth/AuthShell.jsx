import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '../../store/uiStore';

// Shared topbar + hero panel for standalone auth pages (Login, Register, and the
// forgot/reset-password flow) — extracted once a third and fourth page needed the
// same wrapper markup that Login.jsx/Register.jsx already duplicate between them.
const LANG_LABEL = { en: 'EN', am: 'አማ', ar: 'ع' };

export default function AuthShell({ children }) {
  const { t } = useTranslation();
  const cycleLanguage = useUiStore((s) => s.cycleLanguage);
  const toggleDark = useUiStore((s) => s.toggleDark);
  const dark = useUiStore((s) => s.dark);
  const language = useUiStore((s) => s.language);

  return (
    <div className="min-h-screen flex flex-col bg-cream dark:bg-ink dark:text-slate-100">
      {/* Minimal top bar */}
      <div className="max-w-6xl mx-auto w-full px-4 h-16 flex items-center justify-between shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-forest text-white font-extrabold text-lg shadow-glow">
            ኪ
          </span>
          <span className="text-xl font-extrabold tracking-tight text-forest">{t('brand')}</span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={cycleLanguage}
            aria-label={t('auth.toggleLanguage')}
            className="inline-flex items-center gap-1.5 px-3 h-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-sm font-medium transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{LANG_LABEL[language]}</span>
          </button>
          <button
            onClick={toggleDark}
            aria-label={t('auth.toggleDark')}
            className="grid place-items-center w-10 h-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            {dark ? (
              <svg className="w-5 h-5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Auth layout */}
      <main className="flex-1 grid lg:grid-cols-2">
        {/* Hero / brand panel */}
        <div className="hidden lg:flex flex-col justify-center gap-6 p-14 bg-gradient-to-br from-forest to-forest-deep text-white relative overflow-hidden">
          <div className="absolute -top-20 -end-20 w-72 h-72 rounded-full bg-gold/20 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-md">
            <h1 className="text-4xl font-extrabold leading-tight">{t('auth.heroTitle')}</h1>
            <p className="mt-4 text-white/85 text-lg">{t('auth.heroSub')}</p>
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
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </main>
    </div>
  );
}
