import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui';
import AuthShell from '../components/auth/AuthShell';
import api from '../lib/api';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneChange = (e) => {
    let val = e.target.value.trim();
    if (val.startsWith('+251')) val = val.slice(4);
    else if (val.startsWith('251')) val = val.slice(3);
    else if (val.startsWith('0')) val = val.slice(1);
    setPhone(val);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fullPhone = '+251' + phone;
      const { data } = await api.post('/auth/forgot-password', { phone: fullPhone });
      // Dev-only stub: the backend echoes the code back when NODE_ENV=development
      // and SMS_PROVIDER=console — there's no real SMS to receive it from otherwise.
      navigate('/reset-password', { state: { phone: fullPhone, devCode: data.code ?? null } });
    } catch (err) {
      setError(err.response?.data?.error?.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <span className="grid place-items-center w-14 h-14 rounded-2xl bg-forest/10 text-forest mb-3">
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </span>

      <h2 className="text-2xl font-extrabold">{t('auth.forgotPasswordTitle')}</h2>
      <p className="text-sm text-ink/60 dark:text-slate-400 mt-1">{t('auth.forgotPasswordSub')}</p>

      <form onSubmit={submit} className="mt-5 space-y-3" noValidate>
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
              value={phone}
              onChange={handlePhoneChange}
              autoComplete="tel"
              placeholder="911 234 567"
              required
              className="flex-1 px-3 py-3 bg-transparent outline-none"
            />
          </div>
        </label>

        {error && (
          <p className="text-sm text-crimson font-medium" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={loading} className="w-full shadow-glow mt-2">
          {loading ? t('common.loading') : t('auth.sendCode')}
        </Button>
      </form>

      <Link
        to="/login"
        className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-forest hover:underline"
      >
        <svg className="w-4 h-4 rtl:rotate-180 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        {t('auth.backToLogin')}
      </Link>
    </AuthShell>
  );
}
