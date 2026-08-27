import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, ShoppingBag, Clock, PackageCheck, AlertCircle,
  User, Store, Wallet, Package, Printer,
  ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import api from '../../lib/api';
import { Spinner, Toast, Modal, Button } from '../../components/ui';

// ── helpers ──────────────────────────────────────────────────────────────────

// API status values → display config
const STATUS_DISPLAY = {
  placed:    { labelKey: 'admin.orders.statusNew',        badgeCls: 'bg-amber-500/12 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' },
  confirmed: { labelKey: 'admin.orders.statusProcessing', badgeCls: 'bg-blue-500/12 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400' },
  shipped:   { labelKey: 'admin.orders.statusShipped',    badgeCls: 'bg-sky-500/12 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400' },
  delivered: { labelKey: 'admin.orders.statusDelivered',  badgeCls: 'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' },
  cancelled: { labelKey: 'admin.orders.statusCancelled',  badgeCls: 'bg-slate-400/15 text-slate-500 dark:bg-white/10 dark:text-slate-400' },
  disputed:  { labelKey: 'admin.orders.statusDisputed',   badgeCls: 'bg-rose-500/12 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400' },
};

// Tab pills — value matches the `status` query param sent to the backend
const TABS = [
  { value: 'all',       labelKey: 'admin.orders.tabAll' },
  { value: 'placed',    labelKey: 'admin.orders.tabNew' },
  { value: 'confirmed', labelKey: 'admin.orders.tabProcessing' },
  { value: 'shipped',   labelKey: 'admin.orders.tabShipped' },
  { value: 'delivered', labelKey: 'admin.orders.tabDelivered' },
  { value: 'cancelled', labelKey: 'admin.orders.tabCancelled' },
  { value: 'disputed',  labelKey: 'admin.orders.tabDisputed' },
];

const CHIPS = [
  { key: 'total',      Icon: ShoppingBag,  colorCls: 'bg-blue-500/12 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',         labelKey: 'admin.orders.chipOrders' },
  { key: 'inProgress', Icon: Clock,        colorCls: 'bg-amber-500/12 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',     labelKey: 'admin.orders.chipInProgress' },
  { key: 'delivered',  Icon: PackageCheck, colorCls: 'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400', labelKey: 'admin.orders.chipDelivered' },
  { key: 'disputed',   Icon: AlertCircle,  colorCls: 'bg-rose-500/12 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',         labelKey: 'admin.orders.chipDisputed' },
];

// ── field helpers ─────────────────────────────────────────────────────────────

// Derive display-ready fields from the actual backend response shape.
// Backend: { _id, orderNumber, buyerId, subOrders[], status?, total, paymentStatus, paymentMethod, createdAt }
// Status lives in subOrders[].status (and optionally at the top level).
function resolveOrder(o) {
  const orderId    = String(o._id ?? o.id);
  const orderNum   = o.orderNumber ?? orderId;
  const custName   = o.buyerId?.name ?? '—';
  // Collect distinct vendor names from subOrders
  const vendors    = (o.subOrders ?? []).map((s) => s.vendorName).filter(Boolean);
  const vendorName = vendors.length > 0 ? vendors.join(', ') : '—';
  // Status: prefer top-level field, fall back to first subOrder
  const status     = o.status ?? o.subOrders?.[0]?.status ?? 'placed';
  const total      = o.total ?? 0;
  const payment    = o.paymentStatus ?? o.paymentMethod ?? '—';
  const date       = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—';
  const itemCount  = (o.subOrders ?? []).reduce((s, sub) => s + (sub.items?.length ?? 0), 0);
  return { orderId, orderNum, custName, vendorName, status, total, payment, date, itemCount };
}

// Extract pagination total from the actual response shape:
// Actual: { success, data: [...], pagination: { total, page, pages } }
// Legacy: { items: [...], total, pages }
function extractList(res)  { return res.data.data ?? res.data.items ?? []; }
function extractTotal(res) { return res.data.pagination?.total ?? res.data.total ?? 0; }

// ── Order detail drawer ───────────────────────────────────────────────────────

