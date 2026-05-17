import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, DollarSign, Package, UserX, UserCheck, Star, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export default function AdminStats() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
    blockedUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    signupsToday: 0,
    signupsThisWeek: 0,
    signupsThisMonth: 0,
    prevWeekSignups: 0,
  });

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const usersUnsub = onSnapshot(collection(db, 'users'), (snap) => {
      let premium = 0;
      let free = 0;
      let blocked = 0;
      let today = 0;
      let week = 0;
      let month = 0;
      let prevWeek = 0;
      
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const oneWeekAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = now.getTime() - (14 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      if (snap && snap.forEach) {
        snap.forEach(doc => {
          const data = doc.data();
          if (data) {
            if (data.isBlocked) blocked++;
            
            const plan = data.plan?.toLowerCase() || data.subscriptionPlan?.toLowerCase() || 'free';
            if (plan === 'premium' || plan === 'enterprise') {
              premium++;
            } else {
              free++;
            }
            
            if (data.createdAt) {
              const createdAtMillis = typeof data.createdAt.toMillis === 'function' ? data.createdAt.toMillis() : new Date(data.createdAt).getTime();
              
              if (createdAtMillis >= startOfToday) today++;
              if (createdAtMillis >= oneWeekAgo) week++;
              if (createdAtMillis >= startOfMonth) month++;
              if (createdAtMillis >= twoWeeksAgo && createdAtMillis < oneWeekAgo) prevWeek++;
            }
          }
        });
      }
      
      setStats(prev => ({
        ...prev,
        totalUsers: snap?.size || 0,
        premiumUsers: premium,
        freeUsers: free,
        blockedUsers: blocked,
        signupsToday: today,
        signupsThisWeek: week,
        signupsThisMonth: month,
        prevWeekSignups: prevWeek
      }));
    }, (err) => console.error("AdminStats users error:", err));
    unsubs.push(usersUnsub);

    const ordersUnsub = onSnapshot(collection(db, 'orders'), (snap) => {
      setStats(prev => ({ ...prev, totalOrders: snap?.size || 0 }));
    }, (err) => console.error("AdminStats orders error:", err));
    unsubs.push(ordersUnsub);

    const subsUnsub = onSnapshot(collection(db, 'subscriptions'), (snap) => {
      let rev = 0;
      if (snap && snap.forEach) {
        snap.forEach(doc => {
          const data = doc.data();
          if (data && data.status === 'paid' && data.amount) {
            rev += Number(data.amount);
          }
        });
      }
      setStats(prev => ({ ...prev, totalRevenue: rev }));
    }, (err) => console.error("AdminStats subs error:", err));
    unsubs.push(subsUnsub);

    return () => {
      unsubs.forEach(fn => fn());
    };
  }, []);

  const handleCardClick = (filter: string) => {
    navigate(`/admin/users?filter=${filter}`);
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    colorClass, 
    bgClass, 
    filter, 
    trend,
    secondaryValue 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    colorClass: string; 
    bgClass: string; 
    filter?: string;
    trend?: number;
    secondaryValue?: string;
  }) => (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="cursor-pointer"
      onClick={() => filter && handleCardClick(filter)}
    >
      <Card className="border-none shadow-sm ring-1 ring-gray-100 bg-white hover:shadow-md transition-all duration-300 group">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-bold transition-transform group-hover:scale-110 duration-300", bgClass, colorClass)}>
              <Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            {trend !== undefined && (
              <div className={cn("flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full", trend >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
                {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          <div>
            <p className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl md:text-2xl font-black text-slate-900">{value}</h3>
              {secondaryValue && <span className="text-xs font-medium text-slate-400">{secondaryValue}</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <div className="space-y-8">
      {/* Primary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={Users} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
          filter="all"
        />
        <StatCard 
          title="Premium Users" 
          value={stats.premiumUsers} 
          icon={Star} 
          colorClass="text-amber-600" 
          bgClass="bg-amber-50" 
          filter="premium"
        />
        <StatCard 
          title="Free Users" 
          value={stats.freeUsers} 
          icon={Users} 
          colorClass="text-slate-600" 
          bgClass="bg-slate-50" 
          filter="free"
        />
        <StatCard 
          title="Blocked Users" 
          value={stats.blockedUsers} 
          icon={UserX} 
          colorClass="text-red-600" 
          bgClass="bg-red-50" 
          filter="blocked"
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders} 
          icon={Package} 
          colorClass="text-purple-600" 
          bgClass="bg-purple-50" 
        />
        <StatCard 
          title="Revenue" 
          value={`Rs. ${stats.totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          colorClass="text-green-600" 
          bgClass="bg-green-50" 
        />
      </div>

      {/* Signup Stats Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-bold text-slate-800">Signup Statistics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Signed up Today" 
            value={stats.signupsToday} 
            icon={UserCheck} 
            colorClass="text-emerald-600" 
            bgClass="bg-emerald-50" 
            filter="today"
          />
          <StatCard 
            title="Signed up This Week" 
            value={stats.signupsThisWeek} 
            icon={UserCheck} 
            colorClass="text-indigo-600" 
            bgClass="bg-indigo-50" 
            filter="week"
            trend={calculateTrend(stats.signupsThisWeek, stats.prevWeekSignups)}
          />
          <StatCard 
            title="Signed up This Month" 
            value={stats.signupsThisMonth} 
            icon={UserCheck} 
            colorClass="text-cyan-600" 
            bgClass="bg-cyan-50" 
            filter="month"
          />
        </div>
      </div>
    </div>
  );
}
