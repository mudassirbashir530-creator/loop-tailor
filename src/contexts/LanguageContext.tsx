import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import enTranslations from '../locales/en.json';
import urTranslations from '../locales/ur.json';

type Language = 'en' | 'ur';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (key: string) => key,
  isRTL: false,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const fetchUserLanguage = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.preferred_language === 'ur' || data.preferred_language === 'en') {
              setLanguageState(data.preferred_language);
            }
          }
        } catch (error) {
          console.error("Error fetching language preference:", error);
        }
      }
    };
    fetchUserLanguage();
  }, [user]);

  useEffect(() => {
    // Apply RTL and font changes
    const html = document.documentElement;
    if (language === 'ur') {
      html.setAttribute('dir', 'rtl');
      html.classList.add('lang-ur');
      html.classList.remove('lang-en');
    } else {
      html.setAttribute('dir', 'ltr');
      html.classList.add('lang-en');
      html.classList.remove('lang-ur');
    }
  }, [language]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { preferred_language: lang });
      } catch (error) {
        console.error("Error updating language preference:", error);
      }
    }
  };

  const t = (path: string) => {
    const keys = path.split('.');
    let current: any = language === 'ur' ? urTranslations : enTranslations;
    
    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Translation key not found: ${path}`);
        return path;
      }
      current = current[key];
    }
    return current as string;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL: language === 'ur' }}>
      {children}
    </LanguageContext.Provider>
  );
};
