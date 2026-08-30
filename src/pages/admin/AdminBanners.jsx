import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, ImageOff } from 'lucide-react';
import { Toast, Modal, Spinner, Button, Input } from '../../components/ui';
import api from '../../lib/api';

// ---------------------------------------------------------------------------
// Banner thumbnail — letter fallback if image fails or is absent
// ---------------------------------------------------------------------------
function BannerThumb({ src, title }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <span className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-white/10 grid place-items-center text-slate-400 shrink-0">
        <ImageOff className="w-4 h-4" />
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={title}
      className="w-10 h-10 rounded-lg object-cover shrink-0 bg-slate-100 dark:bg-white/5"
      onError={() => setErr(true)}
    />
  );
}

// ---------------------------------------------------------------------------
// Create / edit form modal
// ---------------------------------------------------------------------------
const EMPTY = {
  title: '', image: '', subtitle: '', buttonText: '', link: '', order: '0', isActive: true,
};

function BannerFormModal({ banner, onClose, onSaved, t }) {
  const isEdit = !!banner;
  const [form, setForm] = useState(
    isEdit
      ? {
          title:      banner.title,
          image:      banner.image,
          subtitle:   banner.subtitle    ?? '',
          buttonText: banner.buttonText  ?? '',
          link:       banner.link        ?? '',
          order:      String(banner.order ?? 0),
          isActive:   banner.isActive,
        }
      : { ...EMPTY }
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const set = (k) => (e) =>
    setForm((prev) => ({
      ...prev,
      [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.image.trim()) {
      setFormError(t('admin.banners.actionError'));
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form, order: Number(form.order) || 0 };
      let saved;
      if (isEdit) {
        const res = await api.patch(`/admin/banners/${banner._id}`, payload);
        saved = res.data.banner;
      } else {
        const res = await api.post('/admin/banners', payload);
        saved = res.data.banner;
      }
      onSaved(saved, isEdit);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        t('admin.banners.actionError');
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? t('admin.banners.editBanner') : t('admin.banners.newBanner')}
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-1">
        <Input
          label={`${t('admin.banners.titleLabel')} *`}
          value={form.title}
          onChange={set('title')}
          placeholder={t('admin.banners.titlePlaceholder')}
          required
        />
        <div>
          <Input
            label={`${t('admin.banners.imageLabel')} *`}
            value={form.image}
            onChange={set('image')}
            placeholder={t('admin.banners.imagePlaceholder')}
            required
          />
          <p className="text-xs text-slate-400 mt-1 ms-0.5">{t('admin.banners.imageHint')}</p>
        </div>
        <Input
          label={t('admin.banners.subtitleLabel')}
          value={form.subtitle}
          onChange={set('subtitle')}
          placeholder={t('admin.banners.subtitlePlaceholder')}
        />
        <Input
          label={t('admin.banners.buttonTextLabel')}
          value={form.buttonText}
          onChange={set('buttonText')}
          placeholder={t('admin.banners.buttonTextPlaceholder')}
        />
        <Input
          label={t('admin.banners.linkLabel')}
          value={form.link}
          onChange={set('link')}
          placeholder={t('admin.banners.linkPlaceholder')}
        />
        <div className="grid grid-cols-2 gap-4 items-end">
          <Input
            label={t('admin.banners.orderLabel')}
            type="number"
            value={form.order}
            onChange={set('order')}
            min="0"
          />
          <label className="flex items-center gap-2 cursor-pointer select-none pb-3">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={set('isActive')}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className="text-sm font-semibold">{t('admin.banners.activeLabel')}</span>
          </label>
        </div>

        {formError && <p className="text-sm text-crimson">{formError}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? t('admin.banners.saving') : t('admin.banners.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminBanners() {
  const { t } = useTranslation();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // undefined = modal closed, null = create mode, object = edit mode
  const [editTarget, setEditTarget] = useState(undefined);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/banners');
      setBanners(res.data.banners ?? []);
    } catch {
      setToast(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (saved, isEdit) => {
    setBanners((prev) =>
      isEdit
        ? prev.map((b) => (b._id === saved._id ? saved : b))
        : [saved, ...prev]
    );
    setEditTarget(undefined);
    setToast(t('admin.banners.saveSuccess'));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/banners/${deleteTarget._id}`);
      setBanners((prev) => prev.filter((b) => b._id !== deleteTarget._id));
      setDeleteTarget(null);
      setToast(t('admin.banners.deleteSuccess'));
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        t('admin.banners.actionError');
      setToast(msg);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = banners.filter((b) => b.isActive).length;

  return (
    <>
      <Toast show={!!toast}>{toast}</Toast>

      {/* Create / edit modal */}
      {editTarget !== undefined && (
        <BannerFormModal
          banner={editTarget}
          onClose={() => setEditTarget(undefined)}
          onSaved={handleSaved}
          t={t}
        />
      )}

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('admin.banners.confirmDelete')}
      >
        <p className="text-sm text-slate-500 mb-5 truncate">&ldquo;{deleteTarget?.title}&rdquo;</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="!bg-crimson hover:!bg-crimson/90 text-white"
          >
            {deleting ? '…' : t('account.delete')}
          </Button>
        </div>
      </Modal>

      <div className="space-y-5">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] border border-white/70 dark:border-white/10">
            <span className="text-slate-500">{t('admin.banners.statusActive')}</span>
            <span className="font-extrabold">{activeCount}</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span>{banners.length}</span>
          </div>
          <Button onClick={() => setEditTarget(null)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t('admin.banners.newBanner')}
          </Button>
        </div>

        {/* Table card */}
        <div className="rounded-[1.75rem] bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] [backdrop-filter:blur(28px)_saturate(180%)] border border-white/70 dark:border-white/10 shadow-[0_8px_28px_-8px_rgba(30,50,90,.10)] overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner className="w-7 h-7" />
            </div>
          ) : banners.length === 0 ? (
            <p className="text-center py-16 text-slate-400 text-sm">
              {t('admin.banners.noBanners')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-slate-400 text-[11px] uppercase tracking-wide border-b border-black/[0.06] dark:border-white/10">
                    <th className="text-start py-3 ps-4 pe-3 font-semibold w-14">
                      {t('admin.banners.colPreview')}
                    </th>
                    <th className="text-start py-3 pe-4 font-semibold">
                      {t('admin.banners.colTitle')}
                    </th>
                    <th className="text-start py-3 pe-4 font-semibold">
                      {t('admin.banners.colLink')}
                    </th>
                    <th className="text-start py-3 pe-4 font-semibold w-20">
                      {t('admin.banners.colOrder')}
                    </th>
                    <th className="text-start py-3 pe-4 font-semibold">
                      {t('admin.banners.colStatus')}
                    </th>
                    <th className="py-3 pe-4 w-20" />
                  </tr>
                </thead>
                <tbody>
                  {banners.map((b) => (
                    <tr
                      key={b._id}
                      className="border-b border-black/[0.04] dark:border-white/[0.06] last:border-0 hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition"
                    >
                      <td className="py-3 ps-4 pe-3">
                        <BannerThumb src={b.image} title={b.title} />
                      </td>
                      <td className="py-3 pe-4">
                        <p className="font-semibold">{b.title}</p>
                        {b.subtitle && (
                          <p className="text-xs text-slate-400 mt-0.5 max-w-[200px] truncate">
                            {b.subtitle}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pe-4 text-slate-400 text-xs max-w-[150px] truncate">
                        {b.link || '—'}
                      </td>
                      <td className="py-3 pe-4 text-slate-400">{b.order}</td>
                      <td className="py-3 pe-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            b.isActive
                              ? 'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                              : 'bg-black/5 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                          }`}
                        >
                          {b.isActive
                            ? t('admin.banners.statusActive')
                            : t('admin.banners.statusInactive')}
                        </span>
                      </td>
                      <td className="py-3 pe-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditTarget(b)}
                            className="grid place-items-center w-8 h-8 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-blue-600 transition"
                            aria-label={t('admin.banners.editBanner')}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(b)}
                            className="grid place-items-center w-8 h-8 rounded-xl hover:bg-crimson/10 text-slate-400 hover:text-crimson transition"
                            aria-label={t('account.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
