import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Users, 
  Package, 
  Settings, 
  Plus, 
  Scissors, 
  UserCircle, 
  MessageSquare, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useShop } from '../contexts/ShopContext';

interface NavItem {
  icon: any;
  label: string;
  path: string;
  badge?: string | number;
}

interface DesktopSidebarProps {
  navItems: NavItem[];
  user: any;
  userData: any;
}

const getValidLogoUrl = (logo: any): string | null => {
  if (!logo) return null;
  if (typeof logo === 'string' && logo.trim().length > 0) return logo.trim();
  if (typeof logo === 'object') {
    if (logo.url && typeof logo.url === 'string') return logo.url.trim();
    if (logo.secure_url && typeof logo.secure_url === 'string') return logo.secure_url.trim();
  }
  return null;
};

export default function DesktopSidebar({ navItems, user, userData }: DesktopSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const location = useLocation();
  const { settings } = useShop();

  const shopLogoUrl = getValidLogoUrl(userData?.shopLogo) || 
                      getValidLogoUrl(userData?.logoUrl) || 
                      getValidLogoUrl(settings?.shopLogo) || 
                      getValidLogoUrl(settings?.logoUrl);

  const shopDisplayName = settings?.name || userData?.shopName || userData?.shopDetails?.name || 'Loop Tailor';

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <aside className="hidden lg:block p-4 sticky top-0 h-screen shrink-0 z-30 select-none">
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 84 : 260 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="h-[calc(100vh-32px)] bg-[#0D3D33] text-white rounded-[32px] p-4 flex flex-col justify-between shadow-2xl border border-emerald-500/20 relative overflow-hidden backdrop-blur-xl"
      >
        {/* Ambient Glow Background Element */}
        <div className="absolute -top-16 -left-16 w-44 h-44 bg-[#2ECC71]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-[#2ECC71]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Toggle Arrow (Pinned Top) */}
        <div className={cn(
          "flex items-center pb-4 border-b border-white/10 pt-1 transition-all shrink-0",
          isCollapsed ? "justify-center flex-col gap-2" : "justify-between px-1"
        )}>
          <div className="flex items-center gap-3 min-w-0">
            <motion.div 
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-[#2ECC71] flex items-center justify-center font-black shadow-md shrink-0 cursor-pointer overflow-hidden p-0.5"
              onClick={toggleCollapse}
            >
              {shopLogoUrl ? (
                <img 
                  src={shopLogoUrl} 
                  alt="Shop Logo" 
                  className="w-full h-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Scissors className="w-5 h-5 text-[#2ECC71]" strokeWidth={2} />
              )}
            </motion.div>

            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden min-w-0"
                >
                  <span className="font-extrabold text-base tracking-tight text-white block truncate">
                    {shopDisplayName}
                  </span>
                  <span className="text-[9px] font-black tracking-widest text-[#2ECC71] uppercase block">
                    BOUTIQUE OS
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Collapse Toggle Arrow Button */}
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleCollapse}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer shrink-0 shadow-sm"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </motion.button>
        </div>

        {/* Middle Scrollable Navigation List */}
        <div className="flex-1 my-3 overflow-y-auto hide-scrollbar min-h-0">
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/app' && location.pathname.startsWith(item.path));

              return (
                <div 
                  key={item.path} 
                  className="relative"
                  onMouseEnter={() => setHoveredPath(item.path)}
                  onMouseLeave={() => setHoveredPath(null)}
                >
                  <NavLink
                    to={item.path}
                    className={cn(
                      "relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 font-bold text-sm min-w-0 group",
                      isActive
                        ? "bg-white text-[#0D3D33] shadow-lg shadow-black/10 font-extrabold"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <item.icon 
                      className={cn(
                        "w-4.5 h-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                        isActive ? "text-[#0D3D33]" : "text-white/80"
                      )} 
                    />

                    <AnimatePresence mode="wait">
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.15 }}
                          className="truncate flex-1 text-xs sm:text-sm"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Active Accent Indicator Bar */}
                    {isActive && !isCollapsed && (
                      <motion.div 
                        layoutId="activeSidePill"
                        className="w-1.5 h-4.5 bg-[#2ECC71] rounded-full shrink-0" 
                      />
                    )}
                  </NavLink>

                  {/* Pop-up Tooltip on Collapsed View */}
                  {isCollapsed && hoveredPath === item.path && (
                    <motion.div
                      initial={{ opacity: 0, x: 10, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 10, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-2xl z-50 whitespace-nowrap border border-slate-700 pointer-events-none flex items-center gap-1.5"
                    >
                      <span>{item.label}</span>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Profile Pinned Bottom Footer */}
        <div className="pt-3 border-t border-white/10 shrink-0">
          <div className={cn(
            "flex items-center gap-2.5 p-2 rounded-2xl bg-white/5 border border-white/10 transition-all",
            isCollapsed ? "justify-center" : "justify-between"
          )}>
            <div className="flex items-center gap-2.5 min-w-0">
              {userData?.profileImage ? (
                <img 
                  src={userData.profileImage} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border-2 border-[#2ECC71] object-cover shrink-0 shadow-sm" 
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#2ECC71] text-slate-950 font-black flex items-center justify-center text-xs shrink-0 shadow-sm">
                  {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              {!isCollapsed && (
                <div className="overflow-hidden min-w-0">
                  <p className="text-xs font-extrabold text-white truncate leading-tight">
                    {user?.displayName || user?.email?.split('@')[0] || 'Tailor Shop'}
                  </p>
                  <p className="text-[9px] text-[#2ECC71] font-bold truncate mt-0.5 uppercase">
                    {userData?.plan ? `${userData.plan} PLAN` : 'FREE PLAN'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </aside>
  );
}
