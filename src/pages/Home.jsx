import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Truck,
  Banknote,
  BadgeCheck,
  Star,
  ArrowRight,
  Store as StoreIcon,
  TrendingUp,
} from 'lucide-react';
import api, { resolveAssetUrl } from '../lib/api';
import { mapProductCard } from '../lib/mapProduct';
import { ProductCard, Spinner, Card } from '../components/ui';
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from '../lib/categoryIcons';

const PAYMENT_BADGES = [
  { name: 'Telebirr', className: 'bg-telebirr' },
  { name: 'CBE Birr', className: 'bg-cbeBirr' },
  { name: 'ArifPay', className: 'bg-arifpay' },
  { name: 'Awash', className: 'bg-crimson' },
];

function HeroBanner({ externalSlides }) {
  const { t } = useTranslation();
  const slides = externalSlides ?? [];
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!slides.length) return undefined;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  if (!slides.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 pt-5">
      <div className="relative overflow-hidden rounded-3xl bg-forest-deep text-white shadow-card min-h-[280px] md:min-h-[400px] flex items-center">
        {slides.map((slide, i) => (
          <div
            key={i}
            aria-hidden={i !== active}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === active ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {slide.image && (
              <img
                src={slide.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/90 via-forest-deep/40 to-transparent" />
          </div>
        ))}

        <div className="relative z-10 p-8 md:p-14 max-w-xl">
          {slides[active].tag && (
            <span className="inline-block px-3 py-1 rounded-full bg-gold text-ink text-[11px] font-bold tracking-wide">
              {slides[active].tag}
            </span>
          )}
          <h1 className="mt-4 text-3xl md:text-5xl font-extrabold leading-tight">
            {slides[active].title}
          </h1>
          {slides[active].sub && (
            <p className="mt-3 text-white/85 text-sm md:text-lg">{slides[active].sub}</p>
          )}
          <Link
            to={slides[active].link || '/browse'}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gold hover:bg-gold-light text-ink font-bold shadow-glow transition"
          >
            {slides[active].cta || t('home.heroCta')}
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>

        <div className="absolute bottom-4 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 flex gap-1.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              aria-current={i === active}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? 'w-6 bg-gold' : 'w-1.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const { t } = useTranslation();
  return (
    <section className="max-w-7xl mx-auto px-4 pt-6">
      <div className="rounded-3xl bg-white dark:bg-slate-800/60 ring-1 ring-black/5 dark:ring-white/10 shadow-soft px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="w-5 h-5 text-forest" />
          <span>{t('home.trustPayments')}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {PAYMENT_BADGES.map((p) => (
            <span
              key={p.name}
              className={`${p.className} px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-sm`}
            >
              {p.name}
            </span>
          ))}
          <span className="px-3 py-1.5 rounded-lg bg-ink dark:bg-white/10 text-white text-xs font-bold flex items-center gap-1">
            <Banknote className="w-4 h-4" />
            {t('home.trustCod')}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-ink/70 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-forest" />
            {t('home.trustSecure')}
          </span>
          <span className="flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-forest" />
            {t('home.trustDelivery')}
          </span>
        </div>
      </div>
    </section>
  );
}

function VendorCtaBanner() {
  const { t } = useTranslation();
  return (
    <section className="max-w-7xl mx-auto px-4 pt-10 pb-2">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest via-forest-dark to-forest-deep text-white shadow-card">
        <div className="relative z-10 p-8 md:p-12 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold text-ink text-[11px] font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            {t('home.vendorCtaBadge')}
          </span>
          <h2 className="mt-4 text-2xl md:text-4xl font-extrabold leading-tight">
            {t('home.vendorCtaTitle')}
          </h2>
          <p className="mt-3 text-white/85 md:text-lg">{t('home.vendorCtaSub')}</p>
          <div className="mt-5 flex flex-wrap gap-6">
            <div>
              <div className="text-2xl font-extrabold text-gold">2,400+</div>
              <div className="text-xs text-white/70">{t('home.vendorCtaVendors')}</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-gold">180k+</div>
              <div className="text-xs text-white/70">{t('home.vendorCtaBuyers')}</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-gold">48h</div>
              <div className="text-xs text-white/70">{t('home.vendorCtaApproval')}</div>
            </div>
          </div>
          <Link
            to="/vendor"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gold hover:bg-gold-light text-ink font-bold shadow-glow transition"
          >
            <StoreIcon className="w-5 h-5" />
            {t('home.vendorCtaButton')}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [externalSlides, setExternalSlides] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    // The category row and top-vendors strip below are derived from the fetched products
    // (there's no separate "top vendors" endpoint). Sample a larger page than the featured
    // grid needs so those two rows aren't limited to whatever's in the 8 newest products.
    api
      .get('/products', { params: { limit: 100, sort: 'newest' } })
      .then((res) => {
        if (cancelled) return;
        const payload = res.data || {};
        const items = payload.data ?? payload.items ?? payload;
        setProducts(items ?? []);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // GET /api/content returns { banners, featured } per API_CONTRACT.md — banner objects are
  // { title, image, link, order, buttonText, subtitle }. Only real, admin-managed banners are
  // shown; if none are configured (or the request fails) the hero section just doesn't render,
  // rather than falling back to placeholder marketing copy.
  useEffect(() => {
    let cancelled = false;
    api
      .get('/content')
      .then((res) => {
        if (cancelled) return;
        const banners = res.data?.banners ?? [];
        const slides = banners
          .map((b) => ({
            title: b.title,
            sub: b.subtitle,
            image: resolveAssetUrl(b.image),
            link: b.link,
            cta: b.buttonText,
          }))
          .filter((s) => s.title && s.image);
        if (slides.length) setExternalSlides(slides);
      })
      .catch(() => {
        /* ignore — fallback to i18n slides */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = products.slice(0, 8);

  const categories = [];
  const vendors = [];
  const seenCategories = new Set();
  const seenVendors = new Set();
  for (const p of products) {
    const c = p.categoryId;
    if (c?._id && !seenCategories.has(c._id)) {
      seenCategories.add(c._id);
      categories.push(c);
    }
    const v = p.vendorId;
    if (v?._id && !seenVendors.has(v._id)) {
      seenVendors.add(v._id);
      vendors.push(v);
    }
  }

  return (
    <div>
      <HeroBanner externalSlides={externalSlides} />
      <TrustStrip />

      {status === 'loading' && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {status === 'error' && (
        <p className="max-w-7xl mx-auto px-4 py-16 text-center text-crimson">{t('common.error')}</p>
      )}

      {status === 'ready' && (
        <>
          {categories.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 pt-10">
              <h2 className="text-xl md:text-2xl font-extrabold mb-4">{t('home.shopByCategory')}</h2>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {categories.map((c) => {
                  const known = CATEGORY_ICONS[c.slug];
                  const Icon = known?.Icon ?? DEFAULT_CATEGORY_ICON;
                  const label = known ? t(known.i18nKey) : c.name;
                  return (
                    <Link
                      key={c._id}
                      to={`/browse?category=${c.slug}`}
                      className="group shrink-0 flex flex-col items-center gap-1.5 w-20"
                    >
                      <span className="grid place-items-center w-16 h-16 rounded-full bg-white dark:bg-slate-800 ring-1 ring-black/10 dark:ring-white/15 text-forest group-hover:bg-forest group-hover:text-white transition">
                        <Icon className="w-7 h-7" />
                      </span>
                      <span className="text-[11px] font-medium text-center leading-tight text-ink/80 dark:text-slate-300 truncate w-full">
                        {label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <section className="max-w-7xl mx-auto px-4 pt-10">
            <div className="flex items-end justify-between mb-5">
              <h2 className="text-xl md:text-2xl font-extrabold">{t('home.featured')}</h2>
              <Link to="/browse" className="text-sm font-semibold text-forest hover:text-forest-dark">
                {t('home.viewAll')}
              </Link>
            </div>
            {featured.length === 0 ? (
              <p className="text-ink/60 dark:text-slate-400">{t('common.noResults')}</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {featured.map((p) => (
                  <ProductCard key={p._id} product={mapProductCard(p)} />
                ))}
              </div>
            )}
          </section>

          {vendors.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 pt-10 pb-4">
              <h2 className="text-xl md:text-2xl font-extrabold mb-5">{t('home.topVendors')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {vendors.map((v) => (
                  <Card key={v._id} className="p-4">
                    <div className="flex items-center gap-3">
                      {v.logoUrl ? (
                        <img
                          src={resolveAssetUrl(v.logoUrl)}
                          alt=""
                          className="w-11 h-11 rounded-2xl object-cover shrink-0"
                        />
                      ) : (
                        <span className="grid place-items-center w-11 h-11 rounded-2xl bg-forest/10 text-forest font-extrabold shrink-0">
                          {v.storeName?.[0]?.toUpperCase() ?? '?'}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="font-bold truncate">{v.storeName}</h3>
                          <BadgeCheck className="w-4 h-4 text-forest shrink-0" />
                        </div>
                        {typeof v.rating === 'number' && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-ink/60 dark:text-slate-400">
                            <Star className="w-3 h-3 fill-gold text-gold" />
                            {v.rating}
                          </span>
                        )}
                      </div>
                    </div>
                    {v.slug ? (
                      <Link
                        to={`/store/${v.slug}`}
                        className="mt-3 w-full inline-flex items-center justify-center py-2 rounded-xl bg-forest/10 hover:bg-forest hover:text-white text-forest font-semibold text-sm transition"
                      >
                        {t('home.visitStore')}
                      </Link>
                    ) : (
                      <span className="mt-3 w-full inline-flex items-center justify-center py-2 rounded-xl bg-black/5 dark:bg-white/5 text-ink/40 dark:text-slate-500 font-semibold text-sm cursor-not-allowed">
                        {t('home.visitStore')}
                      </span>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          )}

          <VendorCtaBanner />
        </>
      )}
    </div>
  );
}
