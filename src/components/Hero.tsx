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
        initial={{ width: 0 }}
        animate={{ width: '40%' }}
        transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
        className="relative h-1 w-full max-w-lg mb-8 overflow-hidden rounded-full"
      >
        <motion.div 
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-emerald-800 rounded-full"
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
