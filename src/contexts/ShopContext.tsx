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
  uiTheme: 'neumorphic' | 'minimalist' | 'elegant';
  enableWhatsappNotifications?: boolean;
  countryCode?: string;
  templates?: {
    newOrder?: string;
    readyForDelivery?: string;
    paymentReminder?: string;
  };
  messageTemplates?: {
    orderReady?: string;
    delivered?: string;
    paymentReminder?: string;
  };
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
  enableWhatsappNotifications: false,
};

const ShopContext = createContext<ShopContextType>({
  settings: defaultSettings,
  loading: true,
});

export const useShop = () => useContext(ShopContext);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(doc(db, 'settings', user.uid), (docSnap) => {
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
          enableWhatsappNotifications: !!data.enableWhatsappNotifications,
          countryCode: data.countryCode || '+92',
          templates: data.templates || undefined,
          messageTemplates: data.messageTemplates || undefined,
        });
      }
      setLoading(false);
    }, (error) => {
      console.error(error);
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
