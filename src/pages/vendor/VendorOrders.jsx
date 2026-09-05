import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Inbox, Loader2, Truck, CheckCircle2, XCircle,
  Search, User, MapPin, CreditCard, Package,
  ChevronRight, X, AlertTriangle,
} from 'lucide-react';
import api from '../../lib/api';
import { Spinner, Toast, Button } from '../../components/ui';

// ── Status config ─────────────────────────────────────────────────────────────
// API values: placed | confirmed | shipped | delivered | cancelled
const STATUS = {
  placed: {
    labelKey:  'vendor.orders.statusNew',
    badgeCls:  'bg-amber-500/12 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    dotCls:    'bg-amber-500',
  },
  confirmed: {
    labelKey:  'vendor.orders.statusProcessing',
    badgeCls:  'bg-blue-500/12 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    dotCls:    'bg-blue-500',
  },
  shipped: {
    labelKey:  'vendor.orders.statusShipped',
    badgeCls:  'bg-forest/10 text-forest dark:bg-emerald-500/15 dark:text-emerald-400',
    dotCls:    'bg-forest',
  },
  delivered: {
    labelKey:  'vendor.orders.statusDelivered',
    badgeCls:  'bg-forest text-white',
    dotCls:    'bg-white',
  },
  cancelled: {
    labelKey:  'vendor.orders.statusCancelled',
    badgeCls:  'bg-slate-400/15 text-slate-500 dark:bg-white/10 dark:text-slate-400',
    dotCls:    'bg-slate-400',
  },
};

// Chips show counts for these four statuses
const CHIPS = [
  { key: 'placed',    Icon: Inbox,         labelKey: 'vendor.orders.chipNew',        colorCls: 'bg-amber-500/12 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' },
  { key: 'confirmed', Icon: Loader2,        labelKey: 'vendor.orders.chipProcessing', colorCls: 'bg-blue-500/12 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400' },
  { key: 'shipped',   Icon: Truck,          labelKey: 'vendor.orders.chipShipped',    colorCls: 'bg-forest/10 text-forest dark:bg-emerald-500/15 dark:text-emerald-400' },
  { key: 'delivered', Icon: CheckCircle2,   labelKey: 'vendor.orders.chipDelivered',  colorCls: 'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' },
];

