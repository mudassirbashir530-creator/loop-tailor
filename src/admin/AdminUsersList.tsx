import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, X, Filter, Settings, Ban, ShieldCheck, UserCheck, Calendar, RefreshCcw } from 'lucide-react';
import { useAdminUsers, AdminUser, UserFeatures } from '../hooks/useAdminUsers';
import UserManageModal from './UserManageModal';
import BlockUserModal from '../components/BlockUserModal';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'motion/react';

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
    resetUsageCounter,
    blockUser,
    unblockUser,
  } = useAdminUsers();

  const location = useLocation();
  const navigate = useNavigate();

  // Selected filters
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'basic' | 'standard' | 'premium'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Triggered modals
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [blockingUser, setBlockingUser] = useState<AdminUser | null>(null);

  // Sync state with URL Search Params (Coming from Stat Cards in Dashboard)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    // reset first
    setPlanFilter('all');
    setStatusFilter('all');
    setDateFilter('all');

    const planParam = params.get('plan');
    if (planParam && ['basic', 'standard', 'premium'].includes(planParam)) {
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

  // Handle clearing individual filters
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
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  // Run list filtration
  const filteredUsers = users.filter((u) => {
    // 1. Search term (shop name, owner name, owner email)
    const normalizedSearch = searchTerm.toLowerCase().trim();
    if (normalizedSearch) {
      const matches = 
        u.shopName?.toLowerCase().includes(normalizedSearch) ||
        u.ownerName?.toLowerCase().includes(normalizedSearch) ||
        u.email?.toLowerCase().includes(normalizedSearch);
      if (!matches) return false;
    }

    // 2. Plan filter
    if (planFilter !== 'all') {
      const activePlan = u.plan === 'enterprise' ? 'premium' : u.plan;
      if (activePlan !== planFilter) return false;
    }

    // 3. Status filter
    if (statusFilter !== 'all') {
      const userBlocked = u.isBlocked === true;
      if (statusFilter === 'blocked' && !userBlocked) return false;
      if (statusFilter === 'active' && userBlocked) return false;
    }

    // 4. Date filter (Join Date)
    if (dateFilter !== 'all') {
      if (!u.createdAt) return false;
      const joinTime = typeof u.createdAt.toMillis === 'function' ? u.createdAt.toMillis() : new Date(u.createdAt).getTime();
      const now = new Date();
      
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const oneWeekAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      if (dateFilter === 'today' && joinTime < startOfToday) return false;
      if (dateFilter === 'week' && joinTime < oneWeekAgo) return false;
      if (dateFilter === 'month' && joinTime < startOfMonth) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Users & Boutiques Directory
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Real-time shop configurations, subscriber limits, features permissions, and access logs.
          </p>
        </div>
      </div>

      {/* FILTER BUTTONS & CONTROLS BOX */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border dark:border-slate-800 space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-450" />
            <input
              type="text"
              placeholder="Search by shop/owner name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl text-sm font-semibold text-foreground placeholder:text-muted-foreground outline-none ring-primary/30 focus:ring-2 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => clearFilter('search')} 
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Plan Filter */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-850 rounded-xl border dark:border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 pl-2 pr-0.5">Plan:</span>
              <select
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value as any);
                  const params = new URLSearchParams(location.search);
                  if (e.target.value === 'all') params.delete('plan');
                  else params.set('plan', e.target.value);
                  navigate({ search: params.toString() });
                }}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 px-2 py-1 outline-none border-none cursor-pointer"
              >
                <option value="all">All Plans</option>
                <option value="basic">Basic (Rs. 500)</option>
                <option value="standard">Standard (Rs. 1,000)</option>
                <option value="premium">Premium (Rs. 2,000)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-850 rounded-xl border dark:border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 pl-2 pr-0.5">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  const params = new URLSearchParams(location.search);
                  if (e.target.value === 'all') params.delete('status');
                  else params.set('status', e.target.value);
                  navigate({ search: params.toString() });
                }}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 px-2 py-1 outline-none border-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-850 rounded-xl border dark:border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 pl-2 pr-0.5">Joined:</span>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value as any);
                  const params = new URLSearchParams(location.search);
                  if (e.target.value === 'all') params.delete('filter');
                  else params.set('filter', e.target.value);
                  navigate({ search: params.toString() });
                }}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 px-2 py-1 outline-none border-none cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* ACTIVE FILTER BADGES ROW */}
        {(planFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all' || searchTerm) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t dark:border-slate-805">
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-wider">Active Filters:</span>
            
            {planFilter !== 'all' && (
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
                Showing: {planFilter.charAt(0).toUpperCase() + planFilter.slice(1)} Users
                <button onClick={() => clearFilter('plan')} className="hover:text-primary-dark transition-colors">
                  <X className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            )}

            {statusFilter !== 'all' && (
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-destructive/10 text-destructive border border-destructive/20 rounded-full text-xs font-bold">
                Status: {statusFilter.toUpperCase()}
                <button onClick={() => clearFilter('status')} className="hover:text-red-700 transition-colors">
                  <X className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            )}

            {dateFilter !== 'all' && (
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold">
                Date: {dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)}
                <button onClick={() => clearFilter('date')} className="hover:text-amber-800 transition-colors">
                  <X className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            )}

            {searchTerm && (
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-500/10 text-indigo-700 dark:text-indigo-405 border border-indigo-500/20 rounded-full text-xs font-bold">
                Keyword: "{searchTerm.length > 15 ? searchTerm.slice(0, 15) + '...' : searchTerm}"
                <button onClick={() => clearFilter('search')} className="hover:text-indigo-900 transition-colors">
                  <X className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ERROR HANDLER */}
      {error && (
        <div className="p-4 bg-red-500/15 border border-red-500/30 text-destructive text-sm rounded-2xl flex items-center gap-3">
          <span>⚠️</span>
          <span>Error Syncing Users: {error}</span>
        </div>
      )}

      {/* USERS DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
            <span className="text-sm font-semibold text-slate-500">Retrieving Firestore directories...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="bg-slate-50 dark:bg-slate-850 text-slate-400 p-4 rounded-full mb-4">
              <RefreshCcw className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">No Users Match</h3>
            <p className="text-slate-500 text-xs font-medium max-w-sm mt-1">
              We couldn't find any registered subscriber records that fit your filter criteria. Try adjusting your categories.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-850/40 text-[11px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest border-b dark:border-slate-800">
                  <th className="py-4 px-6">Shop & Owner</th>
                  <th className="py-4 px-6">Plan Info</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Quota Usage</th>
                  <th className="py-4 px-6">Joined Date</th>
                  <th className="py-4 px-6 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800 text-sm">
                {filteredUsers.map((u) => {
                  const isBlocked = u.isBlocked === true;
                  const maxCust = u.planLimits?.customers ?? 50;
                  const formattedCust = maxCust === 0 ? '∞' : maxCust.toString();

                  return (
                    <tr 
                      key={u.id} 
                      className={`hover:bg-slate-50/40 dark:hover:bg-slate-850/25 transition-colors ${
                        isBlocked ? 'bg-red-500/[0.01]' : ''
                      }`}
                    >
                      {/* Shop Image and Details */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {isValidUrl(u.logoUrl || u.photoURL) ? (
                            <img
                              src={u.logoUrl || u.photoURL || undefined}
                              alt={u.shopName}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/5"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                              {getInitials(u.shopName || u.ownerName)}
                            </div>
                          )}
                          <div className="space-y-0.5">
                            <p className="font-extrabold text-slate-900 dark:text-white tracking-tight">
                              {u.shopName || 'Bespoke Boutique'}
                            </p>
                            <p className="text-xs text-slate-500 font-semibold">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Plan subscription info */}
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getPlanBadgeClass(u.plan)}`}>
                          {u.plan}
                        </span>
                      </td>

                      {/* Current Status Badge */}
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

                      {/* Quota limit progress */}
                      <td className="py-4 px-6 font-mono text-xs">
                        <div className="space-y-1">
                          <p className="font-extrabold text-[#0D3D33] dark:text-[#2ECC71]">
                            {u.currentUsage?.customers ?? 0}/{formattedCust} <span className="text-[10px] text-slate-400 font-sans">clients</span>
                          </p>
                          <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#0D3D33] dark:bg-[#2ECC71] rounded-full" 
                              style={{ width: `${maxCust === 0 ? 100 : Math.min(100, ((u.currentUsage?.customers ?? 0) / maxCust) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Joined and activity timing */}
                      <td className="py-4 px-6 text-slate-500 font-semibold text-xs">
                        <p>{formatDate(u.createdAt)}</p>
                        {u.lastActiveAt && (
                          <p className="text-[10px] opacity-70">Active {formatDate(u.lastActiveAt)}</p>
                        )}
                      </td>

                      {/* Quick Actions Buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 py-0 px-2.5 rounded-lg text-xs font-extrabold flex items-center gap-1"
                            onClick={() => setSelectedUser(u)}
                          >
                            <Settings className="w-3.5 h-3.5" />
                            Manage
                          </Button>

                          {isBlocked ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 py-0 px-2.5 rounded-lg border-emerald-500 hover:bg-emerald-50 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1"
                              onClick={() => unblockUser(u.id)}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Unblock
                            </Button>
                          ) : (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8 py-0 px-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1"
                              onClick={() => setBlockingUser(u)}
                            >
                              <Ban className="w-3.5 h-3.5" />
                              Block
                            </Button>
                          )}
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

      {/* CONDITIONAL MANAGE MODAL */}
      <AnimatePresence>
        {selectedUser && (
          <UserManageModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onPlanChange={changeUserPlan}
            onFeatureToggle={toggleUserFeature}
            onSaveLimit={saveOrderLimit}
            onResetUsage={resetUsageCounter}
            onBlockUser={async (userId, reason, note) => {
              await blockUser(userId, reason, note);
              setSelectedUser(null);
            }}
            onUnblockUser={async (userId) => {
              await unblockUser(userId);
              setSelectedUser((prev) => prev ? { ...prev, isBlocked: false, blockedBy: '', blockedReason: '', blockedAt: null } : null);
            }}
          />
        )}
      </AnimatePresence>

      {/* QUICK BLOCK MODAL FROM ROW */}
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
