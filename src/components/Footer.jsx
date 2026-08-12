import { useTranslation } from 'react-i18next';
export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-16 bg-ink text-slate-300">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-xl font-extrabold text-white">{t('brand')}</div>
        <p className="text-sm text-slate-400 mt-1">{t('footer.tagline')}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          {['Telebirr', 'CBE Birr', 'ArifPay', 'Awash', 'COD'].map((p) => (
            <span key={p} className="px-2.5 py-1 rounded-md bg-white/10 text-white font-bold">{p}</span>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-6">© 2026 Kitman. {t('footer.rights')}</p>
      </div>
    </footer>
  );
}
