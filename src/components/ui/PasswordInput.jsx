import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';

// Password field with a show/hide toggle on the trailing (inline-end) side — the
// pattern used across other platforms. The eye button flips the input between
// `password` and `text`; it never submits and stays out of the tab order-critical
// path via a clear `aria-label` + `aria-pressed`.
export default function PasswordInput({ label, className = '', inputClassName = '', ...props }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="block text-xs font-semibold text-ink/60 dark:text-slate-400 mb-1.5">
          {label}
        </span>
      )}
      <div className="flex items-stretch rounded-xl ring-1 ring-black/10 dark:ring-white/15 focus-within:ring-2 focus-within:ring-forest bg-cream/40 dark:bg-slate-900 overflow-hidden">
        <input
          type={visible ? 'text' : 'password'}
          className={`flex-1 min-w-0 px-3.5 py-3 bg-transparent outline-none dark:text-slate-100 ${inputClassName}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          aria-pressed={visible}
          className="grid place-items-center px-3 text-ink/50 dark:text-slate-400 hover:text-forest dark:hover:text-forest-light transition"
        >
          {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </label>
  );
}
