import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Scissors, Users, LayoutDashboard, Settings, LogOut, FileText, Globe, Plus, UserCheck, BellRing } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import MobileBottomNav from './MobileBottomNav';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import NotificationBell from './NotificationBell';

export default function Layout() {
  const { logOut, user } = useAuth();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [shop, setShop] = useState({ name: '', phone: '', address: '' });
  const navigate = useNavigate();

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
    { name: t('layout.staff') || 'Staff', path: '/dashboard/staff', icon: UserCheck },
    { name: t('layout.orders'), path: '/dashboard/orders', icon: FileText },
    { name: 'Reminders', path: '/dashboard/reminders', icon: BellRing },
    { name: t('layout.settings'), path: '/dashboard/settings', icon: Settings },
  ];

  const userInitial = user?.email ? user.email[0].toUpperCase() : '?';

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  return (
    <div className={cn("flex h-screen bg-background text-on-background font-sans overflow-hidden", isRTL ? "font-urdu" : "")}>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface flex items-center justify-between px-4 z-30 shadow-[0_1px_4px_rgba(0,0,0,0.05)] border-b border-surface-container-highest">
        <span className="logo-text font-bold text-xl text-primary flex items-center gap-2">
          <Scissors className="h-5 w-5" /> Loop Tailor
        </span>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button 
            onClick={toggleLanguage}
            className="flex items-center justify-center p-2 rounded-full cursor-pointer hover:bg-surface-variant transition-colors"
          >
            <Globe className="h-4 w-4 text-on-surface-variant" />
          </button>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="h-9 w-9 rounded-full bg-primary-container text-on-primary-container font-bold flex items-center justify-center border border-outline-variant">
              {userInitial}
            </button>
            {isMenuOpen && (
              <div className={cn("absolute mt-4 w-64 bg-surface rounded-[16px] shadow-lg border border-outline-variant py-4 z-50", isRTL ? "left-0" : "right-0")}>
                <div className="px-6 pb-4 mb-2 mx-4 rounded-xl p-4 bg-surface-container">
                  <div className="font-bold text-[17px] truncate text-primary">{shop.name || t('layout.myShop')}</div>
                  <div className="text-[13px] text-on-surface-variant truncate">{shop.address || t('layout.noAddress')}</div>
                  <div className="text-[13px] text-on-surface-variant truncate">{shop.phone || t('layout.noPhone')}</div>
                </div>
                <Link to="/dashboard/settings" className="block px-6 py-3 text-[15px] font-medium text-on-surface hover:bg-surface-variant" onClick={() => setIsMenuOpen(false)}>{t('layout.settings')}</Link>
                <button onClick={() => { logOut(); setIsMenuOpen(false); }} className={cn("block w-full px-6 py-3 text-[15px] font-medium text-error hover:bg-error-container hover:text-on-error-container", isRTL ? "text-right" : "text-left")}>{t('layout.signOut')}</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[256px] bg-surface-container-low flex-col z-20 border-r border-outline-variant">
        <div className="h-20 flex items-center justify-between px-6 mb-2">
          <Link to="/dashboard" className="flex items-center cursor-pointer gap-3">
            <div className="bg-primary text-on-primary p-2.5 rounded-xl shadow-sm">
              <Scissors className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl text-primary tracking-tight">
              Loop Tailor
            </span>
          </Link>
          <NotificationBell />
        </div>
        
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "group flex items-center w-full px-4 h-14 rounded-full text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-secondary-container text-on-secondary-container" 
                    : "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
                )}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-3" : "mr-3", isActive ? "text-on-secondary-container" : "text-on-surface-variant group-hover:text-on-surface")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-2 mb-2">
           <button
             onClick={toggleLanguage}
             className="flex items-center w-full px-4 h-14 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors"
           >
             <Globe className={cn("h-5 w-5 flex-shrink-0 text-on-surface-variant group-hover:text-on-surface", isRTL ? "ml-3" : "mr-3")} />
             {language === 'en' ? 'اردو' : 'English'}
           </button>
          <button
            onClick={logOut}
            className="flex items-center w-full px-4 h-14 rounded-full text-sm font-medium text-error hover:bg-error-container hover:text-on-error-container transition-colors"
          >
            <LogOut className={cn("h-5 w-5 flex-shrink-0 text-error", isRTL ? "ml-3" : "mr-3")} />
            {t('layout.signOut')}
          </button>
        </div>
      </aside>

      <MobileBottomNav />

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background relative pb-20 pt-16 lg:pt-0 lg:pb-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1280px] mx-auto min-h-full">
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
        {/* Floating Action Button (FAB) */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/dashboard/orders/new')}
          className="fixed bottom-24 right-6 lg:bottom-10 lg:right-10 h-14 w-14 bg-primary-container text-on-primary-container rounded-2xl shadow-md hover:shadow-lg flex items-center justify-center z-50 lg:hidden"
        >
          <Plus className="h-7 w-7" />
        </motion.button>
      </main>
    </div>
  );
}
