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
        <div className="flex items-center justify-center md:justify-start gap-2 text-primary font-black text-[10px] sm:text-xs tracking-widest uppercase mb-3">
          <Sparkles className="w-5 h-5 text-primary opacity-80" />
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

      {/* Comparison Grid with horizontal scrolling on mobile */}
      <div className="flex flex-nowrap overflow-x-auto gap-4 md:gap-6 pb-8 pt-4 snap-x snap-mandatory hide-scrollbar md:grid md:grid-cols-3 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
        {Object.values(PLANS).map((plan) => {
          const isActive = currentPlan.toLowerCase() === plan.id.toLowerCase();
          
          // Custom rendering for usage stats
          const renderUsageLine = (label: string, current: number, max: number) => {
            if (max === 0) {
              return (
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-350 py-1 md:py-0.5 border-b border-white/50 dark:border-white/5 last:border-0 md:border-0 relative">
                  <span className="font-medium text-[12px] md:text-[11px]">{label}:</span>
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-black">Unlimited</span>
                    <span className="text-[12px] md:text-[11px]">{current} / ∞</span>
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
                <span className="font-medium text-[12px] md:text-[11px]">{label}:</span>
                <span className="font-bold flex items-center gap-1.5">
                  <span className="text-primary tracking-tighter opacity-80 text-[10px] sm:text-[11px]">{bar}</span>
                  <span className="text-[12px] md:text-[11px]">{current}/{max}</span>
                </span>
              </div>
            );
          };

          return (
            <div 
              key={plan.id}
              className={cn(
                "snap-center shrink-0 w-[85vw] sm:w-[320px] md:w-full md:shrink relative p-6 md:p-8 rounded-[2rem] border-2 flex flex-col justify-between transition-all duration-300",
                isActive 
                  ? "border-primary bg-primary/5 ring-4 ring-primary/10 shadow-xl shadow-primary/5 scale-[1.02] md:scale-105 z-10" 
                  : "border-slate-100 dark:border-slate-800 hover:border-slate-200 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
              )}
            >
              {isActive && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                  Currently Active
                </div>
              )}
              
              <div>
                <div className="mb-4 text-center md:text-left flex flex-col items-center md:items-start">
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{plan.name}</h3>
                  <p className="text-[13px] text-slate-500 font-semibold leading-tight mt-1 max-w-[200px] md:max-w-none">{plan.description}</p>
                </div>
                
                <div className="mb-8 text-center md:text-left">
                  <div className="flex items-baseline justify-center md:justify-start gap-1">
                    <span className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Rs. {plan.price}</span>
                    <span className="text-slate-400 text-sm font-semibold">/mo</span>
                  </div>
                </div>

                {/* Usage Bars */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 md:p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1 mb-6 font-mono shadow-inner">
                  {renderUsageLine("Customers", usage.customers, plan.limits.customers)}
                  {renderUsageLine("Orders", usage.ordersThisMonth, plan.limits.ordersPerMonth)}
                  {renderUsageLine("Workers", usage.workers, plan.limits.workers)}
                </div>
                
                <div className="border-t border-slate-100 dark:border-slate-800 my-6" />

                {/* Feature Lists */}
                <div className="space-y-3.5 mb-8 px-1">
                  {plan.featureList.map((f) => (
                    <div key={f.label} className={cn("flex items-start gap-3.5 text-[14px] md:text-[13px] font-medium", !f.included && "opacity-40")}>
                      {f.included ? (
                        <Check className="w-5 h-5 md:w-[18px] md:h-[18px] text-emerald-500 shrink-0" />
                      ) : (
                        <X className="w-5 h-5 md:w-[18px] md:h-[18px] text-red-400 shrink-0" />
                      )}
                      <span className={f.included ? "text-slate-700 dark:text-slate-200" : "text-slate-400 line-through"}>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-auto">
                <Button 
                  onClick={() => handleUpgrade(plan.name)}
                  variant={isActive ? "outline" : "default"}
                  className={cn("w-full h-14 md:h-12 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-[0.98]", 
                    isActive && "opacity-60 cursor-default bg-transparent border-slate-200 text-slate-500 hover:bg-transparent"
                  )}
                  disabled={isActive}
                >
                  {isActive ? "Current Plan" : `Upgrade to ${plan.name} Plan`}
                </Button>
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
