import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Search } from 'lucide-react';
import UserManageModal from './UserManageModal';

export default function UsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
    });
    return () => unsub();
  }, []);

  const filteredUsers = users.filter(user => 
    (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    const date = typeof dateValue.toDate === 'function' ? dateValue.toDate() : new Date(dateValue);
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-lg font-bold text-slate-800">Users Directory</h2>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-sm text-slate-500">
              <th className="py-3 px-4 font-medium">User</th>
              <th className="py-3 px-4 font-medium">Phone</th>
              <th className="py-3 px-4 font-medium">Joined</th>
              <th className="py-3 px-4 font-medium">Plan</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No users yet.
                </td>
              </tr>
            ) : filteredUsers.map(user => {
              
              let planDisplay = <span className="text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded text-xs border border-amber-200">Free</span>;
              if (user.plan?.toLowerCase() === 'premium') planDisplay = <span className="text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded text-xs border border-blue-200">Premium</span>;
              else if (user.plan?.toLowerCase() === 'enterprise') planDisplay = <span className="text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded text-xs border border-purple-200">Enterprise</span>;

              const statusDisplay = user.isBlocked ? (
                <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-xs border border-red-200">Blocked</span>
              ) : (
                <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded text-xs border border-green-200">Active</span>
              );

              return (
              <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 overflow-hidden">
                      {user.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : (user.name || user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{user.name || user.displayName || 'Unnamed'}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm font-medium">{user.phone || 'N/A'}</td>
                <td className="py-3 px-4 text-sm text-slate-500">{formatDate(user.createdAt)}</td>
                <td className="py-3 px-4 text-sm">{planDisplay}<br/><span className="text-[10px] text-slate-400">{user.subscription?.expiryDate || ''}</span></td>
                <td className="py-3 px-4 text-sm">
                  {statusDisplay}
                </td>
                <td className="py-3 px-4 text-right">
                  <button 
                    onClick={() => setSelectedUser(user)}
                    className="px-3 py-1.5 bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 font-medium rounded-lg text-sm"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {selectedUser && <UserManageModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
}
