import { useTranslation } from 'react-i18next';

// PATCH /api/admin/settings — future story
export default function AdminSettings() {
  const { t } = useTranslation();
  return (
    <div className="py-16 text-center text-slate-400">
      <p className="text-lg font-semibold text-white">{t('admin.nav.settings')}</p>
      <p className="text-sm mt-1">{t('common.comingSoon')}</p>
    </div>
  );
}
