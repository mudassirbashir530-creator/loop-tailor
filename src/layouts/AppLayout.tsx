import React, { useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Package, Settings, Plus, Scissors, UserCircle, MessageSquare, FileText, Eye, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../hooks/useOrders';
import { cn } from '../lib/utils';
import BottomNav from '../components/BottomNav';
import DesktopSidebar from '../components/DesktopSidebar';
import { PWAPrompt } from '../components/PWAPrompt';
import { useShop } from '../contexts/ShopContext';
import { WhatsAppIcon } from '../components/icons/WhatsAppIcon';
import { Button } from '../components/ui/button';

const getValidLogoUrl = (logo: any): string | null => {
  if (!logo) return null;
  if (typeof logo === 'string' && logo.trim().length > 0) return logo.trim();
  if (typeof logo === 'object') {
    if (logo.url && typeof logo.url === 'string') return logo.url.trim();
    if (logo.secure_url && typeof logo.secure_url === 'string') return logo.secure_url.trim();
  }
  return null;
};

export default function AppLayout() {
  const { user, userData, impersonatedUser, stopImpersonation } = useAuth();
  const { settings } = useShop();
  const { orders } = useOrders();
  const location = useLocation();
  const navigate = useNavigate();

  const shopLogoUrl = getValidLogoUrl(userData?.shopLogo) || 
                      getValidLogoUrl(userData?.logoUrl) || 
                      getValidLogoUrl(settings?.shopLogo) || 
                      getValidLogoUrl(settings?.logoUrl);

  const shopDisplayName = settings?.name || userData?.shopName || userData?.shopDetails?.name || 'Loop Tailor';

  // App Badge Notification Sync
  useEffect(() => {
    if ('setAppBadge' in navigator) {
      const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'stitching').length;
      if (pendingCount > 0) {
        (navigator as any).setAppBadge(pendingCount).catch((e: any) => console.warn('Badge error:', e));
      } else {
        (navigator as any).clearAppBadge().catch((e: any) => console.warn('Badge error:', e));
      }
    }
  }, [orders]);

  // Clear badge on initial load
  useEffect(() => {
    if ('clearAppBadge' in navigator) {
      (navigator as any).clearAppBadge().catch((e: any) => console.warn('Badge clear error:', e));
    }
  }, []);

  if (userData?.isBlocked && !impersonatedUser) {
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
    { icon: WhatsAppIcon, label: 'Chats', path: '/app/chat' },
    { icon: UserCircle, label: 'Workers', path: '/app/workers' },
    { icon: FileText, label: 'Payroll', path: '/app/payroll' },
    { icon: Package, label: 'Orders', path: '/app/orders' },
    { icon: Plus, label: 'New Order', path: '/app/new-order' },
    { icon: Settings, label: 'Settings', path: '/app/settings' },
  ];

  const handleReturnToAdmin = () => {
    stopImpersonation();
    navigate('/admin/users');
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans flex flex-col lg:flex-row max-w-full overflow-x-hidden">
      {/* Desktop Floating Glassmorphism Capsule Sidebar */}
      <DesktopSidebar navItems={navItems} user={user} userData={userData} />

      {/* Mobile Top Header — Premium Glassmorphism */}
      <div className="lg:hidden sticky top-0 z-40 px-3 pt-2">
        <div className="bg-[#0D3D33]/95 backdrop-blur-xl rounded-2xl shadow-lg border border-emerald-500/15 px-4 h-14 flex items-center justify-between min-w-0 w-full">
          <div className="flex items-center gap-2.5 min-w-0">
            {shopLogoUrl ? (
              <img 
                src={shopLogoUrl} 
                alt="Shop Logo" 
                className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 object-contain p-0.5 shrink-0 shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 text-[#2ECC71] flex items-center justify-center shrink-0 shadow-sm">
                <Scissors className="h-4.5 w-4.5 text-[#2ECC71]" strokeWidth={2} />
              </div>
            )}
            <div className="min-w-0">
              <span className="font-extrabold text-base tracking-tight text-white block truncate leading-tight">{shopDisplayName}</span>
              <span className="text-[8px] font-black tracking-widest text-[#2ECC71] uppercase block">BOUTIQUE OS</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <NavLink 
              to="/app/workers" 
              className={({ isActive }) => cn(
                "p-2 rounded-xl transition-all duration-200",
                isActive ? "bg-[#2ECC71]/20 text-[#2ECC71]" : "text-white/50 hover:bg-white/10 hover:text-white"
              )}
              aria-label="Worker Assign"
            >
               <UserCircle className="w-5 h-5" strokeWidth={1.8} />
            </NavLink>
            <NavLink 
              to="/app/settings" 
              className="p-0.5 rounded-xl transition-all duration-200 hover:bg-white/10"
              aria-label="Profile Settings"
            >
               {userData?.profileImage ? (
                 <img src={userData.profileImage} alt="Profile" className="w-8 h-8 rounded-xl border-2 border-[#2ECC71]/40 shadow-sm object-cover" />
               ) : (
                 <div className="w-8 h-8 rounded-xl bg-[#2ECC71] flex items-center justify-center text-slate-950 font-black text-xs shadow-sm">
                   {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                 </div>
               )}
            </NavLink>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-28 lg:pb-0 overflow-y-auto w-full max-w-full min-w-0 mx-auto px-2 sm:px-4 md:px-6">
        {/* Impersonation Banner */}
        {impersonatedUser && (
          <div className="bg-amber-400 text-slate-950 px-4 py-3 border-b border-amber-500 shadow-md font-bold text-xs sm:text-sm flex flex-wrap items-center justify-between gap-2 mt-2 rounded-2xl">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 shrink-0" />
              <span>Viewing Live Account: <strong>{impersonatedUser.email}</strong> {impersonatedUser.shopName ? `(${impersonatedUser.shopName})` : ''}</span>
            </div>
            <Button 
              size="sm"
              onClick={handleReturnToAdmin} 
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Admin Panel
            </Button>
          </div>
        )}

        <Outlet />
      </main>

      <PWAPrompt />

      {/* Mobile Nav */}
      <BottomNav />
    </div>
  );
}
