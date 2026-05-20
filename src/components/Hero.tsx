import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowRight, Sparkles, Scissors, TrendingUp, CheckCircle, Camera, LayoutDashboard, Zap } from 'lucide-react';
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
  const { isRTL } = useLanguage();
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
    <section className="relative pt-24 pb-16 lg:pt-36 lg:pb-32 overflow-hidden bg-[#004643]">
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-[#005c58] rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] bg-[#008f88] rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-[20%] left-[20%] w-[700px] h-[700px] bg-[#003634] rounded-full blur-[150px]" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
          
          {/* Left Column (Text & CTAs) */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left z-20">
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-xl mb-8"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span className="text-xs sm:text-sm font-bold tracking-wide text-white">
                The Modern OS for Tailors
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-2 mb-6 w-full"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black tracking-tight text-white leading-[1.1] drop-shadow-md">
                Run your shop
              </h1>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black tracking-tight leading-[1.1] flex flex-wrap justify-center lg:justify-start items-center gap-x-3 text-white">
                <span>with</span>
                <span className="relative flex justify-center lg:justify-start overflow-hidden text-emerald-400 h-[1.2em] w-[220px] sm:w-[300px] md:w-[350px]">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={titleNumber}
                      className="absolute inset-0 flex items-center justify-center lg:justify-start font-display bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent pb-2"
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
              className="text-lg sm:text-xl text-white/80 mb-10 max-w-xl font-medium leading-relaxed"
            >
              Manage orders, track measurements, and delight your clients with a seamless, professional workflow designed specifically for modern tailors.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={cn("flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto z-20 relative", isRTL ? "lg:justify-end" : "lg:justify-start")}
            >
              <Link to="/auth/signup" className="w-full sm:w-auto">
                <Button size="lg" className="group relative overflow-hidden w-full sm:w-auto h-14 px-8 text-base font-bold rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all duration-300 border border-emerald-400">
                  <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-150%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(150%)]">
                    <div className="relative h-full w-8 bg-white/20" />
                  </div>
                  <span className="relative flex items-center">
                    Start your free trial
                    <ArrowRight className={cn("h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform", isRTL && "mr-2 rotate-180 group-hover:-translate-x-1")} />
                  </span>
                </Button>
              </Link>
              <Link to="/auth/login" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full sm:w-auto h-14 px-8 text-base font-bold rounded-full border-white/20 text-white bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all duration-300"
                >
                  Sign in
                </Button>
              </Link>
            </motion.div>

            {/* Animated Counters */}
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.5 }}
               className="flex items-center justify-center lg:justify-start gap-6 sm:gap-10 mt-14"
            >
               <div className="flex flex-col items-center lg:items-start">
                  <div className="text-2xl sm:text-3xl font-display font-black text-white mb-1 tracking-tight">
                     <AnimatedCounter end={500} suffix="+" />
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-white/60 uppercase tracking-widest">Tailors</div>
               </div>
               
               <div className="w-px h-10 bg-white/20"></div>

               <div className="flex flex-col items-center lg:items-start">
                  <div className="text-2xl sm:text-3xl font-display font-black text-white mb-1 tracking-tight">
                     <AnimatedCounter end={10} suffix="k+" />
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-white/60 uppercase tracking-widest">Orders</div>
               </div>

               <div className="w-px h-10 bg-white/20"></div>

               <div className="flex flex-col items-center lg:items-start">
                  <div className="text-2xl sm:text-3xl font-display font-black text-white mb-1 tracking-tight">
                     <AnimatedCounter end={98} suffix="%" />
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-white/60 uppercase tracking-widest">Satisfaction</div>
               </div>
            </motion.div>
          </div>

          {/* Right Column (Mockup) */}
          <div className="flex-1 w-full max-w-xl lg:max-w-none relative h-[450px] sm:h-[550px] perspective-1000 z-10 hidden md:block mt-10 lg:mt-0">
             {/* Center Main Dashboard Mockup */}
             <motion.div
               initial={{ opacity: 0, x: 50, rotateY: -10 }}
               animate={{ opacity: 1, x: 0, rotateY: -5 }}
               transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
               className="absolute inset-0 rounded-[2rem] bg-white border border-white/20 shadow-[0_30px_100px_-15px_rgba(0,0,0,0.5)] overflow-hidden h-[95%] z-10 flex flex-col transform-gpu"
             >
               {/* Dashboard Header Bar */}
               <div className="h-14 bg-slate-50 border-b border-slate-100 flex items-center px-6 justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                    </div>
                    <div className="ml-4 flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-slate-200 shadow-sm text-xs font-bold text-slate-500">
                      <LayoutDashboard className="w-3.5 h-3.5 text-[#004643]" /> Dashboard
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="hidden sm:block w-32 h-6 bg-slate-200/60 rounded-full animate-[pulse_3s_ease-in-out_Infinity]"></div>
                    <div className="w-8 h-8 rounded-full bg-[#004643]/10 flex items-center justify-center border border-[#004643]/20">
                      <span className="text-xs font-black text-[#004643]">T</span>
                    </div>
                  </div>
               </div>

               {/* Dashboard Content */}
               <div className="p-6 flex-1 grid grid-cols-1 gap-6 bg-[#fcfdfd] relative overflow-hidden">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4 h-24 flex-shrink-0">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
                       <div className="flex justify-between items-center">
                          <div className="w-16 h-2 bg-slate-100 rounded-full"></div>
                          <div className="p-2 bg-[#004643]/10 rounded-xl"><Scissors className="w-4 h-4 text-[#004643]" /></div>
                       </div>
                       <div>
                         <div className="w-12 h-6 bg-slate-800 rounded-lg mb-2"></div>
                         <div className="w-20 h-1.5 bg-emerald-100 rounded-full"></div>
                       </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
                       <div className="flex justify-between items-center">
                          <div className="w-20 h-2 bg-slate-100 rounded-full"></div>
                          <div className="p-2 bg-emerald-50 rounded-xl"><CheckCircle className="w-4 h-4 text-emerald-500" /></div>
                       </div>
                       <div>
                         <div className="w-8 h-6 bg-slate-800 rounded-lg mb-2"></div>
                         <div className="w-24 h-1.5 bg-slate-100 rounded-full"></div>
                       </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
                       <div className="flex justify-between items-center">
                          <div className="w-16 h-2 bg-slate-100 rounded-full"></div>
                          <div className="p-2 bg-blue-50 rounded-xl"><Zap className="w-4 h-4 text-blue-500" /></div>
                       </div>
                       <div>
                         <div className="w-20 h-6 bg-slate-800 rounded-lg mb-2"></div>
                         <div className="w-20 h-1.5 bg-slate-100 rounded-full"></div>
                       </div>
                    </div>
                  </div>

                  {/* Main Table Area */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col flex-1">
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
                           <div className="w-16 h-6 bg-[#004643]/10 rounded-full flex items-center justify-center">
                              <div className="w-8 h-1.5 bg-[#004643]/60 rounded-full"></div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
               
               <div className="absolute down-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
             </motion.div>

             {/* Floating UI Elements over Mockup */}
             <motion.div
               initial={{ opacity: 0, x: -30, y: 20 }}
               animate={{ opacity: 1, x: -20, y: [20, -5, 20] }}
               transition={{ 
                 opacity: { duration: 0.8, delay: 0.7 },
                 y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
               }}
               className="absolute top-[20%] -left-8 z-20 w-48 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white p-4"
             >
                <div className="flex gap-2 items-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-emerald-600"/></div>
                  <div>
                    <div className="w-16 h-2 bg-slate-800 rounded-full mb-1"></div>
                    <div className="w-10 h-1.5 bg-slate-300 rounded-full"></div>
                  </div>
                </div>
                <div className="w-full h-2 bg-emerald-500 rounded-full rounded-r-none"></div>
             </motion.div>

             <motion.div
               initial={{ opacity: 0, x: 30, y: -20 }}
               animate={{ opacity: 1, x: 20, y: [-20, 5, -20] }}
               transition={{ 
                 opacity: { duration: 0.8, delay: 0.9 },
                 y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }
               }}
               className="absolute right-[5%] bottom-[10%] z-20 w-56 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-5"
             >
                <div className="flex justify-between items-center mb-4">
                   <div className="text-white font-bold text-sm">Revenue</div>
                   <div className="text-emerald-400 text-xs font-bold">+14%</div>
                </div>
                <div className="text-3xl font-black text-white mb-4">$12,450</div>
                <div className="flex items-end gap-1 h-12">
                   {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                     <div key={i} className="flex-1 bg-brand-primary/40 rounded-t-sm relative group cursor-pointer hover:bg-brand-primary transition-colors" style={{ height: `${h}%` }}></div>
                   ))}
                </div>
             </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
