import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';

export default function AdminStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    activeTrials: 0,
    paidSubscribers: 0,
  });

  useEffect(() => {
    const usersUnsub = onSnapshot(collection(db, 'users'), (snap) => {
      let activeT = 0;
      let paid = 0;
      let rev = 0;
      const amounts: Record<string, number> = { 
        basic: 500, 
        standard: 1000, 
        premium: 2000 
      };

      snap.forEach(doc => {
        const data = doc.data();
        
        if (data.paymentStatus === 'paid') {
           paid++;
           if (data.plan && typeof data.plan === 'string') {
               rev += (amounts[data.plan.toLowerCase()] || 0);
           }
        }
        
        if (data.trialStartDate) {
           const thirtyDays = 30 * 24 * 60 * 60 * 1000;
           const trialStartMillis = typeof data.trialStartDate.toMillis === 'function' 
              ? data.trialStartDate.toMillis() 
              : new Date(data.trialStartDate).getTime();
              
           if (Date.now() < trialStartMillis + thirtyDays) {
               activeT++;
           }
        }
      });
      
      setStats(prev => ({
        ...prev,
        totalUsers: snap.size,
        activeTrials: activeT,
        paidSubscribers: paid,
        totalRevenue: rev
      }));
    });

    return () => {
      usersUnsub();
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="border-none shadow-sm ring-1 ring-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Users</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.totalUsers}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Revenue</p>
              <h3 className="text-2xl font-bold text-slate-900">Rs. {stats.totalRevenue.toLocaleString()}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Trials Active</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.activeTrials} users</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#0D3D33]/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-[#0D3D33]" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Paid Subscribers</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.paidSubscribers} users</h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
