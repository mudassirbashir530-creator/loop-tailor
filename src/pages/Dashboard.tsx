import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useShop } from '../contexts/ShopContext';
import { ORDER_STATUS } from '../lib/config';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Users, Scissors, CheckCircle, Clock, Plus, ArrowRight, Calendar, TrendingUp, Search, Hash, FileText, UserCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format, addDays, isAfter, isBefore, isThisMonth, subMonths, isSameMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn, isOrderOverdue } from '../lib/utils';
import { useStaff } from '../hooks/useStaff';
import { useNotifications } from '../hooks/useNotifications';
import { doc, updateDoc } from 'firebase/firestore';

import QuickSetupChecklist from '../components/QuickSetupChecklist';
import OnboardingTour from '../components/OnboardingTour';

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
    transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const { settings } = useShop();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  
  type DashboardTab = 'recent' | 'upcoming';
  const dashboardTabs: { id: DashboardTab; label: string }[] = [
    { id: 'recent', label: t('dashboard.recentOrders') },
    { id: 'upcoming', label: t('dashboard.upcomingDeliveries') }
  ];
  
  const [stats, setStats] = useState({
    customers: 0,
    newCustomersThisMonth: 0,
    activeOrders: 0,
    completedOrders: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    totalCollected: 0,
    totalPending: 0,
    thisMonthRevenue: 0,
    ordersThisMonth: 0,
    ordersLastMonth: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('recent');
  const [searchToken, setSearchToken] = useState('');
  const [searchError, setSearchError] = useState('');
  const { staff } = useStaff();

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let newIndex = index;
    if (e.key === 'ArrowRight') {
      newIndex = (index + (isRTL ? -1 : 1) + dashboardTabs.length) % dashboardTabs.length;
    } else if (e.key === 'ArrowLeft') {
      newIndex = (index + (isRTL ? 1 : -1) + dashboardTabs.length) % dashboardTabs.length;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = dashboardTabs.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    setActiveTab(dashboardTabs[newIndex].id);
    const tabElement = document.getElementById(`dashboard-tab-${newIndex}`);
    if (tabElement) tabElement.focus();
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
    return new Intl.NumberFormat(isRTL ? 'ur-PK' : 'en-US', {
      style: 'currency',
      currency: settings.currency || 'PKR',
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
        where('tokenId', '==', searchToken.trim().toUpperCase())
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

    let isFirstLoad = true;

    const unsubscribeCustomers = onSnapshot(collection(db, 'shops', user.uid, 'customers'), (customersSnap) => {
      let newCust = 0;
      customersSnap.forEach(doc => {
        const data = doc.data();
        if (data.createdAt) {
          const createdAtDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          if (isThisMonth(createdAtDate)) newCust++;
        }
      });
      setStats(prev => ({ ...prev, customers: customersSnap.size, newCustomersThisMonth: newCust }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'dashboard_customers');
    });

    const unsubscribeOrders = onSnapshot(collection(db, 'shops', user.uid, 'orders'), (ordersSnap) => {
      let active = 0;
      let completed = 0;
      let pendingPay = 0;
      let revenue = 0;
      let totalCol = 0;
      let totalPend = 0;
      let monthRev = 0;
      let ordersThisMo = 0;
      let ordersLastMo = 0;
      const allOrders: any[] = [];
      const upcoming: any[] = [];
      const today = new Date();
      const lastMonthDate = subMonths(today, 1);
      const nextWeek = addDays(today, 7);

      ordersSnap.forEach((doc) => {
        const data = doc.data();
        const order = { id: doc.id, ...data };
        allOrders.push(order);

        const orderPrice = data.price || 0;
        const advance = data.advancePayment || 0;
        const paymentsSum = (data.payments || []).reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
        let paidAmount = 0;
        if (data.paymentStatus === 'Paid') {
          paidAmount = orderPrice;
        } else {
          paidAmount = advance + paymentsSum;
        }

        totalCol += paidAmount;
        totalPend += Math.max(0, orderPrice - paidAmount);

        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now());
        if (isThisMonth(createdAt)) {
          monthRev += paidAmount;
          ordersThisMo++;
        } else if (isSameMonth(createdAt, lastMonthDate)) {
          ordersLastMo++;
        }

        if (data.status === ORDER_STATUS.DELIVERED) {
          completed++;
          revenue += orderPrice;
        } else {
          active++;
          const deliveryDate = new Date(data.deliveryDate);
          if (isAfter(deliveryDate, today) && isBefore(deliveryDate, nextWeek)) {
            upcoming.push(order);
          }
        }
        
        if (orderPrice > advance && data.status !== ORDER_STATUS.DELIVERED) {
          pendingPay += (orderPrice - advance);
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

      setStats(prev => ({
        ...prev,
        activeOrders: active,
        completedOrders: completed,
        pendingPayments: pendingPay,
        totalRevenue: revenue,
        totalCollected: totalCol,
        totalPending: totalPend,
        thisMonthRevenue: monthRev,
        ordersThisMonth: ordersThisMo,
        ordersLastMonth: ordersLastMo,
      }));
      setRecentOrders(recent);
      setUpcomingDeliveries(upcoming);
      setAllOrders(allOrders);
      
      if (isFirstLoad) {
        setLoading(false);
        isFirstLoad = false;

        // Check for overdue orders and trigger notifications
        allOrders.forEach(order => {
          if (order.status !== ORDER_STATUS.DELIVERED && isOrderOverdue(order.deliveryDate)) {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            if (order.lastNotifiedDate !== todayStr) {
               addNotification({
                  type: 'order_overdue',
                  title: 'Order Overdue!',
                  message: `Order #${order.tokenId} for ${order.customerName} is overdue!`,
                  orderId: order.id,
                  customerId: order.customerId
               });
               updateDoc(doc(db, 'shops', user.uid, 'orders', order.id), {
                  lastNotifiedDate: todayStr
               }).catch(console.error);
            }
          }
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'dashboard_orders');
      setLoading(false);
    });

    return () => {
      unsubscribeCustomers();
      unsubscribeOrders();
    };
  }, [user]);

  const revenueChartData = React.useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthOrders = allOrders.filter(o => 
        o.status === ORDER_STATUS.DELIVERED && 
        isSameMonth(o.updatedAt?.toDate ? o.updatedAt.toDate() : new Date(o.updatedAt || o.createdAt), monthDate)
      );
      const revenue = monthOrders.reduce((sum, o) => sum + (o.price || 0), 0);
      data.push({
        name: format(monthDate, 'MMM'),
        revenue
      });
    }
    return data;
  }, [allOrders]);

  const pieChartData = React.useMemo(() => {
    const counts = {
      [ORDER_STATUS.PENDING]: 0,
      [ORDER_STATUS.STITCHING]: 0,
      [ORDER_STATUS.READY]: 0,
      [ORDER_STATUS.DELIVERED]: 0,
    };
    allOrders.forEach(o => {
      if (counts[o.status] !== undefined) counts[o.status]++;
    });
    return [
      { name: 'Pending', value: counts[ORDER_STATUS.PENDING], color: '#f59e0b' },
      { name: 'Stitching', value: counts[ORDER_STATUS.STITCHING], color: '#f97316' },
      { name: 'Ready', value: counts[ORDER_STATUS.READY], color: '#3b82f6' },
      { name: 'Delivered', value: counts[ORDER_STATUS.DELIVERED], color: '#10b981' },
    ].filter(d => d.value > 0);
  }, [allOrders]);

  const topDressTypesData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    allOrders.forEach(o => {
      if (o.dressType) {
        counts[o.dressType] = (counts[o.dressType] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [allOrders]);

  if (loading && !stats.customers) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 shadow-neu-sm rounded-3xl animate-pulse"></div>)}
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-96 bg-gray-100 shadow-neu-sm rounded-3xl animate-pulse"></div>
            <div className="h-80 bg-gray-100 shadow-neu-sm rounded-3xl animate-pulse"></div>
          </div>
          <div className="space-y-8">
            <div className="h-48 bg-gray-100 shadow-neu-sm rounded-3xl animate-pulse"></div>
            <div className="h-96 bg-gray-100 shadow-neu-sm rounded-3xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  const hasData = allOrders.length > 0 || stats.customers > 0;

  if (!loading && !hasData) {
    return (
      <div className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-slate-900">{t('dashboard.title')}</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2 font-medium">{t('dashboard.subtitle')}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="py-24 px-4 text-center bg-gray-100 shadow-neu-pressed-sm rounded-[3rem] flex flex-col items-center space-y-6"
        >
          <div className="w-64 max-w-full opaciy-80">
            <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="100" y="50" width="200" height="150" rx="20" fill="white" stroke="#e2e8f0" strokeWidth="8"/>
              <rect x="140" y="90" width="120" height="20" rx="10" fill="#f1f5f9"/>
              <rect x="140" y="130" width="80" height="20" rx="10" fill="#f1f5f9"/>
              <circle cx="200" cy="180" r="60" stroke="#004643" strokeWidth="12" strokeDasharray="15 15" opacity="0.1"/>
              <path d="M180 180L220 180" stroke="#004643" strokeWidth="12" strokeLinecap="round" opacity="0.2"/>
              <path d="M200 160L200 200" stroke="#004643" strokeWidth="12" strokeLinecap="round" opacity="0.2"/>
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Your dashboard is empty</h3>
            <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">
              Start by adding your first customer or creating a new order to see your metrics come to life.
            </p>
          </div>
          <div className="flex gap-4 mt-4">
            <Button 
              onClick={() => navigate('/dashboard/orders/new')}
              className="rounded-xl h-14 px-8 font-bold bg-brand-primary shadow-lg text-white"
            >
              <Plus className="h-5 w-5 mr-no-rtl ml-auto-rtl mr-2" />
              Create Order
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <OnboardingTour />
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn("space-y-10", loading ? "opacity-70 pointer-events-none animate-pulse" : "")}
      >
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-slate-900">
              {t('dashboard.welcome')}, <span className="text-brand-primary">{user?.displayName?.split(' ')[0] || 'Tailor'}</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-2 font-medium">Here's what's happening today.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {/* Token Search Bar */}
            <motion.form 
              onSubmit={handleTokenSearch} 
              className="relative group w-full sm:w-96"
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02 }}
            >
              <div className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors", isRTL ? "right-5" : "left-5")}>
                <Hash className="h-5 w-5" />
              </div>
              <input 
                type="text"
                placeholder={t('dashboard.searchPlaceholder')}
                value={searchToken}
                onChange={(e) => setSearchToken(e.target.value)}
                className={cn("w-full h-14 rounded-2xl bg-gray-100 shadow-neu-pressed-sm border-none text-base font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all", isRTL ? "pr-14 pl-14" : "pl-14 pr-14")}
              />
              <button 
                type="submit"
                className={cn("absolute top-2 h-10 w-10 rounded-xl bg-gray-100 shadow-neu-sm text-brand-primary flex items-center justify-center hover:shadow-neu-pressed-sm transition-all", isRTL ? "left-2" : "right-2")}
              >
                <Search className="h-5 w-5" />
              </button>
              {searchError && (
                <p className={cn("absolute -bottom-6 text-[10px] font-bold text-red-500 uppercase tracking-wider", isRTL ? "right-2" : "left-2")}>{searchError}</p>
              )}
            </motion.form>
          </div>
        </motion.div>

        <QuickSetupChecklist />

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t('dashboard.activeOrders'), value: stats.activeOrders, icon: Scissors, color: "text-brand-primary" },
          { label: t('dashboard.completedOrders'), value: stats.completedOrders, icon: CheckCircle, color: "text-brand-primary" },
          { label: t('dashboard.pendingPayments'), value: formatCurrency(stats.pendingPayments), icon: Clock, color: "text-brand-primary" },
          { label: t('dashboard.revenue'), value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: "text-brand-primary" },
        ].map((stat, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            <Card className="border-none shadow-neu bg-gray-100 rounded-2xl p-6 flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
              <div className="bg-gray-100 shadow-neu-pressed-sm p-4 rounded-xl flex items-center justify-center">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</div>
                <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">{stat.value}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-neu bg-gray-100 rounded-[2rem] p-6 flex flex-col justify-center items-center text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Average Order Value</div>
          <div className="text-3xl font-black text-brand-primary">{formatCurrency(stats.completedOrders > 0 ? stats.totalRevenue / stats.completedOrders : 0)}</div>
          <div className="text-xs font-bold text-slate-400 mt-2">Based on delivered orders</div>
        </Card>
        <Card className="border-none shadow-neu bg-gray-100 rounded-[2rem] p-6 flex flex-col justify-center items-center text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Orders Growth</div>
          <div className="text-3xl font-black text-slate-900">
            {stats.ordersThisMonth} <span className="text-sm font-bold text-slate-500">vs {stats.ordersLastMonth}</span>
          </div>
          {stats.ordersLastMonth > 0 && (
            <div className={`text-[10px] font-black uppercase tracking-widest mt-2 ${stats.ordersThisMonth >= stats.ordersLastMonth ? 'text-emerald-500' : 'text-rose-500'}`}>
              {Math.round(((stats.ordersThisMonth - stats.ordersLastMonth) / stats.ordersLastMonth) * 100)}% {stats.ordersThisMonth >= stats.ordersLastMonth ? 'Increase' : 'Decrease'}
            </div>
          )}
        </Card>
        <Card className="border-none shadow-neu bg-gray-100 rounded-[2rem] p-6 flex flex-col justify-center items-center text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">New Customers</div>
          <div className="text-3xl font-black text-slate-900">{stats.newCustomersThisMonth}</div>
          <div className="text-xs font-bold text-slate-400 mt-2">Added this month</div>
        </Card>
      </motion.div>

      {/* Comprehensive Analytics Data Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-none shadow-neu bg-gray-100 rounded-[2.5rem] h-full overflow-hidden flex flex-col">
            <CardHeader className="p-6 pb-2 border-b border-gray-200/50">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand-primary" />
                Revenue (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} tickFormatter={(value) => `${value}`} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)', radius: 8 }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                    formatter={(value: any) => [formatCurrency(value as number), 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Status & Payment Summary */}
        <motion.div variants={itemVariants} className="space-y-6 flex flex-col">
          <Card className="border-none shadow-neu bg-gray-100 rounded-[2.5rem] p-6 min-h-[300px] flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-primary" />
              Order Status
            </h3>
            <div className="flex-1 relative min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    itemStyle={{ fontWeight: 'bold' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="border-none shadow-neu bg-gray-100 rounded-[2.5rem] overflow-hidden">
             <div className="p-6 space-y-4">
                <div>
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Collected</div>
                  <div className="text-2xl font-black text-brand-primary line-clamp-1">{formatCurrency(stats.totalCollected)}</div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Pending</div>
                    <div className="text-lg font-bold text-slate-900 line-clamp-1">{formatCurrency(stats.totalPending)}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">This Month</div>
                    <div className="text-lg font-bold text-slate-900 line-clamp-1">{formatCurrency(stats.thisMonthRevenue)}</div>
                  </div>
                </div>
             </div>
          </Card>
        </motion.div>

        {/* Top Dress Types */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <Card className="border-none shadow-neu bg-gray-100 rounded-[2.5rem] p-6 h-[300px] flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Scissors className="h-5 w-5 text-brand-primary" />
              Top Dress Types
            </h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDressTypesData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#1e293b', fontWeight: 600 }} width={120} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)', radius: 8 }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-none shadow-neu bg-gray-100 overflow-hidden rounded-3xl">
            <CardHeader className="p-6 pb-4 border-b border-gray-200/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div 
                  className="flex p-1.5 bg-gray-100 shadow-neu-pressed-sm rounded-xl w-fit"
                  role="tablist"
                  aria-label="Dashboard views"
                >
                  {dashboardTabs.map((tab, index) => (
                    <button
                      key={tab.id}
                      id={`dashboard-tab-${index}`}
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      aria-controls={`dashboard-tabpanel-${index}`}
                      tabIndex={activeTab === tab.id ? 0 : -1}
                      onClick={() => setActiveTab(tab.id)}
                      onKeyDown={(e) => handleTabKeyDown(e, index)}
                      className={cn(
                        "px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
                        activeTab === tab.id 
                          ? "text-brand-primary shadow-neu-sm bg-gray-100" 
                          : "text-slate-500 hover:text-brand-primary"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                {activeTab === 'recent' ? (
                  <Button variant="ghost" size="sm" asChild className="rounded-xl hover:shadow-neu-pressed-sm bg-gray-100 shadow-neu-sm text-brand-primary font-bold h-10 px-4 transition-all">
                    <Link to="/dashboard/orders" className="flex items-center">
                      {t('dashboard.viewAll')} <ArrowRight className={cn("h-4 w-4", isRTL ? "mr-2 rotate-180" : "ml-2")} />
                    </Link>
                  </Button>
                ) : (
                  <div className="bg-gray-100 shadow-neu-pressed-sm p-2.5 rounded-xl">
                    <Calendar className="h-5 w-5 text-brand-primary" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  id={`dashboard-tabpanel-${dashboardTabs.findIndex((t) => t.id === activeTab)}`}
                  role="tabpanel"
                  aria-labelledby={`dashboard-tab-${dashboardTabs.findIndex((t) => t.id === activeTab)}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  {activeTab === 'recent' ? (
                    recentOrders.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 text-sm font-medium">{t('dashboard.noRecentOrders')}</div>
                    ) : (
                      recentOrders.map((order, idx) => (
                        <motion.div 
                          key={order.id} 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-4 sm:p-5 flex items-center justify-between bg-gray-100 rounded-2xl hover:shadow-neu-pressed-sm transition-all cursor-pointer group"
                          onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-gray-100 shadow-neu-sm flex items-center justify-center text-brand-primary group-hover:shadow-neu-pressed-sm transition-all">
                              <Scissors className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-brand-primary transition-colors">{order.customerName}</div>
                              <div className="text-xs font-medium text-slate-500 mt-0.5">{order.dressType} • {formatDate(order.createdAt)}</div>
                            </div>
                          </div>
                          <div className={cn("text-right", isRTL ? "text-left" : "text-right")}>
                            <div className="text-base font-black text-slate-900">{formatCurrency(order.price)}</div>
                            <div className="flex flex-col items-end gap-1 mt-1">
                              <div className={`text-[11px] font-bold uppercase tracking-wider ${
                                order.status === ORDER_STATUS.DELIVERED ? 'text-emerald-600' : 'text-amber-600'
                              }`}>{t(`orders.${order.status.toLowerCase()}`)}</div>
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest",
                                (!order.paymentStatus || order.paymentStatus === 'Unpaid') ? "text-rose-500" :
                                order.paymentStatus === 'Partial' ? "text-blue-500" :
                                "text-emerald-500"
                              )}>
                                {order.paymentStatus || 'Unpaid'}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )
                  ) : (
                    upcomingDeliveries.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 text-sm font-medium">{t('dashboard.noUpcomingDeliveries')}</div>
                    ) : (
                      upcomingDeliveries.map((order, idx) => (
                        <motion.div 
                          key={order.id} 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-4 sm:p-5 flex items-center justify-between bg-gray-100 rounded-2xl hover:shadow-neu-pressed-sm transition-all group cursor-pointer"
                          onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-gray-100 shadow-neu-sm flex items-center justify-center text-brand-primary font-black text-lg group-hover:shadow-neu-pressed-sm transition-all">
                              {order.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-brand-primary transition-colors">{order.customerName}</div>
                              <div className="text-xs font-medium text-slate-500 mt-0.5 flex items-center">
                                <Clock className={cn("h-3.5 w-3.5 text-brand-primary", isRTL ? "ml-1" : "mr-1")} />
                                {t('dashboard.due')}: {format(new Date(order.deliveryDate), 'MMM dd, yyyy')}
                              </div>
                            </div>
                          </div>
                          <div className={cn("text-right", isRTL ? "text-left" : "text-right")}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-9 px-4 rounded-xl bg-gray-100 shadow-neu-sm border-none text-brand-primary font-bold hover:shadow-neu-pressed-sm transition-all"
                            >
                              {t('dashboard.details')}
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

        {/* Third column / right side widgets */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
          {/* Staff Performance Widget */}
          <Card className="border-none shadow-neu bg-gray-100 overflow-hidden rounded-3xl h-full">
            <CardHeader className="p-6 border-b border-gray-200/50">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <UserCircle className="h-5 w-5 text-brand-primary" />
                Staff Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {staff.length === 0 ? (
                <div className="text-center text-sm font-medium text-slate-500 py-4">No staff members assigned.</div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {staff.map(member => {
                    const assignedOrders = allOrders.filter(o => o.assignedWorkerId === member.id);
                    const pendingOrders = assignedOrders.filter(o => o.status !== ORDER_STATUS.DELIVERED);
                    const completedThisMonth = assignedOrders.filter(o => {
                      if (o.status !== ORDER_STATUS.DELIVERED) return false;
                      const date = o.updatedAt?.toDate ? o.updatedAt.toDate() : new Date(o.updatedAt || Date.now());
                      return isThisMonth(date);
                    });

                    return (
                      <div key={member.id} className="bg-gray-100 shadow-neu-pressed-sm rounded-2xl p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-slate-900">{member.name}</h4>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{member.role}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-brand-primary">{assignedOrders.length}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="bg-gray-100 shadow-neu-sm rounded-xl p-2 text-center">
                            <span className="block text-sm font-black text-slate-600">{assignedOrders.filter(o => o.status === ORDER_STATUS.PENDING).length}</span>
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Pending</span>
                          </div>
                          <div className="bg-gray-100 shadow-neu-sm rounded-xl p-2 text-center">
                            <span className="block text-sm font-black text-amber-600">{assignedOrders.filter(o => o.status === ORDER_STATUS.STITCHING).length}</span>
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Stitching</span>
                          </div>
                          <div className="bg-gray-100 shadow-neu-sm rounded-xl p-2 text-center">
                            <span className="block text-sm font-black text-blue-600">{assignedOrders.filter(o => o.status === ORDER_STATUS.READY).length}</span>
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Ready</span>
                          </div>
                          <div className="bg-emerald-50 shadow-neu-sm rounded-xl p-2 text-center border-none">
                            <span className="block text-sm font-black text-emerald-600">{completedThisMonth.length}</span>
                            <span className="block text-[8px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Done(Mo)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
    </>
  );
}
