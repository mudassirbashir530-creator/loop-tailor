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

  const totalOrders = orders?.length || 0;
  const pendingOrders = orders ? orders.filter(o => o.status !== 'delivered').length : 0;
  const completedToday = orders ? orders.filter(o => o && o.status === 'delivered' && o.updatedAt && isToday(new Date(o.updatedAt))).length : 0;
  const revenue = orders ? orders.reduce((sum, order) => {
    if (!order) return sum;
    return sum + (safeNum(order.advancePayment)) + (safeNum(order.price) - safeNum(order.remainingPayment));
  }, 0) : 0;

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
        return sum + (safeNum(order.advancePayment)) + (safeNum(order.price) - safeNum(order.remainingPayment));
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

      {/* Analytics Chart */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip cursor={{fill: '#f4f4f5'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="revenue" fill="currentColor" className="fill-primary" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

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
          ) : orders.slice(0, 5).map((order, idx) => (
            <motion.div 
              key={order.id} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                
                <div className="flex-1">
                  <p className="font-semibold text-foreground mb-1">{order.customerName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate max-w-[120px]">{order.clothingType}</span>
                    <span>•</span>
                    <span className="font-mono">{order.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Delivery: {formatDate(order.deliveryDate)}</p>
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
          ))}
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
