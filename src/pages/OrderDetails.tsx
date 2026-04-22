import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useShop } from '../contexts/ShopContext';
import { ORDER_STATUS } from '../lib/config';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, ArrowRight, Calendar, MapPin, Ruler, User, Phone, Hash, CheckCircle, Edit2, Save, X, Loader2, Clock, CreditCard, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { getMeasurementName } from '../lib/measurements';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { sendOrderReadyMessage, sendPaymentReminderMessage, sendWhatsAppMessage } from '../lib/whatsapp';
import { useStaff } from '../hooks/useStaff';
import { MessageCircle } from 'lucide-react';

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
  const [customWaMessage, setCustomWaMessage] = useState('');
  const [showCustomWa, setShowCustomWa] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    
    setLoading(true);
    
    const unsubOrder = onSnapshot(doc(db, 'shops', user.uid, 'orders', id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOrder({ id: docSnap.id, ...data });
        setEditData({ ...data });
      } else {
        navigate('/dashboard/orders');
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `orders/${id}`);
      setLoading(false);
    });

    const unsubShop = onSnapshot(doc(db, 'shops', user.uid), (shopSnap) => {
      if (shopSnap.exists()) {
        setShop(shopSnap.data());
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `shops/${user.uid}`));

    return () => {
      unsubOrder();
      unsubShop();
    };
  }, [user, id]);

  const handleDeleteOrder = async () => {
    if (!window.confirm(t('orderDetails.deleteConfirm'))) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'shops', user!.uid, 'orders', id!));
      toast.success(t('orderDetails.orderDeleted') || 'Order deleted successfully');
      navigate('/dashboard/orders');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${id}`);
      setIsDeleting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await updateDoc(doc(db, 'shops', user.uid, 'orders', id!), { 
        status: newStatus, 
        updatedAt: serverTimestamp() 
      });
      toast.success(t('orderDetails.statusUpdated') || 'Status updated successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateDoc(doc(db, 'shops', user.uid, 'orders', id!), {
        ...editData,
        updatedAt: serverTimestamp()
      });
      setIsEditing(false);
      toast.success(t('orderDetails.orderUpdated') || 'Order updated successfully');

      // In case status was changed directly in the edit modal to Ready or Delivered
      if (editData.status !== order.status) {
        if (settings.enableWhatsappNotifications && (editData.status === ORDER_STATUS.READY || editData.status === ORDER_STATUS.DELIVERED)) {
          if (editData.phone || order.phone) {
            await sendWhatsappNotification({
              to: editData.phone || order.phone,
              customerName: editData.customerName || order.customerName,
              dressType: editData.dressType || order.dressType || 'Suit',
              token: order.tokenId,
              shopName: settings.name || 'Loop Tailor',
              status: editData.status,
              orderId: order.id,
              shopId: user.uid
            });
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const totalPaid = (order?.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0) + Number(order?.advancePayment || 0);
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

    const newPayment = {
      amount,
      date: new Date().toISOString(),
      method: paymentForm.method,
      note: paymentForm.note
    };

    const newPayments = [...(order.payments || []), newPayment];
    const newTotalPaid = totalPaid + amount;
    const newPaymentStatus = newTotalPaid >= order.price ? 'Paid' : 'Partial';

    try {
      await updateDoc(doc(db, 'shops', user!.uid, 'orders', id!), {
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/orders')} className="bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm border-none rounded-xl">
            {isRTL ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t('orderDetails.token')}</span>
              <span className="text-2xl font-black text-brand-primary">#{order.tokenId}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{order.customerName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {order.status !== ORDER_STATUS.DELIVERED && (
            <Button 
              onClick={() => handleUpdateStatus(ORDER_STATUS.DELIVERED)}
              className="bg-emerald-500 text-white font-black rounded-2xl px-6 h-12 shadow-neu-sm hover:shadow-neu-pressed-sm transition-all border-none"
            >
              <CheckCircle className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />
              {t('orderDetails.deliver')}
            </Button>
          )}
          <Button 
            variant="ghost"
            onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
            className={cn(
              "rounded-2xl font-black h-12 px-6 transition-all border-none",
              isEditing ? "bg-gray-100 shadow-neu-pressed text-brand-primary" : "bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm text-slate-700"
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
              className="rounded-2xl font-black h-12 px-6 border-none text-red-500 bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm transition-all"
            >
              {isDeleting ? <Loader2 className={cn("h-5 w-5 animate-spin", isRTL ? "ml-2" : "mr-2")} /> : <Trash2 className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />}
              {t('orderDetails.delete')}
            </Button>
          )}
          {isEditing && (
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="rounded-2xl h-12 w-12 bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm border-none">
              <X className="h-6 w-6 text-slate-500" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info Card */}
          <Card className="border-none shadow-neu bg-gray-100 rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-transparent border-b border-gray-200/50 p-6">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <User className="h-5 w-5 text-brand-primary" />
                {t('orderDetails.orderInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid sm:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('orderDetails.customerDetails')}</span>
                  <div className="flex items-center gap-3 text-slate-900">
                    <User className="h-4 w-4 text-brand-primary" />
                    <span className="font-bold">{order.customerName}</span>
                  </div>
                  {order.phone && (
                    <div className="flex items-center gap-3 text-slate-900 mt-2">
                      <Phone className="h-4 w-4 text-brand-primary" />
                      <span className="font-bold">{order.phone}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('orderDetails.dressType')}</span>
                  <div className="text-lg font-black text-slate-900">{order.dressType}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('orderDetails.status')}</span>
                  <div className="mt-2">
                    <select 
                      disabled={!isEditing}
                      value={isEditing ? editData.status : order.status}
                      onChange={(e) => setEditData({...editData, status: e.target.value})}
                      className="h-12 w-full rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none px-4 text-base sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-100 disabled:shadow-neu-sm"
                    >
                      <option value={ORDER_STATUS.PENDING}>{t('orderDetails.pending')}</option>
                      <option value={ORDER_STATUS.STITCHING}>{t('orderDetails.stitching')}</option>
                      <option value={ORDER_STATUS.READY}>{t('orderDetails.ready')}</option>
                      <option value={ORDER_STATUS.DELIVERED}>{t('orderDetails.delivered')}</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Assigned Worker</span>
                  <div className="flex items-center gap-3 text-slate-900 mt-2">
                    <User className="h-4 w-4 text-brand-primary" />
                    {isEditing ? (
                      <select
                        value={editData.assignedWorkerId || ''}
                        onChange={(e) => setEditData({...editData, assignedWorkerId: e.target.value})}
                        className="h-10 w-full rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      >
                        <option value="">Unassigned</option>
                        {staff.map(w => (
                          <option key={w.id} value={w.id}>{w.name} ({w.role})</option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-bold">
                        {order.assignedWorkerId 
                          ? staff.find(w => w.id === order.assignedWorkerId)?.name || 'Unknown'
                          : 'Unassigned'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('orderDetails.rackLocation')}</span>
                  <div className="flex items-center gap-3 text-slate-900 mt-1">
                    <MapPin className="h-4 w-4 text-brand-primary" />
                    {isEditing ? (
                      <Input 
                        value={editData.rackLocation}
                        onChange={(e) => setEditData({...editData, rackLocation: e.target.value})}
                        className="h-10 rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none"
                      />
                    ) : (
                      <span className="font-bold">{order.rackLocation || t('orderDetails.notAssigned')}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('orderDetails.deliveryDate')}</span>
                  <div className="flex items-center gap-3 text-slate-900 mt-1">
                    <Calendar className="h-4 w-4 text-brand-primary" />
                    <span className="font-bold">{formatDate(order.deliveryDate)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('orderDetails.notes')}</span>
                  <p className="text-sm text-slate-700 font-medium mt-1 bg-gray-100 shadow-neu-pressed-sm p-3 rounded-xl min-h-[60px]">
                    {order.notes || t('orderDetails.noNotes')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Measurements Card */}
          <Card className="border-none shadow-neu bg-gray-100 rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-transparent border-b border-gray-200/50 p-6 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Ruler className="h-5 w-5 text-brand-primary" />
                {t('orderDetails.measurements')}
              </CardTitle>
              <Button
                variant="ghost"
                onClick={() => navigate(`/dashboard/customers/${order.customerId}#measurements`)}
                className="bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm text-brand-primary rounded-xl h-9 text-xs font-bold border-none"
              >
                {t('orderDetails.edit')}
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6 p-4 bg-brand-primary/10 rounded-2xl border border-brand-primary/20 flex items-start gap-3">
                <Ruler className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-brand-primary">Historical Snapshot</p>
                  <p className="text-xs text-brand-primary/80 mt-1">To update measurements, go to Customer Profile. The measurements shown below are a static record from when the order was placed.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {order.measurements && Object.entries(order.measurements).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-gray-100 shadow-neu-pressed-sm p-4 rounded-2xl border-none">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">
                      {getMeasurementName(key, isRTL)}
                    </span>
                    <span className="text-xl font-black text-slate-900">{value}"</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Payment Card */}
          <Card className="border-none shadow-neu bg-gray-100 rounded-[2rem] overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Payment Status</span>
                <span className={cn(
                  "text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-neu-sm",
                  (!order.paymentStatus || order.paymentStatus === 'Unpaid') ? "bg-gray-100 text-rose-500" :
                  order.paymentStatus === 'Partial' ? "bg-gray-100 text-blue-500" :
                  "bg-gray-100 text-emerald-500"
                )}>
                  {order.paymentStatus || 'Unpaid'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('orderDetails.totalPrice')}</span>
                <div className="text-3xl font-black text-slate-900">{settings.currency} {order.price}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Paid</span>
                <div className="text-xl font-bold text-emerald-600">{settings.currency} {totalPaid}</div>
              </div>
              <div className="pt-6 border-t border-gray-200/50 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('orderDetails.balanceDue')}</span>
                <div className="text-2xl font-black text-brand-primary">
                  {settings.currency} {balanceDue}
                </div>
              </div>
              
              {balanceDue > 0 && (
                <Button 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full bg-brand-primary text-white font-bold rounded-2xl h-12 shadow-neu-sm border-none mt-4"
                >
                  Record Payment
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card className="border-none shadow-neu bg-gray-100 rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gray-100 shadow-neu-pressed-sm flex items-center justify-center text-brand-primary">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">{t('orderDetails.createdOn')}</span>
                  <span className="text-sm font-black text-slate-900">
                    {formatDateTime(order.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gray-100 shadow-neu-pressed-sm flex items-center justify-center text-brand-primary">
                  <Hash className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">{t('orderDetails.systemId')}</span>
                  <span className="text-xs font-mono font-bold text-slate-500 break-all">{order.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Preview Card */}
          <Card className="border-none shadow-neu bg-gray-100 rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-transparent border-b border-gray-200/50 p-6">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-primary" />
                {t('orderDetails.invoicePreview')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="p-5 rounded-2xl bg-gray-100 shadow-neu-pressed-sm border-none space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{shop?.name || t('orderDetails.yourShop')}</h4>
                    <p className="text-[10px] text-slate-500">{t('orderDetails.invoicePreview')}</p>
                  </div>
                  <div className={cn(isRTL ? "text-left" : "text-right")}>
                    <span className={cn(
                      "text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-neu-sm",
                      order.status === ORDER_STATUS.DELIVERED ? "bg-gray-100 text-emerald-600" :
                      order.status === ORDER_STATUS.READY ? "bg-gray-100 text-blue-600" :
                      "bg-gray-100 text-amber-600"
                    )}>
                      {order.status === ORDER_STATUS.PENDING ? t('orderDetails.pending') :
                       order.status === ORDER_STATUS.STITCHING ? t('orderDetails.stitching') :
                       order.status === ORDER_STATUS.READY ? t('orderDetails.ready') :
                       order.status === ORDER_STATUS.DELIVERED ? t('orderDetails.delivered') : order.status}
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200/50 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-bold">{t('orderDetails.customer')}</span>
                    <span className="font-black text-slate-900">{order.customerName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-bold">{t('orderDetails.totalAmount')}</span>
                    <span className="font-black text-slate-900">{settings.currency} {order.price}</span>
                  </div>
                </div>

                <Button 
                  variant="ghost" 
                  className="w-full rounded-xl h-12 text-sm font-bold bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm text-brand-primary border-none mt-2"
                  onClick={() => navigate(`/dashboard/orders/${order.id}/invoice`)}
                >
                  {t('orderDetails.viewFullInvoice')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Communications Card */}
          <Card className="border-none shadow-neu bg-gray-100 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-transparent border-b border-gray-200/50 p-6">
              <CardTitle className="text-lg font-bold text-[#25D366] flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                WhatsApp Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {!order.phone ? (
                <div className="text-sm font-bold text-slate-500 bg-gray-100 shadow-neu-pressed-sm p-4 rounded-xl text-center">
                  Customer phone missing
                </div>
              ) : (
                <>
                  <Button 
                    onClick={() => sendOrderReadyMessage(order.customerName, order.dressType || 'Suit', order.tokenId, settings?.name || 'Loop Tailor', order.phone, settings?.messageTemplates)}
                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-2xl h-12 shadow-neu-sm border-none flex justify-center items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" /> Send "Order Ready"
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => sendPaymentReminderMessage(order.customerName, balanceDue.toString(), settings?.name || 'Loop Tailor', order.phone, settings?.messageTemplates)}
                    className="w-full bg-gray-100 hover:bg-gray-50 text-slate-700 font-bold rounded-2xl h-12 shadow-neu-sm hover:shadow-neu-pressed-sm border-none flex justify-center items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" /> Payment Reminder
                  </Button>

                  {showCustomWa ? (
                    <div className="pt-4 border-t border-gray-200/50 space-y-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Custom Message</span>
                      <textarea
                        value={customWaMessage}
                        onChange={(e) => setCustomWaMessage(e.target.value)}
                        placeholder="Write a custom message for WhatsApp..."
                        className="w-full p-4 rounded-xl resize-none bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-0 text-sm font-medium text-slate-700 outline-none"
                        rows={3}
                      />
                      <div className="flex gap-3">
                        <Button
                          variant="ghost" 
                          onClick={() => setShowCustomWa(false)}
                          className="flex-1 bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm rounded-xl h-10 border-none text-slate-500 font-bold"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => {
                            sendWhatsAppMessage(order.phone, customWaMessage);
                            setShowCustomWa(false);
                            setCustomWaMessage('');
                          }}
                          className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl h-10 shadow-neu-sm border-none font-bold"
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
                      className="w-full text-brand-primary font-bold rounded-2xl h-12 bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm border-none flex justify-center items-center gap-2"
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
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            >
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsPaymentModalOpen(false)}
                className="absolute right-4 top-4 rounded-full bg-slate-100 hover:bg-slate-200 p-2"
              >
                <X className="h-5 w-5" />
              </Button>

              <h2 className="text-2xl font-black text-slate-900 mb-6">Record Payment</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Amount</label>
                  <Input 
                    type="number" 
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    placeholder={`Max ${settings.currency} ${balanceDue}`}
                    className="h-12 bg-gray-50 border-none shadow-inner rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Payment Method</label>
                  <select 
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})}
                    className="w-full h-12 bg-gray-50 border-none shadow-inner rounded-xl font-bold px-4"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Mobile Money">Mobile Money</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Note (Optional)</label>
                  <Input 
                    type="text" 
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm({...paymentForm, note: e.target.value})}
                    placeholder="e.g. Paid via Easypaisa"
                    className="h-12 bg-gray-50 border-none shadow-inner rounded-xl font-bold"
                  />
                </div>

                <Button 
                  onClick={handleRecordPayment}
                  className="w-full bg-brand-primary text-white font-bold rounded-2xl h-12 mt-6"
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
