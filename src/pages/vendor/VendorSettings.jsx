import { useTranslation } from 'react-i18next';

// PATCH /api/vendor/settings — future story
export default function VendorSettings() {
  const { t } = useTranslation();
  return (
    <div className="py-16 text-center text-ink/50">
      <p className="text-lg font-semibold">{t('vendor.nav.settings')}</p>
      <p className="text-sm mt-1">{t('common.comingSoon')}</p>
    </div>
  );
}
