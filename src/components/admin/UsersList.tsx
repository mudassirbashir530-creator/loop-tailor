import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Search, X, Filter } from 'lucide-react';
import UserManageModal from './UserManageModal';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function UsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [shops, setShops] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const activeFilter = queryParams.get('filter') || 'all';

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
    }, (err) => {
      console.error("UsersList error:", err);
    });

    const shopsUnsub = onSnapshot(collection(db, 'shops'), (snap) => {
      const shopMap: Record<string, any> = {};
      snap.forEach(doc => {
        shopMap[doc.id] = doc.data();
      });
      setShops(shopMap);
    }, (err) => {
      console.error("Shops fetch error:", err);
    });

    return () => {
      unsub();
      shopsUnsub();
    };
  }, []);

  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = (
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (user.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    );

    if (!matchesSearch) return false;

    // Category filter
    const plan = user.plan?.toLowerCase() || user.subscriptionPlan?.toLowerCase() || 'free';
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneWeekAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    const createdAtMillis = user.createdAt ? (typeof user.createdAt.toMillis === 'function' ? user.createdAt.toMillis() : new Date(user.createdAt).getTime()) : 0;

    switch (activeFilter) {
      case 'premium':
        return plan === 'premium' || plan === 'enterprise';
      case 'free':
        return plan === 'free';
      case 'blocked':
        return user.isBlocked === true;
      case 'today':
        return createdAtMillis >= startOfToday;
      case 'week':
        return createdAtMillis >= oneWeekAgo;
      case 'month':
        return createdAtMillis >= startOfMonth;
      case 'all':
      default:
        return true;
    }
  });

  const clearFilter = () => {
    navigate('/admin/users');
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    const date = typeof dateValue.toDate === 'function' ? dateValue.toDate() : new Date(dateValue);
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'S';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Users Directory</h2>
            <p className="text-sm text-slate-500">Manage all registered shops and their access.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search shop, owner or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all outline-none"
            />
          </div>
        </div>

        <AnimatePresence>
          {activeFilter !== 'all' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex items-center gap-2"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#22C55E]/10 text-[#22C55E] rounded-full text-xs font-bold uppercase tracking-wider">
                <Filter className="w-3 h-3" />
                Showing: {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Users
                <button onClick={clearFilter} className="ml-1 hover:text-green-700 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <th className="py-4 px-6">Shop & Owner</th>
              <th className="py-4 px-6">Joined</th>
              <th className="py-4 px-6">Plan Info</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Search className="w-8 h-8 opacity-20" />
                      <p className="font-medium">No users found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.map(user => {
                const plan = user.plan?.toLowerCase() || user.subscriptionPlan?.toLowerCase() || 'free';
                let planDisplay = <span className="text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-lg text-[10px] border border-amber-200/50 uppercase tracking-wider font-display">Free</span>;
                if (plan === 'premium') planDisplay = <span className="text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-lg text-[10px] border border-blue-200/50 uppercase tracking-wider font-display">Premium</span>;
                else if (plan === 'enterprise') planDisplay = <span className="text-purple-600 font-bold bg-purple-50 px-2.5 py-1 rounded-lg text-[10px] border border-purple-200/50 uppercase tracking-wider font-display">Enterprise</span>;

                const statusDisplay = user.isBlocked ? (
                  <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">Blocked</span>
                ) : (
                  <span className="text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">Active</span>
                );

                const shopInfo = shops[user.id] || {};
                const shopLogo = shopInfo.logoUrl || user.shopLogo || user.photoURL;
                const shopName = shopInfo.name || user.shopName || user.name || user.displayName || 'Unnamed Shop';
                const ownerName = user.ownerName || user.name || 'Unknown Owner';

                return (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={user.id} 
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-black text-slate-400 overflow-hidden border border-slate-200 group-hover:scale-105 transition-transform duration-300 shrink-0">
                          {shopLogo ? (
                            <img src={shopLogo} alt="Shop" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            getInitials(shopName)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 group-hover:text-[#22C55E] transition-colors truncate">{shopName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-medium text-slate-500 truncate max-w-[100px]">{ownerName}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full shrink-0" />
                            <span className="text-[10px] font-medium text-slate-400 truncate">{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-slate-600 font-mono">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        {planDisplay}
                        {user.subscription?.expiryDate && (
                          <span className="text-[10px] font-bold text-slate-400 ml-1">EXP: {user.subscription.expiryDate}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {statusDisplay}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className="px-4 py-2 bg-slate-100 text-slate-900 hover:bg-[#22C55E] hover:text-white font-bold rounded-xl text-xs transition-all duration-300"
                      >
                        Manage
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <AnimatePresence>
          <UserManageModal user={selectedUser} onClose={() => setSelectedUser(null)} />
        </AnimatePresence>
      )}
    </div>
  );
}
