import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, X, Shield, Sparkles, ArrowLeft, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { openWhatsApp } from '../lib/whatsapp';
import { cn } from '../lib/utils';

export default function Upgrade() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const { usage } = usePlanLimits();

  const customMessage = location.state?.message || "Choose the best plan to grow your tailoring business.";
  const currentPlan = userData?.plan || 'basic';

  const PLANS = [
    {
      id: 'basic',
      name: 'Basic',
      price: 'Rs. 500',
      period: '/month',
      description: 'Ideal for small home tailors',
      limits: { customers: 50, ordersPerMonth: 60, workers: 3 },
      color: 'border-slate-200 bg-white dark:bg-slate-900',
      features: [
        { name: '50 Customers', included: true },
        { name: '60 Orders/month', included: true },
        { name: '3 Workers', included: true },
        { name: 'Basic Invoice', included: true },
        { name: 'Standard Support', included: true },
        { name: 'Invoice Download', included: false },
        { name: 'WhatsApp Integration', included: false },
        { name: 'Image Upload', included: false },
        { name: 'Payroll System', included: false },
        { name: 'Analytics', included: false }
      ]
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 'Rs. 1000',
      period: '/month',
      description: 'Perfect for growing tailor shops',
      limits: { customers: 200, ordersPerMonth: 200, workers: 7 },
      color: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white dark:bg-slate-900 shadow-md',
      tag: 'Most Popular',
      features: [
        { name: '200 Customers', included: true },
        { name: '200 Orders/month', included: true },
        { name: '7 Workers', included: true },
        { name: 'Professional Invoice + Download', included: true },
        { name: 'WhatsApp Integration', included: true },
        { name: 'Priority Support', included: true },
        { name: 'Image Upload', included: false },
        { name: 'Payroll System', included: false },
        { name: 'Analytics', included: false }
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 'Rs. 2000',
      period: '/month',
      description: 'Full bespoke tailoring software suite',
      limits: { customers: 0, ordersPerMonth: 0, workers: 0 },
      color: 'border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10 shadow-lg',
      tag: 'Best Value',
      features: [
        { name: 'Unlimited Everything', included: true },
        { name: 'Image Upload', included: true },
        { name: 'Payroll System', included: true },
        { name: 'Advanced Analytics', included: true },
        { name: 'Custom Branding', included: true },
        { name: 'WhatsApp Priority Support', included: true }
      ]
    }
  ];

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
          className="h-10 rounded-xl font-medium flex items-center gap-2 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>
      </div>

      {/* Header Info Banner */}
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-wider uppercase mb-1.5">
          <Sparkles className="w-5 h-5 fill-primary/20" />
          Loop Tailor Subscription
        </div>
        <h1 className="text-3xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Upgrade Your Tailoring Business</h1>
        
        {location.state?.message ? (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-250 text-xs font-bold flex items-center gap-2.5 animate-pulse">
            <span>⚠️</span>
            <span>{customMessage}</span>
          </div>
        ) : (
          <p className="text-muted-foreground mt-2 text-sm font-medium">
            {customMessage}
          </p>
        )}
      </div>

      {/* Comparison Grid with horizontal scrolling on mobile */}
      <div className="flex overflow-x-auto gap-6 pb-6 pt-2 snap-x snap-mandatory scrollbar-thin md:grid md:grid-cols-3 md:items-stretch">
        {PLANS.map((plan) => {
          const isActive = currentPlan.toLowerCase() === plan.id.toLowerCase();
          
          // Custom block bars
          const getBlockBar = (current: number, max: number, totalSpots: number) => {
            if (max === 0) return '▓'.repeat(totalSpots); // Unlimited
            const filled = Math.min(totalSpots, Math.max(0, Math.round((current / max) * totalSpots)));
            const empty = Math.max(0, totalSpots - filled);
            return '▓'.repeat(filled) + '░'.repeat(empty);
          };
          const formatMax = (max: number) => max === 0 ? '∞' : max.toString();

          return (
            <Card key={plan.id} className={cn("snap-align-start shrink-0 w-[280px] md:w-full md:shrink flex flex-col justify-between border-2 rounded-3xl overflow-hidden transition-all duration-300", plan.color)}>
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#0D3D33] dark:text-[#2ECC71]">
                    {plan.name} Plan
                  </span>
                  {plan.tag && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
                      {plan.tag}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground font-semibold">{plan.period}</span>
                </div>
                <CardDescription className="text-xs font-semibold mt-1 text-slate-500 leading-snug">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 pt-0 flex-1 space-y-4">
                <div className="border-t my-1" />

                {/* Usage Bars inside card */}
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 font-mono text-[10px]">
                  <div className="flex justify-between items-center text-slate-705 dark:text-slate-350">
                    <span>Customers:</span>
                    <span className="font-bold flex items-center gap-1">
                      <span className="text-primary tracking-tighter">{getBlockBar(usage.customers, plan.limits.customers, 6)}</span>
                      <span>{usage.customers}/{formatMax(plan.limits.customers)}</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-705 dark:text-slate-350">
                    <span>Orders:</span>
                    <span className="font-bold flex items-center gap-1">
                      <span className="text-primary tracking-tighter">{getBlockBar(usage.ordersThisMonth, plan.limits.ordersPerMonth, 6)}</span>
                      <span>{usage.ordersThisMonth}/{formatMax(plan.limits.ordersPerMonth)}</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-705 dark:text-slate-350">
                    <span>Workers:</span>
                    <span className="font-bold flex items-center gap-1">
                      <span className="text-primary tracking-tighter">{getBlockBar(usage.workers, plan.limits.workers, 4)}</span>
                      <span>{usage.workers}/{formatMax(plan.limits.workers)}</span>
                    </span>
                  </div>
                </div>

                <div className="border-t my-1" />
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Plan Checklist:</p>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f.name} className={cn("text-xs font-semibold flex items-center gap-2", !f.included && "opacity-40")}>
                      {f.included ? (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                      <span className={f.included ? "text-slate-700 dark:text-slate-300" : "text-slate-400 line-through"}>{f.name}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="p-6 pt-0">
                <Button
                  className={cn("w-full h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2",
                    isActive 
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/10 text-emerald-600 border border-emerald-500 dark:text-emerald-400 cursor-default'
                      : 'bg-primary text-primary-foreground hover:opacity-90'
                  )}
                  disabled={isActive}
                  onClick={() => handleUpgrade(plan.name)}
                >
                  {isActive ? 'Current Plan (Active)' : `Upgrade to ${plan.name} Plan`}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Security notice and Sales CTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="p-4 bg-muted/40 border border-border rounded-2xl flex items-center gap-3.5">
          <Shield className="w-5 h-5 text-emerald-500 shrink-0" />
          <p className="text-xs font-semibold text-muted-foreground leading-snug">
            All upgrade requests are managed securely through official helpdesk validation. Active shop limits are adjusted immediately upon receipt.
          </p>
        </div>
        <div className="p-4 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Need a dedicated custom setup?</p>
              <p className="text-[10px] text-slate-500">Fast assistance is available on WhatsApp.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="text-xs font-bold" onClick={() => openWhatsApp('03321379924', 'Hi! I am looking for a custom plan setup.')}>
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}
