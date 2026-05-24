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

  const currentPlanObj = PLANS[currentPlan.toLowerCase() as keyof typeof PLANS] || PLANS.basic;
  const currentPlanPrice = currentPlanObj.price;

  const handlePlanAction = (targetPlanName: string, actionType: "upgrade" | "downgrade") => {
    const userEmail = user?.email || 'N/A';
    const currentPlanName = PLANS[currentPlan.toLowerCase() as keyof typeof PLANS]?.name || 'Basic';
    const msg = `Hi, I want to ${actionType} my Loop Tailor plan from ${currentPlanName} to ${targetPlanName}.\nMy account: ${userEmail}`;
    openWhatsApp('03321379924', msg);
  };

  const getUsageConfig = (label: string, current: number, max: number) => {
    if (max === 0) {
      return {
        percentage: 100,
        barColorClass: "bg-emerald-500",
        isWarning: false,
        text: `${current} / Unlimited`
      };
    }
    const percentage = Math.min(100, (current / max) * 100);
    let barColorClass = "bg-emerald-500";
    let isWarning = false;

    if (percentage === 100) {
      barColorClass = "bg-red-500";
      isWarning = true;
    } else if (percentage >= 80) {
      barColorClass = "bg-amber-500";
      isWarning = true;
    }

    return {
      percentage,
      barColorClass,
      isWarning,
      text: `${current} / ${max}`
    };
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20 w-full overflow-x-hidden">
      
      {/* Back button */}
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)} 
          className="h-10 rounded-xl font-medium flex items-center gap-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>
      </div>

      {/* Header Info Banner */}
      <div className="max-w-3xl text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-2 text-[#1a3a2a] dark:text-[#2ECC71] font-black text-[10px] sm:text-xs tracking-widest uppercase mb-3">
          <Sparkles className="w-5 h-5 opacity-80" />
          <span>Loop Tailor Subscription</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
          Upgrade Your Tailoring Business
        </h1>
        
        {location.state?.message ? (
          <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-2.5 animate-pulse max-w-max mx-auto md:mx-0">
            <span>⚠️</span>
            <span>{customMessage}</span>
          </div>
        ) : (
          <p className="text-muted-foreground mt-4 text-sm md:text-base font-medium max-w-2xl leading-relaxed">
            {customMessage}
          </p>
        )}
      </div>
      
      {/* Current Plan Banner */}
      <div className="w-full bg-[#1a3a2a] text-white p-6 rounded-2xl shadow-md border border-[#2ECC71]/30 relative overflow-hidden mt-6 mb-8 select-none">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="w-16 h-16 md:w-24 md:h-24" />
        </div>
        <p className="text-[#2ECC71] text-xs font-black tracking-widest uppercase mb-2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" /> YOUR CURRENT PLAN
        </p>
        <div className="flex justify-between items-end relative z-10">
          <div>
            <h3 className="text-2xl md:text-3xl font-black">
              {currentPlanObj.name} <span className="font-normal opacity-80 text-lg md:text-xl">— Rs.{currentPlanPrice}/month</span>
            </h3>
            <p className="text-xs md:text-sm text-slate-300 mt-1.5 opacity-80">Active now</p>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="flex flex-col md:flex-row md:justify-center md:items-stretch gap-4 md:gap-5 w-full px-0">
        {Object.values(PLANS).map((plan) => {
          const isActive = currentPlan.toLowerCase() === plan.id.toLowerCase();
          const isHigher = plan.price > currentPlanPrice;
          const isLower = plan.price < currentPlanPrice;
          
          return (
            <div 
              key={plan.id}
              className={cn(
                "w-full flex-1 flex flex-col justify-between transition-all duration-300 bg-white dark:bg-slate-900 shadow-xs",
                "p-4 md:p-6", // exact 16px padding on mobile (p-4)
                "rounded-xl md:rounded-2xl", // exact 12px border radius on mobile (rounded-xl)
                isActive 
                  ? "border-2 border-[#1a3a2a] ring-4 ring-[#1a3a2a]/5 shadow-sm scale-[1.01] md:scale-105 z-10" 
                  : "border border-slate-200 dark:border-slate-800",
                "md:min-w-[280px] md:max-w-[380px] break-words"
              )}
            >
              <div>
                {/* Plan Header */}
                <div className="mb-4 flex justify-between items-start gap-2">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {plan.name}
                    </h3>
                    <p className="text-[12px] text-slate-500 font-medium leading-tight mt-1">
                      {plan.description}
                    </p>
                  </div>
                  {isActive && (
                    <span className="text-[10px] bg-[#1a3a2a]/10 dark:bg-emerald-500/10 text-[#1a3a2a] dark:text-[#2ECC71] uppercase tracking-wider font-extrabold px-2 py-1 rounded">
                      Active
                    </span>
                  )}
                  {plan.id === "premium" && !isActive && (
                    <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-500 uppercase tracking-wider font-extrabold px-2 py-1 rounded whitespace-nowrap">
                      ⭐ Best Value
                    </span>
                  )}
                </div>
                
                {/* Price Label */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span 
                      className="font-black text-slate-900 dark:text-white leading-none whitespace-nowrap" 
                      style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)" }}
                    >
                      Rs.{plan.price}
                    </span>
                    <span className="text-slate-400 text-xs font-semibold">/month</span>
                  </div>
                </div>

                {/* Usage Bars - ONLY SHOW ON ACTIVE PLAN */}
                {isActive && (
                  <div className="mb-6 animate-in fade-in slide-in-from-top-1 duration-300">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Current Usage
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-inner">
                      {/* Customers Bar */}
                      {(() => {
                        const { percentage, barColorClass, isWarning, text } = getUsageConfig("CUSTOMERS", usage.customers, plan.limits.customers);
                        return (
                          <div>
                            <div className="flex justify-between items-center mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                              <span className="flex items-center gap-1">CUSTOMERS {isWarning && "⚠️"}</span>
                              <span className="font-mono text-[11px] font-semibold">{text}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full transition-all duration-500", barColorClass)} style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Orders Bar */}
                      {(() => {
                        const { percentage, barColorClass, isWarning, text } = getUsageConfig("ORDERS", usage.ordersThisMonth, plan.limits.ordersPerMonth);
                        return (
                          <div>
                            <div className="flex justify-between items-center mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                              <span className="flex items-center gap-1">ORDERS {isWarning && "⚠️"}</span>
                              <span className="font-mono text-[11px] font-semibold">{text}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full transition-all duration-500", barColorClass)} style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Workers Bar */}
                      {(() => {
                        const { percentage, barColorClass, isWarning, text } = getUsageConfig("WORKERS", usage.workers, plan.limits.workers);
                        return (
                          <div>
                            <div className="flex justify-between items-center mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                              <span className="flex items-center gap-1">WORKERS {isWarning && "⚠️"}</span>
                              <span className="font-mono text-[11px] font-semibold">{text}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full transition-all duration-500", barColorClass)} style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
                
                <div className="border-t border-slate-100 dark:border-slate-800 my-4" />

                {/* Feature Lists */}
                <div className="space-y-3 mb-6 px-1">
                  {plan.featureList.map((f) => (
                    <div key={f.label} className={cn("flex items-start gap-2.5 text-[13px] font-medium leading-tight", !f.included && "opacity-45")}>
                      {f.included ? (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      )}
                      <span className={f.included ? "text-slate-700 dark:text-slate-200" : "text-slate-500 line-through"}>
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Button Section */}
              <div className="mt-auto pt-2">
                {isActive ? (
                  <Button 
                    variant="secondary"
                    className="w-full h-12 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-transparent select-none uppercase"
                    disabled
                  >
                    ✓ Current Plan
                  </Button>
                ) : isLower ? (
                  <Button 
                    onClick={() => handlePlanAction(plan.name, "downgrade")}
                    variant="outline"
                    className="w-full h-12 rounded-xl font-bold text-sm border-slate-350 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Downgrade
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handlePlanAction(plan.name, "upgrade")}
                    className="w-full h-12 rounded-xl font-bold text-sm bg-[#1a3a2a] hover:bg-[#1a3a2a]/90 text-white shadow-xs active:scale-[0.98] transition-all"
                  >
                    Upgrade to {plan.name} →
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security notice and Custom Help Sales CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-stretch px-0">
        <div className="p-5 bg-muted/25 border border-border rounded-xl flex items-start gap-3.5">
          <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-muted-foreground leading-relaxed">
            All upgrade requests are managed securely through official helpdesk validation. Active shop limits are adjusted immediately upon receipt.
          </p>
        </div>

        <div className="p-5 bg-[#1a3a2a]/5 dark:bg-[#1a3a2a]/10 border border-[#1a3a2a]/15 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-[#1a3a2a] dark:text-[#2ECC71]" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Need custom help?</p>
              <p className="text-xs text-slate-500 mt-0.5">Contact us on WhatsApp to discuss custom setup or requirements.</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto h-11 text-xs font-bold rounded-xl border-slate-300 text-[#1a3a2a] dark:text-white dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 flex items-center justify-center gap-2 px-5 shrink-0" 
            onClick={() => openWhatsApp('03321379924', 'Hi! I am looking for a custom plan setup.')}
          >
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}
