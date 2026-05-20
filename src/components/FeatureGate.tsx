import React from 'react';
import { Lock } from 'lucide-react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

interface FeatureGateProps {
  feature: 'canDownloadInvoice' | 'canUploadImages' | 'canUseWhatsApp' | 'canUsePayroll' | 'canViewAnalytics' | 'canCustomBranding' | 'canManageWorkers';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ feature, children, fallback }) => {
  const features = useFeatureAccess();
  const navigate = useNavigate();

  const isAccessAllowed = features[feature];

  if (features.isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin h-6 w-6 border-2 border-[#0D3D33] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAccessAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-6 text-center border-2 border-dashed border-red-200 bg-red-50/50 rounded-2xl max-w-md mx-auto my-4 animate-in fade-in duration-300">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <Lock className="w-5 h-5 text-red-600" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">Feature Locked</h3>
      <p className="text-sm text-slate-600 mb-4 px-2">
        This feature is not available on your current plan. Contact admin to upgrade.
      </p>
      <Button 
        variant="default" 
        onClick={() => navigate('/app/upgrade', { state: { message: "Upgrade your plan to access this feature" } })}
        className="h-[44px] rounded-xl font-semibold bg-[#0D3D33] hover:bg-[#082620]"
      >
        View Pricing Plans
      </Button>
    </div>
  );
};
