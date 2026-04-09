import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Scissors, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import Footer from './Footer';
import { cn } from '../lib/utils';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const normalizedPath = useMemo(() => pathname.replace(/\/+$/, '') || '/', [pathname]);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col font-sans">
      <header className="bg-white/95 border-b border-slate-100 sticky top-0 z-50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-brand-primary p-2 rounded-xl">
              <Scissors className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Loop Tailor</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const isActive = item.href === '/' ? normalizedPath === '/' : normalizedPath === item.href;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    'relative px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive ? 'text-brand-primary' : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="public-nav-active"
                      className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-brand-primary"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen((v) => !v)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white">
            <div className="max-w-7xl mx-auto px-4 py-3 grid gap-2">
              {navLinks.map((item) => (
                <Link key={item.label} to={item.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
      
      <main className="flex-1 w-full">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}
