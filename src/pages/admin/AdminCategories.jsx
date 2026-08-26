import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, ChevronRight, Tag, FolderTree } from 'lucide-react';
import api, { resolveAssetUrl } from '../../lib/api';
import { Spinner, Toast, Modal, Button, Input, Select } from '../../components/ui';

// ── helpers ───────────────────────────────────────────────────────────────────

function toSlug(name) {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function flattenTree(nodes, depth = 0) {
  return nodes.flatMap((node) => [
    { ...node, depth },
    ...(node.children ? flattenTree(node.children, depth + 1) : []),
  ]);
}

// ── Add/Edit form modal ────────────────────────────────────────────────────────

function CategoryFormModal({ open, onClose, categories, editing, onSaved }) {
  const { t } = useTranslation();
  const isEdit = !!editing && !editing._isAddSub; 

  const [name, setName]       = useState('');
  const [slug, setSlug]       = useState('');
  const [parentId, setParentId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (open) {
      if (editing?._isAddSub) {
        setName('');
        setSlug('');
        setParentId(editing.parentId ?? '');
        setImageUrl('');
        setIsActive(true);
      } else if (editing) {
        setName(editing.name ?? '');
        setSlug(editing.slug ?? '');
        setParentId(editing.parentId ?? '');
        setImageUrl(editing.image ?? '');
        setIsActive(editing.isActive !== false);
      }
      else {
        setName('');
        setSlug('');
        setParentId('');
        setImageUrl('');
        setIsActive(true);
      }
      setError(null);
    }
  }, [open, editing]);

  const handleNameChange = (val) => {
    setName(val);
    if (!isEdit) setSlug(toSlug(val));
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError(t('admin.categories.nameLabel') + ' is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: name.trim(),
        slug: slug || toSlug(name.trim()),
        parentId: parentId || null,
        image: imageUrl.trim() || undefined,
        isActive,
      };
      if (isEdit) {
        await api.patch(`/admin/categories/${editing._id}`, body);
      } else {
        await api.post('/admin/categories', body);
      }
      onSaved(t('admin.categories.saveSuccess'));
    } catch (err) {
      setError(err?.response?.data?.message ?? t('admin.categories.actionError'));
    } finally {
      setSaving(false);
    }
  };

  const parentOptions = categories.filter((c) => !editing || c._id !== editing._id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('admin.categories.editCategory') : t('admin.categories.addCategory')}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            {t('admin.categories.nameLabel')} *
          </label>
          <Input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={t('admin.categories.namePlaceholder')}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            {t('admin.categories.slugLabel')}
          </label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-generated"
          />
          <p className="text-[11px] text-slate-400 mt-1">{t('admin.categories.slugHint')}</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            {t('admin.categories.parentLabel')}
          </label>
          <Select value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">{t('admin.categories.parentNone')}</option>
            {parentOptions.map((c) => (
              <option key={c._id} value={c._id}>
                {'  '.repeat(c.depth ?? 0)}{c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            {t('admin.categories.imageLabel')}
          </label>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-600"
          />
          <span className="text-sm font-semibold">{t('admin.categories.activeLabel')}</span>
        </label>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="h-9 px-4 rounded-2xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition"
          >
            {saving ? t('admin.categories.saving') : t('admin.categories.saveCategory')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Delete confirm modal ──────────────────────────────────────────────────────

function DeleteModal({ open, onClose, category, categories, onDeleted }) {
  const { t } = useTranslation();
  const [reassignId, setReassignId] = useState('');
  const [deleting, setDeleting]     = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    if (open) { setReassignId(''); setError(null); }
  }, [open]);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const params = reassignId ? { reassignTo: reassignId } : {};
      await api.delete(`/admin/categories/${category._id}`, { params });
      onDeleted(t('admin.categories.deleteSuccess'));
    } catch (err) {
      setError(err?.response?.data?.message ?? t('admin.categories.actionError'));
    } finally {
      setDeleting(false);
    }
  };

  if (!category) return null;

  const otherCategories = categories.filter((c) => c._id !== category._id);

  return (
    <Modal open={open} onClose={onClose} title={t('admin.categories.deleteCategory')}>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
        <span className="font-semibold text-slate-700 dark:text-slate-200">{category.name}</span>
      </p>
      <p className="text-xs text-slate-400 mb-4">{t('admin.categories.confirmDeleteHint')}</p>
      <div className="mb-5">
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
          {t('admin.categories.reassignTo')}
        </label>
        <Select value={reassignId} onChange={(e) => setReassignId(e.target.value)}>
          <option value="">{t('admin.categories.parentNone')}</option>
          {otherCategories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </Select>
      </div>
      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={deleting}>
          {t('common.cancel')}
        </Button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="h-9 px-4 rounded-2xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 disabled:opacity-40 transition"
        >
          {deleting ? t('common.loading') : t('admin.categories.deleteCategory')}
        </button>
      </div>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminCategories() {
  const { t } = useTranslation();

  const [flat, setFlat]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing]   = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting]     = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      const list = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
      setFlat(flattenTree(list));
    } catch {
      setToast(t('admin.categories.actionError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSaved = (msg) => {
    setFormOpen(false);
    setEditing(null);
    setToast(msg);
    fetchCategories();
  };

  const handleDeleted = (msg) => {
    setDeleteOpen(false);
    setDeleting(null);
    setToast(msg);
    fetchCategories();
  };

  const openAdd = (parentCat = null) => {
    setEditing(parentCat ? { _isAddSub: true, parentId: parentCat._id } : null);
    setFormOpen(true);
  };
  const openEdit = (cat) => { setEditing(cat); setFormOpen(true); };
  const openDelete = (cat) => { setDeleting(cat); setDeleteOpen(true); };

  const active = flat.filter((c) => c.isActive !== false).length;
  const inactive = flat.length - active;

  return (
    <div className="space-y-5">
      <Toast show={!!toast}>{toast}</Toast>

      {/* ── Stat chips ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-[1.5rem] p-4 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)]">
          <span className="grid place-items-center w-9 h-9 rounded-2xl bg-blue-500/12 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400">
            <FolderTree className="w-[18px] h-[18px]" />
          </span>
          <div className="text-2xl font-extrabold mt-3">{flat.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">{t('admin.categories.title')}</div>
        </div>
        <div className="rounded-[1.5rem] p-4 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)]">
          <span className="grid place-items-center w-9 h-9 rounded-2xl bg-emerald-500/12 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Tag className="w-[18px] h-[18px]" />
          </span>
          <div className="text-2xl font-extrabold mt-3">{active}</div>
          <div className="text-xs text-slate-500 mt-0.5">{t('admin.categories.statusActive')}</div>
        </div>
        <div className="rounded-[1.5rem] p-4 bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)]">
          <span className="grid place-items-center w-9 h-9 rounded-2xl bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400">
            <Tag className="w-[18px] h-[18px]" />
          </span>
          <div className="text-2xl font-extrabold mt-3">{inactive}</div>
          <div className="text-xs text-slate-500 mt-0.5">{t('admin.categories.statusInactive')}</div>
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="rounded-[1.75rem] bg-white/60 dark:bg-white/[0.055] backdrop-blur-[28px] [backdrop-filter:blur(28px)_saturate(180%)] border border-white/70 dark:border-white/10 shadow-[0_14px_44px_-14px_rgba(30,50,90,.12)] overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <span className="text-sm text-slate-500">{flat.length} {t('admin.categories.title').toLowerCase()}</span>
          <div className="ms-auto">
            <button
              onClick={() => openAdd()}
              className="h-10 px-4 rounded-2xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('admin.categories.addRoot')}
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : flat.length === 0 ? (
          <div className="text-center py-14">
            <Tag className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="mt-2 font-semibold text-slate-500">{t('admin.categories.noCategories')}</p>
            <button
              onClick={() => openAdd()}
              className="mt-3 h-9 px-4 rounded-2xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              {t('admin.categories.addRoot')}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="text-slate-400 text-[11px] uppercase tracking-wide bg-white/30 dark:bg-white/[0.03]">
                <tr>
                  <th className="text-start font-semibold py-3 ps-4 pe-3">{t('admin.categories.colName')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('admin.categories.colSlug')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('admin.categories.colParent')}</th>
                  <th className="text-start font-semibold py-3 pe-3">{t('admin.categories.colStatus')}</th>
                  <th className="pe-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {flat.map((cat) => {
                  const parent = flat.find((c) => c._id === String(cat.parentId ?? ''));
                  const isActive = cat.isActive !== false;
                  return (
                    <tr
                      key={cat._id}
                      className="border-t border-black/[0.06] dark:border-white/[0.08] hover:bg-white/40 dark:hover:bg-white/[0.03] transition"
                    >
                      <td className="py-3 ps-4 pe-3">
                        <div
                          className="flex items-center gap-2.5"
                          style={{ paddingInlineStart: `${cat.depth * 20}px` }}
                        >
                          {cat.depth > 0 && (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0 -ms-1" />
                          )}
                          {cat.image ? (
                            <img
                              src={resolveAssetUrl(cat.image)}
                              alt={cat.name}
                              className="w-8 h-8 rounded-xl object-cover shrink-0"
                            />
                          ) : (
                            <span className="grid place-items-center w-8 h-8 rounded-xl bg-blue-500/12 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                              <Tag className="w-[14px] h-[14px]" />
                            </span>
                          )}
                          <span className={`font-semibold ${cat.depth > 0 ? 'text-slate-600 dark:text-slate-300' : ''}`}>
                            {cat.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pe-3 font-mono text-xs text-slate-400">{cat.slug}</td>
                      <td className="py-3 pe-3 text-slate-500 text-xs">{parent?.name ?? '—'}</td>
                      <td className="py-3 pe-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isActive
                            ? 'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500'
                        }`}>
                          {isActive ? t('admin.categories.statusActive') : t('admin.categories.statusInactive')}
                        </span>
                      </td>
                      <td className="pe-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openAdd(cat)}
                            className="grid place-items-center w-8 h-8 rounded-lg text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-blue-600 transition"
                            aria-label={t('admin.categories.addSub')}
                            title={t('admin.categories.addSub')}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(cat)}
                            className="grid place-items-center w-8 h-8 rounded-lg text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-blue-600 transition"
                            aria-label={t('admin.categories.editCategory')}
                            title={t('admin.categories.editCategory')}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDelete(cat)}
                            className="grid place-items-center w-8 h-8 rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-600 transition"
                            aria-label={t('admin.categories.deleteCategory')}
                            title={t('admin.categories.deleteCategory')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add/Edit form modal ── */}
      <CategoryFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        categories={flat}
        editing={editing}
        onSaved={handleSaved}
      />

      {/* ── Delete confirm modal ── */}
      <DeleteModal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleting(null); }}
        category={deleting}
        categories={flat}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
