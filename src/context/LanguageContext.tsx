import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Language } from '../types';
import { translations, Translations } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
  rtl: boolean;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem('hebr_lang') as Language | null;
      if (stored === 'ar' || stored === 'en') return stored;
    } catch {
      // localStorage may fail in restricted iframes or disabled cookies
    }
    return 'ar';
  });

  const setLanguage = React.useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('hebr_lang', lang);
    } catch {
      // ignore storage error
    }
  }, []);

  const toggleLanguage = React.useCallback(() => {
    setLanguageState(prev => {
      const next = prev === 'ar' ? 'en' : 'ar';
      try {
        localStorage.setItem('hebr_lang', next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const isRtl = language === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    if (isRtl) {
      document.body.classList.remove('font-en');
      document.body.classList.add('font-ar');
    } else {
      document.body.classList.remove('font-ar');
      document.body.classList.add('font-en');
    }
  }, [language]);

  const value = useMemo<LanguageContextType>(() => {
    const isRtl = language === 'ar';
    return {
      language,
      setLanguage,
      toggleLanguage,
      t: translations[language],
      rtl: isRtl,
      dir: isRtl ? 'rtl' : 'ltr',
    };
  }, [language, setLanguage, toggleLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Re-export translations
export { translations };
