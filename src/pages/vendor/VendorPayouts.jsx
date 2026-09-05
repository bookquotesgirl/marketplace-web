import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Wallet, Clock, Info, Receipt } from 'lucide-react';
import api from '../../lib/api';
import { Spinner, Toast } from '../../components/ui';

// ── Payout status badge config ─────────────────────────────────────────────
const PAYOUT_STATUS = {
  paid:       'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  processing: 'bg-blue-500/12 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  pending:    'bg-amber-500/12 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
};

function payoutStatusCls(status) {
  return PAYOUT_STATUS[status?.toLowerCase()] ?? PAYOUT_STATUS.pending;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPeriod(start, end) {
  if (!start) return '—';
  const fmt = (d) =>
    new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VendorPayouts() {
  const { t } = useTranslation();

  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get('/vendor/earnings')
      .then((res) => {
        if (!cancelled) {
          // Defensive: accept bare object or { data: {...} } envelope
          const d = res.data?.totalSales !== undefined ? res.data : res.data?.data ?? res.data;
          setData(d);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err.response?.data?.error?.message ?? err.response?.data?.message ?? t('common.error');
          setToast(msg);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [t]);

  const totalSales    = data?.totalSales    ?? 0;
  const balance       = data?.balance       ?? 0;
  const pendingBalance = data?.pendingBalance ?? 0;
  const payouts       = Array.isArray(data?.payouts) ? data.payouts : [];

  return (
    <div className="space-y-5">
      <Toast show={!!toast} variant="error" onDismiss={() => setToast(null)}>
        {toast}
      </Toast>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          {/* ── Stat cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Sales */}
            <div className="rounded-[1.5rem] p-5 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)]">
              <span className="grid place-items-center w-9 h-9 rounded-2xl bg-forest/10 text-forest dark:bg-emerald-500/15 dark:text-emerald-400">
                <TrendingUp className="w-[18px] h-[18px]" />
              </span>
              <div className="text-2xl font-extrabold mt-3">
                ETB {Number(totalSales).toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{t('vendor.payouts.chipTotal')}</div>
            </div>

            {/* Available Balance */}
            <div className="rounded-[1.5rem] p-5 bg-forest text-white backdrop-blur-[28px] shadow-[0_14px_44px_-14px_rgba(11,122,75,0.45)]">
              <span className="grid place-items-center w-9 h-9 rounded-2xl bg-white/20">
                <Wallet className="w-[18px] h-[18px]" />
              </span>
              <div className="text-2xl font-extrabold mt-3">
                ETB {Number(balance).toLocaleString()}
              </div>
              <div className="text-xs text-white/70 mt-0.5">{t('vendor.payouts.chipBalance')}</div>
            </div>

            {/* Pending Clearance */}
            <div className="rounded-[1.5rem] p-5 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)]">
              <span className="grid place-items-center w-9 h-9 rounded-2xl bg-amber-500/12 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                <Clock className="w-[18px] h-[18px]" />
              </span>
              <div className="text-2xl font-extrabold mt-3">
                ETB {Number(pendingBalance).toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{t('vendor.payouts.chipPending')}</div>
            </div>
          </div>

          {/* ── Platform note ── */}
          <div className="flex items-start gap-3 rounded-2xl p-4 bg-blue-500/8 dark:bg-blue-500/12 border border-blue-500/15 dark:border-blue-400/20 text-blue-700 dark:text-blue-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-sm">{t('vendor.payouts.platformNote')}</p>
          </div>

          {/* ── Payout history table ── */}
          <div className="rounded-[1.75rem] bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] [backdrop-filter:blur(28px)_saturate(180%)] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)] overflow-hidden">
            <div className="px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <h2 className="font-bold">{t('vendor.payouts.historyTitle')}</h2>
            </div>

            {payouts.length === 0 ? (
              <div className="text-center py-14">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="mt-2 font-semibold text-slate-500">{t('vendor.payouts.noPayouts')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead className="text-slate-400 text-[11px] uppercase tracking-wide bg-white/30 dark:bg-white/[0.03]">
                    <tr>
                      <th className="text-start font-semibold py-3 ps-4 pe-3">{t('vendor.payouts.colRef')}</th>
                      <th className="text-start font-semibold py-3 pe-3">{t('vendor.payouts.colPeriod')}</th>
                      <th className="text-start font-semibold py-3 pe-3">{t('vendor.payouts.colAmount')}</th>
                      <th className="text-start font-semibold py-3 pe-3">{t('vendor.payouts.colStatus')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p, i) => {
                      const ref    = p.id ?? p._id ?? `PAY-${i + 1}`;
                      const period = formatPeriod(p.periodStart, p.periodEnd);
                      const amount = Number(p.amount ?? 0);
                      const status = (p.status ?? 'pending').toLowerCase();
                      return (
                        <tr
                          key={ref}
                          className="border-t border-black/[0.06] dark:border-white/[0.08]"
                        >
                          <td className="py-3 ps-4 pe-3 font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {String(ref).slice(-8).toUpperCase()}
                          </td>
                          <td className="py-3 pe-3 text-slate-500 text-xs">{period}</td>
                          <td className="py-3 pe-3 font-semibold">
                            ETB {amount.toLocaleString()}
                          </td>
                          <td className="py-3 pe-3">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${payoutStatusCls(status)}`}>
                              {t(`vendor.payouts.status_${status}`, { defaultValue: status })}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
