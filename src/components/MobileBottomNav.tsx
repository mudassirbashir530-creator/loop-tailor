import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Plus, FileText, Scissors } from 'lucide-react';
import { cn } from '../lib/utils';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Clients', path: '/dashboard/customers', icon: Users },
    { name: 'New', path: '/dashboard/orders/new', icon: Plus, isAction: true },
    { name: 'Orders', path: '/dashboard/orders', icon: Scissors },
    { name: 'Invoices', path: '/dashboard/invoices', icon: FileText },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-200 z-50 flex items-center justify-around px-2 pb-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

        if (item.isAction) {
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className="w-14 h-14 rounded-full bg-brand-primary flex items-center justify-center text-white -mt-8 shadow-lg shadow-brand-primary/30 border-4 border-white"
            >
              <Icon className="h-7 w-7" />
            </button>
          );
        }

        return (
          <Link
            key={item.name}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 p-2 transition-colors",
              isActive ? "text-brand-primary" : "text-slate-400"
            )}
          >
            <Icon className="h-6 w-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
