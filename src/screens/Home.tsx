import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Clock, CheckCircle, Banknote, Loader2, Users, Package, Scissors, ShieldAlert, Sparkles, BarChart2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { useOrders } from '../hooks/useOrders';
import { formatCurrency } from '../lib/utils';
import { isToday, subDays, format } from 'date-fns';
import { motion, Variants } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import { useCustomers } from '../hooks/useCustomers';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { PretextText, ShrinkWrapText, BalancedHeading } from '../components/ui/pretext';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const safeNum = (val: any) => Number(val) || 0;

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  linkTo?: string;
}

function StatCard({ title, value, icon, iconBg, linkTo }: StatCardProps) {
  const navigate = useNavigate();
  return (
    <Card 
      onClick={() => linkTo && navigate(linkTo)}
      className={`hover:shadow-lg transition-all duration-300 border border-slate-200/80 rounded-2xl sm:rounded-3xl ${linkTo ? 'cursor-pointer hover:border-[#0D3D33]/40 hover:-translate-y-0.5' : ''}`}
    >
      <CardContent className="p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
        <div className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl ${iconBg} shrink-0 shadow-xs`}>
          {icon}
        </div>
        <div className="min-w-0">
          <ShrinkWrapText text={title} font="bold 10px Inter" className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider truncate" />
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Radial Circular Gauge Component
function CircularProgress({ percentage, label, sublabel }: { percentage: number; label: string; sublabel: string }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-3 sm:gap-4 bg-[#0D3D33] text-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl border border-emerald-500/20 relative overflow-hidden">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-white/10"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-[#2ECC71] transition-all duration-1000 ease-out"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <span className="absolute font-black text-base sm:text-lg text-white">{percentage}%</span>
      </div>
      <div>
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#2ECC71] block">{label}</span>
        <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">{sublabel}</h4>
        <p className="text-[10px] sm:text-xs text-white/70 mt-1 font-medium">Real-time shop capacity score</p>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
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

  const chartData = useMemo(() => {
    if (!orders) return [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'MMM dd');
      const dayOrders = orders.filter(o => {
        if (!o || !o.createdAt) return false;
        try {
          const dateObj = typeof (o.createdAt as any)?.toDate === 'function' ? (o.createdAt as any).toDate() : new Date(o.createdAt);
          return dateObj.toDateString() === d.toDateString();
        } catch {
          return false;
        }
      });
      const dayRevenue = dayOrders.reduce((sum, order) => {
        if (order.status !== 'delivered') return sum;
        return sum + safeNum(order.price);
      }, 0);
      data.push({ name: dateStr, revenue: dayRevenue, orders: dayOrders.length });
    }
    return data;
  }, [orders]);

  // Capacity score calculation
  const overallCapacityPct = useMemo(() => {
    const custPct = limits.customers === 0 ? 10 : Math.min(100, (usage.customers / limits.customers) * 100);
    const ordPct = limits.ordersPerMonth === 0 ? 10 : Math.min(100, (usage.ordersThisMonth / limits.ordersPerMonth) * 100);
    const workPct = limits.workers === 0 ? 10 : Math.min(100, (usage.workers / limits.workers) * 100);
    return Math.round((custPct + ordPct + workPct) / 3);
  }, [limits, usage]);

  if (loading) {
     return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-[#0D3D33]" /></div>;
  }

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants} 
      className="p-3 sm:p-4 md:p-8 space-y-5 sm:space-y-8 pb-8"
    >
      {/* Top Banner & Shop Capacity Gauge */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
        <div className="lg:col-span-2 space-y-1 justify-center flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full bg-[#0D3D33]/10 text-[#0D3D33] font-black text-[10px] sm:text-xs uppercase tracking-widest">
              SMART TAILOR DASHBOARD
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold">• Real-time Sync Active</span>
          </div>
          <BalancedHeading text="Shop Overview" as="h1" className="text-xl sm:text-2xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white" />
          <PretextText
            text="Welcome back! Manage orders, clients, workers, and subscription limits."
            font="14px Inter"
            lineHeight={20}
            className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium"
          />
        </div>

        <CircularProgress 
          percentage={overallCapacityPct} 
          label="CAPACITY HEALTH" 
          sublabel={`${overallCapacityPct}% Quota Used`} 
        />
      </motion.div>

      {/* Stats Cards (Real-time Unlocked via Admin Permission or Plan) */}
      <motion.div variants={itemVariants}>
        {canViewAnalytics ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard 
              title="Total Orders"
              value={totalOrders.toString()}
              icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
              iconBg="bg-blue-100"
              linkTo="/app/orders"
            />
            <StatCard 
              title="Pending"
              value={pendingOrders.toString()}
              icon={<Clock className="h-5 w-5 text-orange-600" />}
              iconBg="bg-orange-100"
              linkTo="/app/orders"
            />
            <StatCard 
              title="Completed Today"
              value={completedToday.toString()}
              icon={<CheckCircle className="h-5 w-5 text-green-600" />}
              iconBg="bg-green-100"
              linkTo="/app/orders"
            />
            <StatCard 
              title="Total Revenue"
              value={formatCurrency(revenue)}
              icon={<Banknote className="h-5 w-5 text-[#0D3D33]" />}
              iconBg="bg-emerald-100"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-2xl">
            <StatCard 
              title="Total Orders"
              value={totalOrders.toString()}
              icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
              iconBg="bg-blue-100"
              linkTo="/app/orders"
            />
            <StatCard 
              title="Total Customers"
              value={customers.length.toString()}
              icon={<Users className="h-5 w-5 text-emerald-600" />}
              iconBg="bg-emerald-100"
              linkTo="/app/clients"
            />
          </div>
        )}
      </motion.div>

      {/* Interactive Revenue Chart (when Analytics enabled) */}
      {canViewAnalytics && (
        <motion.div variants={itemVariants}>
          <Card className="border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
            <CardContent className="p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">REVENUE & PERFORMANCE</span>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-[#0D3D33]" /> Weekly Revenue Analytics
                  </h3>
                </div>
              </div>

              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0D3D33', borderRadius: '16px', color: '#fff', border: 'none' }}
                      formatter={(val: any) => [`PKR ${Number(val).toLocaleString()}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="#0D3D33" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Modern Neon Visual Progress Bars */}
      <motion.div variants={itemVariants}>
        <Card className="border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <CardContent className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between border-b pb-4 flex-wrap gap-3">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">SUBSCRIPTION QUOTA PROGRESS</span>
                <h3 className="text-xl font-black text-[#0D3D33] dark:text-emerald-400 capitalize">{plan} Plan Active</h3>
              </div>
              <Link 
                to="/app/upgrade" 
                className="text-xs font-bold text-white bg-[#0D3D33] hover:bg-[#092B24] px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1 shrink-0"
              >
                Upgrade Plan →
              </Link>
            </div>

            {/* Visual Progress Cards with Click Navigation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 pt-2">
              {/* Customers Progress */}
              {(() => {
                const max = limits.customers;
                const curr = usage.customers;
                const isUnlimited = max === 0;
                const pct = isUnlimited ? 100 : Math.min(100, Math.round((curr / max) * 100));
                const isFull = !isUnlimited && curr >= max;
                const isNearFull = !isUnlimited && pct >= 80 && !isFull;

                return (
                  <div 
                    onClick={() => navigate('/app/clients')}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl space-y-3 cursor-pointer hover:border-[#0D3D33]/40 hover:bg-slate-100/60 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-blue-100 text-blue-600 font-bold">
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-[#0D3D33]">Customers</span>
                      </div>
                      <span className={`text-xs font-black ${isFull ? 'text-rose-600' : isNearFull ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                        {curr} / {isUnlimited ? '∞' : max}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="h-3 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                            isFull ? 'bg-rose-500' : isNearFull ? 'bg-amber-500' : 'bg-gradient-to-r from-[#0D3D33] via-[#2ECC71] to-[#2ECC71]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-extrabold text-slate-400 pt-0.5">
                        <span>{isUnlimited ? 'Unlimited' : `${pct}% used`}</span>
                        <span className="flex items-center gap-0.5 text-[#0D3D33] group-hover:underline">
                          Manage <ArrowRight className="w-3 h-3" />
                        </span>
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
                  <div 
                    onClick={() => navigate('/app/orders')}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl space-y-3 cursor-pointer hover:border-[#0D3D33]/40 hover:bg-slate-100/60 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 font-bold">
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-[#0D3D33]">Orders (Monthly)</span>
                      </div>
                      <span className={`text-xs font-black ${isFull ? 'text-rose-600' : isNearFull ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                        {curr} / {isUnlimited ? '∞' : max}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="h-3 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                            isFull ? 'bg-rose-500' : isNearFull ? 'bg-amber-500' : 'bg-gradient-to-r from-[#0D3D33] via-[#2ECC71] to-[#2ECC71]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-extrabold text-slate-400 pt-0.5">
                        <span>{isUnlimited ? 'Unlimited' : `${pct}% used`}</span>
                        <span className="flex items-center gap-0.5 text-[#0D3D33] group-hover:underline">
                          View Orders <ArrowRight className="w-3 h-3" />
                        </span>
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
                  <div 
                    onClick={() => navigate('/app/workers')}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl space-y-3 cursor-pointer hover:border-[#0D3D33]/40 hover:bg-slate-100/60 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-purple-100 text-purple-600 font-bold">
                          <Scissors className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-[#0D3D33]">Workers / Staff</span>
                      </div>
                      <span className={`text-xs font-black ${isFull ? 'text-rose-600' : isNearFull ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                        {curr} / {isUnlimited ? '∞' : max}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="h-3 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                            isFull ? 'bg-rose-500' : isNearFull ? 'bg-amber-500' : 'bg-gradient-to-r from-[#0D3D33] via-[#2ECC71] to-[#2ECC71]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-extrabold text-slate-400 pt-0.5">
                        <span>{isUnlimited ? 'Unlimited' : `${pct}% used`}</span>
                        <span className="flex items-center gap-0.5 text-[#0D3D33] group-hover:underline">
                          Staff List <ArrowRight className="w-3 h-3" />
                        </span>
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
