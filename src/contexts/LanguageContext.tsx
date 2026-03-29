import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import enTranslations from '../locales/en.json';
import urTranslations from '../locales/ur.json';

export type Language = 'en' | 'ur';
export type UrduFont = 'noto-nastaliq' | 'gulzar' | 'lateef' | 'noto-sans';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  urduFont: UrduFont;
  setUrduFont: (font: UrduFont) => Promise<void>;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  urduFont: 'noto-nastaliq',
  setUrduFont: async () => {},
  t: (key: string) => key,
  isRTL: false,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>('en');
  const [urduFont, setUrduFontState] = useState<UrduFont>('noto-nastaliq');

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
            if (data.urdu_font) {
              setUrduFontState(data.urdu_font as UrduFont);
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

    // Font classes
    const fontClasses = ['font-urdu-noto-nastaliq', 'font-urdu-gulzar', 'font-urdu-lateef', 'font-urdu-noto-sans'];
    fontClasses.forEach(cls => html.classList.remove(cls));
    
    if (language === 'ur') {
      html.classList.add(`font-urdu-${urduFont}`);
    }
  }, [language, urduFont]);

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

  const setUrduFont = async (font: UrduFont) => {
    setUrduFontState(font);
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { urdu_font: font });
      } catch (error) {
        console.error("Error updating Urdu font preference:", error);
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
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      urduFont, 
      setUrduFont, 
      t, 
      isRTL: language === 'ur' 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
