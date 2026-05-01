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

  const topCustomersData = React.useMemo(() => {
    const counts: Record<string, { count: number, name: string }> = {};
    allOrders.forEach(o => {
      const id = o.customerId || o.customerName;
      if (id && o.customerName) {
        if (!counts[id]) {
           counts[id] = { count: 0, name: o.customerName };
        }
        counts[id].count += 1;
      }
    });
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
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
        className={cn("bg-[#F5F7FA] min-h-screen pb-[80px]", loading ? "opacity-70 pointer-events-none animate-pulse" : "")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#22C55E] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {user?.displayName?.charAt(0)?.toUpperCase() || 'T'}
            </div>
            <div>
              <div className="font-bold text-[18px] text-[#0F172A] leading-tight">
                Hello, {user?.displayName?.split(' ')[0] || 'Tailor'}
              </div>
              <div className="text-[13px] text-[#64748B]">Good morning</div>
            </div>
          </div>
          <button className="relative p-2 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
            <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 mb-6">
          <form 
            onSubmit={handleTokenSearch} 
            className="flex items-center gap-3 relative h-[44px] bg-[#F1F5F9] rounded-[12px] px-3"
          >
            <Search className="h-5 w-5 text-[#64748B]" />
            <input 
              type="text"
              placeholder="Search orders, customers..."
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              className="flex-1 bg-transparent border-none shadow-none p-0 focus:ring-0 text-[#0F172A] text-[14px]"
            />
            {searchError && (
              <p className="absolute -bottom-6 left-0 text-[10px] font-bold text-[#DC2626] uppercase tracking-wider">{searchError}</p>
            )}
            <div className="ml-auto flex items-center justify-center w-8 h-8">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
            </div>
          </form>
        </div>

        {/* Featured Card */}
        <div className="px-4 mb-6">
          <div className="bg-gradient-to-r from-[#22C55E] to-[#15803D] rounded-[20px] p-5 text-white relative overflow-hidden shadow-[0_4px_16px_rgba(34, 197, 94,0.3)]">
            <svg className="absolute right-0 bottom-0 opacity-10" width="120" height="120" viewBox="0 0 100 100" fill="white"><circle cx="80" cy="80" r="50"/></svg>
            <div className="relative z-10">
              <div className="text-[13px] font-medium opacity-90 mb-1">Total Revenue</div>
              <div className="text-[28px] font-bold tracking-tight mb-4">{formatCurrency(stats.totalRevenue)}</div>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[11px] opacity-70 uppercase tracking-widest">{t('dashboard.activeOrders')}</div>
                  <div className="text-lg font-bold">{stats.activeOrders}</div>
                </div>
                <div>
                  <div className="text-[11px] opacity-70 uppercase tracking-widest">Completed</div>
                  <div className="text-lg font-bold">{stats.completedOrders}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Quick Access */}
        <div className="px-4 mb-8">
          <div className="flex overflow-x-auto gap-4 pb-2 hide-scrollbar">
            {[
              { label: 'Orders', icon: Scissors, path: '/dashboard/orders', color: 'bg-green-100 text-[#22C55E]' },
              { label: 'Customers', icon: Users, path: '/dashboard/customers', color: 'bg-blue-100 text-blue-600' },
              { label: 'Measurements', icon: FileText, path: '/dashboard/measurements', color: 'bg-purple-100 text-purple-600' },
              { label: 'Designs', icon: TrendingUp, path: '/dashboard', color: 'bg-orange-100 text-orange-600' },
              { label: 'Payments', icon: Search, path: '/dashboard/settings', color: 'bg-indigo-100 text-indigo-600' },
            ].map((cat, i) => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-[64px]" onClick={() => navigate(cat.path)}>
                <div className={cn("w-[56px] h-[56px] rounded-full flex items-center justify-center", cat.color)}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <div className="text-[11px] font-medium text-[#64748B]">{cat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Orders / Recent */}
        <div className="px-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-[#0F172A]">Today's Orders</h2>
            <Link to="/dashboard/orders" className="text-[13px] font-medium text-[#22C55E] border border-[#22C55E] rounded-full px-3 py-1">See All</Link>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <div className="text-center text-sm text-[#64748B] py-4 bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.07)]">No orders today</div>
            ) : (
              recentOrders.map(order => (
                <div key={order.id} className="bg-white rounded-[16px] p-3.5 flex items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.07)]" onClick={() => navigate(`/dashboard/orders/${order.id}`)}>
                  <div className="w-[56px] h-[56px] rounded-[14px] bg-[#F1F5F9] flex items-center justify-center text-[#22C55E]">
                    <Scissors className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[15px] font-semibold text-[#0F172A]">{order.customerName}</div>
                    <div className="text-[12px] text-[#64748B] mt-0.5">{order.dressType}</div>
                    <div className="text-[12px] text-[#64748B]">{formatDate(order.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[15px] font-semibold text-[#22C55E] mb-1">{formatCurrency(order.price)}</div>
                    <div className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full inline-block", order.status === ORDER_STATUS.DELIVERED ? "bg-[#22C55E] text-white" : "bg-[#1E293B] text-white")}>
                      {t(`orders.${order.status.toLowerCase()}`)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Customers */}
        {topCustomersData.length > 0 && (
          <div className="px-4 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-[#0F172A]">Top Customers</h2>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-2 hide-scrollbar">
              {topCustomersData.map((customer, i) => (
                <div key={i} className="flex flex-col items-center min-w-[72px] bg-white rounded-[16px] p-3 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
                  <div className="w-[52px] h-[52px] rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#64748B] text-lg font-bold mb-2">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-[12px] font-medium text-[#0F172A] line-clamp-1 text-center w-full">{customer.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-[#64748B] mt-0.5">{customer.count} Order{customer.count !== 1 ? 's' : ''}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </motion.div>
    </>
  );
}