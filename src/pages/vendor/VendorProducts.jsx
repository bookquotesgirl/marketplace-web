import { useState, useEffect, useMemo, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Package, CheckCircle2, PackageX, FileEdit,
  Search, Plus, Pencil, Copy, Eye, EyeOff, Trash2,
  PackageSearch, ChevronLeft, ChevronRight,
  Menu, Globe, Bell, Moon, Sun, X,
} from 'lucide-react';
import api from '../../lib/api';
import { productImageUrl } from '../../lib/mapProduct';
import { Spinner, Toast } from '../../components/ui';
import ProductImage from '../../components/ui/ProductImage';
import { VendorShellContext } from '../../components/vendor/VendorShell';
import { useLanguage } from '../../hooks/useLanguage';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

// Derives display status from backend status field + stock quantity.
// Draft → gray; stock 0 → crimson "Out of stock"; stock < 10 → amber "Low stock"; else → forest "Active".
function getStatusMeta(p) {
  if (p.status === 'draft') {
    return { cls: 'bg-black/5 dark:bg-white/10 text-ink/60 dark:text-slate-300', labelKey: 'vendor.products.statusDraft' };
  }
  if (p.stock === 0) {
    return { cls: 'bg-crimson/10 text-crimson', labelKey: 'vendor.products.statusOut' };
  }
  if (p.stock != null && p.stock < 10) {
    return { cls: 'bg-amber-500/15 text-amber-600', labelKey: 'vendor.products.statusLow' };
  }
  return { cls: 'bg-forest/10 text-forest', labelKey: 'vendor.products.statusActive' };
}

function inTab(p, tab) {
  if (tab === 'active') return p.status !== 'draft' && p.stock > 0;
  if (tab === 'out') return p.stock === 0;
  if (tab === 'draft') return p.status === 'draft';
  return true; // 'all'
}

const CHIPS = [
  { key: 'all',    Icon: Package,      tint: 'bg-forest/10 text-forest',          labelKey: 'vendor.products.chipTotal'  },
  { key: 'active', Icon: CheckCircle2, tint: 'bg-emerald-500/10 text-emerald-600', labelKey: 'vendor.products.chipActive' },
  { key: 'out',    Icon: PackageX,     tint: 'bg-crimson/10 text-crimson',         labelKey: 'vendor.products.chipOut'    },
  { key: 'draft',  Icon: FileEdit,     tint: 'bg-amber-500/10 text-amber-600',     labelKey: 'vendor.products.chipDraft'  },
];

const TABS = [
  { key: 'all',    labelKey: 'vendor.products.tabAll'    },
  { key: 'active', labelKey: 'vendor.products.tabActive' },
  { key: 'out',    labelKey: 'vendor.products.tabOut'    },
  { key: 'draft',  labelKey: 'vendor.products.tabDraft'  },
];

