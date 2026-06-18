import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, Check } from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { useAuth } from '../contexts/AuthContext';
import { PLANS } from '../constants/plans';
import { Button } from './ui/button';

export interface LimitReachedModalProps {
  limitType: 'customers' | 'orders' | 'workers';
  current: number;
  limit: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function LimitReachedModal({ limitType, current, limit, isOpen, onClose }: LimitReachedModalProps) {
  const { userData } = useAuth();
  const currentPlanId = userData?.plan || 'free';
  const currentPlan = PLANS[currentPlanId as keyof typeof PLANS] || PLANS.free;

  // Let's determine the next plan to suggest
  let nextPlan: any = PLANS.basic;
  if (currentPlanId === 'free') {
    nextPlan = PLANS.basic;
  } else if (currentPlanId === 'basic') {
    nextPlan = PLANS.standard;
  } else if (currentPlanId === 'standard') {
    nextPlan = PLANS.premium;
  } else if (currentPlanId === 'premium') {
    // Edge case if someone hits a limit on premium (almost impossible)
    nextPlan = PLANS.premium; 
  }

  const handleUpgrade = () => {
    const message = encodeURIComponent(`Hi, I want to upgrade my Loop Tailor plan to ${nextPlan.name}. My account: ${userData?.email}`);
    // Replace with actual admin number
    const adminWhatsApp = '+923000000000';
    window.open(`https://wa.me/${adminWhatsApp}?text=${message}`, '_blank');
    onClose();
  };

  const getLimitLabel = () => {
    switch(limitType) {
      case 'customers': return 'customer';
      case 'orders': return 'monthly order';
      case 'workers': return 'worker';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 z-10 text-center overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-rose-50 dark:from-rose-500/5 to-transparent pointer-events-none" />

          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onClose}
              className="p-2 bg-white/50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative w-20 h-20 bg-rose-100/50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-white dark:ring-slate-900 shadow-sm z-10">
            <AlertCircle className="w-8 h-8" />
            <div className="absolute inset-0 rounded-full border border-rose-200 dark:border-rose-700/50 scale-110 blur-[2px]" />
          </div>

          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2 relative z-10">
            Limit Reached
          </h3>
          <p className="text-sm text-slate-500 font-medium mb-8 relative z-10">
            You've reached your <strong className="text-slate-900 dark:text-slate-200">{getLimitLabel()} limit</strong> on the {currentPlan.name} plan.
          </p>

          <div className="mb-8 relative z-10 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 backdrop-blur-sm text-left">
            <div className="flex justify-between items-end mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">Your Quota</span>
              <span className="text-sm font-mono font-bold text-rose-500">{current} / {limit}</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full w-full" />
            </div>
          </div>

          {currentPlanId !== 'premium' && (
            <div className="space-y-3 mb-8 relative z-10 text-left bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                Upgrade to {nextPlan.name} ({nextPlan.priceLabel}):
              </p>
              {nextPlan.featureList.filter((f: any) => f.included && !currentPlan.featureList.find(cf => cf.label === f.label && cf.included)).slice(0, 4).map((f: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                  <Check className="w-4 h-4 text-[#25D366] flex-shrink-0" />
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 relative z-10">
            <Button
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-14 rounded-2xl flex items-center justify-center gap-3 text-base shadow-lg shadow-[#25D366]/20 border-none transition-all"
              onClick={handleUpgrade}
            >
              <WhatsAppIcon className="w-6 h-6 fill-current text-white" />
              Upgrade via WhatsApp
            </Button>
            <Button
              variant="ghost"
              className="w-full h-14 rounded-2xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
