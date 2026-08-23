import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui';
import AuthShell from '../components/auth/AuthShell';
import api from '../lib/api';

function resolveError(err, t) {
  const code = err.response?.data?.error?.code;
  const msg = err.response?.data?.error?.message;
  if (code === 'INVALID_RESET_CODE') return t('auth.invalidResetCode');
  if (code === 'WEAK_PASSWORD') return t('auth.weakPassword');
  return msg ?? t('common.error');
}

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const phoneFromState = location.state?.phone ?? '';
  const devCode = location.state?.devCode ?? '';

  const [phone, setPhone] = useState(phoneFromState);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handlePhoneChange = (e) => {
    let val = e.target.value.trim();
    if (val.startsWith('+251')) val = val.slice(4);
    else if (val.startsWith('251')) val = val.slice(3);
    else if (val.startsWith('0')) val = val.slice(1);
    setPhone(val);
  };

  const fullPhone = phone.startsWith('+251') ? phone : '+251' + phone;

  const handleResend = async () => {
    setError('');
    setResending(true);
    try {
      await api.post('/auth/forgot-password', { phone: fullPhone });
    } catch (err) {
      setError(resolveError(err, t));
    } finally {
      setResending(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError(t('auth.weakPassword'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { phone: fullPhone, code, newPassword });
      navigate('/login', { state: { resetSuccess: true } });
    } catch (err) {
      setError(resolveError(err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <span className="grid place-items-center w-14 h-14 rounded-2xl bg-forest/10 text-forest mb-3">
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z" /><path d="M8 11V7a4 4 0 1 1 8 0v4" />
        </svg>
      </span>

      <h2 className="text-2xl font-extrabold">{t('auth.resetPasswordTitle')}</h2>
      {phoneFromState && (
        <p className="text-sm text-ink/60 dark:text-slate-400 mt-1">
          {t('auth.otpSentTo')} <span className="font-semibold text-ink dark:text-slate-200">{phoneFromState}</span>
        </p>
      )}

      {devCode && (
        <p className="mt-3 text-xs font-semibold text-gold-dark bg-gold/15 rounded-xl px-3 py-2">
          {t('auth.resetCodeDevNote')}: <span className="tracking-widest">{devCode}</span>
        </p>
      )}

      <form onSubmit={submit} className="mt-5 space-y-3" noValidate>
        {!phoneFromState && (
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
        )}

        <label className="block">
          <span className="block text-xs font-semibold text-ink/60 dark:text-slate-400 mb-1.5">
            {t('auth.resetCode')}
          </span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••••"
            required
            className="w-full text-center text-2xl font-extrabold tracking-[0.5em] px-4 py-3.5 rounded-2xl ring-1 ring-black/10 dark:ring-white/15 bg-cream/40 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-forest"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-semibold text-ink/60 dark:text-slate-400 mb-1.5">
            {t('auth.newPassword')}
          </span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••"
            required
            className="w-full px-3.5 py-3 rounded-xl ring-1 ring-black/10 dark:ring-white/15 bg-cream/40 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-forest"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-semibold text-ink/60 dark:text-slate-400 mb-1.5">
            {t('auth.confirmNewPassword')}
          </span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••"
            required
            className="w-full px-3.5 py-3 rounded-xl ring-1 ring-black/10 dark:ring-white/15 bg-cream/40 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-forest"
          />
        </label>

        {error && (
          <p className="text-sm text-crimson font-medium" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={loading || code.length < 6}
          className="w-full shadow-glow mt-2"
        >
          {loading ? t('common.loading') : t('auth.verifyBtn')}
        </Button>
      </form>

      {phoneFromState && (
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="mt-4 w-full text-center text-sm font-semibold text-forest hover:underline disabled:opacity-50"
        >
          {resending ? t('common.loading') : t('auth.resendCode')}
        </button>
      )}

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
