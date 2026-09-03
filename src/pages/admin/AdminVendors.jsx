import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Store, CheckCircle2, Clock, Ban,
  PauseCircle, PlayCircle,
  ChevronLeft, ChevronRight, User, Phone, Hash, MapPin, Calendar, BadgePercent, X,
} from 'lucide-react';
import api, { resolveAssetUrl } from '../../lib/api';
import { Spinner, Toast, Modal, Button } from '../../components/ui';

// ── helpers ──────────────────────────────────────────────────────────────────

const CHIPS = [
  { key: 'all',       Icon: Store,        colorCls: 'bg-blue-500/12 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',         labelKey: 'admin.vendors.tabAll' },
  { key: 'approved',  Icon: CheckCircle2, colorCls: 'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400', labelKey: 'admin.vendors.tabApproved' },
  { key: 'pending',   Icon: Clock,        colorCls: 'bg-amber-500/12 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',    labelKey: 'admin.vendors.tabPending' },
  { key: 'suspended', Icon: Ban,          colorCls: 'bg-black/5 text-slate-500 dark:bg-white/10 dark:text-slate-400',            labelKey: 'admin.vendors.tabSuspended' },
];

const STATUS_BADGE = {
  pending:   'bg-amber-500/12 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  approved:  'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  rejected:  'bg-crimson/10 text-crimson dark:bg-crimson/15',
  suspended: 'bg-black/5 text-slate-500 dark:bg-white/10 dark:text-slate-400',
};

// ── KYC / Vendor detail drawer ────────────────────────────────────────────────

