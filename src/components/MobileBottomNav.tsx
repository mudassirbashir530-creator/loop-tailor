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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white border-t border-[#E2DDD6] h-[64px] pb-safe px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          
          if (item.isAction) {
            return (
              <div key={item.name} className="relative -top-5">
                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    navigate(item.path!);
                  }}
                  className="flex items-center justify-center w-[56px] h-[56px] bg-[#0D3D33] text-white rounded-full shadow-[0_4px_12px_rgba(13,61,51,0.30)] hover:scale-105 transition-transform"
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
                <Icon className={cn("h-[22px] w-[22px]", isActive ? "text-[#0D3D33]" : "text-[#888888]")} />
                <span className={cn("text-[11px] font-bold", isActive ? "text-[#0D3D33]" : "text-[#555555]")}>{item.name}</span>
                {isActive && <div className="w-[4px] h-[4px] bg-[#0D3D33] rounded-full mt-0.5"></div>}
                {!isActive && <div className="w-[4px] h-[4px] bg-transparent rounded-full mt-0.5"></div>}
              </button>
            );
          }

          const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path!));

          return (
            <Link
              key={item.name}
              to={item.path!}
              onClick={() => setIsMoreOpen(false)}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 pt-1"
            >
              <Icon className={cn("h-[22px] w-[22px]", isActive ? "text-[#0D3D33]" : "text-[#888888]")} />
              <span className={cn("text-[11px] font-bold", isActive ? "text-[#0D3D33]" : "text-[#555555]")}>{item.name}</span>
              {isActive && <div className="w-[4px] h-[4px] bg-[#0D3D33] rounded-full mt-0.5"></div>}
              {!isActive && <div className="w-[4px] h-[4px] bg-transparent rounded-full mt-0.5"></div>}
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
              className="absolute inset-0 bg-[#0D3D33]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-sm bg-white rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden relative z-50 mb-[64px]"
            >
              <div className="p-4 flex items-center justify-between border-b border-[#E2DDD6]">
                <span className="font-bold text-[#111111] text-lg">More Options</span>
                <button 
                  onClick={() => setIsMoreOpen(false)}
                  className="p-2 rounded-full bg-[#F7F5F0] text-[#555555]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 flex flex-col gap-2 relative">
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
                          ? "bg-[#0D3D33]/5 text-[#0D3D33] font-bold border border-[#0D3D33]/20" 
                          : "text-[#111111] font-bold border border-transparent hover:bg-[#F7F5F0]"
                      )}
                    >
                      <div className={cn("p-2 rounded-xl", isActive ? "bg-[#0D3D33] text-white shadow-sm" : "text-[#555555] bg-[#F7F5F0] border border-[#E2DDD6]")}>
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
