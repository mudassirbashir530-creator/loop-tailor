import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Scissors, Users, LayoutDashboard, Settings, LogOut, FileText, Globe, Plus, UserCheck, BellRing } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import MobileBottomNav from './MobileBottomNav';
import { db } from '../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import NotificationBell from './NotificationBell';
import { toast } from 'sonner';

export default function Layout() {
  const { logOut, user } = useAuth();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [shop, setShop] = useState({ name: '', phone: '', address: '' });
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    
    // Real-time block listener
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.isBlocked === true) {
          try {
            await logOut();
            localStorage.clear();
            sessionStorage.clear();
            navigate('/auth/login', { replace: true });
            toast.error("Your account has been suspended. Contact support for assistance.", {
              duration: 12000,
            });
          } catch (logoutErr) {
            console.error("Error signing out blocked user:", logoutErr);
          }
        }
      }
    }, (error) => {
      console.error("Layout real-time block observer error:", error);
    });

    return () => {
      unsubscribe();
    };
  }, [user, logOut, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchShop = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', user.uid));
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
    { name: t('layout.dashboard'), path: '/app', icon: LayoutDashboard },
    { name: t('layout.customers'), path: '/app/clients', icon: Users },
    { name: t('layout.staff') || 'Staff', path: '/app/staff', icon: UserCheck },
    { name: t('layout.orders'), path: '/app/orders', icon: FileText },
    { name: 'Reminders', path: '/app/reminders', icon: BellRing },
    { name: t('layout.settings'), path: '/app/settings', icon: Settings },
  ];

  const userInitial = user?.email ? user.email[0].toUpperCase() : '?';

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  return (
    <div className={cn("flex flex-col lg:flex-row w-full min-h-screen bg-background text-on-background font-sans", isRTL ? "font-urdu" : "")}>
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-md flex items-center justify-between px-4 z-40 border-b border-outline-variant">
        <span className="logo-text font-bold text-xl text-primary flex items-center gap-2">
          <Scissors className="h-5 w-5" /> Loop Tailor
        </span>
        <div className="flex items-center gap-3 text-on-surface">
          <NotificationBell />
          <button 
            onClick={toggleLanguage}
            className="flex items-center justify-center p-2 rounded-full cursor-pointer hover:bg-surface-container transition-colors"
          >
            <Globe className="h-4 w-4" />
          </button>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="h-9 w-9 rounded-full bg-primary text-white font-medium flex items-center justify-center shadow-sm">
              {userInitial}
            </button>
            {isMenuOpen && (
              <div className={cn("absolute top-full mt-2 w-64 bg-surface rounded-2xl shadow-xl border border-outline-variant py-3 z-50", isRTL ? "left-0" : "right-0")}>
                <div className="px-4 pb-3 border-b border-outline-variant mb-2 mx-2">
                  <div className="font-medium text-base truncate text-on-surface">{shop.name || t('layout.myShop')}</div>
                  <div className="text-xs text-on-surface-variant truncate mt-0.5">{shop.address || t('layout.noAddress')}</div>
                  <div className="text-xs text-on-surface-variant truncate">{shop.phone || t('layout.noPhone')}</div>
                </div>
                <Link to="/app/settings" className="block px-6 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container" onClick={() => setIsMenuOpen(false)}>{t('layout.settings')}</Link>
                <button onClick={() => { logOut(); setIsMenuOpen(false); }} className={cn("block w-full px-6 py-2.5 text-sm font-medium text-error hover:bg-error/5", isRTL ? "text-right" : "text-left")}>{t('layout.signOut')}</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-surface flex-col z-20 border-r border-outline-variant lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="h-20 flex items-center justify-between px-6 mb-4 border-b border-outline-variant">
          <Link to="/app" className="flex items-center cursor-pointer gap-3">
            <div className="bg-primary text-white p-2.5 rounded-xl shadow-sm">
              <Scissors className="h-5 w-5" />
            </div>
            <span className="font-display font-medium text-xl text-on-surface tracking-tight">
              Loop Tailor
            </span>
          </Link>
          <NotificationBell />
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "group flex items-center w-full px-4 h-11 rounded-full text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-white shadow-soft" 
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                )}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-3" : "mr-3", isActive ? "text-white" : "text-on-surface-variant group-hover:text-on-surface")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-1.5 mt-auto border-t border-outline-variant">
           <button
             onClick={toggleLanguage}
             className="flex items-center w-full px-4 h-11 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
           >
             <Globe className={cn("h-5 w-5 flex-shrink-0 text-on-surface-variant", isRTL ? "ml-3" : "mr-3")} />
             {language === 'en' ? 'اردو' : 'English'}
           </button>
          <button
            onClick={logOut}
            className="flex items-center w-full px-4 h-11 rounded-full text-sm font-medium text-error hover:bg-error/10 transition-colors"
          >
            <LogOut className={cn("h-5 w-5 flex-shrink-0 text-error", isRTL ? "ml-3" : "mr-3")} />
            {t('layout.signOut')}
          </button>
        </div>
      </aside>

      <MobileBottomNav />

      {/* Main Content */}
      <main className="flex-1 w-full bg-background relative pb-24 lg:pb-0 min-w-0 flex flex-col">
        <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
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
          onClick={() => navigate('/app/new-order')}
          className="fixed bottom-[88px] right-4 lg:bottom-8 lg:right-8 h-14 w-14 bg-primary text-white rounded-full shadow-fab hover:shadow-xl flex items-center justify-center z-[50] lg:hidden"
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      </main>
    </div>
  );
}
