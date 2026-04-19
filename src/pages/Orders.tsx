import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useShop } from '../contexts/ShopContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { format, isBefore, startOfDay } from 'date-fns';
import { Plus, Search, Loader2, Filter, Package, MapPin, Calendar, CheckCircle2, Clock, Hash, Scissors, ArrowRight, AlertCircle, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, isOrderOverdue } from '../lib/utils';
import { ORDER_STATUS } from '../lib/config';
import { toast } from 'sonner';
import { sendWhatsappNotification } from '../lib/notifications';
import { useStaff } from '../hooks/useStaff';
import { User } from 'lucide-react';

export default function Orders() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const { settings } = useShop();
  const navigate = useNavigate();
  const { staff } = useStaff();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // New filters
  const [genderFilter, setGenderFilter] = useState('All');
  const [dressTypeFilter, setDressTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [showOverdue, setShowOverdue] = useState(false);
  const [sortBy, setSortBy] = useState('Newest First');

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const q = query(collection(db, 'shops', user.uid, 'orders'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      }));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'shops', user!.uid, 'orders', orderId), { 
        status: newStatus, 
        updatedAt: serverTimestamp() 
      });
      toast.success(t('orders.statusUpdated') || 'Status updated successfully');

      // Send WhatsApp Notification if configured and status is Ready/Delivered
      if (settings.enableWhatsappNotifications && (newStatus === ORDER_STATUS.READY || newStatus === ORDER_STATUS.DELIVERED)) {
        const order = orders.find(o => o.id === orderId);
        if (order && order.phone) {
          await sendWhatsappNotification({
            to: order.phone,
            customerName: order.customerName,
            dressType: order.dressType || 'Suit',
            token: order.tokenId,
            shopName: settings.name || 'Loop Tailor',
            status: newStatus,
            orderId: order.id,
            shopId: user!.uid
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case ORDER_STATUS.PENDING: return 'bg-slate-100 text-slate-700';
      case ORDER_STATUS.STITCHING: return 'bg-blue-100 text-blue-700';
      case ORDER_STATUS.READY: return 'bg-amber-100 text-amber-700';
      case ORDER_STATUS.DELIVERED: return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const isOverdue = (deliveryDate: string, status: string) => {
    if (!deliveryDate || status === ORDER_STATUS.DELIVERED) return false;
    return isOrderOverdue(deliveryDate);
  };

  const uniqueDressTypes = Array.from(new Set(orders.map(o => o.dressType))).filter(Boolean);

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filter === 'All' || order.status === filter;
    const matchesGender = genderFilter === 'All' || order.gender === genderFilter;
    const matchesDressType = dressTypeFilter === 'All' || order.dressType === dressTypeFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'All Time' && order.createdAt) {
      const orderDate = order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000) : new Date(order.createdAt || 0);
      const today = new Date();
      if (dateFilter === 'Today') {
        matchesDate = orderDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'This Week') {
        const weekAgo = new Date(today.setDate(today.getDate() - 7));
        matchesDate = orderDate >= weekAgo;
      } else if (dateFilter === 'This Month') {
        matchesDate = orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear();
      }
    }

    let matchesOverdue = true;
    if (showOverdue) {
      matchesOverdue = isOverdue(order.deliveryDate, order.status);
    }

    const matchesSearch = 
      (order.tokenId && order.tokenId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.dressType.toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchesStatus && matchesGender && matchesDressType && matchesDate && matchesOverdue && matchesSearch;
  });

  filteredOrders.sort((a, b) => {
    if (sortBy === 'Newest First') {
      const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    } else if (sortBy === 'Oldest First') {
      const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt || 0);
      return dateA.getTime() - dateB.getTime();
    } else if (sortBy === 'Delivery Date') {
      const dateA = new Date(a.deliveryDate || 0);
      const dateB = new Date(b.deliveryDate || 0);
      return dateA.getTime() - dateB.getTime();
    } else if (sortBy === 'Price High-Low') {
      return (b.price || 0) - (a.price || 0);
    } else if (sortBy === 'Price Low-High') {
      return (a.price || 0) - (b.price || 0);
    }
    return 0;
  });

  const activeFilterCount = (filter !== 'All' ? 1 : 0) + 
                            (genderFilter !== 'All' ? 1 : 0) + 
                            (dressTypeFilter !== 'All' ? 1 : 0) + 
                            (dateFilter !== 'All Time' ? 1 : 0) + 
                            (showOverdue ? 1 : 0);

  const clearAllFilters = () => {
    setFilter('All');
    setGenderFilter('All');
    setDressTypeFilter('All');
    setDateFilter('All Time');
    setShowOverdue(false);
    setSearchTerm('');
  };

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-slate-900">{t('orders.title')}</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2 font-medium">{t('orders.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
          <div className="relative w-full sm:w-80 group">
            <input
              type="text"
              placeholder={t('orders.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn("w-full h-14 rounded-2xl bg-gray-100 shadow-neu-pressed-sm border-none text-base font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
            />
            <div className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors", isRTL ? "right-4" : "left-4")}>
              <Search className="h-5 w-5" />
            </div>
          </div>
          <Button 
            onClick={() => navigate('/dashboard/orders/new')} 
            className="w-full sm:w-auto h-14 rounded-2xl bg-gray-100 shadow-neu-sm text-brand-primary hover:shadow-neu-pressed-sm px-8 font-black text-base transition-all hover:scale-105 active:scale-95 border-none"
          >
            <Plus className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />
            {t('orders.newOrder')}
          </Button>
        </div>
      </motion.div>

      <div className="flex flex-col gap-6">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-4">
          {['All', ORDER_STATUS.PENDING, ORDER_STATUS.STITCHING, ORDER_STATUS.READY, ORDER_STATUS.DELIVERED].map((status) => (
            <Button
              key={status}
              variant="ghost"
              size="sm"
              onClick={() => setFilter(status)}
              className={cn(
                "rounded-xl px-6 h-12 font-bold transition-all border-none",
                filter === status 
                  ? "bg-gray-100 shadow-neu-pressed text-brand-primary" 
                  : "bg-gray-100 shadow-neu-sm text-slate-500 hover:text-brand-primary hover:shadow-neu-pressed-sm"
              )}
            >
              {t(`orders.${status.toLowerCase()}`)}
            </Button>
          ))}
        </div>

        {/* Advanced Filters Row */}
        <div className="flex flex-wrap items-center gap-4 bg-gray-100 shadow-neu-pressed-sm p-3 rounded-2xl border-none">
          <div className="flex items-center gap-2 px-3 border-r border-gray-300/50">
            <Filter className="h-4 w-4 text-brand-primary" />
            <span className="text-sm font-bold text-slate-700">Filters</span>
          </div>

          {/* Gender Filter */}
          <div className="flex bg-gray-100 shadow-neu-sm rounded-xl p-1">
            {['All', 'male', 'female', 'kids'].map(g => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all",
                  genderFilter === g ? "bg-gray-100 shadow-neu-pressed-sm text-brand-primary" : "text-slate-500 hover:text-brand-primary"
                )}
              >
                {g === 'All' ? 'All Genders' : g}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <div className="flex bg-gray-100 shadow-neu-sm rounded-xl p-1">
            {['All Time', 'Today', 'This Week', 'This Month'].map(d => (
              <button
                key={d}
                onClick={() => setDateFilter(d)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  dateFilter === d ? "bg-gray-100 shadow-neu-pressed-sm text-brand-primary" : "text-slate-500 hover:text-brand-primary"
                )}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Dress Type Dropdown */}
          <select 
            value={dressTypeFilter}
            onChange={(e) => setDressTypeFilter(e.target.value)}
            className="h-10 px-4 rounded-xl bg-gray-100 shadow-neu-sm border-none text-xs font-bold text-slate-700 focus:ring-0 cursor-pointer outline-none"
          >
            <option value="All">All Types</option>
            {uniqueDressTypes.map((type: any) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Overdue Toggle */}
          <button
            onClick={() => setShowOverdue(!showOverdue)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all h-10",
              showOverdue ? "bg-gray-100 shadow-neu-pressed-sm text-red-600" : "bg-gray-100 shadow-neu-sm text-slate-500 hover:text-red-500"
            )}
          >
            <AlertCircle className="h-4 w-4" />
            Overdue
          </button>

          {/* Sort Dropdown */}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 px-4 rounded-xl bg-gray-100 shadow-neu-sm border-none text-xs font-bold text-slate-700 focus:ring-0 cursor-pointer outline-none"
            >
              <option value="Newest First">Newest First</option>
              <option value="Oldest First">Oldest First</option>
              <option value="Delivery Date">Delivery Date</option>
              <option value="Price High-Low">Price High-Low</option>
              <option value="Price Low-High">Price Low-High</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Bar */}
        <AnimatePresence>
          {activeFilterCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between bg-gray-100 shadow-neu-sm rounded-xl px-5 py-3 border-none"
            >
              <div className="text-sm font-bold text-brand-primary flex items-center gap-3 flex-wrap">
                <span>Showing {filteredOrders.length} orders</span>
                <span className="text-brand-primary/40">•</span>
                {filter !== 'All' && <span className="bg-gray-100 shadow-neu-pressed-sm px-3 py-1 rounded-lg text-xs font-black">{filter}</span>}
                {genderFilter !== 'All' && <span className="bg-gray-100 shadow-neu-pressed-sm px-3 py-1 rounded-lg text-xs font-black capitalize">{genderFilter}</span>}
                {dressTypeFilter !== 'All' && <span className="bg-gray-100 shadow-neu-pressed-sm px-3 py-1 rounded-lg text-xs font-black">{dressTypeFilter}</span>}
                {dateFilter !== 'All Time' && <span className="bg-gray-100 shadow-neu-pressed-sm px-3 py-1 rounded-lg text-xs font-black">{dateFilter}</span>}
                {showOverdue && <span className="bg-gray-100 shadow-neu-pressed-sm text-red-600 px-3 py-1 rounded-lg text-xs font-black">Overdue</span>}
              </div>
              <button 
                onClick={clearAllFilters}
                className="text-xs font-bold text-slate-500 hover:text-brand-primary flex items-center gap-1.5"
              >
                <X className="h-3.5 w-3.5" /> Clear All
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="h-12 w-12 text-brand-primary animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('orders.loading')}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredOrders.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full p-16 text-center bg-gray-100 shadow-neu-pressed-sm rounded-[2.5rem] flex flex-col items-center space-y-4 border-none"
              >
                <div className="h-16 w-16 bg-gray-100 shadow-neu-sm rounded-2xl flex items-center justify-center text-slate-400">
                  <Package className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{t('orders.noOrders')}</h3>
                  <p className="text-slate-500 font-medium">
                    {filter === 'All' ? t('orders.startFirstOrder') : t('orders.noOrdersFound').replace('{{status}}', t(`orders.${filter.toLowerCase()}`))}
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/dashboard/orders/new')}
                  variant="outline"
                  className="rounded-xl font-bold bg-gray-100 shadow-neu-sm border-none text-brand-primary hover:shadow-neu-pressed-sm mt-4"
                >
                  {t('orders.createOrder')}
                </Button>
              </motion.div>
            ) : (
              filteredOrders.map((order, index) => {
                const overdue = isOverdue(order.deliveryDate, order.status);
                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={cn(
                      "border-none shadow-neu rounded-[2.5rem] overflow-hidden hover:-translate-y-1 transition-all group",
                      overdue ? "bg-red-50/50" : "bg-gray-100"
                    )}>
                      <CardHeader className="p-7 pb-4 flex flex-row items-start justify-between space-y-0">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "p-2 rounded-xl shadow-neu-pressed-sm",
                              overdue ? "bg-red-100 text-red-600" : "bg-gray-100 text-brand-primary"
                            )}>
                              <Hash className="h-4 w-4" />
                            </div>
                            <span className="text-xl font-black text-slate-900">{order.tokenId || '---'}</span>
                            {overdue && (
                              <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 shadow-neu-pressed-sm text-red-600 text-[10px] font-black rounded-xl uppercase tracking-wider">
                                <AlertCircle className="h-3 w-3" />
                                Overdue
                              </span>
                            )}
                          </div>
                          <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-brand-primary transition-colors line-clamp-1 mt-2">
                            {order.customerName}
                          </CardTitle>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-neu-pressed-sm",
                            getStatusColor(order.status)
                          )}>
                            {t(`orders.${order.status.toLowerCase()}`)}
                          </span>
                          <span className={cn(
                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-neu-sm",
                            (!order.paymentStatus || order.paymentStatus === 'Unpaid') ? "bg-red-50 text-rose-500" :
                            order.paymentStatus === 'Partial' ? "bg-blue-50 text-blue-600" :
                            "bg-emerald-50 text-emerald-600"
                          )}>
                            {order.paymentStatus || 'Unpaid'}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-7 pt-0 space-y-6">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                              <Scissors className="h-3.5 w-3.5 text-brand-primary" /> {t('orders.dressType')}
                            </span>
                            <p className="font-bold text-slate-900">{order.dressType}</p>
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-brand-primary" /> {t('orders.rack')}
                            </span>
                            <p className="font-bold text-slate-900">{order.rackLocation || '---'}</p>
                          </div>
                          <div className="space-y-1.5 col-span-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-brand-primary" /> Assigned Worker
                            </span>
                            <p className="font-bold text-slate-900">
                              {order.assignedWorkerId 
                                ? staff.find(w => w.id === order.assignedWorkerId)?.name || 'Unknown'
                                : 'Unassigned'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200/50 flex items-center justify-between gap-2">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-brand-primary" /> {t('orders.delivery')}
                            </span>
                            <span className={cn("text-sm font-black mt-1", overdue ? "text-red-600" : "text-slate-900")}>
                              {format(new Date(order.deliveryDate), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {order.status === ORDER_STATUS.PENDING && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => updateStatus(order.id, ORDER_STATUS.STITCHING)}
                                className="text-amber-600 hover:text-amber-700 bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm font-black text-xs rounded-xl h-10 px-4 border-none"
                              >
                                <Scissors className={cn("h-4 w-4", isRTL ? "ml-1.5" : "mr-1.5")} />
                                {t('orders.start')}
                              </Button>
                            )}
                            {order.status === ORDER_STATUS.STITCHING && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => updateStatus(order.id, ORDER_STATUS.READY)}
                                className="text-blue-600 hover:text-blue-700 bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm font-black text-xs rounded-xl h-10 px-4 border-none"
                              >
                                <Package className={cn("h-4 w-4", isRTL ? "ml-1.5" : "mr-1.5")} />
                                {t('orders.ready')}
                              </Button>
                            )}
                            {order.status === ORDER_STATUS.READY && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => updateStatus(order.id, ORDER_STATUS.DELIVERED)}
                                className="text-emerald-600 hover:text-emerald-700 bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm font-black text-xs rounded-xl h-10 px-4 border-none"
                              >
                                <CheckCircle2 className={cn("h-4 w-4", isRTL ? "ml-1.5" : "mr-1.5")} />
                                {t('orders.deliver')}
                              </Button>
                            )}
                            {order.status === ORDER_STATUS.DELIVERED && (
                              <div className="bg-gray-100 shadow-neu-pressed-sm text-emerald-600 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4" />
                                {t('orders.done')}
                              </div>
                            )}
                            <Button 
                              size="icon" 
                              variant="outline" 
                              onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                              className="rounded-xl h-10 w-10 bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm border-none text-brand-primary transition-all"
                            >
                              <ArrowRight className={cn("h-5 w-5", isRTL ? "rotate-180" : "")} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
