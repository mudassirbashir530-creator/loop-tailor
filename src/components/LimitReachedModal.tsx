import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, Check, MessageCircle } from 'lucide-react';
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
  const currentPlanId = userData?.plan || 'basic';
  const currentPlan = PLANS[currentPlanId as keyof typeof PLANS] || PLANS.basic;

  // Let's determine the next plan to suggest
  let nextPlan = PLANS.standard;
  if (currentPlanId === 'standard') {
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
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border dark:border-slate-800 z-10"
        >
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-rose-100/50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 w-12 h-12 rounded-2xl flex items-center justify-center mb-5">
            <AlertCircle className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Limit Reached
          </h3>
          <p className="text-sm text-slate-500 font-medium mb-6">
            You have reached your <strong className="text-slate-900 dark:text-slate-200">{getLimitLabel()} limit</strong> on the {currentPlan.name} plan.
          </p>

          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Your Quota</span>
              <span className="text-sm font-mono font-bold text-rose-500">{current}/{limit}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full w-full" />
            </div>
          </div>

          {currentPlanId !== 'premium' && (
            <div className="space-y-3 mb-6 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                Upgrade to {nextPlan.name} ({nextPlan.priceLabel}):
              </p>
              {nextPlan.featureList.filter(f => f.included && !currentPlan.featureList.find(cf => cf.label === f.label && cf.included)).slice(0, 4).map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <Button
              className="w-full bg-[#25D366] hover:bg-[#1EBE5A] text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2"
              onClick={handleUpgrade}
            >
              <MessageCircle className="w-5 h-5" />
              Upgrade via WhatsApp
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl text-slate-500 font-bold"
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
