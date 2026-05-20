import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useShop } from '../contexts/ShopContext';
import { ORDER_STATUS, ORDER_STATUS_TRANSITIONS, isValidStatusTransition, OrderStatus } from '../lib/config';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot, collection, query, where, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, ArrowRight, Calendar, MapPin, Ruler, User, Phone, Hash, CheckCircle, Edit2, Save, X, Loader2, Clock, CreditCard, Trash2, Home, Store, Scissors, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { MeasurementsDisplay } from '../components/MeasurementsDisplay';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { sendOrderReadyMessage, sendPaymentReminderMessage, sendWhatsAppMessage } from '../lib/whatsapp';
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

  useEffect(() => {
    if (!user || !id) return;
    
    setLoading(true);
    
    const unsubOrder = onSnapshot(doc(db, 'orders', id), (docSnap) => {
      if (docSnap.exists() && docSnap.data().userId === user.uid) {
        const data = docSnap.data();
        setOrder({ id: docSnap.id, ...data });
        setEditData({ ...data });
      } else {
        navigate('/app/orders');
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
      unsubPayments();
    };
  }, [user, id]);

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
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return format(d, 'MMMM dd, yyyy');
  };

  const formatDateTime = (date: any) => {
    if (!date) return t('orderDetails.na');
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return format(d, 'MMM dd, yyyy HH:mm');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="h-12 w-12 text-brand-primary animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('orderDetails.loading')}</p>
      </div>
    );
  }

  if (!order) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto space-y-8 pb-12"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/orders')} className="bg-surface border border-outline-variant shadow-sm hover:bg-surface-variant rounded-full text-on-surface transition-colors">
            {isRTL ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-medium uppercase tracking-widest text-on-surface-variant">{t('orderDetails.token')}</span>
              <span className="text-[24px] font-display font-semibold tracking-tight text-primary">#{order.tokenId}</span>
              {order.deliveryType === 'Home Delivery' ? (
                <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-widest text-[#22C55E] bg-green-100 px-2.5 py-1 rounded-full"><Home className="w-3.5 h-3.5"/> Home Delivery</span>
              ) : order.deliveryType === 'Self Pickup' ? (
                <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-widest text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full"><Store className="w-3.5 h-3.5"/> Self Pickup</span>
              ) : null}
            </div>
            <h1 className="text-[20px] font-semibold text-on-surface">{order.customerName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {order.status !== 'cancelled' && !isEditing && (ORDER_STATUS_TRANSITIONS[order.status as OrderStatus] || []).map(nextStatus => (
            <Button
              key={nextStatus}
              onClick={() => {
                if (nextStatus === ORDER_STATUS.CANCELLED) {
                  setIsCancellationModalOpen(true);
                } else {
                  handleUpdateStatus(nextStatus);
                }
              }}
              className={cn(
                "font-medium rounded-full px-6 h-12 shadow-sm transition-all border-none",
                nextStatus === ORDER_STATUS.CANCELLED ? "bg-red-100 text-red-600 hover:bg-red-200" :
                nextStatus === ORDER_STATUS.DELIVERED ? "bg-primary hover:bg-on-surface text-primary-foreground" :
                "bg-blue-100 text-blue-700 hover:bg-blue-200"
              )}
            >
              {nextStatus === ORDER_STATUS.DELIVERED && <CheckCircle className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />}
              {nextStatus === ORDER_STATUS.CANCELLED && <X className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />}
              {nextStatus === ORDER_STATUS.STITCHING ? t('orderDetails.stitching') :
               nextStatus === ORDER_STATUS.READY ? t('orderDetails.ready') :
               nextStatus === ORDER_STATUS.DELIVERED ? t('orderDetails.deliver') :
               nextStatus}
            </Button>
          ))}
          {order.status !== 'cancelled' && (
            <Button 
              variant="ghost"
              onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
              className={cn(
                "rounded-full font-medium h-12 px-6 transition-all border border-outline-variant",
                isEditing ? "bg-surface-variant text-primary" : "bg-surface hover:bg-surface-variant text-on-surface shadow-sm"
              )}
            >
              {isEditing ? <Save className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} /> : <Edit2 className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />}
              {isEditing ? t('orderDetails.save') : t('orderDetails.edit')}
            </Button>
          )}
          {order.status !== 'cancelled' && !isEditing && (
            <Button 
              variant="ghost"
              onClick={handleDeleteOrder}
              disabled={isDeleting}
              className="rounded-full font-medium h-12 px-6 border border-outline-variant text-error bg-surface hover:bg-error hover:text-white shadow-sm transition-all"
            >
              {isDeleting ? <Loader2 className={cn("h-5 w-5 animate-spin", isRTL ? "ml-2" : "mr-2")} /> : <Trash2 className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />}
              {t('orderDetails.delete')}
            </Button>
          )}
          {order.status !== 'cancelled' && isEditing && (
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="rounded-full h-12 w-12 bg-surface hover:bg-surface-variant border border-outline-variant shadow-sm text-on-surface-variant">
              <X className="h-6 w-6" />
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
          <Card className="border border-outline-variant shadow-sm bg-surface rounded-3xl overflow-hidden">
            <CardHeader className="bg-surface-container-lowest border-b border-outline-variant p-6">
              <CardTitle className="text-[18px] font-semibold text-on-surface flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {t('orderDetails.orderInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid sm:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant">{t('orderDetails.customerDetails')}</span>
                  <div className="flex items-center gap-3 text-on-surface mt-1">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{order.customerName}</span>
                  </div>
                  {order.phone && (
                    <div className="flex items-center gap-3 text-on-surface mt-2.5">
                      <Phone className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{order.phone}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant">{t('orderDetails.dressType')}</span>
                  <div className="text-[18px] font-semibold text-on-surface mt-1">{order.dressType}</div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant">{t('orderDetails.status')}</span>
                  <div className="h-12 w-full rounded-2xl bg-surface border border-outline-variant px-4 text-[15px] font-semibold text-on-surface flex items-center">
                    {order.status === ORDER_STATUS.PENDING ? t('orderDetails.pending') :
                     order.status === ORDER_STATUS.STITCHING ? t('orderDetails.stitching') :
                     order.status === ORDER_STATUS.READY ? t('orderDetails.ready') :
                     order.status === ORDER_STATUS.DELIVERED ? t('orderDetails.delivered') :
                     order.status}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant">Delivery Type</span>
                  <div>
                    <select 
                      disabled={!isEditing || order.status !== ORDER_STATUS.PENDING}
                      value={isEditing ? (editData.deliveryType || 'Self Pickup') : (order.deliveryType || 'Self Pickup')}
                      onChange={(e) => setEditData({...editData, deliveryType: e.target.value})}
                      className="h-12 w-full rounded-2xl bg-surface-container-highest border border-outline-variant px-4 text-[15px] font-semibold text-on-surface focus:outline-none focus:border-primary disabled:opacity-100 disabled:bg-surface disabled:border-transparent transition-all"
                    >
                      <option value="Self Pickup">🏪 Self Pickup</option>
                      <option value="Home Delivery">🏠 Home Delivery</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant">Assigned Staff</span>
                  <div className="flex items-center gap-3 text-on-surface mt-1">
                    <User className="h-4 w-4 text-primary" />
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
                        className="h-12 w-full rounded-2xl bg-surface-container-highest border border-outline-variant px-4 text-[14px] font-semibold text-on-surface focus:outline-none focus:border-primary transition-all"
                      >
                        <option value="">Unassigned</option>
                        {staff.map(w => (
                          <option key={w.id} value={w.id}>{w.name} ({w.role})</option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-semibold flex items-center gap-1">
                        {order.workerId 
                          ? <><span className="text-primary">👤</span> {staff.find(w => w.id === order.workerId)?.name || order.workerName || 'Unknown'}</>
                          : 'Unassigned'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant">{t('orderDetails.rackLocation')}</span>
                  <div className="flex items-center gap-3 text-on-surface mt-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {isEditing ? (
                      <Input 
                        value={editData.rackLocation}
                        onChange={(e) => setEditData({...editData, rackLocation: e.target.value})}
                        className="h-12 w-full rounded-2xl bg-surface-container-highest border border-outline-variant px-4 text-on-surface focus:border-primary shadow-none"
                      />
                    ) : (
                      <span className="font-semibold">{order.rackLocation || t('orderDetails.notAssigned')}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant">{t('orderDetails.deliveryDate')}</span>
                  <div className="flex items-center gap-3 text-on-surface mt-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{formatDate(order.deliveryDate)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant">{t('orderDetails.notes')}</span>
                  <p className="text-[14px] text-on-surface font-medium mt-1.5 bg-surface-container-highest border border-outline-variant p-4 rounded-2xl min-h-[60px]">
                    {order.notes || t('orderDetails.noNotes')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Garment Styles Card */}
          {order.garmentStyles && Object.keys(order.garmentStyles).length > 0 && (
            <Card className="border border-outline-variant shadow-sm bg-surface rounded-3xl overflow-hidden">
              <CardHeader className="bg-surface-container-lowest border-b border-outline-variant p-6 flex flex-row items-center justify-between">
                <CardTitle className="text-[18px] font-semibold text-on-surface flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-primary" />
                  Garment Style Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(order.garmentStyles).map(([key, value]) => (
                    <div key={key} className="bg-surface-container-highest shadow-sm p-4 rounded-2xl border border-outline-variant flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 bg-surface rounded-xl mb-3 flex items-center justify-center text-xl shadow-sm border border-outline-variant">
                        {key.toLowerCase() === 'collar' ? '👔' : key.toLowerCase() === 'sleeves' ? '👕' : key.toLowerCase() === 'pocket' ? '👝' : key.toLowerCase() === 'placket' ? '🧵' : '🎽'}
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant block mb-1">
                        {key}
                      </span>
                      <span className="text-[14px] font-semibold text-on-surface leading-tight block">{String(value)}</span>
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
          <Card className="border border-outline-variant shadow-sm bg-surface rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant">Payment Status</span>
                <span className={cn(
                  "text-[11px] font-medium px-3 py-1.5 rounded-full uppercase tracking-widest",
                  (!order.paymentStatus || order.paymentStatus === 'Unpaid') ? "bg-errorContainer text-on-errorContainer" :
                  order.paymentStatus === 'Partial' ? "bg-secondary-container text-on-secondary-container" :
                  "bg-green-100 text-[#22C55E]"
                )}>
                  {order.paymentStatus || 'Unpaid'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant">{t('orderDetails.totalPrice')}</span>
                <div className="text-[32px] font-display font-semibold tracking-tight text-on-surface">{settings.currency} {order.price}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant">Total Paid</span>
                <div className="text-[20px] font-semibold text-[#22C55E]">{settings.currency} {totalPaid}</div>
              </div>
              <div className="pt-6 border-t border-outline-variant space-y-1">
                <span className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant">{t('orderDetails.balanceDue')}</span>
                <div className="text-[24px] font-semibold text-primary">
                  {settings.currency} {balanceDue}
                </div>
              </div>
              
              {balanceDue > 0 && (
                <Button 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full bg-primary text-primary-foreground font-medium rounded-full h-12 shadow-sm border-none mt-4 hover:bg-on-surface"
                >
                  Record Payment
                </Button>
              )}

              {paymentsList.length > 0 && (
                <div className="pt-6 border-t border-outline-variant space-y-3">
                  <span className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant">Payment History</span>
                  <div className="space-y-2">
                    {paymentsList.map(payment => (
                      <div key={payment.id} className="flex justify-between items-center bg-surface-container-highest p-3 rounded-xl border border-outline-variant">
                        <div>
                          <span className="text-[13px] font-semibold text-on-surface block">{payment.method}</span>
                          <span className="text-[11px] text-on-surface-variant font-medium">{formatDate(payment.date)}</span>
                        </div>
                        <span className="text-[14px] font-bold text-[#22C55E]">+{settings.currency} {payment.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card className="border border-outline-variant shadow-sm bg-surface rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant block mb-1">{t('orderDetails.createdOn')}</span>
                  <span className="text-[14px] font-semibold text-on-surface">
                    {formatDateTime(order.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <Hash className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant block mb-1">{t('orderDetails.systemId')}</span>
                  <span className="text-[12px] font-mono font-medium text-on-surface-variant break-all">{order.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Preview Card */}
          <Card className="border border-outline-variant shadow-sm bg-surface rounded-3xl overflow-hidden">
            <CardHeader className="bg-surface-container-lowest border-b border-outline-variant p-6">
              <CardTitle className="text-[18px] font-semibold text-on-surface flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {t('orderDetails.invoicePreview')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="p-5 rounded-2xl bg-surface-container-highest border border-outline-variant space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-[15px] font-semibold text-on-surface">{shop?.name || t('orderDetails.yourShop')}</h4>
                    <p className="text-[12px] text-on-surface-variant font-medium mt-1">{t('orderDetails.invoicePreview')}</p>
                  </div>
                  <div className={cn(isRTL ? "text-left" : "text-right")}>
                    <span className={cn(
                      "text-[10px] font-medium px-3 py-1.5 rounded-full uppercase tracking-widest",
                      order.status === ORDER_STATUS.DELIVERED ? "bg-secondary-container text-on-secondary-container" :
                      order.status === ORDER_STATUS.READY ? "bg-blue-100 text-blue-700" :
                      order.status === ORDER_STATUS.STITCHING ? "bg-orange-100 text-orange-700" :
                      order.status === ORDER_STATUS.CANCELLED ? "bg-red-100 text-red-700" :
                      "bg-surface-container-high text-on-surface-variant"
                    )}>
                      {order.status === ORDER_STATUS.PENDING ? t('orderDetails.pending') :
                       order.status === ORDER_STATUS.STITCHING ? t('orderDetails.stitching') :
                       order.status === ORDER_STATUS.READY ? t('orderDetails.ready') :
                       order.status === ORDER_STATUS.DELIVERED ? t('orderDetails.delivered') : order.status}
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-outline-variant space-y-3">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-on-surface-variant font-medium">{t('orderDetails.customer')}</span>
                    <span className="font-semibold text-on-surface">{order.customerName}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-on-surface-variant font-medium">{t('orderDetails.totalAmount')}</span>
                    <span className="font-semibold text-on-surface">{settings.currency} {order.price}</span>
                  </div>
                </div>

                <Button 
                  variant="ghost" 
                  className="w-full rounded-xl h-12 text-[14px] font-semibold bg-surface hover:bg-surface-variant border border-outline-variant shadow-sm text-primary mt-2"
                  onClick={() => navigate(`/app/orders/${order.id}/invoice`)}
                >
                  {t('orderDetails.viewFullInvoice')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Communications Card */}
          <Card className="border border-outline-variant shadow-sm bg-surface rounded-3xl overflow-hidden">
            <CardHeader className="bg-surface-container-lowest border-b border-outline-variant p-6">
              <CardTitle className="text-[18px] font-semibold text-[#25D366] flex items-center gap-2">
                <WhatsAppIcon className="h-5 w-5 fill-current" />
                WhatsApp Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {!order.phone ? (
                <div className="text-[14px] font-medium text-on-surface-variant bg-surface-container-highest border border-outline-variant p-4 rounded-xl text-center shadow-sm">
                  Customer phone missing
                </div>
              ) : (
                <>
                  <Button 
                    onClick={() => sendOrderReadyMessage(order.customerName, order.dressType || 'Suit', order.tokenId, settings?.name || 'Loop Tailor', order.phone, settings?.messageTemplates)}
                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium rounded-full h-12 shadow-sm border-none flex justify-center items-center gap-2"
                  >
                    <WhatsAppIcon className="h-4 w-4 fill-current" /> Send "Order Ready"
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => sendPaymentReminderMessage(order.customerName, balanceDue.toString(), settings?.name || 'Loop Tailor', order.phone, settings?.messageTemplates)}
                    className="w-full bg-surface hover:bg-surface-variant text-on-surface font-medium rounded-full h-12 shadow-sm border border-outline-variant flex justify-center items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" /> Payment Reminder
                  </Button>

                  {showCustomWa ? (
                    <div className="pt-4 border-t border-outline-variant space-y-3">
                      <span className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant block">Custom Message</span>
                      <textarea
                        value={customWaMessage}
                        onChange={(e) => setCustomWaMessage(e.target.value)}
                        placeholder="Write a custom message for WhatsApp..."
                        className="w-full p-4 rounded-2xl resize-none bg-surface-container-highest border border-outline-variant focus:border-primary text-[14px] font-medium text-on-surface outline-none shadow-sm"
                        rows={3}
                      />
                      <div className="flex gap-3">
                        <Button
                          variant="ghost" 
                          onClick={() => setShowCustomWa(false)}
                          className="flex-1 bg-surface hover:bg-surface-variant border border-outline-variant shadow-sm rounded-full h-12 text-on-surface-variant font-medium"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => {
                            sendWhatsAppMessage(order.phone, customWaMessage);
                            setShowCustomWa(false);
                            setCustomWaMessage('');
                          }}
                          className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full h-12 shadow-sm border-none font-medium"
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
                      className="w-full text-primary font-medium rounded-full h-12 bg-surface hover:bg-surface-variant border border-outline-variant shadow-sm flex justify-center items-center gap-2"
                    >
                      <Edit2 className="h-4 w-4" /> Custom Message
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AnimatePresence>
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
    </motion.div>
  );
}
