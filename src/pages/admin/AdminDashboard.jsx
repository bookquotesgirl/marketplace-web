import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart3, Repeat, Store, UserCheck,
  ShoppingBag, Users, Receipt, Undo2, TrendingUp, ArrowRight,
} from 'lucide-react';
import { Spinner } from '../../components/ui';
import api from '../../lib/api';

// ---------------------------------------------------------------------------
// Glassmorphism card — consistent with all other admin pages
// ---------------------------------------------------------------------------
function GlassCard({ className = '', children }) {
  return (
    <div
      className={`rounded-[1.75rem] bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] [backdrop-filter:blur(28px)_saturate(180%)] border border-white/70 dark:border-white/10 shadow-[0_8px_28px_-8px_rgba(30,50,90,.10)] ${className}`}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG area chart — built from growthOverTime data; no external library.
// ---------------------------------------------------------------------------
function GrowthChart({ data, t }) {
  // 0 points
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm text-center px-4">
        <TrendingUp className="w-8 h-8 mb-2 opacity-30" />
        <p>{t('admin.dashboard.growthEmpty')}</p>
      </div>
    );
  }

  // 1 point — show centered dot + value labels instead of a degenerate line
  if (data.length === 1) {
    const d = data[0];
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-[11px] text-slate-400 mb-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" aria-hidden="true" />
              {t('admin.dashboard.chartRevenue')}
            </p>
            <p className="text-xl font-extrabold tracking-tight">
              ETB {Number(d.revenue).toLocaleString()}
            </p>
          </div>
          {d.orders !== undefined && (
            <div className="text-center">
              <p className="text-[11px] text-slate-400 mb-1 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0" aria-hidden="true" />
                {t('admin.dashboard.chartOrders')}
              </p>
              <p className="text-xl font-extrabold tracking-tight">
                {Number(d.orders).toLocaleString()}
              </p>
            </div>
          )}
        </div>
        <p className="text-[11px] text-slate-400">
          {t('admin.dashboard.growthSingle').replace('{month}', d.month)}
        </p>
      </div>
    );
  }

  // 2+ points — SVG area chart
  const W = 760;
  const H = 180;
  const PX = 4;
  const PY = 16;
  const n = data.length;

  const maxRev = Math.max(...data.map((d) => d.revenue), 1);
  const maxOrd = Math.max(...data.map((d) => d.orders ?? 0), 1);

  const xAt = (i) => PX + (i / (n - 1)) * (W - 2 * PX);
  const yRev = (v) => H - PY - (v / maxRev) * (H - 2 * PY);
  const yOrd = (v) => H - PY - (v / maxOrd) * (H - 2 * PY);

  const revPts = data.map((d, i) => `${xAt(i)},${yRev(d.revenue)}`).join(' ');
  const ordPts = data.map((d, i) => `${xAt(i)},${yOrd(d.orders ?? 0)}`).join(' ');

  const revArea = `${xAt(0)},${H} ${revPts} ${xAt(n - 1)},${H}`;
  const ordArea = `${xAt(0)},${H} ${ordPts} ${xAt(n - 1)},${H}`;

  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full mt-2"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ag-rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2563eb" stopOpacity="0.28" />
            <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ag-ord" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#38bdf8" stopOpacity="0.20" />
            <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={revArea} fill="url(#ag-rev)" />
        <polyline
          points={revPts}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon points={ordArea} fill="url(#ag-ord)" />
        <polyline
          points={ordPts}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* Month labels */}
      <div
        className="flex justify-between text-[10px] text-slate-400 mt-1 px-1"
        aria-hidden="true"
      >
        {data.map((d) => (
          <span key={d.month}>{d.month}</span>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function AdminDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get('/admin/analytics')
      .then(({ data: d }) => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-center py-16 text-crimson" role="alert">
        {t('common.error')}
      </p>
    );
  }

  const kpis = [
    {
      label: t('admin.dashboard.gmv'),
      value: `ETB ${Number(data.revenue ?? 0).toLocaleString()}`,
      Icon: BarChart3,
      color: 'bg-blue-500/12 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    },
    {
      label: t('admin.dashboard.orders'),
      value: Number(data.ordersCount ?? 0).toLocaleString(),
      Icon: ShoppingBag,
      color: 'bg-blue-500/12 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    },
    {
      label: t('admin.dashboard.mrr'),
      value: `ETB ${Number(data.subscriptionMrr ?? 0).toLocaleString()}`,
      Icon: Repeat,
      color: 'bg-blue-500/12 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    },
    {
      label: t('admin.dashboard.aov'),
      value: `ETB ${Number(data.avgOrderValue ?? 0).toLocaleString()}`,
      Icon: Receipt,
      color: 'bg-blue-500/12 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    },
    {
      label: t('admin.dashboard.vendors'),
      value: Number(data.activeVendors ?? 0).toLocaleString(),
      Icon: Store,
      color: 'bg-blue-500/12 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    },
    {
      label: t('admin.dashboard.customers'),
      value: Number(data.customersCount ?? 0).toLocaleString(),
      Icon: Users,
      color: 'bg-blue-500/12 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    },
    {
      label: t('admin.dashboard.approvals'),
      value: data.pendingApprovals ?? 0,
      Icon: UserCheck,
      highlight: (data.pendingApprovals ?? 0) > 0,
      color:
        (data.pendingApprovals ?? 0) > 0
          ? 'bg-amber-500/12 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
          : 'bg-blue-500/12 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
      cta:
        (data.pendingApprovals ?? 0) > 0
          ? { label: t('admin.dashboard.viewApprovals'), to: '/admin/approvals' }
          : null,
    },
    {
      label: t('admin.dashboard.refunds'),
      value: `${Math.round((data.refundRate ?? 0) * 100)}%`,
      Icon: Undo2,
      color: 'bg-blue-500/12 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    },
  ];

  const growthData = data.growthOverTime ?? [];
  const topVendors = data.topVendors ?? [];

  return (
    <div className="space-y-5">
      {/* KPI grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, highlight, Icon, color, cta }) => (
          <div
            key={label}
            className="rounded-[1.5rem] p-4 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] [backdrop-filter:blur(28px)_saturate(180%)] border border-white/70 dark:border-white/10 shadow-[0_8px_28px_-8px_rgba(30,50,90,.10)] flex flex-col"
          >
            <span className={`grid place-items-center w-10 h-10 rounded-2xl shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </span>
            <div
              className={`text-2xl font-extrabold mt-3 tracking-tight ${
                highlight ? 'text-amber-500 dark:text-amber-400' : ''
              }`}
            >
              {value}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex-1">{label}</div>
            {cta && (
              <Link
                to={cta.to}
                className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                {cta.label}
                <ArrowRight className="w-3 h-3 rtl:rotate-180" />
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Revenue / growth chart */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <p className="font-bold">{t('admin.dashboard.growth')}</p>
          {growthData.length > 1 && (
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" aria-hidden="true" />
                {t('admin.dashboard.chartRevenue')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0" aria-hidden="true" />
                {t('admin.dashboard.chartOrders')}
              </span>
            </div>
          )}
        </div>
        <GrowthChart data={growthData} t={t} />
      </GlassCard>

      {/* Top vendors */}
      <GlassCard className="p-5">
        <p className="font-bold mb-4">{t('admin.dashboard.topVendors')}</p>
        {topVendors.length === 0 ? (
          <p className="text-center py-8 text-slate-400 text-sm">
            {t('admin.dashboard.noVendors')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="text-slate-400 text-[11px] uppercase tracking-wide border-b border-black/[0.06] dark:border-white/10">
                  <th className="text-start py-2 pe-4 font-semibold">{t('admin.dashboard.store')}</th>
                  <th className="text-start py-2 pe-4 font-semibold">{t('admin.dashboard.colOrders')}</th>
                  <th className="text-start py-2 font-semibold">{t('admin.dashboard.colSales')}</th>
                </tr>
              </thead>
              <tbody>
                {topVendors.map((v) => (
                  <tr
                    key={String(v.vendorId ?? v._id)}
                    className="border-b border-black/[0.04] dark:border-white/[0.06] last:border-0 hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition"
                  >
                    <td className="py-2.5 pe-4">
                      <div className="flex items-center gap-2.5">
                        <span className="grid place-items-center w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-extrabold shrink-0 select-none">
                          {(v.storeName ?? '?')[0].toUpperCase()}
                        </span>
                        <span className="font-medium truncate max-w-[140px]">{v.storeName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pe-4 text-slate-500 tabular-nums">
                      {Number(v.orders ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 font-semibold tabular-nums">
                      ETB {Number(v.sales ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
