import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, FileText, Share2, Image as ImageIcon, Settings, LogOut, Users as UsersIcon } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, loading, logOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Articles', href: '/admin/articles', icon: FileText },
    { name: 'Social Posts', href: '/admin/social', icon: Share2 },
    { name: 'Media Library', href: '/admin/media', icon: ImageIcon },
    { name: 'Users', href: '/admin/users', icon: UsersIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 shadow-neu border-none flex flex-col z-10">
        <div className="h-16 flex items-center px-6 border-b border-gray-200/50">
          <span className="text-xl font-bold text-slate-800">Admin Panel</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border-none ${
                  isActive 
                    ? 'bg-gray-100 shadow-neu-pressed-sm text-brand-primary' 
                    : 'text-slate-500 hover:text-brand-primary hover:shadow-neu-sm'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200/50 space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-bold text-slate-500 hover:text-brand-primary hover:shadow-neu-sm transition-all border-none"
          >
            <LayoutDashboard className="w-5 h-5" />
            Back to App
          </Link>
          <button
            onClick={logOut}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-bold text-slate-500 hover:text-red-600 hover:shadow-neu-sm transition-all border-none"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
