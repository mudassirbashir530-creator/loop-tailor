import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAccess } from '../hooks/useAdminAccess';
import { useAuth } from '../contexts/AuthContext';
import AdminStats from '../components/admin/AdminStats';
import UsersList from '../components/admin/UsersList';
import PaymentsTab from '../components/admin/PaymentsTab';
import ActivityLog from '../components/admin/ActivityLog';
import { Scissors } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminPanel() {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdminAccess();
  const [activeTab, setActiveTab] = useState('users');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Scissors className="h-12 w-12 text-[#22C55E]" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white px-6 py-4 rounded-xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-[#0D3D33]">Super Admin</h1>
            <p className="text-sm text-slate-500">Manage all system operations</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {['users', 'payments', 'activity'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`capitalize whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === tab 
                    ? 'bg-[#22C55E] text-white shadow-md' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        <AdminStats />

        <main>
          {activeTab === 'users' && <UsersList />}
          {activeTab === 'payments' && <PaymentsTab />}
          {activeTab === 'activity' && <ActivityLog />}
        </main>
      </div>
    </div>
  );
}
