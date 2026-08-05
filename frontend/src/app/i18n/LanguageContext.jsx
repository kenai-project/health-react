import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { translations, LANGUAGES, DEFAULT_LANGUAGE } from './translations';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'app_language';
const FIRST_VISIT_KEY = 'language_first_visit_done';

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) return saved;
    return DEFAULT_LANGUAGE;
  });

  // Persist language and update <html lang>
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  // Translation function with {placeholder} interpolation
  const t = useCallback(
    (key, vars) => {
      const dict = translations[language] || translations[DEFAULT_LANGUAGE] || {};
      let str = dict[key];
      if (str === undefined) {
        // Fallback to default language
        str = (translations[DEFAULT_LANGUAGE] || {})[key];
      }
      if (str === undefined) {
        // Final fallback: return the key itself
        return key;
      }
      if (vars && typeof str === 'string') {
        str = str.replace(/\{(\w+)\}/g, (_, name) =>
          vars[name] !== undefined ? String(vars[name]) : `{${name}}`
        );
      }
      return str;
    },
    [language]
  );

  const changeLanguage = useCallback((lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  }, []);

  // First-visit helpers
  const isFirstVisit = () => !localStorage.getItem(FIRST_VISIT_KEY);
  const markFirstVisitDone = () => localStorage.setItem(FIRST_VISIT_KEY, 'true');

  const value = useMemo(
    () => ({
      language,
      languages: LANGUAGES,
      t,
      changeLanguage,
      isFirstVisit,
      markFirstVisitDone,
    }),
    [language, t, changeLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};