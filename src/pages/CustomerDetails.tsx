import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db, storage, handleFirestoreError, OperationType, generateTokenId } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, ArrowRight, Plus, Save, Upload, Edit, X, FileText, Phone, MapPin, Notebook, Scissors, Calendar, CreditCard, Hash, Loader2, CheckCircle2, Trash2, User } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getAllMeasurementCategories } from '../lib/measurements';

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState<any>(null);
  const [measurements, setMeasurements] = useState<any>({});
  const [savingMeasurements, setSavingMeasurements] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({ dressType: 'Shalwar Kameez', deliveryDate: '', price: '', advancePayment: '' });
  const [referencePhoto, setReferencePhoto] = useState<File | null>(null);
  const [sampleDesign, setSampleDesign] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState({ name: '', phone: '', address: '', notes: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    fetchData();
  }, [user, id]);

  const fetchData = async () => {
    if (!user || !id) return;
    setLoading(true);
    try {
      const custSnap = await getDoc(doc(db, 'shops', user.uid, 'customers', id));
      if (custSnap.exists() && custSnap.data().shopId === user.uid) {
        setCustomer({ id: custSnap.id, ...custSnap.data() });
        setEditCustomerData({
          name: custSnap.data().name || '',
          phone: custSnap.data().phone || '',
          address: custSnap.data().address || '',
          notes: custSnap.data().notes || ''
        });
      } else {
        navigate('/dashboard/customers');
        return;
      }

      const measSnap = await getDoc(doc(db, 'shops', user.uid, 'measurements', id));
      if (measSnap.exists()) {
        setMeasurements(measSnap.data());
      }

      const q = query(collection(db, 'shops', user.uid, 'orders'), where('customerId', '==', id));
      const ordSnap = await getDocs(q);
      const data = ordSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `customers/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!window.confirm(t('customerDetails.deleteConfirm'))) return;
    
    setIsDeletingCustomer(true);
    try {
      await deleteDoc(doc(db, 'shops', user!.uid, 'customers', id!));
      navigate('/dashboard/customers');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `customers/${id}`);
      setIsDeletingCustomer(false);
    }
  };

  const handleSaveMeasurements = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    setSavingMeasurements(true);
    setSaveSuccess(false);
    try {
      await setDoc(doc(db, 'shops', user.uid, 'measurements', id), {
        ...measurements,
        shopId: user.uid,
        customerId: id,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `measurements/${id}`);
    } finally {
      setSavingMeasurements(false);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    try {
      await updateDoc(doc(db, 'shops', user.uid, 'customers', id), {
        ...editCustomerData,
        updatedAt: serverTimestamp()
      });
      setCustomer({ ...customer, ...editCustomerData });
      setIsEditingCustomer(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `customers/${id}`);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !customer) return;
    setIsUploading(true);
    try {
      let referencePhotoUrl = '';
      let sampleDesignUrl = '';

      // Get next token ID
      const tokenId = await generateTokenId(user.uid);

      const orderRef = await addDoc(collection(db, 'shops', user.uid, 'orders'), {
        shopId: user.uid,
        customerId: id,
        customerName: customer.name,
        tokenId,
        dressType: newOrder.dressType,
        deliveryDate: new Date(newOrder.deliveryDate).toISOString(),
        status: 'Pending',
        price: Number(newOrder.price),
        advancePayment: Number(newOrder.advancePayment),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      /* BETA: Image upload is disabled
      if (referencePhoto) {
        const photoRef = ref(storage, `orders/${orderRef.id}/reference_${referencePhoto.name}`);
        await uploadBytes(photoRef, referencePhoto);
        referencePhotoUrl = await getDownloadURL(photoRef);
      }

      if (sampleDesign) {
        const designRef = ref(storage, `orders/${orderRef.id}/sample_${sampleDesign.name}`);
        await uploadBytes(designRef, sampleDesign);
        sampleDesignUrl = await getDownloadURL(designRef);
      }

      if (referencePhotoUrl || sampleDesignUrl) {
        await updateDoc(orderRef, { referencePhotoUrl, sampleDesignUrl });
      }
      */

      setIsAddingOrder(false);
      setNewOrder({ dressType: 'Shalwar Kameez', deliveryDate: '', price: '', advancePayment: '' });
      setReferencePhoto(null);
      setSampleDesign(null);
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return t('customerDetails.na');
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'MMM dd, yyyy');
    } catch (e) {
      return t('customerDetails.invalidDate');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-12 w-12 text-brand-primary animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('customerDetails.loading')}</p>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="space-y-10 pb-20">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard/customers')} 
            className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-100 hover:bg-slate-50"
          >
            {isRTL ? <ArrowRight className="h-6 w-6" /> : <ArrowLeft className="h-6 w-6" />}
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-slate-900">{customer.name}</h1>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsEditingCustomer(!isEditingCustomer)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5"
              >
                {isEditingCustomer ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDeleteCustomer}
                disabled={isDeletingCustomer}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
              >
                {isDeletingCustomer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-slate-500 font-bold text-sm">
              <div className="flex items-center">
                <Phone className={cn("h-4 w-4 text-slate-400", isRTL ? "ml-2" : "mr-2")} />
                {customer.phone}
              </div>
              {customer.address && (
                <div className="flex items-center">
                  <MapPin className={cn("h-4 w-4 text-slate-400", isRTL ? "ml-2" : "mr-2")} />
                  {customer.address}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <Button 
            onClick={() => setIsAddingOrder(!isAddingOrder)}
            className={cn(
              "h-14 px-8 rounded-2xl font-black text-base shadow-lg transition-all hover:scale-105 active:scale-95",
              isAddingOrder ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-brand-primary text-white hover:bg-brand-primary/90 shadow-brand-primary/20"
            )}
          >
            {isAddingOrder ? <X className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} /> : <Plus className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />}
            {isAddingOrder ? t('customerDetails.cancel') : t('customerDetails.newOrder')}
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isEditingCustomer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden border-2 border-brand-primary/10">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-black text-slate-900">{t('customerDetails.editProfile')}</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <form onSubmit={handleUpdateCustomer} className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className={cn("text-xs font-black text-slate-400 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customerDetails.fullName')}</label>
                    <div className="relative">
                      <User className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        required 
                        value={editCustomerData.name} 
                        onChange={e => setEditCustomerData({...editCustomerData, name: e.target.value})} 
                        className={cn("h-14 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary text-base font-bold transition-all", isRTL ? "pr-12" : "pl-12")}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-xs font-black text-slate-400 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customerDetails.phoneNumber')}</label>
                    <div className="relative">
                      <Phone className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        required 
                        value={editCustomerData.phone} 
                        onChange={e => setEditCustomerData({...editCustomerData, phone: e.target.value})} 
                        className={cn("h-14 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary text-base font-bold transition-all", isRTL ? "pr-12" : "pl-12")}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className={cn("text-xs font-black text-slate-400 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customerDetails.address')}</label>
                    <div className="relative">
                      <MapPin className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        value={editCustomerData.address} 
                        onChange={e => setEditCustomerData({...editCustomerData, address: e.target.value})} 
                        className={cn("h-14 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary text-base font-bold transition-all", isRTL ? "pr-12" : "pl-12")}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className={cn("text-xs font-black text-slate-400 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customerDetails.notes')}</label>
                    <div className="relative">
                      <Notebook className={cn("absolute top-4 h-5 w-5 text-slate-400 z-10", isRTL ? "right-4" : "left-4")} />
                      <textarea 
                        value={editCustomerData.notes} 
                        onChange={e => setEditCustomerData({...editCustomerData, notes: e.target.value})} 
                        className={cn("w-full min-h-[100px] px-4 py-4 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary text-base font-bold transition-all focus:outline-none", isRTL ? "pr-12" : "pl-12")}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => setIsEditingCustomer(false)} className="h-12 px-6 rounded-xl font-bold">{t('customerDetails.cancel')}</Button>
                    <Button type="submit" className="h-12 px-8 rounded-xl bg-slate-900 text-white font-black">{t('customerDetails.saveChanges')}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <AnimatePresence>
            {isAddingOrder && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2.5rem] overflow-hidden">
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-2xl font-black">{t('customerDetails.newOrderFor')} {customer.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <form onSubmit={handleCreateOrder} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className={cn("text-xs font-black text-slate-400 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customerDetails.dressType')}</label>
                          <div className="relative">
                            <Scissors className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10", isRTL ? "right-4" : "left-4")} />
                            <Input 
                              required 
                              value={newOrder.dressType} 
                              onChange={e => setNewOrder({...newOrder, dressType: e.target.value})} 
                              className={cn("h-14 rounded-2xl bg-white/10 border-white/10 text-white focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary text-base font-bold transition-all placeholder:text-white/30", isRTL ? "pr-12" : "pl-12")}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className={cn("text-xs font-black text-slate-400 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customerDetails.deliveryDate')}</label>
                          <div className="relative">
                            <Calendar className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10", isRTL ? "right-4" : "left-4")} />
                            <Input 
                              type="date" 
                              required 
                              value={newOrder.deliveryDate} 
                              onChange={e => setNewOrder({...newOrder, deliveryDate: e.target.value})} 
                              className={cn("h-14 rounded-2xl bg-white/10 border-white/10 text-white focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary text-base font-bold transition-all", isRTL ? "pr-12" : "pl-12")}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className={cn("text-xs font-black text-slate-400 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customerDetails.totalPrice')}</label>
                          <div className="relative">
                            <CreditCard className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10", isRTL ? "right-4" : "left-4")} />
                            <Input 
                              type="number" 
                              required 
                              value={newOrder.price} 
                              onChange={e => setNewOrder({...newOrder, price: e.target.value})} 
                              className={cn("h-14 rounded-2xl bg-white/10 border-white/10 text-white focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary text-base font-bold transition-all placeholder:text-white/30", isRTL ? "pr-12" : "pl-12")}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className={cn("text-xs font-black text-slate-400 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customerDetails.advancePayment')}</label>
                          <div className="relative">
                            <CreditCard className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10", isRTL ? "right-4" : "left-4")} />
                            <Input 
                              type="number" 
                              value={newOrder.advancePayment} 
                              onChange={e => setNewOrder({...newOrder, advancePayment: e.target.value})} 
                              className={cn("h-14 rounded-2xl bg-white/10 border-white/10 text-white focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary text-base font-bold transition-all placeholder:text-white/30", isRTL ? "pr-12" : "pl-12")}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            {t('quickOrder.referencePhoto')} (Beta)
                          </label>
                          <div className="relative">
                            {referencePhoto ? (
                              <div className="relative h-32 w-full rounded-xl border-2 border-white/10 overflow-hidden group">
                                <img src={URL.createObjectURL(referencePhoto)} alt="Reference" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button type="button" variant="destructive" size="sm" onClick={() => setReferencePhoto(null)} className="rounded-full">
                                    <X className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('quickOrder.remove')}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center h-32 w-full rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                <Upload className="h-6 w-6 text-white/40 mb-2" />
                                <span className="text-sm font-medium text-white/60">{t('quickOrder.clickToUpload')}</span>
                                <input type="file" accept="image/*" className="hidden" onChange={e => setReferencePhoto(e.target.files?.[0] || null)} />
                              </label>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            {t('quickOrder.sampleDesign')} (Beta)
                          </label>
                          <div className="relative">
                            {sampleDesign ? (
                              <div className="relative h-32 w-full rounded-xl border-2 border-white/10 overflow-hidden group">
                                <img src={URL.createObjectURL(sampleDesign)} alt="Sample" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button type="button" variant="destructive" size="sm" onClick={() => setSampleDesign(null)} className="rounded-full">
                                    <X className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('quickOrder.remove')}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center h-32 w-full rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                <Upload className="h-6 w-6 text-white/40 mb-2" />
                                <span className="text-sm font-medium text-white/60">{t('quickOrder.clickToUpload')}</span>
                                <input type="file" accept="image/*" className="hidden" onChange={e => setSampleDesign(e.target.files?.[0] || null)} />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                        <Button type="button" variant="ghost" onClick={() => setIsAddingOrder(false)} className="text-white hover:bg-white/10 h-12 px-6 rounded-xl font-bold">{t('customerDetails.cancel')}</Button>
                        <Button type="submit" disabled={isUploading} className="bg-brand-primary text-white hover:bg-brand-primary/90 h-12 px-10 rounded-xl font-black text-base shadow-lg shadow-brand-primary/20">
                          {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('customerDetails.createOrder')}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Scissors className="h-6 w-6 text-brand-primary" />
                {t('customerDetails.measurements')}
              </CardTitle>
              <div className="flex items-center gap-4">
                <AnimatePresence>
                  {saveSuccess && (
                    <motion.span 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs font-black text-emerald-500 uppercase tracking-widest"
                    >
                      {t('customerDetails.savedSuccessfully')}
                    </motion.span>
                  )}
                </AnimatePresence>
                <Button 
                  onClick={handleSaveMeasurements} 
                  disabled={savingMeasurements}
                  className="h-12 px-8 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-black transition-all hover:scale-105 active:scale-95"
                >
                  {savingMeasurements ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />}
                  {savingMeasurements ? t('customerDetails.saving') : t('customerDetails.save')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <form className="space-y-12">
                {getAllMeasurementCategories().map((category, index) => (
                  <div key={category.id} className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-black text-xs">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                        {isRTL ? category.titleUr : category.titleEn}
                      </h3>
                      <div className="flex-1 h-px bg-slate-100"></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.id} className="space-y-2 group">
                            <label className={cn("text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 group-focus-within:text-brand-primary transition-colors", isRTL ? "mr-1" : "ml-1")}>
                              <Icon className="h-3 w-3" />
                              {isRTL ? item.ur : item.en}
                            </label>
                            <div className="relative">
                              <Input 
                                type="number" 
                                step="0.25"
                                placeholder="0.00"
                                value={measurements[item.id] || ''} 
                                onChange={e => {
                                  const val = e.target.value === '' ? '' : Number(e.target.value);
                                  setMeasurements({...measurements, [item.id]: val});
                                }} 
                                className={cn("h-12 rounded-xl border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary text-base font-black transition-all", isRTL ? "pr-3 pl-8" : "pl-3 pr-8")}
                              />
                              <span className={cn("absolute top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300", isRTL ? "left-4" : "right-4")}>IN</span>
                            </div>
                            <p className={cn("text-[9px] text-slate-400 font-medium", isRTL ? "mr-1" : "ml-1")}>{item.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-10">
          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Hash className="h-6 w-6 text-blue-500" />
                {t('customerDetails.orderHistory')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-6">
                {orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                      <CreditCard className="h-8 w-8" />
                    </div>
                    <p className="text-slate-400 font-bold">{t('customerDetails.noOrders')}</p>
                  </div>
                ) : (
                  orders.map((order, idx) => (
                    <motion.div 
                      key={order.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-6 rounded-[2rem] border-2 border-slate-50 bg-white hover:border-brand-primary/10 hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('customerDetails.token')}</span>
                            <span className="text-sm font-black text-brand-primary">#{order.tokenId}</span>
                          </div>
                          <div className="font-black text-slate-900 group-hover:text-brand-primary transition-colors">{order.dressType}</div>
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                          order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        )}>
                          {order.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('customerDetails.delivery')}</span>
                          <span className="text-xs font-bold text-slate-700">{formatDate(order.deliveryDate)}</span>
                        </div>
                        <div className={cn(isRTL ? "text-left" : "text-right")}>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('customerDetails.amount')}</span>
                          <span className="text-xs font-black text-slate-900">PKR {order.price}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {customer.notes && (
            <Card className="border-none shadow-sm bg-amber-50 rounded-[2.5rem] overflow-hidden border-2 border-amber-100">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-lg font-black text-amber-900 flex items-center gap-2">
                  <Notebook className="h-5 w-5" />
                  {t('customerDetails.clientNotes')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <p className="text-sm font-bold text-amber-800 leading-relaxed">
                  {customer.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
