import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { Home, Users, Plus, Package, Settings, Scissors, UserCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function AppLayout() {
  const location = useLocation();
  const { user, userData } = useAuth();

  if (userData?.isBlocked) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border p-8 max-w-md text-center space-y-4 shadow-neu border-none">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Account Suspended</h1>
          <p className="text-slate-600">
            Your account has been suspended. Contact <a href="mailto:looptailor@gmail.com" className="text-brand-primary font-medium hover:underline">looptailor@gmail.com</a> or WhatsApp <a href="https://wa.me/923321379924" target="_blank" rel="noopener noreferrer" className="text-brand-primary font-medium hover:underline">03321379924</a>.
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/app' },
    { icon: Users, label: 'Clients', path: '/app/clients' },
    { icon: UserCircle, label: 'Workers', path: '/app/workers' },
    { icon: Package, label: 'Orders', path: '/app/orders' },
    { icon: Plus, label: 'New Order', path: '/app/new-order' },
    { icon: Settings, label: 'Settings', path: '/app/settings' },
  ];

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card min-h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 border-b">
          <div className="bg-primary text-white p-2 rounded-lg">
            <Scissors className="h-6 w-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">Loop Tailor</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/app' && location.pathname.startsWith(item.path));
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
             <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
               {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-semibold truncate">{user?.displayName || 'User'}</p>
               <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-0 overflow-y-auto w-full lg:max-w-none max-w-screen-xl mx-auto">
        <Outlet />
      </main>

      {/* Mobile Nav */}
      <BottomNav />
    </div>
  );
}
