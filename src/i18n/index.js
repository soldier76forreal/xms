import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fa from './locales/fa.json';
import ar from './locales/ar.json';

// Supported languages — RTL flag drives both the document `dir` attribute and
// the MUI theme's `direction`. Add a new language here + a matching
// src/i18n/locales/<code>.json file; nothing else needs to change for new
// features to pick it up (they just call useTranslation() like everywhere else).
export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', rtl: false },
  { code: 'fa', label: 'Farsi',   nativeLabel: 'فارسی',   rtl: true },
  { code: 'ar', label: 'Arabic',  nativeLabel: 'العربية', rtl: true },
];

export const STORAGE_KEY = 'xms_language';
export const DEFAULT_LANGUAGE = 'en';

export const isRtlLang = (code) => LANGUAGES.find((l) => l.code === code)?.rtl ?? false;

const stored = (() => {
  try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
})();
const initialLang = LANGUAGES.some((l) => l.code === stored) ? stored : DEFAULT_LANGUAGE;

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fa: { translation: fa },
    ar: { translation: ar },
  },
  lng: initialLang,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },   // React already escapes
  returnEmptyString: false,
});

export default i18n;
