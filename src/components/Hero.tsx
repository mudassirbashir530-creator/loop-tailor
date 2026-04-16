import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowRight, CheckCircle2, PlayCircle, Sparkles, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

export default function Hero() {
  const { isRTL } = useLanguage();

  return (
    <section className="relative pt-28 sm:pt-32 lg:pt-36 pb-20 overflow-hidden bg-[#FDFCF9]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[440px] w-[820px] rounded-full bg-brand-primary/15 blur-[120px]" />
        <div className="absolute top-24 right-[8%] h-72 w-72 rounded-full bg-emerald-400/15 blur-[95px]" />
        <div className="absolute -bottom-10 left-[5%] h-80 w-80 rounded-full bg-indigo-400/10 blur-[110px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 border border-slate-200 shadow-sm mb-6">
              <Sparkles className="h-4 w-4 text-brand-primary" />
              <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600">Built for modern tailoring teams</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.03] text-slate-900">
              Premium tailoring workflow,
              <span className="block text-brand-primary mt-2">from first fitting to final delivery.</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Capture measurements, track jobs in real-time, generate polished invoices, and deliver a client experience that feels world-class.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-2xl shadow-xl shadow-brand-primary/25">
                  Start Free Trial
                  <ArrowRight className={cn("h-5 w-5", isRTL ? "mr-2 rotate-180" : "ml-2")} />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-2xl border-slate-200">
                  <PlayCircle className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />
                  Watch Demo
                </Button>
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 justify-center lg:justify-start text-sm text-slate-600">
              {['Order tracking', 'Auto invoices', 'Mobile ready'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-primary" />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-brand-primary/15 via-transparent to-emerald-300/20 blur-2xl" />
            <div className="relative rounded-[2rem] bg-white/90 border border-slate-200 shadow-2xl p-5 sm:p-7">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  { label: 'Active Orders', value: '124', accent: 'text-brand-primary' },
                  { label: 'Due This Week', value: '28', accent: 'text-indigo-600' },
                  { label: 'Invoices Sent', value: '312', accent: 'text-emerald-600' },
                  { label: 'On-time Rate', value: '98%', accent: 'text-amber-600' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{stat.label}</div>
                    <div className={cn("text-2xl font-black mt-2", stat.accent)}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl bg-gradient-to-r from-brand-primary to-emerald-700 p-4 text-white">
                <div className="flex items-center justify-between">
                  <p className="font-bold">Today’s production flow</p>
                  <Zap className="h-5 w-5" />
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/25 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '78%' }}
                    transition={{ duration: 1.1, delay: 0.45 }}
                    className="h-full rounded-full bg-white"
                  />
                </div>
                <p className="text-xs mt-2 text-white/90">78% of scheduled orders are already in progress.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
