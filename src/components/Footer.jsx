import { useTranslation } from 'react-i18next';
import { Apple, Play, MessageCircle, Camera, X, PlaySquare } from 'lucide-react';

const LINK_COLUMNS = [
  { key: 'shop', i18nKey: 'footer.columns.shop' },
  { key: 'customerService', i18nKey: 'footer.columns.customerService' },
  { key: 'sell', i18nKey: 'footer.columns.sell' },
  { key: 'about', i18nKey: 'footer.columns.about' },
];

const SOCIAL_LINKS = [
  { key: 'facebook', Icon: MessageCircle },
  { key: 'instagram', Icon: Camera },
  { key: 'twitter', Icon: X },
  { key: 'youtube', Icon: PlaySquare },
];

const PAYMENT_METHODS = [
  { name: 'Telebirr', className: 'bg-telebirr' },
  { name: 'CBE Birr', className: 'bg-cbeBirr' },
  { name: 'ArifPay', className: 'bg-arifpay' },
  { name: 'Awash', className: 'bg-crimson' },
  { name: 'COD', className: 'bg-slate-600' },
];

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-16 bg-ink text-slate-300">
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-white text-lg font-bold">{t('footer.app.heading')}</h2>
            <p className="text-sm text-slate-400 mt-1">{t('footer.app.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="#"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <Apple className="w-6 h-6 shrink-0" aria-hidden="true" />
              <span className="leading-none">
                <span className="block text-[10px] text-slate-400">
                  {t('footer.app.appStoreLabel')}
                </span>
                <span className="block font-semibold text-white">
                  {t('footer.app.appStoreName')}
                </span>
              </span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <Play className="w-6 h-6 shrink-0" aria-hidden="true" />
              <span className="leading-none">
                <span className="block text-[10px] text-slate-400">
                  {t('footer.app.googlePlayLabel')}
                </span>
                <span className="block font-semibold text-white">
                  {t('footer.app.googlePlayName')}
                </span>
              </span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-10">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="grid place-items-center w-9 h-9 rounded-xl bg-forest text-white font-extrabold"
              aria-hidden="true"
            >
              ኪ
            </span>
            <span className="text-xl font-extrabold text-white">{t('brand')}</span>
          </div>
          <p className="text-sm text-slate-400 max-w-xs">{t('footer.description')}</p>
          <div className="flex gap-2 mt-4">
            {SOCIAL_LINKS.map(({ key, Icon }) => (
              <a
                key={key}
                href="#"
                aria-label={t(`footer.social.${key}`)}
                className="grid place-items-center w-9 h-9 rounded-lg bg-white/10 hover:bg-forest transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        {LINK_COLUMNS.map(({ key, i18nKey }) => {
          const headingId = `footer-col-${key}`;
          const links = t(`${i18nKey}.links`, { returnObjects: true });
          return (
            <nav key={key} aria-labelledby={headingId}>
              <h3 id={headingId} className="text-white font-semibold mb-3 text-sm">
                {t(`${i18nKey}.heading`)}
              </h3>
              <ul className="space-y-2 text-sm">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-slate-400 hover:text-gold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          );
        })}
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 order-2 md:order-1">
            © 2026 Kitman Marketplace. {t('footer.rights')}
          </p>
          <div className="order-1 md:order-2 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-400 me-1">{t('footer.weAccept')}</span>
            {PAYMENT_METHODS.map(({ name, className }) => (
              <span
                key={name}
                className={`${className} px-2.5 py-1 rounded-md text-white text-[11px] font-bold`}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
