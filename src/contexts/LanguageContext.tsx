import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import enTranslations from '../locales/en.json';
import urTranslations from '../locales/ur.json';

export type Language = 'en' | 'ur';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, returnObjects?: boolean) => any;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (key: string, returnObjects?: boolean) => key,
  isRTL: false,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const fetchUserPreferences = async () => {
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
          console.error("Error fetching user preferences:", error);
        }
      }
    };
    fetchUserPreferences();
  }, [user]);

  useEffect(() => {
    // Apply RTL and font changes
    const html = document.documentElement;
    
    // Language classes
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

  const t = (path: string, returnObjects: boolean = false): any => {
    const keys = path.split('.');
    type TranslationNode = string | any[] | { [key: string]: TranslationNode };
    let current: TranslationNode = language === 'ur' ? (urTranslations as TranslationNode) : (enTranslations as TranslationNode);
    
    for (const key of keys) {
      if (typeof current === 'object' && current !== null && key in current) {
        current = (current as Record<string, TranslationNode>)[key];
      } else {
        console.warn(`Translation key not found: ${path}`);
        return path;
      }
    }

    if (returnObjects) {
      return current;
    }

    return typeof current === 'string' ? current : path;
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t, 
      isRTL: language === 'ur' 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
