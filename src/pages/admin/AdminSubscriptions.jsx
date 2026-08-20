import { useTranslation } from 'react-i18next';

// GET /api/admin/subscriptions — future story
export default function AdminSubscriptions() {
  const { t } = useTranslation();
  return (
    <div className="py-16 text-center text-slate-400">
      <p className="text-lg font-semibold text-white">{t('admin.nav.subscriptions')}</p>
      <p className="text-sm mt-1">{t('common.comingSoon')}</p>
    </div>
  );
}
