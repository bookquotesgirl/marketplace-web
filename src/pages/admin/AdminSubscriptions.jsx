import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Repeat, Users, TrendingUp, UserMinus,
  Search, Check, Store, CheckCircle2, XCircle,
} from 'lucide-react';
import api from '../../lib/api';
import { Spinner, Toast } from '../../components/ui';

// ── helpers ──────────────────────────────────────────────────────────────────

const PLAN_COLORS = ['#38bdf8', '#2563eb', '#818cf8'];

const SUB_STATUS_CLS = {
  active:     'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  'past due': 'bg-amber-500/12 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  cancelled:  'bg-slate-400/15 text-slate-500 dark:bg-white/10 dark:text-slate-400',
};

function subStatusCls(status) {
  return SUB_STATUS_CLS[status?.toLowerCase()] ?? SUB_STATUS_CLS.active;
}

// Normalise the GET /api/admin/plans response — handles:
//   bare array         → res.data = [...]
//   { data: [...] }    → res.data.data = [...]
//   { items: [...] }   → res.data.items = [...]
//   { plans: [...] }   → res.data.plans = [...]
function extractPlans(res) {
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.data))  return d.data;
  if (Array.isArray(d.items)) return d.items;
  if (Array.isArray(d.plans)) return d.plans;
  return [];
}

