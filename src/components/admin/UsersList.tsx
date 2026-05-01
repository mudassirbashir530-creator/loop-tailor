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
              <th className="py-3 px-4 font-medium">Plan</th>
              <th className="py-3 px-4 font-medium">Trial</th>
              <th className="py-3 px-4 font-medium">Payment</th>
              <th className="py-3 px-4 font-medium">Joined</th>
              <th className="py-3 px-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="py-3 px-4">
                  <p className="font-medium text-slate-900">{user.name || 'Unnamed'}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </td>
                <td className="py-3 px-4 text-sm font-medium">{user.plan || 'Basic'}</td>
                <td className="py-3 px-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${user.trialActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.trialActive ? 'Active' : 'Expired'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">
                  {user.paymentStatus === 'paid' ? (
                    <span className="text-green-600 font-medium">Paid</span>
                  ) : (
                    <span className="text-amber-600 font-medium">Pending</span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-slate-500">{formatDate(user.createdAt)}</td>
                <td className="py-3 px-4 text-right">
                  <button 
                    onClick={() => setSelectedUser(user)}
                    className="px-3 py-1.5 bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 font-medium rounded-lg text-sm"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && <UserManageModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
}
