import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { APP_CONFIG } from '../lib/config';

interface ShopSettings {
  name: string;
  phone: string;
  address: string;
  logoUrl: string;
  invoiceFooter: string;
  currency: string;
  uiTheme: 'neumorphic' | 'minimalist';
}

interface ShopContextType {
  settings: ShopSettings;
  loading: boolean;
}

const defaultSettings: ShopSettings = {
  name: '',
  phone: '',
  address: '',
  logoUrl: '',
  invoiceFooter: '',
  currency: APP_CONFIG.defaultCurrency,
  uiTheme: 'neumorphic',
};

const ShopContext = createContext<ShopContextType>({
  settings: defaultSettings,
  loading: true,
});

export const useShop = () => useContext(ShopContext);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'shops', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
          logoUrl: data.logoUrl || '',
          invoiceFooter: data.invoiceFooter || '',
          currency: data.currency || APP_CONFIG.defaultCurrency,
          uiTheme: data.uiTheme || 'neumorphic',
        });
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `shops/${user.uid}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <ShopContext.Provider value={{ settings, loading }}>
      {children}
    </ShopContext.Provider>
  );
};
