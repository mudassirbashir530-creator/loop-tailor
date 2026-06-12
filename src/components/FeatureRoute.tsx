import React from 'react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { FEATURE_LABELS, REQUIRED_PLAN, PLANS } from '../constants/plans';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Lock, ArrowLeft, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export interface FeatureRouteProps {
  feature: keyof typeof FEATURE_LABELS;
  children: React.ReactNode;
}

export default function FeatureRoute({ feature, children }: FeatureRouteProps) {
  const features = useFeatureAccess();
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  if (features.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentPlanId = userData?.plan || 'free';
  const requiredPlanId = REQUIRED_PLAN[feature];

  if (features[feature] || requiredPlanId === 'free' || currentPlanId === requiredPlanId) {
    return <>{children}</>;
  }
  
  const currentPlan = PLANS[currentPlanId as keyof typeof PLANS] || PLANS.free;
  const requiredPlan = PLANS[requiredPlanId as keyof typeof PLANS] || PLANS.basic;

  const handleUpgrade = () => {
    const message = encodeURIComponent(`Hi, I want to upgrade my Loop Tailor plan to ${requiredPlan.name}. My account: ${userData?.email}`);
    // Replace with actual admin number
    const adminWhatsApp = '+923000000000';
    window.open(`https://wa.me/${adminWhatsApp}?text=${message}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 text-center">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
          {FEATURE_LABELS[feature]}
        </h2>
        <p className="text-sm text-slate-500 font-medium mb-8">
          is not available on your current plan.
        </p>

        <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 mb-8 border border-slate-100 dark:border-slate-800/50">
          <div className="flex justify-between items-center text-sm mb-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 font-medium">Your Plan</span>
            <span className="font-bold text-slate-900 dark:text-white">{currentPlan.name} (Rs.{currentPlan.price})</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">Required</span>
            <span className="font-bold text-amber-600 dark:text-amber-500">{requiredPlan.name} (Rs.{requiredPlan.price})</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full bg-[#25D366] hover:bg-[#1EBE5A] text-white font-bold h-14 rounded-2xl flex items-center justify-center gap-2 text-base transition-colors"
            onClick={handleUpgrade}
          >
            <MessageCircle className="w-6 h-6" />
            Upgrade via WhatsApp
          </Button>
          <Button
            variant="ghost"
            className="w-full h-14 rounded-2xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
