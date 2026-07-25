import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useFeatureAccess() {
  const { user, loading } = useAuth();
  const [features, setFeatures] = useState<any>({
    canDownloadInvoice: true,
    canUploadImages: true,
    canUseWhatsApp: false,
    canUsePayroll: false,
    canViewAnalytics: false,
    canCustomBranding: false,
    canManageWorkers: true
  });
  const [currentPlan, setCurrentPlan] = useState<string>('free');
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
            canDownloadInvoice: data.features.canDownloadInvoice !== false,
            canUploadImages: data.features.canUploadImages !== false,
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

  const canManageWorkers = true; // All plans (including Free 1-worker) can manage workers within quota limit
  const canDownloadInvoice = true; // All plans can view & print invoices
  const canUploadImages = true; // All plans can upload reference photos

  const canUseWhatsApp = 
    features?.canUseWhatsApp === true 
    || currentPlan === 'standard' 
    || currentPlan === 'premium';

  const canUsePayroll = 
    features?.canUsePayroll === true 
    || currentPlan === 'premium';

  const canViewAnalytics = 
    features?.canViewAnalytics === true 
    || currentPlan === 'premium';

  return {
    canDownloadInvoice,
    canUploadImages,
    canUseWhatsApp,
    canUsePayroll,
    canViewAnalytics,
    canCustomBranding: !!features.canCustomBranding || currentPlan === 'premium',
    canManageWorkers,
    isLoading,
    currentPlan
  };
}
