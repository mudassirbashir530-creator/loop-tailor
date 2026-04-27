import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Plus, FileText, Scissors, Menu, X, Settings, UserCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainNavItems = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Clients', path: '/dashboard/customers', icon: Users },
    { name: 'New', path: '/dashboard/orders/new', icon: Plus, isAction: true },
    { name: 'Orders', path: '/dashboard/orders', icon: Scissors },
    { name: 'More', isMore: true, icon: Menu },
  ];

  const moreMenuSecondaryItems = [
    { name: 'Staff', path: '/dashboard/staff', icon: UserCheck },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bottom-nav z-50 flex items-end justify-around">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          
          if (item.isAction) {
            return (
              <button
                key={item.name}
                onClick={() => {
                  setIsMoreOpen(false);
                  navigate(item.path!);
                }}
                className="fab-btn"
              >
                <Icon className="h-7 w-7" />
              </button>
            );
          }

          if (item.isMore) {
            const isActive = isMoreOpen;
            return (
              <button
                key={item.name}
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={cn(
                  "nav-item transition-colors",
                  isActive ? "active" : ""
                )}
              >
                <Icon className={cn("h-6 w-6 nav-icon", isActive ? "" : "text-slate-400")} />
                <span className={cn("text-[10px] font-medium nav-label", isActive ? "" : "text-slate-500")}>{item.name}</span>
              </button>
            );
          }

          const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path!));

          return (
            <Link
              key={item.name}
              to={item.path!}
              onClick={() => setIsMoreOpen(false)}
              className={cn(
                "nav-item transition-colors",
                isActive ? "active" : ""
              )}
            >
              <Icon className={cn("h-6 w-6 nav-icon", isActive ? "" : "text-slate-400")} />
              <span className={cn("text-[10px] font-medium nav-label", isActive ? "" : "text-slate-500")}>{item.name}</span>
            </Link>
          );
        })}
      </div>

      <AnimatePresence>
        {isMoreOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-sm bg-gray-100 rounded-t-3xl shadow-neu flex flex-col overflow-hidden relative z-50 mb-20"
            >
              <div className="p-4 flex items-center justify-between border-b border-gray-200/50">
                <span className="font-bold text-slate-700">More Options</span>
                <button 
                  onClick={() => setIsMoreOpen(false)}
                  className="p-2 rounded-full bg-gray-100 shadow-neu-sm text-slate-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {moreMenuSecondaryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300",
                        isActive 
                          ? "bg-gray-100 shadow-neu-pressed text-brand-primary font-bold" 
                          : "text-slate-600 font-medium hover:shadow-neu-sm"
                      )}
                    >
                      <div className={cn("p-2 rounded-xl", isActive ? "bg-gray-100 shadow-neu-sm text-brand-primary" : "text-slate-500 shadow-neu-sm")}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
