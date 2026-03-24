import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Scissors, Users, LayoutDashboard, Settings, LogOut, FileText, UserCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import MobileBottomNav from './MobileBottomNav';
import { useState } from 'react';

export default function Layout() {
  const { logOut, user } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/dashboard/customers', icon: Users },
    { name: 'Orders', path: '/dashboard/orders', icon: FileText },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-brand-secondary text-slate-900 font-sans overflow-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-4 z-30">
        <span className="text-lg font-display font-bold">Loop Tailor</span>
        <div className="relative">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 p-2 rounded-full hover:bg-slate-100">
            <UserCircle className="h-8 w-8 text-slate-600" />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
              <div className="px-4 py-2 text-xs text-slate-500 truncate">{user?.email}</div>
              <Link to="/dashboard/settings" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setIsMenuOpen(false)}>Settings</Link>
              <button onClick={() => { logOut(); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
            </div>
          )}
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200 bg-white/80 backdrop-blur-xl flex-col z-20">
        <Link to="/dashboard" className="h-20 flex items-center px-6 border-b border-slate-100 cursor-pointer">
          <motion.div 
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
            className="bg-brand-primary p-2 rounded-xl mr-3"
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
                <Icon className={cn("h-5 w-5 mr-3 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-slate-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <button
            onClick={logOut}
            className="flex items-center w-full px-4 py-3 rounded-2xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 group"
          >
            <LogOut className="h-5 w-5 mr-3 text-slate-400 group-hover:text-red-500 transition-colors" />
            Sign Out
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
