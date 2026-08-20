import { useTranslation } from 'react-i18next';

// GET /api/vendor/orders — future story
export default function VendorOrders() {
  const { t } = useTranslation();
  return (
    <div className="py-16 text-center text-ink/50">
      <p className="text-lg font-semibold">{t('vendor.nav.orders')}</p>
      <p className="text-sm mt-1">{t('common.comingSoon')}</p>
    </div>
  );
}
