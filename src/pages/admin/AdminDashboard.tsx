import React from 'react';
import AdminStats from '../../components/admin/AdminStats';
import PaymentsTab from '../../components/admin/PaymentsTab';
import ActivityLog from '../../components/admin/ActivityLog';

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-black tracking-tight text-slate-900 mb-2">Admin Dashboard</h1>
        <p className="text-slate-500">Monitor overall platform statistics and recent activities.</p>
      </div>

      {/* Stats Overview */}
      <AdminStats />

      {/* Two Column Layout for Payments & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <PaymentsTab />
        </div>
        <div>
          <ActivityLog />
        </div>
      </div>
    </div>
  );
}

