import React from 'react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { FEATURE_LABELS, REQUIRED_PLAN, PLANS } from '../constants/plans';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Lock, ArrowLeft, Sparkles, ShieldAlert } from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { useAuth } from '../contexts/AuthContext';
import { openAdminWhatsApp } from '../lib/whatsapp';
import { motion } from 'motion/react';

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
        <div className="animate-spin h-8 w-8 border-4 border-[#0D3D33] border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentPlanId = userData?.plan || 'free';
  const requiredPlanId = REQUIRED_PLAN[feature];

  const PLAN_HIERARCHY: Record<string, number> = {
    free: 0,
    basic: 1,
    standard: 2,
    premium: 3,
    enterprise: 4
  };

  const userTier = PLAN_HIERARCHY[currentPlanId.toLowerCase()] ?? 0;
  const requiredTier = PLAN_HIERARCHY[requiredPlanId.toLowerCase()] ?? 0;

  if (features[feature] === true || requiredTier === 0 || userTier >= requiredTier) {
    return <>{children}</>;
  }
  
  const currentPlan = PLANS[currentPlanId as keyof typeof PLANS] || PLANS.free;
  const requiredPlan = PLANS[requiredPlanId as keyof typeof PLANS] || PLANS.basic;

  const handleUpgrade = () => {
    const message = `Hi, I want to upgrade my Loop Tailor plan to ${requiredPlan.name}. My account: ${userData?.email || ''}`;
    openAdminWhatsApp(message);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 min-h-[80vh]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="max-w-md w-full bg-[#0D3D33] text-white rounded-[32px] p-8 shadow-2xl border border-emerald-500/20 text-center relative overflow-hidden backdrop-blur-xl"
      >
        {/* Ambient glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#2ECC71]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#2ECC71]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Lock Icon Badge */}
          <div className="relative w-20 h-20 bg-white/10 border border-white/20 text-[#2ECC71] rounded-3xl flex items-center justify-center mx-auto shadow-xl">
            <Lock className="w-9 h-9" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-[#2ECC71]/20 text-[#2ECC71] font-black text-[10px] uppercase tracking-widest inline-block mb-2">
              PRO FEATURE LOCKED
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {FEATURE_LABELS[feature]}
            </h2>
            <p className="text-xs sm:text-sm text-white/70 font-semibold mt-1">
              Unlock this feature by upgrading your plan
            </p>
          </div>

          {/* Plan Comparison Box */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-3 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs pb-3 border-b border-white/10">
              <span className="text-white/60 font-bold">Your Active Plan:</span>
              <span className="font-black text-white">{currentPlan.name} <span className="text-white/40">({currentPlan.priceLabel})</span></span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/60 font-bold">Required Plan:</span>
              <span className="font-black text-[#2ECC71]">{requiredPlan.name} <span className="text-[#2ECC71]/70">({requiredPlan.priceLabel})</span></span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleUpgrade}
              className="w-full bg-[#2ECC71] hover:bg-[#27ae60] text-slate-950 font-black h-13 rounded-2xl flex items-center justify-center gap-2.5 text-sm shadow-xl shadow-[#2ECC71]/20 transition-all cursor-pointer"
            >
              <WhatsAppIcon className="w-5 h-5 fill-current text-slate-950" />
              Upgrade via WhatsApp
            </motion.button>
            <button
              onClick={() => navigate(-1)}
              className="w-full h-11 rounded-xl text-white/60 font-bold text-xs hover:bg-white/10 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
