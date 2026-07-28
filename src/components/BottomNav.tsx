import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, Users, Plus, Package } from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { cn } from '../lib/utils';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/app' },
    { icon: Users, label: 'Clients', path: '/app/clients' },
    { icon: Plus, label: 'New Order', path: '/app/new-order', isCenter: true },
    { icon: WhatsAppIcon, label: 'Chats', path: '/app/chat' },
    { icon: Package, label: 'Orders', path: '/app/orders' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pb-safe px-3 pb-2">
      {/* Glassmorphism Capsule Container */}
      <div className="bg-[#0D3D33]/95 backdrop-blur-xl rounded-[28px] shadow-[0_-4px_40px_rgba(13,61,51,0.25)] border border-emerald-500/15 relative overflow-visible">
        {/* Ambient glow */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-[#2ECC71]/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-around h-[72px] px-1 relative">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/app' && location.pathname.startsWith(item.path));
              
            if (item.isCenter) {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="relative -mt-8 flex flex-col items-center justify-center pointer-events-auto z-10"
                >
                  <motion.div 
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "h-[60px] w-[60px] rounded-full flex items-center justify-center shadow-xl border-[3px] transition-all duration-300",
                      isActive
                        ? "bg-[#2ECC71] border-[#0D3D33] text-white shadow-[0_4px_20px_rgba(46,204,113,0.5)]"
                        : "bg-[#0D3D33] border-[#1a5c4a] text-white shadow-[0_4px_15px_rgba(13,61,51,0.4)]"
                    )}
                  >
                    <item.icon className="h-6 w-6" strokeWidth={2.5} />
                  </motion.div>
                  <span className={cn(
                    "text-[10px] font-extrabold mt-1 transition-colors duration-200",
                    isActive ? "text-[#2ECC71]" : "text-white/50"
                  )}>{item.label}</span>
                </NavLink>
              )
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center w-16 h-full gap-1 group"
              >
                {/* Active pill background */}
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="absolute top-2 left-1 right-1 bottom-2 bg-white/10 rounded-2xl border border-white/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="relative z-10 flex flex-col items-center gap-1"
                >
                  <item.icon 
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      isActive 
                        ? "text-[#2ECC71]" 
                        : "text-white/45 group-hover:text-white/70"
                    )} 
                    strokeWidth={isActive ? 2.5 : 1.8} 
                  />
                  <span className={cn(
                    "text-[10px] font-bold transition-colors duration-200",
                    isActive 
                      ? "text-white font-extrabold" 
                      : "text-white/40 group-hover:text-white/60"
                  )}>{item.label}</span>

                  {/* Active dot indicator */}
                  {isActive && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-1 h-1 rounded-full bg-[#2ECC71] absolute -bottom-1"
                    />
                  )}
                </motion.div>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}
