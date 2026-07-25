import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, Check, AlertTriangle, RefreshCw, Key, Trash2, ShieldCheck, UserCheck, Sliders, AlertOctagon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { AdminUser, UserFeatures } from '../hooks/useAdminUsers';
import BlockUserModal from '../components/BlockUserModal';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UserManageModalProps {
  user: AdminUser;
  onClose: () => void;
  onPlanChange: (userId: string, planName: 'free' | 'basic' | 'standard' | 'premium') => Promise<void>;
  onFeatureToggle: (userId: string, featureName: keyof UserFeatures, value: boolean) => Promise<void>;
  onSaveLimit: (userId: string, limit: number) => Promise<void>;
  onSaveCustomerLimit?: (userId: string, limit: number) => Promise<void>;
  onSaveWorkerLimit?: (userId: string, limit: number) => Promise<void>;
  onResetUsage: (userId: string) => Promise<void>;
  onBlockUser: (userId: string, reason: string, note?: string) => Promise<void>;
  onUnblockUser: (userId: string) => Promise<void>;
  onDeleteUserAccount?: (userId: string) => Promise<void>;
}

export default function UserManageModal({
  user,
  onClose,
  onPlanChange,
  onFeatureToggle,
  onSaveLimit,
  onSaveCustomerLimit,
  onSaveWorkerLimit,
  onResetUsage,
  onBlockUser,
  onUnblockUser,
  onDeleteUserAccount
}: UserManageModalProps) {
  const { impersonateUser } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<AdminUser>(user);
  const [loadingFresh, setLoadingFresh] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState<'free' | 'basic' | 'standard' | 'premium'>(
    user.plan === 'enterprise' ? 'premium' : (user.plan as any) || 'free'
  );
  
  const [orderLimitInput, setOrderLimitInput] = useState<string>(user.planLimits?.ordersPerMonth?.toString() ?? '15');
  const [customerLimitInput, setCustomerLimitInput] = useState<string>(user.planLimits?.customers?.toString() ?? '10');
  const [workerLimitInput, setWorkerLimitInput] = useState<string>(user.planLimits?.workers?.toString() ?? '1');

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [localFeatures, setLocalFeatures] = useState<UserFeatures>({
    canDownloadInvoice: !!user.features?.canDownloadInvoice,
    canUploadImages: !!user.features?.canUploadImages,
    canUseWhatsApp: !!user.features?.canUseWhatsApp,
    canUsePayroll: !!user.features?.canUsePayroll,
    canViewAnalytics: !!user.features?.canViewAnalytics,
    canCustomBranding: !!user.features?.canCustomBranding,
    canManageWorkers: !!user.features?.canManageWorkers,
  });

  useEffect(() => {
    let active = true;
    const fetchFreshData = async () => {
      try {
        const userRef = doc(db, 'users', user.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && active) {
          const fresh = { id: userSnap.id, ...userSnap.data() } as AdminUser;
          setUserData(fresh);
          setSelectedPlan(fresh.plan === 'enterprise' ? 'premium' : (fresh.plan as any) || 'free');
          setOrderLimitInput(fresh.planLimits?.ordersPerMonth?.toString() ?? '15');
          setCustomerLimitInput(fresh.planLimits?.customers?.toString() ?? '10');
          setWorkerLimitInput(fresh.planLimits?.workers?.toString() ?? '1');
          if (fresh.features) {
            setLocalFeatures({
              canDownloadInvoice: !!fresh.features.canDownloadInvoice,
              canUploadImages: !!fresh.features.canUploadImages,
              canUseWhatsApp: !!fresh.features.canUseWhatsApp,
              canUsePayroll: !!fresh.features.canUsePayroll,
              canViewAnalytics: !!fresh.features.canViewAnalytics,
              canCustomBranding: !!fresh.features.canCustomBranding,
              canManageWorkers: !!fresh.features.canManageWorkers,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching fresh user data inside modal:", err);
      } finally {
        if (active) setLoadingFresh(false);
      }
    };
    fetchFreshData();
    return () => { active = false; };
  }, [user.id]);

  const handleToggle = async (featureName: keyof UserFeatures) => {
    const val = !localFeatures[featureName];
    setLocalFeatures(prev => ({ ...prev, [featureName]: val }));
    await onFeatureToggle(userData.id, featureName, val);
  };

  const handleImpersonate = () => {
    impersonateUser(userData);
    toast.success(`Accessing ${userData.email}'s account live!`);
    onClose();
    navigate('/app');
  };

  const handleDelete = async () => {
    if (onDeleteUserAccount) {
      await onDeleteUserAccount(userData.id);
      setIsDeleteConfirmOpen(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Top Bar Header */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#0D3D33]/10 text-[#0D3D33] font-bold flex items-center justify-center text-lg">
                {(userData.ownerName || userData.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {userData.ownerName || 'User Account'}
                  {userData.isBlocked && (
                    <span className="px-2 py-0.5 text-xs font-black bg-rose-500 text-white rounded-full">BLOCKED</span>
                  )}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{userData.email}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Super Admin Actions Bar */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">🔑 Super Admin One-Click Access</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">View and manage live shop dashboard without email/password</p>
            </div>
            <Button 
              onClick={handleImpersonate} 
              className="bg-[#0D3D33] hover:bg-[#092B24] text-white rounded-xl font-bold gap-2"
            >
              <Key className="w-4 h-4" /> Direct Access Account
            </Button>
          </div>

          {/* Plan Selector */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Subscription Plan</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['free', 'basic', 'standard', 'premium'] as const).map((planKey) => (
                <button
                  key={planKey}
                  type="button"
                  onClick={async () => {
                    setSelectedPlan(planKey);
                    await onPlanChange(userData.id, planKey);
                  }}
                  className={`p-3 rounded-xl border text-center font-bold text-sm capitalize transition-all ${
                    selectedPlan === planKey 
                      ? 'bg-[#0D3D33] text-white border-[#0D3D33] shadow-md' 
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {planKey}
                </button>
              ))}
            </div>
          </div>

          {/* Instant Rate Limits / Quotas */}
          <div className="space-y-3 border-t pt-4">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" /> Custom Quotas & Limits (0 = Unlimited)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border">
                <span className="text-xs text-slate-500 font-bold block mb-1">Orders / Month</span>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={orderLimitInput} 
                    onChange={e => setOrderLimitInput(e.target.value)} 
                    className="w-full p-2 text-sm border rounded-lg bg-white font-bold" 
                  />
                  <Button size="sm" onClick={() => onSaveLimit(userData.id, Number(orderLimitInput))}>Save</Button>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border">
                <span className="text-xs text-slate-500 font-bold block mb-1">Max Customers</span>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={customerLimitInput} 
                    onChange={e => setCustomerLimitInput(e.target.value)} 
                    className="w-full p-2 text-sm border rounded-lg bg-white font-bold" 
                  />
                  <Button size="sm" onClick={() => onSaveCustomerLimit && onSaveCustomerLimit(userData.id, Number(customerLimitInput))}>Save</Button>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border">
                <span className="text-xs text-slate-500 font-bold block mb-1">Max Workers</span>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={workerLimitInput} 
                    onChange={e => setWorkerLimitInput(e.target.value)} 
                    className="w-full p-2 text-sm border rounded-lg bg-white font-bold" 
                  />
                  <Button size="sm" onClick={() => onSaveWorkerLimit && onSaveWorkerLimit(userData.id, Number(workerLimitInput))}>Save</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="space-y-3 border-t pt-4">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Feature Access Permissions</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'canManageWorkers', label: '👥 Manage Staff & Workers' },
                { key: 'canDownloadInvoice', label: '📄 Printable Invoices' },
                { key: 'canUseWhatsApp', label: '💬 WhatsApp Notifications' },
                { key: 'canUsePayroll', label: '💰 Staff Payroll System' },
                { key: 'canViewAnalytics', label: '📊 Business Analytics' },
                { key: 'canCustomBranding', label: '✨ Custom Branding' },
              ].map(item => (
                <div 
                  key={item.key} 
                  onClick={() => handleToggle(item.key as any)}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="text-sm font-medium text-slate-800">{item.label}</span>
                  <input 
                    type="checkbox" 
                    checked={!!(localFeatures as any)[item.key]} 
                    readOnly
                    className="h-5 w-5 accent-[#0D3D33] cursor-pointer" 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone: Block / Delete */}
          <div className="border-t pt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              {userData.isBlocked ? (
                <Button 
                  variant="outline" 
                  onClick={() => onUnblockUser(userData.id)}
                  className="border-emerald-500 text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold"
                >
                  <UserCheck className="w-4 h-4 mr-2" /> Unblock Account
                </Button>
              ) : (
                <Button 
                  variant="destructive" 
                  onClick={() => setIsBlockModalOpen(true)}
                  className="rounded-xl font-bold"
                >
                  <ShieldAlert className="w-4 h-4 mr-2" /> Block User Account
                </Button>
              )}
            </div>

            <Button 
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="border-rose-300 text-rose-600 hover:bg-rose-50 rounded-xl font-bold"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete User Permanently
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Block User Modal */}
      {isBlockModalOpen && (
        <BlockUserModal 
          userName={userData.ownerName || userData.email}
          isOpen={isBlockModalOpen}
          onClose={() => setIsBlockModalOpen(false)}
          onConfirm={(reason, note) => {
            onBlockUser(userData.id, reason, note);
            setIsBlockModalOpen(false);
          }}
        />
      )}

      {/* Delete User Confirmation */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Delete Account Permanently?</h3>
            <p className="text-xs text-slate-500">This will delete user <strong>{userData.email}</strong> and their shop data completely. This action cannot be undone.</p>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={handleDelete}>Delete Account</Button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
