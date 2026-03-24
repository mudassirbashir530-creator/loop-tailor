import React from 'react';
import { motion } from 'motion/react';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-24 overflow-hidden flex flex-col items-center justify-center text-center px-4">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <motion.h1 
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0% 0 0)' }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black tracking-tight text-slate-900 mb-6 leading-[1.1] drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]"
      >
        Welcome to Loop Tailor — <br className="hidden md:block" />
        <span className="text-brand-primary">The Smart Tailor Management Software</span>
      </motion.h1>

      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
        className="h-1 w-full max-w-2xl bg-gradient-to-r from-blue-500 via-brand-primary to-purple-500 rounded-full mb-8"
      />

      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
        className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
      >
        Manage orders, measurements, and customers effortlessly in one powerful system.
      </motion.p>
    </section>
  );
}
