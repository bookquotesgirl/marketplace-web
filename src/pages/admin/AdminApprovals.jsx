import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle, XCircle, Clock, Store,
  User, Phone, Hash, MapPin, Calendar,
} from 'lucide-react';
import api, { resolveAssetUrl } from '../../lib/api';
import { Spinner, Toast, Modal, Button } from '../../components/ui';

// ── constants ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'pending',  labelKey: 'admin.approvals.tabPending',  Icon: Clock },
  { key: 'approved', labelKey: 'admin.approvals.tabApproved', Icon: CheckCircle },
  { key: 'rejected', labelKey: 'admin.approvals.tabRejected', Icon: XCircle },
];

const CHIP_COLOR = {
  pending:  'bg-amber-500/12 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  approved: 'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  rejected: 'bg-crimson/10 text-crimson dark:bg-crimson/15',
};

const REJECT_REASON_KEYS = [
  'admin.approvals.reason1',
  'admin.approvals.reason2',
  'admin.approvals.reason3',
  'admin.approvals.reason4',
  'admin.approvals.reason5',
];

// ── Approval card ─────────────────────────────────────────────────────────────

function ApprovalCard({ vendor, onApprove, onReject, actionLoading }) {
  const { t } = useTranslation();
  const kyc    = vendor.kyc    ?? {};
  const owner  = vendor.userId ?? {};
  const initial = vendor.storeName?.[0]?.toUpperCase() ?? 'V';
  const joined  = vendor.createdAt
    ? new Date(vendor.createdAt).toLocaleDateString()
    : '—';

  return (
    <div className="rounded-[1.75rem] bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] [backdrop-filter:blur(28px)_saturate(180%)] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)] p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        {vendor.logoUrl ? (
          <img
            src={resolveAssetUrl(vendor.logoUrl)}
            alt={vendor.storeName}
            className="w-14 h-14 rounded-2xl object-cover ring-1 ring-white/70 shrink-0"
          />
        ) : (
          <span className="grid place-items-center w-14 h-14 rounded-2xl bg-blue-500/12 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 font-extrabold text-xl shrink-0">
            {initial}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{vendor.storeName}</div>
          {vendor.plan?.name && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/12 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
              {vendor.plan.name}
            </span>
          )}
        </div>
      </div>

      {/* KYC details */}
      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
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
        {(kyc.businessType || kyc.region) && (
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{[kyc.businessType, kyc.region].filter(Boolean).join(' · ')}</span>
          </div>
        )}
        {(kyc.docNumber || kyc.tin) && (
          <div className="flex items-center gap-2.5">
            <Hash className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{t('admin.approvals.tin')} {kyc.docNumber ?? kyc.tin}</span>
          </div>
        )}
        <div className="flex items-center gap-2.5 text-slate-400 text-xs">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>{t('admin.approvals.submitted')} {joined}</span>
        </div>
      </div>

      {/* Pending: approve / reject */}
      {vendor.status === 'pending' && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
          <button
            onClick={() => onApprove(vendor)}
            disabled={actionLoading}
            className="h-10 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-40 inline-flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            {t('admin.approvals.actionApprove')}
          </button>
          <button
            onClick={() => onReject(vendor)}
            disabled={actionLoading}
            className="h-10 rounded-xl ring-1 ring-rose-400/40 text-rose-600 text-sm font-semibold hover:bg-rose-500/10 transition disabled:opacity-40 inline-flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            {t('admin.approvals.actionReject')}
          </button>
        </div>
      )}

      {/* Approved: decided date */}
      {vendor.status === 'approved' && vendor.decidedAt && (
        <div className="text-xs text-slate-400 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
          {t('admin.approvals.decidedOn')} {new Date(vendor.decidedAt).toLocaleDateString()}
        </div>
      )}

      {/* Rejected: reason + date */}
      {vendor.status === 'rejected' && (
        <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] space-y-1">
          {(vendor.rejectionReason || vendor.reason) && (
            <div className="text-xs text-rose-500">
              {t('admin.approvals.reason')}: {vendor.rejectionReason ?? vendor.reason}
            </div>
          )}
          {vendor.decidedAt && (
            <div className="text-xs text-slate-400">
              {t('admin.approvals.decidedOn')} {new Date(vendor.decidedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminApprovals() {
  const { t } = useTranslation();

  const [tab, setTab]             = useState('pending');
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);
  const [counts, setCounts]       = useState({ pending: 0, approved: 0, rejected: 0 });
  const [actionLoading, setActionLoading] = useState(false);

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNote,   setRejectNote]   = useState('');

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  // Counts (pending / approved / rejected)
  const loadCounts = useCallback(async () => {
    try {
      const [p, a, r] = await Promise.all([
        api.get('/admin/vendors', { params: { limit: 1, status: 'pending' } }),
        api.get('/admin/vendors', { params: { limit: 1, status: 'approved' } }),
        api.get('/admin/vendors', { params: { limit: 1, status: 'rejected' } }),
      ]);
      setCounts({
        pending:  p.data.total ?? 0,
        approved: a.data.total ?? 0,
        rejected: r.data.total ?? 0,
      });
    } catch (_) { /* decorative — fail silently */ }
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  // Vendor list for current tab
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/vendors', { params: { status: tab, limit: 50 } });
      setItems(res.data.items ?? []);
    } catch (_) {
      setToast(t('admin.approvals.actionError'));
    } finally {
      setLoading(false);
    }
  }, [tab, t]);

  useEffect(() => { fetchList(); }, [fetchList]);

  // Approve — optimistic removal then server sync
  const handleApprove = async (vendor) => {
    if (actionLoading) return;
    const id = vendor._id ?? vendor.id;
    // Optimistic: vendor disappears from current tab immediately
    setItems((prev) => prev.filter((v) => (v._id ?? v.id) !== id));
    setActionLoading(true);
    try {
      await api.patch(`/admin/vendors/${id}/status`, { status: 'approved' });
      setToast(t('admin.approvals.approveSuccess'));
      await fetchList();
      await loadCounts();
    } catch (err) {
      await fetchList(); // restore correct state on failure
      setToast(
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        t('admin.approvals.actionError')
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openReject = (vendor) => {
    setRejectReason(t('admin.approvals.reason1'));
    setRejectNote('');
    setRejectTarget(vendor);
  };

  const closeReject = () => {
    setRejectTarget(null);
    setRejectReason('');
    setRejectNote('');
  };

  // Reject with reason — optimistic removal then server sync
  const handleRejectConfirm = async () => {
    if (!rejectTarget || actionLoading) return;
    const id = rejectTarget._id ?? rejectTarget.id;
    const reason = rejectNote.trim()
      ? `${rejectReason}: ${rejectNote.trim()}`
      : rejectReason;
    // Optimistic: vendor disappears and modal closes immediately
    setItems((prev) => prev.filter((v) => (v._id ?? v.id) !== id));
    closeReject();
    setActionLoading(true);
    try {
      await api.patch(`/admin/vendors/${id}/status`, {
        status: 'rejected',
        reason,
      });
      setToast(t('admin.approvals.rejectSuccess'));
      await fetchList();
      await loadCounts();
    } catch (err) {
      await fetchList(); // restore correct state on failure
      setToast(
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        t('admin.approvals.actionError')
      );
    } finally {
      setActionLoading(false);
    }
  };

  const reasonOptions = REJECT_REASON_KEYS.map((k) => t(k));

  return (
    <div className="space-y-5">
      <Toast show={!!toast}>{toast}</Toast>

      {/* ── Reject reason modal ── */}
      <Modal
        open={!!rejectTarget}
        onClose={closeReject}
        title={t('admin.approvals.rejectTitle')}
      >
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {rejectTarget?.storeName}
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              {t('admin.approvals.rejectReason')}
            </label>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl ring-1 ring-black/10 dark:ring-white/15 bg-white/70 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-600 text-sm"
            >
              {reasonOptions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              {t('admin.approvals.rejectNote')}
            </label>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              placeholder={t('admin.approvals.rejectNotePh')}
              className="w-full px-3.5 py-3 rounded-xl ring-1 ring-black/10 dark:ring-white/15 bg-white/70 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-600 text-sm resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-5">
          <Button variant="ghost" size="sm" onClick={closeReject} disabled={actionLoading}>
            {t('common.cancel')}
          </Button>
          <button
            onClick={handleRejectConfirm}
            disabled={actionLoading}
            className="h-9 px-4 rounded-2xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition disabled:opacity-40"
          >
            {actionLoading ? t('common.loading') : t('admin.approvals.rejectConfirm')}
          </button>
        </div>
      </Modal>

      {/* ── Stat chips ── */}
      <div className="grid grid-cols-3 gap-4">
        {TABS.map(({ key, labelKey, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`text-start rounded-[1.5rem] p-4 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)] hover:bg-white/70 dark:hover:bg-white/[0.08] transition ring-1 ${
              tab === key ? 'ring-blue-500/40' : 'ring-transparent'
            }`}
          >
            <span className={`grid place-items-center w-9 h-9 rounded-2xl ${CHIP_COLOR[key]}`}>
              <Icon className="w-[18px] h-[18px]" />
            </span>
            <div className="text-2xl font-extrabold mt-3">{counts[key] ?? 0}</div>
            <div className="text-xs text-slate-500 mt-0.5">{t(labelKey)}</div>
          </button>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex items-center gap-1.5 rounded-2xl bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] border border-white/70 dark:border-white/10 p-1.5 w-fit">
        {TABS.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            {t(labelKey)}
            {counts[key] > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                tab === key
                  ? 'bg-white/25 text-white'
                  : 'bg-black/8 text-slate-600 dark:bg-white/10 dark:text-slate-300'
              }`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Card grid ── */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-14">
          <Store className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="mt-2 font-semibold text-slate-500">{t('admin.approvals.noApprovals')}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((v) => (
            <ApprovalCard
              key={v._id ?? v.id}
              vendor={v}
              onApprove={handleApprove}
              onReject={openReject}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
