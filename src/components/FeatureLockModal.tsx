import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X, Check, AlertTriangle } from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { FEATURE_LABELS, REQUIRED_PLAN, PLANS } from '../constants/plans';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';

export interface FeatureLockModalProps {
  feature: keyof typeof FEATURE_LABELS;
  isOpen: boolean;
  onClose: () => void;
}

export default function FeatureLockModal({ feature, isOpen, onClose }: FeatureLockModalProps) {
  const { userData } = useAuth();
  const currentPlanId = userData?.plan || 'free';
  const requiredPlanId = REQUIRED_PLAN[feature];
  
  const currentPlan = PLANS[currentPlanId as keyof typeof PLANS] || PLANS.free;
  const requiredPlan = PLANS[requiredPlanId as keyof typeof PLANS] || PLANS.basic;

  const handleUpgrade = () => {
    const message = encodeURIComponent(`Hi, I want to upgrade my Loop Tailor plan to ${requiredPlan.name}. My account: ${userData?.email}`);
    // Replace with actual admin number
    const adminWhatsApp = '+923000000000';
    window.open(`https://wa.me/${adminWhatsApp}?text=${message}`, '_blank');
    onClose();
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
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-amber-50 dark:from-amber-500/5 to-transparent pointer-events-none" />

          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onClose}
              className="p-2 bg-white/50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative w-20 h-20 bg-amber-100/50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-white dark:ring-slate-900 shadow-sm z-10">
            <Lock className="w-8 h-8" />
            <div className="absolute inset-0 rounded-full border border-amber-200 dark:border-amber-700/50 scale-110 blur-[2px]" />
          </div>

          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2 relative z-10">
            Feature Locked
          </h3>
          <p className="text-sm text-slate-500 font-medium mb-8 relative z-10">
            <strong className="text-slate-900 dark:text-slate-200">{FEATURE_LABELS[feature]}</strong> requires <strong className="text-slate-900 dark:text-slate-200">{requiredPlan.name}</strong> plan.
          </p>

          <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-5 mb-6 border border-slate-100 dark:border-slate-700/50 backdrop-blur-sm relative z-10 text-left">
            <div className="flex justify-between items-center text-sm mb-4 pb-4 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 font-medium">Your Plan:</span>
              <span className="font-bold text-slate-900 dark:text-white">{currentPlan.name} <span className="text-slate-400 font-normal">({currentPlan.price})</span></span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Required:</span>
              <span className="font-bold text-amber-600 dark:text-amber-500">{requiredPlan.name} <span className="text-amber-600/60 dark:text-amber-500/60 font-normal">({requiredPlan.price})</span></span>
            </div>
          </div>

          <div className="space-y-3 mb-8 relative z-10 text-left bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Upgrade to unlock:</p>
            {requiredPlan.featureList.filter(f => f.included && !currentPlan.featureList.find(cf => cf.label === f.label && cf.included)).map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                <Check className="w-4 h-4 text-[#25D366] flex-shrink-0" />
                <span>{f.label}</span>
              </div>
            ))}
          </div>

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
              Maybe Later
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
