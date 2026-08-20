import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Spinner, Badge } from '../../components/ui';
import api from '../../lib/api';

// GET /api/vendor/dashboard — composed payload, see API contract §9.
export default function VendorDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get('/vendor/dashboard')
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
      label: t('vendor.dashboard.revenue'),
      value: `ETB ${Number(data.revenue30d).toLocaleString()}`,
      delta: data.revenue30dDelta,
    },
    {
      label: t('vendor.dashboard.orders'),
      value: Number(data.orders30d).toLocaleString(),
      delta: data.orders30dDelta,
    },
    {
      label: t('vendor.dashboard.products'),
      value: data.productsCount,
      sub: `${data.lowStockCount} low`,
    },
    {
      label: t('vendor.dashboard.storeViews'),
      value: Number(data.storeViews30d).toLocaleString(),
      delta: data.storeViews30dDelta,
    },
  ];

  // API status → vendor UI label mapping (API contract §5)
  const STATUS_LABEL = {
    placed: 'New',
    confirmed: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  const statusTone = (s) =>
    s === 'delivered' ? 'forest' : s === 'cancelled' ? 'crimson' : 'gold';

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">
              {k.label}
            </p>
            <p className="text-2xl font-extrabold mt-1">{k.value}</p>
            {k.delta != null && (
              <Badge tone={k.delta >= 0 ? 'forest' : 'crimson'} className="mt-2">
                {k.delta >= 0 ? '+' : ''}
                {Math.round(k.delta * 100)}%
              </Badge>
            )}
            {k.sub && <p className="text-xs text-ink/50 mt-1">{k.sub}</p>}
          </Card>
        ))}
      </div>

      {/* Subscription + Needs attention */}
      <div className="grid lg:grid-cols-2 gap-4">
        {data.subscription && (
          <Card className="p-5">
            <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide mb-2">
              {t('vendor.dashboard.subscription')}
            </p>
            <p className="font-bold">{data.subscription.plan}</p>
            <p className="text-sm text-ink/60 mt-0.5">
              ETB {Number(data.subscription.price).toLocaleString()} / mo &middot;{' '}
              {data.subscription.renewsAt}
            </p>
          </Card>
        )}

        {data.needsAttention && (
          <Card className="p-5">
            <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide mb-3">
              {t('vendor.dashboard.needsAttention')}
            </p>
            <ul className="space-y-2.5 text-sm">
              <li className="flex justify-between">
                <span className="text-ink/70">{t('vendor.dashboard.ordersToFulfill')}</span>
                <span className="font-bold">{data.needsAttention.ordersToFulfill}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-ink/70">{t('vendor.dashboard.lowStock')}</span>
                <span className="font-bold">{data.needsAttention.lowStock}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-ink/70">{t('vendor.dashboard.payoutReady')}</span>
                <span className="font-bold text-forest">
                  ETB {Number(data.needsAttention.payoutReady).toLocaleString()}
                </span>
              </li>
            </ul>
          </Card>
        )}
      </div>

      {/* Recent orders */}
      {data.recentOrders?.length > 0 && (
        <Card className="p-5">
          <p className="font-bold mb-4">{t('vendor.dashboard.recentOrders')}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="text-ink/40 text-[11px] uppercase tracking-wide border-b border-black/5">
                  <th className="text-start py-2 pe-4">{t('common.order')}</th>
                  <th className="text-start py-2 pe-4">{t('common.total')}</th>
                  <th className="text-start py-2">{t('common.status')}</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-black/5 last:border-0">
                    <td className="py-2.5 pe-4 font-medium">{o.orderNumber ?? o.id}</td>
                    <td className="py-2.5 pe-4">
                      ETB {Number(o.subtotal ?? o.total ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2.5">
                      <Badge tone={statusTone(o.status)}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
