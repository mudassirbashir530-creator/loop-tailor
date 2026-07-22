import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Plus, Package, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/app' },
    { icon: Users, label: 'Clients', path: '/app/clients' },
    { icon: Plus, label: 'New Order', path: '/app/new-order', isCenter: true },
    { icon: MessageSquare, label: 'Chats', path: '/app/chat' },
    { icon: Package, label: 'Orders', path: '/app/orders' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#0D3D33]/10 z-50 lg:hidden pb-safe rounded-t-3xl shadow-[0_-8px_30px_rgba(13,61,51,0.08)]">
      <div className="flex items-center justify-around h-20 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/app' && location.pathname.startsWith(item.path));
            
          if (item.isCenter) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative -mt-10 flex flex-col items-center justify-center pointer-events-auto"
              >
                <div className="bg-[#0D3D33] text-white h-16 w-16 rounded-full flex items-center justify-center shadow-lg border-4 border-white hover:scale-105 transition-transform">
                  <item.icon className="h-7 w-7" />
                </div>
                <span className="text-[10px] font-bold mt-1 text-[#4A5568]">{item.label}</span>
              </NavLink>
            )
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
                isActive ? "text-[#0D3D33] font-bold" : "text-[#4A5568]/60 hover:text-[#0D3D33]"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive && "text-[#0D3D33]")} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
