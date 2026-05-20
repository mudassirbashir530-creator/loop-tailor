import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, Check, AlertTriangle, Play, RefreshCw, Layers, Sliders, BarChart3, AlertOctagon, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { AdminUser, UserFeatures, PLAN_CONFIGS } from '../hooks/useAdminUsers';
import BlockUserModal from '../components/BlockUserModal';

interface UserManageModalProps {
  user: AdminUser;
  onClose: () => void;
  onPlanChange: (userId: string, planName: 'basic' | 'standard' | 'premium') => Promise<void>;
  onFeatureToggle: (userId: string, featureName: keyof UserFeatures, value: boolean) => Promise<void>;
  onSaveLimit: (userId: string, limit: number) => Promise<void>;
  onResetUsage: (userId: string) => Promise<void>;
  onBlockUser: (userId: string, reason: string, note?: string) => Promise<void>;
  onUnblockUser: (userId: string) => Promise<void>;
}

export default function UserManageModal({
  user,
  onClose,
  onPlanChange,
  onFeatureToggle,
  onSaveLimit,
  onResetUsage,
  onBlockUser,
  onUnblockUser,
}: UserManageModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'standard' | 'premium'>(
    user.plan === 'enterprise' ? 'premium' : (user.plan as any) || 'basic'
  );
  
  const [orderLimitInput, setOrderLimitInput] = useState<string>(
    user.planLimits?.ordersPerMonth?.toString() ?? '60'
  );

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isUnblockConfirmOpen, setIsUnblockConfirmOpen] = useState(false);

  // Keep state sync'd if user updates in background
  useEffect(() => {
    setSelectedPlan(user.plan === 'enterprise' ? 'premium' : (user.plan as any) || 'basic');
    setOrderLimitInput(user.planLimits?.ordersPerMonth?.toString() ?? '60');
  }, [user]);

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    const date = typeof dateValue.toDate === 'function' ? dateValue.toDate() : new Date(dateValue);
    return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Helper for text-only progress bars (e.g. "████░░")
  const getBlockBarText = (current: number, max: number, totalSpots = 10) => {
    if (max === 0) return '▓'.repeat(totalSpots) + ' (Unlimited)';
    const filled = Math.min(totalSpots, Math.max(0, Math.round((current / max) * totalSpots)));
    const empty = Math.max(0, totalSpots - filled);
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  const handlePlanDropdownChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as 'basic' | 'standard' | 'premium';
    setSelectedPlan(val);
    await onPlanChange(user.id, val);
  };

  const handleSaveLimitClick = async () => {
    const valObj = parseInt(orderLimitInput, 10);
    if (isNaN(valObj) || valObj < 0) {
      toast.error("Please enter a valid non-negative order limit");
      return;
    }
    await onSaveLimit(user.id, valObj);
  };

  const handleResetCounterClick = async () => {
    if (window.confirm(`Are you sure you want to reset current order usage for ${user.shopName || user.email}?`)) {
      await onResetUsage(user.id);
    }
  };

  const handleConfirmUnblock = async () => {
    await onUnblockUser(user.id);
    setIsUnblockConfirmOpen(false);
  };

  const limits = user.planLimits || { customers: 50, ordersPerMonth: 60, workers: 3 };
  const usage = user.currentUsage || { customers: 0, ordersThisMonth: 0, workers: 0, lastResetDate: null };
  const features = user.features || {
    canDownloadInvoice: false,
    canUploadImages: false,
    canUseWhatsApp: false,
    canUsePayroll: false,
    canViewAnalytics: false,
    canCustomBranding: false,
    canManageWorkers: true,
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl h-[90vh] md:h-[85vh] flex flex-col shadow-2xl border dark:border-slate-800 overflow-hidden z-10 font-sans"
      >
        {/* Header */}
        <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-2.5 rounded-2xl">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Manage Shop Profile</h2>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{user.shopName || 'Bespoke Studio'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 divide-y dark:divide-slate-800">
          
          {/* SECTION A — USER INFO */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> SECTION A — USER INFO
            </h3>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border dark:border-slate-800">
              {user.logoUrl || user.photoURL ? (
                <img
                  src={user.logoUrl || user.photoURL}
                  alt={user.shopName}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-primary/10"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-black text-xl tracking-tight uppercase">
                  {getInitials(user.shopName || user.ownerName)}
                </div>
              )}
              <div className="flex-1 text-center sm:text-left space-y-1">
                <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {user.shopName || 'No Shop Registered'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs font-semibold text-slate-655 dark:text-slate-350">
                  <p>Owner: <span className="text-foreground">{user.ownerName || 'N/A'}</span></p>
                  <p>Email: <span className="text-foreground">{user.email}</span></p>
                  <p>Phone: <span className="text-foreground">{user.phone || 'N/A'}</span></p>
                  <p>Status: <span className={user.isBlocked ? 'text-destructive font-bold' : 'text-emerald-500 font-bold'}>{user.isBlocked ? '🛡️ Blocked' : '● Active'}</span></p>
                  <p>Joined: <span className="text-slate-500">{formatDate(user.createdAt)}</span></p>
                  <p>Last Active: <span className="text-slate-500">{formatDate(user.lastActiveAt)}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION B — PLAN MANAGEMENT */}
          <div className="pt-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> SECTION B — PLAN MANAGEMENT
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-semibold">Active Plan Subscription</p>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    user.plan === 'premium' || user.plan === 'enterprise'
                      ? 'bg-primary/20 text-primary'
                      : user.plan === 'standard'
                      ? 'bg-emerald-500/25 text-emerald-600 dark:text-emerald-450'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {user.plan} plan
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    Rs. {user.planPrice}/month
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Update Subscription Plan
                </label>
                <select
                  value={selectedPlan}
                  onChange={handlePlanDropdownChange}
                  className="w-full text-foreground bg-slate-55 dark:bg-slate-850 border dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                >
                  <option value="basic">Basic — Rs. 500/month (50 customers, 60 orders, 3 workers)</option>
                  <option value="standard">Standard — Rs. 1,000/month (200 customers, 200 orders, 7 workers)</option>
                  <option value="premium">Premium — Rs. 2,000/month (Unlimited everything)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION C — USAGE STATS */}
          <div className="pt-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> SECTION C — USAGE STATS & METRICS
            </h3>
            <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 text-xs font-mono">
              {/* Customers Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Customers Allocation:</span>
                  <span>{usage.customers}/{limits.customers === 0 ? 'Unlimited' : limits.customers}</span>
                </div>
                <div className="text-primary text-[10px] tracking-tight">{getBlockBarText(usage.customers, limits.customers)}</div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500" 
                    style={{ width: `${limits.customers === 0 ? 100 : Math.min(100, (usage.customers / limits.customers) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Orders Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Monthly Orders Usage:</span>
                  <span>{usage.ordersThisMonth}/{limits.ordersPerMonth === 0 ? 'Unlimited' : limits.ordersPerMonth}</span>
                </div>
                <div className="text-primary text-[10px] tracking-tight">{getBlockBarText(usage.ordersThisMonth, limits.ordersPerMonth)}</div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                    style={{ width: `${limits.ordersPerMonth === 0 ? 100 : Math.min(100, (usage.ordersThisMonth / limits.ordersPerMonth) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Workers Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Workers Roster:</span>
                  <span>{usage.workers}/{limits.workers === 0 ? 'Unlimited' : limits.workers}</span>
                </div>
                <div className="text-primary text-[10px] tracking-tight">{getBlockBarText(usage.workers, limits.workers)}</div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${limits.workers === 0 ? 100 : Math.min(100, (usage.workers / limits.workers) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION D — FEATURE CONTROLS */}
          <div className="pt-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> SECTION D — CUSTOM FEATURE CONTROLS
            </h3>
            <p className="text-[11px] text-muted-foreground font-semibold">Toggling features overrides default plan configurations directly. Saved instantly.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="flex items-center justify-between p-3 rounded-xl border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div>
                  <p className="text-xs font-bold">WhatsApp Integration</p>
                  <p className="text-[10px] text-muted-foreground">Alerts & messages</p>
                </div>
                <input
                  type="checkbox"
                  checked={features.canUseWhatsApp}
                  onChange={(e) => onFeatureToggle(user.id, 'canUseWhatsApp', e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-5 w-5 cursor-pointer accent-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div>
                  <p className="text-xs font-bold">Invoice Download</p>
                  <p className="text-[10px] text-muted-foreground">PDF invoice download</p>
                </div>
                <input
                  type="checkbox"
                  checked={features.canDownloadInvoice}
                  onChange={(e) => onFeatureToggle(user.id, 'canDownloadInvoice', e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-5 w-5 cursor-pointer accent-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div>
                  <p className="text-xs font-bold">Image Upload</p>
                  <p className="text-[10px] text-muted-foreground">Attach order reference designs</p>
                </div>
                <input
                  type="checkbox"
                  checked={features.canUploadImages}
                  onChange={(e) => onFeatureToggle(user.id, 'canUploadImages', e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-5 w-5 cursor-pointer accent-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div>
                  <p className="text-xs font-bold">Payroll Access</p>
                  <p className="text-[10px] text-muted-foreground">Staff salary tracking</p>
                </div>
                <input
                  type="checkbox"
                  checked={features.canUsePayroll}
                  onChange={(e) => onFeatureToggle(user.id, 'canUsePayroll', e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-5 w-5 cursor-pointer accent-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div>
                  <p className="text-xs font-bold">Analytics Access</p>
                  <p className="text-[10px] text-muted-foreground">Boutique dashboards & counters</p>
                </div>
                <input
                  type="checkbox"
                  checked={features.canViewAnalytics}
                  onChange={(e) => onFeatureToggle(user.id, 'canViewAnalytics', e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-5 w-5 cursor-pointer accent-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div>
                  <p className="text-xs font-bold">Custom Branding</p>
                  <p className="text-[10px] text-muted-foreground">White label invoice logs</p>
                </div>
                <input
                  type="checkbox"
                  checked={features.canCustomBranding}
                  onChange={(e) => onFeatureToggle(user.id, 'canCustomBranding', e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-5 w-5 cursor-pointer accent-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div>
                  <p className="text-xs font-bold">Worker Management</p>
                  <p className="text-[10px] text-muted-foreground">Assign tailored items & items</p>
                </div>
                <input
                  type="checkbox"
                  checked={features.canManageWorkers}
                  onChange={(e) => onFeatureToggle(user.id, 'canManageWorkers', e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-5 w-5 cursor-pointer accent-primary"
                />
              </div>

            </div>
          </div>

          {/* SECTION E — ORDER LIMIT */}
          <div className="pt-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> SECTION E — MONTHLY ORDER LIMITS & RESETS
            </h3>
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-300">Custom Monthly Order Limit</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Enter order limits below. Set to <strong className="text-foreground">0</strong> for unlimited order access. Current usage: <span className="text-indigo-600 dark:text-indigo-350 font-bold">{usage.ordersThisMonth}</span> used.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  value={orderLimitInput}
                  onChange={(e) => setOrderLimitInput(e.target.value)}
                  className="w-24 px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl text-center text-sm font-mono font-bold outline-none ring-primary/40 focus:ring-2 focus:border-transparent transition-all"
                  placeholder="60"
                  min="0"
                />
                <Button 
                  size="sm" 
                  onClick={handleSaveLimitClick}
                  className="text-xs font-extrabold text-[#eddcdc]"
                >
                  Save Limit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleResetCounterClick}
                  className="text-xs font-bold gap-1"
                >
                  <RefreshCw className="h-3 w-3 animate-spin duration-300" />
                  Reset Counter
                </Button>
              </div>
            </div>
          </div>

          {/* SECTION F — DANGER ZONE */}
          <div className="pt-6 space-y-4">
            <h3 className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-widest flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-destructive" /> SECTION F — DANGER ZONE
            </h3>
            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-300">Restrict / Release Shop Status</p>
                {user.isBlocked ? (
                  <p className="text-[10px] text-destructive font-black leading-snug uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded w-fit">
                    Reason: {user.blockedReason}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Blocking immediately revokes shop access and kicks the operator out.
                  </p>
                )}
              </div>
              <div>
                {user.isBlocked ? (
                  <Button
                    variant="outline"
                    className="border-emerald-500 hover:bg-emerald-50 text-emerald-600 dark:text-emerald-450 text-xs font-bold px-5"
                    onClick={() => setIsUnblockConfirmOpen(true)}
                  >
                    🔓 Unblock User
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    className="bg-red-650 hover:bg-red-750 text-xs font-bold px-5"
                    onClick={() => setIsBlockModalOpen(true)}
                  >
                    🔒 Block User
                  </Button>
                )}
              </div>
            </div>
          </div>

        </div>
      </motion.div>

      {/* BLOCK CONFIRM DIALOG */}
      <BlockUserModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        userName={user.shopName || user.ownerName || user.email}
        onConfirm={(reason, note) => onBlockUser(user.id, reason, note)}
      />

      {/* UNBLOCK CONFIRM DIALOG */}
      <AnimatePresence>
        {isUnblockConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUnblockConfirmOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm border border-emerald-500/20 shadow-2xl z-10"
            >
              <div className="flex items-center gap-2 text-emerald-500 mb-3">
                <ShieldAlert className="h-5 w-5" />
                <h4 className="font-bold text-lg">Unblock User Account</h4>
              </div>
              <p className="text-xs text-slate-500 font-semibold mb-6">
                Are you sure you want to unblock <strong className="text-foreground">{user.shopName || user.email}</strong>? They will be able to log back in immediately.
              </p>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl text-xs" 
                  onClick={() => setIsUnblockConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold" 
                  onClick={handleConfirmUnblock}
                >
                  Confirm Unblock
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
