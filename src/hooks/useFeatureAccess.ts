import { useAuth } from '../contexts/AuthContext';

export interface PlanFeatures {
  canDownloadInvoice: boolean;
  canUploadImages: boolean;
  canUseWhatsApp: boolean;
  canUsePayroll: boolean;
  canViewAnalytics: boolean;
  canCustomBranding: boolean;
  canManageWorkers: boolean;
}

export function useFeatureAccess() {
  const { userData, loading } = useAuth();

  const features: PlanFeatures = userData?.features || {
    canDownloadInvoice: false,
    canUploadImages: false,
    canUseWhatsApp: false,
    canUsePayroll: false,
    canViewAnalytics: false,
    canCustomBranding: false,
    canManageWorkers: true
  };

  return {
    canDownloadInvoice: !!features.canDownloadInvoice,
    canUploadImages: !!features.canUploadImages,
    canUseWhatsApp: !!features.canUseWhatsApp,
    canUsePayroll: !!features.canUsePayroll,
    canViewAnalytics: !!features.canViewAnalytics,
    canCustomBranding: !!features.canCustomBranding,
    canManageWorkers: !!features.canManageWorkers,
    isLoading: loading
  };
}
