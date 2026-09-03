import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

// POST /api/auth/register-vendor
// API-submitted fields: name, email, phone, password, storeName,
//   kyc.businessName, kyc.docType ('TIN Certificate'), kyc.docNumber (tin), kyc.docUrl ('')
// Display-only (not submitted): businessType, region (step 1); category, description (step 2);
//   plan, cycle (step 3); wallet (step 4) — kept for UX fidelity, wired to API in a future story.

const BIZ_TYPES = ['Sole Proprietor', 'PLC', 'Partnership', 'Individual / Informal'];
const REGIONS   = ['Addis Ababa', 'Adama', 'Hawassa', 'Bahir Dar', 'Dire Dawa', 'Mekelle', 'Gondar'];
const CATEGORIES = [
  'Electronics', 'Fashion', 'Home & Kitchen', 'Beauty & Cosmetics',
  'Coffee & Spice', 'Furniture', 'Habesha Wear', 'Supermarket', 'Handicrafts',
];
const WALLETS = [
  { id: 'telebirr', label: 'telebirr',  bg: '#0a7d3e' },
  { id: 'cbebirr',  label: 'CBE Birr',  bg: '#7b2d8e' },
  { id: 'awash',    label: 'awash',     bg: '#e2231a' },
  { id: 'boa',      label: 'Abyssinia', bg: '#f39200' },
];
const PLANS = [
  {
    id: 'starter', monthly: 500, colorClass: 'text-forest',
    featureKeys: ['f_s1', 'f_s2', 'f_s3', 'f_s4'],
  },
  {
    id: 'growth', monthly: 1200, colorClass: 'text-gold-dark', popular: true,
    featureKeys: ['f_g1', 'f_g2', 'f_g3', 'f_g4', 'f_g5'],
  },
  {
    id: 'pro', monthly: 3000, colorClass: 'text-crimson',
    featureKeys: ['f_p1', 'f_p2', 'f_p3', 'f_p4', 'f_p5'],
  },
];
const PLAN_NAMES = { starter: 'planStarter', growth: 'planGrowth', pro: 'planPro' };

