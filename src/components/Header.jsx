import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '../store/uiStore';
import { useCartStore } from '../store/cartStore';

const LABEL = { en: 'EN', am: 'አማ', ar: 'ع' };
export default function Header() {
  const { t } = useTranslation();
  const cycleLanguage = useUiStore((s) => s.cycleLanguage);
  const language = useUiStore((s) => s.language);
  const count = useCartStore((s) => s.count());
  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-black/5">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-forest text-white font-extrabold">ኪ</span>
          <span className="text-xl font-extrabold text-forest">{t('brand')}</span>
        </Link>
        <input
          className="hidden md:block flex-1 max-w-xl px-4 py-2.5 rounded-2xl ring-1 ring-black/10 bg-white outline-none focus:ring-2 focus:ring-forest text-sm"
          placeholder={t('common.search')}
        />
        <nav className="ms-auto flex items-center gap-2 text-sm font-medium">
          <Link to="/browse" className="hidden sm:block hover:text-forest">{t('nav.browse')}</Link>
          <button onClick={cycleLanguage} className="px-2.5 py-1.5 rounded-lg ring-1 ring-black/10 hover:bg-black/5" title="Language">
            {LABEL[language]}
          </button>
          <Link to="/login" className="hover:text-forest">{t('nav.login')}</Link>
          <Link to="/cart" className="relative grid place-items-center w-10 h-10 rounded-xl hover:bg-black/5">
            🛍️
            {count > 0 && (
              <span className="absolute -top-0.5 -end-0.5 min-w-4 h-4 px-1 grid place-items-center text-[10px] font-bold text-white bg-crimson rounded-full">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
