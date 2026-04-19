import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowRight, Sparkles, Scissors, TrendingUp, Users, CheckCircle, Camera, LayoutDashboard, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

const AnimatedCounter = ({ end, duration = 2000, suffix = "", prefix = "" }: { end: number, duration?: number, suffix?: string, prefix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function (easeOutExpo)
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(Math.floor(end * easeProgress));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <>{prefix}{count.toLocaleString()}{suffix}</>;
};

export default function Hero() {
  const { isRTL, t } = useLanguage();
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["Precision", "Efficiency", "Elegance", "Scale", "Ease"],
    []
  );

  useEffect(() => {
    const timeoutId = setInterval(() => {
      setTitleNumber((prev) => (prev + 1) % titles.length);
    }, 2500);
    return () => clearInterval(timeoutId);
  }, [titles.length]);

  return (
    <section className="relative pt-24 pb-16 lg:pt-36 lg:pb-32 overflow-hidden bg-gradient-to-b from-[#f4f8f7] to-[#ffffff] text-center">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] sm:w-[1000px] h-[500px] sm:h-[800px] bg-brand-primary/10 rounded-full blur-[100px] opacity-70"></div>
        <div className="absolute top-[20%] -left-[10%] w-[400px] h-[400px] bg-emerald-400/10 rounded-full blur-[100px] opacity-40"></div>
        <div className="absolute top-[30%] -right-[10%] w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-[100px] opacity-40"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[9999px] bg-white border border-brand-primary/10 shadow-neu-sm mb-8"
        >
          <Sparkles className="h-4 w-4 text-brand-primary" />
          <span className="text-xs sm:text-sm font-bold tracking-wide text-brand-primary">
            The Modern OS for Tailors
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-4 mb-8 w-full z-20"
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-tight text-slate-900 leading-[1.1] drop-shadow-sm">
            Run your tailoring business
          </h1>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-tight leading-[1.1] flex flex-wrap justify-center items-center gap-x-3">
            <span className="text-slate-900">with</span>
            <span className="relative flex justify-center overflow-hidden text-brand-primary h-[1.2em] w-[220px] sm:w-[320px] md:w-[400px] lg:w-[480px]">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={titleNumber}
                  className="absolute inset-0 flex items-center justify-center font-display"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {titles[titleNumber]}.
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
        </motion.div>

        {/* Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg sm:text-xl text-slate-600 mb-12 max-w-2xl mx-auto font-medium leading-relaxed z-20 px-4 sm:px-0"
        >
          Manage orders, track measurements, and delight your clients with a seamless, professional workflow designed specifically for modern tailors.
        </motion.p>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto z-20 relative px-6 sm:px-0"
        >
          <Link to="/signup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-base font-bold rounded-[9999px] bg-brand-primary hover:bg-brand-primary/90 text-white shadow-xl shadow-brand-primary/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-primary/40 transition-all duration-300 group">
              Start your free trial
              <ArrowRight className={cn("h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform", isRTL && "mr-2 rotate-180 group-hover:-translate-x-1")} />
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto h-14 px-10 text-base font-bold rounded-[9999px] border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
            >
              Sign in
            </Button>
          </Link>
        </motion.div>

        {/* Animated Counters */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 1, delay: 0.6 }}
           className="flex items-center justify-center gap-8 sm:gap-16 mt-16 z-20"
        >
           <div className="flex flex-col items-center">
              <div className="text-3xl sm:text-4xl font-display font-black text-slate-900 mb-1 tracking-tight">
                 <AnimatedCounter end={500} suffix="+" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest">Tailors</div>
           </div>
           
           <div className="w-px h-12 bg-slate-200"></div>

           <div className="flex flex-col items-center">
              <div className="text-3xl sm:text-4xl font-display font-black text-slate-900 mb-1 tracking-tight">
                 <AnimatedCounter end={10} suffix="k+" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest">Orders</div>
           </div>

           <div className="w-px h-12 bg-slate-200 hidden sm:block"></div>

           <div className="flex-col items-center hidden sm:flex">
              <div className="text-3xl sm:text-4xl font-display font-black text-slate-900 mb-1 tracking-tight">
                 <AnimatedCounter end={99} suffix="%" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest">Satisfaction</div>
           </div>
        </motion.div>

        {/* Floating UI Mockups Area */}
        <div className="w-full max-w-6xl mt-24 relative h-[350px] sm:h-[500px] perspective-1000 z-10">
           
           {/* Center Main Dashboard Mockup */}
           <motion.div
             initial={{ opacity: 0, y: 100, rotateX: 10 }}
             animate={{ opacity: 1, y: 0, rotateX: 0 }}
             transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
             className="absolute left-[5%] right-[5%] bottom-0 sm:left-[15%] sm:right-[15%] rounded-t-[2rem] bg-white border border-slate-200/60 border-b-0 shadow-[0_-20px_60px_-15px_rgba(0,70,67,0.15)] overflow-hidden h-full z-10 flex flex-col"
           >
             {/* Dashboard Header Bar */}
             <div className="h-14 bg-slate-50/80 backdrop-blur-md border-b border-slate-100 flex items-center px-6 justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  </div>
                  <div className="ml-4 flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-slate-200 shadow-sm text-xs font-bold text-slate-500">
                    <LayoutDashboard className="w-3.5 h-3.5 text-brand-primary" /> Dashboard
                  </div>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="hidden sm:block w-32 h-6 bg-slate-200/60 rounded-full animate-pulse"></div>
                  <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                    <span className="text-xs font-black text-brand-primary">T</span>
                  </div>
                </div>
             </div>

             {/* Dashboard Content */}
             <div className="p-6 sm:p-8 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 bg-[#fcfdfd] relative overflow-hidden">
                
                {/* Stats Row */}
                <div className="col-span-1 sm:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 h-[100px] sm:h-32 flex-shrink-0">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
                     <div className="flex justify-between items-center">
                        <div className="w-16 sm:w-20 h-2.5 bg-slate-100 rounded-full"></div>
                        <div className="p-2 bg-brand-primary/10 rounded-xl"><Scissors className="w-4 h-4 text-brand-primary" /></div>
                     </div>
                     <div>
                       <div className="w-12 sm:w-16 h-6 sm:h-8 bg-slate-800 rounded-lg mb-2"></div>
                       <div className="w-20 sm:w-24 h-1.5 sm:h-2 bg-emerald-100 rounded-full"></div>
                     </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
                     <div className="flex justify-between items-center">
                        <div className="w-20 sm:w-24 h-2.5 bg-slate-100 rounded-full"></div>
                        <div className="p-2 bg-emerald-50 rounded-xl"><CheckCircle className="w-4 h-4 text-emerald-500" /></div>
                     </div>
                     <div>
                       <div className="w-8 sm:w-10 h-6 sm:h-8 bg-slate-800 rounded-lg mb-2"></div>
                       <div className="w-24 sm:w-32 h-1.5 sm:h-2 bg-slate-100 rounded-full"></div>
                     </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hidden sm:flex flex-col justify-between">
                     <div className="flex justify-between items-center">
                        <div className="w-16 h-2.5 bg-slate-100 rounded-full"></div>
                        <div className="p-2 bg-blue-50 rounded-xl"><Zap className="w-4 h-4 text-blue-500" /></div>
                     </div>
                     <div>
                       <div className="w-20 h-8 bg-slate-800 rounded-lg mb-2"></div>
                       <div className="w-20 h-2 bg-slate-100 rounded-full"></div>
                     </div>
                  </div>
                </div>

                {/* Main Table Area */}
                <div className="col-span-1 sm:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
                  <div className="w-32 h-3.5 bg-slate-200 rounded-full mb-6"></div>
                  <div className="space-y-4 flex-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex justify-between items-center pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-slate-100 shadow-inner"></div>
                           <div>
                             <div className="w-24 h-2.5 bg-slate-700 rounded-full mb-2"></div>
                             <div className="w-16 h-1.5 bg-slate-200 rounded-full"></div>
                           </div>
                         </div>
                         <div className="w-16 h-6 bg-brand-primary/10 rounded-full flex items-center justify-center">
                            <div className="w-8 h-1.5 bg-brand-primary/60 rounded-full"></div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
             </div>

             {/* White fade block at bottom wrapper to obscure the bottom */}
             <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#ffffff] to-transparent z-20 pointer-events-none rounded-t-[2rem]"></div>
           </motion.div>

           {/* Floating Mobile Snapshot (Left) */}
           <motion.div
             initial={{ opacity: 0, x: -50, y: 20 }}
             animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
             transition={{ 
               opacity: { duration: 0.8, delay: 0.7 },
               x: { duration: 0.8, delay: 0.7 },
               y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
             }}
             className="absolute left-[5%] bottom-[15%] sm:left-[4%] sm:bottom-[20%] z-20 w-[180px] sm:w-64 bg-white rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,70,67,0.2)] border-[6px] border-slate-800 overflow-hidden hidden md:block"
           >
              <div className="h-5 bg-slate-800 w-full flex justify-center py-1">
                <div className="w-1/3 h-1.5 bg-slate-900 rounded-full"></div>
              </div>
              <div className="p-4 bg-brand-primary text-white pb-8">
                <div className="w-16 h-1.5 bg-white/30 rounded-full mb-4"></div>
                <div className="text-lg sm:text-xl font-bold mb-2">+ New Order</div>
                <div className="w-full h-8 bg-white/20 rounded-lg"></div>
              </div>
              <div className="p-4 -mt-4 bg-white rounded-t-xl relative z-10 space-y-3">
                 <div className="flex gap-2 mb-4">
                   <div className="flex-1 h-16 sm:h-20 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center items-center gap-2">
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
                      <div className="w-8 h-1 bg-slate-200 rounded-full"></div>
                   </div>
                   <div className="flex-1 h-16 sm:h-20 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center items-center gap-2">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                      <div className="w-8 h-1 bg-slate-200 rounded-full"></div>
                   </div>
                 </div>
                 <div className="w-full h-8 sm:h-10 bg-slate-100 rounded-xl"></div>
                 <div className="w-full h-8 sm:h-10 bg-slate-100 rounded-xl"></div>
              </div>
           </motion.div>

           {/* Floating Invoice/Metrics Card (Right) */}
           <motion.div
             initial={{ opacity: 0, x: 50, y: 40 }}
             animate={{ opacity: 1, x: 0, y: [0, 10, 0] }}
             transition={{ 
               opacity: { duration: 0.8, delay: 0.9 },
               x: { duration: 0.8, delay: 0.9 },
               y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }
             }}
             className="absolute right-[5%] top-[10%] sm:right-[3%] sm:top-[15%] z-20 w-[200px] sm:w-[280px] bg-white rounded-3xl shadow-[0_20px_40px_-5px_rgba(0,70,67,0.15)] border border-slate-100/60 hidden md:block p-5"
           >
              <div className="flex justify-between items-start mb-6">
                 <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                   <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                 </div>
                 <div className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] sm:text-xs font-bold rounded-lg uppercase tracking-wider">Paid</div>
              </div>
              <div className="w-20 sm:w-24 h-2.5 bg-slate-200 rounded-full mb-2"></div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mb-6">$450.00</div>
              
              <div className="space-y-3 border-t border-slate-50 pt-4">
                 <div className="flex justify-between items-center">
                    <div className="w-14 sm:w-16 h-1.5 sm:h-2 bg-slate-100 rounded-full"></div>
                    <div className="w-6 sm:w-8 h-1.5 sm:h-2 bg-slate-200 rounded-full"></div>
                 </div>
                 <div className="flex justify-between items-center">
                    <div className="w-20 sm:w-24 h-1.5 sm:h-2 bg-slate-100 rounded-full"></div>
                    <div className="w-8 sm:w-10 h-1.5 sm:h-2 bg-slate-200 rounded-full"></div>
                 </div>
              </div>
              <div className="mt-6 w-full h-8 sm:h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                 <div className="w-16 h-1.5 sm:h-2 bg-brand-primary/40 rounded-full"></div>
              </div>
           </motion.div>

        </div>
      </div>
    </section>
  );
}
