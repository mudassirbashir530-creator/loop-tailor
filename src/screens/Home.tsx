import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, CheckCircle, Banknote, Loader2, Users, Package, Scissors, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { useOrders } from '../hooks/useOrders';
import { formatCurrency } from '../lib/utils';
import { isToday, subDays, format } from 'date-fns';
import { motion, Variants } from 'motion/react';

import { useCustomers } from '../hooks/useCustomers';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { usePlanLimits } from '../hooks/usePlanLimits';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const safeNum = (val: any) => Number(val) || 0;

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
}

function StatCard({ title, value, icon, iconBg }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${iconBg} shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { orders, loading } = useOrders();
  const { customers } = useCustomers();
  const { canViewAnalytics } = useFeatureAccess();
  const { plan, limits, usage } = usePlanLimits();

  const {
    totalOrders,
    pendingOrders,
    revenue,
    completedToday
  } = useMemo(() => {
    if (!orders) return { totalOrders: 0, pendingOrders: 0, revenue: 0, completedToday: 0 };
    
    let pendingCount = 0;
    let rev = 0;
    let todayCount = 0;

    orders.forEach(order => {
      if (!order) return;

      if (order.status !== 'delivered' && order.status !== 'cancelled') {
         pendingCount++;
      }

      if (order.status === 'delivered') {
        const orderRevenue = safeNum(order.price);
        rev += orderRevenue;

        if (order.updatedAt) {
          try {
            const parsedDate = new Date(order.updatedAt);
            if (!isNaN(parsedDate.getTime()) && isToday(parsedDate)) {
              todayCount++;
            }
          } catch (e) {
            console.warn("Invalid date on order updatedAt field:", e);
          }
        }
      }
    });

    return {
      totalOrders: orders.length,
      pendingOrders: pendingCount,
      revenue: rev,
      completedToday: todayCount
    };
  }, [orders]);

  if (loading) {
     return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants} 
      className="p-4 md:p-8 space-y-8 pb-24"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back! Here's your shop overview</p>
      </motion.div>

      {/* Stats Grid */}
      {canViewAnalytics ? (
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Orders"
            value={totalOrders.toString()}
            icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
            iconBg="bg-blue-100"
          />
          <StatCard 
            title="Pending"
            value={pendingOrders.toString()}
            icon={<Clock className="h-5 w-5 text-orange-600" />}
            iconBg="bg-orange-100"
          />
          <StatCard 
            title="Completed Today"
            value={completedToday.toString()}
            icon={<CheckCircle className="h-5 w-5 text-green-600" />}
            iconBg="bg-green-100"
          />
          <StatCard 
            title="Total Revenue"
            value={formatCurrency(revenue)}
            icon={<Banknote className="h-5 w-5 text-emerald-600" />}
            iconBg="bg-emerald-100"
          />
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 max-w-2xl">
          <StatCard 
            title="Total Orders"
            value={totalOrders.toString()}
            icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
            iconBg="bg-blue-100"
          />
          <StatCard 
            title="Total Customers"
            value={customers.length.toString()}
            icon={<Users className="h-5 w-5 text-emerald-600" />}
            iconBg="bg-emerald-100"
          />
        </motion.div>
      )}

      {/* Plan Usage Visual Progress Summary */}
      <motion.div variants={itemVariants}>
        <Card className="hover:shadow-md transition-shadow duration-300 border border-slate-200/80 rounded-3xl overflow-hidden">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b pb-4 flex-wrap gap-3">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">ACCOUNT SUBSCRIPTION LIMITS</span>
                <h3 className="text-xl font-black text-[#0D3D33] dark:text-emerald-400 capitalize">{plan} Plan Active</h3>
              </div>
              <Link 
                to="/app/upgrade" 
                className="text-xs font-bold text-white bg-[#0D3D33] hover:bg-[#092B24] px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1 shrink-0"
              >
                Upgrade Plan →
              </Link>
            </div>

            {/* Visual Progress Bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {/* Customers Progress */}
              {(() => {
                const max = limits.customers;
                const curr = usage.customers;
                const isUnlimited = max === 0;
                const pct = isUnlimited ? 100 : Math.min(100, Math.round((curr / max) * 100));
                const isFull = !isUnlimited && curr >= max;
                const isNearFull = !isUnlimited && pct >= 80 && !isFull;

                return (
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600">
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Customers</span>
                      </div>
                      <span className={`text-xs font-extrabold ${isFull ? 'text-rose-600' : isNearFull ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                        {curr} / {isUnlimited ? '∞' : max}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFull ? 'bg-rose-500' : isNearFull ? 'bg-amber-500' : 'bg-gradient-to-r from-[#0D3D33] to-[#2ECC71]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 pt-0.5">
                        <span>{isUnlimited ? 'Unlimited' : `${pct}% used`}</span>
                        {isFull && <span className="text-rose-600">Limit Full</span>}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Orders Progress */}
              {(() => {
                const max = limits.ordersPerMonth;
                const curr = usage.ordersThisMonth;
                const isUnlimited = max === 0;
                const pct = isUnlimited ? 100 : Math.min(100, Math.round((curr / max) * 100));
                const isFull = !isUnlimited && curr >= max;
                const isNearFull = !isUnlimited && pct >= 80 && !isFull;

                return (
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Orders (Monthly)</span>
                      </div>
                      <span className={`text-xs font-extrabold ${isFull ? 'text-rose-600' : isNearFull ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                        {curr} / {isUnlimited ? '∞' : max}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFull ? 'bg-rose-500' : isNearFull ? 'bg-amber-500' : 'bg-gradient-to-r from-[#0D3D33] to-[#2ECC71]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 pt-0.5">
                        <span>{isUnlimited ? 'Unlimited' : `${pct}% used`}</span>
                        {isFull && <span className="text-rose-600">Limit Full</span>}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Workers Progress */}
              {(() => {
                const max = limits.workers;
                const curr = usage.workers;
                const isUnlimited = max === 0;
                const pct = isUnlimited ? 100 : Math.min(100, Math.round((curr / max) * 100));
                const isFull = !isUnlimited && curr >= max;
                const isNearFull = !isUnlimited && pct >= 80 && !isFull;

                return (
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600">
                          <Scissors className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Workers / Staff</span>
                      </div>
                      <span className={`text-xs font-extrabold ${isFull ? 'text-rose-600' : isNearFull ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                        {curr} / {isUnlimited ? '∞' : max}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFull ? 'bg-rose-500' : isNearFull ? 'bg-amber-500' : 'bg-gradient-to-r from-[#0D3D33] to-[#2ECC71]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 pt-0.5">
                        <span>{isUnlimited ? 'Unlimited' : `${pct}% used`}</span>
                        {isFull && <span className="text-rose-600">Limit Full</span>}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Limit Warning Banners */}
            {(() => {
              const warnings: React.ReactNode[] = [];
              const checkLimit = (type: string, current: number, max: number) => {
                if (max <= 0) return;
                const ratio = current / max;
                if (ratio >= 1) {
                  warnings.push(
                    <div key={`${type}-max`} className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-2xl mt-3">
                      <div>
                        <p className="text-sm font-black text-rose-600 flex items-center gap-2 mb-0.5">
                          <ShieldAlert className="w-4 h-4" /> Limit Reached
                        </p>
                        <p className="text-xs text-rose-700 font-bold capitalize">
                          {type}: {current}/{max} — Upgrade your plan to add more.
                        </p>
                      </div>
                      <Link to="/app/upgrade" className="text-xs font-bold bg-rose-600 text-white px-3.5 py-2 rounded-xl shadow-xs shrink-0">
                        Upgrade Plan
                      </Link>
                    </div>
                  );
                }
              };

              checkLimit('Customers', usage.customers, limits.customers);
              checkLimit('Orders', usage.ordersThisMonth, limits.ordersPerMonth);
              checkLimit('Workers', usage.workers, limits.workers);

              return warnings.length > 0 ? <div className="pt-2">{warnings}</div> : null;
            })()}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
