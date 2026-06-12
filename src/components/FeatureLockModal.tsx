import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X, Check, MessageCircle, AlertTriangle } from 'lucide-react';
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

          <div className="bg-amber-100/50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 w-12 h-12 rounded-2xl flex items-center justify-center mb-5">
            <Lock className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Feature Locked
          </h3>
          <p className="text-sm text-slate-500 font-medium mb-6">
            <strong className="text-slate-900 dark:text-slate-200">{FEATURE_LABELS[feature]}</strong> is available on{" "}
            <strong className="text-slate-900 dark:text-slate-200">{requiredPlan.name}</strong> plan and above.
          </p>

          <div className="bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="text-slate-500">Your Plan:</span>
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">{currentPlan.name} (Rs.{currentPlan.price})</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Required:</span>
              <span className="font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">{requiredPlan.name} (Rs.{requiredPlan.price})</span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Upgrade to unlock:</p>
            {requiredPlan.featureList.filter(f => f.included && !currentPlan.featureList.find(cf => cf.label === f.label && cf.included)).map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>{f.label}</span>
              </div>
            ))}
          </div>

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
              Maybe Later
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
