import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useShop } from '../contexts/ShopContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, onSnapshot, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { format, isBefore, startOfDay } from 'date-fns';
import { Plus, Search, Loader2, Filter, Package, MapPin, Calendar, CheckCircle2, Hash, Scissors, ArrowRight, AlertCircle, ChevronDown, X, LayoutGrid, List, Layers, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, isOrderOverdue } from '../lib/utils';
import { ORDER_STATUS } from '../lib/config';
import { toast } from 'sonner';
import { useStaff } from '../hooks/useStaff';
import { User } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export default function Orders() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const { settings } = useShop();
  const navigate = useNavigate();
  const { staff } = useStaff();
  const { addNotification } = useNotifications();
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
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
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
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const history = { ...(order.statusHistory || {}) };
      history[newStatus] = new Date().toISOString();

      await updateDoc(doc(db, 'orders', orderId), { 
        status: newStatus, 
        statusHistory: history,
        updatedAt: serverTimestamp() 
      });
      toast.success(t('orders.statusUpdated') || 'Status updated successfully');

      if (order) {
        if (newStatus === ORDER_STATUS.STITCHING) {
          addNotification({
            type: 'order_started',
            title: 'Order Started',
            message: `Order #${order.tokenId} for ${order.customerName} is now being stitched.`,
            orderId: order.id,
            customerId: order.customerId
          });
        } else if (newStatus === ORDER_STATUS.READY) {
          addNotification({
            type: 'order_ready',
            title: 'Order Ready',
            message: `${order.customerName}'s suit is ready for pickup or delivery.`,
            orderId: order.id,
            customerId: order.customerId
          });
          
          // Trigger Push Notification
          fetch('/api/notify/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shopId: user?.uid,
              title: "🎉 Order Ready!",
              body: `${order.customerName} ka suit tayar hai - #${order.tokenId}`,
              orderId: order.id
            })
          }).catch(console.error);
        } else if (newStatus === ORDER_STATUS.DELIVERED) {
          addNotification({
            type: 'order_delivered',
            title: 'Order Delivered',
            message: `Order #${order.tokenId} was delivered to ${order.customerName}.`,
            orderId: order.id,
            customerId: order.customerId
          });
          
          if (order.assignedStaffId) {
            const staffMember = staff.find(s => s.id === order.assignedStaffId);
            if (staffMember) {
              try {
                await addDoc(collection(db, 'payroll'), {
                  userId: user.uid,
                  staffId: staffMember.id,
                  staffName: staffMember.name,
                  orderId: order.id,
                  tokenId: order.tokenId,
                  customerName: order.customerName,
                  orderPrice: Number(order.price || 0),
                  paymentAmount: (staffMember.salaryType === 'per-order' || staffMember.salaryType === 'per_order' || staffMember.salaryType === 'per_suit') ? Number(staffMember.salaryAmount || 0) : 0,
                  paidStatus: 'pending',
                  createdAt: serverTimestamp()
                });
              } catch (payrollError) {
                console.error('Error creating payroll entry:', payrollError);
              }
            }
          }
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

  const uniqueDressTypes = useMemo(() => Array.from(new Set(orders.map(o => o.dressType))).filter(Boolean), [orders]);

  const filteredOrders = useMemo(() => {
    const filtered = orders.filter(order => {
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

    return filtered.sort((a, b) => {
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
  }, [orders, filter, genderFilter, dressTypeFilter, dateFilter, showOverdue, searchTerm, sortBy]);

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
    <div className={cn("w-full max-w-6xl mx-auto space-y-6", isRTL && "font-urdu")} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-medium tracking-tight text-on-surface">
            {t('layout.orders')}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage and track your tailoring orders</p>
        </div>
        <Button 
          onClick={() => navigate('/app/new-order')}
          className="hidden sm:flex rounded-full shadow-soft hover:shadow-soft-hover transition-all bg-primary text-white h-11 px-6 font-medium w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </motion.div>

      {/* Search & Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            placeholder="Search Order ID or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-2xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none placeholder:text-on-surface-variant transition-all shadow-sm"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {['All', ...Object.values(ORDER_STATUS)].map((statusValue) => (
            <button
              key={statusValue}
              onClick={() => setFilter(statusValue)}
              className={cn(
                "px-5 py-2.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap uppercase tracking-wider",
                filter === statusValue
                  ? "bg-primary text-white shadow-soft"
                  : "bg-surface text-on-surface border border-outline-variant hover:bg-surface-container hover:text-on-surface"
              )}
            >
              {statusValue === 'All' ? 'All Orders' : statusValue}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Order List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col gap-4">
             {[1, 2, 3, 4, 5].map((i) => (
               <div key={i} className="h-24 bg-surface rounded-2xl border border-outline-variant animate-pulse"></div>
             ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-16 text-center bg-surface border border-outline-variant rounded-[2rem] flex flex-col items-center shadow-sm"
          >
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-6">
              <Scissors className="h-8 w-8 text-on-surface-variant" />
            </div>
            <h3 className="text-xl font-medium text-on-surface">No orders found</h3>
            <p className="text-on-surface-variant text-sm mt-2 mb-8">Ready to create a new order?</p>
            <Button 
              onClick={() => navigate('/app/new-order')}
              className="rounded-full shadow-soft hover:shadow-soft-hover transition-all bg-primary text-white h-12 px-8 font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Order
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <div 
                  className="bg-surface rounded-2xl border border-outline-variant hover:border-primary hover:shadow-md transition-all cursor-pointer shadow-sm p-4 sm:p-5 flex items-center gap-4 group" 
                  onClick={() => navigate(`/app/orders/${order.id}`)}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex-shrink-0 bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Scissors className="w-5 h-5 sm:w-6 sm:h-6 relative rotate-45 transform transition-transform group-hover:rotate-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base sm:text-lg font-medium text-on-surface truncate">{order.customerName}</div>
                    <div className="text-xs sm:text-sm text-on-surface-variant mt-0.5">{order.dressType || 'Custom Order'}</div>
                    <div className="text-[10px] sm:text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                      <Hash className="w-3 h-3"/> {order.tokenId || order.id.slice(0,8)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                    <div className="text-base sm:text-lg font-medium text-on-surface">${(order.price || 0).toLocaleString()}</div>
                    <div className={cn(
                      "text-[10px] sm:text-[11px] font-semibold px-2.5 py-1.5 rounded-full inline-block uppercase tracking-wider", 
                      order.status === ORDER_STATUS.DELIVERED ? "bg-secondary/10 text-secondary" : "bg-surface-container-highest text-on-surface-variant"
                    )}>
                      {order.status}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}