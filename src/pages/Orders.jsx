import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { useCart } from '../hooks/useCart';
import { Spinner } from '../components/ui';
import { STATUS_KEY, overallStatus } from '../lib/orderStatus';
import { addSubOrdersToCart } from '../lib/reorder';

export default function Orders() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { add } = useCart();

  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    api
      .get('/orders')
      .then((res) => {
        if (cancelled) return;
        setOrders(res.data.orders ?? []);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleReorder = (order) => {
    addSubOrdersToCart(order.subOrders ?? [], add, t('orders.unknownItem'));
    navigate('/cart');
  };

  if (status === 'loading') {
    return (
      <section className="max-w-4xl mx-auto px-4 py-16 grid place-items-center">
        <Spinner />
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-ink/60 dark:text-slate-400">{t('common.error')}</p>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-extrabold">{t('orders.title')}</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-semibold">{t('orders.emptyTitle')}</p>
          <p className="text-ink/60 dark:text-slate-400 mt-1">{t('orders.emptyBody')}</p>
          <Link
            to="/browse"
            className="inline-block mt-6 px-5 h-11 leading-[44px] rounded-2xl font-semibold bg-forest text-white hover:bg-forest-dark"
          >
            {t('orders.browseProducts')}
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => {
            const status = overallStatus(order.subOrders);
            return (
              <div
                key={order._id}
                className="bg-white dark:bg-slate-800 rounded-3xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft p-5"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-extrabold">{order.orderNumber}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-forest/10 text-forest">
                    {t(STATUS_KEY[status])}
                  </span>
                  <span className="text-xs text-ink/50 dark:text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString(i18n.language)}
                  </span>
                  <span className="ms-auto text-sm font-extrabold text-forest dark:text-forest-light">
                    {order.total?.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <Link
                    to={`/orders/${order._id}`}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl ring-1 ring-black/10 dark:ring-white/15 font-semibold text-sm hover:bg-black/5 dark:hover:bg-white/5 transition"
                  >
                    {t('orders.viewDetails')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleReorder(order)}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-forest/10 text-forest font-semibold text-sm hover:bg-forest hover:text-white transition"
                  >
                    {t('orders.reorder')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
