import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Plus, Package, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/app' },
    { icon: Users, label: 'Clients', path: '/app/clients' },
    { icon: Plus, label: 'New', path: '/app/new-order', isCenter: true },
    { icon: Package, label: 'Orders', path: '/app/orders' },
    { icon: Settings, label: 'Settings', path: '/app/settings' },
  ];

  return (
    <div className="fixed bottom-0 w-full bg-card border-t border-border z-40 md:hidden pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/app' && location.pathname.startsWith(item.path));
            
          if (item.isCenter) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative -mt-8 flex flex-col items-center justify-center pointer-events-auto"
              >
                <div className="bg-accent text-white h-14 w-14 rounded-full flex items-center justify-center shadow-lg border-4 border-background">
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-medium mt-1 text-muted-foreground">{item.label}</span>
              </NavLink>
            )
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
                isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
