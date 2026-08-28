import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, Store, CheckCircle2, AlertCircle } from 'lucide-react';
import { Toast, Modal, Spinner, Button, Input } from '../../components/ui';
import api from '../../lib/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtDate(str) {
  return str ? new Date(str).toLocaleDateString() : '—';
}

function fmtPeriod(start, end) {
  if (!start) return '—';
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}

/** Safely resolve vendor display name from a populated or null vendorId field */
function vendorName(item, unknown) {
  if (!item.vendorId) return unknown;
  if (typeof item.vendorId === 'object') return item.vendorId.storeName ?? unknown;
  return unknown;
}

function StatusBadge({ status, t }) {
  const paid = status === 'paid';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
        paid
          ? 'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
          : 'bg-amber-500/12 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
      }`}
    >
      {paid
        ? <CheckCircle2 className="w-3 h-3" />
        : <AlertCircle className="w-3 h-3" />}
      {paid ? t('admin.payouts.statusPaid') : t('admin.payouts.statusPending')}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminPayouts() {
  const { t } = useTranslation();

  // pending balances
  const [pending, setPending] = useState({ totalPending: 0, vendors: [] });
  // payout history
  const [history, setHistory] = useState([]);
  const [histTotal, setHistTotal] = useState(0);
  const [histLoading, setHistLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // payout modal state
  const [payoutVendor, setPayoutVendor] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const loadPending = useCallback(async () => {
    try {
      const res = await api.get('/admin/payouts/pending');
      setPending({
        totalPending: res.data.totalPending ?? 0,
        vendors: res.data.vendors ?? [],
      });
    } catch {
      setToast(t('common.error'));
    }
  }, [t]);

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const res = await api.get('/admin/payouts');
      setHistory(res.data.items ?? []);
      setHistTotal(res.data.total ?? 0);
    } catch {
      setToast(t('common.error'));
    } finally {
      setHistLoading(false);
    }
  }, [t]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadPending(), loadHistory()]).finally(() => setLoading(false));
  }, [loadPending, loadHistory]);

  const openPayout = (vendor) => {
    setPayoutVendor(vendor);
    setPayAmount(String(vendor.balance));
    setPayRef('');
    setPayNotes('');
    setPayError('');
  };

  const handlePayout = async () => {
    const amount = Number(payAmount);
    if (!amount || amount <= 0 || amount > payoutVendor.balance) {
      setPayError(t('admin.payouts.actionError'));
      return;
    }
    setProcessing(true);
    setPayError('');
    try {
      const body = { vendorId: payoutVendor.id, amount };
      if (payRef.trim())   body.reference = payRef.trim();
      if (payNotes.trim()) body.notes     = payNotes.trim();

      const res = await api.post('/admin/payouts', body);
      const newBalance  = res.data.vendor?.newBalance ?? (payoutVendor.balance - amount);
      const newRecord   = res.data.payout;

      // Update pending list
      setPending((prev) => ({
        totalPending: Math.max(0, prev.totalPending - amount),
        vendors:
          newBalance <= 0
            ? prev.vendors.filter((v) => v.id !== payoutVendor.id)
            : prev.vendors.map((v) =>
                v.id === payoutVendor.id ? { ...v, balance: newBalance } : v
              ),
      }));

      // Prepend new record to history
      if (newRecord) {
        setHistory((prev) => [newRecord, ...prev]);
        setHistTotal((prev) => prev + 1);
      }

      setPayoutVendor(null);
      setToast(t('admin.payouts.payoutSuccess'));
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        t('admin.payouts.actionError');
      setPayError(msg);
    } finally {
      setProcessing(false);
    }
  };

  const chips = [
    {
      Icon: Wallet,
      label: t('admin.payouts.chipPending'),
      value: `ETB ${Number(pending.totalPending).toLocaleString()}`,
    },
    {
      Icon: Store,
      label: t('admin.payouts.chipVendors'),
      value: String(pending.vendors.length),
    },
    {
      Icon: CheckCircle2,
      label: t('admin.payouts.chipPaid'),
      value: String(histTotal),
    },
  ];

  const modalTitle = payoutVendor
    ? t('admin.payouts.confirmPayout').replace('{{vendor}}', payoutVendor.storeName)
    : '';

  return (
    <>
      <Toast show={!!toast}>{toast}</Toast>

      {/* Payout confirm modal */}
      <Modal
        open={!!payoutVendor}
        onClose={() => { if (!processing) setPayoutVendor(null); }}
        title={modalTitle}
      >
        {payoutVendor && (
          <div className="space-y-4 mt-1">
            {/* Current balance pill */}
            <div className="rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] px-4 py-3 text-sm flex items-center justify-between">
              <span className="text-slate-500">{t('admin.payouts.currentBalance')}</span>
              <span className="font-extrabold">ETB {Number(payoutVendor.balance).toLocaleString()}</span>
            </div>

            <Input
              label={t('admin.payouts.amountLabel')}
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              min="1"
              max={payoutVendor.balance}
            />
            <Input
              label={t('admin.payouts.referenceLabel')}
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              placeholder={t('admin.payouts.referencePlaceholder')}
            />
            <Input
              label={t('admin.payouts.notesLabel')}
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder={t('admin.payouts.notesPlaceholder')}
            />

            {payError && <p className="text-sm text-crimson">{payError}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                onClick={() => setPayoutVendor(null)}
                disabled={processing}
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={handlePayout} disabled={processing}>
                {processing ? t('admin.payouts.processing') : t('admin.payouts.payOut')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="w-8 h-8" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {chips.map(({ Icon, label, value }) => (
              <div
                key={label}
                className="rounded-[1.5rem] p-4 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] [backdrop-filter:blur(28px)_saturate(180%)] border border-white/70 dark:border-white/10"
              >
                <span className="grid place-items-center w-9 h-9 rounded-2xl bg-blue-500/12 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <div className="text-2xl font-extrabold mt-3 tracking-tight">{value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Pending vendor balances */}
          <div>
            <h2 className="text-base font-bold mb-3">{t('admin.payouts.pendingTitle')}</h2>
            {pending.vendors.length === 0 ? (
              <p className="text-slate-400 text-sm py-6 text-center">
                {t('admin.payouts.noPending')}
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pending.vendors.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-[1.5rem] p-4 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] border border-white/70 dark:border-white/10 flex items-center gap-3"
                  >
                    {/* Avatar initial */}
                    <span className="grid place-items-center w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-extrabold shrink-0 select-none">
                      {(v.storeName ?? '?')[0].toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{v.storeName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        ETB {Number(v.balance).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openPayout(v)}
                      className="shrink-0"
                    >
                      {t('admin.payouts.payOut')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payout history */}
          <div>
            <h2 className="text-base font-bold mb-3">{t('admin.payouts.historyTitle')}</h2>
            <div className="rounded-[1.75rem] bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] [backdrop-filter:blur(28px)_saturate(180%)] border border-white/70 dark:border-white/10 shadow-[0_8px_28px_-8px_rgba(30,50,90,.10)] overflow-hidden">
              {histLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner className="w-6 h-6" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-center py-12 text-slate-400 text-sm">
                  {t('admin.payouts.noPayouts')}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead>
                      <tr className="text-slate-400 text-[11px] uppercase tracking-wide border-b border-black/[0.06] dark:border-white/10">
                        <th className="text-start py-3 ps-4 pe-4 font-semibold">
                          {t('admin.payouts.colVendor')}
                        </th>
                        <th className="text-start py-3 pe-4 font-semibold">
                          {t('admin.payouts.colAmount')}
                        </th>
                        <th className="text-start py-3 pe-4 font-semibold">
                          {t('admin.payouts.colStatus')}
                        </th>
                        <th className="text-start py-3 pe-4 font-semibold">
                          {t('admin.payouts.colPeriod')}
                        </th>
                        <th className="text-start py-3 pe-4 font-semibold">
                          {t('admin.payouts.colReference')}
                        </th>
                        <th className="text-start py-3 pe-4 font-semibold">
                          {t('admin.payouts.colDate')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item) => (
                        <tr
                          key={item._id}
                          className="border-b border-black/[0.04] dark:border-white/[0.06] last:border-0"
                        >
                          <td className="py-3 ps-4 pe-4 font-medium">
                            {vendorName(item, t('admin.payouts.unknown'))}
                          </td>
                          <td className="py-3 pe-4 font-semibold">
                            ETB {Number(item.amount).toLocaleString()}
                          </td>
                          <td className="py-3 pe-4">
                            <StatusBadge status={item.status} t={t} />
                          </td>
                          <td className="py-3 pe-4 text-slate-400 text-xs whitespace-nowrap">
                            {fmtPeriod(item.periodStart, item.periodEnd)}
                          </td>
                          <td className="py-3 pe-4 text-slate-400 text-xs">
                            {item.reference || '—'}
                          </td>
                          <td className="py-3 pe-4 text-slate-400 text-xs whitespace-nowrap">
                            {fmtDate(item.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
