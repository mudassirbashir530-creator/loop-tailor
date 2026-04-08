import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Scissors, Plus, List } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

export default function Hero() {
  const { isRTL } = useLanguage();

  return (
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-x-hidden flex flex-col items-center justify-center text-center px-4 bg-[#FDFCF9]">
      {/* App Logo / Brand Name */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex items-center gap-3 mb-8"
      >
        <div className="bg-brand-primary p-3 rounded-2xl shadow-sm">
          <Scissors className="h-8 w-8 text-white" />
        </div>
        <span className="text-3xl md:text-4xl font-display font-black tracking-tight text-slate-900">
          Loop Tailor
        </span>
      </motion.div>

      {/* Hero Image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="w-full max-w-4xl mx-auto mb-10 relative z-10"
      >
        <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-brand-primary/10 border border-slate-200/60 bg-slate-100 aspect-video w-full">
          <img 
            src="https://lh3.googleusercontent.com/d/1Tzg3-f0TUCzguxVst17tPqeJZixD6K4v" 
            alt="Digital tailoring management workflow" 
            className="w-full h-full object-cover object-left sm:object-center transition-opacity duration-300 opacity-0"
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
            onError={(e) => {
              if (!e.currentTarget.src.includes('thumbnail')) {
                e.currentTarget.src = "https://drive.google.com/thumbnail?id=1Tzg3-f0TUCzguxVst17tPqeJZixD6K4v&sz=w1920";
              } else {
                e.currentTarget.src = "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop";
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent pointer-events-none"></div>
        </div>
      </motion.div>

      {/* Value Statement / Tagline */}
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        className="text-2xl sm:text-3xl md:text-4xl font-sans font-bold tracking-tight text-slate-900 mb-8 max-w-2xl mx-auto leading-tight"
      >
        Manage tailoring orders, clients, and deliveries in one place.
      </motion.h1>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
      >
        <Link to="/signup" className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto rounded-2xl px-8 h-14 text-lg font-bold bg-brand-primary hover:bg-brand-primary/90 text-white shadow-xl shadow-brand-primary/20 transition-all active:scale-95">
            <Plus className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />
            Create Order
          </Button>
        </Link>
        <Link to="/login" className="w-full sm:w-auto">
          <Button 
            size="lg" 
            variant="outline"
            className="w-full sm:w-auto rounded-2xl px-8 h-14 text-lg font-bold bg-white border-2 border-slate-200 hover:border-brand-primary/30 hover:bg-slate-50 text-slate-900 shadow-sm transition-all active:scale-95"
          >
            <List className={cn("h-5 w-5 text-slate-500", isRTL ? "ml-2" : "mr-2")} />
            View Orders
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}