// Extract the plan id regardless of whether the field is `id` or `_id`
function planId(p) { return String(p.id ?? p._id); }

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminSubscriptions() {
  const { t } = useTranslation();

  const [plans, setPlans]           = useState([]);
  // editPrices holds string values so the <input> stays responsive while typing
  const [editPrices, setEditPrices] = useState({});  // { planId: string }
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [toast, setToast]           = useState(null);

  // Vendor subscriptions: no GET endpoint in API contract — stays empty
  const [subs]                    = useState([]);
  const [search, setSearch]       = useState('');
  const [fstatus, setFstatus]     = useState('all');

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  // Load plans from GET /api/admin/plans
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res  = await api.get('/admin/plans');
        const list = extractPlans(res);
        setPlans(list);
        // Seed edit prices as strings (keep as string while user types)
        const prices = {};
        list.forEach((p) => { prices[planId(p)] = String(p.price ?? 0); });
        setEditPrices(prices);
      } catch (err) {
        const msg = err.response?.data?.error?.message ?? err.response?.data?.message ?? t('common.error');
        setToast(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t]);

  // Derived metrics — only meaningful when the API returns subscriber counts
  const totalSubs = plans.reduce((s, p) => s + (p.subscriberCount ?? p.subscribers ?? 0), 0);
  const mrr       = plans.reduce((s, p) => s + (Number(p.price ?? 0) * (p.subscriberCount ?? p.subscribers ?? 0)), 0);
  const avg       = totalSubs > 0 ? Math.round(mrr / totalSubs) : 0;

  // Revenue share per plan (based on current edited prices, not the stored price)
  const totalRevenue = plans.reduce((s, p) => {
    const pid = planId(p);
    return s + (Number(editPrices[pid] ?? p.price ?? 0) * (p.subscriberCount ?? p.subscribers ?? 0));
  }, 0);

  const pctOf = (p) => {
    if (!totalRevenue) return 0;
    const pid = planId(p);
    return Math.round((Number(editPrices[pid] ?? p.price ?? 0) * (p.subscriberCount ?? p.subscribers ?? 0)) / totalRevenue * 100);
  };

  // Save plan pricing — only PATCHes plans whose price actually changed
  const handleSave = async () => {
    setSaving(true);
    try {
      const patches = plans
        .filter((p) => {
          const pid      = planId(p);
          const newPrice = Number(editPrices[pid] ?? p.price);
          return newPrice !== Number(p.price);
        })
        .map(async (p) => {
          const pid      = planId(p);
          const newPrice = Number(editPrices[pid] ?? p.price);
          const res = await api.patch(`/admin/plans/${pid}`, { price: newPrice });
          // Normalise the PATCH response — could be the updated plan or an envelope
          const updated = res.data?.plan ?? res.data?.data ?? res.data;
          return { pid, newPrice: Number(updated?.price ?? newPrice) };
        });

      const results = await Promise.all(patches);

      // Update local state immediately from PATCH responses — no page refresh
      setPlans((prev) =>
        prev.map((p) => {
          const pid    = planId(p);
          const result = results.find((r) => r.pid === pid);
          return result ? { ...p, price: result.newPrice } : p;
        })
      );
      // Sync edit prices to confirmed server values
      setEditPrices((prev) => {
        const next = { ...prev };
        results.forEach(({ pid, newPrice }) => { next[pid] = String(newPrice); });
        return next;
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    } catch (err) {
      // Do not show success on error
      const msg = err.response?.data?.error?.message ?? err.response?.data?.message ?? t('admin.subscriptions.actionError');
      setToast(msg);
    } finally {
      setSaving(false);
    }
  };

  const filteredSubs = subs.filter((s) => {
    const matchStatus = fstatus === 'all' || s.status?.toLowerCase() === fstatus.toLowerCase();
    const matchSearch = !search || s.vendor?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-5">
      <Toast show={!!toast}>{toast}</Toast>

      {/* ── Stat chips ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-[1.5rem] p-4 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)]">
          <span className="grid place-items-center w-9 h-9 rounded-2xl bg-blue-500/12 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <Repeat className="w-[18px] h-[18px]" />
          </span>
          <div className="text-2xl font-extrabold mt-3">
            {loading ? '—' : `ETB ${mrr.toLocaleString()}`}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{t('admin.subscriptions.chipMrr')}</div>
        </div>
        <div className="rounded-[1.5rem] p-4 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)]">
          <span className="grid place-items-center w-9 h-9 rounded-2xl bg-blue-500/12 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <Users className="w-[18px] h-[18px]" />
          </span>
          <div className="text-2xl font-extrabold mt-3">
            {loading ? '—' : totalSubs.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{t('admin.subscriptions.chipActive')}</div>
        </div>
        <div className="rounded-[1.5rem] p-4 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)]">
          <span className="grid place-items-center w-9 h-9 rounded-2xl bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <TrendingUp className="w-[18px] h-[18px]" />
          </span>
          <div className="text-2xl font-extrabold mt-3">
            {loading ? '—' : `ETB ${avg.toLocaleString()}`}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{t('admin.subscriptions.chipAvg')}</div>
        </div>
        <div className="rounded-[1.5rem] p-4 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)]">
          <span className="grid place-items-center w-9 h-9 rounded-2xl bg-rose-500/12 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
            <UserMinus className="w-[18px] h-[18px]" />
          </span>
          <div className="text-2xl font-extrabold mt-3">—</div>
          <div className="text-xs text-slate-500 mt-0.5">{t('admin.subscriptions.chipChurn')}</div>
        </div>
      </div>

      {/* ── Plan cards ── */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : plans.length > 0 ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((p, idx) => {
              const pid       = planId(p);
              const color     = p.color ?? PLAN_COLORS[idx % PLAN_COLORS.length];
              const subs      = p.subscriberCount ?? p.subscribers ?? 0;
              const pct       = pctOf(p);
              const editPrice = editPrices[pid] ?? String(p.price ?? 0);
              const isActive  = p.active !== false; // treat missing as active
              const features  = Array.isArray(p.features) ? p.features : [];
              return (
                <div
                  key={pid}
                  className="rounded-[1.75rem] p-5 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)]"
                >
                  {/* Plan header */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-lg">{p.name}</h3>
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          {t('admin.subscriptions.statusActive')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-400/15 text-slate-500 dark:bg-white/10 dark:text-slate-400 text-[10px] font-bold">
                          <XCircle className="w-3 h-3" />
                          {t('admin.subscriptions.statusCancelled')}
                        </span>
                      )}
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-end gap-2 mt-2">
                    <span className="text-2xl font-extrabold">ETB {Number(editPrice).toLocaleString()}</span>
                    <span className="text-xs text-slate-400 mb-1">{t('admin.subscriptions.perMonth')}</span>
                  </div>

                  {/* Subscriber count + progress */}
                  <div className="mt-3 text-sm text-slate-500">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{subs.toLocaleString()}</span>{' '}
                    {t('admin.subscriptions.subscribers')}
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {pct}% {t('admin.subscriptions.pctOfMrr')} · ETB{' '}
                    {(Number(editPrice) * subs).toLocaleString()}
                  </div>

                  {/* Features list */}
                  {features.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Editable price — stored as string, sent as Number on save */}
                  <div className="flex items-center gap-2 mt-4">
                    <label className="text-xs font-semibold text-slate-500 shrink-0">
                      {t('admin.subscriptions.editPrice')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editPrice}
                      onChange={(e) =>
                        setEditPrices((prev) => ({ ...prev, [pid]: e.target.value }))
                      }
                      className="w-28 px-2.5 py-1.5 rounded-lg ring-1 ring-black/10 dark:ring-white/15 bg-white/70 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save pricing button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-[0_10px_24px_-10px_rgba(37,99,235,0.8)] hover:bg-blue-700 transition disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              {saving ? t('common.loading') : t('admin.subscriptions.savePricing')}
            </button>
          </div>
        </>
      ) : null}

      {/* ── Vendor subscriptions table ── */}
      <div className="rounded-[1.75rem] bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] [backdrop-filter:blur(28px)_saturate(180%)] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)] overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <h2 className="font-bold">{t('admin.subscriptions.tableTitle')}</h2>
          <div className="flex items-center gap-2 h-10 px-3 rounded-2xl bg-white/50 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 ms-auto max-w-xs flex-1 min-w-[160px]">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.subscriptions.searchPlaceholder')}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
          </div>
          <select
            value={fstatus}
            onChange={(e) => setFstatus(e.target.value)}
            className="h-10 px-3 rounded-2xl bg-white/50 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-sm font-medium outline-none dark:text-slate-100"
          >
            <option value="all">{t('admin.subscriptions.filterAll')}</option>
            <option value="active">{t('admin.subscriptions.statusActive')}</option>
            <option value="past due">{t('admin.subscriptions.statusPastDue')}</option>
            <option value="cancelled">{t('admin.subscriptions.statusCancelled')}</option>
          </select>
        </div>

        {filteredSubs.length === 0 ? (
          <div className="text-center py-14">
            <Store className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="mt-2 font-semibold text-slate-500">{t('admin.subscriptions.noSubscriptions')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="text-slate-400 text-[11px] uppercase tracking-wide bg-white/30 dark:bg-white/[0.03]">
                <tr>
                  <th className="text-start font-semibold py-3 ps-4 pe-3">{t('admin.subscriptions.colVendor')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('admin.subscriptions.colPlan')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('admin.subscriptions.colCycle')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('admin.subscriptions.colAmount')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('admin.subscriptions.colRenewal')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('admin.subscriptions.colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubs.map((s, i) => (
                  <tr key={i} className="border-t border-black/[0.06] dark:border-white/[0.08]">
                    <td className="py-3 ps-4 pe-3">
                      <div className="flex items-center gap-2">
                        {s.logo ? (
                          <img src={s.logo} alt={s.vendor} className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <span className="grid place-items-center w-8 h-8 rounded-lg bg-blue-500/12 text-blue-600 font-extrabold text-xs">
                            {s.vendor?.[0]?.toUpperCase() ?? 'V'}
                          </span>
                        )}
                        <span className="font-semibold">{s.vendor}</span>
                      </div>
                    </td>
                    <td className="py-3 pe-3">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/12 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 text-[11px] font-bold">
                        {s.plan}
                      </span>
                    </td>
                    <td className="py-3 pe-3 text-slate-500">{s.cycle}</td>
                    <td className="py-3 pe-3 font-semibold">ETB {Number(s.amount ?? 0).toLocaleString()}</td>
                    <td className="py-3 pe-3 text-slate-500">{s.renew ?? s.nextRenewal ?? '—'}</td>
                    <td className="py-3 pe-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${subStatusCls(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Saved confirmation ── */}
      {saved && (
        <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white shadow-2xl text-sm font-semibold">
            <Check className="w-4 h-4 text-emerald-400" />
            {t('admin.subscriptions.saved')}
          </div>
        </div>
      )}
    </div>
  );
}
