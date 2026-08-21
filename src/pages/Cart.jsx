import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../hooks/useCart';
import { Button } from '../components/ui';

// Groups cart items by vendor name, returning an ordered array of
// { vendorName, items, subtotal } so the render loop stays declarative.
function groupByVendor(items, fallback) {
  const map = {};
  for (const item of items) {
    const key = item.vendor || fallback;
    if (!map[key]) map[key] = [];
    map[key].push(item);
  }
  return Object.entries(map).map(([vendorName, vendorItems]) => ({
    vendorName,
    items: vendorItems,
    subtotal: vendorItems.reduce((n, x) => n + x.price * x.qty, 0),
  }));
}

export default function Cart() {
  const { t } = useTranslation();
  const { items, updateQty, remove, total } = useCart();

  const groups = groupByVendor(items, t('cart.unknownVendor'));

  /* ── Empty state ───────────────────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-20 text-center">
        {/* Shopping bag icon */}
        <div className="grid place-items-center w-20 h-20 rounded-full bg-forest/10 mx-auto mb-5">
          <svg
            className="w-10 h-10 text-forest"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold">{t('cart.empty')}</h1>
        <p className="text-ink/60 dark:text-slate-400 mt-2 text-sm">{t('cart.emptyHint')}</p>
        <Link to="/browse" className="inline-block mt-6">
          <Button>{t('cart.continueShopping')}</Button>
        </Link>
      </section>
    );
  }

  /* ── Filled cart ───────────────────────────────────────────────────── */
  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-6">
        {t('cart.title')}
      </h1>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* ── Left: vendor groups ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {groups.map(({ vendorName, items: vendorItems, subtotal }) => (
            <div
              key={vendorName}
              className="bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft overflow-hidden"
            >
              {/* Vendor header */}
              <div className="px-4 py-3 border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-forest truncate">{vendorName}</p>
                <p className="text-xs text-ink/50 dark:text-slate-400 shrink-0">
                  {t('cart.subtotal')}:{' '}
                  <span className="font-semibold text-ink dark:text-slate-100">
                    ETB {subtotal.toLocaleString()}
                  </span>
                </p>
              </div>

              {/* Items */}
              <div className="divide-y divide-black/5 dark:divide-white/10">
                {vendorItems.map((item) => {
                  const lineTotal = item.price * item.qty;
                  return (
                    <div
                      key={`${item.productId}-${String(item.variantId)}`}
                      className="flex gap-3 p-4"
                    >
                      {/* Image / initial placeholder */}
                      <span className="grid place-items-center w-16 h-16 rounded-xl bg-forest/10 text-forest font-extrabold text-xl shrink-0">
                        {item.title?.[0]?.toUpperCase() ?? '?'}
                      </span>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold line-clamp-1 dark:text-slate-100">
                          {item.title}
                        </p>
                        {item.variantId && (
                          <p className="text-xs text-ink/50 dark:text-slate-400 mt-0.5">
                            {t('cart.variant')}: {item.variantId}
                          </p>
                        )}
                        <p className="text-xs text-ink/50 dark:text-slate-400 mt-0.5">
                          {t('cart.unitPrice')}: ETB {Number(item.price).toLocaleString()}
                        </p>
                      </div>

                      {/* Qty stepper + line total + remove */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              item.qty > 1 &&
                              updateQty(item.productId, item.variantId, item.qty - 1)
                            }
                            disabled={item.qty <= 1}
                            className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/10 text-sm font-bold leading-none hover:bg-black/10 dark:hover:bg-white/20 disabled:opacity-30 transition"
                            aria-label={`${t('cart.qty')} −`}
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-semibold select-none">
                            {item.qty}
                          </span>
                          <button
                            onClick={() =>
                              updateQty(item.productId, item.variantId, item.qty + 1)
                            }
                            className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/10 text-sm font-bold leading-none hover:bg-black/10 dark:hover:bg-white/20 transition"
                            aria-label={`${t('cart.qty')} +`}
                          >
                            +
                          </button>
                        </div>

                        <p className="text-sm font-extrabold text-forest">
                          ETB {lineTotal.toLocaleString()}
                        </p>

                        <button
                          onClick={() => remove(item.productId, item.variantId)}
                          className="text-xs text-crimson hover:underline"
                        >
                          {t('cart.remove')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Right: order summary ─────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft p-5 sticky top-24">
            <h2 className="text-base font-extrabold mb-4">{t('common.order')}</h2>

            {/* Per-vendor breakdown */}
            <div className="space-y-2">
              {groups.map(({ vendorName, subtotal }) => (
                <div key={vendorName} className="flex justify-between text-sm">
                  <span className="text-ink/60 dark:text-slate-400 truncate me-2">
                    {vendorName}
                  </span>
                  <span className="shrink-0">ETB {subtotal.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Grand total */}
            <div className="border-t border-black/10 dark:border-white/10 mt-4 pt-4 flex justify-between font-extrabold text-base">
              <span>{t('cart.grandTotal')}</span>
              <span className="text-forest">ETB {Number(total).toLocaleString()}</span>
            </div>

            {/* Checkout CTA */}
            <Link to="/checkout" className="block mt-4">
              <Button size="lg" className="w-full shadow-glow">
                {t('cart.checkout')}
              </Button>
            </Link>

            {/* Continue shopping */}
            <Link
              to="/browse"
              className="block text-center text-sm font-semibold text-ink/50 dark:text-slate-400 hover:text-forest dark:hover:text-forest-light mt-3 transition"
            >
              {t('cart.continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
