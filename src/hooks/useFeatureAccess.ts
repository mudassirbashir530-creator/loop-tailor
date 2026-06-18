import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useFeatureAccess() {
  const { user, loading } = useAuth();
  const [features, setFeatures] = useState<any>({
    canDownloadInvoice: false,
    canUploadImages: true,
    canUseWhatsApp: false,
    canUsePayroll: false,
    canViewAnalytics: false,
    canCustomBranding: false,
    canManageWorkers: true
  });
  const [currentPlan, setCurrentPlan] = useState<string>('basic');
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLocalLoading(false);
      return;
    }

    const docRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data?.features) {
          setFeatures({
            canDownloadInvoice: !!data.features.canDownloadInvoice,
            canUploadImages: !!data.features.canUploadImages,
            canUseWhatsApp: !!data.features.canUseWhatsApp,
            canUsePayroll: !!data.features.canUsePayroll,
            canViewAnalytics: !!data.features.canViewAnalytics,
            canCustomBranding: !!data.features.canCustomBranding,
            canManageWorkers: data.features.canManageWorkers !== false,
          });
        }
        if (data?.plan) {
          setCurrentPlan(data.plan);
        }
      }
      setLocalLoading(false);
    }, (error) => {
      console.error("Error fetching feature access:", error);
      setLocalLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const isLoading = loading || localLoading;

  const canManageWorkers = 
    features?.canManageWorkers !== false 
    || currentPlan === 'basic'
    || currentPlan === 'standard'
    || currentPlan === 'premium';

  const canUploadImages = 
    features?.canUploadImages !== false 
    || currentPlan === 'free'
    || currentPlan === 'basic'
    || currentPlan === 'standard'
    || currentPlan === 'premium';

  return {
    canDownloadInvoice: !!features.canDownloadInvoice,
    canUploadImages,
    canUseWhatsApp: !!features.canUseWhatsApp,
    canUsePayroll: !!features.canUsePayroll,
    canViewAnalytics: !!features.canViewAnalytics,
    canCustomBranding: !!features.canCustomBranding,
    canManageWorkers,
    isLoading,
    currentPlan
  };
}

