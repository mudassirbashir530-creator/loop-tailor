import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-20 pb-16 lg:pt-28 lg:pb-20 overflow-hidden flex flex-col items-center justify-center text-center px-4">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-sans font-bold tracking-tight text-slate-900 mb-4 leading-[1.1]"
      >
        Welcome to Loop Tailor
      </motion.h1>

      <motion.div 
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: '100%', opacity: 1 }}
        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        className="relative h-[2px] w-full max-w-md mb-10 mx-auto overflow-hidden rounded-full bg-gradient-to-r from-transparent via-slate-200 to-transparent"
      >
        <motion.div 
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 }}
          className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-brand-primary to-transparent"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
      >
        <Link to="/signup">
          <Button size="lg" className="rounded-full px-8 bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg shadow-brand-primary/20 transition-all hover:scale-105 active:scale-95">
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}
