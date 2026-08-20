import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Spinner } from '../../components/ui';
import api from '../../lib/api';

// GET /api/admin/dashboard — composed payload, see API contract §10.
export default function AdminDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get('/admin/dashboard')
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
      value: `ETB ${Number(data.gmv30d).toLocaleString()}`,
    },
    {
      label: t('admin.dashboard.mrr'),
      value: `ETB ${Number(data.subscriptionMrr).toLocaleString()}`,
    },
    {
      label: t('admin.dashboard.vendors'),
      value: Number(data.activeVendors).toLocaleString(),
    },
    {
      label: t('admin.dashboard.approvals'),
      value: data.pendingApprovals,
      highlight: data.pendingApprovals > 0,
    },
    {
      label: t('admin.dashboard.orders'),
      value: Number(data.orders30d).toLocaleString(),
    },
    {
      label: t('admin.dashboard.customers'),
      value: Number(data.customersCount).toLocaleString(),
    },
    {
      label: t('admin.dashboard.aov'),
      value: `ETB ${Number(data.avgOrderValue).toLocaleString()}`,
    },
    {
      label: t('admin.dashboard.refunds'),
      value: `${Math.round((data.refundRate ?? 0) * 100)}%`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {k.label}
            </p>
            <p
              className={`text-2xl font-extrabold mt-1 ${
                k.highlight ? 'text-gold' : 'text-white'
              }`}
            >
              {k.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Top vendors */}
      {data.topVendors?.length > 0 && (
        <Card className="p-5">
          <p className="font-bold text-white mb-4">{t('admin.dashboard.topVendors')}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="text-slate-400 text-[11px] uppercase tracking-wide border-b border-white/10">
                  <th className="text-start py-2 pe-4">{t('admin.dashboard.store')}</th>
                  <th className="text-start py-2 pe-4">{t('admin.dashboard.orders')}</th>
                  <th className="text-start py-2">{t('admin.dashboard.gmv')}</th>
                </tr>
              </thead>
              <tbody>
                {data.topVendors.map((v) => (
                  <tr key={v.id} className="border-b border-white/10 last:border-0">
                    <td className="py-2.5 pe-4 font-medium text-white">{v.storeName}</td>
                    <td className="py-2.5 pe-4 text-slate-300">
                      {Number(v.ordersCount ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-slate-300">
                      ETB {Number(v.gmv ?? 0).toLocaleString()}
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
