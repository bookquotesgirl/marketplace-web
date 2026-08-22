import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { Spinner } from '../components/ui';

const STATUS_KEY = {
  placed: 'orderConfirm.status.placed',
  confirmed: 'orderConfirm.status.confirmed',
  shipped: 'orderConfirm.status.shipped',
  delivered: 'orderConfirm.status.delivered',
  cancelled: 'orderConfirm.status.cancelled',
};

export default function OrderConfirmation() {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order ?? null);
  const [status, setStatus] = useState(location.state?.order ? 'ready' : 'loading');

  useEffect(() => {
    if (order) return;
    let cancelled = false;
    api
      .get(`/orders/${id}`)
      .then((res) => {
        if (cancelled) return;
        setOrder(res.data.order);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (status === 'loading') {
    return (
      <section className="max-w-2xl mx-auto px-4 py-16 grid place-items-center">
        <Spinner />
      </section>
    );
  }

  if (status === 'error' || !order) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-ink/60 dark:text-slate-400">{t('orderConfirm.notFound')}</p>
        <Link to="/orders" className="inline-block mt-6 px-5 h-11 leading-[44px] rounded-2xl font-semibold bg-forest text-white hover:bg-forest-dark">
          {t('orderConfirm.trackOrder')}
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center">
        <span className="inline-grid place-items-center w-20 h-20 rounded-full bg-forest/10 text-forest mb-4 text-4xl">
          ✓
        </span>
        <h1 className="text-2xl font-extrabold">{t('orderConfirm.title')}</h1>
        <p className="text-ink/60 dark:text-slate-400 mt-2">
          {t('orderConfirm.orderNumber')}: <span className="font-semibold">{order.orderNumber}</span>
        </p>
        <p className="text-ink/60 dark:text-slate-400 mt-1">
          {order.paymentMethod === 'online' ? t('orderConfirm.testModeNote') : t('orderConfirm.codNote')}
        </p>
      </div>

      <div className="mt-8 bg-white dark:bg-slate-800 rounded-3xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft p-5 md:p-6">
        <h2 className="font-bold flex items-center gap-2">{t('orderConfirm.deliverTo')}</h2>
        <p className="text-sm mt-2">
          <span className="font-semibold">{order.shippingAddress?.name}</span> · {order.shippingAddress?.phone}
        </p>
        <p className="text-sm text-ink/60 dark:text-slate-400">
          {order.shippingAddress?.address}, {order.shippingAddress?.city}
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {(order.subOrders ?? []).map((sub) => (
          <div
            key={sub._id ?? sub.vendorId}
            className="bg-white dark:bg-slate-800 rounded-3xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-forest">{t('orderConfirm.subOrderFrom', { vendor: sub.vendorName })}</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-forest/10 text-forest">
                {t(STATUS_KEY[sub.status] ?? 'orderConfirm.status.placed')}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {sub.items.map((item, i) => (
                <div key={`${item.productId}-${i}`} className="flex items-center justify-between text-sm">
                  <span className="text-ink/70 dark:text-slate-300">
                    {item.title} <span className="text-ink/40">×{item.qty}</span>
                  </span>
                  <span className="font-medium">{(item.priceSnapshot * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm font-semibold mt-3 pt-3 border-t border-black/10 dark:border-white/10">
              <span>{t('checkout.subtotal')}</span>
              <span>{sub.subtotal.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-white dark:bg-slate-800 rounded-3xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft p-5 flex justify-between text-lg font-extrabold">
        <span>{t('orderConfirm.total')}</span>
        <span>{order.total?.toLocaleString()}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
        <Link
          to="/orders"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-forest text-white font-bold"
        >
          {t('orderConfirm.trackOrder')}
        </Link>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl ring-1 ring-black/10 dark:ring-white/15 font-semibold"
        >
          {t('orderConfirm.keepShopping')}
        </Link>
      </div>
    </section>
  );
}
