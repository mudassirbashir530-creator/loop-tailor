import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Scissors, Users, LayoutDashboard, Settings, LogOut, FileText, UserCircle, Globe, Plus, UserCheck, BellRing } from 'lucide-react';
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
    <div className={cn("flex h-screen bg-[#F2F4F0] text-slate-900 font-sans overflow-hidden", isRTL ? "font-urdu" : "")}>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#EEF1ED] shadow-[0_1px_0_rgba(0,0,0,0.04)] flex items-center justify-between px-5 z-30">
        <span className="text-[20px] font-display font-bold text-brand-primary tracking-[0.3px]">Loop Tailor</span>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button 
            onClick={toggleLanguage}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-[#EDF0EC] border border-[#DDE3DC] text-slate-600 transition-all"
          >
            <Globe className="h-4 w-4" />
          </button>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center justify-center h-10 w-10 rounded-full bg-brand-primary text-[#D4AA45] border-[2.5px] border-[#B8922A] font-bold text-lg transition-all">
              {userInitial}
            </button>
            {isMenuOpen && (
              <div className={cn("absolute mt-4 w-64 bg-white rounded-[20px] shadow-[0_8px_32px_rgba(26,74,58,0.12)] border border-[#EEF1ED] py-4 z-50", isRTL ? "left-0" : "right-0")}>
                <div className="px-6 pb-4 mb-2 mx-4 rounded-[14px] p-4 bg-[#EDF0EC] border border-[#EEF1ED]">
                  <div className="font-bold text-lg truncate text-brand-primary">{shop.name || t('layout.myShop')}</div>
                  <div className="text-sm text-slate-500 truncate">{shop.address || t('layout.noAddress')}</div>
                  <div className="text-sm text-slate-500 truncate">{shop.phone || t('layout.noPhone')}</div>
                </div>
                <Link to="/dashboard/settings" className="block px-6 py-3 text-sm font-medium text-slate-700 hover:text-brand-primary" onClick={() => setIsMenuOpen(false)}>{t('layout.settings')}</Link>
                <button onClick={() => { logOut(); setIsMenuOpen(false); }} className={cn("block w-full px-6 py-3 text-sm font-medium text-red-600 hover:text-red-700", isRTL ? "text-right" : "text-left")}>{t('layout.signOut')}</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white flex-col z-20 border-r border-[#EEF1ED] shadow-[0_4px_16px_rgba(26,74,58,0.10)]">
        <div className="h-24 flex items-center justify-between px-6 mb-4">
          <Link to="/dashboard" className="flex items-center cursor-pointer">
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              className={cn("bg-[#EDF0EC] p-3 rounded-[14px] border border-[#DDE3DC]", isRTL ? "ml-3" : "mr-3")}
            >
              <Scissors className="h-6 w-6 text-brand-primary" />
            </motion.div>
            <span className="text-xl font-display font-black tracking-tight text-brand-primary">
              Loop Tailor
            </span>
          </Link>
          <NotificationBell />
        </div>
        
        <nav className="flex-1 px-6 py-4 space-y-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "group flex items-center px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300",
                  isActive 
                    ? "bg-gray-100 shadow-neu-pressed text-brand-primary" 
                    : "text-slate-500 hover:shadow-neu-sm hover:text-brand-primary"
                )}
              >
                <div className={cn("p-2 rounded-xl transition-all duration-300", isActive ? "shadow-neu-sm bg-gray-100" : "group-hover:shadow-neu-sm", isRTL ? "ml-4" : "mr-4")}>
                  <Icon className={cn("h-5 w-5", isActive ? "text-brand-primary" : "text-slate-400 group-hover:text-brand-primary")} />
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="flex-1 flex items-center px-5 py-4 rounded-2xl text-sm font-bold text-slate-500 hover:shadow-neu-sm hover:text-brand-primary transition-all duration-300 group"
            >
              <div className={cn("p-2 rounded-xl group-hover:shadow-neu-sm transition-all duration-300", isRTL ? "ml-4" : "mr-4")}>
                <Globe className="h-5 w-5 text-slate-400 group-hover:text-brand-primary transition-colors" />
              </div>
              {language === 'en' ? 'اردو' : 'English'}
            </button>
            <div className="flex-shrink-0">
              <NotificationBell />
            </div>
          </div>
          <button
            onClick={logOut}
            className="flex items-center w-full px-5 py-4 rounded-2xl text-sm font-bold text-slate-500 hover:shadow-neu-sm hover:text-red-600 transition-all duration-300 group"
          >
            <div className={cn("p-2 rounded-xl group-hover:shadow-neu-sm transition-all duration-300", isRTL ? "ml-4" : "mr-4")}>
              <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-500 transition-colors" />
            </div>
            {t('layout.signOut')}
          </button>
        </div>
      </aside>

      <MobileBottomNav />

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#F2F4F0] relative pb-20 pt-16 lg:pt-0 lg:pb-0">
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
        {/* Floating Action Button (FAB) */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/dashboard/orders/new')}
          className="fixed bottom-24 right-6 lg:bottom-10 lg:right-10 h-[52px] w-[52px] bg-brand-primary text-white rounded-[16px] shadow-[0_8px_24px_rgba(26,74,58,0.35)] border-[3px] border-[#F2F4F0] flex items-center justify-center z-50 lg:hidden"
        >
          <Plus className="h-8 w-8" />
        </motion.button>
      </main>
    </div>
  );
}
