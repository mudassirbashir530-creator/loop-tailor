import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useShop } from '../contexts/ShopContext';
import { ORDER_STATUS, isValidStatusTransition, OrderStatus } from '../lib/config';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot, collection, query, where, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, ArrowRight, Calendar, MapPin, Ruler, User, Phone, Hash, CheckCircle, Edit2, Save, X, Loader2, Clock, CreditCard, Trash2, Home, Store, Scissors, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { getMeasurementName } from '../lib/measurements';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { sendOrderReadyMessage, sendPaymentReminderMessage, sendWhatsAppMessage } from '../lib/whatsapp';
import { createNotification, sendWhatsappNotification } from '../lib/notifications';
import { useStaff } from '../hooks/useStaff';
import { WhatsAppIcon } from '../components/icons/WhatsAppIcon';
import { OrderTimeline } from '../components/OrderTimeline';

export default function OrderDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const { settings } = useShop();
  const navigate = useNavigate();
  const { staff } = useStaff();
  const [order, setOrder] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'Cash', note: '' });
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

    const qPayments = query(collection(db, 'payments'), where('userId', '==', user.uid), where('orderId', '==', id));
    const unsubPayments = onSnapshot(qPayments, (paymentsSnap) => {
      const pData = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPaymentsList(pData.sort((a: any, b: any) => {
        const dateA = a.date?.seconds ? new Date(a.date.seconds * 1000) : new Date(a.date || 0);
        const dateB = b.date?.seconds ? new Date(b.date.seconds * 1000) : new Date(b.date || 0);
        return dateB.getTime() - dateA.getTime();
      }));
    }, (error) => handleFirestoreError(error, OperationType.GET, `payments for order ${id}`));

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

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    
    try {
      const history = { ...(order.statusHistory || {}) };
      history[ORDER_STATUS.CANCELLED] = new Date().toISOString();
      await updateDoc(doc(db, 'orders', id!), { 
        status: ORDER_STATUS.CANCELLED,
        statusHistory: history,
        updatedAt: serverTimestamp() 
      });
      toast.success("Order cancelled");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!isValidStatusTransition(order.status as OrderStatus, newStatus as OrderStatus)) {
      let errorMsg = "Status flow mismatch. Cannot jump to this status.";
      if (order.status === ORDER_STATUS.DELIVERED) {
        errorMsg = "Order already delivered, status cannot be changed";
      }
      toast.error(errorMsg);
      return;
    }

    try {
      const history = { ...(order.statusHistory || {}) };
      history[newStatus] = new Date().toISOString();
      
      const updateData: any = { 
        status: newStatus, 
        statusHistory: history,
        updatedAt: serverTimestamp() 
      };

      await updateDoc(doc(db, 'orders', id!), updateData);
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

      // Feature 2: Worker Earnings Tracking
      if (newStatus === ORDER_STATUS.DELIVERED && order.workerId) {
        const staffMember = staff.find(s => s.id === order.workerId);
        if (staffMember) {
          try {
            // Calculate earning: if has explicit commission, use it; else if per-order, use staff rate
            const commission = Number(order.workerCommission || 0);
            const staffRate = (staffMember as any).salaryType === 'per-order' ? Number((staffMember as any).salaryAmount || 0) : 0;
            const earnings = commission > 0 ? commission : staffRate;

            await addDoc(collection(db, 'payroll'), {
              userId: user.uid,
              staffId: staffMember.id,
              staffName: staffMember.name,
              orderId: id,
              tokenId: order.tokenId,
              customerName: order.customerName,
              orderPrice: Number(order.price || 0),
              paymentAmount: earnings,
              type: 'Earning', // Distinguished from manual payments
              paidStatus: 'pending',
              month: format(new Date(), 'yyyy-MM'),
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
    if (editData.status !== order.status) {
      if (!isValidStatusTransition(order.status as OrderStatus, editData.status as OrderStatus)) {
        toast.error(order.status === ORDER_STATUS.DELIVERED ? "Order already delivered, status cannot be changed" : "Invalid status transition");
        return;
      }
    }

    try {
      const history = { ...(order.statusHistory || {}) };
      if (editData.status !== order.status) {
        history[editData.status] = new Date().toISOString();
      }
      
      const dataToSave = {
        ...editData,
        workerCommission: Number(editData.workerCommission || 0),
        statusHistory: history,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'orders', id!), dataToSave);
      setIsEditing(false);
      toast.success(t('orderDetails.orderUpdated') || 'Order updated successfully');

      // Feature 2: Worker Earnings Tracking (on edit save)
      if (editData.status === ORDER_STATUS.DELIVERED && order.status !== ORDER_STATUS.DELIVERED && editData.workerId) {
        const staffMember = staff.find(s => s.id === editData.workerId);
        if (staffMember) {
          try {
            const commission = Number(editData.workerCommission || 0);
            const staffRate = (staffMember as any).salaryType === 'per-order' ? Number((staffMember as any).salaryAmount || 0) : 0;
            const earnings = commission > 0 ? commission : staffRate;

            await addDoc(collection(db, 'payroll'), {
              userId: user.uid,
              staffId: staffMember.id,
              staffName: staffMember.name,
              orderId: id,
              tokenId: order.tokenId,
              customerName: order.customerName,
              orderPrice: Number(editData.price || order.price || 0),
              paymentAmount: earnings,
              type: 'Earning',
              paidStatus: 'pending',
              month: format(new Date(), 'yyyy-MM'),
              createdAt: serverTimestamp()
            });
          } catch (payrollError) {
             console.error('Error creating payroll entry:', payrollError);
          }
        }
      }

      // Sync payroll if already delivered and commission changed
      if (order.status === ORDER_STATUS.DELIVERED && dataToSave.workerCommission !== (order.workerCommission || 0)) {
         // This is complex to sync existing payroll records, usually better to warn or just handle new ones.
         // For now, new orders will use the correct commission.
      }

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
      await addDoc(collection(db, 'payments'), {
        userId: user!.uid,
        orderId: id,
        amount,
        method: paymentForm.method,
        note: paymentForm.note,
        date: serverTimestamp()
      });

      const newTotalPaid = totalPaid + amount;
      const newPaymentStatus = newTotalPaid >= order.price ? 'Paid' : 'Partial';
      
      const newPaymentLog = {
        amount,
        date: new Date().toISOString(),
        method: paymentForm.method,
        note: paymentForm.note
      };
      const newPayments = [...(order.payments || []), newPaymentLog];

      await updateDoc(doc(db, 'orders', id!), {
        payments: newPayments,
        paymentStatus: newPaymentStatus,
        updatedAt: serverTimestamp()
      });
      
      toast.success('Payment recorded successfully');
      setIsPaymentModalOpen(false);
      setPaymentForm({ amount: '', method: 'Cash', note: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
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
        <div className="flex flex-wrap items-center gap-3">
          {order.status !== ORDER_STATUS.DELIVERED && order.status !== ORDER_STATUS.CANCELLED && (
            <Button 
              onClick={() => handleUpdateStatus(ORDER_STATUS.DELIVERED)}
              className="bg-primary hover:bg-on-surface text-primary-foreground font-medium rounded-full px-6 h-12 shadow-sm transition-all border-none"
            >
              <CheckCircle className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />
              {t('orderDetails.deliver')}
            </Button>
          )}

          {order.status !== ORDER_STATUS.CANCELLED && order.status !== ORDER_STATUS.DELIVERED && (
            <Button 
              variant="ghost"
              onClick={handleCancelOrder}
              className="rounded-full font-medium h-12 px-6 border border-red-200 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white shadow-sm transition-all"
            >
              <Ban className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />
              Cancel Order
            </Button>
          )}

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
          {!isEditing && (
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
          {isEditing && (
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="rounded-full h-12 w-12 bg-surface hover:bg-surface-variant border border-outline-variant shadow-sm text-on-surface-variant">
              <X className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>

      <OrderTimeline currentStatus={order.status} statusHistory={order.statusHistory || {}} />

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
                  <div>
                    <select 
                      disabled={!isEditing}
                      value={isEditing ? editData.status : order.status}
                      onChange={(e) => setEditData({...editData, status: e.target.value})}
                      className="h-12 w-full rounded-2xl bg-surface-container-highest border border-outline-variant px-4 text-[15px] font-semibold text-on-surface focus:outline-none focus:border-primary disabled:opacity-100 disabled:bg-surface disabled:border-transparent transition-all"
                    >
                      <option value={ORDER_STATUS.PENDING}>{t('orderDetails.pending')}</option>
                      <option value={ORDER_STATUS.STITCHING}>{t('orderDetails.stitching')}</option>
                      <option value={ORDER_STATUS.READY}>{t('orderDetails.ready')}</option>
                      <option value={ORDER_STATUS.DELIVERED}>{t('orderDetails.delivered')}</option>
                      <option value={ORDER_STATUS.CANCELLED}>{t('orders.cancelled')}</option>
                    </select>
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
                      <div className="flex-1 space-y-3">
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
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold text-on-surface-variant uppercase whitespace-nowrap">Commission (Rs):</span>
                           <Input 
                             type="number"
                             value={editData.workerCommission || 0}
                             onChange={(e) => setEditData({...editData, workerCommission: Number(e.target.value)})}
                             className="h-10 bg-surface-container-highest border border-outline-variant rounded-xl font-bold px-3 text-sm focus:border-primary"
                             placeholder="Commission amount"
                           />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-semibold flex items-center gap-1">
                          {order.workerId 
                            ? <><span className="text-primary">👤</span> {staff.find(w => w.id === order.workerId)?.name || order.workerName || 'Unknown'}</>
                            : 'Unassigned'}
                        </span>
                        {order.workerCommission > 0 && (
                          <span className="text-[11px] font-bold text-[#2ECC71]">Commission: Rs {order.workerCommission}</span>
                        )}
                      </div>
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
          <Card className="border border-outline-variant shadow-sm bg-surface rounded-3xl overflow-hidden">
            <CardHeader className="bg-surface-container-lowest border-b border-outline-variant p-6 flex flex-row items-center justify-between">
              <CardTitle className="text-[18px] font-semibold text-on-surface flex items-center gap-2">
                <Ruler className="h-5 w-5 text-primary" />
                {t('orderDetails.measurements')}
              </CardTitle>
              <Button
                variant="ghost"
                onClick={() => navigate(`/app/clients/${order.customerId}#measurements`)}
                className="bg-surface hover:bg-surface-variant border border-outline-variant shadow-sm text-primary rounded-full px-5 h-9 text-[13px] font-medium"
              >
                {t('orderDetails.edit')}
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6 p-4 bg-primary-container/50 rounded-2xl border border-primary/20 flex items-start gap-4">
                <Ruler className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-semibold text-on-surface">Historical Snapshot</p>
                  <p className="text-[13px] text-on-surface-variant mt-1.5 leading-relaxed">To update measurements, go to Customer Profile. The measurements shown below are a static record from when the order was placed.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {order.measurements && Object.entries(order.measurements).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-surface-container-highest border border-outline-variant shadow-sm p-4 rounded-2xl">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant block mb-2">
                      {getMeasurementName(key, isRTL)}
                    </span>
                    <span className="text-[20px] font-display font-semibold text-on-surface">{value}"</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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

              {((order.payments && order.payments.length > 0) || Number(order.advancePayment) > 0) && (
                <div className="pt-6 border-t border-outline-variant">
                  <span className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant mb-4 block">Payment History</span>
                  <div className="space-y-3">
                    {Number(order.advancePayment) > 0 && (
                      <div className="flex justify-between items-center bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/50">
                        <div>
                          <p className="text-[13px] font-semibold text-on-surface">Initial Advance</p>
                          <p className="text-[11px] text-on-surface-variant font-medium">Cash</p>
                        </div>
                        <span className="text-[14px] font-bold text-[#22C55E]">+{settings.currency} {order.advancePayment}</span>
                      </div>
                    )}
                    {(order.payments || []).map((payment: any, index: number) => (
                      <div key={index} className="flex justify-between items-center bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/50">
                        <div>
                          <p className="text-[13px] font-semibold text-on-surface">{payment.method}</p>
                          <p className="text-[11px] text-on-surface-variant font-medium">
                            {new Date(payment.date).toLocaleDateString()}
                          </p>
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
                      order.status === ORDER_STATUS.CANCELLED ? "bg-red-100 text-red-700" :
                      (order.status === ORDER_STATUS.QC || order.status === ORDER_STATUS.CUTTING || order.status === ORDER_STATUS.STITCHING) ? "bg-orange-100 text-orange-700" :
                      "bg-surface-container-high text-on-surface-variant"
                    )}>
                      {order.status === ORDER_STATUS.PENDING ? t('orderDetails.pending') :
                       order.status === ORDER_STATUS.CUTTING ? t('orders.cutting') :
                       order.status === ORDER_STATUS.STITCHING ? t('orderDetails.stitching') :
                       order.status === ORDER_STATUS.QC ? t('orders.qc') :
                       order.status === ORDER_STATUS.READY ? t('orderDetails.ready') :
                       order.status === ORDER_STATUS.DELIVERED ? t('orderDetails.delivered') : 
                       order.status === ORDER_STATUS.CANCELLED ? t('orders.cancelled') : order.status}
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
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-on-surface-variant uppercase tracking-widest mb-2 block">Note (Optional)</label>
                  <Input 
                    type="text" 
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm({...paymentForm, note: e.target.value})}
                    placeholder="e.g. Paid via Easypaisa"
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
      </AnimatePresence>
    </motion.div>
  );
}
