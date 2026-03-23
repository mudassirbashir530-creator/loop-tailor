import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Users, Scissors, CheckCircle, Clock, Plus, ArrowRight, Calendar, TrendingUp, Search, Hash } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

type DashboardTab = 'recent-orders' | 'upcoming-deliveries';

const dashboardTabs: Array<{ key: DashboardTab; label: string }> = [
  { key: 'recent-orders', label: 'Recent Orders' },
  { key: 'upcoming-deliveries', label: 'Upcoming Deliveries' }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    customers: 0,
    activeOrders: 0,
    completedOrders: 0,
    pendingPayments: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('recent-orders');
  const [searchToken, setSearchToken] = useState('');
  const [searchError, setSearchError] = useState('');

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
      return;
    }

    event.preventDefault();

    if (event.key === 'Home') {
      setActiveTab(dashboardTabs[0].key);
      return;
    }

    if (event.key === 'End') {
      setActiveTab(dashboardTabs[dashboardTabs.length - 1].key);
      return;
    }

    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + direction + dashboardTabs.length) % dashboardTabs.length;
    setActiveTab(dashboardTabs[nextIndex].key);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'MMM dd, yyyy');
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleTokenSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchToken.trim() || !user) return;

    setSearchError('');
    try {
      const q = query(
        collection(db, 'shops', user.uid, 'orders'), 
        where('tokenId', '==', searchToken.trim())
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        navigate(`/dashboard/orders/${snap.docs[0].id}`);
      } else {
        setSearchError('Order not found with this Token ID.');
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchError('Error searching for order.');
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const customersSnap = await getDocs(collection(db, 'shops', user.uid, 'customers'));
        const ordersSnap = await getDocs(collection(db, 'shops', user.uid, 'orders'));
        
        let active = 0;
        let completed = 0;
        let pendingPay = 0;
        let revenue = 0;
        const allOrders: any[] = [];
        const upcoming: any[] = [];
        const today = new Date();
        const nextWeek = addDays(today, 7);

        ordersSnap.forEach((doc) => {
          const data = doc.data();
          const order = { id: doc.id, ...data };
          allOrders.push(order);

          if (data.status === 'Delivered') {
            completed++;
            revenue += data.price;
          } else {
            active++;
            const deliveryDate = new Date(data.deliveryDate);
            if (isAfter(deliveryDate, today) && isBefore(deliveryDate, nextWeek)) {
              upcoming.push(order);
            }
          }
          
          if (data.price > (data.advancePayment || 0) && data.status !== 'Delivered') {
            pendingPay += (data.price - (data.advancePayment || 0));
          }
        });

        upcoming.sort((a, b) => {
          const dateA = a.deliveryDate?.toDate ? a.deliveryDate.toDate() : new Date(a.deliveryDate);
          const dateB = b.deliveryDate?.toDate ? b.deliveryDate.toDate() : new Date(b.deliveryDate);
          return dateA.getTime() - dateB.getTime();
        });

        const recent = [...allOrders]
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 5);

        setStats({
          customers: customersSnap.size,
          activeOrders: active,
          completedOrders: completed,
          pendingPayments: pendingPay,
          totalRevenue: revenue,
        });
        setRecentOrders(recent);
        setUpcomingDeliveries(upcoming);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'dashboard_data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"
        />
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10"
    >
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-slate-900">
            Hello, <span className="text-brand-primary">{user?.displayName?.split(' ')[0] || 'Tailor'}</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2 font-medium">Welcome back! Here's what's happening today.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Token Search Bar */}
          <form onSubmit={handleTokenSearch} className="relative group w-full sm:w-80">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors">
              <Hash className="h-5 w-5" />
            </div>
            <input 
              type="text"
              placeholder="Enter Token ID (e.g. 101)"
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-100 bg-white text-base font-bold focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all shadow-sm"
            />
            <button 
              type="submit"
              className="absolute right-3 top-2.5 h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-brand-primary transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
            {searchError && (
              <p className="absolute -bottom-6 left-2 text-[10px] font-bold text-red-500 uppercase tracking-wider">{searchError}</p>
            )}
          </form>

          <div className="flex gap-3 sm:gap-4">
            <Button 
              onClick={() => navigate('/dashboard/customers')} 
              variant="outline" 
              className="rounded-2xl h-14 px-6 border-slate-200 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 text-base font-bold"
            >
              <Users className="h-5 w-5 mr-2" />
              Customers
            </Button>
            <Button 
              onClick={() => navigate('/dashboard/orders/new')} 
              className="rounded-2xl h-14 px-6 bg-brand-primary hover:bg-brand-primary/90 shadow-lg shadow-brand-primary/20 transition-all hover:scale-105 active:scale-95 text-base font-bold"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Order
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Customers", value: stats.customers, icon: Users, color: "text-blue-600", bg: "bg-blue-50", gradient: "from-blue-50/50 to-transparent" },
          { label: "Active Orders", value: stats.activeOrders, icon: Scissors, color: "text-brand-primary", bg: "bg-brand-primary/10", gradient: "from-brand-primary/5 to-transparent" },
          { label: "Completed Orders", value: stats.completedOrders, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", gradient: "from-emerald-50/50 to-transparent" },
          { label: "Pending Payments", value: formatCurrency(stats.pendingPayments), icon: Clock, color: "text-amber-600", bg: "bg-amber-50", gradient: "from-amber-50/50 to-transparent" },
          { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: "text-emerald-700", bg: "bg-emerald-100", gradient: "from-emerald-100/50 to-transparent" },
        ].map((stat, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            <Card className="border-none shadow-sm bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group rounded-[2rem] overflow-hidden relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">{stat.label}</CardTitle>
                <div className={`${stat.bg} p-2 rounded-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2.5rem]">
            <CardHeader className="p-8 pb-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex p-1 bg-slate-100 rounded-2xl w-fit" role="tablist" aria-label="Dashboard order sections">
                  {dashboardTabs.map((tab, index) => (
                    <button
                      key={tab.key}
                      role="tab"
                      id={`dashboard-tab-${tab.key}`}
                      aria-controls={`dashboard-panel-${tab.key}`}
                      aria-selected={activeTab === tab.key}
                      tabIndex={activeTab === tab.key ? 0 : -1}
                      onClick={() => setActiveTab(tab.key)}
                      onKeyDown={(event) => handleTabKeyDown(event, index)}
                      className={cn(
                        "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 relative",
                        activeTab === tab.key 
                          ? "text-brand-primary" 
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {activeTab === tab.key && (
                        <motion.div 
                          layoutId="activeTab"
                          className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      {tab.label}
                    </button>
                  ))}
                </div>
                {activeTab === 'recent-orders' ? (
                  <Button variant="ghost" size="sm" asChild className="rounded-xl hover:bg-brand-primary/5 text-brand-primary">
                    <Link to="/dashboard/orders" className="flex items-center font-bold">
                      View All <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 mt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  role="tabpanel"
                  id={`dashboard-panel-${activeTab}`}
                  aria-labelledby={`dashboard-tab-${activeTab}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="divide-y divide-slate-50"
                >
                  {activeTab === 'recent-orders' ? (
                    recentOrders.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 font-medium">No recent orders.</div>
                    ) : (
                      recentOrders.map((order, idx) => (
                        <motion.div 
                          key={order.id} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                              <Scissors className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-brand-primary transition-colors">{order.customerName}</div>
                              <div className="text-xs text-slate-500 font-medium">{order.dressType} • {formatDate(order.createdAt)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-brand-primary">{formatCurrency(order.price)}</div>
                            <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${
                              order.status === 'Delivered' ? 'text-emerald-500' : 'text-amber-500'
                            }`}>{order.status}</div>
                          </div>
                        </motion.div>
                      ))
                    )
                  ) : (
                    upcomingDeliveries.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 font-medium">No deliveries due in the next 7 days.</div>
                    ) : (
                      upcomingDeliveries.map((order, idx) => (
                        <motion.div 
                          key={order.id} 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group cursor-pointer"
                          onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-brand-primary/5 flex items-center justify-center text-brand-primary font-black text-lg group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                              {order.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-brand-primary transition-colors">{order.customerName}</div>
                              <div className="text-xs text-slate-500 font-medium flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Due: {format(new Date(order.deliveryDate), 'MMM dd, yyyy')}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-xl border-slate-200 group-hover:bg-brand-primary group-hover:text-white group-hover:border-brand-primary transition-all"
                            >
                              Details
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    )
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <Card className="border-none shadow-sm bg-slate-900 text-white rounded-[2.5rem] overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Plus className="h-32 w-32 -mr-16 -mt-16" />
            </div>
            <CardHeader className="p-8 pb-4 relative z-10">
              <CardTitle className="text-xl font-black">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4 relative z-10">
              <Button 
                onClick={() => navigate('/dashboard/orders/new')}
                className="w-full h-14 rounded-2xl bg-brand-primary hover:bg-brand-primary/90 font-black text-base shadow-lg shadow-brand-primary/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create New Order
              </Button>
              <Button 
                onClick={() => navigate('/dashboard/customers')}
                variant="outline"
                className="w-full h-14 rounded-2xl bg-white/10 border-white/10 text-white hover:bg-white/20 font-black text-base transition-all hover:scale-[1.02] active:scale-95"
              >
                <Users className="h-5 w-5 mr-2" />
                Manage Customers
              </Button>
              <Button 
                onClick={() => navigate('/dashboard/settings')}
                variant="outline"
                className="w-full h-14 rounded-2xl bg-white/10 border-white/10 text-white hover:bg-white/20 font-black text-base transition-all hover:scale-[1.02] active:scale-95"
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                Shop Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden border-2 border-slate-50">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Business Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                  <span>Order Completion</span>
                  <span>{stats.activeOrders + stats.completedOrders > 0 ? Math.round((stats.completedOrders / (stats.activeOrders + stats.completedOrders)) * 100) : 0}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.activeOrders + stats.completedOrders > 0 ? (stats.completedOrders / (stats.activeOrders + stats.completedOrders)) * 100 : 0}%` }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                  You have <span className="text-brand-primary font-black">{stats.activeOrders}</span> active orders. 
                  {stats.activeOrders > 5 ? " It's a busy week! Keep up the great work." : " Good time to follow up with old customers."}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
