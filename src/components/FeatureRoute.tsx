import React from 'react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { FEATURE_LABELS, REQUIRED_PLAN, PLANS } from '../constants/plans';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Lock, ArrowLeft } from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
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

  if (features[feature] || (requiredPlanId as string) === 'free' || currentPlanId === requiredPlanId) {
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
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-amber-50 dark:from-amber-500/5 to-transparent pointer-events-none" />
        
        <div className="relative w-20 h-20 bg-amber-100/50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-white dark:ring-slate-900 shadow-sm">
          <Lock className="w-8 h-8" />
          <div className="absolute inset-0 rounded-full border border-amber-200 dark:border-amber-700/50 scale-110 blur-[2px]" />
        </div>
        
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight relative z-10">
          {FEATURE_LABELS[feature]}
        </h2>
        <p className="text-sm text-slate-500 font-medium mb-8 relative z-10">
          This feature requires a plan upgrade.
        </p>

        <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-5 mb-8 border border-slate-100 dark:border-slate-700/50 backdrop-blur-sm">
          <div className="flex justify-between items-center text-sm mb-4 pb-4 border-b border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-500 font-medium">Your Plan</span>
            <span className="font-bold text-slate-900 dark:text-white">{currentPlan.name} <span className="text-slate-400 font-normal">({currentPlan.price})</span></span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">Required</span>
            <span className="font-bold text-amber-600 dark:text-amber-500">{requiredPlan.name} <span className="text-amber-600/60 dark:text-amber-500/60 font-normal">({requiredPlan.price})</span></span>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <Button
            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-14 rounded-2xl flex items-center justify-center gap-3 text-base transition-all shadow-lg shadow-[#25D366]/20 border-none"
            onClick={handleUpgrade}
          >
            <WhatsAppIcon className="w-6 h-6 fill-current text-white" />
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
