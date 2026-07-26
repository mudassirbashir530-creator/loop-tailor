import { useAuth } from '../contexts/AuthContext';

export function useFeatureAccess() {
  const { user, userData, loading } = useAuth();

  const features = userData?.features || {};
  const currentPlan = userData?.plan || 'free';

  const canManageWorkers = true; // All plans can manage staff within quota
  const canDownloadInvoice = true; // All plans can view & print invoices
  const canUploadImages = true; // All plans can upload reference photos

  const canUseWhatsApp = 
    features?.canUseWhatsApp === true 
    || currentPlan === 'standard' 
    || currentPlan === 'premium'
    || currentPlan === 'enterprise';

  const canUsePayroll = 
    features?.canUsePayroll === true 
    || currentPlan === 'premium'
    || currentPlan === 'enterprise';

  const canViewAnalytics = 
    features?.canViewAnalytics === true 
    || currentPlan === 'premium'
    || currentPlan === 'enterprise';

  const canCustomBranding = 
    features?.canCustomBranding === true 
    || currentPlan === 'premium'
    || currentPlan === 'enterprise';

  return {
    canDownloadInvoice,
    canUploadImages,
    canUseWhatsApp,
    canUsePayroll,
    canViewAnalytics,
    canCustomBranding,
    canManageWorkers,
    isLoading: loading,
    currentPlan
  };
}
