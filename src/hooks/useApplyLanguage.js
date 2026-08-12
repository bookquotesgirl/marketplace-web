import { useEffect } from 'react';
import i18n from '../i18n/i18n';
import { useUiStore } from '../store/uiStore';
// Keeps <html lang/dir>, i18next and dark class in sync with the ui store.
export function useApplyLanguage() {
  const { language, dark } = useUiStore();
  useEffect(() => {
    const rtl = language === 'ar';
    document.documentElement.lang = language;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    i18n.changeLanguage(language);
  }, [language]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
}
