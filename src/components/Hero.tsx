import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowRight, Sparkles, LayoutDashboard, Users, Clock, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

export default function Hero() {
  const { isRTL } = useLanguage();
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["Precision", "Elegance", "Efficiency", "Craftsmanship", "Ease"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber((prev) => (prev + 1) % titles.length);
    }, 2500);
    return () => clearTimeout(timeoutId);
  }, [titles.length]);

  return (
    <section className="relative pt-24 pb-12 lg:pt-36 lg:pb-20 overflow-hidden flex flex-col items-center justify-center text-center px-4 bg-[#FDFCF9]">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[400px] sm:h-[600px] bg-brand-primary/10 rounded-[100%] blur-[80px] sm:blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full flex flex-col items-center">
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white border border-slate-200/60 shadow-sm mb-8 sm:mb-10"
        >
          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-primary" />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-slate-600">The Modern OS for Tailors</span>
        </motion.div>

        {/* Headline */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-2 mb-6 sm:mb-8 w-full"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black tracking-tight text-slate-900 leading-[1.15] sm:leading-[1.1]">
            Run your tailoring business
          </h1>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black tracking-tight leading-[1.15] sm:leading-[1.1] flex flex-wrap justify-center items-center gap-x-2 sm:gap-x-4">
            <span className="text-slate-900">with</span>
            <span className="relative flex justify-center overflow-hidden text-brand-primary h-[1.25em] w-[200px] sm:w-[300px] md:w-[360px] lg:w-[440px]">
              {titles.map((title, index) => (
                <motion.span
                  key={index}
                  className="absolute inset-0 flex items-center justify-center font-display"
                  initial={{ opacity: 0, y: "100%" }}
                  animate={
                    titleNumber === index
                      ? { y: 0, opacity: 1 }
                      : { y: titleNumber > index ? "-100%" : "100%", opacity: 0 }
                  }
                  transition={{ type: "spring", stiffness: 50, damping: 15 }}
                >
                  {title}.
                </motion.span>
              ))}
            </span>
          </h1>
        </motion.div>

        {/* Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg md:text-xl text-slate-500 mb-10 sm:mb-12 max-w-2xl mx-auto font-medium leading-relaxed px-4 sm:px-0"
        >
          Manage orders, track measurements, and delight your clients with a seamless, professional workflow designed specifically for modern tailors.
        </motion.p>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto px-6 sm:px-0"
        >
          <Link to="/signup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base font-bold rounded-2xl shadow-xl shadow-brand-primary/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-primary/30 transition-all duration-300">
              Start for free
              <ArrowRight className={cn("h-4 w-4 sm:h-5 sm:w-5", isRTL ? "mr-2 rotate-180" : "ml-2")} />
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base font-bold rounded-2xl border-slate-200 hover:bg-slate-50 hover:-translate-y-1 hover:shadow-md transition-all duration-300"
            >
              Sign in
            </Button>
          </Link>
        </motion.div>

        {/* Dashboard Mockup (SaaS Hero Visual) */}
        <motion.div
           initial={{ opacity: 0, y: 40 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
           className="w-full max-w-5xl mt-16 sm:mt-24 relative"
        >
           {/* Fade out bottom of UI for that clean landing page look */}
           <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-[#FDFCF9] via-[#FDFCF9]/80 to-transparent z-20 pointer-events-none" />
           
           <div className="bg-white rounded-t-[2rem] sm:rounded-t-[3rem] border border-slate-200/60 border-b-0 shadow-2xl shadow-slate-200/50 overflow-hidden p-2 sm:p-4">
             <div className="bg-slate-50 rounded-t-2xl sm:rounded-t-[2.5rem] border border-slate-200 border-b-0 w-full h-[300px] sm:h-[500px] overflow-hidden flex flex-col relative pt-4 px-4 sm:pt-6 sm:px-6">
                
                {/* Mock Header */}
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                        <LayoutDashboard className="h-4 w-4 text-brand-primary" />
                     </div>
                     <div className="w-24 sm:w-32 h-2.5 bg-slate-200 rounded-full" />
                  </div>
                  <div className="hidden sm:flex items-center gap-4">
                     <div className="w-32 h-2.5 bg-slate-200 rounded-full mr-4" />
                     <div className="w-8 h-8 rounded-full bg-slate-200" />
                     <div className="w-10 h-10 rounded-full bg-slate-300 border-2 border-white shadow-sm" />
                  </div>
                </div>

                {/* Mock Content */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 relative z-10">
                  {/* Cards */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm col-span-1">
                     <div className="flex items-center justify-between mb-4">
                        <div className="w-16 h-2 bg-slate-100 rounded-full" />
                        <div className="p-2 bg-blue-50 rounded-lg"><Users className="h-4 w-4 text-blue-500" /></div>
                     </div>
                     <div className="w-20 h-6 bg-slate-800 rounded-lg mb-2" />
                     <div className="w-12 h-2 bg-emerald-100 rounded-full" />
                  </div>
                  
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm col-span-1 hidden sm:block">
                     <div className="flex items-center justify-between mb-4">
                        <div className="w-16 h-2 bg-slate-100 rounded-full" />
                        <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle className="h-4 w-4 text-emerald-500" /></div>
                     </div>
                     <div className="w-16 h-6 bg-slate-800 rounded-lg mb-2" />
                     <div className="w-12 h-2 bg-emerald-100 rounded-full" />
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm col-span-1 hidden sm:block">
                     <div className="flex items-center justify-between mb-4">
                        <div className="w-16 h-2 bg-slate-100 rounded-full" />
                        <div className="p-2 bg-amber-50 rounded-lg"><Clock className="h-4 w-4 text-amber-500" /></div>
                     </div>
                     <div className="w-24 h-6 bg-slate-800 rounded-lg mb-2" />
                     <div className="w-12 h-2 bg-slate-100 rounded-full" />
                  </div>

                  {/* List area */}
                  <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm col-span-1 sm:col-span-2">
                     <div className="h-3 w-32 bg-slate-200 rounded-full mb-6" />
                     <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                           <div key={i} className="flex items-center justify-between pb-4 border-b border-slate-50 last:pb-0 last:border-0">
                             <div className="flex items-center gap-3 sm:gap-4">
                               <div className="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center shrink-0">
                                 <div className="w-4 h-4 rounded-full bg-brand-primary/20" />
                               </div>
                               <div>
                                 <div className="w-24 sm:w-32 h-2.5 bg-slate-700 rounded-full mb-2.5" />
                                 <div className="w-16 h-2 bg-slate-200 rounded-full" />
                               </div>
                             </div>
                             <div className="w-16 sm:w-20 h-5 bg-slate-100 rounded-md shrink-0" />
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Sidebar/Chart area */}
                  <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm col-span-1 hidden sm:flex flex-col">
                     <div className="h-3 w-24 bg-slate-200 rounded-full mb-6" />
                     <div className="flex-1 w-full flex items-end justify-between gap-1.5 sm:gap-2">
                        {[40, 70, 45, 90, 60, 80].map((h, i) => (
                          <div key={i} className="w-full bg-brand-primary/10 rounded-t-sm" style={{ height: `${h}%` }}>
                             <div className="w-full bg-brand-primary rounded-t-sm transition-all" style={{ height: `${h * 0.7}%` }} />
                          </div>
                        ))}
                     </div>
                  </div>

                </div>
             </div>
           </div>
        </motion.div>

      </div>
    </section>
  );
}
