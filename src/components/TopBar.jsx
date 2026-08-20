import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, MapPin, PackageSearch, Headphones, Store } from 'lucide-react';
import { useUiStore } from '../store/uiStore';

const LANG_NAME = { en: 'English', am: 'አማርኛ', ar: 'العربية' };
const CITIES = ['Addis Ababa', 'Adama', 'Hawassa', 'Bahir Dar', 'Dire Dawa', 'Mekelle', 'Gondar'];

export default function TopBar() {
  const { t } = useTranslation();
  const language = useUiStore((s) => s.language);
  const cycleLanguage = useUiStore((s) => s.cycleLanguage);
  const [city, setCity] = useState(CITIES[0]);

  return (
    <div className="hidden md:block bg-forest-deep text-cream/90 text-xs">
      <div className="max-w-7xl mx-auto px-4 h-9 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button
            onClick={cycleLanguage}
            className="flex items-center gap-1.5 hover:text-gold transition"
            aria-label="Language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{LANG_NAME[language]}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gold" />
            <span>{t('topbar.deliverTo')}</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-transparent border-none text-cream/90 focus:ring-0 cursor-pointer hover:text-gold py-0 ps-1 pe-5"
            >
              {CITIES.map((c) => (
                <option className="text-ink" key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/orders" className="flex items-center gap-1.5 hover:text-gold transition">
            <PackageSearch className="w-3.5 h-3.5" />
            <span>{t('topbar.trackOrder')}</span>
          </Link>
          <span className="flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5" />
            <span>{t('topbar.support')}</span>
          </span>
          <Link
            to="/vendor"
            className="flex items-center gap-1.5 font-semibold text-gold hover:text-gold-light transition"
          >
            <Store className="w-3.5 h-3.5" />
            <span>{t('topbar.sellOnKitman')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
