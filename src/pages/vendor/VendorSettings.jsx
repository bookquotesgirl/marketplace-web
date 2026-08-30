import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Globe, Bell, Moon, Sun, ImagePlus, Plus, Trash2 } from 'lucide-react';
import api, { resolveAssetUrl } from '../../lib/api';
import { Spinner, Toast, Modal } from '../../components/ui';
import { VendorShellContext } from '../../components/vendor/VendorShell';
import { useLanguage } from '../../hooks/useLanguage';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

const labelCls = 'block text-xs font-semibold text-ink/60 dark:text-slate-400 mb-1.5';
const inputCls =
  'w-full px-3.5 py-3 rounded-xl ring-1 ring-black/10 dark:ring-white/15 bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-forest text-sm';
const cardCls =
  'rounded-[1.75rem] bg-white/70 dark:bg-white/[0.06] backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-[0_10px_40px_-22px_rgba(0,0,0,0.25)] p-5 sm:p-6';

// Same list VendorRegister.jsx uses for the region picker.
const REGIONS = ['Addis Ababa', 'Adama', 'Hawassa', 'Bahir Dar', 'Dire Dawa', 'Mekelle', 'Gondar'];
const PROCESSING_TIMES = ['1-2 days', '2-3 days', '3-5 days', '1 week'];
const RETURN_WINDOWS = ['7 days', '14 days', '30 days', 'No returns'];

// Every field below is a real column on the Vendor model, saved through GET/PATCH /api/vendor/me.
function emptyForm() {
  return {
    storeName: '', tagline: '', bio: '', logoUrl: '', bannerUrl: '', deliveryZones: [],
    phone: '', email: '', region: '', subCity: '', address: '', businessHours: '',
    processingTime: '', returnWindow: '', shippingPolicy: '', returnPolicy: '',
    vacationMode: false, showStockLevels: true, allowCustomerChat: true, showRatingsReviews: true,
  };
}

function mapProfile(data) {
  return {
    storeName: data.storeName ?? '',
    tagline: data.tagline ?? '',
    bio: data.bio ?? '',
    logoUrl: data.logoUrl ?? '',
    bannerUrl: data.bannerUrl ?? '',
    deliveryZones: (data.deliveryZones ?? []).map((z) => ({ ...z })),
    phone: data.phone ?? '',
    email: data.email ?? '',
    region: data.region ?? '',
    subCity: data.subCity ?? '',
    address: data.address ?? '',
    businessHours: data.businessHours ?? '',
    processingTime: data.processingTime ?? '',
    returnWindow: data.returnWindow ?? '',
    shippingPolicy: data.shippingPolicy ?? '',
    returnPolicy: data.returnPolicy ?? '',
    vacationMode: Boolean(data.vacationMode),
    showStockLevels: data.showStockLevels !== false,
    allowCustomerChat: data.allowCustomerChat !== false,
    showRatingsReviews: data.showRatingsReviews !== false,
  };
}

