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
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('recent');
  const [searchToken, setSearchToken] = useState('');
  const [searchResults, setSearchResults] = useState<{ type: string; id: string; title: string; subtitle: string; url: string; }[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
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

  useEffect(() => {
    if (!searchToken.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    const token = searchToken.toLowerCase();
    const results: { type: string; id: string; title: string; subtitle: string; url: string; }[] = [];
    
    // Customers (Name/Phone)
    allCustomers.forEach(c => {
      if ((c.name && c.name.toLowerCase().includes(token)) || (c.phone && c.phone.includes(token))) {
        results.push({
          type: 'customer',
          id: `cust_${c.id}`,
          title: c.name,
          subtitle: c.phone || 'No phone',
          url: `/app/clients/${c.id}`
        });
      }
    });

    // Orders (ID/Name)
    allOrders.forEach(o => {
      if ((o.tokenId && o.tokenId.toLowerCase().includes(token)) || (o.customerName && o.customerName.toLowerCase().includes(token))) {
        results.push({
          type: 'order',
          id: `ord_${o.id}`,
          title: `Order #${o.tokenId}`,
          subtitle: o.customerName || 'Unknown Customer',
          url: `/app/orders/${o.id}`
        });
      }
    });

    // Measurements (by customer name)
    allCustomers.forEach(c => {
      if (c.name && c.name.toLowerCase().includes(token)) {
        results.push({
          type: 'measurement',
          id: `meas_${c.id}`,
          title: `${c.name}'s Measurements`,
          subtitle: c.phone || 'No phone',
          url: `/app/clients/${c.id}#measurements`
        });
      }
    });

    setSearchResults(results);
    setShowSearchResults(true);
  }, [searchToken, allCustomers, allOrders]);

  useEffect(() => {
    if (!user) return;

    let isFirstLoad = true;

    const unsubscribeCustomers = onSnapshot(collection(db, 'shops', user.uid, 'customers'), (customersSnap) => {
      let newCust = 0;
      const loadedCustomers: any[] = [];
      customersSnap.forEach(doc => {
        const data = doc.data();
        loadedCustomers.push({ id: doc.id, ...data });
        if (data.createdAt) {
          const createdAtDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          if (isThisMonth(createdAtDate)) newCust++;
        }
      });
      setAllCustomers(loadedCustomers);
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
    const counts: Record<string, { count: number, name: string, id: string }> = {};
    allOrders.forEach(o => {
      const id = o.customerId || o.customerName;
      if (id && o.customerName) {
        if (!counts[id]) {
           counts[id] = { count: 0, name: o.customerName, id: o.customerId };
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
              onClick={() => navigate('/app/new-order')}
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

  const todayFormatted = format(new Date(), 'EEEE, MMMM do, yyyy');

  return (
    <div className={cn("w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 bg-[#F7F5F0] min-h-screen border-none", loading && "opacity-70 pointer-events-none")}>
      <OnboardingTour />
      <QuickSetupChecklist />

      {/* Header */}
      <motion.div 
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0D3D33] flex items-center gap-2">
            Welcome back 👋
          </h1>
          <p className="text-[#4A5568] mt-2 font-medium text-lg">
            {todayFormatted}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => navigate('/app/new-order')}
            className="rounded-full shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ease-in-out bg-[#0D3D33] text-[#FFFFFF] h-11 px-6 font-medium border-none"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Order
          </Button>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-30"
      >
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4A5568] transition-colors group-focus-within:text-[#2ECC71]" />
          <input 
            type="text"
            placeholder="Search customers, orders, measurements..."
            value={searchToken}
            onChange={(e) => setSearchToken(e.target.value)}
            onFocus={() => { if (searchToken) setShowSearchResults(true); }}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            className="w-full h-14 pl-12 pr-4 rounded-2xl border-none outline-none ring-1 ring-[#0D3D33]/10 bg-[#FFFFFF] text-[#0D3D33] text-sm focus:ring-4 focus:ring-[#2ECC71]/20 placeholder:text-[#4A5568] transition-all shadow-sm hover:shadow-md duration-200 ease-in-out"
          />
        </div>
        
        <AnimatePresence>
          {showSearchResults && searchToken && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#FFFFFF] rounded-2xl shadow-xl ring-1 ring-[#0D3D33]/10 max-h-96 overflow-y-auto z-50 p-2 overflow-hidden"
            >
               {searchResults.length > 0 ? (
                  searchResults.map((res) => (
                    <div 
                      key={res.id} 
                      onClick={() => navigate(res.url)} 
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#F7F5F0] transition-colors cursor-pointer"
                    >
                       <div className="w-10 h-10 rounded-full bg-[#0D3D33]/5 flex items-center justify-center text-[#4A5568]">
                         {res.type === 'customer' && <Users className="h-5 w-5" />}
                         {res.type === 'order' && <Scissors className="h-5 w-5" />}
                         {res.type === 'measurement' && <FileText className="h-5 w-5" />}
                       </div>
                       <div>
                         <div className="text-sm font-bold text-[#0D3D33]">{res.title}</div>
                         <div className="text-xs text-[#4A5568] mt-0.5">{res.subtitle}</div>
                       </div>
                    </div>
                  ))
               ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-[#4A5568]">No results found for "{searchToken}"</p>
                  </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'text-[#2ECC71]', bg: 'bg-[#2ECC71]/10' },
          { label: 'Active Orders', value: stats.activeOrders, icon: Clock, color: 'text-[#0D3D33]', bg: 'bg-[#0D3D33]/10' },
          { label: 'Completed', value: stats.completedOrders, icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Pending Payments', value: formatCurrency(stats.pendingPayments), icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-500/10' }
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + (i * 0.05) }}
            key={i}
            className="bg-[#FFFFFF] rounded-[1.5rem] p-5 sm:p-6 shadow-sm ring-1 ring-[#0D3D33]/5 hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                 <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
            </div>
            <div>
              <div className="text-[#4A5568] text-sm sm:text-base font-medium mb-1">{stat.label}</div>
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0D3D33]">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column (Recent Orders) */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#FFFFFF] rounded-[1.5rem] ring-1 ring-[#0D3D33]/5 shadow-sm hover:shadow-md transition-all duration-300 ease-out p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-[#0D3D33]">Recent Orders</h3>
              <Link to="/app/orders" className="text-sm font-bold text-[#2ECC71] hover:text-[#0D3D33] transition-colors flex items-center gap-1 bg-[#2ECC71]/10 hover:bg-[#2ECC71]/20 px-4 py-2 rounded-full">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-[#0D3D33]/10">
                  <p className="text-[#4A5568] font-medium text-lg">No recent orders.</p>
                </div>
              ) : (
                recentOrders.map((order, i) => (
                  <React.Fragment key={order.id}>
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + (i * 0.05) }}
                      className="flex items-center justify-between px-4 py-4 sm:px-5 sm:py-5 rounded-xl hover:bg-[#F7F5F0] transition-colors duration-200 ease-in-out cursor-pointer group" 
                      onClick={() => navigate(`/app/orders/${order.id}`)}
                    >
                      <div className="flex items-center gap-4 sm:gap-5">
                        <div className="w-14 h-14 rounded-full bg-[#0D3D33]/5 flex items-center justify-center group-hover:bg-[#0D3D33]/10 transition-colors">
                          <Scissors className="w-6 h-6 text-[#0D3D33] relative rotate-45 transform transition-transform group-hover:rotate-0" />
                        </div>
                        <div>
                          <div className="font-bold text-base sm:text-lg text-[#0D3D33] line-clamp-1">{order.customerName}</div>
                          <div className="text-xs sm:text-sm text-[#4A5568] font-medium mt-0.5">{order.dressType || 'Order'} • #{order.tokenId}</div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="font-bold text-lg sm:text-xl text-[#0D3D33]">{formatCurrency(order.price)}</div>
                        <div className={cn("text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full mt-2 inline-block uppercase tracking-wider shadow-sm", 
                          order.status === ORDER_STATUS.DELIVERED ? "bg-[#2ECC71] text-[#FFFFFF]" : 
                          order.status === ORDER_STATUS.READY ? "bg-blue-500 text-[#FFFFFF]" :
                          order.status === ORDER_STATUS.STITCHING ? "bg-orange-500 text-[#FFFFFF]" :
                          "bg-[#E2DDD6] text-[#0D3D33]"
                        )}>
                          {t(`orders.${order.status.toLowerCase()}`)}
                        </div>
                      </div>
                    </motion.div>
                    {i < recentOrders.length - 1 && <div className="h-px w-full bg-[#0D3D33]/5 my-1" />}
                  </React.Fragment>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column (Actions + Top Customers) */}
        <div className="space-y-6 sm:space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-2 gap-4"
          >
             {[
              { label: 'Customers', icon: Users, path: '/app/clients', bg: 'bg-[#0D3D33]/5', hover: 'hover:bg-[#0D3D33]/10', color: 'text-[#0D3D33]' },
              { label: 'Payments', icon: Calendar, path: '/app/payment-reminders', bg: 'bg-[#2ECC71]/10', hover: 'hover:bg-[#2ECC71]/20', color: 'text-[#2ECC71]' },
            ].map((cat, i) => (
              <div 
                key={i} 
                onClick={() => navigate(cat.path)}
                className={cn("bg-[#FFFFFF] rounded-3xl p-6 ring-1 ring-[#0D3D33]/5 shadow-sm flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md")}
              >
                <div className={cn("w-16 h-16 (rounded-full) rounded-2xl flex items-center justify-center mb-4 transition-colors", cat.bg, cat.hover)}>
                  <cat.icon className={cn("w-8 h-8", cat.color)} />
                </div>
                <div className="text-base font-bold text-[#0D3D33]">{cat.label}</div>
              </div>
            ))}
          </motion.div>

          {topCustomersData.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#FFFFFF] rounded-[1.5rem] ring-1 ring-[#0D3D33]/5 shadow-sm hover:shadow-md transition-all duration-300 ease-out p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#0D3D33]">Top Customers</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {topCustomersData.map((customer, i) => (
                  <div 
                    key={i} 
                    onClick={() => { if (customer.id) navigate(`/app/clients/${customer.id}`); }} 
                    className="flex flex-col items-center p-5 rounded-2xl ring-1 ring-[#0D3D33]/5 hover:ring-[#2ECC71] hover:shadow-md transition-all duration-300 ease-out cursor-pointer bg-[#F7F5F0]/50 hover:bg-[#FFFFFF]"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#0D3D33]/10 flex items-center justify-center text-[#0D3D33] font-bold text-2xl mb-4">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-base font-bold text-[#0D3D33] truncate w-full text-center">{customer.name.split(' ')[0]}</div>
                    <div className="text-sm text-[#4A5568] mt-1 font-medium">{customer.count} Order{customer.count !== 1 ? 's' : ''}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
