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
        className={cn("", loading ? "opacity-70 pointer-events-none animate-pulse" : "")}
      >
        <motion.div variants={itemVariants} className="welcome-section flex flex-col pt-10 px-8 pb-14">
          <div className="z-10 relative">
            <div className="greeting-text">{t('dashboard.welcome')}</div>
            <h1 className="welcome-name">
              Hello, <span className="highlight">{user?.displayName?.split(' ')[0] || 'Tailor'}</span>
            </h1>
          </div>
        </motion.div>

        {/* Token Search Bar floats over hero */}
        <div className="search-container">
          <form 
            onSubmit={handleTokenSearch} 
            className="flex items-center gap-3 relative"
          >
            <div className="text-[#64748B]">
              <Search className="h-5 w-5" />
            </div>
            <input 
              type="text"
              placeholder={t('dashboard.searchPlaceholder')}
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              className="flex-1 bg-transparent border-none shadow-none p-0 focus:ring-0 text-[#0F172A] font-medium"
              style={{ boxShadow: 'none' }}
            />
            <button 
              type="submit"
              className="px-4 py-2 bg-[#1B2B5E] text-white rounded-lg text-sm font-bold shadow-[0_4px_12px_rgba(27, 43, 94,0.2)]"
            >
              Search
            </button>
            {searchError && (
              <p className="absolute -bottom-6 left-0 text-[10px] font-bold text-[#DC2626] uppercase tracking-wider">{searchError}</p>
            )}
          </form>
        </div>

        <div className="px-5 mt-6">
          <QuickSetupChecklist />
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 px-5 mt-6">
        {[
          { label: t('dashboard.activeOrders'), value: stats.activeOrders, icon: Scissors, color: "text-[#1B2B5E]", bg: "bg-[#F1F5F9]" },
          { label: t('dashboard.completedOrders'), value: stats.completedOrders, icon: CheckCircle, color: "text-[#1B2B5E]", bg: "bg-[#F1F5F9]" },
          { label: t('dashboard.pendingPayments'), value: formatCurrency(stats.pendingPayments), icon: Clock, color: "text-[#1B2B5E]", bg: "bg-[#F1F5F9]" },
          { label: t('dashboard.revenue'), value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: "text-[#60A5FA]", bg: "bg-[#0E1736]", dark: true },
        ].map((stat, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            <div className={cn("stat-card", stat.dark ? "dark-variant" : "")}>
              <div className={cn("stat-icon-box", stat.bg)}>
                <stat.icon className={`h-[22px] w-[22px] ${stat.color}`} />
              </div>
              <div className="flex flex-col">
                <div className={cn("text-[11px] font-semibold uppercase tracking-wider mb-1", stat.dark ? "text-[rgba(255,255,255,0.7)]" : "text-[#64748B]")}>{stat.label}</div>
                <div className={cn("stat-number text-xl md:text-2xl", stat.dark ? "text-white" : "text-[#0F172A]")}>{stat.value}</div>
              </div>
            </div>
          </motion.div>
        ))}
        </div>

        {/* Comprehensive Analytics Data Visualization */}
        <div className="chart-container">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-[#1B2B5E]" />
            <h2 className="section-title">Revenue (Last 6 Months)</h2>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F8FAFC" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} tickFormatter={(value) => `${value}`} />
                <RechartsTooltip 
                  cursor={{ fill: '#F5F7FA', radius: 8 }}
                  contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 8px 32px rgba(27, 43, 94,0.12)', padding: '12px' }}
                  formatter={(value: any) => [formatCurrency(value as number), 'Revenue']}
                />
                <Bar 
                  dataKey="revenue" 
                  radius={[6, 6, 0, 0]} 
                  barSize={32}
                  fill="#1B2B5E" 
                  className="chart-bar outline-none border-none"
                >
                  {revenueChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} className={index === revenueChartData.length - 1 ? 'current-month' : 'has-data'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 px-5 mt-6">
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-[#F8FAFC]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div 
                    className="flex p-1 bg-[#F5F7FA] rounded-[16px] w-fit"
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
                          "px-5 py-2 rounded-[14px] text-sm font-bold transition-all duration-300 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2B5E]",
                          activeTab === tab.id 
                            ? "text-[#1B2B5E] bg-white shadow-[0_2px_8px_rgba(27, 43, 94,0.08)]" 
                            : "text-[#64748B] hover:text-[#1B2B5E]"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  {activeTab === 'recent' ? (
                    <Button variant="ghost" size="sm" asChild className="rounded-[14px] bg-[#F1F5F9] text-[#1B2B5E] font-bold h-10 px-4 transition-all hover:bg-[#E2E8F0]">
                      <Link to="/dashboard/orders" className="flex items-center">
                        {t('dashboard.viewAll')} <ArrowRight className={cn("h-4 w-4", isRTL ? "mr-2 rotate-180" : "ml-2")} />
                      </Link>
                    </Button>
                  ) : (
                    <div className="bg-[#F1F5F9] p-2.5 rounded-[14px]">
                      <Calendar className="h-5 w-5 text-[#1B2B5E]" />
                    </div>
                  )}
                </div>
              </div>
              <div className="p-3">
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
                        <div className="p-12 text-center text-[#64748B] text-sm font-medium">{t('dashboard.noRecentOrders')}</div>
                      ) : (
                        recentOrders.map((order, idx) => (
                          <motion.div 
                            key={order.id} 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-4 flex items-center justify-between bg-[#F5F7FA] rounded-[16px] hover:bg-[#F1F5F9] transition-all cursor-pointer group"
                            onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-[14px] bg-white flex items-center justify-center text-[#1B2B5E] shadow-sm">
                                <Scissors className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-bold text-[#0F172A]">{order.customerName}</div>
                                <div className="text-[12px] font-medium text-[#334155] mt-0.5">{order.dressType} • {formatDate(order.createdAt)}</div>
                              </div>
                            </div>
                            <div className={cn("text-right", isRTL ? "text-left" : "text-right")}>
                              <div className="text-base font-black text-[#0F172A]">{formatCurrency(order.price)}</div>
                              <div className="flex flex-col items-end gap-1 mt-1">
                                <div className={`badge ${
                                  order.status === ORDER_STATUS.DELIVERED ? 'badge-success' : 'badge-warning'
                                }`}>{t(`orders.${order.status.toLowerCase()}`)}</div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )
                    ) : (
                      upcomingDeliveries.length === 0 ? (
                        <div className="p-12 text-center text-[#64748B] text-sm font-medium">{t('dashboard.noUpcomingDeliveries')}</div>
                      ) : (
                        upcomingDeliveries.map((order, idx) => (
                          <motion.div 
                            key={order.id} 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-4 flex items-center justify-between bg-[#F5F7FA] rounded-[16px] hover:bg-[#F1F5F9] transition-all group cursor-pointer"
                            onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-[14px] bg-[#1B2B5E] text-white flex items-center justify-center font-black text-lg shadow-sm">
                                {order.customerName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-[#0F172A]">{order.customerName}</div>
                                <div className="text-[12px] font-medium text-[#334155] mt-0.5 flex items-center">
                                  <Clock className={cn("h-3.5 w-3.5 text-[#1B2B5E]", isRTL ? "ml-1" : "mr-1")} />
                                  {t('dashboard.due')}: {format(new Date(order.deliveryDate), 'MMM dd, yyyy')}
                                </div>
                              </div>
                            </div>
                            <div className={cn("text-right", isRTL ? "text-left" : "text-right")}>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9 px-4 rounded-[12px] bg-white border-[#E2E8F0] text-[#1B2B5E] font-bold"
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
              </div>
            </div>
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
