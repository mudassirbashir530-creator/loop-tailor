import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Scissors, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

export default function Header() {
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/#features' },
    { name: 'How it Works', path: '/#how-it-works' },
    { name: 'About', path: '/about' },
    { name: 'Pricing', path: '/#pricing' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path.startsWith('/#')) {
      return location.pathname === '/' && location.hash === path.substring(1);
    }
    return location.pathname === path;
  };

  return (
    <>
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled ? "bg-white/80 backdrop-blur-xl border-b border-slate-200/60 py-2" : "bg-transparent py-4"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <Link to="/" className="flex items-center gap-2 group cursor-pointer">
              <motion.div 
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="bg-brand-primary p-1.5 rounded-lg shadow-sm shadow-brand-primary/20"
              >
                <Scissors className="h-5 w-5 text-white" />
              </motion.div>
              <span className="text-xl font-display font-black tracking-tight text-slate-900">
                Loop Tailor
              </span>
            </Link>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.path}
                  className="relative px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors group"
                >
                  {link.name}
                  {isActive(link.path) && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute inset-0 bg-slate-100 rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
              
              <div className="flex items-center gap-3 pl-4 ml-2 border-l border-slate-200">
                <Link to="/auth/login">
                  <Button variant="ghost" className="text-sm font-bold h-10 px-4 rounded-xl hover:bg-slate-100">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth/signup">
                  <Button className="h-10 px-5 text-sm font-bold rounded-xl shadow-md shadow-brand-primary/20 hover:-translate-y-0.5 transition-all">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="rounded-xl">
                {isMenuOpen ? <X /> : <Menu />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-2">
                {navLinks.map((link) => (
                  <Link 
                    key={link.name} 
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "block px-4 py-3 text-lg font-bold rounded-xl transition-colors",
                      isActive(link.path) ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
                
                <div className="pt-4 flex flex-col gap-3 mt-4 border-t border-slate-100">
                  <Link to="/auth/login" className="w-full" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full h-12 text-base font-bold rounded-xl">Sign In</Button>
                  </Link>
                  <Link to="/auth/signup" className="w-full" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full h-12 text-base font-bold rounded-xl shadow-md shadow-brand-primary/20">Start Free Trial</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
