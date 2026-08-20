import { useTranslation } from 'react-i18next';

// GET /api/vendor/subscription — future story
export default function VendorSubscription() {
  const { t } = useTranslation();
  return (
    <div className="py-16 text-center text-ink/50">
      <p className="text-lg font-semibold">{t('vendor.nav.subscription')}</p>
      <p className="text-sm mt-1">{t('common.comingSoon')}</p>
    </div>
  );
}
