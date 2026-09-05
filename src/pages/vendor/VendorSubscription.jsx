import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BadgePercent, CalendarClock, Check, CheckCircle2, Info,
} from 'lucide-react';
import api from '../../lib/api';
import { Spinner, Toast } from '../../components/ui';

// ── Helpers ───────────────────────────────────────────────────────────────────

// Normalise GET /admin/plans response shapes:
// bare array | { data: [] } | { items: [] } | { plans: [] }
function extractPlans(res) {
  const d = res.data;
  if (Array.isArray(d))           return d;
  if (Array.isArray(d.data))      return d.data;
  if (Array.isArray(d.items))     return d.items;
  if (Array.isArray(d.plans))     return d.plans;
  return [];
}

function planId(p) { return String(p.id ?? p._id ?? ''); }

// Accent colours to cycle through when the backend doesn't supply one
const ACCENT_COLORS = ['#2563eb', '#0b7a4b', '#dc2626'];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VendorSubscription() {
  const { t } = useTranslation();

  const [vendor, setVendor]   = useState(null);   // from GET /vendor/me
  const [plans, setPlans]     = useState([]);      // from GET /admin/plans
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState(null);
  const [toastVariant, setToastVariant] = useState('default');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.get('/vendor/me'),
      api.get('/admin/plans'),
    ])
      .then(([vendorRes, plansRes]) => {
        if (!cancelled) {
          // vendor/me can be bare or wrapped
          const v = vendorRes.data?.id || vendorRes.data?._id
            ? vendorRes.data
            : vendorRes.data?.vendor ?? vendorRes.data?.data ?? vendorRes.data;
          setVendor(v);
          setPlans(extractPlans(plansRes));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err.response?.data?.error?.message ?? err.response?.data?.message ?? t('common.error');
          setToast(msg);
          setToastVariant('error');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [t]);

  // Current plan info from vendor.plan (set by backend when subscription active)
  const currentPlan = vendor?.plan ?? null;

  // Identify which plan card matches the current plan by name (case-insensitive)
  const currentPlanId = plans.find(
    (p) => p.name?.toLowerCase() === currentPlan?.name?.toLowerCase()
  );

  const renewsAt = currentPlan?.renewsAt
    ? new Date(currentPlan.renewsAt).toLocaleDateString(undefined, {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : null;

  return (
    <div className="space-y-5">
      <Toast show={!!toast} variant={toastVariant} onDismiss={() => setToast(null)}>
        {toast}
      </Toast>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          {/* ── Current plan card ── */}
          {currentPlan ? (
            <div className="rounded-[1.75rem] p-5 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BadgePercent className="w-4 h-4 text-forest" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {t('vendor.subscription.currentPlan')}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold">{currentPlan.name}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    ETB {Number(currentPlan.price ?? 0).toLocaleString()}
                    <span className="text-xs"> / {t('vendor.subscription.perMonth')}</span>
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest/10 text-forest dark:bg-emerald-500/15 dark:text-emerald-400 text-xs font-bold shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('vendor.subscription.statusActive')}
                </span>
              </div>

              {renewsAt && (
                <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                  <CalendarClock className="w-4 h-4 shrink-0" />
                  <span>
                    {t('vendor.subscription.renewsOn')} <strong className="text-slate-700 dark:text-slate-200">{renewsAt}</strong>
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* No active subscription */
            <div className="rounded-[1.75rem] p-5 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)] text-center py-10">
              <BadgePercent className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="mt-2 font-semibold text-slate-500">{t('vendor.subscription.noActivePlan')}</p>
            </div>
          )}

          {/* ── Contact note ── */}
          <div className="flex items-start gap-3 rounded-2xl p-4 bg-blue-500/8 dark:bg-blue-500/12 border border-blue-500/15 dark:border-blue-400/20 text-blue-700 dark:text-blue-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-sm">{t('vendor.subscription.contactNote')}</p>
          </div>

          {/* ── Plan cards ── */}
          {plans.length > 0 && (
            <div>
              <h3 className="text-base font-extrabold mb-4">{t('vendor.subscription.plansTitle')}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map((p, idx) => {
                  const pid         = planId(p);
                  const isCurrent   = currentPlanId ? planId(currentPlanId) === pid : false;
                  const color       = p.color ?? ACCENT_COLORS[idx % ACCENT_COLORS.length];
                  const features    = Array.isArray(p.features) ? p.features : [];
                  const isActive    = p.active !== false;

                  return (
                    <div
                      key={pid}
                      className={`relative rounded-[1.75rem] p-5 backdrop-blur-[28px] border shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)] transition ${
                        isCurrent
                          ? 'bg-white/80 dark:bg-white/[0.08] border-forest/30 dark:border-emerald-500/30 ring-2 ring-forest/20 dark:ring-emerald-500/20'
                          : 'bg-white/50 dark:bg-white/[0.04] border-white/70 dark:border-white/10 opacity-80'
                      } ${!isActive ? 'opacity-50' : ''}`}
                    >
                      {/* Current badge */}
                      {isCurrent && (
                        <div className="absolute -top-3 start-5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-forest text-white text-[10px] font-bold shadow">
                            <CheckCircle2 className="w-3 h-3" />
                            {t('vendor.subscription.currentBadge')}
                          </span>
                        </div>
                      )}

                      {/* Plan header */}
                      <div className="flex items-center justify-between mt-2">
                        <h4 className="font-extrabold text-lg" style={{ color }}>{p.name}</h4>
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                      </div>

                      <div className="mt-1">
                        <span className="text-2xl font-extrabold">
                          ETB {Number(p.price ?? 0).toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 ms-1">/ {t('vendor.subscription.perMonth')}</span>
                      </div>

                      {/* Features */}
                      {features.length > 0 && (
                        <ul className="mt-4 space-y-1.5">
                          {features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <Check className="w-3.5 h-3.5 text-forest shrink-0 mt-0.5" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Disabled CTA */}
                      <div className="mt-4">
                        {isCurrent ? (
                          <div className="h-9 flex items-center justify-center rounded-2xl bg-forest/10 text-forest text-sm font-semibold">
                            <CheckCircle2 className="w-4 h-4 me-1.5" />
                            {t('vendor.subscription.currentPlanBtn')}
                          </div>
                        ) : (
                          <div
                            className="h-9 flex items-center justify-center rounded-2xl bg-black/[0.04] dark:bg-white/5 text-slate-400 text-sm font-semibold cursor-not-allowed"
                            title={t('vendor.subscription.contactNote')}
                          >
                            {t('vendor.subscription.contactBtn')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
