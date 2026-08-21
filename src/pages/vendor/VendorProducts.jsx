import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { Button, Badge, Spinner, Toast } from '../../components/ui';

// Maps backend status values to Badge tone tokens.
const STATUS_TONE = {
  active: 'forest',
  draft: 'gray',
  suspended: 'crimson',
  pending: 'gold',
};

export default function VendorProducts() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  // Auto-dismiss toast after 2.5 s.
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .get('/vendor/products')
      .then(({ data }) => {
        if (!cancelled) {
          // Accept either a plain array or a { products: [...] } envelope.
          setProducts(Array.isArray(data) ? data : (data.products ?? []));
        }
      })
      .catch(() => {
        if (!cancelled) setError(t('vendor.products.errorLoad'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t, retryKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-crimson font-semibold">{error}</p>
        <button
          onClick={() => setRetryKey((k) => k + 1)}
          className="mt-3 text-sm font-semibold text-forest hover:underline"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-ink/50 dark:text-slate-400">
        <p className="text-lg font-semibold">{t('vendor.products.empty')}</p>
        <p className="text-sm mt-1">{t('vendor.products.emptyHint')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">{t('vendor.products.title')}</h1>
      </div>

      {/* Scrollable table — mobile-friendly via overflow-x-auto */}
      <div className="overflow-x-auto rounded-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft bg-white dark:bg-slate-800">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-black/5 dark:border-white/10">
              <th className="px-4 py-3 text-start text-xs font-semibold text-ink/50 dark:text-slate-400 uppercase tracking-wide">
                {t('vendor.products.image')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold text-ink/50 dark:text-slate-400 uppercase tracking-wide">
                {t('vendor.products.name')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold text-ink/50 dark:text-slate-400 uppercase tracking-wide">
                {t('vendor.products.price')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold text-ink/50 dark:text-slate-400 uppercase tracking-wide">
                {t('vendor.products.stock')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold text-ink/50 dark:text-slate-400 uppercase tracking-wide">
                {t('common.status')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold text-ink/50 dark:text-slate-400 uppercase tracking-wide">
                {t('vendor.products.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {products.map((p) => (
              <tr key={p._id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition">
                {/* Image */}
                <td className="px-4 py-3">
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="grid place-items-center w-12 h-12 rounded-xl bg-forest/10 text-forest font-extrabold text-lg shrink-0">
                      {p.title?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  )}
                </td>

                {/* Title */}
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold line-clamp-2 max-w-xs dark:text-slate-100">
                    {p.title ?? '—'}
                  </p>
                </td>

                {/* Price */}
                <td className="px-4 py-3 text-sm font-semibold text-forest whitespace-nowrap">
                  {p.basePrice != null ? `ETB ${Number(p.basePrice).toLocaleString()}` : '—'}
                </td>

                {/* Stock */}
                <td className="px-4 py-3 text-sm text-ink/70 dark:text-slate-300">
                  {p.stock ?? '—'}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  {p.status ? (
                    <Badge tone={STATUS_TONE[p.status] ?? 'gray'}>{p.status}</Badge>
                  ) : (
                    <span className="text-ink/40 text-sm">—</span>
                  )}
                </td>

                {/* Actions — stubs until backend edit/delete endpoints are available */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setToast(t('common.comingSoon'))}
                    >
                      {t('vendor.products.edit')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-crimson hover:bg-crimson/10 hover:ring-crimson/20"
                      onClick={() => setToast(t('common.comingSoon'))}
                    >
                      {t('vendor.products.delete')}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Toast show={Boolean(toast)}>{toast}</Toast>
    </>
  );
}