// Inline SVGs (Lucide shapes) — no icon library required.
const Icon = {
  building: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M6 12H4a2 2 0 0 0-2 2v8h20v-8a2 2 0 0 0-2-2h-2"/><rect x="10" y="6" width="4" height="4"/>
    </svg>
  ),
  store: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  badge: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="9" y1="15" x2="15" y2="9"/><circle cx="9.5" cy="9.5" r="0.5" fill="currentColor"/><circle cx="14.5" cy="14.5" r="0.5" fill="currentColor"/>
    </svg>
  ),
  wallet: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/>
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  checkCircle: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  clock: (
    <svg className="w-11 h-11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  loader: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  ),
  arrowLeft: (
    <svg className="w-4 h-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  arrowRight: (
    <svg className="w-4 h-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  send: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  shield: (
    <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  upload: (
    <svg className="w-6 h-6 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  ),
  image: (
    <svg className="w-6 h-6 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  dashboard: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
};

const STEP_DEFS = [
  { n: 1, labelKey: 'businessStep', icon: Icon.building },
  { n: 2, labelKey: 'storeStep',    icon: Icon.store    },
  { n: 3, labelKey: 'planStep',     icon: Icon.badge    },
  { n: 4, labelKey: 'paymentStep',  icon: Icon.wallet   },
];

// Shared field label style
const LBL = 'block text-xs font-semibold text-ink/60 mb-1.5';
// Shared input style
const INP = 'w-full px-3.5 py-3 rounded-xl ring-1 ring-black/10 bg-cream/40 outline-none focus:ring-2 focus:ring-forest';
// Shared select style
const SEL = 'w-full px-3.5 py-3 rounded-xl ring-1 ring-black/10 bg-cream/40 outline-none focus:ring-2 focus:ring-forest';
// Panel card style
const PANEL = 'bg-white rounded-3xl ring-1 ring-black/5 shadow-soft p-5 md:p-6';

export default function VendorRegister() {
  const { t } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep]           = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [otpStep, setOtpStep]     = useState(false);
  const [otp, setOtp]             = useState('');
  const [resend, setResend]       = useState(0);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  // Resend countdown
  useEffect(() => {
    if (resend <= 0) return;
    const id = setTimeout(() => setResend((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [resend]);

  const [form, setForm] = useState({
    // Step 1 — API-submitted
    name: '', email: '', phone: '', password: '', businessName: '', tin: '',
    // Step 1 — display only
    businessType: BIZ_TYPES[0], region: REGIONS[0],
    // Step 2 — API-submitted
    storeName: '',
    // Step 2 — display only
    category: CATEGORIES[0], description: '',
    // Step 3 — display only
    plan: 'growth', cycle: 'monthly',
    // Step 4 — display only
    wallet: 'telebirr', agree: false,
  });

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const selPlan   = PLANS.find((p) => p.id === form.plan) || PLANS[1];
  const planPrice = (p) => (form.cycle === 'annual' ? p.monthly * 10 : p.monthly);
  const dueNow    = planPrice(selPlan);

  const canNext =
    step === 1 ? Boolean(form.name.trim() && form.email.trim() && form.phone.trim() && form.password.trim() && form.businessName.trim() && form.tin.trim())
    : step === 2 ? Boolean(form.storeName.trim())
    : step === 3 ? true
    : form.agree;

  const next = () => { if (step < 4 && canNext) { setStep((s) => s + 1); window.scrollTo({ top: 0 }); } };
  const prev = () => { if (step > 1) setStep((s) => s - 1); };
  const goto = (s) => { if (s < step) setStep(s); };

  // ── Step 1: initiate — POST /auth/register-vendor/initiate ──────────────
  const handleInitiate = async () => {
    if (!form.agree || loading) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register-vendor/initiate', { phone: '+251' + form.phone });
      setOtpStep(true);
      setOtp('');
      setResend(60);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err.response?.data?.error?.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify + complete ─────────────────────────────────────────────
  const handleVerify = async () => {
    if (otp.length < 6 || loading) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register-vendor/verify', { phone: '+251' + form.phone, code: otp });
      const body = {
        phone: '+251' + form.phone,
        name: form.name,
        password: form.password,
        storeName: form.storeName,
        kyc: {
          businessName: form.businessName,
          docType: 'TIN Certificate',
          docNumber: form.tin,
          docUrl: '',
        },
      };
      if (form.email.trim()) body.email = form.email.trim();
      const { data } = await api.post('/auth/register-vendor/complete', body);
      setAuth({ user: data.user, token: data.token });
      setOtpStep(false);
      setSubmitted(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err.response?.data?.error?.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // ── Resend — POST /auth/register-vendor/resend-otp ───────────────────────
  const handleResend = async () => {
    if (resend > 0 || loading) return;
    setError('');
    try {
      await api.post('/auth/register-vendor/resend-otp', { phone: '+251' + form.phone });
      setResend(60);
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.error?.message ?? t('common.error'));
    }
  };

  // ── Submitted / pending approval ─────────────────────────────────────────
  if (submitted) {
    const timeline = [
      { key: 'tl1', done: true,  active: false },
      { key: 'tl2', done: false, active: true  },
      { key: 'tl3', done: false, active: false },
      { key: 'tl4', done: false, active: false },
    ];
    return (
      <section className="max-w-xl mx-auto px-4 py-12 text-center">
        <span className="inline-grid place-items-center w-20 h-20 rounded-full bg-gold/15 text-gold-dark mb-4">
          {Icon.clock}
        </span>
        <h1 className="text-2xl font-extrabold">{t('vendor.register.pendingTitle')}</h1>
        <p className="text-ink/60 mt-2">{t('vendor.register.pendingNote')}</p>

        <div className="mt-8 text-start bg-white rounded-3xl ring-1 ring-black/5 shadow-soft p-5">
          {timeline.map((tl) => (
            <div key={tl.key} className="flex items-center gap-3 py-2">
              <span
                className={`grid place-items-center w-8 h-8 rounded-full shrink-0 ${
                  tl.done ? 'bg-forest text-white' : tl.active ? 'bg-gold text-ink' : 'bg-black/10 text-ink/40'
                }`}
              >
                {tl.done ? Icon.check : tl.active ? Icon.loader : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/></svg>
                )}
              </span>
              <span className={`text-sm font-medium ${tl.done || tl.active ? '' : 'text-ink/40'}`}>
                {t(`vendor.register.${tl.key}`)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
          <Link
            to="/vendor"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-forest text-white font-bold shadow-glow"
          >
            {Icon.dashboard}
            {t('vendor.register.previewDashboard')}
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl ring-1 ring-black/10 font-semibold hover:bg-black/5 transition"
          >
            {t('common.backToSite')}
          </Link>
        </div>
      </section>
    );
  }

  // ── OTP verification screen ──────────────────────────────────────────────
  if (otpStep) {
    return (
      <section className="max-w-md mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-extrabold">{t('auth.verifyPhone')}</h1>
        <p className="text-ink/60 mt-2">
          {t('auth.otpSentTo')}{' '}
          <span className="font-semibold">+251{form.phone}</span>
        </p>
        <div className="mt-6 bg-white rounded-3xl ring-1 ring-black/5 shadow-soft p-6 text-start">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            aria-label={t('auth.verifyPhone')}
            className="w-full text-center text-3xl font-bold tracking-[0.5em] px-4 py-4 rounded-xl ring-1 ring-black/10 bg-cream/40 outline-none focus:ring-2 focus:ring-forest"
          />
          {error && (
            <p className="text-sm text-crimson font-medium mt-3" role="alert">{error}</p>
          )}
          <button
            onClick={handleVerify}
            disabled={otp.length < 6 || loading}
            className={`w-full mt-4 h-12 rounded-2xl bg-forest text-white font-bold shadow-glow transition ${
              otp.length < 6 || loading ? 'opacity-40 cursor-not-allowed' : 'hover:bg-forest-dark'
            }`}
          >
            {loading ? t('common.loading') : t('auth.verifyBtn')}
          </button>
          <div className="mt-3 text-center text-sm text-ink/60">
            {resend > 0 ? (
              <span>{t('auth.resendIn')} {resend}s</span>
            ) : (
              <button onClick={handleResend} className="text-forest font-semibold hover:underline">
                {t('auth.resendCode')}
              </button>
            )}
          </div>
          <div className="mt-2 text-center">
            <button
              onClick={() => { setOtpStep(false); setOtp(''); setError(''); }}
              className="text-sm text-ink/50 hover:text-ink transition"
            >
              {t('auth.back')}
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <section className="max-w-6xl mx-auto px-4 pt-5 pb-32 md:pb-10">
      {/* Page heading */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold">{t('vendor.register.title')}</h1>
        <p className="text-ink/60 mt-1">{t('vendor.register.subtitle')}</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 md:gap-3 mb-6 flex-wrap">
        {STEP_DEFS.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => goto(s.n)}
              className={`flex items-center gap-2 ${s.n <= step ? '' : 'opacity-50'}`}
            >
              <span
                className={`grid place-items-center w-9 h-9 rounded-full text-sm transition ${
                  s.n < step
                    ? 'bg-forest text-white'
                    : s.n === step
                    ? 'bg-forest text-white ring-4 ring-forest/20'
                    : 'bg-black/10 text-ink/50'
                }`}
              >
                {s.n < step ? Icon.check : s.icon}
              </span>
              <span
                className={`hidden sm:block text-sm font-semibold ${
                  s.n === step ? 'text-forest' : 'text-ink/60'
                }`}
              >
                {t(`vendor.register.${s.labelKey}`)}
              </span>
            </button>
            {i < STEP_DEFS.length - 1 && (
              <span className={`w-5 md:w-10 h-0.5 rounded ${s.n < step ? 'bg-forest' : 'bg-black/10'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Two-column layout: form + summary sidebar */}
      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 items-start">
        <div>
          {/* ── STEP 1: Business ── */}
          {step === 1 && (
            <div className={PANEL}>
              <h2 className="font-extrabold text-lg mb-4 flex items-center gap-2 text-forest">
                {Icon.building}
                <span className="text-ink">{t('vendor.register.businessInfo')}</span>
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>{t('auth.businessName')}</label>
                  <input type="text" value={form.businessName} onChange={set('businessName')} placeholder="Addis Tech Trading" className={INP} />
                </div>
                <div>
                  <label className={LBL}>{t('vendor.register.ownerName')}</label>
                  <input type="text" value={form.name} onChange={set('name')} placeholder="Abebe Kebede" className={INP} />
                </div>
                {/* Phone with +251 prefix */}
                <div>
                  <label className={LBL}>{t('auth.phone')}</label>
                  <div className="flex rounded-xl ring-1 ring-black/10 focus-within:ring-2 focus-within:ring-forest bg-cream/40 overflow-hidden">
                    <span className="grid place-items-center px-3 text-sm text-ink/60 border-e border-black/10 shrink-0">+251</span>
                    <input type="tel" value={form.phone} onChange={set('phone')} placeholder="911 234 567" className="flex-1 px-3 py-3 bg-transparent outline-none" />
                  </div>
                </div>
                <div>
                  <label className={LBL}>{t('auth.email')}</label>
                  <input type="email" value={form.email} onChange={set('email')} placeholder="store@example.com" className={INP} />
                </div>
                {/* Password — required by API, not in mockup */}
                <div className="sm:col-span-2">
                  <label className={LBL}>{t('vendor.register.password')}</label>
                  <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" autoComplete="new-password" className={INP} />
                </div>
                {/* Display-only */}
                <div>
                  <label className={LBL}>{t('vendor.register.businessType')}</label>
                  <select value={form.businessType} onChange={set('businessType')} className={SEL}>
                    {BIZ_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LBL}>{t('vendor.register.tin')}</label>
                  <input type="text" value={form.tin} onChange={set('tin')} placeholder="0012345678" className={INP} />
                </div>
                <div className="sm:col-span-2">
                  <label className={LBL}>{t('vendor.register.region')}</label>
                  <select value={form.region} onChange={set('region')} className={SEL}>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-start gap-2 mt-4 text-xs text-ink/50">
                {Icon.info}
                <span>{t('vendor.register.kycNote')}</span>
              </div>
            </div>
          )}

          {/* ── STEP 2: Store ── */}
          {step === 2 && (
            <div className={PANEL}>
              <h2 className="font-extrabold text-lg mb-4 flex items-center gap-2">
                <span className="text-forest">{Icon.store}</span>
                {t('vendor.register.storeSetup')}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>{t('auth.storeName')}</label>
                  <input type="text" value={form.storeName} onChange={set('storeName')} placeholder="Addis Tech" className={INP} />
                </div>
                <div>
                  <label className={LBL}>{t('vendor.register.category')}</label>
                  <select value={form.category} onChange={set('category')} className={SEL}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={LBL}>{t('vendor.register.storeDesc')}</label>
                  <textarea
                    value={form.description}
                    onChange={set('description')}
                    rows={3}
                    placeholder={t('vendor.register.storeDescPh')}
                    className={`${INP} resize-none`}
                  />
                </div>
              </div>
              {/* Upload zones — display only; file upload is a future story */}
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className={LBL}>{t('vendor.register.storeLogo')}</label>
                  <div className="grid place-items-center h-28 rounded-xl border-2 border-dashed border-black/15 text-ink/40 cursor-pointer hover:border-forest/50 transition">
                    <div className="text-center">
                      {Icon.upload}
                      <span className="text-xs block mt-1">{t('vendor.register.uploadLogo')}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className={LBL}>{t('vendor.register.coverBanner')}</label>
                  <div className="grid place-items-center h-28 rounded-xl border-2 border-dashed border-black/15 text-ink/40 cursor-pointer hover:border-forest/50 transition">
                    <div className="text-center">
                      {Icon.image}
                      <span className="text-xs block mt-1">{t('vendor.register.uploadBanner')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Plan (display only) ── */}
          {step === 3 && (
            <div>
              {/* Monthly / Annual toggle */}
              <div className="flex items-center justify-center gap-2 mb-5">
                <button
                  onClick={() => setForm((f) => ({ ...f, cycle: 'monthly' }))}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${form.cycle === 'monthly' ? 'bg-forest text-white' : 'bg-black/5'}`}
                >
                  {t('vendor.register.monthly')}
                </button>
                <button
                  onClick={() => setForm((f) => ({ ...f, cycle: 'annual' }))}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition ${form.cycle === 'annual' ? 'bg-forest text-white' : 'bg-black/5'}`}
                >
                  {t('vendor.register.annual')}
                  <span className="px-1.5 py-0.5 rounded bg-gold text-ink text-[10px] font-bold">
                    {t('vendor.register.annualBadge')}
                  </span>
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {PLANS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setForm((f) => ({ ...f, plan: p.id }))}
                    className={`relative text-start rounded-3xl shadow-soft p-5 transition hover:shadow-card ${
                      form.plan === p.id ? 'ring-2 ring-forest bg-white' : 'ring-1 ring-black/10 bg-white'
                    }`}
                  >
                    {p.popular && (
                      <span className="absolute -top-2.5 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 px-3 py-0.5 rounded-full bg-gold text-ink text-[11px] font-bold">
                        {t('vendor.register.mostPopular')}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <h3 className={`font-extrabold text-lg ${p.colorClass}`}>
                        {t(`vendor.register.${PLAN_NAMES[p.id]}`)}
                      </h3>
                      <span className={`grid place-items-center w-6 h-6 rounded-full border-2 ${form.plan === p.id ? 'border-forest' : 'border-black/20'}`}>
                        {form.plan === p.id && <span className="w-3 h-3 rounded-full bg-forest" />}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-extrabold">ETB {Number(planPrice(p)).toLocaleString()}</span>
                      <span className="text-sm text-ink/50">
                        {form.cycle === 'annual' ? t('vendor.register.perYear') : t('vendor.register.perMonth')}
                      </span>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {p.featureKeys.map((fk) => (
                        <li key={fk} className="flex items-start gap-2 text-sm">
                          <span className="text-forest mt-0.5 shrink-0">{Icon.check}</span>
                          {t(`vendor.register.${fk}`)}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 4: Payment (display only) ── */}
          {step === 4 && (
            <div className={PANEL}>
              <h2 className="font-extrabold text-lg mb-1 flex items-center gap-2">
                <span className="text-forest">{Icon.wallet}</span>
                {t('vendor.register.paymentTitle')}
              </h2>
              <p className="text-sm text-ink/60 mb-4">
                {t(`vendor.register.${PLAN_NAMES[selPlan.id]}`)} · ETB {Number(dueNow).toLocaleString()} ·{' '}
                {form.cycle === 'annual' ? t('vendor.register.annual') : t('vendor.register.monthly')}
              </p>

              <p className="text-xs font-semibold text-ink/60 mb-2">{t('vendor.register.payVia')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {WALLETS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setForm((f) => ({ ...f, wallet: w.id }))}
                    className={`relative flex items-center justify-center h-16 rounded-2xl bg-white transition ${
                      form.wallet === w.id ? 'ring-2 ring-forest bg-forest/5' : 'ring-1 ring-black/10'
                    }`}
                  >
                    <span className="grid place-items-center h-8 px-2 rounded-md" style={{ background: w.bg }}>
                      <span className="text-white font-extrabold text-sm lowercase">{w.label}</span>
                    </span>
                    {form.wallet === w.id && (
                      <span className="absolute top-1.5 end-1.5 text-forest">{Icon.checkCircle}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-start gap-2 mt-4 p-3 rounded-xl bg-gold/10 text-sm text-gold-dark">
                {Icon.shield}
                <span>{t('vendor.register.paymentNote')}</span>
              </div>

              <label className="flex items-start gap-2.5 mt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={set('agree')}
                  className="w-4 h-4 mt-0.5 rounded accent-forest shrink-0"
                />
                <span className="text-sm text-ink/70">{t('vendor.register.agreeTerms')}</span>
              </label>

              {error && (
                <p className="text-sm text-crimson font-medium mt-3" role="alert">{error}</p>
              )}
            </div>
          )}

          {/* Desktop nav buttons */}
          <div className="hidden md:flex items-center justify-between mt-5">
            {step > 1 ? (
              <button
                onClick={prev}
                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl ring-1 ring-black/10 font-semibold hover:bg-black/5 transition"
              >
                {Icon.arrowLeft}
                {t('auth.back')}
              </button>
            ) : <span />}

            {step < 4 ? (
              <button
                onClick={next}
                disabled={!canNext}
                className={`inline-flex items-center gap-1.5 px-6 py-3 rounded-2xl bg-forest text-white font-bold shadow-glow transition ${!canNext ? 'opacity-40 cursor-not-allowed' : 'hover:bg-forest-dark'}`}
              >
                {t('vendor.register.continueBtn')}
                {Icon.arrowRight}
              </button>
            ) : (
              <button
                onClick={handleInitiate}
                disabled={!form.agree || loading}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gold hover:bg-gold-light text-ink font-bold shadow-glow transition ${(!form.agree || loading) ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {Icon.send}
                {loading ? t('common.loading') : t('auth.submitVendor')}
              </button>
            )}
          </div>
        </div>

        {/* Summary sidebar */}
        <aside className="mt-5 lg:mt-0 lg:sticky lg:top-24">
          <div className={PANEL}>
            <h2 className="font-extrabold mb-3">{t('vendor.register.summarySidebar')}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink/60">{t('vendor.register.planStep')}</span>
                <span className="font-semibold">{t(`vendor.register.${PLAN_NAMES[selPlan.id]}`)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">{t('vendor.register.summaryBilling')}</span>
                <span className="font-semibold">
                  {form.cycle === 'annual' ? t('vendor.register.annual') : t('vendor.register.monthly')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">{t('vendor.register.summaryFees')}</span>
                <span className="font-semibold text-forest">{t('vendor.register.summaryNoFees')}</span>
              </div>
            </div>
            <div className="flex justify-between items-baseline mt-3 pt-3 border-t border-black/5">
              <span className="font-bold">{t('vendor.register.summaryDue')}</span>
              <span className="text-2xl font-extrabold text-forest">
                ETB {Number(dueNow).toLocaleString()}
              </span>
            </div>
            <div className="mt-4 space-y-2 text-xs text-ink/60">
              {['trust1', 'trust2', 'trust3'].map((k) => (
                <p key={k} className="flex items-center gap-1.5">
                  <span className="text-forest shrink-0">{Icon.checkCircle}</span>
                  {t(`vendor.register.${k}`)}
                </p>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile sticky action bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-black/5 shadow-[0_-4px_20px_-6px_rgba(0,0,0,0.15)] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex flex-col leading-none">
            <span className="text-[11px] text-ink/50">{t('auth.step')}</span>
            <span className="text-sm font-extrabold">{step} / 4</span>
          </div>
          {step < 4 ? (
            <button
              onClick={next}
              disabled={!canNext}
              className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-forest text-white font-bold transition active:scale-95 ${!canNext ? 'opacity-40' : ''}`}
            >
              {t('vendor.register.continueBtn')}
              {Icon.arrowRight}
            </button>
          ) : (
            <button
              onClick={handleInitiate}
              disabled={!form.agree || loading}
              className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-gold text-ink font-bold transition active:scale-95 ${(!form.agree || loading) ? 'opacity-40' : ''}`}
            >
              {Icon.send}
              {loading ? t('common.loading') : t('auth.submitVendor')}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
