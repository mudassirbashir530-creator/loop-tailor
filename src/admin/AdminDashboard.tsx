import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, ShieldAlert, Sparkles, UserX, Calendar, ArrowUpRight, ArrowDownRight, TrendingUp, Activity, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import ActivityLog from '../components/admin/ActivityLog';
import PaymentsTab from '../components/admin/PaymentsTab';

interface StatsState {
  total: number;
  free: number;
  basic: number;
  standard: number;
  premium: number;
  blocked: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  trendPercentage: number;
  trendIsPositive: boolean;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsState>({
    total: 0,
    free: 0,
    basic: 0,
    standard: 0,
    premium: 0,
    blocked: 0,
    todayCount: 0,
    weekCount: 0,
    monthCount: 0,
    trendPercentage: 0,
    trendIsPositive: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snap) => {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const oneWeekAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = now.getTime() - (14 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      let total = 0;
      let free = 0;
      let basic = 0;
      let standard = 0;
      let premium = 0;
      let blocked = 0;
      let todayCount = 0;
      let weekCount = 0;
      let monthCount = 0;

      // Stats for trend analysis
      let membersThisWeek = 0;
      let membersLastWeek = 0;

      snap.forEach((doc) => {
        const data = doc.data();
        total++;

        // Plan filtration
        const plan = (data.plan || 'free').toLowerCase();
        if (plan === 'premium' || plan === 'enterprise') {
          premium++;
        } else if (plan === 'standard') {
          standard++;
        } else if (plan === 'basic') {
          basic++;
        } else {
          free++;
        }

        // Status block count
        if (data.isBlocked === true) {
          blocked++;
        }

        // Date registration mapping
        if (data.createdAt) {
          const createdTime = typeof data.createdAt.toMillis === 'function' ? data.createdAt.toMillis() : new Date(data.createdAt).getTime();
          
          if (createdTime >= startOfToday) {
            todayCount++;
          }
          if (createdTime >= oneWeekAgo) {
            weekCount++;
            membersThisWeek++;
          } else if (createdTime >= twoWeeksAgo) {
            membersLastWeek++;
          }
          if (createdTime >= startOfMonth) {
            monthCount++;
          }
        }
      });

      // Calculate dynamic growth trend compared to previous week
      let trendPercentage = 0;
      let trendIsPositive = true;
      if (membersLastWeek === 0) {
        trendPercentage = membersThisWeek > 0 ? 100 : 0;
        trendIsPositive = true;
      } else {
        const change = membersThisWeek - membersLastWeek;
        trendPercentage = Math.round((Math.abs(change) / membersLastWeek) * 100);
        trendIsPositive = change >= 0;
      }

      setStats({
        total,
        free,
        basic,
        standard,
        premium,
        blocked,
        todayCount,
        weekCount,
        monthCount,
        trendPercentage,
        trendIsPositive,
      });
      setLoading(false);
    }, (err) => {
      console.error("Firestore user directory error: ", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const cards = [
    {
      title: 'Total Users',
      value: stats.total,
      description: 'Active boutique profiles',
      icon: Users,
      color: 'text-[#0D3D33] bg-[#0D3D33]/10 dark:text-[#2ECC71] dark:bg-[#2ECC71]/10',
      action: () => navigate('/admin/users'),
      trend: stats.trendPercentage ? `${stats.trendIsPositive ? '↑' : '↓'} ${stats.trendPercentage}% vs last week` : 'Subs are stable',
      trendPos: stats.trendIsPositive,
    },
    {
      title: 'Free Plan',
      value: stats.free,
      description: 'Rs. 0 subscription',
      icon: Sparkles,
      color: 'text-sky-600 bg-sky-50 dark:text-sky-350 dark:bg-sky-950/20',
      action: () => navigate('/admin/users?plan=free'),
    },
    {
      title: 'Basic Plan',
      value: stats.basic,
      description: 'Rs. 500 subscriptions',
      icon: Sparkles,
      color: 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800',
      action: () => navigate('/admin/users?plan=basic'),
    },
    {
      title: 'Standard Plan',
      value: stats.standard,
      description: 'Rs. 1,000 subscriptions',
      icon: Sparkles,
      color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-455 dark:bg-emerald-950/20',
      action: () => navigate('/admin/users?plan=standard'),
    },
    {
      title: 'Premium Plan',
      value: stats.premium,
      description: 'Rs. 2,000 elite users',
      icon: Sparkles,
      color: 'text-violet-600 bg-violet-50 dark:text-violet-350 dark:bg-violet-950/20',
      action: () => navigate('/admin/users?plan=premium'),
    },
    {
      title: 'Blocked Users',
      value: stats.blocked,
      description: 'Suspended profiles',
      icon: UserX,
      color: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/20',
      action: () => navigate('/admin/users?status=blocked'),
    },
    {
      title: 'New Today',
      value: stats.todayCount,
      description: 'Registered in past 24h',
      icon: Calendar,
      color: 'text-blue-600 bg-blue-50 dark:text-blue-350 dark:bg-blue-950/20',
      action: () => navigate('/admin/users?filter=today'),
    },
    {
      title: 'New This Week',
      value: stats.weekCount,
      description: 'Boutiques registered in 7d',
      icon: Calendar,
      color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20',
      action: () => navigate('/admin/users?filter=week'),
    },
    {
      title: 'New This Month',
      value: stats.monthCount,
      description: 'Joined since calendar start',
      icon: Calendar,
      color: 'text-[#2ECC71] bg-[#2ECC71]/10 dark:text-[#2ECC71] dark:bg-[#2ECC71]/15',
      action: () => navigate('/admin/users?filter=month'),
    },
  ];

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-300">
      
      {/* Greeting Segment */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Tailor Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Analyze licensing plans, registered owners and live shop performance directory.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
          <span className="text-sm font-semibold text-slate-500">Calculating analytics indexes...</span>
        </div>
      ) : (
        <>
          {/* Bento Stat Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, i) => (
              <Card 
                key={i} 
                onClick={card.action}
                className="relative bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest leading-none">
                      {card.title}
                    </span>
                    <div className={`p-2 rounded-2xl transition-colors ${card.color}`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-primary transition-colors">
                        {card.value}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                      {card.description}
                    </p>
                  </div>

                  {card.trend && (
                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold mt-2 pt-2 border-t dark:border-slate-805">
                      {card.trendPos ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                      )}
                      <span className={card.trendPos ? 'text-emerald-500' : 'text-rose-500'}>
                        {card.trend}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* TWO COLUMN GRID: ACTIVITY LOGS & PAYMENTS STATUS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Payments Log */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-800 dark:text-white pb-1">
                <CreditCard className="h-5 w-5 text-indigo-500" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Renewals & Payment Invoices
                </h2>
              </div>
              <PaymentsTab />
            </div>

            {/* Audit Log */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-800 dark:text-white pb-1">
                <Activity className="h-5 w-5 text-emerald-500 animate-pulse" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Recent Administrative Session Logs
                </h2>
              </div>
              <ActivityLog />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
