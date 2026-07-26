import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useShop } from '../contexts/ShopContext';
import { ORDER_STATUS, ORDER_STATUS_TRANSITIONS, isValidStatusTransition, OrderStatus } from '../lib/config';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot, collection, query, where, addDoc, setDoc } from 'firebase/firestore';
import { Invoice } from '../components/Invoice';
import { InvoiceActions } from '../components/InvoiceActions';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, ArrowRight, Calendar, MapPin, Ruler, User, Phone, Hash, CheckCircle, Edit2, Save, X, Loader2, Clock, CreditCard, Trash2, Home, Store, Scissors, AlertCircle, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { PageWrapper } from '../components/animations/PageWrapper';
import { MeasurementsDisplay } from '../components/MeasurementsDisplay';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { formatWhatsAppNumber } from '../utils/phoneFormatter';
import { getOrderConfirmationMessage, getOrderReadyMessage, getPaymentReminderMessage, openWhatsApp } from '../utils/whatsappMessages';
import { createNotification, sendWhatsappNotification } from '../lib/notifications';
import { useWorkers } from '../hooks/useWorkers';
import { WhatsAppIcon } from '../components/icons/WhatsAppIcon';
import { OrderTimeline } from '../components/OrderTimeline';

export default function OrderDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const { settings } = useShop();
  const navigate = useNavigate();
  const { workers: staff } = useWorkers();
  const [order, setOrder] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationForm, setCancellationForm] = useState({
    reason: 'Customer Request',
    customReason: '',
    refundGiven: false,
    refundAmount: '',
    refundMethod: 'Cash',
    refundDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'Cash', date: format(new Date(), 'yyyy-MM-dd') });
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [customWaMessage, setCustomWaMessage] = useState('');
  const [showCustomWa, setShowCustomWa] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [shopDoc, setShopDoc] = useState<any>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [customerPhone, setCustomerPhone] = useState<string | null>(null);
  const [customerDoc, setCustomerDoc] = useState<any>(null);
  const [customerPhoneLoading, setCustomerPhoneLoading] = useState(false);
  const [isUpdateCustomerOpen, setIsUpdateCustomerOpen] = useState(false);
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  useEffect(() => {
    if (!user || !id) return;
    
    setLoading(true);
    
    const unsubOrder = onSnapshot(doc(db, 'orders', id), (docSnap) => {
      if (docSnap.exists()) {
        const oData: any = { id: docSnap.id, ...docSnap.data() };
        setOrder(oData);
        setEditData({ ...oData });

        // Auto-sync full order payload & measurements map to publicOrders for universal worker access
        const tokenNumber = oData.tokenId || oData.id?.substring(0, 8).toUpperCase();
        const syncTargets = Array.from(new Set([oData.id, docSnap.id, tokenNumber, oData.tokenId].filter(Boolean)));
        syncTargets.forEach(tId => {
          if (typeof tId === 'string') {
            setDoc(doc(db, 'publicOrders', tId), oData, { merge: true }).catch(() => {});
          }
        });
      } else {
        setOrder(null);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `orders/${id}`);
      setLoading(false);
    });

    const unsubShop = onSnapshot(doc(db, 'settings', user.uid), (shopSnap) => {
      if (shopSnap.exists()) {
        setShop(shopSnap.data());
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `settings/${user.uid}`));

    const unsubShopDoc = onSnapshot(doc(db, 'shops', user.uid), (shopSnap) => {
      if (shopSnap.exists()) {
        setShopDoc(shopSnap.data());
      }
    }, (error) => {
      console.warn("Silent failure subscribing to shops:", error);
    });

    const qPayments = query(collection(db, `orders/${id}/payments`));
    const unsubPayments = onSnapshot(qPayments, (paymentsSnap) => {
      const pData = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPaymentsList(pData.sort((a: any, b: any) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      }));
    }, (error) => handleFirestoreError(error, OperationType.GET, `orders/${id}/payments`));

    return () => {
      unsubOrder();
      unsubShop();
      unsubShopDoc();
      unsubPayments();
    };
  }, [user, id]);

  // Handle real-time client/customer document updates
  useEffect(() => {
    if (!user || !order) return;
    const clientId = order.clientId || order.customerId;
    if (!clientId) {
      setCustomerPhone(null);
      setCustomerDoc(null);
      return;
    }

    setCustomerPhoneLoading(true);

    let activeUnsub: (() => void) | null = null;

    const checkAndSubscribe = async () => {
      try {
        const clientRef = doc(db, 'clients', clientId);
        const clientSnap = await getDoc(clientRef);
        
        if (clientSnap.exists()) {
          activeUnsub = onSnapshot(clientRef, (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setCustomerDoc({ id: clientId, collection: 'clients', ...data });
              const phone = data.phone || data.phoneNumber || data.mobile || data.contact || null;
              setCustomerPhone(phone);
            }
            setCustomerPhoneLoading(false);
          });
        } else {
          const customerRef = doc(db, 'customers', clientId);
          activeUnsub = onSnapshot(customerRef, (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setCustomerDoc({ id: clientId, collection: 'customers', ...data });
              const phone = data.phone || data.phoneNumber || data.mobile || data.contact || null;
              setCustomerPhone(phone);
            } else {
              setCustomerDoc(null);
              setCustomerPhone(null);
            }
            setCustomerPhoneLoading(false);
          });
        }
      } catch (err) {
        console.error("Error subscribing to customer/client doc:", err);
        setCustomerPhoneLoading(false);
      }
    };

    checkAndSubscribe();

    return () => {
      if (activeUnsub) {
        activeUnsub();
      }
    };
  }, [user, order]);

  const handleUpdateCustomerProfile = async (newPhone: string) => {
    if (!user || !order) return;
    const clientId = order.clientId || order.customerId;
    if (!clientId) {
      toast.error("Customer reference missing on order");
      return;
    }

    try {
      const colName = customerDoc?.collection || 'clients';
      const docRef = doc(db, colName, clientId);
      
      await updateDoc(docRef, {
        phone: newPhone,
        phoneNumber: newPhone,
        updatedAt: serverTimestamp()
      });

      // Also update isEditing fields or order doc phone so layout stays fully synchronized
      if (order.id) {
        await updateDoc(doc(db, 'orders', order.id), {
          phone: newPhone,
          updatedAt: serverTimestamp()
        });
      }

      toast.success("Customer profile phone number updated successfully!");
      setIsUpdateCustomerOpen(false);
    } catch (error) {
      console.error("Error updating customer profile:", error);
      toast.error("Failed to update customer profile");
    }
  };

  const handleDeleteOrder = async () => {
    if (!window.confirm(t('orderDetails.deleteConfirm'))) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'orders', id!));
      toast.success(t('orderDetails.orderDeleted') || 'Order deleted successfully');
      navigate('/app/orders');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${id}`);
      setIsDeleting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!isValidStatusTransition(order.status as OrderStatus, newStatus)) {
      toast.error(`Cannot transition from ${order.status} to ${newStatus}`);
      return;
    }

    try {
      const history = { ...(order.statusHistory || {}) };
      history[newStatus] = new Date().toISOString();
      await updateDoc(doc(db, 'orders', id!), { 
        status: newStatus, 
        statusHistory: history,
        updatedAt: serverTimestamp() 
      });
      toast.success(t('orderDetails.statusUpdated') || 'Status updated successfully');


      await createNotification(user.uid, {
        title: "Order Status Updated",
        message: `${order.customerName}'s ${order.dressType} is now ${newStatus}`,
        type: 'order_status',
        orderId: order.id
      });

      if (settings.enableWhatsappNotifications && order.phone) {
        await sendWhatsappNotification({
          to: order.phone,
          customerName: order.customerName,
          dressType: order.dressType || 'Suit',
          token: order.tokenId || '',
          shopName: settings.name || 'Loop Tailor',
          status: newStatus,
          orderId: id!,
          shopId: user.uid
        });
      }

      if (newStatus === ORDER_STATUS.DELIVERED && order.workerId) {
        const staffMember = staff.find(s => s.id === order.workerId);
        if (staffMember) {
          try {
            await addDoc(collection(db, 'payroll'), {
              userId: user.uid,
              staffId: staffMember.id,
              staffName: staffMember.name,
              orderId: id,
              tokenId: order.tokenId,
              customerName: order.customerName,
              orderPrice: Number(order.price || 0),
              paymentAmount: ((staffMember as any).salaryType === 'per_order' || (staffMember as any).salaryType === 'per_suit' || (staffMember as any).salaryType === 'per-order') ? Number((staffMember as any).salaryAmount || 0) : 0,
              paidStatus: 'pending',
              createdAt: serverTimestamp()
            });
          } catch (payrollError) {
            console.error('Error creating payroll entry:', payrollError);
            toast.error('Failed to create payroll entry');
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const history = { ...(order.statusHistory || {}) };
      if (editData.status !== order.status) {
        history[editData.status] = new Date().toISOString();
      }
      await updateDoc(doc(db, 'orders', id!), {
        ...editData,
        statusHistory: history,
        updatedAt: serverTimestamp()
      });
      setIsEditing(false);
      toast.success(t('orderDetails.orderUpdated') || 'Order updated successfully');

      // In case status was changed directly in the edit modal to Ready or Delivered
      if (editData.status !== order.status) {
        if (settings.enableWhatsappNotifications && editData.status !== ORDER_STATUS.PENDING) {
          const phoneNumber = editData.phone || order.phone;
          if (phoneNumber) {
             await sendWhatsappNotification({
               to: phoneNumber,
               customerName: editData.customerName || order.customerName,
               dressType: editData.dressType || order.dressType || 'Suit',
               token: order.tokenId,
               shopName: settings.name || 'Loop Tailor',
               status: editData.status,
               orderId: id!,
               shopId: user.uid
             });
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const totalPaid = paymentsList.reduce((sum: number, p: any) => sum + Number(p.amount), 0) + Number(order?.advancePayment || 0);
  const balanceDue = Math.max(0, Number(order?.price || 0) - totalPaid);

  const handleRecordPayment = async () => {
    const amount = Number(paymentForm.amount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount > balanceDue) {
      toast.error('Payment cannot exceed balance due');
      return;
    }

    try {
      await addDoc(collection(db, `orders/${id}/payments`), {
        userId: user!.uid,
        amount,
        method: paymentForm.method,
        date: paymentForm.date,
        createdAt: serverTimestamp()
      });

      const newTotalPaid = totalPaid + amount;
      const newBalanceDue = Math.max(0, Number(order?.price || 0) - newTotalPaid);
      const newPaymentStatus = newTotalPaid >= order.price ? 'Paid' : 'Partial';
      
      await updateDoc(doc(db, 'orders', id!), {
        remainingPayment: newBalanceDue,
        paymentStatus: newPaymentStatus,
        updatedAt: serverTimestamp()
      });
      
      toast.success('Payment recorded successfully');
      setIsPaymentModalOpen(false);
      setPaymentForm({ amount: '', method: 'Cash', date: format(new Date(), 'yyyy-MM-dd') });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !user || !id) return;
    setIsCancelling(true);

    const finalReason = cancellationForm.reason === 'Other' ? cancellationForm.customReason : cancellationForm.reason;
    if (!finalReason) {
      toast.error('Please provide a cancellation reason.');
      setIsCancelling(false);
      return;
    }

    try {
      const history = { ...(order.statusHistory || {}) };
      history['cancelled'] = new Date().toISOString();

      const updateData: any = {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy: user.uid,
        cancellationReason: finalReason,
        statusHistory: history,
        updatedAt: serverTimestamp(),
      };

      if (cancellationForm.refundGiven) {
        if (!cancellationForm.refundAmount || Number(cancellationForm.refundAmount) <= 0) {
           toast.error('Please provide a valid refund amount.');
           setIsCancelling(false);
           return;
        }
        updateData.refundGiven = true;
        updateData.refundAmount = Number(cancellationForm.refundAmount);
        updateData.refundDate = cancellationForm.refundDate;
        updateData.refundMethod = cancellationForm.refundMethod;
      }

      await updateDoc(doc(db, 'orders', id), updateData);
      
      toast.success('Order cancelled successfully.');
      setIsCancellationModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
      toast.error('Failed to cancel order.');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return t('orderDetails.na');
    try {
      const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
      if (isNaN(d.getTime())) return t('orderDetails.na');
      return format(d, 'MMMM dd, yyyy');
    } catch {
      return t('orderDetails.na');
    }
  };

  const formatDateTime = (date: any) => {
    if (!date) return t('orderDetails.na');
    try {
      const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
      if (isNaN(d.getTime())) return t('orderDetails.na');
      return format(d, 'MMM dd, yyyy HH:mm');
    } catch {
      return t('orderDetails.na');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-6">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut"
          }}
          className="bg-primary/10 text-primary p-5 rounded-3xl shadow-sm"
        >
          <Scissors className="h-10 w-10 text-primary" />
        </motion.div>
        <div className="space-y-2 text-center">
          <p className="text-xs font-bold text-muted-foreground tracking-wider uppercase animate-pulse">
            {t('orderDetails.loading')}
          </p>
          <div className="h-1 w-20 bg-muted rounded-full overflow-hidden mx-auto relative">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="absolute left-0 top-0 h-full w-1/2 bg-primary rounded-full"
            />
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <PageWrapper className="p-4 md:p-8 space-y-6 flex flex-col h-full bg-[#F7F5F0] min-h-screen">
      <div className="max-w-5xl mx-auto w-full space-y-8 pb-16 min-w-0 max-w-full overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/app/orders')} 
              className="bg-white border border-gray-200/80 shadow-sm hover:bg-gray-50 rounded-full text-slate-700 transition-colors h-11 w-11 flex items-center justify-center shrink-0"
            >
              {isRTL ? <ArrowRight className="h-5 w-5 text-[#0D3D33]" /> : <ArrowLeft className="h-5 w-5 text-[#0D3D33]" />}
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0D3D33] uppercase">
                  TOKEN #{order.tokenId || `T-${order.id.slice(0, 6).toUpperCase()}`}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {order.status !== 'cancelled' && (
              <Button 
                variant="ghost"
                onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
                className={cn(
                  "rounded-full font-bold h-11 px-5 transition-all border border-gray-200 bg-white text-slate-700 shadow-sm hover:bg-gray-50 flex items-center gap-2",
                  isEditing && "bg-[#0D3D33] text-white border-none hover:bg-[#092B24] hover:text-white"
                )}
              >
                {isEditing ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4 text-[#0D3D33]" />}
                {isEditing ? t('orderDetails.save') : t('orderDetails.edit')}
              </Button>
            )}
            {order.status !== 'cancelled' && !isEditing && (
              <Button 
                variant="ghost"
                onClick={handleDeleteOrder}
                disabled={isDeleting}
                className="rounded-full font-bold h-11 px-5 border border-gray-200 bg-white hover:bg-red-50 hover:text-red-600 text-red-600 shadow-sm transition-all flex items-center gap-2"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {t('orderDetails.delete')}
              </Button>
            )}
            {order.status !== 'cancelled' && isEditing && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsEditing(false)} 
                className="rounded-full h-11 w-11 bg-white hover:bg-gray-100 border border-gray-200 shadow-sm text-slate-700 flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

      <OrderTimeline currentStatus={order.status} statusHistory={order.statusHistory || {}} />

      {order.status === 'cancelled' && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div>
             <h3 className="text-red-800 font-bold text-lg mb-1 flex items-center gap-2">
               <X className="h-5 w-5" /> Order Cancelled
             </h3>
             <p className="text-red-600 text-sm font-medium">
               Reason: {order.cancellationReason}
               {order.cancelledAt && ` • ${formatDate(order.cancelledAt)}`}
             </p>
           </div>
           {order.refundGiven && (
             <div className="bg-white/60 rounded-xl p-3 border border-red-100/50">
                <span className="text-xs uppercase tracking-widest text-red-800 font-bold block mb-1">Refund Issued</span>
                <span className="font-bold text-red-900">{settings.currency} {order.refundAmount}</span>
                <span className="text-xs text-red-700 ml-2">via {order.refundMethod}</span>
             </div>
           )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info Card */}
          <Card className="border border-gray-100 shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 p-6">
              <CardTitle className="text-lg font-bold text-[#0D3D33] flex items-center gap-2">
                <User className="h-5 w-5 text-[#0D3D33]" />
                {t('orderDetails.orderInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8 grid sm:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('orderDetails.customerDetails')}</span>
                  <div 
                    className="flex flex-col gap-1 p-3.5 mt-1.5 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-50 bg-gray-50/40 transition-colors"
                    onClick={() => navigate(`/app/clients/${order.customerId}`)}
                  >
                    <div className="flex items-center justify-between text-slate-800">
                       <div className="flex items-center gap-2">
                         <User className="h-4 w-4 text-[#0D3D33] shrink-0" />
                         <span className="font-bold text-sm text-slate-800">{order.customerName}</span>
                       </div>
                       <ArrowRight className="h-4 w-4 text-slate-400" />
                    </div>
                    {order.phone && (
                      <div className="flex items-center gap-2 text-slate-600 ml-[24px]">
                        <span className="font-bold text-xs text-[#0D3D33] mt-1 bg-[#0D3D33]/5 px-2.5 py-1 rounded-full">{order.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('orderDetails.dressType')}</span>
                  <div className="text-base font-bold text-slate-800 mt-2">{order.dressType || order.clothingType || 'Not specified'}</div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Status</span>
                  <select
                     disabled={order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.DELIVERED || isEditing}
                     value={order.status}
                     onChange={(e) => {
                       const nextStatus = e.target.value;
                       if (nextStatus === ORDER_STATUS.CANCELLED) {
                         setIsCancellationModalOpen(true);
                       } else {
                         handleUpdateStatus(nextStatus as OrderStatus);
                       }
                     }}
                     className="h-12 w-full rounded-2xl bg-gray-50/50 border border-gray-200/80 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0D3D33]/20 focus:border-[#0D3D33] cursor-pointer disabled:opacity-100 disabled:bg-gray-100/50 disabled:cursor-not-allowed transition-all"
                  >
                    <option value={order.status}>{order.status}</option>
                    {(ORDER_STATUS_TRANSITIONS[order.status as OrderStatus] || []).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Delivery Type</span>
                  <div>
                    <select 
                      disabled={!isEditing || order.status !== ORDER_STATUS.PENDING}
                      value={isEditing ? (editData.deliveryType || 'Self Pickup') : (order.deliveryType || 'Self Pickup')}
                      onChange={(e) => setEditData({...editData, deliveryType: e.target.value})}
                      className="h-12 w-full rounded-2xl bg-gray-50/50 border border-gray-200/80 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0D3D33]/20 focus:border-[#0D3D33] cursor-pointer disabled:opacity-100 disabled:bg-gray-100/50 disabled:cursor-not-allowed transition-all"
                    >
                      <option value="Self Pickup">🏪 Self Pickup</option>
                      <option value="Home Delivery">🏠 Home Delivery</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Staff</span>
                  <div className="flex items-center gap-3 text-slate-800 mt-1">
                    {isEditing ? (
                      <select
                        value={editData.workerId || ''}
                        onChange={(e) => {
                          const selectedStaff = staff.find(s => s.id === e.target.value);
                          setEditData({
                            ...editData, 
                            workerId: e.target.value,
                            workerName: selectedStaff ? selectedStaff.name : ''
                          });
                        }}
                        className="h-12 w-full rounded-2xl bg-gray-50/50 border border-gray-200/80 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0D3D33]/20 focus:border-[#0D3D33] transition-all"
                      >
                        <option value="">Unassigned</option>
                        {staff.map(w => (
                          <option key={w.id} value={w.id}>{w.name} ({w.role})</option>
                        ))}
                      </select>
                    ) : (
                      <div 
                        className="flex-1 font-bold text-sm h-12 flex items-center bg-gray-50/40 border border-dashed border-gray-200 hover:border-[#0D3D33]/30 hover:bg-gray-50 rounded-2xl px-4 cursor-pointer transition-colors w-full text-slate-700"
                        onClick={() => setIsEditing(true)}
                      >
                        {order.workerId ? (staff.find(w => w.id === order.workerId)?.name || order.workerName || 'Unknown') : <span className="text-slate-400 font-medium">Tap to assign</span>}
                      </div>
                    )}
                  </div>
                  {order.workerId && (
                    <Button 
                      size="sm"
                      onClick={() => {
                        const assignedWorkerObj = staff.find(w => w.id === order.workerId);
                        const workerPhone = assignedWorkerObj?.phone || '';
                        const formattedWorkerPhone = formatWhatsAppNumber(workerPhone);
                        const tokenNumber = order.tokenId || order.id?.substring(0, 8).toUpperCase();
                        
                        const measurements = order.measurements || {};
                        const deliveryStr = order.deliveryDate ? (typeof order.deliveryDate.toDate === 'function' ? order.deliveryDate.toDate().toLocaleDateString() : new Date(order.deliveryDate).toLocaleDateString()) : '';
                        
                        const cleanCustomer = (order.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '');
                        const cleanDress = (order.clothingType || order.dressType || 'Suit').replace(/[^a-zA-Z0-9]/g, '');
                        const encodedMeas = encodeURIComponent(JSON.stringify(measurements));
                        const worksheetUrl = `${window.location.origin}/w/${order.tokenId || order.id}?t=${tokenNumber}&c=${cleanCustomer}&d=${cleanDress}&del=${encodeURIComponent(deliveryStr)}&r=${encodeURIComponent(order.rackLocation || '')}&n=${encodeURIComponent(order.designNotes || '')}&m=${encodedMeas}`;

                        // Auto-sync full order payload to Firestore publicOrders & MongoDB for instant unauthenticated reading in any external browser
                        const fullPayload = {
                          ...order,
                          measurements,
                          shop: {
                            name: settings?.name || shopDoc?.shopName || 'Loop Tailor',
                            shopName: settings?.name || shopDoc?.shopName || 'Loop Tailor',
                            phone: settings?.phone || shopDoc?.shopPhone || '',
                            shopPhone: settings?.phone || shopDoc?.shopPhone || '',
                          }
                        };
                        const syncTargets = Array.from(new Set([order.id, tokenNumber, order.tokenId].filter(Boolean)));
                        syncTargets.forEach(targetId => {
                          if (typeof targetId === 'string') {
                            setDoc(doc(db, 'publicOrders', targetId), fullPayload, { merge: true }).catch(() => {});
                          }
                        });

                        const msg = `✂️ *TAILOR WORKSHEET — ${settings?.name || 'LOOP TAILOR'}* ✂️
-----------------------------------
📋 *Order Token #*: #${tokenNumber}
👤 *Customer*: ${order.customerName || 'Customer'}
👗 *Dress*: ${order.clothingType || 'Custom Suit'}
📅 *Delivery Date*: ${formatDate(order.deliveryDate)}

👉 *Click to view measurements & stitching notes*:
${worksheetUrl}`;

                        const encoded = encodeURIComponent(msg);
                        const waUrl = formattedWorkerPhone 
                          ? `https://wa.me/${formattedWorkerPhone}?text=${encoded}`
                          : `https://api.whatsapp.com/send?text=${encoded}`;
                        window.open(waUrl, '_blank');
                      }}
                      className="mt-2.5 w-full bg-[#128C7E] hover:bg-[#0c6b60] text-white font-bold rounded-2xl h-10 text-xs flex items-center justify-center gap-2 shadow-xs border-none cursor-pointer"
                    >
                      <WhatsAppIcon className="h-4 w-4 fill-current" /> 📲 Send WhatsApp Worksheet to Worker
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('orderDetails.rackLocation')}</span>
                  <div className="flex items-center gap-3 text-slate-800 mt-2">
                    <MapPin className="h-5 w-5 text-[#0D3D33]" />
                    {isEditing ? (
                      <Input 
                        value={editData.rackLocation}
                        onChange={(e) => setEditData({...editData, rackLocation: e.target.value})}
                        className="h-12 w-full rounded-2xl bg-gray-50/50 border border-gray-200/80 px-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0D3D33]/20 focus:border-[#0D3D33] shadow-none font-bold text-sm"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">{order.rackLocation || t('orderDetails.notAssigned')}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('orderDetails.deliveryDate')}</span>
                  <div className="flex items-center gap-3 text-slate-800 mt-2">
                    <Calendar className="h-5 w-5 text-[#0D3D33]" />
                    <span className="font-bold text-slate-800">{formatDate(order.deliveryDate)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('orderDetails.notes')}</span>
                  <p className="text-sm text-slate-700 font-medium mt-2 bg-gray-50/40 border border-gray-100 p-4 rounded-2xl min-h-[80px]">
                    {order.notes || t('orderDetails.noNotes')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Garment Styles Card */}
          {order.garmentStyles && Object.keys(order.garmentStyles).length > 0 && (
            <Card className="border border-gray-100 shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-50 p-6 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold text-[#0D3D33] flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-[#0D3D33]" />
                  Garment Style Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(order.garmentStyles).map(([key, value]) => (
                    <div key={key} className="bg-gray-50/50 shadow-xs p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 bg-white rounded-xl mb-3 flex items-center justify-center text-xl shadow-xs border border-gray-100">
                        {key.toLowerCase() === 'collar' ? '👔' : key.toLowerCase() === 'sleeves' ? '👕' : key.toLowerCase() === 'pocket' ? '👝' : key.toLowerCase() === 'placket' ? '🧵' : '🎽'}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        {key}
                      </span>
                      <span className="text-sm font-bold text-slate-800 leading-tight block">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Measurements Card */}
          <MeasurementsDisplay measurements={order.measurements} title={t('orderDetails.measurements')} editAction={() => navigate(`/app/clients/${order.customerId}#measurements`)} />
        </div>

        <div className="space-y-8">
          {/* Payment Card */}
          <Card className="border border-gray-100 shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Status</span>
                <span className={cn(
                  "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                  (!order.paymentStatus || order.paymentStatus === 'Unpaid') ? "bg-red-50 text-red-600" :
                  order.paymentStatus === 'Partial' ? "bg-amber-50 text-amber-600" :
                  "bg-green-50 text-green-600"
                )}>
                  {order.paymentStatus || 'Unpaid'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('orderDetails.totalPrice')}</span>
                <div className="text-3xl font-black text-slate-900 mt-1">{settings.currency} {order.price}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Paid</span>
                <div className="text-lg font-bold text-green-600 mt-1">{settings.currency} {totalPaid}</div>
              </div>
              <div className="pt-6 border-t border-gray-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('orderDetails.balanceDue')}</span>
                <div className={cn("text-2xl font-black mt-1", balanceDue > 0 ? "text-red-600" : "text-[#0D3D33]")}>
                  {settings.currency} {balanceDue}
                </div>
              </div>
              
              {balanceDue > 0 && (
                <Button 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full bg-[#0D3D33] text-white font-bold rounded-full h-12 shadow-sm border-none mt-4 hover:bg-[#092B24] transition-colors flex items-center justify-center"
                >
                  Record Payment
                </Button>
              )}

              {paymentsList.length > 0 && (
                <div className="pt-6 border-t border-gray-100 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment History</span>
                  <div className="space-y-2">
                    {paymentsList.map(payment => (
                      <div key={payment.id} className="flex justify-between items-center bg-gray-50/40 p-3 rounded-2xl border border-gray-100">
                        <div>
                          <span className="text-sm font-bold text-slate-800 block">{payment.method}</span>
                          <span className="text-xs text-slate-500 font-medium">{formatDate(payment.date)}</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">+{settings.currency} {payment.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card className="border border-gray-100 shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 text-[#0D3D33] shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">{t('orderDetails.createdOn')}</span>
                  <span className="text-sm font-bold text-slate-800">
                    {formatDateTime(order.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 text-[#0D3D33] shrink-0">
                  <Hash className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Token Number</span>
                  <span className="text-sm font-bold text-slate-800">{order.tokenId || `T-${order.id.slice(0, 6).toUpperCase()}`}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 text-[#0D3D33] shrink-0">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">{t('orderDetails.systemId')}</span>
                  <span className="text-xs font-mono font-medium text-slate-500 break-all">{order.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Preview Card */}
          <Card className="border border-gray-100 shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 p-6">
              <CardTitle className="text-lg font-bold text-[#0D3D33] flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#0D3D33]" />
                {t('orderDetails.invoicePreview')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100 space-y-4 shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{shop?.name || t('orderDetails.yourShop')}</h4>
                    <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-wider">{t('orderDetails.invoicePreview')}</p>
                  </div>
                  <div className={cn(isRTL ? "text-left" : "text-right")}>
                    <span className={cn(
                      "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                      order.status === ORDER_STATUS.DELIVERED ? "bg-green-50 text-green-600" :
                      order.status === ORDER_STATUS.READY ? "bg-blue-50 text-blue-600" :
                      order.status === ORDER_STATUS.STITCHING ? "bg-orange-50 text-orange-600" :
                      order.status === ORDER_STATUS.CANCELLED ? "bg-red-50 text-red-600" :
                      "bg-gray-50 text-slate-500"
                    )}>
                      {order.status === ORDER_STATUS.PENDING ? t('orderDetails.pending') :
                       order.status === ORDER_STATUS.STITCHING ? t('orderDetails.stitching') :
                       order.status === ORDER_STATUS.READY ? t('orderDetails.ready') :
                       order.status === ORDER_STATUS.DELIVERED ? t('orderDetails.delivered') : order.status}
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{t('orderDetails.customer')}</span>
                    <span className="font-bold text-slate-800">{order.customerName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{t('orderDetails.totalAmount')}</span>
                    <span className="font-bold text-slate-800">{settings.currency} {order.price}</span>
                  </div>
                </div>

                <Button 
                  variant="ghost" 
                  className="w-full rounded-full h-11 text-sm font-bold border border-gray-200 bg-white hover:bg-gray-50 text-[#0D3D33] mt-2 transition-colors shadow-sm"
                  onClick={() => setIsInvoiceModalOpen(true)}
                >
                  {t('orderDetails.viewFullInvoice')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Communications Card */}
          <Card className="border border-gray-100 shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 p-6">
              <CardTitle className="text-lg font-bold text-[#25D366] flex items-center gap-2">
                <WhatsAppIcon className="h-5 w-5 fill-current" />
                WhatsApp Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {(() => {
                const formattedPhone = formatWhatsAppNumber(customerPhone);
                if (!customerPhone) {
                  return (
                    <div className="flex flex-col gap-3 shadow-xs p-5 rounded-2xl bg-red-50/50 border border-red-100">
                      <div className="text-sm font-bold text-slate-800 flex flex-col gap-1 text-left">
                        <span className="text-red-600 font-bold flex items-center gap-1.5">
                          ⚠️ Phone number not found
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                          Customer profile mein phone number add nahi hai.
                        </p>
                      </div>
                      <Button 
                        onClick={() => {
                          setNewCustomerPhone('');
                          setIsUpdateCustomerOpen(true);
                        }} 
                        className="w-full text-xs font-bold bg-[#0D3D33] hover:bg-[#092B24] text-white rounded-full h-10 transition-colors shadow-sm active:scale-95 cursor-pointer border-none"
                      >
                        Update Customer Profile
                      </Button>
                    </div>
                  );
                }

                if (!formattedPhone) {
                  return (
                    <div className="flex flex-col gap-3 shadow-xs p-5 rounded-2xl bg-amber-50/50 border border-amber-100">
                      <div className="text-sm font-bold text-slate-800 flex flex-col gap-1 text-left">
                        <span className="text-amber-600 font-bold flex items-center gap-1.5">
                          ⚠️ Invalid Phone Number Format
                        </span>
                        <p className="text-xs text-slate-600 leading-normal font-semibold">
                          "{customerPhone}" is not recognized as a standard format. Please enter a valid phone number.
                        </p>
                      </div>
                      <Button 
                        onClick={() => {
                          setNewCustomerPhone(customerPhone);
                          setIsUpdateCustomerOpen(true);
                        }} 
                        className="w-full text-xs font-bold bg-[#0D3D33] hover:bg-[#092B24] text-white rounded-full h-10 transition-colors shadow-sm active:scale-95 cursor-pointer border-none"
                      >
                        Update Customer Profile
                      </Button>
                    </div>
                  );
                }

                const tokenNumber = order.tokenId || order.id?.substring(0, 8).toUpperCase() || 'N/A';
                const totalPrice = order.price || '0';
                const deliveryDateStr = order.deliveryDate ? formatDate(order.deliveryDate) : 'N/A';
                const shopName = shopDoc?.shopName || shop?.name || 'Loop Tailor';
                const deliveryType = order.deliveryType || 'Self Pickup';

                return (
                  <>
                    <div className="text-xs text-slate-500 font-bold pb-1.5 border-b border-gray-50 flex items-center justify-between">
                      <span>Recipient WhatsApp Phone:</span>
                      <span className="font-bold bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full">
                        +{formattedPhone}
                      </span>
                    </div>

                    <Button 
                      onClick={() => {
                        const msg = getOrderConfirmationMessage(
                          order.customerName || 'Walk-in Customer',
                          tokenNumber,
                          totalPrice,
                          deliveryDateStr,
                          shopName
                        );
                        openWhatsApp(customerPhone, msg);
                      }}
                      className="w-full bg-[#128C7E] hover:bg-[#0c6b60] text-white font-bold rounded-full h-11 shadow-sm border-none flex justify-center items-center gap-2 text-sm transition-colors active:scale-[0.98] cursor-pointer"
                    >
                      <WhatsAppIcon className="h-4 w-4 fill-current" /> Order Confirmation
                    </Button>

                    <Button 
                      onClick={() => {
                        const msg = getOrderReadyMessage(
                          order.customerName || 'Walk-in Customer',
                          tokenNumber,
                          deliveryType,
                          shopName
                        );
                        openWhatsApp(customerPhone, msg);
                      }}
                      className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-full h-11 shadow-sm border-none flex justify-center items-center gap-2 text-sm transition-colors active:scale-[0.98] cursor-pointer"
                    >
                      <WhatsAppIcon className="h-4 w-4 fill-current" /> Send "Order Ready"
                    </Button>

                    <Button 
                      variant="outline"
                      onClick={() => {
                        const msg = getPaymentReminderMessage(
                          order.customerName || 'Walk-in Customer',
                          tokenNumber,
                          totalPrice,
                          totalPaid,
                          balanceDue,
                          shopName
                        );
                        openWhatsApp(customerPhone, msg);
                      }}
                      className="w-full bg-white hover:bg-gray-50 border-gray-200 text-slate-700 border font-bold rounded-full h-11 shadow-sm flex justify-center items-center gap-2 text-sm transition-colors active:scale-[0.98] cursor-pointer"
                    >
                      <CreditCard className="h-4 w-4 text-green-600" /> Payment Reminder
                    </Button>

                    {showCustomWa ? (
                      <div className="pt-4 border-t border-gray-100 space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D3D33] block">Custom Message</span>
                        <textarea
                          value={customWaMessage}
                          onChange={(e) => setCustomWaMessage(e.target.value)}
                          placeholder="Write a custom message for WhatsApp..."
                          className="w-full p-4 rounded-2xl resize-none bg-gray-50 border border-gray-200 focus:border-[#0D3D33] focus:ring-1 focus:ring-[#0D3D33]/20 text-sm font-bold text-slate-800 outline-none shadow-none"
                          rows={3}
                        />
                        <div className="flex gap-3">
                          <Button
                            variant="ghost" 
                            onClick={() => setShowCustomWa(false)}
                            className="flex-1 bg-white hover:bg-gray-50 border border-gray-250 shadow-sm rounded-full h-11 text-slate-600 font-bold"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => {
                              openWhatsApp(customerPhone, customWaMessage);
                              setShowCustomWa(false);
                              setCustomWaMessage('');
                            }}
                            className="flex-1 bg-[#0D3D33] hover:bg-[#092B24] text-white rounded-full h-11 shadow-sm border-none font-bold"
                            disabled={!customWaMessage.trim()}
                          >
                            Send WhatsApp
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="ghost"
                        onClick={() => setShowCustomWa(true)}
                        className="w-full text-[#0D3D33] font-bold rounded-full h-11 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm flex justify-center items-center gap-2 text-sm"
                      >
                        <Edit2 className="h-4 w-4" /> Custom Message
                      </Button>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {isUpdateCustomerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25 }}
              className="bg-white text-slate-800 rounded-3xl p-6 md:p-8 max-w-[450px] w-full shadow-2xl relative border border-slate-100"
            >
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsUpdateCustomerOpen(false)}
                className="absolute right-4 top-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-650 text-slate-600 p-2 z-10 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>

              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-[#1a3a2a]" />
                Update Customer Phone
              </h3>

              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Customer Name</p>
                  <p className="text-sm font-bold text-slate-900">{order?.customerName || 'Walk-in Customer'}</p>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full text-sm font-semibold p-3 border border-gray-200 rounded-xl outline-none focus:border-[#1a3a2a] focus:ring-1 focus:ring-[#1a3a2a] transition-all bg-slate-50 shadow-inner"
                    placeholder="e.g. 03001234567 or 923001234567"
                  />
                  <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                    Enter a valid Pakistani mobile number (starting with 0 or 92) or international number.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost" 
                    onClick={() => setIsUpdateCustomerOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl h-11 text-xs font-bold border border-transparent"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleUpdateCustomerProfile(newCustomerPhone)}
                    disabled={!newCustomerPhone.trim()}
                    className="flex-1 bg-[#1a3a2a] hover:bg-[#152e21] text-white rounded-xl h-11 text-xs font-bold shadow-md cursor-pointer"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isInvoiceModalOpen && order && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25 }}
              className="bg-slate-100 rounded-3xl p-6 md:p-8 max-w-[650px] w-full shadow-2xl relative max-h-[92vh] overflow-y-auto"
            >
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsInvoiceModalOpen(false)}
                className="absolute right-4 top-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 p-2 z-10"
              >
                <X className="h-5 w-5" />
              </Button>

              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b pb-3">Order Invoice</h2>
              
              <div className="overflow-x-auto hide-scrollbar rounded-2xl border border-gray-200/50">
                <Invoice 
                  ref={invoiceRef}
                  order={order} 
                  shop={{
                    name: shopDoc?.shopName || shop?.name || settings?.name || 'Loop Tailor',
                    phone: shopDoc?.shopPhone || shop?.phone || settings?.phone || '',
                    address: shopDoc?.shopAddress || shop?.address || settings?.address || '',
                    email: shopDoc?.shopEmail || user?.email || '',
                    logoUrl: shopDoc?.shopLogo || shop?.logoUrl || settings?.logoUrl || settings?.shopLogo || '',
                    invoiceFooter: shopDoc?.invoiceFooter || shop?.invoiceFooter || settings?.invoiceFooter || '',
                    currency: settings?.currency || 'PKR',
                    shopName: shopDoc?.shopName || shop?.name || settings?.name || 'Loop Tailor',
                    shopLogo: shopDoc?.shopLogo || shop?.logoUrl || settings?.logoUrl || settings?.shopLogo || '',
                    shopPhone: shopDoc?.shopPhone || shop?.phone || settings?.phone || '',
                    shopAddress: shopDoc?.shopAddress || shop?.address || settings?.address || '',
                    shopEmail: shopDoc?.shopEmail || user?.email || '',
                  }}
                  customer={null} 
                  paymentsList={paymentsList} 
                />
              </div>

              <InvoiceActions 
                invoiceRef={invoiceRef}
                orderId={order.id}
                order={order}
                onSaveOrderFields={async (fields) => {
                  try {
                    const cleanFields = { ...fields, updatedAt: new Date().toISOString() };
                    await updateDoc(doc(db, 'orders', order.id), cleanFields).catch(() => {
                      return setDoc(doc(db, 'orders', order.id), cleanFields, { merge: true });
                    });

                    // Sync to MongoDB in background
                    const fullMerged = { _id: order.id, id: order.id, userId: user?.uid, ...order, ...fields, updatedAt: new Date().toISOString() };
                    Promise.allSettled([
                      fetch('/api/db/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(fullMerged)
                      }),
                      fetch('/api/db/invoices', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(fullMerged)
                      })
                    ]);

                    toast.success('Invoice details updated & saved to MongoDB & Firestore!');
                  } catch (e) {
                    console.error(e);
                    toast.error('Failed to update invoice fields');
                  }
                }}
                customerName={order.customerName}
                shopName={shopDoc?.shopName || shop?.name || settings?.name || 'Loop Tailor'}
                currentFooter={shopDoc?.invoiceFooter || shop?.invoiceFooter || settings?.invoiceFooter || ''}
                onSaveFooter={async (newFooter) => {
                  try {
                    if (user?.uid) {
                      await Promise.all([
                        setDoc(doc(db, 'shops', user.uid), { invoiceFooter: newFooter }, { merge: true }),
                        setDoc(doc(db, 'settings', user.uid), { invoiceFooter: newFooter }, { merge: true })
                      ]);
                      fetch('/api/db/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: user.uid, invoiceFooter: newFooter })
                      }).catch(() => {});
                    }
                    toast.success('Invoice footer saved to MongoDB & Firestore!');
                  } catch (e) {
                    console.error(e);
                    toast.error('Failed to update footer');
                  }
                }}
              />
            </motion.div>
          </div>
        )}

        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg relative border border-outline-variant"
            >
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsPaymentModalOpen(false)}
                className="absolute right-4 top-4 rounded-full bg-surface-variant hover:bg-surface-container-highest text-on-surface-variant p-2"
              >
                <X className="h-5 w-5" />
              </Button>

              <h2 className="text-[24px] font-display font-semibold text-on-surface mb-6">Record Payment</h2>
              
              <div className="space-y-5">
                <div>
                  <label className="text-[11px] font-medium text-on-surface-variant uppercase tracking-widest mb-2 block">Amount</label>
                  <Input 
                    type="number" 
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    placeholder={`Max ${settings.currency} ${balanceDue}`}
                    className="h-12 bg-surface-container-highest border border-outline-variant rounded-2xl font-semibold text-on-surface focus:border-primary shadow-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-on-surface-variant uppercase tracking-widest mb-2 block">Payment Method</label>
                  <select 
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})}
                    className="w-full h-12 bg-surface-container-highest border border-outline-variant rounded-2xl font-semibold text-on-surface px-4 focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-on-surface-variant uppercase tracking-widest mb-2 block">Date</label>
                  <Input 
                    type="date" 
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                    className="h-12 bg-surface-container-highest border border-outline-variant rounded-2xl font-semibold text-on-surface focus:border-primary shadow-none"
                  />
                </div>

                <Button 
                  onClick={handleRecordPayment}
                  className="w-full bg-primary hover:bg-on-surface text-primary-foreground font-medium rounded-full h-12 mt-6 shadow-sm transition-colors"
                >
                  Confirm Payment
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {isCancellationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg relative border border-outline-variant overflow-y-auto max-h-[90vh]"
            >
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsCancellationModalOpen(false)}
                className="absolute right-4 top-4 rounded-full bg-surface-variant hover:bg-surface-container-highest text-on-surface-variant p-2"
              >
                <X className="h-5 w-5" />
              </Button>

              <div className="flex flex-col items-center mb-6">
                 <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                   <AlertCircle className="h-6 w-6 text-red-600" />
                 </div>
                 <h2 className="text-[24px] font-display font-semibold text-on-surface text-center">Cancel Order</h2>
                 <p className="text-sm text-on-surface-variant text-center mt-2">Are you sure you want to cancel this order? This action cannot be undone.</p>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="text-[11px] font-medium text-on-surface-variant uppercase tracking-widest mb-2 block">Cancellation Reason</label>
                  <select 
                    value={cancellationForm.reason}
                    onChange={(e) => setCancellationForm({...cancellationForm, reason: e.target.value})}
                    className="w-full h-12 bg-surface-container-highest border border-outline-variant rounded-2xl font-semibold text-on-surface px-4 focus:outline-none focus:border-red-500 transition-colors"
                  >
                    <option value="Customer Request">Customer Request</option>
                    <option value="Fabric Issue">Fabric Issue</option>
                    <option value="Payment Not Received">Payment Not Received</option>
                    <option value="Tailor Unavailable">Tailor Unavailable</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                {cancellationForm.reason === 'Other' && (
                  <div>
                    <label className="text-[11px] font-medium text-on-surface-variant uppercase tracking-widest mb-2 block">Specify Reason</label>
                    <Input 
                      type="text" 
                      value={cancellationForm.customReason}
                      onChange={(e) => setCancellationForm({...cancellationForm, customReason: e.target.value})}
                      placeholder="Enter custom reason"
                      className="h-12 bg-surface-container-highest border border-outline-variant rounded-2xl font-semibold text-on-surface focus:border-red-500 shadow-none"
                    />
                  </div>
                )}

                {(order.advancePayment || paymentsList.length > 0) && (
                   <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-4">
                     <p className="text-xs font-semibold text-red-800 uppercase tracking-widest">Refund Details</p>
                     <p className="text-sm text-red-600">This order has a total paid amount of {settings.currency} {totalPaid}.</p>
                     
                     <div className="flex items-center gap-3">
                       <input 
                         type="checkbox" 
                         id="refundGiven"
                         checked={cancellationForm.refundGiven}
                         onChange={(e) => {
                            setCancellationForm(prev => ({
                                ...prev, 
                                refundGiven: e.target.checked,
                                refundAmount: e.target.checked ? totalPaid.toString() : ''
                            }))
                         }}
                         className="w-4 h-4 text-red-600 rounded border-red-300 focus:ring-red-500"
                       />
                       <label htmlFor="refundGiven" className="text-sm font-semibold text-red-800">
                         Was amount refunded?
                       </label>
                     </div>

                     {cancellationForm.refundGiven && (
                       <div className="space-y-4 pt-2">
                         <div>
                            <label className="text-[11px] font-medium text-red-700 uppercase tracking-widest mb-1 block">Refund Amount</label>
                            <Input 
                                type="number" 
                                value={cancellationForm.refundAmount}
                                onChange={(e) => setCancellationForm({...cancellationForm, refundAmount: e.target.value})}
                                className="h-10 bg-white border-red-200 rounded-xl"
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="text-[11px] font-medium text-red-700 uppercase tracking-widest mb-1 block">Method</label>
                                <select 
                                    value={cancellationForm.refundMethod}
                                    onChange={(e) => setCancellationForm({...cancellationForm, refundMethod: e.target.value})}
                                    className="w-full h-10 bg-white border border-red-200 rounded-xl px-3"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Bank">Bank</option>
                                </select>
                             </div>
                             <div>
                                <label className="text-[11px] font-medium text-red-700 uppercase tracking-widest mb-1 block">Date</label>
                                <Input 
                                    type="date" 
                                    value={cancellationForm.refundDate}
                                    onChange={(e) => setCancellationForm({...cancellationForm, refundDate: e.target.value})}
                                    className="h-10 bg-white border-red-200 rounded-xl"
                                />
                             </div>
                         </div>
                       </div>
                     )}
                   </div>
                )}

                <div className="flex gap-3 mt-6 pt-2">
                  <Button 
                    variant="outline"
                    onClick={() => setIsCancellationModalOpen(false)}
                    className="flex-1 rounded-full h-12 text-on-surface-variant font-semibold border-outline-variant"
                  >
                    Go Back
                  </Button>
                  <Button 
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full h-12 shadow-sm transition-colors border-none"
                  >
                    {isCancelling ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Cancel"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