function VendorDrawer({ vendor, onClose, onAction }) {
  const { t } = useTranslation();
  if (!vendor) return null;
  const kyc = vendor.kyc ?? {};
  const owner = vendor.userId ?? {};   // API returns populated userId object
  const initials = vendor.storeName?.[0]?.toUpperCase() ?? 'V';

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
          <h2 className="text-lg font-extrabold">{t('admin.vendors.kycDrawerTitle')}</h2>
          <button
            onClick={onClose}
            className="grid place-items-center w-9 h-9 rounded-xl bg-white/55 dark:bg-white/[0.055] border border-white/70 dark:border-white/10 hover:bg-white/70 transition"
            aria-label={t('common.cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Store card */}
        <div className="bg-white/55 dark:bg-white/[0.055] border border-white/70 dark:border-white/10 rounded-2xl p-4 flex items-center gap-3 mb-3">
          {vendor.logoUrl ? (
            <img
              src={resolveAssetUrl(vendor.logoUrl)}
              alt={vendor.storeName}
              className="w-14 h-14 rounded-2xl object-cover shrink-0"
            />
          ) : (
            <span className="grid place-items-center w-14 h-14 rounded-2xl bg-blue-500/12 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 font-extrabold text-xl shrink-0">
              {initials}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold truncate">{vendor.storeName}</div>
            <span
              className={`inline-block mt-1 ms-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[vendor.status] ?? STATUS_BADGE.pending}`}
            >
              {t(`admin.vendors.status${vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}`)}
            </span>
          </div>
        </div>

        {/* KYC detail rows */}
        <div className="bg-white/55 dark:bg-white/[0.055] border border-white/70 dark:border-white/10 rounded-2xl p-4 space-y-3 text-sm mb-3">
          {owner.name && (
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{owner.name}</span>
            </div>
          )}
          {owner.phone && (
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-mono">{owner.phone}</span>
            </div>
          )}
          {kyc.region && (
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{kyc.region}</span>
            </div>
          )}
          {kyc.tin && (
            <div className="flex items-center gap-2.5">
              <Hash className="w-4 h-4 text-slate-400 shrink-0" />
              <span>TIN {kyc.tin}</span>
            </div>
          )}
          {kyc.businessName && (
            <div className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{kyc.businessName}</span>
            </div>
          )}
          {kyc.businessType && (
            <div className="flex items-center gap-2.5">
              <BadgePercent className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{kyc.businessType}</span>
            </div>
          )}
          {kyc.docType && (
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{kyc.docType} · {kyc.docNumber}</span>
            </div>
          )}
          {vendor.createdAt && (
            <div className="flex items-center gap-2.5 text-slate-400 text-xs">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>{new Date(vendor.createdAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Action buttons — approval happens in /admin/approvals; here only suspend/unsuspend */}
        <div className="space-y-2">
          {vendor.status === 'approved' && (
            <button
              onClick={() => onAction('suspend', vendor)}
              className="w-full h-11 rounded-xl ring-1 ring-rose-400/40 text-rose-600 text-sm font-semibold hover:bg-rose-500/10 transition inline-flex items-center justify-center gap-1.5"
            >
              <PauseCircle className="w-4 h-4" />
              {t('admin.vendors.actionSuspend')}
            </button>
          )}
          {vendor.status === 'suspended' && (
            <button
              onClick={() => onAction('unsuspend', vendor)}
              className="w-full h-11 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition inline-flex items-center justify-center gap-1.5"
            >
              <PlayCircle className="w-4 h-4" />
              {t('admin.vendors.actionUnsuspend')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Confirm action modal ──────────────────────────────────────────────────────

function ConfirmModal({ action, vendor, onConfirm, onClose, loading }) {
  const { t } = useTranslation();
  if (!action || !vendor) return null;

  const titleKey = {
    suspend:   'admin.vendors.confirmSuspend',
    unsuspend: 'admin.vendors.confirmUnsuspend',
  }[action];

  const actionLabelKey = {
    suspend:   'admin.vendors.actionSuspend',
    unsuspend: 'admin.vendors.actionUnsuspend',
  }[action];

  const isDanger = action === 'suspend';

  return (
    <Modal open onClose={onClose} title={t(titleKey)}>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{vendor.storeName}</p>
      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`h-9 px-4 rounded-2xl text-sm font-semibold transition disabled:opacity-40 ${
            isDanger
              ? 'bg-rose-500 text-white hover:bg-rose-600'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? t('common.loading') : t(actionLabelKey)}
        </button>
      </div>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const LIMIT = 20;

export default function AdminVendors() {
  const { t } = useTranslation();

  const [tab, setTab]         = useState('all');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [vendors, setVendors] = useState([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  // Status counts for chips
  const [counts, setCounts] = useState({ all: 0, approved: 0, pending: 0, suspended: 0 });

  // Drawer / confirm state
  const [kycVendor, setKycVendor]     = useState(null);
  const [confirm, setConfirm]         = useState({ action: null, vendor: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Load per-status counts (called on mount and after each successful mutation)
  const loadCounts = useCallback(async () => {
    try {
      const [all, approved, pending, suspended] = await Promise.all([
        api.get('/admin/vendors', { params: { limit: 1 } }),
        api.get('/admin/vendors', { params: { limit: 1, status: 'approved' } }),
        api.get('/admin/vendors', { params: { limit: 1, status: 'pending' } }),
        api.get('/admin/vendors', { params: { limit: 1, status: 'suspended' } }),
      ]);
      setCounts({
        all:       all.data.total       ?? 0,
        approved:  approved.data.total  ?? 0,
        pending:   pending.data.total   ?? 0,
        suspended: suspended.data.total ?? 0,
      });
    } catch (_) {
      // Counts are decorative — fail silently
    }
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (tab !== 'all') params.status = tab;
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/admin/vendors', { params });
      setVendors(res.data.items ?? []);
      setTotal(res.data.total ?? 0);
      setPages(res.data.pages ?? 1);
    } catch (_) {
      setToast(t('admin.vendors.actionError'));
    } finally {
      setLoading(false);
    }
  }, [tab, search, page, t]);

  useEffect(() => { setPage(1); }, [tab, search]);
  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const handleAction = async () => {
    const { action, vendor } = confirm;
    if (!action || !vendor) return;
    const statusMap = { suspend: 'suspended', unsuspend: 'approved' };
    const newStatus = statusMap[action];
    const successKey = {
      suspend:   'admin.vendors.suspendSuccess',
      unsuspend: 'admin.vendors.unsuspendSuccess',
    }[action];

    // Optimistic: update badge immediately and close modal
    setVendors((prev) => prev.map((v) => v._id === vendor._id ? { ...v, status: newStatus } : v));
    setConfirm({ action: null, vendor: null });
    setActionLoading(true);
    try {
      await api.patch(`/admin/vendors/${vendor._id}/status`, { status: newStatus });
      setToast(t(successKey));
      await fetchVendors();
      await loadCounts();
    } catch (err) {
      setToast(err.response?.data?.error?.message ?? err.response?.data?.message ?? t('admin.vendors.actionError'));
      await fetchVendors(); // restore server-correct state
      await loadCounts();
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirm = (action, vendor) => {
    setKycVendor(null); // close drawer first
    setConfirm({ action, vendor });
  };

  return (
    <div className="space-y-5">
      <Toast show={!!toast}>{toast}</Toast>

      {/* ── Stat chips ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {CHIPS.map(({ key, Icon, colorCls, labelKey }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`text-start rounded-[1.5rem] p-4 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)] hover:bg-white/70 dark:hover:bg-white/[0.08] transition ring-1 ${
              tab === key ? 'ring-blue-500/40' : 'ring-transparent'
            }`}
          >
            <span className={`grid place-items-center w-9 h-9 rounded-2xl ${colorCls}`}>
              <Icon className="w-[18px] h-[18px]" />
            </span>
            <div className="text-2xl font-extrabold mt-3">{counts[key] ?? 0}</div>
            <div className="text-xs text-slate-500 mt-0.5">{t(labelKey)}</div>
          </button>
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
              placeholder={t('admin.vendors.searchPlaceholder')}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
          </div>
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value)}
            className="h-10 px-3 rounded-2xl bg-white/50 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-sm font-medium outline-none dark:text-slate-100"
          >
            <option value="all">{t('admin.vendors.tabAll')}</option>
            <option value="pending">{t('admin.vendors.tabPending')}</option>
            <option value="approved">{t('admin.vendors.tabApproved')}</option>
            <option value="rejected">{t('admin.vendors.tabRejected')}</option>
            <option value="suspended">{t('admin.vendors.tabSuspended')}</option>
          </select>
          <span className="md:ms-auto text-sm text-slate-500">
            {total} {t('admin.vendors.title').toLowerCase()}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-14">
            <Store className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="mt-2 font-semibold text-slate-500">{t('admin.vendors.noVendors')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="text-slate-400 text-[11px] uppercase tracking-wide bg-white/30 dark:bg-white/[0.03]">
                <tr>
                  <th className="text-start font-semibold py-3 ps-4 pe-3">{t('admin.vendors.colStore')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('admin.vendors.colOwner')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('admin.vendors.colPhone')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('admin.vendors.colPlan')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('admin.vendors.colStatus')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('admin.vendors.colJoined')}</th>
                  <th className="pe-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => {
                  const initials = v.storeName?.[0]?.toUpperCase() ?? 'V';
                  const joined = v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '—';
                  const owner = v.userId ?? {};   // API returns populated userId object
                  const badgeCls = STATUS_BADGE[v.status] ?? STATUS_BADGE.pending;
                  return (
                    <tr
                      key={v._id}
                      className="border-t border-black/[0.06] dark:border-white/[0.08] hover:bg-white/40 dark:hover:bg-white/[0.03] transition cursor-pointer"
                      onClick={() => setKycVendor(v)}
                    >
                      <td className="py-3 ps-4 pe-3">
                        <div className="flex items-center gap-3">
                          {v.logoUrl ? (
                            <img src={resolveAssetUrl(v.logoUrl)} alt={v.storeName} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                          ) : (
                            <span className="grid place-items-center w-9 h-9 rounded-xl bg-blue-500/12 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-extrabold text-sm shrink-0">
                              {initials}
                            </span>
                          )}
                          <div>
                            <div className="font-semibold">{v.storeName}</div>
                            {v.slug && <div className="text-[11px] text-slate-400">/{v.slug}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pe-3 text-slate-600 dark:text-slate-300">{owner.name ?? '—'}</td>
                      <td className="py-3 pe-3 font-mono text-xs text-slate-500">{owner.phone ?? '—'}</td>
                      <td className="py-3 pe-3 text-slate-400 text-xs">—</td>
                      <td className="py-3 pe-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${badgeCls}`}>
                          {t(`admin.vendors.status${v.status.charAt(0).toUpperCase() + v.status.slice(1)}`)}
                        </span>
                      </td>
                      <td className="py-3 pe-3 text-slate-400 text-xs">{joined}</td>
                      <td className="pe-4 py-3 text-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); setKycVendor(v); }}
                          className="grid place-items-center w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 ms-auto transition"
                          aria-label={t('admin.vendors.actionViewKyc')}
                        >
                          <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-between border-t border-black/[0.06] dark:border-white/[0.08] px-4 py-3">
            <span className="text-xs text-slate-500">{total} {t('admin.vendors.title').toLowerCase()}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="grid place-items-center w-8 h-8 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition" aria-label={t('browse.prevPage')}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-500 px-2">{page} / {pages}</span>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="grid place-items-center w-8 h-8 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition" aria-label={t('browse.nextPage')}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Vendor detail/KYC drawer ── */}
      {kycVendor && (
        <VendorDrawer
          vendor={kycVendor}
          onClose={() => setKycVendor(null)}
          onAction={openConfirm}
        />
      )}

      {/* ── Confirm action modal ── */}
      <ConfirmModal
        action={confirm.action}
        vendor={confirm.vendor}
        onConfirm={handleAction}
        onClose={() => setConfirm({ action: null, vendor: null })}
        loading={actionLoading}
      />
    </div>
  );
}
