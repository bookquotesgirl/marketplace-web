import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { useCart } from '../hooks/useCart';
import { Spinner } from '../components/ui';
import { STATUS_KEY, STATUS_STEPS, statusStepIndex } from '../lib/orderStatus';
import { addSubOrdersToCart } from '../lib/reorder';

function StatusTimeline({ status }) {
  const { t } = useTranslation();
  const step = statusStepIndex(status);

  return (
    <div className="flex items-center mt-4">
      {STATUS_STEPS.map((s, idx) => (
        <div key={s} className={`flex items-center ${idx < STATUS_STEPS.length - 1 ? 'flex-1' : ''}`}>
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <span
              className={`grid place-items-center w-8 h-8 rounded-full text-xs font-bold ${
                idx <= step ? 'bg-forest text-white' : 'bg-black/10 dark:bg-white/10 text-ink/40'
              }`}
            >
              {idx + 1}
            </span>
            <span
              className={`text-[10px] font-medium text-center leading-tight ${
                idx <= step ? 'text-forest' : 'text-ink/40 dark:text-slate-500'
              }`}
            >
              {t(STATUS_KEY[s])}
            </span>
          </div>
          {idx < STATUS_STEPS.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-1 -mt-4 rounded ${
                idx < step ? 'bg-forest' : 'bg-black/10 dark:bg-white/10'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function OrderDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();

  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
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
  }, [id]);

  const handleReorder = (subOrders) => {
    addSubOrdersToCart(subOrders, add, t('orders.unknownItem'));
    navigate('/cart');
  };

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
        <Link
          to="/orders"
          className="inline-block mt-6 px-5 h-11 leading-[44px] rounded-2xl font-semibold bg-forest text-white hover:bg-forest-dark"
        >
          {t('orders.backToOrders')}
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-2xl mx-auto px-4 py-10">
      <nav className="text-sm text-ink/60 dark:text-slate-400 mb-4">
        <Link to="/orders" className="hover:text-forest">
          {t('orders.backToOrders')}
        </Link>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">{order.orderNumber}</h1>
        <button
          type="button"
          onClick={() => handleReorder(order.subOrders ?? [])}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-forest/10 text-forest font-semibold text-sm hover:bg-forest hover:text-white transition"
        >
          {t('orders.reorder')}
        </button>
      </div>

      <div className="mt-6 bg-white dark:bg-slate-800 rounded-3xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft p-5 md:p-6">
        <h2 className="font-bold">{t('orderConfirm.deliverTo')}</h2>
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

            {sub.status === 'cancelled' ? (
              <p className="text-sm text-crimson mt-3">{sub.cancelReason || t('orderConfirm.status.cancelled')}</p>
            ) : (
              <StatusTimeline status={sub.status} />
            )}

            <div className="mt-4 space-y-2">
              {sub.items.map((item, i) => (
                <div key={`${item.productId}-${i}`} className="flex items-center justify-between text-sm">
                  <span className="text-ink/70 dark:text-slate-300">
                    {item.title || t('orders.unknownItem')} <span className="text-ink/40">×{item.qty}</span>
                  </span>
                  <span className="font-medium">{(item.priceSnapshot * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm font-semibold mt-3 pt-3 border-t border-black/10 dark:border-white/10">
              <span>{t('checkout.subtotal')}</span>
              <span>{sub.subtotal.toLocaleString()}</span>
            </div>

            <button
              type="button"
              onClick={() => handleReorder([sub])}
              className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl ring-1 ring-black/10 dark:ring-white/15 font-semibold text-sm hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              {t('orders.reorderVendor')}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-white dark:bg-slate-800 rounded-3xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft p-5 flex justify-between text-lg font-extrabold">
        <span>{t('orderConfirm.total')}</span>
        <span>{order.total?.toLocaleString()}</span>
      </div>
    </section>
  );
}
