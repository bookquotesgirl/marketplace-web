import { useEffect, useRef, useState } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'አማርኛ' },
  { code: 'ar', label: 'العربية' },
];

/**
 * Direct-selection language dropdown.
 *
 * variant="header"  — buyer header styling (cream/white bg)
 * variant="shell"   — admin/vendor shell styling (glass panel)
 */
export default function LanguagePicker({ variant = 'shell' }) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isShell = variant === 'shell';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('header.language')}
        aria-haspopup="true"
        aria-expanded={open}
        className={
          isShell
            ? 'grid place-items-center w-10 h-10 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition'
            : 'p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition'
        }
      >
        <Globe className="w-5 h-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full mt-2 end-0 w-40 rounded-2xl bg-white dark:bg-slate-800 shadow-[0_8px_28px_-8px_rgba(30,50,90,.20)] ring-1 ring-black/5 dark:ring-white/10 py-1.5 z-[200]"
        >
          {LANGS.map(({ code, label }) => (
            <button
              key={code}
              role="menuitem"
              onClick={() => { setLanguage(code); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06] ${
                language === code
                  ? 'font-bold text-forest dark:text-emerald-400'
                  : 'font-medium text-ink/70 dark:text-slate-300'
              }`}
            >
              {language === code && (
                <span className="w-1.5 h-1.5 rounded-full bg-forest dark:bg-emerald-400 shrink-0" />
              )}
              {language !== code && <span className="w-1.5 h-1.5 shrink-0" />}
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
