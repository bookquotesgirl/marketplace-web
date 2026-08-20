import { useUiStore } from '../store/uiStore';

// Thin selector hook over uiStore — the app-facing API for language state.
export function useLanguage() {
  const language = useUiStore((s) => s.language);
  const setLanguage = useUiStore((s) => s.setLanguage);
  const cycleLanguage = useUiStore((s) => s.cycleLanguage);
  return { language, setLanguage, cycleLanguage, dir: language === 'ar' ? 'rtl' : 'ltr' };
}
