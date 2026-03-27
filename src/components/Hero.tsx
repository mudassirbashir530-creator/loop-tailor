import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import DemoModal from './DemoModal';

export default function Hero() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <section className="relative pt-20 pb-16 lg:pt-28 lg:pb-20 overflow-x-hidden flex flex-col items-center justify-center text-center px-4">
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
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <Link to="/signup">
          <Button size="lg" className="rounded-full px-8 bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg shadow-brand-primary/20 transition-all hover:scale-105 active:scale-95">
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
        <Button 
          size="lg" 
          variant="outline"
          onClick={() => setIsDemoModalOpen(true)}
          className="rounded-full px-8 bg-white border-2 border-slate-200 hover:border-brand-primary/30 hover:bg-slate-50 text-slate-900 shadow-sm transition-all hover:scale-105 active:scale-95 group"
        >
          <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center mr-2 group-hover:bg-brand-primary transition-colors">
            <Play className="h-3 w-3 text-brand-primary group-hover:text-white ml-0.5 transition-colors" />
          </div>
          Watch Demo
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="mt-16 md:mt-24 w-full max-w-6xl mx-auto relative z-10"
        style={{ perspective: 2000 }}
      >
        <motion.div 
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ rotateX: 2, rotateY: -2, scale: 1.02 }}
          className="relative rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-brand-primary/30 border border-white/60 bg-white/40 backdrop-blur-md p-2 md:p-4 transition-transform duration-500"
        >
          <div className="relative rounded-xl md:rounded-3xl overflow-hidden border border-slate-200/50 shadow-inner bg-slate-800 min-h-[200px] sm:min-h-[300px] md:min-h-[400px] lg:min-h-[500px] flex items-center justify-center">
            <img 
              src="https://storage.googleapis.com/manta-zmt/tmp/2026-03-27/chat-01997327-047b-70c8-9710-d3e9114f0490/image_0.jpg" 
              alt="LoopTailor Dashboard Preview" 
              className="w-full h-full object-cover absolute inset-0"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback if the temporary image URL expires or fails to load
                e.currentTarget.src = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop";
              }}
            />
            {/* Overlay gradient for premium feel */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent pointer-events-none z-10"></div>
          </div>
        </motion.div>
        
        {/* Glow behind the image */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-brand-primary/20 blur-[120px] -z-10 rounded-full pointer-events-none"></div>
      </motion.div>

      <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </section>
  );
}
