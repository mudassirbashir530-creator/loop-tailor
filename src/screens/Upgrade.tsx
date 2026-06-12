import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, Sparkles, ArrowLeft, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { openWhatsApp } from '../lib/whatsapp';
import { PLANS } from '../constants/plans';
import Subscription from '../components/Subscription';

export default function Upgrade() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useAuth();

  const customMessage = location.state?.message || "Choose the best plan to grow your tailoring business.";
  const currentPlan = (userData?.plan || userData?.subscriptionPlan || 'free').toLowerCase();

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

      {/* Comparison Grid via unified Subscription */}
      <Subscription />

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
