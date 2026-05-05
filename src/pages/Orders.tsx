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
import { motion, AnimatePresence } from 'framer-motion';
import { cn, isOrderOverdue } from '../lib/utils';
import { ORDER_STATUS } from '../lib/config';
import { toast } from 'sonner';
import { sendOrderReadyMessage } from '../lib/whatsapp';
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
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const history = { ...(order.statusHistory || {}) };
      history[newStatus] = new Date().toISOString();

      await updateDoc(doc(db, 'shops', user!.uid, 'orders', orderId), { 
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
                await addDoc(collection(db, 'shops', user.uid, 'payroll'), {
                  staffId: staffMember.id,
                  staffName: staffMember.name,
                  orderId: order.id,
                  tokenId: order.tokenId,
                  customerName: order.customerName,
                  orderPrice: Number(order.price || 0),
                  paymentAmount: staffMember.salaryType === 'per-order' ? Number(staffMember.salaryAmount || 0) : 0,
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
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 mb-8"
      >
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-surface-variant transition-colors text-on-surface hidden lg:block">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
          </button>
          <h1 className="text-[28px] md:text-[32px] font-display font-semibold tracking-tight text-on-surface">{t('layout.orders')}</h1>
        </div>
      </motion.div>

      {/* Toggle Stats Pills */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 rounded-full bg-primary-container text-on-primary-container text-center py-2.5 text-[14px] font-medium shadow-sm">Total:   {orders.length.toString().padStart(2, '0')}</div>
        <div className="flex-1 rounded-full bg-surface border border-outline-variant text-on-surface text-center py-2.5 text-[14px] font-medium shadow-sm">Filtered: {filteredOrders.length.toString().padStart(2, '0')}</div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative w-full sm:w-80 group">
          <input
            type="text"
            placeholder="Enter Order ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 rounded-full bg-surface-container-highest border border-outline-variant pl-12 pr-4 focus:outline-none focus:border-primary text-on-surface placeholder:text-on-surface-variant transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
        </div>
        <div className="relative w-full sm:w-64">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full h-12 rounded-full bg-surface border border-outline-variant pl-4 pr-10 appearance-none focus:outline-none focus:border-primary text-[14px] font-medium text-on-surface shadow-sm cursor-pointer"
          >
            <option value="All">All Statuses</option>
            {Object.values(ORDER_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant pointer-events-none" />
        </div>
      </div>

      {/* Order List */}
      <div className="space-y-3 pb-8">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-surface rounded-3xl border border-outline-variant shadow-sm mt-4">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 text-outline-variant"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
            <h3 className="text-[18px] font-semibold text-on-surface mb-1">No orders yet</h3>
            <p className="text-[14px] text-on-surface-variant">Try adjusting your filters or search</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="bg-surface rounded-3xl p-5 flex items-center gap-4 shadow-sm border border-outline-variant hover:bg-surface-variant hover:border-primary/30 transition-all cursor-pointer" onClick={() => navigate(`/dashboard/orders/${order.id}`)}>
              <div className="w-14 h-14 rounded-full flex-shrink-0 bg-surface-container flex items-center justify-center text-primary overflow-hidden">
                <Scissors className="w-6 h-6 opacity-80" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[16px] font-semibold text-on-surface truncate mb-0.5">{order.dressType || 'Custom Order'}</div>
                <div className="text-[13px] font-medium text-on-surface-variant">ID: {order.tokenId || order.id.slice(0,8)}</div>
                <div className="text-[13px] text-on-surface-variant mt-0.5">{order.createdAt ? startOfDay(order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000) : new Date(order.createdAt)).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                <div className="text-[16px] font-bold text-primary mb-1">{(order.price || 0).toLocaleString()}</div>
                <div className={cn("text-[11px] font-medium px-3 py-1.5 rounded-full inline-block whitespace-nowrap", order.status === ORDER_STATUS.DELIVERED ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-high text-on-surface-variant")}>
                    {order.status}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}