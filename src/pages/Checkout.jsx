import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tag, X } from 'lucide-react';
import api from '../lib/api';
import { useCart } from '../hooks/useCart';
import { Button, Input, Toast } from '../components/ui';

// Backend response codes for POST /api/cart/items and POST /api/orders (see order.controller.js).
function errorMessage(err, t) {
  const code = err.response?.data?.error?.code;
  const msg = err.response?.data?.error?.message ?? err.response?.data?.message;
  switch (code) {
    case 'CART_EMPTY':
      return t('checkout.errorCartEmpty');
    case 'OUT_OF_STOCK':
      return t('checkout.errorOutOfStock');
    case 'PAYMENT_FAILED':
      return t('checkout.errorPaymentFailed');
    case 'INVALID_PAYMENT_METHOD':
      return t('checkout.errorInvalidPayment');
    case 'COUPON_INVALID':
    case 'COUPON_EXPIRED':
      return t('checkout.couponRejected');
    default:
      return msg ?? t('common.error');
  }
}

export default function Checkout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, clear } = useCart();

  const [form, setForm] = useState({ name: '', phone: '', city: '', address: '' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Coupon: validated against POST /api/coupons/validate before the order is placed;
  // the server re-validates on POST /api/orders and is the source of truth for the total.
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null); // { code, discount, newTotal }
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Saved addresses — checkout's buyer-only route means we're always authed here.
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('new');

  useEffect(() => {
    let cancelled = false;
    api
      .get('/me/addresses')
      .then((res) => {
        if (cancelled) return;
        const addresses = res.data.addresses ?? [];
        setSavedAddresses(addresses);
        const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
        if (defaultAddress) setSelectedAddressId(defaultAddress._id);
      })
      .catch(() => {
        /* No saved addresses to prefill — manual entry still works. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const usingSavedAddress = selectedAddressId !== 'new';

  const groups = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      const key = item.vendor || t('checkout.unknownVendor');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return Array.from(map, ([vendor, vendorItems]) => ({
      vendor,
      items: vendorItems,
      subtotal: vendorItems.reduce((sum, i) => sum + i.price * i.qty, 0),
    }));
  }, [items, t]);

  const total = groups.reduce((sum, g) => sum + g.subtotal, 0);
  const discount = coupon ? Math.min(coupon.discount, total) : 0;
  const payable = Math.max(0, total - discount);

  // Any change to the cart contents invalidates a previously validated coupon.
  useEffect(() => {
    setCoupon(null);
    setCouponError('');
  }, [items]);

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      const cart = {
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId ?? null,
          title: i.title,
          price: i.price,
          qty: i.qty,
          vendorId: i.vendorId ?? null,
          vendorName: i.vendor ?? null,
          subtotal: i.price * i.qty,
        })),
        total,
      };
      const { data } = await api.post('/coupons/validate', { code, cart });
      setCoupon({ code: data.coupon?.code ?? code.toUpperCase(), discount: data.discount ?? 0 });
    } catch (err) {
      setCoupon(null);
      const code2 = err.response?.data?.error?.code;
      setCouponError(
        code2 === 'MISSING_FIELD' ? t('common.error') : t('checkout.couponInvalid')
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const handlePhoneChange = (e) => {
    let val = e.target.value.trim();
    if (val.startsWith('+251')) val = val.slice(4);
    else if (val.startsWith('251')) val = val.slice(3);
    else if (val.startsWith('0')) val = val.slice(1);
    setForm((f) => ({ ...f, phone: val }));
  };

  const validate = () => {
    if (usingSavedAddress) {
      setFieldErrors({});
      return true;
    }
    const errors = {};
    if (!form.name.trim()) errors.name = t('checkout.required');
    if (!form.phone.trim()) errors.phone = t('checkout.required');
    else if (!/^[79]\d{8}$/.test(form.phone.trim())) errors.phone = t('checkout.invalidPhone');
    if (!form.city.trim()) errors.city = t('checkout.required');
    if (!form.address.trim()) errors.address = t('checkout.required');
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      // The backend builds orders from the server-side cart, not the request body — sync
      // the local (client-only) cart across before placing the order.
      await api.delete('/cart');
      for (const item of items) {
        await api.post('/cart/items', {
          productId: item.productId,
          variantId: item.variantId,
          qty: item.qty,
        });
      }

      const { data } = await api.post('/orders', {
        ...(usingSavedAddress
          ? { savedAddressId: selectedAddressId }
          : {
              shippingAddress: {
                name: form.name.trim(),
                phone: '+251' + form.phone.trim(),
                city: form.city.trim(),
                address: form.address.trim(),
              },
            }),
        paymentMethod,
        ...(coupon ? { couponCode: coupon.code } : {}),
      });

      // The order API doesn't echo the item title in subOrders (schema has the field, the
      // controller never sets it) — fill it in from the local cart we still have in hand.
      const titleByKey = new Map(items.map((i) => [`${i.productId}-${i.variantId ?? 'default'}`, i.title]));
      const order = {
        ...data.order,
        subOrders: data.order.subOrders.map((sub) => ({
          ...sub,
          items: sub.items.map((item) => ({
            ...item,
            title: item.title || titleByKey.get(`${item.productId}-${item.variantId ?? 'default'}`) || '',
          })),
        })),
      };

      clear();
      navigate(`/order-confirmation/${order._id}`, { state: { order } });
    } catch (err) {
      setError(errorMessage(err, t));
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl md:text-3xl font-extrabold">{t('checkout.emptyCartTitle')}</h1>
        <p className="text-ink/60 dark:text-slate-400 mt-2">{t('checkout.emptyCartBody')}</p>
        <Link
          to="/browse"
          className="inline-block mt-6 px-5 h-11 leading-[44px] rounded-2xl font-semibold bg-forest text-white hover:bg-forest-dark"
        >
          {t('checkout.browseProducts')}
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-extrabold">{t('checkout.title')}</h1>

      <form onSubmit={handleSubmit} className="mt-6 lg:grid lg:grid-cols-[1fr_360px] lg:gap-6 items-start">
        <div className="space-y-6">
          {/* Address */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-lg">{t('checkout.addressTitle')}</h2>
              <Link to="/profile/addresses" className="text-sm font-semibold text-forest hover:underline">
                {t('checkout.manageAddresses')}
              </Link>
            </div>

            {savedAddresses.length > 0 && (
              <div className="space-y-3 mb-5">
                <p className="text-xs font-semibold text-ink/60 dark:text-slate-400">
                  {t('checkout.savedAddresses')}
                </p>
                {savedAddresses.map((address) => (
                  <label
                    key={address._id}
                    className={`flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition ${
                      selectedAddressId === address._id
                        ? 'ring-2 ring-forest'
                        : 'ring-1 ring-black/10 dark:ring-white/15'
                    }`}
                  >
                    <input
                      type="radio"
                      name="savedAddress"
                      checked={selectedAddressId === address._id}
                      onChange={() => setSelectedAddressId(address._id)}
                      className="mt-1 accent-forest"
                    />
                    <div className="flex-1 text-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">
                          {{ Home: t('account.labelHome'), Office: t('account.labelOffice') }[
                            address.label
                          ] ??
                            address.label ??
                            t('account.labelOther')}
                        </span>
                        {address.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-forest/10 text-forest text-[10px] font-bold">
                            {t('checkout.defaultBadge')}
                          </span>
                        )}
                      </div>
                      <p className="text-ink/70 dark:text-slate-300 mt-0.5">
                        {address.recipient} · {address.phone}
                      </p>
                      <p className="text-ink/50 dark:text-slate-400">
                        {[address.line, address.subcity, address.city].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </label>
                ))}
                <label
                  className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition ${
                    selectedAddressId === 'new' ? 'ring-2 ring-forest' : 'ring-1 ring-black/10 dark:ring-white/15'
                  }`}
                >
                  <input
                    type="radio"
                    name="savedAddress"
                    checked={selectedAddressId === 'new'}
                    onChange={() => setSelectedAddressId('new')}
                    className="accent-forest"
                  />
                  <span className="text-sm font-semibold">{t('checkout.useNewAddress')}</span>
                </label>
              </div>
            )}

            {!usingSavedAddress && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label={t('checkout.fullName')}
                  placeholder={t('checkout.fullNamePlaceholder')}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  aria-invalid={Boolean(fieldErrors.name)}
                />
                {fieldErrors.name && <p className="mt-1 text-xs text-crimson">{fieldErrors.name}</p>}
              </div>
              <div>
                <label className="block">
                  <span className="block text-xs font-semibold text-ink/60 dark:text-slate-400 mb-1.5">
                    {t('checkout.phone')}
                  </span>
                  <div className="flex rounded-xl ring-1 ring-black/10 dark:ring-white/15 focus-within:ring-2 focus-within:ring-forest bg-white dark:bg-slate-800 overflow-hidden">
                    <span className="grid place-items-center px-3 text-sm text-ink/60 dark:text-slate-400 border-e border-black/10 dark:border-white/10 shrink-0">
                      +251
                    </span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={handlePhoneChange}
                      placeholder={t('checkout.phonePlaceholder')}
                      aria-invalid={Boolean(fieldErrors.phone)}
                      className="flex-1 min-w-0 px-3 py-3 bg-transparent outline-none dark:text-slate-100"
                    />
                  </div>
                </label>
                {fieldErrors.phone && <p className="mt-1 text-xs text-crimson">{fieldErrors.phone}</p>}
              </div>
              <div>
                <Input
                  label={t('checkout.city')}
                  placeholder={t('checkout.cityPlaceholder')}
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  aria-invalid={Boolean(fieldErrors.city)}
                />
                {fieldErrors.city && <p className="mt-1 text-xs text-crimson">{fieldErrors.city}</p>}
              </div>
              <div className="sm:col-span-2">
                <Input
                  label={t('checkout.address')}
                  placeholder={t('checkout.addressPlaceholder')}
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  aria-invalid={Boolean(fieldErrors.address)}
                />
                {fieldErrors.address && <p className="mt-1 text-xs text-crimson">{fieldErrors.address}</p>}
              </div>
            </div>
            )}
          </div>

          {/* Payment method */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft p-5 md:p-6">
            <h2 className="font-extrabold text-lg mb-4">{t('checkout.paymentTitle')}</h2>
            <div className="space-y-3">
              <label
                className={`flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition ${
                  paymentMethod === 'online' ? 'ring-2 ring-forest' : 'ring-1 ring-black/10 dark:ring-white/15'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={() => setPaymentMethod('online')}
                  className="mt-1 accent-forest"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{t('checkout.payOnline')}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-gold/20 text-gold-dark">
                      {t('checkout.testMode')}
                    </span>
                  </div>
                  <p className="text-xs text-ink/50 dark:text-slate-400 mt-1">{t('checkout.payOnlineDesc')}</p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition ${
                  paymentMethod === 'cod' ? 'ring-2 ring-forest' : 'ring-1 ring-black/10 dark:ring-white/15'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 accent-forest"
                />
                <div className="flex-1">
                  <span className="font-bold">{t('checkout.payCod')}</span>
                  <p className="text-xs text-ink/50 dark:text-slate-400 mt-1">{t('checkout.payCodDesc')}</p>
                </div>
              </label>
            </div>
          </div>

          {/* Items by vendor */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft p-5 md:p-6">
            <h2 className="font-extrabold text-lg mb-4">{t('checkout.itemsByVendor')}</h2>
            <div className="space-y-5">
              {groups.map((group) => (
                <div key={group.vendor}>
                  <div className="flex items-center justify-between text-sm font-semibold text-forest">
                    <span>{group.vendor}</span>
                    <span>{group.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {group.items.map((item) => (
                      <div
                        key={`${item.productId}-${item.variantId ?? 'default'}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-ink/70 dark:text-slate-300 truncate">
                          {item.title} <span className="text-ink/40">×{item.qty}</span>
                        </span>
                        <span className="font-medium">{(item.price * item.qty).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="mt-6 lg:mt-0 bg-white dark:bg-slate-800 rounded-3xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft p-5 md:p-6">
          <h2 className="font-extrabold text-lg mb-3">{t('checkout.summary')}</h2>
          <div className="flex justify-between text-sm">
            <span className="text-ink/60 dark:text-slate-400">{t('checkout.subtotal')}</span>
            <span className="font-semibold">{total.toLocaleString()}</span>
          </div>

          {/* Coupon */}
          <div className="mt-4">
            {coupon ? (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-forest/5 dark:bg-forest/10 px-3 py-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest min-w-0">
                  <Tag className="w-4 h-4 shrink-0" />
                  <span className="truncate">{coupon.code}</span>
                </span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-ink/60 dark:text-slate-400 hover:text-crimson"
                >
                  <X className="w-3.5 h-3.5" />
                  {t('checkout.couponRemove')}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyCoupon();
                    }
                  }}
                  placeholder={t('checkout.couponPlaceholder')}
                  aria-label={t('checkout.couponLabel')}
                  aria-invalid={Boolean(couponError)}
                  className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl ring-1 ring-black/10 dark:ring-white/15 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-forest uppercase placeholder:normal-case"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  className="shrink-0 px-3 py-2 text-sm font-semibold rounded-xl bg-forest text-white hover:bg-forest-dark disabled:opacity-40 disabled:pointer-events-none"
                >
                  {couponLoading ? t('checkout.couponApplying') : t('checkout.couponApply')}
                </button>
              </div>
            )}
            {couponError && <p className="mt-1.5 text-xs text-crimson">{couponError}</p>}
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-sm mt-3 text-forest">
              <span>{t('checkout.discount')}</span>
              <span className="font-semibold">−{discount.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between text-base font-extrabold mt-3 pt-3 border-t border-black/10 dark:border-white/10">
            <span>{t('checkout.total')}</span>
            <span>{payable.toLocaleString()}</span>
          </div>
          <Button type="submit" variant="gold" disabled={submitting} className="w-full mt-5">
            {submitting ? t('checkout.placingOrder') : t('checkout.placeOrder')}
          </Button>
        </div>
      </form>

      <Toast show={Boolean(error)} variant="error">
        {error}
      </Toast>
    </section>
  );
}