export default function VendorProducts() {
  const { t } = useTranslation();
  const { openDrawer } = useContext(VendorShellContext);
  const { cycleLanguage } = useLanguage();
  const dark = useUiStore((s) => s.dark);
  const toggleDark = useUiStore((s) => s.toggleDark);
  const user = useAuthStore((s) => s.user);
  const profileInitial = (user?.vendor?.storeName ?? user?.name ?? 'V')[0].toUpperCase();

  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [toast, setToast]         = useState('');
  const [retryKey, setRetryKey]   = useState(0);
  const [search, setSearch]       = useState('');
  const [tab, setTab]             = useState('all');
  const [sort, setSort]           = useState('newest');
  const [selected, setSelected]   = useState([]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .get('/vendor/products')
      .then(({ data }) => {
        if (!cancelled) setProducts(Array.isArray(data) ? data : (data.data ?? []));
      })
      .catch(() => {
        if (!cancelled) setError(t('vendor.products.errorLoad'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [t, retryKey]);

  const counts = useMemo(() => ({
    all:    products.length,
    active: products.filter(p => inTab(p, 'active')).length,
    out:    products.filter(p => inTab(p, 'out')).length,
    draft:  products.filter(p => inTab(p, 'draft')).length,
  }), [products]);

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      if (!inTab(p, tab)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (p.title ?? '').toLowerCase().includes(q) || (p.slug ?? '').toLowerCase().includes(q);
      }
      return true;
    });
    if (sort === 'price') list = [...list].sort((a, b) => (b.basePrice ?? 0) - (a.basePrice ?? 0));
    else if (sort === 'stock') list = [...list].sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
    // 'newest' and 'sales' keep API order (sales data not available from backend yet)
    return list;
  }, [products, tab, search, sort]);

  const allSelected = filtered.length > 0 && filtered.every(p => selected.includes(p._id));

  const toggleAll = () => {
    setSelected(allSelected ? [] : filtered.map(p => p._id));
  };

  const toggleOne = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-crimson font-semibold">{error}</p>
        <button
          onClick={() => setRetryKey(k => k + 1)}
          className="mt-3 text-sm font-semibold text-forest hover:underline"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Page header */}
      <div className="flex items-center gap-3 rounded-[1.5rem] bg-white/70 dark:bg-white/[0.06] backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.2)] px-3 sm:px-4 h-16 mb-5">
        {/* Mobile hamburger — opens the sidebar */}
        <button
          onClick={openDrawer}
          className="lg:hidden grid place-items-center w-10 h-10 -ms-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
          aria-label={t('common.menu')}
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-extrabold leading-none truncate">{t('vendor.products.title')}</h1>
          <p className="text-[11px] text-ink/45 dark:text-slate-500 mt-1">{t('vendor.products.subtitle')}</p>
        </div>

        <div className="ms-auto flex items-center gap-1.5">
          {/* Add product */}
          <button
            onClick={() => setToast(t('common.comingSoon'))}
            className="inline-flex items-center gap-1.5 h-10 px-3 sm:px-4 rounded-2xl bg-forest text-white font-semibold text-sm shadow-[0_8px_20px_-8px_rgba(11,122,75,0.7)] hover:bg-forest-dark transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('vendor.products.addProduct')}</span>
          </button>

          {/* Language cycle */}
          <button
            onClick={cycleLanguage}
            aria-label={t('header.language')}
            className="grid place-items-center w-10 h-10 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Globe className="w-5 h-5" />
          </button>

          {/* Notifications stub */}
          <button
            onClick={() => setToast(t('common.comingSoon'))}
            aria-label="Notifications"
            className="grid place-items-center w-10 h-10 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Bell className="w-5 h-5" />
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            aria-label={t('header.theme')}
            className="grid place-items-center w-10 h-10 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10"
          >
            {dark ? <Sun className="w-5 h-5 text-gold" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Profile circle */}
          <span className="grid place-items-center w-9 h-9 rounded-full bg-forest text-white text-sm font-extrabold ms-0.5 shrink-0 select-none">
            {profileInitial}
          </span>
        </div>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {CHIPS.map(({ key, Icon, tint, labelKey }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`text-start rounded-[1.5rem] bg-white/70 dark:bg-white/[0.06] backdrop-blur-2xl ring-1 shadow-[0_10px_40px_-24px_rgba(0,0,0,0.25)] p-4 transition hover:ring-forest/20 ${tab === key ? 'ring-forest/30' : 'ring-black/5 dark:ring-white/10'}`}
          >
            <span className={`inline-grid place-items-center w-9 h-9 rounded-2xl ${tint}`}>
              <Icon className="w-[18px] h-[18px]" />
            </span>
            <div className="text-2xl font-extrabold mt-3">{counts[key]}</div>
            <div className="text-xs text-ink/45 dark:text-slate-500">{t(labelKey)}</div>
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-[1.75rem] bg-white/70 dark:bg-white/[0.06] backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-[0_10px_40px_-22px_rgba(0,0,0,0.25)] overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2 h-10 px-3 rounded-2xl bg-black/[0.04] dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 flex-1 min-w-[180px] max-w-xs">
            <Search className="w-4 h-4 text-ink/40 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('vendor.products.searchPlaceholder')}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink/40"
            />
          </div>
          <div className="hidden md:flex gap-1 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/5">
            {TABS.map(({ key, labelKey }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition ${tab === key ? 'bg-white dark:bg-slate-800 shadow-sm text-forest' : 'text-ink/55 dark:text-slate-400'}`}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="md:ms-auto h-10 px-3 rounded-2xl bg-black/[0.04] dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-sm font-medium outline-none"
          >
            <option value="newest">{t('vendor.products.sortNewest')}</option>
            <option value="price">{t('vendor.products.sortPrice')}</option>
            <option value="sales">{t('vendor.products.sortSales')}</option>
            <option value="stock">{t('vendor.products.sortStock')}</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="text-ink/40 dark:text-slate-500 text-[11px] uppercase tracking-wide bg-black/[0.02] dark:bg-white/[0.03]">
              <tr>
                <th className="ps-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded accent-forest"
                  />
                </th>
                <th className="text-start font-semibold py-3">{t('vendor.products.colProduct')}</th>
                <th className="text-start font-semibold py-3">{t('vendor.products.colCategory')}</th>
                <th className="text-start font-semibold py-3">{t('vendor.products.price')}</th>
                <th className="text-start font-semibold py-3">{t('vendor.products.stock')}</th>
                <th className="text-start font-semibold py-3">{t('common.status')}</th>
                <th className="text-start font-semibold py-3">{t('vendor.products.colSales')}</th>
                <th className="pe-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const sm = getStatusMeta(p);
                const imgSrc = productImageUrl(p.images?.[0]);
                return (
                  <tr key={p._id} className="border-t border-black/5 dark:border-white/10 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition">
                    {/* Checkbox */}
                    <td className="ps-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(p._id)}
                        onChange={() => toggleOne(p._id)}
                        className="w-4 h-4 rounded accent-forest"
                      />
                    </td>

                    {/* Product image + title + slug */}
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0">
                          <ProductImage src={imgSrc} alt={p.title} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold truncate max-w-[220px] dark:text-slate-100">{p.title ?? '—'}</div>
                          <div className="text-[11px] text-ink/40 dark:text-slate-500">{p.slug ?? ''}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3">
                      {p.categoryId?.name ? (
                        <span className="px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/10 text-[11px] font-semibold">
                          {p.categoryId.name}
                        </span>
                      ) : (
                        <span className="text-ink/40 text-sm">—</span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="py-3 font-semibold text-forest whitespace-nowrap">
                      {p.basePrice != null ? `ETB ${Number(p.basePrice).toLocaleString()}` : '—'}
                    </td>

                    {/* Stock — crimson if 0, amber if low */}
                    <td className="py-3">
                      <span className={`font-semibold ${p.stock === 0 ? 'text-crimson' : p.stock != null && p.stock < 10 ? 'text-amber-600' : ''}`}>
                        {p.stock ?? '—'}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${sm.cls}`}>
                        {t(sm.labelKey)}
                      </span>
                    </td>

                    {/* Sales — not available from API yet */}
                    <td className="py-3 text-ink/60 dark:text-slate-300">—</td>

                    {/* Actions */}
                    <td className="pe-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setToast(t('common.comingSoon'))}
                          aria-label={t('vendor.products.edit')}
                          title={t('vendor.products.edit')}
                          className="grid place-items-center w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-ink/60"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setToast(t('common.comingSoon'))}
                          aria-label={t('vendor.products.actionDuplicate')}
                          title={t('vendor.products.actionDuplicate')}
                          className="grid place-items-center w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-ink/60"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setToast(t('common.comingSoon'))}
                          aria-label={p.status === 'active' ? t('vendor.products.actionUnpublish') : t('vendor.products.actionPublish')}
                          title={p.status === 'active' ? t('vendor.products.actionUnpublish') : t('vendor.products.actionPublish')}
                          className="grid place-items-center w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-ink/60"
                        >
                          {p.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setToast(t('common.comingSoon'))}
                          aria-label={t('vendor.products.delete')}
                          title={t('vendor.products.delete')}
                          className="grid place-items-center w-8 h-8 rounded-lg hover:bg-crimson/10 text-crimson"
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

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <span className="inline-grid place-items-center w-14 h-14 rounded-full bg-black/5 dark:bg-white/10 mb-3">
              <PackageSearch className="w-7 h-7 text-ink/40" />
            </span>
            <p className="font-semibold">
              {products.length === 0 ? t('vendor.products.empty') : t('vendor.products.noResults')}
            </p>
            {products.length === 0 && (
              <p className="text-sm text-ink/50 dark:text-slate-400 mt-1">{t('vendor.products.emptyHint')}</p>
            )}
            <button
              onClick={() => setToast(t('common.comingSoon'))}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest text-white text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              {t('vendor.products.addProductLong')}
            </button>
          </div>
        )}

        {/* Footer with count + pagination stub */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-black/5 dark:border-white/10 text-sm">
            <span className="text-ink/50 dark:text-slate-400">
              {filtered.length} {t('vendor.products.countProducts')}
            </span>
            <div className="flex items-center gap-1">
              <button
                aria-label={t('browse.prevPage')}
                className="grid place-items-center w-9 h-9 rounded-xl ring-1 ring-black/10 dark:ring-white/15 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
              <button className="grid place-items-center w-9 h-9 rounded-xl bg-forest text-white font-semibold">
                1
              </button>
              <button
                aria-label={t('browse.nextPage')}
                className="grid place-items-center w-9 h-9 rounded-xl ring-1 ring-black/10 dark:ring-white/15 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk action bar — appears when one or more rows are selected */}
      {selected.length > 0 && (
        <div className="fixed bottom-4 inset-x-0 z-40 px-4 flex justify-center">
          <div className="flex items-center gap-3 rounded-2xl bg-ink/90 dark:bg-slate-800/95 backdrop-blur-xl text-white ring-1 ring-white/10 shadow-2xl px-4 py-2.5">
            <span className="text-sm font-semibold">
              {selected.length} {t('vendor.products.selected')}
            </span>
            <button
              onClick={() => setToast(t('common.comingSoon'))}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold transition"
            >
              <EyeOff className="w-4 h-4" />
              <span className="hidden sm:inline">{t('vendor.products.actionUnpublish')}</span>
            </button>
            <button
              onClick={() => setToast(t('common.comingSoon'))}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-crimson hover:bg-crimson-dark text-sm font-semibold transition"
            >
              <Trash2 className="w-4 h-4" />
              {t('vendor.products.delete')}
            </button>
            <button
              onClick={() => setSelected([])}
              aria-label="Clear selection"
              className="grid place-items-center w-9 h-9 rounded-xl hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <Toast show={Boolean(toast)}>{toast}</Toast>
    </>
  );
}
