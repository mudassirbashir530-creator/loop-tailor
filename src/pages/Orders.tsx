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
    <div className={cn("page pb-[100px]", isRTL && "font-urdu")} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Bar */}
      <div className="bg-white border-b border-[#E2DDD6] px-4 py-4 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-xl font-bold text-[#0D3D33]">{t('layout.orders')}</h1>
      </div>

      {/* Search & Filters */}
      <div className="px-4 mt-5 mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#888888] pointer-events-none" />
          <input
            type="text"
            placeholder="Search Order ID or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-full border border-[#E2DDD6] bg-[#F7F5F0] focus:bg-white text-[#111111] text-sm focus:border-[#0D3D33] focus:outline-none placeholder:text-[#555555] shadow-sm font-bold"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {['All', ...Object.values(ORDER_STATUS)].map((statusValue) => (
            <button
              key={statusValue}
              onClick={() => setFilter(statusValue)}
              className={cn(
                "px-5 py-2 rounded-full text-[13px] font-bold transition-all whitespace-nowrap border uppercase tracking-wider",
                filter === statusValue
                  ? "bg-[#0D3D33] text-white border-[#0D3D33]"
                  : "bg-white text-[#555555] border-[#E2DDD6] hover:bg-[#F7F5F0]"
              )}
            >
              {statusValue === 'All' ? 'All Orders' : statusValue}
            </button>
          ))}
        </div>
      </div>

      {/* Order List */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex flex-col gap-3">
             {[1, 2, 3, 4, 5].map((i) => (
               <div key={i} className="h-24 bg-white rounded-xl border border-[#E2DDD6] animate-pulse"></div>
             ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card text-center !py-12 !border-[#E2DDD6] flex flex-col items-center shadow-sm"
          >
            <div className="w-16 h-16 rounded-full bg-[#0D3D33]/10 flex items-center justify-center mb-4">
              <Scissors className="h-8 w-8 text-[#0D3D33]" />
            </div>
            <h3 className="text-lg font-bold text-[#111111]">No orders found</h3>
            <p className="text-[#555555] text-sm mt-1 mb-6">Create a new order to get started</p>
            <Link 
              to="/dashboard/orders/new"
              className="btn-primary"
            >
              <Plus className="h-5 w-5 mr-no-rtl ml-auto-rtl mr-2" />
              New Order
            </Link>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div 
                  className="card !m-0 flex items-center gap-4 !border-[#E2DDD6] hover:border-[#0D3D33] transition-all cursor-pointer shadow-sm !p-4" 
                  onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                >
                  <div className="w-14 h-14 rounded-full flex-shrink-0 bg-[#F7F5F0] border border-[#E2DDD6] flex items-center justify-center text-[#555555]">
                    <Scissors className="w-6 h-6 opacity-80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-[#111111] truncate">{order.customerName}</div>
                    <div className="text-[13px] font-medium text-[#555555] mt-0.5">{order.dressType || 'Custom Order'}</div>
                    <div className="text-[11px] font-bold text-[#888888] mt-1 flex items-center gap-1"><Hash className="w-3 h-3"/> {order.tokenId || order.id.slice(0,8)}</div>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                    <div className="text-[15px] font-bold text-[#0D3D33]">${(order.price || 0).toLocaleString()}</div>
                    <div className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-md inline-block uppercase tracking-wide", 
                      order.status === ORDER_STATUS.DELIVERED ? "bg-[#2ECC71]/10 text-[#2ECC71]" : "bg-[#F7F5F0] text-[#555555] border border-[#E2DDD6]"
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

      {/* FAB Button */}
      <Link 
        to="/dashboard/orders/new"
        className="fab-btn fixed bottom-[80px] right-4 z-50 text-white"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}