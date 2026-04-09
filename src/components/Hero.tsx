import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Scissors, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

export default function Hero() {
  const { isRTL, t } = useLanguage();
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["precision", "elegance", "efficiency", "craftsmanship", "ease"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2500);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-4 bg-[#FDFCF9] min-h-[90vh]">
      {/* Subtle Background Gradients & Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-primary/5 rounded-[100%] blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-400/5 rounded-full blur-[100px]"></div>
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-orange-400/5 rounded-full blur-[100px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-5xl mx-auto w-full"
      >
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200/60 shadow-sm mb-10"
        >
          <Sparkles className="h-4 w-4 text-brand-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">The modern operating system for tailors</span>
        </motion.div>

        {/* Main Headline with Motion Typography */}
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-display font-black tracking-tight text-slate-900 leading-[1.1]">
            Run your tailoring business
          </h1>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-display font-black tracking-tight leading-[1.1] flex flex-wrap justify-center items-center gap-x-4">
            <span className="text-slate-900">with</span>
            <span className="relative flex justify-center overflow-hidden text-brand-primary h-[1.2em] min-w-[280px] sm:min-w-[400px]">
              {titles.map((title, index) => (
                <motion.span
                  key={index}
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, y: 100 }}
                  animate={
                    titleNumber === index
                      ? { y: 0, opacity: 1 }
                      : { y: titleNumber > index ? -100 : 100, opacity: 0 }
                  }
                  transition={{ type: "spring", stiffness: 60, damping: 15 }}
                >
                  {title}.
                </motion.span>
              ))}
            </span>
          </h1>
        </div>

        {/* Subheadline */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-lg sm:text-xl text-slate-500 mb-12 max-w-2xl mx-auto font-medium leading-relaxed"
        >
          Manage orders, track measurements, and delight your clients with a seamless, professional workflow designed specifically for modern tailors.
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          <Link to="/signup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-base font-bold rounded-2xl shadow-xl shadow-brand-primary/20 hover:-translate-y-1 transition-all duration-300">
              Start for free
              <ArrowRight className={cn("h-5 w-5", isRTL ? "mr-2 rotate-180" : "ml-2")} />
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto h-14 px-10 text-base font-bold rounded-2xl border-slate-200 hover:bg-slate-50 hover:-translate-y-1 transition-all duration-300"
            >
              Sign in
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