function OrderDrawer({ order, onClose, onDispute }) {
  const { t } = useTranslation();
  if (!order) return null;

  const { orderNum, custName, vendorName, status, total, payment, date, itemCount } = resolveOrder(order);
  const st         = STATUS_DISPLAY[status] ?? STATUS_DISPLAY.placed;
  const canDispute = !['disputed', 'cancelled', 'delivered'].includes(status);

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-900/30 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="absolute inset-y-0 end-0 w-full max-w-md overflow-y-auto bg-white/72 dark:bg-white/[0.08] backdrop-blur-[30px] [backdrop-filter:blur(30px)_saturate(190%)] border-s border-white/80 dark:border-white/12 shadow-[0_18px_50px_-18px_rgba(30,50,90,.24)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-extrabold">#{orderNum}</h2>
            <p className="text-xs text-slate-500">{date} · {vendorName}</p>
          </div>
          <button
            onClick={onClose}
            className="grid place-items-center w-9 h-9 rounded-xl bg-white/55 dark:bg-white/[0.055] border border-white/70 dark:border-white/10 hover:bg-white/70 transition"
            aria-label={t('common.cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status + details card */}
        <div className="bg-white/55 dark:bg-white/[0.055] border border-white/70 dark:border-white/10 rounded-2xl p-4 mb-3">
          <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${st.badgeCls}`}>
            {t(st.labelKey)}
          </span>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{custName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{vendorName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{payment}</span>
            </div>
            {itemCount > 0 && (
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{itemCount} {t('admin.orders.drawerItems')}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between items-baseline mt-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
            <span className="font-bold text-sm">{t('admin.orders.drawerTotal')}</span>
            <span className="text-lg font-extrabold text-blue-600">
              ETB {Number(total).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className={`grid gap-2 ${canDispute ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <button className="inline-flex items-center justify-center gap-1.5 h-11 rounded-xl bg-white/55 dark:bg-white/[0.055] border border-white/70 dark:border-white/10 text-sm font-semibold hover:bg-white/70 transition">
            <Printer className="w-4 h-4" />
            {t('admin.orders.actionInvoice')}
          </button>
          {canDispute && (
            <button
              onClick={() => onDispute(order)}
              className="inline-flex items-center justify-center gap-1.5 h-11 rounded-xl bg-rose-500/12 text-rose-600 ring-1 ring-rose-400/30 text-sm font-semibold hover:bg-rose-500/20 transition"
            >
              <AlertCircle className="w-4 h-4" />
              {t('admin.orders.actionDispute')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

// Use a large limit so client-side search works across all orders in the tab.
// The API contract (GET /admin/orders) does not document a `search` param —
// so search is implemented client-side against the full tab result set.
const FETCH_LIMIT = 500;

export default function AdminOrders() {
  const { t } = useTranslation();

  const [tab, setTab]           = useState('all');
  const [search, setSearch]     = useState('');
  const [allOrders, setAllOrders] = useState([]);   // all orders for current tab
  const [total, setTotal]       = useState(0);       // server total (for chip / count display)
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);

  const [chips, setChips]       = useState({ total: 0, inProgress: 0, delivered: 0, disputed: 0 });

  const [selOrder, setSelOrder]         = useState(null);
  const [disputeOrder, setDisputeOrder] = useState(null);
  const [disputing, setDisputing]       = useState(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  // ── Client-side search ────────────────────────────────────────────────────
  // The API does not support a `search` query param.  We filter the full tab
  // result set that was already loaded, matching across all relevant fields.
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allOrders;
    return allOrders.filter((o) => {
      const num    = (o.orderNumber ?? String(o._id ?? '')).toLowerCase();
      const name   = (o.buyerId?.name  ?? '').toLowerCase();
      const phone  = (o.buyerId?.phone ?? '').toLowerCase();
      const email  = (o.buyerId?.email ?? '').toLowerCase();
      const vendor = (o.subOrders ?? []).some((s) =>
        (s.vendorName ?? '').toLowerCase().includes(q)
      );
      return num.includes(q) || name.includes(q) || phone.includes(q) || email.includes(q) || vendor;
    });
  }, [allOrders, search]);

  // ── Chip counts ───────────────────────────────────────────────────────────
  useEffect(() => {
    const loadChips = async () => {
      try {
        const [all, placed, confirmed, delivered, disputed] = await Promise.all([
          api.get('/admin/orders', { params: { limit: 1 } }),
          api.get('/admin/orders', { params: { limit: 1, status: 'placed' } }),
          api.get('/admin/orders', { params: { limit: 1, status: 'confirmed' } }),
          api.get('/admin/orders', { params: { limit: 1, status: 'delivered' } }),
          api.get('/admin/orders', { params: { limit: 1, status: 'disputed' } }),
        ]);
        setChips({
          total:      extractTotal(all),
          inProgress: extractTotal(placed) + extractTotal(confirmed),
          delivered:  extractTotal(delivered),
          disputed:   extractTotal(disputed),
        });
      } catch {
        // Chip counts are decorative — fail silently
      }
    };
    loadChips();
  }, []);

  // ── Fetch orders for current tab ──────────────────────────────────────────
  // We fetch all (up to FETCH_LIMIT) to enable full client-side search.
  // The API contract params for GET /admin/orders: status, vendor, dateFrom, dateTo.
  // `page` and `limit` are sent as undocumented-but-working params.
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: FETCH_LIMIT };
      if (tab !== 'all') params.status = tab;
      const res = await api.get('/admin/orders', { params });
      setAllOrders(extractList(res));
      setTotal(extractTotal(res));
    } catch (err) {
      const msg = err.response?.data?.error?.message ?? err.response?.data?.message ?? t('common.error');
      setToast(msg);
    } finally {
      setLoading(false);
    }
  }, [tab, t]);

  // Clear search whenever the tab changes so stale query doesn't hide results
  useEffect(() => { setSearch(''); }, [tab]);
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Mark order as disputed ────────────────────────────────────────────────
  // API contract: PATCH /api/admin/orders/:id  { "status": "disputed" }
  // Note: the backend returns 404 if this endpoint hasn't been deployed yet.
  // The error is surfaced to the user; no optimistic update on failure.
  const handleDispute = async () => {
    if (!disputeOrder) return;
    const orderId = String(disputeOrder._id ?? disputeOrder.id);
    setDisputing(true);
    try {
      await api.patch(`/admin/orders/${orderId}`, { status: 'disputed' });
      // Update the order in local state immediately — no page refresh needed
      setAllOrders((prev) =>
        prev
          .map((o) =>
            String(o._id ?? o.id) === orderId ? { ...o, status: 'disputed' } : o
          )
          .filter((o) => {
            if (tab === 'all') return true;
            const st = o.status ?? o.subOrders?.[0]?.status;
            return st === tab;
          })
      );
      setSelOrder(null);
      setDisputeOrder(null);
      setToast(t('admin.orders.disputeSuccess'));
    } catch (err) {
      // Surface the actual API error — do not fake success
      const msg = err.response?.data?.error?.message ?? err.response?.data?.message ?? t('common.error');
      setToast(msg);
    } finally {
      setDisputing(false);
    }
  };

  const visibleCount = search.trim() ? filteredOrders.length : total;

  return (
    <div className="space-y-5">
      <Toast show={!!toast}>{toast}</Toast>

      {/* ── Stat chips ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {CHIPS.map(({ key, Icon, colorCls, labelKey }) => (
          <div
            key={key}
            className="rounded-[1.5rem] p-4 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)]"
          >
            <span className={`grid place-items-center w-9 h-9 rounded-2xl ${colorCls}`}>
              <Icon className="w-[18px] h-[18px]" />
            </span>
            <div className="text-2xl font-extrabold mt-3">{chips[key].toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-0.5">{t(labelKey)}</div>
          </div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="rounded-[1.75rem] bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] [backdrop-filter:blur(28px)_saturate(180%)] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)] overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-2 h-10 px-3 rounded-2xl bg-white/50 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 flex-1 min-w-[160px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.orders.searchPlaceholder')}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
          </div>

          {/* Status tab pills — each triggers a server fetch for that status */}
          <div className="flex gap-1 p-1 rounded-2xl bg-white/50 dark:bg-white/5 overflow-x-auto no-scrollbar">
            {TABS.map(({ value, labelKey }) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-sm font-semibold transition ${
                  tab === value
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>

          <span className="md:ms-auto text-sm text-slate-500 shrink-0">
            {visibleCount} {t('admin.orders.colOrder').toLowerCase()}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-14">
            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="mt-2 font-semibold text-slate-500">{t('admin.orders.noOrders')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[780px]">
              <thead className="text-slate-400 text-[11px] uppercase tracking-wide bg-white/30 dark:bg-white/[0.03]">
                <tr>
                  <th className="text-start font-semibold py-3 ps-4 pe-3">{t('admin.orders.colOrder')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('admin.orders.colCustomer')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('admin.orders.colVendor')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('admin.orders.colTotal')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('admin.orders.colPayment')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('admin.orders.colDate')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('admin.orders.colStatus')}</th>
                  <th className="pe-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => {
                  const { orderId, orderNum, custName, vendorName, status, total, payment, date } = resolveOrder(o);
                  const st = STATUS_DISPLAY[status] ?? STATUS_DISPLAY.placed;
                  return (
                    <tr
                      key={orderId}
                      className="border-t border-black/[0.06] dark:border-white/[0.08] hover:bg-white/40 dark:hover:bg-white/[0.03] transition cursor-pointer"
                      onClick={() => setSelOrder(o)}
                    >
                      <td className="py-3 ps-4 pe-3 font-semibold">#{orderNum}</td>
                      <td className="py-3 pe-3 text-slate-600 dark:text-slate-300">{custName}</td>
                      <td className="py-3 pe-3">
                        <span className="text-blue-600 font-semibold">{vendorName}</span>
                      </td>
                      <td className="py-3 pe-3 font-semibold">ETB {Number(total).toLocaleString()}</td>
                      <td className="py-3 pe-3 text-slate-500 text-xs">{payment}</td>
                      <td className="py-3 pe-3 text-slate-500">{date}</td>
                      <td className="py-3 pe-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${st.badgeCls}`}>
                          {t(st.labelKey)}
                        </span>
                      </td>
                      <td className="pe-4 py-3 text-end">
                        <ChevronRight className="w-4 h-4 text-slate-400 rtl:rotate-180 ms-auto" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination — shown only when not searching and server has more than one page */}
        {!loading && !search.trim() && allOrders.length < total && (
          <div className="flex items-center justify-between border-t border-black/[0.06] dark:border-white/[0.08] px-4 py-3">
            <span className="text-xs text-slate-500">{total} {t('admin.orders.colOrder').toLowerCase()}</span>
            <div className="flex items-center gap-1">
              <ChevronLeft className="w-4 h-4 text-slate-300" />
              <span className="text-xs text-slate-500 px-2">1 / 1</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </div>
        )}
      </div>

      {/* ── Order detail drawer ── */}
      {selOrder && (
        <OrderDrawer
          order={selOrder}
          onClose={() => setSelOrder(null)}
          onDispute={(o) => { setSelOrder(null); setDisputeOrder(o); }}
        />
      )}

      {/* ── Confirm dispute modal ── */}
      {disputeOrder && (
        <Modal open onClose={() => setDisputeOrder(null)} title={t('admin.orders.confirmDispute')}>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            #{disputeOrder.orderNumber ?? String(disputeOrder._id ?? disputeOrder.id)}
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setDisputeOrder(null)} disabled={disputing}>
              {t('common.cancel')}
            </Button>
            <button
              onClick={handleDispute}
              disabled={disputing}
              className="h-9 px-4 rounded-2xl text-sm font-semibold bg-rose-500 text-white hover:bg-rose-600 transition disabled:opacity-40"
            >
              {disputing ? t('common.loading') : t('admin.orders.actionDispute')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
