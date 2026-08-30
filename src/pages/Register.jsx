import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, PasswordInput } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import api from '../lib/api';
import LanguagePicker from '../components/LanguagePicker';

const FEATURES = [
  {
    key: 'feature1',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    key: 'feature2',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
      </svg>
    ),
  },
  {
    key: 'feature3',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
];

// Maps an API error code to the appropriate i18n key string.
function resolveError(err, t) {
  const code = err.response?.data?.error?.code;
  const msg  = err.response?.data?.error?.message;
  switch (code) {
    case 'PHONE_ALREADY_REGISTERED': return t('auth.phoneAlreadyRegistered');
    case 'INVALID_OTP':              return t('auth.invalidOtp');
    case 'SESSION_EXPIRED':          return t('auth.sessionExpired');
    case 'MAX_ATTEMPTS_EXCEEDED':    return t('auth.maxAttemptsExceeded');
    case 'VALIDATION_ERROR':         return msg ?? t('common.error');
    default:                         return msg ?? t('common.error');
  }
}

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const toggleDark = useUiStore((s) => s.toggleDark);
  const dark = useUiStore((s) => s.dark);
  // step: 'phone' → 'otp' → 'complete'
  const [step, setStep] = useState('phone');

  // Phone stored as local digits only (+251 prepended when sent to API).
  const [phone, setPhoneState] = useState('');

  const [otp, setOtp] = useState('');
  // True when MAX_ATTEMPTS_EXCEEDED is returned — locks the OTP input.
  const [otpLocked, setOtpLocked] = useState(false);

  // Name + password collected in the final step.
  const [form, setForm] = useState({ name: '', password: '' });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resend, setResend] = useState(0);
  const timerRef = useRef(null);

  // Clean up countdown on unmount.
  useEffect(() => () => clearInterval(timerRef.current), []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // Strip any country-code prefix so the input always holds local digits.
  const handlePhoneChange = (e) => {
    let val = e.target.value.trim();
    if (val.startsWith('+251'))      val = val.slice(4);
    else if (val.startsWith('251'))  val = val.slice(3);
    else if (val.startsWith('0'))    val = val.slice(1);
    setPhoneState(val);
  };

  function startResendTimer() {
    setResend(30);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResend((r) => {
        if (r <= 1) { clearInterval(timerRef.current); return 0; }
        return r - 1;
      });
    }, 1000);
  }

  // ── Step 1: initiate — POST /auth/register/initiate ──────────────────
  const initiateRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register/initiate', { phone: '+251' + phone });
      setStep('otp');
      setOtp('');
      setOtpLocked(false);
      startResendTimer();
    } catch (err) {
      setError(resolveError(err, t));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify — POST /auth/register/verify ──────────────────────
  const verifyOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register/verify', { phone: '+251' + phone, code: otp });
      setStep('complete');
      setError('');
    } catch (err) {
      if (err.response?.data?.error?.code === 'MAX_ATTEMPTS_EXCEEDED') {
        setOtpLocked(true);
      }
      setError(resolveError(err, t));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: complete — POST /auth/register/complete ──────────────────
  const completeRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register/complete', {
        phone: '+251' + phone,
        name: form.name,
        password: form.password,
      });
      setAuth({ token: data.token, user: data.user });
      const role = data.user?.role;
      if (role === 'vendor')      navigate('/vendor', { replace: true });
      else if (role === 'admin')  navigate('/admin',  { replace: true });
      else                        navigate('/',        { replace: true });
    } catch (err) {
      setError(resolveError(err, t));
    } finally {
      setLoading(false);
    }
  };

  // ── Resend — POST /auth/register/resend-otp ──────────────────────────
  const handleResend = async () => {
    setError('');
    setOtpLocked(false);
    try {
      await api.post('/auth/register/resend-otp', { phone: '+251' + phone });
      setOtp('');
      startResendTimer();
    } catch (err) {
      setError(resolveError(err, t));
    }
  };

  // Back helpers
  function goBackToPhone() {
    clearInterval(timerRef.current);
    setStep('phone');
    setOtp('');
    setOtpLocked(false);
    setError('');
  }

  function goBackToOtp() {
    setStep('otp');
    setError('');
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream dark:bg-ink dark:text-slate-100">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto w-full px-4 h-16 flex items-center justify-between shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-forest text-white font-extrabold text-lg">
            ኪ
          </span>
          <span className="text-xl font-extrabold tracking-tight text-forest">{t('brand')}</span>
        </Link>
        <div className="flex items-center gap-1">
          <LanguagePicker variant="header" />
          <button
            onClick={toggleDark}
            aria-label={t('auth.toggleDark')}
            className="grid place-items-center w-10 h-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            {dark ? (
              // sun
              <svg className="w-5 h-5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              // moon
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

            {/* ── STEP 1: PHONE ─────────────────────────────────────────── */}
            {step === 'phone' && (
              <>
                {/* Tab bar */}
                <div className="flex gap-1 p-1 rounded-2xl bg-black/5 dark:bg-white/10 mb-6">
                  <Link
                    to="/login"
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center transition text-ink/60 dark:text-slate-300 hover:text-ink dark:hover:text-white"
                  >
                    {t('auth.signIn')}
                  </Link>
                  <span className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center bg-white dark:bg-slate-800 shadow-soft text-forest">
                    {t('auth.createAccount')}
                  </span>
                </div>

                <h2 className="text-2xl font-extrabold">{t('auth.createYourAccount')}</h2>
                <p className="text-sm text-ink/60 dark:text-slate-400 mt-1">
                  {t('auth.enterPhoneSub')}
                </p>

                <form onSubmit={initiateRegistration} className="mt-5 space-y-3" noValidate>
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
                      {error}{' '}
                      {error === t('auth.phoneAlreadyRegistered') && (
                        <Link to="/login" className="underline font-semibold">
                          {t('auth.signInInstead')}
                        </Link>
                      )}
                    </p>
                  )}

                  <Button type="submit" size="lg" disabled={loading} className="w-full mt-2">
                    {loading ? t('common.loading') : t('auth.sendCode')}
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
              </>
            )}

            {/* ── STEP 2: OTP ───────────────────────────────────────────── */}
            {step === 'otp' && (
              <div>
                <button
                  type="button"
                  onClick={goBackToPhone}
                  className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-forest mb-4 transition"
                >
                  <svg className="w-4 h-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                  </svg>
                  {t('auth.back')}
                </button>

                <span className="grid place-items-center w-14 h-14 rounded-2xl bg-forest/10 text-forest mb-3">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>

                <h2 className="text-2xl font-extrabold">{t('auth.verifyPhone')}</h2>
                <p className="text-sm text-ink/60 dark:text-slate-400 mt-1">
                  {t('auth.otpSentTo')}{' '}
                  <span className="font-semibold text-ink dark:text-slate-200">
                    +251 {phone}
                  </span>
                </p>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  disabled={otpLocked}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  aria-label={t('auth.verifyPhone')}
                  className="mt-5 w-full text-center text-2xl font-extrabold tracking-[0.5em] px-4 py-3.5 rounded-2xl ring-1 ring-black/10 dark:ring-white/15 bg-cream/40 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-forest disabled:opacity-40 disabled:cursor-not-allowed"
                />

                {error && (
                  <p className="text-sm text-crimson font-medium mt-2" role="alert">
                    {error}
                  </p>
                )}

                {!otpLocked && (
                  <Button
                    type="button"
                    size="lg"
                    disabled={otp.length < 6 || loading}
                    className="w-full mt-4"
                    onClick={verifyOtp}
                  >
                    {!loading && (
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 20 4 15" />
                      </svg>
                    )}
                    {loading ? t('common.loading') : t('auth.verifyBtn')}
                  </Button>
                )}

                <p className="text-sm text-center text-ink/60 dark:text-slate-400 mt-4">
                  {resend > 0 && !otpLocked ? (
                    <span>{t('auth.resendIn')} {resend}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-forest font-semibold hover:underline"
                    >
                      {t('auth.resendCode')}
                    </button>
                  )}
                </p>
              </div>
            )}

            {/* ── STEP 3: COMPLETE ──────────────────────────────────────── */}
            {step === 'complete' && (
              <>
                <button
                  type="button"
                  onClick={goBackToOtp}
                  className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-forest mb-4 transition"
                >
                  <svg className="w-4 h-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                  </svg>
                  {t('auth.back')}
                </button>

                <h2 className="text-2xl font-extrabold">{t('auth.completeSetup')}</h2>
                <p className="text-sm text-ink/60 dark:text-slate-400 mt-1">
                  {t('auth.completeSetupSub')}
                </p>

                <form onSubmit={completeRegistration} className="mt-5 space-y-3" noValidate>
                  <label className="block">
                    <span className="block text-xs font-semibold text-ink/60 dark:text-slate-400 mb-1.5">
                      {t('auth.name')}
                    </span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={set('name')}
                      autoComplete="name"
                      placeholder="Abebe Kebede"
                      required
                      className="w-full px-3.5 py-3 rounded-xl ring-1 ring-black/10 dark:ring-white/15 bg-cream/40 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-forest"
                    />
                  </label>

                  <PasswordInput
                    label={t('auth.password')}
                    value={form.password}
                    onChange={set('password')}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    required
                  />

                  {error && (
                    <p className="text-sm text-crimson font-medium" role="alert">
                      {error}
                    </p>
                  )}

                  <Button type="submit" size="lg" disabled={loading} className="w-full mt-2">
                    {loading ? t('common.loading') : t('auth.submitRegister')}
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
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
