import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Menu, Globe, Bell, Moon, Sun } from 'lucide-react';
import api from '../../lib/api';
import { Spinner } from '../../components/ui';
import MediaUploader from '../../components/vendor/MediaUploader';
import VariantEditor from '../../components/vendor/VariantEditor';
import { VendorShellContext } from '../../components/vendor/VendorShell';
import { useLanguage } from '../../hooks/useLanguage';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

function flattenTree(nodes, depth = 0) {
  return nodes.flatMap((node) => [
    { ...node, depth },
    ...(node.children ? flattenTree(node.children, depth + 1) : []),
  ]);
}

const cardCls =
  'rounded-[1.75rem] bg-white/70 dark:bg-white/[0.06] backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-[0_10px_40px_-22px_rgba(0,0,0,0.25)] p-5 sm:p-6';
const labelCls = 'block text-xs font-semibold text-ink/60 dark:text-slate-400 mb-1.5';
const inputCls =
  'w-full px-3.5 py-3 rounded-xl ring-1 ring-black/10 dark:ring-white/15 bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-forest text-sm';

export default function VendorProductForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { openDrawer } = useContext(VendorShellContext);
  const { cycleLanguage } = useLanguage();
  const dark = useUiStore((s) => s.dark);
  const toggleDark = useUiStore((s) => s.toggleDark);
  const user = useAuthStore((s) => s.user);
  const profileInitial = (user?.vendor?.storeName ?? user?.name ?? 'V')[0].toUpperCase();

  const [productId, setProductId] = useState(id ?? null);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [status, setStatus] = useState('active');
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);

  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Categories for the select — same GET /categories + flattenTree approach as AdminCategories.
  useEffect(() => {
    let cancelled = false;
    api
      .get('/categories')
      .then(({ data }) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : (data.data ?? []);
        setCategories(flattenTree(list));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Edit mode — load the existing product (GET /vendor/products/:id, includes variants).
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    api
      .get(`/vendor/products/${id}`)
      .then(({ data }) => {
        if (cancelled) return;
        const p = data.data;
        setProductId(p._id);
        setTitle(p.title ?? '');
        setDescription(p.description ?? '');
        setCategoryId(p.categoryId?._id ?? p.categoryId ?? '');
        setPrice(String(p.basePrice ?? p.price ?? ''));
        setStock(String(p.stock ?? 0));
        setStatus(p.status === 'draft' ? 'draft' : 'active');
        setImages(p.images ?? []);
        setVariants(
          (p.variants ?? []).map((v) => ({
            _id: v._id,
            attributes: { size: v.attributes?.size ?? '', colour: v.attributes?.colour ?? '' },
            price: v.price ?? '',
            stock: v.stock ?? '',
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setLoadError(t('vendor.products.form.loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, isEdit, t]);

  // /api/uploads requires an existing productId. If the vendor adds a photo before ever
  // saving (new-product flow), quietly create a draft product first so the upload has
  // something to attach to — the vendor's chosen status is applied on the next real Save.
  async function ensureProductId() {
    if (productId) return productId;
    if (!title.trim() || !categoryId || !price) {
      throw { response: { data: { error: { message: t('vendor.products.form.needsBasicsForMedia') } } } };
    }
    const { data } = await api.post('/vendor/products', {
      title: title.trim(),
      description,
      price: Number(price),
      category: categoryId,
      stock: Number(stock) || 0,
    });
    const created = data.data;
    setProductId(created._id);
    return created._id;
  }

  function buildPayload(targetStatus) {
    return {
      title: title.trim(),
      description,
      price: Number(price) || 0,
      category: categoryId,
      stock: Number(stock) || 0,
      status: targetStatus,
      images,
      variants: variants.map((v) => ({
        _id: v._id,
        attributes: {
          size: v.attributes?.size?.trim() || undefined,
          colour: v.attributes?.colour?.trim() || undefined,
        },
        price: Number(v.price) || 0,
        stock: Number(v.stock) || 0,
      })),
    };
  }

  async function handleSave(targetStatus) {
    setFormError('');
    if (!title.trim()) return setFormError(t('vendor.products.form.errorTitle'));
    if (!categoryId) return setFormError(t('vendor.products.form.errorCategory'));
    if (!price || Number(price) <= 0) return setFormError(t('vendor.products.form.errorPrice'));

    setSaving(true);
    try {
      const payload = buildPayload(targetStatus);
      if (productId) {
        await api.patch(`/vendor/products/${productId}`, payload);
      } else {
        await api.post('/vendor/products', payload);
      }
      navigate('/vendor/products', {
        state: { toast: isEdit ? t('vendor.products.form.updateSuccess') : t('vendor.products.form.createSuccess') },
      });
    } catch (err) {
      setFormError(
        err.response?.data?.error?.message ?? err.response?.data?.message ?? t('vendor.products.form.saveError')
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="py-16 text-center">
        <p className="text-crimson font-semibold">{loadError}</p>
        <Link to="/vendor/products" className="mt-3 inline-block text-sm font-semibold text-forest hover:underline">
          {t('vendor.products.title')}
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Utility header — same bar pattern as VendorProducts */}
      <div className="flex items-center gap-3 rounded-[1.5rem] bg-white/70 dark:bg-white/[0.06] backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.2)] px-3 sm:px-4 h-16 mb-5">
        <button
          onClick={openDrawer}
          className="lg:hidden grid place-items-center w-10 h-10 -ms-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
          aria-label={t('common.menu')}
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-extrabold leading-none truncate">
            {isEdit ? t('vendor.products.form.editTitle') : t('vendor.products.form.addTitle')}
          </h1>
          <p className="text-[11px] text-ink/45 dark:text-slate-500 mt-1">
            {isEdit ? t('vendor.products.form.editSubtitle') : t('vendor.products.form.addSubtitle')}
          </p>
        </div>
        <div className="ms-auto flex items-center gap-1.5">
          <button onClick={cycleLanguage} aria-label={t('header.language')} className="grid place-items-center w-10 h-10 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10">
            <Globe className="w-5 h-5" />
          </button>
          <button aria-label="Notifications" className="grid place-items-center w-10 h-10 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10">
            <Bell className="w-5 h-5" />
          </button>
          <button onClick={toggleDark} aria-label={t('header.theme')} className="grid place-items-center w-10 h-10 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10">
            {dark ? <Sun className="w-5 h-5 text-gold" /> : <Moon className="w-5 h-5" />}
          </button>
          <span className="grid place-items-center w-9 h-9 rounded-full bg-forest text-white text-sm font-extrabold ms-0.5 shrink-0 select-none">
            {profileInitial}
          </span>
        </div>
      </div>

      {/* Breadcrumb + primary actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <Link
          to="/vendor/products"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 dark:text-slate-400 hover:text-forest transition"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          {t('vendor.products.title')}
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/vendor/products')}
            className="h-10 px-4 rounded-2xl ring-1 ring-black/10 dark:ring-white/15 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            {t('vendor.products.form.discard')}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('draft')}
            className="h-10 px-4 rounded-2xl bg-black/5 dark:bg-white/10 text-sm font-semibold hover:bg-black/10 dark:hover:bg-white/15 transition disabled:opacity-50"
          >
            {saving ? '…' : t('vendor.products.form.saveDraft')}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('active')}
            className="h-10 px-4 rounded-2xl bg-forest text-white text-sm font-semibold shadow-[0_8px_20px_-8px_rgba(11,122,75,0.7)] hover:bg-forest-dark transition disabled:opacity-50"
          >
            {saving ? '…' : t('vendor.products.form.publish')}
          </button>
        </div>
      </div>

      {formError && (
        <div className="mb-5 rounded-2xl bg-crimson/10 text-crimson text-sm font-semibold px-4 py-3">
          {formError}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5 items-start">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          <div className={cardCls}>
            <h2 className="text-lg font-extrabold mb-4">{t('vendor.products.form.detailsTitle')}</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>{t('vendor.products.form.titleLabel')}</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('vendor.products.form.titlePlaceholder')}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>{t('vendor.products.form.descriptionLabel')}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('vendor.products.form.descriptionPlaceholder')}
                  rows={5}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          </div>

          <div className={cardCls}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold">{t('vendor.products.form.mediaTitle')}</h2>
              <span className="text-xs text-ink/40 dark:text-slate-500">{images.length}/6</span>
            </div>
            <MediaUploader images={images} onChange={setImages} ensureProductId={ensureProductId} />
          </div>

          <div className={cardCls}>
            <h2 className="text-lg font-extrabold mb-4">{t('vendor.products.form.pricingTitle')}</h2>
            <div>
              <label className={labelCls}>{t('vendor.products.form.priceLabel')}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className={`${inputCls} max-w-xs`}
              />
            </div>
          </div>

          <div className={cardCls}>
            <h2 className="text-lg font-extrabold mb-4">{t('vendor.products.form.inventoryTitle')}</h2>
            <div className="max-w-xs">
              <label className={labelCls}>{t('vendor.products.form.quantityLabel')}</label>
              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className={cardCls}>
            <h2 className="text-lg font-extrabold mb-4">{t('vendor.products.form.variantsTitle')}</h2>
            <VariantEditor variants={variants} onChange={setVariants} />
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          <div className={cardCls}>
            <h2 className="text-lg font-extrabold mb-4">{t('vendor.products.form.publishTitle')}</h2>
            <div className="space-y-2">
              {['active', 'draft'].map((opt) => (
                <label
                  key={opt}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl ring-1 cursor-pointer transition ${
                    status === opt ? 'ring-forest bg-forest/5' : 'ring-black/10 dark:ring-white/15'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    checked={status === opt}
                    onChange={() => setStatus(opt)}
                    className="w-4 h-4 accent-forest"
                  />
                  <span className="text-sm font-semibold flex-1">
                    {opt === 'active' ? t('vendor.products.statusActive') : t('vendor.products.statusDraft')}
                  </span>
                  {opt === 'active' && <span className="w-2 h-2 rounded-full bg-forest" />}
                </label>
              ))}
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(status)}
              className="w-full mt-4 h-11 rounded-2xl bg-forest text-white text-sm font-semibold shadow-[0_8px_20px_-8px_rgba(11,122,75,0.7)] hover:bg-forest-dark transition disabled:opacity-50"
            >
              {saving ? '…' : t('vendor.products.form.saveProduct')}
            </button>
          </div>

          <div className={cardCls}>
            <h2 className="text-lg font-extrabold mb-4">{t('vendor.products.form.organizationTitle')}</h2>
            <label className={labelCls}>{t('vendor.products.colCategory')}</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputCls}
            >
              <option value="">{t('vendor.products.form.categoryPlaceholder')}</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {'  '.repeat(c.depth)}{c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
