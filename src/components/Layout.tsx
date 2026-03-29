import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Scissors, Users, LayoutDashboard, Settings, LogOut, FileText, UserCircle, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import MobileBottomNav from './MobileBottomNav';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Layout() {
  const { logOut, user } = useAuth();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [shop, setShop] = useState({ name: '', phone: '', address: '' });

  useEffect(() => {
    if (!user) return;
    const fetchShop = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'shops', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          setShop({ name: data.name || '', phone: data.phone || '', address: data.address || '' });
        }
      } catch (error) {
        console.error('Error fetching shop:', error);
      }
    };
    fetchShop();
  }, [user]);

  const navItems = [
    { name: t('layout.dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('layout.customers'), path: '/dashboard/customers', icon: Users },
    { name: t('layout.orders'), path: '/dashboard/orders', icon: FileText },
    { name: t('layout.settings'), path: '/dashboard/settings', icon: Settings },
  ];

  const userInitial = user?.email ? user.email[0].toUpperCase() : '?';

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  return (
    <div className={cn("flex h-screen bg-brand-secondary text-slate-900 font-sans overflow-hidden", isRTL ? "font-urdu" : "")}>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-4 z-30">
        <span className="text-lg font-display font-bold">Loop Tailor</span>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-brand-primary transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span>{language === 'en' ? 'اردو' : 'EN'}</span>
          </button>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center justify-center h-10 w-10 rounded-full bg-brand-primary text-white font-bold text-lg hover:bg-brand-primary/90">
              {userInitial}
            </button>
            {isMenuOpen && (
              <div className={cn("absolute mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-4 z-50", isRTL ? "left-0" : "right-0")}>
                <div className="px-6 pb-4 border-b border-slate-100 mb-2">
                  <div className="font-bold text-lg truncate">{shop.name || t('layout.myShop')}</div>
                  <div className="text-sm text-slate-500 truncate">{shop.address || t('layout.noAddress')}</div>
                  <div className="text-sm text-slate-500 truncate">{shop.phone || t('layout.noPhone')}</div>
                </div>
                <Link to="/dashboard/settings" className="block px-6 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setIsMenuOpen(false)}>{t('layout.settings')}</Link>
                <button onClick={() => { logOut(); setIsMenuOpen(false); }} className={cn("block w-full px-6 py-2 text-sm text-red-600 hover:bg-red-50", isRTL ? "text-right" : "text-left")}>{t('layout.signOut')}</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200 bg-white/80 backdrop-blur-xl flex-col z-20">
        <Link to="/dashboard" className="h-20 flex items-center px-6 border-b border-slate-100 cursor-pointer">
          <motion.div 
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
            className={cn("bg-brand-primary p-2 rounded-xl", isRTL ? "ml-3" : "mr-3")}
          >
            <Scissors className="h-5 w-5 text-white" />
          </motion.div>
          <span className="text-xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-emerald-800">
            Loop Tailor
          </span>
        </Link>
        
        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "group flex items-center px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 relative overflow-hidden",
                  isActive 
                    ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute inset-0 bg-brand-primary -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={cn("h-5 w-5 transition-transform duration-300 group-hover:scale-110", isRTL ? "ml-3" : "mr-3", isActive ? "text-white" : "text-slate-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100 space-y-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center w-full px-4 py-3 rounded-2xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-brand-primary transition-all duration-300 group"
          >
            <Globe className={cn("h-5 w-5 text-slate-400 group-hover:text-brand-primary transition-colors", isRTL ? "ml-3" : "mr-3")} />
            {language === 'en' ? 'اردو' : 'English'}
          </button>
          <button
            onClick={logOut}
            className="flex items-center w-full px-4 py-3 rounded-2xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 group"
          >
            <LogOut className={cn("h-5 w-5 text-slate-400 group-hover:text-red-500 transition-colors", isRTL ? "ml-3" : "mr-3")} />
            {t('layout.signOut')}
          </button>
        </div>
      </aside>

      <MobileBottomNav />

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#FDFCF9] relative pb-20 pt-16 lg:pt-0 lg:pb-0">
        <div className="p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto min-h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
