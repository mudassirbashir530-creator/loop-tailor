import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, CheckCircle, Banknote, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useOrders } from '../hooks/useOrders';
import { formatCurrency, formatDate } from '../lib/utils';
import { isToday, subDays, format } from 'date-fns';
import { motion, Variants } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

        if (order.updatedAt && isToday(new Date(order.updatedAt))) {
          todayCount++;
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
          return new Date(o.createdAt).toDateString() === d.toDateString();
        } catch (e) {
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your overview</p>
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
            icon={<Banknote className="h-5 w-5 text-primary" />}
            iconBg="bg-primary/10"
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
            icon={<Clock className="h-5 w-5 text-emerald-600" />}
            iconBg="bg-emerald-100"
          />
        </motion.div>
      )}

      {/* Plan Usage Widget */}
      <motion.div variants={itemVariants}>
        <Card className="hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-xs font-extrabold text-[#0D3D33]/60 dark:text-emerald-400/60 uppercase tracking-widest">Plan Usage Summary</h3>
                <p className="text-lg font-black text-[#0D3D33] dark:text-emerald-400 capitalize">{plan} Plan</p>
              </div>
              <Link 
                to="/app/upgrade" 
                className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1 shrink-0"
              >
                Upgrade Plan →
              </Link>
            </div>

            {/* Block representation bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 max-w-3xl">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl font-mono text-xs">
                <span className="text-slate-500 font-bold uppercase">Customers:</span>
                <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                  <span className="text-primary tracking-wider font-extrabold">
                    {(() => {
                      const max = limits.customers;
                      if (max === 0) return '█████';
                      const filled = Math.min(5, Math.floor((usage.customers / max) * 5));
                      const empty = Math.max(0, 5 - filled);
                      return '█'.repeat(filled) + '░'.repeat(empty);
                    })()}
                  </span>
                  <span>{usage.customers}/{limits.customers === 0 ? '∞' : limits.customers}</span>
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl font-mono text-xs">
                <span className="text-slate-500 font-bold uppercase">Orders:</span>
                <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                  <span className="text-primary tracking-wider font-extrabold">
                    {(() => {
                      const max = limits.ordersPerMonth;
                      if (max === 0) return '█████';
                      const filled = Math.min(5, Math.floor((usage.ordersThisMonth / max) * 5));
                      const empty = Math.max(0, 5 - filled);
                      return '█'.repeat(filled) + '░'.repeat(empty);
                    })()}
                  </span>
                  <span>{usage.ordersThisMonth}/{limits.ordersPerMonth === 0 ? '∞' : limits.ordersPerMonth}</span>
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl font-mono text-xs">
                <span className="text-slate-500 font-bold uppercase">Workers:</span>
                <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                  <span className="text-primary tracking-wider font-extrabold">
                    {(() => {
                      const max = limits.workers;
                      if (max === 0) return '█████';
                      const filled = Math.min(5, Math.floor((usage.workers / max) * 5));
                      const empty = Math.max(0, 5 - filled);
                      return '█'.repeat(filled) + '░'.repeat(empty);
                    })()}
                  </span>
                  <span>{usage.workers}/{limits.workers === 0 ? '∞' : limits.workers}</span>
                </span>
              </div>
            </div>

            {/* Limit Warning banner if any usage > 80% */}
            {(() => {
              const warnings: string[] = [];
              if (limits.customers > 0 && (usage.customers / limits.customers) > 0.8) {
                warnings.push(`You're running low on customers (${usage.customers}/${limits.customers})`);
              }
              if (limits.ordersPerMonth > 0 && (usage.ordersThisMonth / limits.ordersPerMonth) > 0.8) {
                warnings.push(`You're running low on orders (${usage.ordersThisMonth}/${limits.ordersPerMonth})`);
              }
              if (limits.workers > 0 && (usage.workers / limits.workers) > 0.8) {
                warnings.push(`You're running low on workers (${usage.workers}/${limits.workers})`);
              }

              if (warnings.length === 0) return null;

              return (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-3xl">
                  {warnings.map((warn, index) => (
                    <p key={index} className="text-xs font-bold text-red-600 flex items-center gap-1.5 leading-snug">
                      <span>⚠️</span>
                      <span>{warn}</span>
                    </p>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </motion.div>

      {/* Analytics Chart */}
      {canViewAnalytics && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', minHeight: '200px' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip cursor={{fill: '#f4f4f5'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="revenue" fill="currentColor" className="fill-primary" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Orders */}
      <motion.div variants={itemVariants} className="bg-card rounded-2xl shadow-sm border overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
          <Link to="/app/orders" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            View All
          </Link>
        </div>
        
        <div className="divide-y divide-border">
          {orders.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground">No orders yet.</div>
          ) : orders.slice(0, 5).map((order, idx) => {
            const customer = customers.find(c => c.id === order.customerId);
            return (
            <motion.div 
              key={order.id} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                
                <div className="flex items-center gap-3">
                  {customer?.profileImage ? (
                    <img 
                      src={typeof customer.profileImage === 'string' ? customer.profileImage : customer.profileImage.url} 
                      alt={order.customerName} 
                      className="w-10 h-10 rounded-full object-cover shadow-sm border border-border shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm shrink-0">
                      {order.customerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-foreground mb-1">{order.customerName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate max-w-[120px]">{order.clothingType}</span>
                      <span>•</span>
                      <span className="font-mono">{order.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Delivery: {formatDate(order.deliveryDate)}</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={order.status} className="capitalize px-2 py-0.5">{order.status}</Badge>
                  <div className="text-right">
                    <p className="font-bold text-sm tracking-tight">{formatCurrency(order.price)}</p>
                    {order.remainingPayment > 0 && (
                      <p className="text-[10px] text-orange-600 font-medium uppercase tracking-wider mt-0.5">Bal: {formatCurrency(order.remainingPayment)}</p>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )})}
        </div>
      </motion.div>

    </motion.div>
  );
}

function StatCard({ title, value, icon, iconBg }: { title: string, value: string, icon: React.ReactNode, iconBg: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-4 md:p-6 flex flex-col justify-between h-full">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
