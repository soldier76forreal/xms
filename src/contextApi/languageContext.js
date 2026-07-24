import React, { useState, useEffect } from 'react';
import i18n, { LANGUAGES, STORAGE_KEY, DEFAULT_LANGUAGE, isRtlLang } from '../i18n';

const LanguageCtx = React.createContext({
  language: DEFAULT_LANGUAGE,
  isRtl: false,
  setLanguage: () => {},
  languages: LANGUAGES,
});

// Mirrors ThemeContextProvider's shape (localStorage-persisted, one setter) so
// the two toggles behave identically from a consumer's point of view. Owns
// the document-level side effects (dir/lang attributes) that a plain i18next
// language change doesn't handle on its own.
export const LanguageContextProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.some((l) => l.code === stored) ? stored : DEFAULT_LANGUAGE;
  });

  const applyDocumentDirection = (lang) => {
    const rtl = isRtlLang(lang);
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  // Apply on mount too — i18n.init() already set i18next's language, but the
  // document attributes need setting on first load as well as on change.
  useEffect(() => { applyDocumentDirection(language); }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const setLanguage = (code) => {
    if (!LANGUAGES.some((l) => l.code === code)) return;
    localStorage.setItem(STORAGE_KEY, code);
    i18n.changeLanguage(code);
    applyDocumentDirection(code);
    setLanguageState(code);
  };

  return (
    <LanguageCtx.Provider value={{ language, isRtl: isRtlLang(language), setLanguage, languages: LANGUAGES }}>
      {children}
    </LanguageCtx.Provider>
  );
};

export default LanguageCtx;
