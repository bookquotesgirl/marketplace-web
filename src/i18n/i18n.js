import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import am from './locales/am.json';
import ar from './locales/ar.json';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, am: { translation: am }, ar: { translation: ar } },
  lng: 'en',
  fallbackLng: 'en', // missing keys fall back to English, never blank
  interpolation: { escapeValue: false },
});

export default i18n;
