import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, X, Shield, Sparkles, ArrowLeft, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { Button } from '../components/ui/button';
import { openWhatsApp } from '../lib/whatsapp';
import { cn } from '../lib/utils';
import { PLANS } from '../constants/plans';

export default function Upgrade() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const { usage } = usePlanLimits();

  const customMessage = location.state?.message || "Choose the best plan to grow your tailoring business.";
  const currentPlan = userData?.plan || userData?.subscriptionPlan || 'basic';

  const handleUpgrade = (selectedPlanName: string) => {
    const userEmail = user?.email || 'N/A';
    const msg = `Hi, I want to upgrade my Loop Tailor\nplan to ${selectedPlanName}.\nMy account: ${userEmail}`;
    openWhatsApp('03321379924', msg);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Back button */}
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)} 
          className="h-10 rounded-xl font-medium flex items-center gap-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>
      </div>

      {/* Header Info Banner */}
      <div className="max-w-3xl text-center md:text-left mx-auto md:mx-0">
        <div className="flex items-center justify-center md:justify-start gap-2 text-[#1a3a2a] dark:text-[#2ECC71] font-black text-[10px] sm:text-xs tracking-widest uppercase mb-3">
          <Sparkles className="w-5 h-5 opacity-80" />
          <span>Loop Tailor Subscription</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">Upgrade Your Tailoring Business</h1>
        
        {location.state?.message ? (
          <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-250 text-xs font-bold flex items-center gap-2.5 animate-pulse max-w-max mx-auto md:mx-0">
            <span>⚠️</span>
            <span>{customMessage}</span>
          </div>
        ) : (
          <p className="text-muted-foreground mt-4 text-sm md:text-base font-medium max-w-2xl">
            {customMessage}
          </p>
        )}
      </div>
      
      {/* Current Plan Banner Container */}
      <div className="max-w-md mx-auto md:mx-0 w-full bg-[#1a3a2a] text-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-md border border-[#2ECC71]/30 relative overflow-hidden mt-8">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="w-24 h-24" />
        </div>
        <p className="text-[#2ECC71] text-[10px] md:text-xs font-black tracking-widest uppercase mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" /> YOUR CURRENT PLAN
        </p>
        <div className="flex justify-between items-end relative z-10">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold">{PLANS[currentPlan.toLowerCase() as keyof typeof PLANS]?.name || 'Unknown'} <span className="font-normal opacity-80 text-lg md:text-xl">— Rs.{PLANS[currentPlan.toLowerCase() as keyof typeof PLANS]?.price || 0}/mo</span></h3>
            <p className="text-xs md:text-sm text-slate-300 mt-1.5 md:mt-2 opacity-80">Active now</p>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="flex flex-col md:grid md:grid-cols-3 gap-6 pt-4">
        {Object.values(PLANS).map((plan) => {
          const currentPlanObj = PLANS[currentPlan.toLowerCase() as keyof typeof PLANS];
          const currentPlanPrice = currentPlanObj ? currentPlanObj.price : 0;
          const isActive = currentPlan.toLowerCase() === plan.id.toLowerCase();
          const isLower = plan.price < currentPlanPrice;
          
          // Custom rendering for usage stats
          const renderUsageLine = (label: string, current: number, max: number) => {
            if (max === 0) {
              return (
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-350 py-1 md:py-0.5 border-b border-white/50 dark:border-white/5 last:border-0 md:border-0 relative">
                  <span className="font-medium text-[12px] md:text-xs">{label}:</span>
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-black">Unlimited</span>
                    <span className="text-[12px] md:text-xs">{current} / ∞</span>
                  </span>
                </div>
              );
            }
            
            const totalSpots = 5;
            const filled = Math.min(totalSpots, Math.max(0, Math.round((current / max) * totalSpots)));
            const empty = Math.max(0, totalSpots - filled);
            const bar = '▓'.repeat(filled) + '░'.repeat(empty);
            
            return (
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-350 py-1 md:py-0.5 border-b border-white/50 dark:border-white/5 last:border-0 md:border-0 relative">
                <span className="font-medium text-[12px] md:text-xs">{label}:</span>
                <span className="font-bold flex items-center gap-1.5">
                  <span className="text-[#1a3a2a] dark:text-[#2ECC71] tracking-tighter opacity-80 text-[10px] md:text-[11px]">{bar}</span>
                  <span className="text-[12px] md:text-xs">{current}/{max}</span>
                </span>
              </div>
            );
          };

          const handlePlanAction = () => {
            if (isActive) return;
            const msg = `Hi, I want to ${isLower ? 'downgrade' : 'upgrade'} my Loop Tailor plan to ${plan.name}.\nMy account: ${user?.email || 'N/A'}`;
            openWhatsApp('03321379924', msg);
          };

          return (
            <div 
              key={plan.id}
              className={cn(
                "w-full relative p-6 md:p-8 rounded-[2rem] border-2 flex flex-col justify-between transition-all duration-300 bg-white dark:bg-slate-900 shadow-sm",
                isActive 
                  ? "border-[#1a3a2a] ring-4 ring-[#1a3a2a]/5 shadow-xl scale-[1.02] md:scale-105 z-10" 
                  : "border-slate-200 dark:border-slate-800"
              )}
            >
              <div>
                <div className="mb-4">
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{plan.name}</h3>
                  <p className="text-[13px] text-slate-500 font-medium leading-tight mt-1">{plan.description}</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Rs.{plan.price}</span>
                    <span className="text-slate-400 text-sm font-medium">/mo</span>
                  </div>
                </div>

                {/* Usage Bars - ONLY SHOW ON ACTIVE PLAN */}
                {isActive && (
                  <div className="mb-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Usage</p>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 md:p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1 font-mono shadow-inner">
                      {renderUsageLine("Customers", usage.customers, plan.limits.customers)}
                      {renderUsageLine("Orders", usage.ordersThisMonth, plan.limits.ordersPerMonth)}
                      {renderUsageLine("Workers", usage.workers, plan.limits.workers)}
                    </div>
                  </div>
                )}
                
                <div className="border-t border-slate-100 dark:border-slate-800 my-6" />

                {/* Feature Lists */}
                <div className="space-y-3.5 mb-8 px-1">
                  {plan.featureList.map((f) => (
                    <div key={f.label} className={cn("flex items-start gap-3.5 text-[14px] md:text-[13px] font-medium", !f.included && "opacity-45")}>
                      {f.included ? (
                        <Check className="w-5 h-5 md:w-[18px] md:h-[18px] text-emerald-500 shrink-0" />
                      ) : (
                        <X className="w-5 h-5 md:w-[18px] md:h-[18px] text-red-500 shrink-0" />
                      )}
                      <span className={f.included ? "text-slate-700 dark:text-slate-200" : "text-slate-500 line-through"}>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-auto pt-4">
                {isActive ? (
                  <Button 
                    variant="secondary"
                    className="w-full h-14 md:h-12 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-default hover:bg-slate-100"
                    disabled
                  >
                    Current Plan <Check className="w-4 h-4 ml-2" />
                  </Button>
                ) : isLower ? (
                  <Button 
                    onClick={handlePlanAction}
                    variant="outline"
                    className="w-full h-14 md:h-12 rounded-xl font-bold text-sm border-slate-300 text-slate-600 hover:bg-slate-50"
                  >
                    Downgrade
                  </Button>
                ) : (
                  <Button 
                    onClick={handlePlanAction}
                    className="w-full h-14 md:h-12 rounded-xl font-bold text-sm bg-[#1a3a2a] hover:bg-[#1a3a2a]/90 text-white shadow-md active:scale-95 transition-transform"
                  >
                    Upgrade Plan
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security notice and Sales CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-center px-0">
        <div className="p-5 md:p-4 bg-muted/40 border border-border rounded-2xl flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 md:gap-3.5">
          <Shield className="w-6 h-6 md:w-5 md:h-5 text-emerald-500 shrink-0" />
          <p className="text-[13px] md:text-xs font-medium text-muted-foreground leading-relaxed md:leading-snug">
            All upgrade requests are managed securely through official helpdesk validation. Active shop limits are adjusted immediately upon receipt.
          </p>
        </div>
        <div className="p-5 md:p-4 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-3">
            <div className="w-12 h-12 md:w-auto md:h-auto rounded-full bg-white md:bg-transparent dark:bg-slate-800 md:dark:bg-transparent shadow-sm md:shadow-none flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 md:w-5 md:h-5 text-primary" />
            </div>
            <div>
              <p className="text-[14px] md:text-xs font-bold text-slate-900 dark:text-white">Need a dedicated custom setup?</p>
              <p className="text-[12px] md:text-[10px] text-slate-500 mt-1 md:mt-0">Fast assistance is available on WhatsApp.</p>
            </div>
          </div>
          <Button variant="outline" className="w-full md:w-auto h-12 md:h-9 text-[13px] md:text-xs font-bold rounded-xl md:rounded-md active:scale-[0.98] transition-transform" onClick={() => openWhatsApp('03321379924', 'Hi! I am looking for a custom plan setup.')}>
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}