const TABS = [
  { value: 'all',       labelKey: 'vendor.orders.tabAll' },
  { value: 'placed',    labelKey: 'vendor.orders.tabNew' },
  { value: 'confirmed', labelKey: 'vendor.orders.tabProcessing' },
  { value: 'shipped',   labelKey: 'vendor.orders.tabShipped' },
  { value: 'delivered', labelKey: 'vendor.orders.tabDelivered' },
  { value: 'cancelled', labelKey: 'vendor.orders.tabCancelled' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

// The API returns sub-orders. Defensive field resolution handles both
// id/_id, buyerId object or flat buyer fields.
// orderId is used for PATCH requests — it must be the actual document ID.
// orderNumber is used for display.
function resolveOrder(o) {
  const orderId   = String(o._id ?? o.id ?? '');
  const orderNum  = o.orderNumber ?? orderId.slice(-6).toUpperCase();
  const buyer     = o.buyerId ?? o.buyer ?? {};
  const custName  = buyer.name ?? o.customerName ?? '—';
  const custPhone = buyer.phone ?? o.customerPhone ?? '';
  const addr      = o.shippingAddress ?? o.address ?? {};
  const city      = addr.city ?? buyer.city ?? '';
  const status    = o.status ?? 'placed';
  const subtotal  = o.subtotal ?? o.total ?? 0;
  const items     = Array.isArray(o.items) ? o.items : [];
  const date      = o.createdAt
    ? new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';
  const payment   = o.paymentMethod ?? buyer.paymentMethod ?? '—';
  return { orderId, orderNum, custName, custPhone, city, status, subtotal, items, date, payment };
}

// Determine if a cancel action is allowed (only from placed or confirmed)
function canCancel(status) {
  return status === 'placed' || status === 'confirmed';
}

// Determine the "next" advance action for a given status
function nextAction(status) {
  if (status === 'placed')    return { status: 'confirmed', labelKey: 'vendor.orders.actionAccept' };
  if (status === 'confirmed') return { status: 'shipped',   labelKey: 'vendor.orders.actionShip' };
  if (status === 'shipped')   return { status: 'delivered', labelKey: 'vendor.orders.actionDeliver' };
  return null;
}

// Extract list from envelope shapes: bare array | { data } | { items } | { subOrders } | { orders }
// NOTE: d.data is checked before d.items intentionally — the API contract uses `data` as the
// canonical list field for paginated responses. Checking `items` first would risk picking up a
// non-order array (e.g. line-item arrays) that appears before `data` in some response envelopes.
function extractList(res) {
  const d = res.data;
  if (Array.isArray(d))              return d;
  if (Array.isArray(d.data))         return d.data;
  if (Array.isArray(d.items))        return d.items;
  if (Array.isArray(d.subOrders))    return d.subOrders;
  if (Array.isArray(d.orders))       return d.orders;
  return [];
}

// ── Drawer ────────────────────────────────────────────────────────────────────

function OrderDrawer({ order, onClose, onAdvance, onCancel }) {
  const { t } = useTranslation();
  if (!order) return null;

  const { orderNum, custName, custPhone, city, status, subtotal, items, date, payment } = resolveOrder(order);
  const st  = STATUS[status] ?? STATUS.placed;
  const nxt = nextAction(status);

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-900/30 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="absolute inset-y-0 end-0 w-full max-w-md overflow-y-auto bg-white/72 dark:bg-white/[0.08] backdrop-blur-[30px] [backdrop-filter:blur(30px)_saturate(190%)] border-s border-white/80 dark:border-white/12 shadow-[0_18px_50px_-18px_rgba(30,50,90,.24)] p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold">#{orderNum}</h2>
            <p className="text-xs text-slate-500">{date}</p>
          </div>
          <button
            onClick={onClose}
            className="grid place-items-center w-9 h-9 rounded-xl bg-white/55 dark:bg-white/[0.055] border border-white/70 dark:border-white/10 hover:bg-white/70 transition"
            aria-label={t('common.cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status */}
        <div className="bg-white/55 dark:bg-white/[0.055] border border-white/70 dark:border-white/10 rounded-2xl p-4 space-y-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${st.badgeCls}`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${st.dotCls}`} />
            {t(st.labelKey)}
          </span>

          {/* Customer */}
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{custName}</span>
            </div>
            {custPhone && (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 shrink-0" />
                <span className="text-slate-500 text-xs">{custPhone}</span>
              </div>
            )}
            {city && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-500 text-xs">{city}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-500 text-xs">{payment}</span>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-baseline pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
            <span className="text-sm font-semibold">{t('vendor.orders.drawerTotal')}</span>
            <span className="text-lg font-extrabold text-forest">
              ETB {Number(subtotal).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Items */}
        {items.length > 0 && (
          <div className="bg-white/55 dark:bg-white/[0.055] border border-white/70 dark:border-white/10 rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              {t('vendor.orders.drawerItems')} ({items.length})
            </p>
            <ul className="space-y-3">
              {items.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title ?? ''}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <span className="grid place-items-center w-10 h-10 rounded-lg bg-forest/10 text-forest shrink-0">
                      <Package className="w-4 h-4" />
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.title ?? item.name ?? t('common.item')}</p>
                    <p className="text-xs text-slate-500">
                      {item.qty ?? item.quantity ?? 1} × ETB {Number(item.price ?? item.unitPrice ?? 0).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {nxt && (
            <Button
              variant="primary"
              className="w-full"
              onClick={() => onAdvance(order, nxt.status)}
            >
              {t(nxt.labelKey)}
            </Button>
          )}
          {canCancel(status) && (
            <Button
              variant="secondary"
              className="w-full !text-crimson ring-crimson/20 hover:bg-crimson/5"
              onClick={() => onCancel(order)}
            >
              <XCircle className="w-4 h-4" />
              {t('vendor.orders.actionCancel')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Confirm advance modal ─────────────────────────────────────────────────────

function ConfirmAdvanceModal({ order, targetStatus, onConfirm, onClose, loading }) {
  const { t } = useTranslation();
  if (!order) return null;
  const { orderNum } = resolveOrder(order);
  const st = STATUS[targetStatus] ?? STATUS.confirmed;

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-extrabold mb-1">{t('vendor.orders.confirmAdvanceTitle')}</h3>
        <p className="text-sm text-slate-500 mb-4">
          #{orderNum} → <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${st.badgeCls}`}>{t(st.labelKey)}</span>
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={loading}>
            {loading ? t('common.loading') : t('common.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Cancel modal (collects reason) ────────────────────────────────────────────

function CancelModal({ order, onConfirm, onClose, loading }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  if (!order) return null;
  const { orderNum } = resolveOrder(order);

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <span className="grid place-items-center w-9 h-9 rounded-2xl bg-crimson/10 text-crimson shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-extrabold">{t('vendor.orders.cancelTitle')}</h3>
            <p className="text-sm text-slate-500 mt-0.5">#{orderNum}</p>
          </div>
        </div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
          {t('vendor.orders.cancelReasonLabel')}
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder={t('vendor.orders.cancelReasonPlaceholder')}
          className="w-full px-3 py-2 rounded-xl ring-1 ring-black/10 dark:ring-white/15 bg-white/70 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-crimson text-sm resize-none"
        />
        <div className="flex items-center justify-end gap-3 mt-4">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={loading}
            className="h-9 px-4 rounded-2xl text-sm font-semibold bg-crimson text-white hover:bg-crimson/90 transition disabled:opacity-40"
          >
            {loading ? t('common.loading') : t('vendor.orders.cancelConfirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VendorOrders() {
  const { t } = useTranslation();

  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('all');
  const [search, setSearch]       = useState('');
  const [toast, setToast]         = useState(null);
  const [toastVariant, setToastVariant] = useState('default');

  // Drawer state
  const [selOrder, setSelOrder]   = useState(null);

  // Advance confirm modal
  const [advanceOrder, setAdvanceOrder]   = useState(null);
  const [advanceTarget, setAdvanceTarget] = useState(null);
  const [advancing, setAdvancing]         = useState(false);

  // Cancel modal
  const [cancelOrder, setCancelOrder]   = useState(null);
  const [cancelling, setCancelling]     = useState(false);

  // ── Toast helpers ─────────────────────────────────────────────────────────
  const showToast = useCallback((msg, variant = 'default') => {
    setToast(msg);
    setToastVariant(variant);
  }, []);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/vendor/orders');
      setAllOrders(extractList(res));
    } catch (err) {
      const msg = err.response?.data?.error?.message ?? err.response?.data?.message ?? t('common.error');
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [t, showToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Clear search when tab changes
  useEffect(() => { setSearch(''); }, [tab]);

  // ── Derived counts for chips ──────────────────────────────────────────────
  const chipCounts = useMemo(() => {
    const counts = { placed: 0, confirmed: 0, shipped: 0, delivered: 0 };
    allOrders.forEach((o) => {
      const s = o.status ?? 'placed';
      if (s in counts) counts[s]++;
    });
    return counts;
  }, [allOrders]);

  // ── Filter by tab + search ────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    let list = allOrders;
    if (tab !== 'all') list = list.filter((o) => (o.status ?? 'placed') === tab);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((o) => {
      const { orderNum, custName, custPhone } = resolveOrder(o);
      return (
        orderNum.toLowerCase().includes(q) ||
        custName.toLowerCase().includes(q) ||
        custPhone.toLowerCase().includes(q)
      );
    });
  }, [allOrders, tab, search]);

  // ── Status advance ────────────────────────────────────────────────────────
  const openAdvance = (order, target) => {
    setSelOrder(null);
    setAdvanceOrder(order);
    setAdvanceTarget(target);
  };

  const handleAdvance = async () => {
    if (!advanceOrder || !advanceTarget) return;
    const orderId = String(advanceOrder._id ?? advanceOrder.id);
    setAdvancing(true);

    // Optimistic update
    const prev = [...allOrders];
    setAllOrders((list) =>
      list.map((o) =>
        String(o._id ?? o.id) === orderId ? { ...o, status: advanceTarget } : o
      )
    );

    try {
      await api.patch(`/vendor/orders/${orderId}/status`, { status: advanceTarget });
      showToast(t('vendor.orders.advanceSuccess'), 'success');
    } catch (err) {
      setAllOrders(prev); // rollback
      const msg = err.response?.data?.error?.message ?? err.response?.data?.message ?? t('common.error');
      showToast(msg, 'error');
    } finally {
      setAdvancing(false);
      setAdvanceOrder(null);
      setAdvanceTarget(null);
    }
  };

  // ── Cancel order ──────────────────────────────────────────────────────────
  const openCancel = (order) => {
    setSelOrder(null);
    setCancelOrder(order);
  };

  const handleCancel = async (reason) => {
    if (!cancelOrder) return;
    const orderId = String(cancelOrder._id ?? cancelOrder.id);
    setCancelling(true);

    const prev = [...allOrders];
    setAllOrders((list) =>
      list.map((o) =>
        String(o._id ?? o.id) === orderId ? { ...o, status: 'cancelled' } : o
      )
    );

    try {
      const body = { status: 'cancelled' };
      if (reason) body.reason = reason;
      await api.patch(`/vendor/orders/${orderId}/status`, body);
      showToast(t('vendor.orders.cancelSuccess'), 'success');
    } catch (err) {
      setAllOrders(prev); // rollback
      const msg = err.response?.data?.error?.message ?? err.response?.data?.message ?? t('common.error');
      showToast(msg, 'error');
    } finally {
      setCancelling(false);
      setCancelOrder(null);
    }
  };

  return (
    <div className="space-y-5">
      <Toast
        show={!!toast}
        variant={toastVariant}
        onDismiss={() => setToast(null)}
      >
        {toast}
      </Toast>

      {/* ── Stat chips ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {CHIPS.map(({ key, Icon, labelKey, colorCls }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`text-start rounded-[1.5rem] p-4 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)] transition hover:ring-2 ring-forest/20 ${tab === key ? 'ring-2 ring-forest/30' : ''}`}
          >
            <span className={`grid place-items-center w-9 h-9 rounded-2xl ${colorCls}`}>
              <Icon className="w-[18px] h-[18px]" />
            </span>
            <div className="text-2xl font-extrabold mt-3">{chipCounts[key] ?? 0}</div>
            <div className="text-xs text-slate-500 mt-0.5">{t(labelKey)}</div>
          </button>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="rounded-[1.75rem] bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] [backdrop-filter:blur(28px)_saturate(180%)] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)] overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-2 h-10 px-3 rounded-2xl bg-white/50 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 flex-1 min-w-[180px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('vendor.orders.searchPlaceholder')}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
          </div>

          {/* Status tab pills */}
          <div className="flex gap-1 p-1 rounded-2xl bg-white/50 dark:bg-white/5 overflow-x-auto no-scrollbar">
            {TABS.map(({ value, labelKey }) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-sm font-semibold transition ${
                  tab === value
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-forest'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>

          <span className="md:ms-auto text-sm text-slate-500 shrink-0">
            {filteredOrders.length} {t('vendor.orders.tabAll').toLowerCase()}
          </span>
        </div>

        {/* Table body */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-14">
            <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="mt-2 font-semibold text-slate-500">{t('vendor.orders.noOrders')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="text-slate-400 text-[11px] uppercase tracking-wide bg-white/30 dark:bg-white/[0.03]">
                <tr>
                  <th className="text-start font-semibold py-3 ps-4 pe-3">{t('vendor.orders.colOrder')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('vendor.orders.colCustomer')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('vendor.orders.colItems')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('vendor.orders.colTotal')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('vendor.orders.colDate')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('vendor.orders.colStatus')}</th>
                  <th className="pe-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o, idx) => {
                  const { orderNum, custName, city, status, subtotal, items, date } = resolveOrder(o);
                  const st = STATUS[status] ?? STATUS.placed;
                  // Key is derived directly from the raw object — not from resolveOrder's orderId —
                  // so no transformation step can accidentally strip the identifier.
                  // Fallback chain: _id → id → orderNumber (unique human-readable ID from parent
                  // order, always present even when the sub-order's own _id is omitted by the
                  // backend) → positional suffix used only when the API provides no identifier at all.
                  const rawId = String(o._id ?? o.id ?? o.orderNumber ?? '');
                  const rowKey = rawId || `order-row-${idx}`;
                  return (
                    <tr
                      key={rowKey}
                      className="border-t border-black/[0.06] dark:border-white/[0.08] hover:bg-white/40 dark:hover:bg-white/[0.03] transition cursor-pointer"
                      onClick={() => setSelOrder(o)}
                    >
                      <td className="py-3 ps-4 pe-3 font-semibold">#{orderNum}</td>
                      <td className="py-3 pe-3">
                        <div className="font-medium">{custName}</div>
                        {city && <div className="text-xs text-slate-500 mt-0.5">{city}</div>}
                      </td>
                      <td className="py-3 pe-3">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          {items.length}
                        </span>
                      </td>
                      <td className="py-3 pe-3 font-semibold">ETB {Number(subtotal).toLocaleString()}</td>
                      <td className="py-3 pe-3 text-slate-500 text-xs">{date}</td>
                      <td className="py-3 pe-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${st.badgeCls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dotCls}`} />
                          {t(st.labelKey)}
                        </span>
                      </td>
                      <td className="pe-4 py-3">
                        <ChevronRight className="w-4 h-4 text-slate-400 rtl:rotate-180 ms-auto" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail drawer ── */}
      {selOrder && (
        <OrderDrawer
          order={selOrder}
          onClose={() => setSelOrder(null)}
          onAdvance={openAdvance}
          onCancel={openCancel}
        />
      )}

      {/* ── Confirm advance modal ── */}
      {advanceOrder && (
        <ConfirmAdvanceModal
          order={advanceOrder}
          targetStatus={advanceTarget}
          onConfirm={handleAdvance}
          onClose={() => { setAdvanceOrder(null); setAdvanceTarget(null); }}
          loading={advancing}
        />
      )}

      {/* ── Cancel modal ── */}
      {cancelOrder && (
        <CancelModal
          order={cancelOrder}
          onConfirm={handleCancel}
          onClose={() => setCancelOrder(null)}
          loading={cancelling}
        />
      )}
    </div>
  );
}
