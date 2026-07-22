import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Plus, FileText, Scissors, Menu, X, Settings, UserCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainNavItems = [
    { name: 'Home', path: '/app', icon: LayoutDashboard },
    { name: 'Clients', path: '/app/clients', icon: Users },
    { name: 'New', path: '/app/new-order', icon: Plus, isAction: true },
    { name: 'Orders', path: '/app/orders', icon: Scissors },
    { name: 'More', isMore: true, icon: Menu },
  ];

  const moreMenuSecondaryItems = [
    { name: 'Staff', path: '/app/staff', icon: UserCheck },
    { name: 'Settings', path: '/app/settings', icon: Settings },
  ];

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-surface/90 backdrop-blur-lg border-t border-outline-variant h-[72px] pb-safe px-2 shadow-[0_-8px_32px_rgba(0,0,0,0.04)]">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          
          if (item.isAction) {
            return (
              <div key={item.name} className="relative -top-6">
                <button
                  onClick={() => {
                     setIsMoreOpen(false);
                     navigate(item.path!);
                  }}
                  className="flex items-center justify-center w-[56px] h-[56px] bg-primary text-white rounded-full shadow-fab hover:scale-105 transition-transform"
                >
                  <Icon className="h-7 w-7" />
                </button>
              </div>
            );
          }

          if (item.isMore) {
            const isActive = isMoreOpen;
            return (
              <button
                key={item.name}
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className="flex flex-col items-center justify-center flex-1 h-full gap-1 pt-1"
              >
                <Icon className={cn("h-6 w-6 transition-colors", isActive ? "text-primary" : "text-on-surface-variant")} />
                <span className={cn("text-[10px] font-medium transition-colors", isActive ? "text-primary" : "text-on-surface-variant")}>{item.name}</span>
                <div className={cn("w-1 h-1 rounded-full mt-0.5 transition-all", isActive ? "bg-primary scale-100" : "bg-transparent scale-0")} />
              </button>
            );
          }

          const isActive = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path!));

          return (
            <Link
              key={item.name}
              to={item.path!}
              onClick={() => setIsMoreOpen(false)}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 pt-1"
            >
              <Icon className={cn("h-6 w-6 transition-colors", isActive ? "text-primary" : "text-on-surface-variant")} />
              <span className={cn("text-[10px] font-medium transition-colors", isActive ? "text-primary" : "text-on-surface-variant")}>{item.name}</span>
              <div className={cn("w-1 h-1 rounded-full mt-0.5 transition-all", isActive ? "bg-primary scale-100" : "bg-transparent scale-0")} />
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
              className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full bg-surface rounded-t-[32px] shadow-[0_-8px_32px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden relative z-50 mb-[72px]"
            >
              <div className="p-5 flex items-center justify-between border-b border-outline-variant">
                <span className="font-display font-medium text-on-surface text-lg">Menu</span>
                <button 
                  onClick={() => setIsMoreOpen(false)}
                  className="p-2 rounded-full bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 flex flex-col gap-2 relative bg-surface-container-lowest">
                {moreMenuSecondaryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200",
                        isActive 
                          ? "bg-primary text-white font-medium shadow-sm" 
                          : "text-on-surface font-medium hover:bg-surface-container"
                      )}
                    >
                      <div className={cn("p-2.5 rounded-xl", isActive ? "bg-white/20" : "bg-surface-container-high text-on-surface-variant")}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-base">{item.name}</span>
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