// Label + description on the start side, a real switch on the end side.
function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        {description && <p className="text-xs text-ink/45 dark:text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-[46px] h-[26px] rounded-full ring-1 transition-colors ${
          checked ? 'bg-forest ring-forest' : 'bg-slate-200 dark:bg-slate-700 ring-black/10 dark:ring-white/10'
        }`}
      >
        <span
          className={`absolute top-0.5 start-0.5 w-[22px] h-[22px] rounded-full bg-white shadow-md transition-transform ${
            checked ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function VendorSettings() {
  const { t } = useTranslation();
  const { openDrawer } = useContext(VendorShellContext);
  const { cycleLanguage } = useLanguage();
  const dark = useUiStore((s) => s.dark);
  const toggleDark = useUiStore((s) => s.toggleDark);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const profileInitial = (user?.vendor?.storeName ?? user?.name ?? 'V')[0].toUpperCase();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saved, setSaved] = useState(emptyForm());
  const [form, setForm] = useState(emptyForm());
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const load = () => {
    setLoading(true);
    setLoadError('');
    api
      .get('/vendor/me')
      .then(({ data }) => {
        const next = mapProfile(data);
        setSaved(next);
        setForm(next);
        setSlug(data.slug ?? '');
      })
      .catch(() => setLoadError(t('vendor.settings.loadError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setBool = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const uploadAsset = async (file, kind) => {
    const setUploading = kind === 'logo' ? setUploadingLogo : setUploadingBanner;
    setUploading(true);
    setFormError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const { data } = await api.post('/uploads', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = data.images?.[0]?.url;
      if (url) setForm((f) => ({ ...f, [kind === 'logo' ? 'logoUrl' : 'bannerUrl']: url }));
    } catch (err) {
      setFormError(err.response?.data?.error?.message ?? t('vendor.settings.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const updateZone = (idx, patch) =>
    setForm((f) => ({
      ...f,
      deliveryZones: f.deliveryZones.map((z, i) => (i === idx ? { ...z, ...patch } : z)),
    }));
  const removeZone = (idx) =>
    setForm((f) => ({ ...f, deliveryZones: f.deliveryZones.filter((_, i) => i !== idx) }));
  const addZone = () =>
    setForm((f) => ({ ...f, deliveryZones: [...f.deliveryZones, { zone: '', fee: 0 }] }));

  const handleDiscard = () => setForm(saved);

  const applySavedProfile = (data) => {
    const next = mapProfile(data);
    setSaved(next);
    setForm(next);
    setSlug(data.slug ?? slug);

    // Keep the sidebar / header (which read user.vendor from authStore) in sync immediately.
    if (user) {
      setAuth({
        token,
        user: {
          ...user,
          vendor: { ...user.vendor, storeName: next.storeName, logoUrl: next.logoUrl, slug: data.slug ?? user.vendor?.slug },
        },
      });
    }
    return next;
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.storeName.trim()) {
      setFormError(t('vendor.settings.errorStoreName'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        storeName: form.storeName.trim(),
        tagline: form.tagline,
        bio: form.bio,
        logoUrl: form.logoUrl,
        bannerUrl: form.bannerUrl,
        deliveryZones: form.deliveryZones
          .filter((z) => z.zone && z.zone.trim())
          .map((z) => ({ zone: z.zone.trim(), fee: Number(z.fee) || 0 })),
        phone: form.phone,
        email: form.email,
        region: form.region,
        subCity: form.subCity,
        address: form.address,
        businessHours: form.businessHours,
        processingTime: form.processingTime,
        returnWindow: form.returnWindow,
        shippingPolicy: form.shippingPolicy,
        returnPolicy: form.returnPolicy,
        vacationMode: form.vacationMode,
        showStockLevels: form.showStockLevels,
        allowCustomerChat: form.allowCustomerChat,
        showRatingsReviews: form.showRatingsReviews,
      };
      const { data } = await api.patch('/vendor/me', payload);
      applySavedProfile(data);
      setToast(t('vendor.settings.saveSuccess'));
    } catch (err) {
      setFormError(
        err.response?.data?.error?.message ?? err.response?.data?.message ?? t('vendor.settings.saveError')
      );
    } finally {
      setSaving(false);
    }
  };

  // Danger zone — immediate, confirmed action; independent of whatever else is staged in the
  // form above. Same underlying field (`vacationMode`) as the Preferences toggle.
  const handleToggleVacation = async () => {
    setDeactivating(true);
    setFormError('');
    try {
      const { data } = await api.patch('/vendor/me', { vacationMode: !saved.vacationMode });
      applySavedProfile(data);
      setDeactivateOpen(false);
      setToast(data.vacationMode ? t('vendor.settings.deactivateSuccess') : t('vendor.settings.reactivateSuccess'));
    } catch (err) {
      setToast(err.response?.data?.error?.message ?? err.response?.data?.message ?? t('vendor.settings.saveError'));
    } finally {
      setDeactivating(false);
    }
  };

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
        <button onClick={load} className="mt-3 text-sm font-semibold text-forest hover:underline">
          {t('common.retry')}
        </button>
      </div>
    );
  }

  const logoPreview = resolveAssetUrl(form.logoUrl);
  const bannerPreview = resolveAssetUrl(form.bannerUrl);

  return (
    <>
      {/* Utility header */}
      <div className="flex items-center gap-3 rounded-[1.5rem] bg-white/70 dark:bg-white/[0.06] backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.2)] px-3 sm:px-4 h-16 mb-5">
        <button
          onClick={openDrawer}
          className="lg:hidden grid place-items-center w-10 h-10 -ms-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
          aria-label={t('common.menu')}
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-extrabold leading-none truncate">{t('vendor.settings.title')}</h1>
          <p className="text-[11px] text-ink/45 dark:text-slate-500 mt-1">{t('vendor.settings.subtitle')}</p>
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

      <div className="flex justify-end gap-2 mb-5">
        <button
          type="button"
          onClick={handleDiscard}
          className="h-10 px-4 rounded-2xl ring-1 ring-black/10 dark:ring-white/15 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition"
        >
          {t('vendor.settings.discard')}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="h-10 px-4 rounded-2xl bg-forest text-white text-sm font-semibold shadow-[0_8px_20px_-8px_rgba(11,122,75,0.7)] hover:bg-forest-dark transition disabled:opacity-50"
        >
          {saving ? '…' : t('vendor.settings.saveChanges')}
        </button>
      </div>

      {formError && (
        <div className="mb-5 rounded-2xl bg-crimson/10 text-crimson text-sm font-semibold px-4 py-3">
          {formError}
        </div>
      )}

      <div className="space-y-5">
        {/* Store branding */}
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold mb-4">{t('vendor.settings.brandingTitle')}</h2>

          <div className="relative rounded-2xl overflow-hidden ring-1 ring-black/10 dark:ring-white/15 h-40 sm:h-52 bg-black/5 dark:bg-white/5">
            {bannerPreview ? (
              <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-forest/30 to-teal-400/20" />
            )}
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className="absolute top-3 end-3 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-ink/70 text-white text-xs font-semibold hover:bg-ink/85 transition disabled:opacity-60"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              {uploadingBanner ? t('common.loading') : t('vendor.settings.changeBanner')}
            </button>
          </div>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={(e) => e.target.files?.[0] && uploadAsset(e.target.files[0], 'banner')}
          />

          <div className="flex items-end gap-4 -mt-10 ms-4 relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-slate-900 bg-white dark:bg-slate-800 shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center bg-forest/10 text-forest font-extrabold text-2xl">
                  {form.storeName?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="text-sm font-semibold text-forest hover:underline mb-1 disabled:opacity-60"
            >
              {uploadingLogo ? t('common.loading') : t('vendor.settings.changeLogo')}
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(e) => e.target.files?.[0] && uploadAsset(e.target.files[0], 'logo')}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <div>
              <label className={labelCls}>{t('vendor.settings.storeNameLabel')}</label>
              <input value={form.storeName} onChange={set('storeName')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('vendor.settings.taglineLabel')}</label>
              <input value={form.tagline} onChange={set('tagline')} className={inputCls} />
            </div>
          </div>

          <div className="mt-4">
            <label className={labelCls}>{t('vendor.settings.storeUrlLabel')}</label>
            <div className="flex items-center rounded-xl ring-1 ring-black/10 dark:ring-white/15 bg-black/[0.03] dark:bg-white/5 overflow-hidden">
              <span className="px-3.5 py-3 text-sm text-ink/40 dark:text-slate-500 shrink-0">kitman.et/store/</span>
              <span className="px-1 py-3 text-sm font-semibold truncate">{slug || '—'}</span>
            </div>
          </div>

          <div className="mt-4">
            <label className={labelCls}>{t('vendor.settings.bioLabel')}</label>
            <textarea value={form.bio} onChange={set('bio')} rows={3} maxLength={500} className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* Contact & location */}
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold mb-4">{t('vendor.settings.contactTitle')}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('vendor.settings.phoneLabel')}</label>
              <input type="tel" value={form.phone} onChange={set('phone')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('vendor.settings.emailLabel')}</label>
              <input type="email" value={form.email} onChange={set('email')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('vendor.settings.regionLabel')}</label>
              <select value={form.region} onChange={set('region')} className={inputCls}>
                <option value="">{t('vendor.settings.regionPlaceholder')}</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('vendor.settings.subCityLabel')}</label>
              <input value={form.subCity} onChange={set('subCity')} className={inputCls} />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelCls}>{t('vendor.settings.addressLabel')}</label>
            <input value={form.address} onChange={set('address')} className={inputCls} />
          </div>
          <div className="mt-4">
            <label className={labelCls}>{t('vendor.settings.businessHoursLabel')}</label>
            <input value={form.businessHours} onChange={set('businessHours')} className={inputCls} />
          </div>
        </div>

        {/* Policies */}
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold mb-4">{t('vendor.settings.policiesTitle')}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('vendor.settings.processingTimeLabel')}</label>
              <select value={form.processingTime} onChange={set('processingTime')} className={inputCls}>
                <option value="">{t('vendor.settings.processingTimePlaceholder')}</option>
                {PROCESSING_TIMES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('vendor.settings.returnWindowLabel')}</label>
              <select value={form.returnWindow} onChange={set('returnWindow')} className={inputCls}>
                <option value="">{t('vendor.settings.returnWindowPlaceholder')}</option>
                {RETURN_WINDOWS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className={labelCls}>{t('vendor.settings.shippingPolicyLabel')}</label>
            <textarea value={form.shippingPolicy} onChange={set('shippingPolicy')} rows={2} maxLength={500} className={`${inputCls} resize-none`} />
          </div>
          <div className="mt-4">
            <label className={labelCls}>{t('vendor.settings.returnPolicyLabel')}</label>
            <textarea value={form.returnPolicy} onChange={set('returnPolicy')} rows={2} maxLength={500} className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* Delivery zones & fees */}
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold">{t('vendor.settings.deliveryTitle')}</h2>
          <p className="text-xs text-ink/45 dark:text-slate-500 mt-1 mb-4">{t('vendor.settings.deliverySubtitle')}</p>

          {form.deliveryZones.length === 0 ? (
            <p className="text-sm text-ink/45 dark:text-slate-500">{t('vendor.settings.noZones')}</p>
          ) : (
            <div className="space-y-2.5">
              {form.deliveryZones.map((z, i) => (
                <div key={z._id ?? `new-${i}`} className="flex items-center gap-2.5">
                  <input
                    value={z.zone}
                    onChange={(e) => updateZone(i, { zone: e.target.value })}
                    placeholder={t('vendor.settings.zonePlaceholder')}
                    className={`${inputCls} flex-1`}
                  />
                  <div className="flex items-center gap-1.5 w-36 shrink-0">
                    <span className="text-xs text-ink/40 dark:text-slate-500 shrink-0">ETB</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={z.fee}
                      onChange={(e) => updateZone(i, { fee: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeZone(i)}
                    aria-label={t('common.remove')}
                    className="grid place-items-center w-10 h-10 rounded-xl hover:bg-crimson/10 text-crimson shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addZone}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline"
          >
            <Plus className="w-4 h-4" />
            {t('vendor.settings.addZone')}
          </button>
        </div>

        {/* Preferences */}
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold mb-1">{t('vendor.settings.preferencesTitle')}</h2>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            <ToggleRow
              label={t('vendor.settings.vacationModeLabel')}
              description={t('vendor.settings.vacationModeDescription')}
              checked={form.vacationMode}
              onChange={setBool('vacationMode')}
            />
            <ToggleRow
              label={t('vendor.settings.showStockLevelsLabel')}
              description={t('vendor.settings.showStockLevelsDescription')}
              checked={form.showStockLevels}
              onChange={setBool('showStockLevels')}
            />
            <ToggleRow
              label={t('vendor.settings.allowCustomerChatLabel')}
              description={t('vendor.settings.allowCustomerChatDescription')}
              checked={form.allowCustomerChat}
              onChange={setBool('allowCustomerChat')}
            />
            <ToggleRow
              label={t('vendor.settings.showRatingsReviewsLabel')}
              description={t('vendor.settings.showRatingsReviewsDescription')}
              checked={form.showRatingsReviews}
              onChange={setBool('showRatingsReviews')}
            />
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-[1.75rem] bg-crimson/5 ring-1 ring-crimson/20 p-5 sm:p-6">
          <h2 className="text-lg font-extrabold text-crimson mb-1">{t('vendor.settings.dangerTitle')}</h2>
          <p className="text-sm text-ink/60 dark:text-slate-400 mb-4">
            {saved.vacationMode ? t('vendor.settings.dangerBodyActive') : t('vendor.settings.dangerBody')}
          </p>
          <button
            type="button"
            onClick={() => setDeactivateOpen(true)}
            className="h-10 px-4 rounded-2xl ring-1 ring-crimson/30 text-crimson text-sm font-semibold hover:bg-crimson/10 transition"
          >
            {saved.vacationMode ? t('vendor.settings.reactivateStore') : t('vendor.settings.deactivateStore')}
          </button>
        </div>
      </div>

      {/* Deactivate/reactivate confirmation */}
      <Modal
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title={saved.vacationMode ? t('vendor.settings.reactivateStore') : t('vendor.settings.deactivateStore')}
      >
        <p className="text-sm text-ink/60 dark:text-slate-400 mb-5">
          {saved.vacationMode ? t('vendor.settings.confirmReactivateBody') : t('vendor.settings.confirmDeactivateBody')}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setDeactivateOpen(false)}
            className="h-10 px-4 rounded-2xl ring-1 ring-black/10 dark:ring-white/15 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleToggleVacation}
            disabled={deactivating}
            className="h-10 px-4 rounded-2xl bg-crimson text-white text-sm font-semibold hover:bg-crimson-dark transition disabled:opacity-50"
          >
            {deactivating ? '…' : saved.vacationMode ? t('vendor.settings.reactivateStore') : t('vendor.settings.deactivateStore')}
          </button>
        </div>
      </Modal>

      <Toast show={Boolean(toast)}>{toast}</Toast>
    </>
  );
}
