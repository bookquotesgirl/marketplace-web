import { useTranslation } from 'react-i18next';

// GET /api/admin/vendors — future story
export default function AdminVendors() {
  const { t } = useTranslation();
  return (
    <div className="py-16 text-center text-slate-400">
      <p className="text-lg font-semibold text-white">{t('admin.nav.vendors')}</p>
      <p className="text-sm mt-1">{t('common.comingSoon')}</p>
    </div>
  );
}
