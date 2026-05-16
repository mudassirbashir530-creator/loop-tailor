import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, DollarSign, Package, UserX, UserCheck, Star } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';

export default function AdminStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
    blockedUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    newSignupsThisWeek: 0,
  });

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const usersUnsub = onSnapshot(collection(db, 'users'), (snap) => {
      let premium = 0;
      let free = 0;
      let blocked = 0;
      let newSignups = 0;
      let rev = 0;
      
      const now = Date.now();
      const oneWeekMillis = 7 * 24 * 60 * 60 * 1000;

      snap.forEach(doc => {
        const data = doc.data();
        
        if (data.isBlocked) blocked++;
        
        if (data.plan?.toLowerCase() === 'premium' || data.plan?.toLowerCase() === 'enterprise') {
          premium++;
        } else {
          free++;
        }
        
        if (data.createdAt) {
          const createdAtMillis = typeof data.createdAt.toMillis === 'function' ? data.createdAt.toMillis() : new Date(data.createdAt).getTime();
          if (now - createdAtMillis < oneWeekMillis) {
            newSignups++;
          }
        }
      });
      
      setStats(prev => ({
        ...prev,
        totalUsers: snap.size,
        premiumUsers: premium,
        freeUsers: free,
        blockedUsers: blocked,
        newSignupsThisWeek: newSignups
      }));
    });
    unsubs.push(usersUnsub);

    const ordersUnsub = onSnapshot(collection(db, 'orders'), (snap) => {
      setStats(prev => ({ ...prev, totalOrders: snap.size }));
    });
    unsubs.push(ordersUnsub);

    const subsUnsub = onSnapshot(collection(db, 'subscriptions'), (snap) => {
      let rev = 0;
      snap.forEach(doc => {
        const data = doc.data();
        if (data.status === 'paid' && data.amount) {
          rev += Number(data.amount);
        }
      });
      setStats(prev => ({ ...prev, totalRevenue: rev }));
    });
    unsubs.push(subsUnsub);

    return () => {
      unsubs.forEach(fn => fn());
    };
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="border-none shadow-sm ring-1 ring-gray-100 bg-white">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-slate-500">Total Users</p>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900">{stats.totalUsers}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-gray-100 bg-white">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-yellow-100 flex items-center justify-center font-bold text-yellow-600">
              <Star className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-slate-500">Premium / Free</p>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900">{stats.premiumUsers} / {stats.freeUsers}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-gray-100 bg-white">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-600">
              <UserX className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-slate-500">Blocked Users</p>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900">{stats.blockedUsers}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-gray-100 bg-white">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#0D3D33]/10 flex items-center justify-center font-bold text-[#0D3D33]">
              <UserCheck className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-slate-500">New This Week</p>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900">{stats.newSignupsThisWeek}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-gray-100 bg-white">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600">
              <Package className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-slate-500">Total Orders</p>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900">{stats.totalOrders}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-gray-100 bg-white">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-600">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-slate-500">Total Revenue</p>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900">Rs. {stats.totalRevenue.toLocaleString()}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
