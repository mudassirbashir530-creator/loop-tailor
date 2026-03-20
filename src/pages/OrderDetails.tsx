import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Calendar, MapPin, Ruler, User, Phone, Hash, CheckCircle, Edit2, Save, X, Loader2, Clock, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function OrderDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  useEffect(() => {
    if (!user || !id) return;
    fetchOrder();
  }, [user, id]);

  const fetchOrder = async () => {
    try {
      const docRef = doc(db, 'shops', user.uid, 'orders', id!);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOrder({ id: docSnap.id, ...data });
        setEditData({ ...data });

        // Fetch shop data
        const shopSnap = await getDoc(doc(db, 'shops', user.uid));
        if (shopSnap.exists()) {
          setShop(shopSnap.data());
        }
      } else {
        navigate('/dashboard/orders');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `orders/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await updateDoc(doc(db, 'shops', user.uid, 'orders', id!), { 
        status: newStatus, 
        updatedAt: serverTimestamp() 
      });
      fetchOrder();
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
      fetchOrder();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '---';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return format(d, 'MMMM dd, yyyy');
  };

  const formatDateTime = (date: any) => {
    if (!date) return '---';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return format(d, 'MMM dd, yyyy HH:mm');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="h-12 w-12 text-brand-primary animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading order details...</p>
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/orders')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Token</span>
              <span className="text-2xl font-black text-brand-primary">#{order.tokenId}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{order.customerName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {order.status !== 'Delivered' && (
            <Button 
              onClick={() => handleUpdateStatus('Delivered')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl px-8 h-12 shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Deliver
            </Button>
          )}
          <Button 
            variant={isEditing ? "default" : "outline"}
            onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
            className={cn(
              "rounded-2xl font-black h-12 px-6 transition-all hover:scale-105 active:scale-95",
              isEditing ? "bg-slate-900 text-white" : "border-slate-200"
            )}
          >
            {isEditing ? <Save className="h-5 w-5 mr-2" /> : <Edit2 className="h-5 w-5 mr-2" />}
            {isEditing ? 'Save' : 'Edit'}
          </Button>
          {isEditing && (
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="rounded-2xl h-12 w-12">
              <X className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info Card */}
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid sm:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Details</span>
                  <div className="flex items-center gap-3 text-slate-700">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold">{order.customerName}</span>
                  </div>
                  {order.phone && (
                    <div className="flex items-center gap-3 text-slate-700 mt-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold">{order.phone}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dress Type</span>
                  <div className="text-lg font-bold text-slate-900">{order.dressType}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</span>
                  <div className="mt-1">
                    <select 
                      disabled={!isEditing}
                      value={isEditing ? editData.status : order.status}
                      onChange={(e) => setEditData({...editData, status: e.target.value})}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-100 disabled:bg-slate-50"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Stitching">Stitching</option>
                      <option value="Ready">Ready</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rack Location</span>
                  <div className="flex items-center gap-3 text-slate-700">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {isEditing ? (
                      <Input 
                        value={editData.rackLocation}
                        onChange={(e) => setEditData({...editData, rackLocation: e.target.value})}
                        className="h-9 rounded-lg"
                      />
                    ) : (
                      <span className="font-bold text-brand-primary">{order.rackLocation || 'Not Assigned'}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery Date</span>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="font-bold text-slate-900">{formatDate(order.deliveryDate)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes</span>
                  <p className="text-sm text-slate-600 italic">
                    {order.notes || 'No special instructions.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Measurements Card */}
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Ruler className="h-5 w-5 text-brand-primary" />
                Measurements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {order.measurements && Object.entries(order.measurements).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                      {key}
                    </span>
                    {isEditing ? (
                      <Input 
                        type="number"
                        step="0.1"
                        value={editData.measurements[key]}
                        onChange={(e) => setEditData({
                          ...editData, 
                          measurements: { ...editData.measurements, [key]: e.target.value }
                        })}
                        className="h-8 text-sm font-bold"
                      />
                    ) : (
                      <span className="text-lg font-black text-slate-900">{value}"</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Payment Card */}
          <Card className="border-none shadow-sm bg-slate-900 text-white rounded-[2rem] overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Price</span>
                <div className="text-3xl font-black">PKR {order.price}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Advance Paid</span>
                <div className="text-xl font-bold text-emerald-400">PKR {order.advancePayment || 0}</div>
              </div>
              <div className="pt-6 border-t border-white/10 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Balance Due</span>
                <div className="text-2xl font-black text-brand-secondary">
                  PKR {order.price - (order.advancePayment || 0)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Created On</span>
                  <span className="text-sm font-black text-slate-900">
                    {formatDateTime(order.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Hash className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">System ID</span>
                  <span className="text-xs font-mono font-bold text-slate-400 break-all">{order.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Preview Card */}
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden border border-slate-100">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-primary" />
                Invoice Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{shop?.name || 'Your Shop'}</h4>
                    <p className="text-[10px] text-slate-500">Invoice Preview</p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest",
                      order.status === 'Delivered' ? "bg-emerald-100 text-emerald-700" :
                      order.status === 'Ready' ? "bg-blue-100 text-blue-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {order.status}
                    </span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Customer</span>
                    <span className="font-bold text-slate-900">{order.customerName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Total Amount</span>
                    <span className="font-bold text-slate-900">PKR {order.price}</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full rounded-xl h-10 text-xs font-bold border-slate-200 hover:bg-slate-100"
                  onClick={() => navigate(`/dashboard/orders/${order.id}/invoice`)}
                >
                  View Full Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
