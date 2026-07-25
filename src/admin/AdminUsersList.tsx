import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, X, Filter, Settings, Ban, ShieldCheck, UserCheck, Calendar, RefreshCcw, Key } from 'lucide-react';
import { useAdminUsers, AdminUser } from '../hooks/useAdminUsers';
import UserManageModal from './UserManageModal';
import BlockUserModal from '../components/BlockUserModal';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const isValidUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  return url.startsWith('https://') || url.startsWith('http://');
};

export default function AdminUsersList() {
  const {
    users,
    loading,
    error,
    changeUserPlan,
    toggleUserFeature,
    saveOrderLimit,
    saveCustomerLimit,
    saveWorkerLimit,
    resetUsageCounter,
    blockUser,
    unblockUser,
    deleteUserAccount
  } = useAdminUsers();

  const { impersonateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'basic' | 'standard' | 'premium'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [blockingUser, setBlockingUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setPlanFilter('all');
    setStatusFilter('all');
    setDateFilter('all');

    const planParam = params.get('plan');
    if (planParam && ['free', 'basic', 'standard', 'premium'].includes(planParam)) {
      setPlanFilter(planParam as any);
    }

    const statusParam = params.get('status');
    if (statusParam && ['active', 'blocked'].includes(statusParam)) {
      setStatusFilter(statusParam as any);
    }

    const filterParam = params.get('filter');
    if (filterParam && ['today', 'week', 'month'].includes(filterParam)) {
      setDateFilter(filterParam as any);
    }
  }, [location.search]);

  const clearFilter = (type: 'plan' | 'status' | 'date' | 'search') => {
    const params = new URLSearchParams(location.search);
    if (type === 'plan') {
      setPlanFilter('all');
      params.delete('plan');
    } else if (type === 'status') {
      setStatusFilter('all');
      params.delete('status');
    } else if (type === 'date') {
      setDateFilter('all');
      params.delete('filter');
    } else if (type === 'search') {
      setSearchTerm('');
    }
    navigate({ search: params.toString() });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    const date = typeof dateValue.toDate === 'function' ? dateValue.toDate() : new Date(dateValue);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPlanBadgeClass = (plan?: string) => {
    switch (plan?.toLowerCase()) {
      case 'premium':
      case 'enterprise':
        return 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200 dark:border-violet-800';
      case 'standard':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'basic':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = user.ownerName?.toLowerCase().includes(term);
    const emailMatch = user.email?.toLowerCase().includes(term);
    const shopMatch = user.shopName?.toLowerCase().includes(term);
    const phoneMatch = user.phone?.includes(term);
    const matchesSearch = !searchTerm || nameMatch || emailMatch || shopMatch || phoneMatch;

    const matchesPlan = planFilter === 'all' || user.plan === planFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'blocked' ? user.isBlocked : !user.isBlocked);

    let matchesDate = true;
    if (dateFilter !== 'all' && user.createdAt) {
      const created = typeof user.createdAt.toDate === 'function' ? user.createdAt.toDate() : new Date(user.createdAt);
      const now = new Date();
      if (dateFilter === 'today') {
        matchesDate = created.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        matchesDate = created >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        matchesDate = created >= monthAgo;
      }
    }

    return matchesSearch && matchesPlan && matchesStatus && matchesDate;
  });

  const handleQuickImpersonate = (u: AdminUser) => {
    impersonateUser(u);
    toast.success(`Accessing ${u.email}'s account live!`);
    navigate('/app');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
            User & Shop Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Super admin controls: live access, real-time feature permissions, rate limits & blocking
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, shop or phone..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3D33]"
            />
            {searchTerm && (
              <button onClick={() => clearFilter('search')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No users match your criteria</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 text-xs font-bold uppercase tracking-wider border-b">
                  <th className="py-4 px-6">User & Shop</th>
                  <th className="py-4 px-6">Plan</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Usage</th>
                  <th className="py-4 px-6">Joined</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => {
                  const maxCust = u.planLimits?.customers ?? 10;
                  const formattedCust = maxCust === 0 ? '∞' : maxCust;
                  const isBlocked = u.isBlocked;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {isValidUrl(u.logoUrl || u.photoURL) ? (
                            <img
                              src={u.logoUrl || u.photoURL}
                              alt={u.ownerName || 'User'}
                              className="h-10 w-10 rounded-full object-cover border"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-[#0D3D33]/10 text-[#0D3D33] font-bold flex items-center justify-center text-sm">
                              {getInitials(u.ownerName || u.email)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">
                              {u.ownerName || 'Unnamed User'}
                            </p>
                            <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                            {u.shopName && <p className="text-xs text-[#0D3D33] dark:text-[#2ECC71] font-bold mt-0.5">🏪 {u.shopName}</p>}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className={`inline-block px-3 py-1 text-xs font-black rounded-full border capitalize ${getPlanBadgeClass(u.plan)}`}>
                          {u.plan}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold">
                            🔒 Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold">
                            ● Active
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 font-mono text-xs">
                        <div className="space-y-1">
                          <p className="font-extrabold text-[#0D3D33] dark:text-[#2ECC71]">
                            {u.currentUsage?.customers ?? 0}/{formattedCust} <span className="text-[10px] text-slate-400 font-sans">clients</span>
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-slate-500 font-semibold text-xs">
                        <p>{formatDate(u.createdAt)}</p>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 py-0 px-2.5 rounded-lg bg-[#0D3D33] hover:bg-[#092B24] text-white text-xs font-bold flex items-center gap-1"
                            onClick={() => handleQuickImpersonate(u)}
                            title="Directly access live user account"
                          >
                            <Key className="w-3.5 h-3.5" />
                            Access
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 py-0 px-2.5 rounded-lg text-xs font-extrabold flex items-center gap-1"
                            onClick={() => setSelectedUser(u)}
                          >
                            <Settings className="w-3.5 h-3.5" />
                            Manage
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedUser && (
          <UserManageModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onPlanChange={changeUserPlan}
            onFeatureToggle={toggleUserFeature}
            onSaveLimit={saveOrderLimit}
            onSaveCustomerLimit={saveCustomerLimit}
            onSaveWorkerLimit={saveWorkerLimit}
            onResetUsage={resetUsageCounter}
            onBlockUser={async (userId, reason, note) => {
              await blockUser(userId, reason, note);
              setSelectedUser(null);
            }}
            onUnblockUser={async (userId) => {
              await unblockUser(userId);
              setSelectedUser((prev) => prev ? { ...prev, isBlocked: false, blockedBy: '', blockedReason: '', blockedAt: null } : null);
            }}
            onDeleteUserAccount={deleteUserAccount}
          />
        )}
      </AnimatePresence>

      <BlockUserModal
        isOpen={blockingUser !== null}
        onClose={() => setBlockingUser(null)}
        userName={blockingUser ? (blockingUser.shopName || blockingUser.ownerName || blockingUser.email) : ''}
        onConfirm={(reason, note) => {
          if (blockingUser) {
            blockUser(blockingUser.id, reason, note);
          }
        }}
      />
    </div>
  );
}
