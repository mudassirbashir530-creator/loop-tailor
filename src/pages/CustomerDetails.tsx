import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useShop } from '../contexts/ShopContext';
import { ORDER_STATUS } from '../lib/config';
import { db, storage, handleFirestoreError, OperationType, generateTokenId } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, ArrowRight, Plus, Save, Upload, Edit, X, FileText, Phone, MapPin, Notebook, Scissors, Calendar, CreditCard, Hash, Loader2, CheckCircle2, Trash2, User, Ruler } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { getAllMeasurementCategories, MEASUREMENT_SETS } from '../lib/measurements';
import { useMeasurementTemplates } from '../hooks/useMeasurementTemplates';
import { toast } from 'sonner';

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const { settings } = useShop();
  const navigate = useNavigate();
  
  const { templates } = useMeasurementTemplates();
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'kids'>('male');
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
  const [editCustomerData, setEditCustomerData] = useState({ name: '', phone: '', address: '', notes: '', stylePreferences: '', emergencyPhone: '' });
  const [loading, setLoading] = useState(true);

  // New states for measurement sets
  const [activeSet, setActiveSet] = useState('Shalwar Kameez');
  const [measurementSets, setMeasurementSets] = useState<Record<string, any>>({});
  const [isAddingSet, setIsAddingSet] = useState(false);
  const [newSetName, setNewSetName] = useState('');

  useEffect(() => {
    if (!user || !id) return;
    
    setLoading(true);
    
    const unsubCustomer = onSnapshot(doc(db, 'shops', user.uid, 'customers', id), (custSnap) => {
      if (custSnap.exists() && custSnap.data().shopId === user.uid) {
        setCustomer({ id: custSnap.id, ...custSnap.data() });
        setEditCustomerData({
          name: custSnap.data().name || '',
          phone: custSnap.data().phone || '',
          address: custSnap.data().address || '',
          notes: custSnap.data().notes || '',
          stylePreferences: custSnap.data().stylePreferences || '',
          emergencyPhone: custSnap.data().emergencyPhone || ''
        });
      } else {
        navigate('/dashboard/customers');
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `customers/${id}`));

    const qMeasurements = query(collection(db, 'shops', user.uid, 'measurements'), where('customerId', '==', id));
    const unsubMeasurements = onSnapshot(qMeasurements, (measSnap) => {
      const loadedSets: Record<string, any> = {};
      measSnap.docs.forEach((d) => {
        const docId = d.id;
        const data = d.data();
        if (docId === id) {
          // Legacy measurements
          loadedSets['Shalwar Kameez'] = data;
        } else {
          const parts = docId.split('__');
          if (parts.length === 2 && parts[0] === id) {
            loadedSets[parts[1]] = data;
          }
        }
      });
      setMeasurementSets(loadedSets);
      
      // Update local measurements if it matches the current active set, OR if it's the first load
      setMeasurements(prev => {
        // We just always override with the fresh DB data for the active set. 
        // Note: if user is typing while db syncs, they might lose a keystroke if another device saves.
        // It's acceptable for this simple app.
        return loadedSets[activeSet] || {};
      });
    }, (error) => handleFirestoreError(error, OperationType.GET, `measurements`));

    const q = query(collection(db, 'shops', user.uid, 'orders'), where('customerId', '==', id));
    const unsubOrders = onSnapshot(q, (ordSnap) => {
      const data = ordSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      }));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `orders`);
      setLoading(false);
    });

    return () => {
      unsubCustomer();
      unsubMeasurements();
      unsubOrders();
    };
  }, [user, id]);

  const handleDeleteCustomer = async () => {
    if (!window.confirm(t('customerDetails.deleteConfirm'))) return;
    
    setIsDeletingCustomer(true);
    try {
      await deleteDoc(doc(db, 'shops', user!.uid, 'customers', id!));
      toast.success(t('customerDetails.customerDeleted') || 'Customer deleted successfully');
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
      const docId = `${id}__${activeSet}`;
      await setDoc(doc(db, 'shops', user.uid, 'measurements', docId), {
        ...measurements, // Save current state
        shopId: user.uid,
        customerId: id,
        setName: activeSet,
        updatedAt: serverTimestamp()
      }, { merge: true });

      if (activeSet === 'Shalwar Kameez') {
         await setDoc(doc(db, 'shops', user.uid, 'measurements', id), {
            ...measurements,
            shopId: user.uid,
            customerId: id,
            updatedAt: serverTimestamp()
         }, { merge: true });
      }

      setSaveSuccess(true);
      toast.success(t('customerDetails.measurementsSaved') || 'Measurements saved successfully');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `measurements/${id}__${activeSet}`);
    } finally {
      setSavingMeasurements(false);
    }
  };

  const handleDeleteSet = async (setName: string) => {
    if (!user || !id) return;
    if (!window.confirm(`Are you sure you want to delete the ${setName} measurements?`)) return;
    try {
      if (setName === 'Shalwar Kameez') {
        const legacyRef = doc(db, 'shops', user.uid, 'measurements', id);
        await deleteDoc(legacyRef);
      }
      const newRef = doc(db, 'shops', user.uid, 'measurements', `${id}__${setName}`);
      await deleteDoc(newRef);
      toast.success('Measurement set deleted');
      if (activeSet === setName) setActiveSet('Shalwar Kameez');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `measurements/${id}__${setName}`);
    }
  };

  const handleAddSet = () => {
    if (!newSetName.trim()) return;
    setActiveSet(newSetName.trim());
    setIsAddingSet(false);
    setNewSetName('');
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    try {
      await updateDoc(doc(db, 'shops', user.uid, 'customers', id), {
        ...editCustomerData,
        shopId: user.uid,
        updatedAt: serverTimestamp()
      });
      setCustomer({ ...customer, ...editCustomerData, shopId: user.uid });
      setIsEditingCustomer(false);
      toast.success(t('customerDetails.customerUpdated') || 'Customer updated successfully');
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
      toast.success(t('customerDetails.orderCreated') || 'Order created successfully');
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

  const activeOrdersCount = orders.filter(o => 
    [ORDER_STATUS.PENDING, ORDER_STATUS.STITCHING, ORDER_STATUS.READY].includes(o.status)
  ).length;

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
            className="h-12 w-12 rounded-2xl bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm border-none"
          >
            {isRTL ? <ArrowRight className="h-6 w-6 text-slate-500" /> : <ArrowLeft className="h-6 w-6 text-slate-500" />}
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-slate-900">{customer.name}</h1>
              {activeOrdersCount > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">
                  {activeOrdersCount} {activeOrdersCount === 1 ? 'Active Order' : 'Active Orders'}
                </span>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsEditingCustomer(!isEditingCustomer)}
                className={cn("h-10 w-10 rounded-xl border-none transition-all", isEditingCustomer ? "bg-gray-100 shadow-neu-pressed text-brand-primary" : "bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm text-slate-500")}
              >
                {isEditingCustomer ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDeleteCustomer}
                disabled={isDeletingCustomer}
                className="h-10 w-10 rounded-xl border-none bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm text-red-500 transition-all"
              >
                {isDeletingCustomer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-slate-500 font-bold text-sm">
              <div className="flex items-center">
                <Phone className={cn("h-4 w-4 text-slate-400", isRTL ? "ml-2" : "mr-2")} />
                {customer.phone}
              </div>
              {customer.emergencyPhone && (
                <div className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg cursor-pointer" onClick={() => window.open(`https://wa.me/${customer.emergencyPhone.replace(/[^\d+]/g, '')}`, '_blank')}>
                  <Phone className={cn("h-3 w-3", isRTL ? "ml-1" : "mr-1")} />
                  {customer.emergencyPhone}
                </div>
              )}
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
              "h-14 px-8 rounded-2xl font-black text-base transition-all border-none",
              isAddingOrder ? "bg-gray-100 shadow-neu-pressed text-slate-500" : "bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm text-brand-primary"
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
            <Card className="border-none shadow-neu bg-gray-100 rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-black text-slate-900">{t('customerDetails.editProfile')}</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <form onSubmit={handleUpdateCustomer} className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className={cn("text-xs font-black text-slate-500 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customerDetails.fullName')}</label>
                    <div className="relative">
                      <User className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        required 
                        value={editCustomerData.name} 
                        onChange={e => setEditCustomerData({...editCustomerData, name: e.target.value})} 
                        className={cn("h-14 rounded-2xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 text-base font-bold transition-all text-slate-900", isRTL ? "pr-12" : "pl-12")}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-xs font-black text-slate-500 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customerDetails.phoneNumber')}</label>
                    <div className="relative">
                      <Phone className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        required 
                        value={editCustomerData.phone} 
                        onChange={e => setEditCustomerData({...editCustomerData, phone: e.target.value})} 
                        className={cn("h-14 rounded-2xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 text-base font-bold transition-all text-slate-900", isRTL ? "pr-12" : "pl-12")}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className={cn("text-xs font-black text-slate-500 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customerDetails.address')}</label>
                    <div className="relative">
                      <MapPin className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        value={editCustomerData.address} 
                        onChange={e => setEditCustomerData({...editCustomerData, address: e.target.value})} 
                        className={cn("h-14 rounded-2xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 text-base font-bold transition-all text-slate-900", isRTL ? "pr-12" : "pl-12")}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className={cn("text-xs font-black text-slate-500 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customerDetails.notes')}</label>
                    <div className="relative">
                      <Notebook className={cn("absolute top-4 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                      <textarea 
                        value={editCustomerData.notes} 
                        onChange={e => setEditCustomerData({...editCustomerData, notes: e.target.value})} 
                        className={cn("w-full min-h-[100px] px-4 py-4 rounded-2xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 text-base font-bold transition-all focus:outline-none text-slate-900", isRTL ? "pr-12" : "pl-12")}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className={cn("text-xs font-black text-slate-500 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>Style Preferences</label>
                    <div className="relative">
                      <Scissors className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        placeholder="e.g., Prefers slim fit, likes embroidery on collar, avoid synthetic fabric"
                        value={editCustomerData.stylePreferences || ''} 
                        onChange={e => setEditCustomerData({...editCustomerData, stylePreferences: e.target.value})} 
                        className={cn("h-14 rounded-2xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 text-base font-bold transition-all text-slate-900", isRTL ? "pr-12" : "pl-12")}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className={cn("text-xs font-black text-slate-500 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>Emergency / WhatsApp Contact</label>
                    <div className="relative">
                      <Phone className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500 z-10", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        value={editCustomerData.emergencyPhone || ''} 
                        onChange={e => setEditCustomerData({...editCustomerData, emergencyPhone: e.target.value})} 
                        className={cn("h-14 rounded-2xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 text-base font-bold transition-all text-slate-900", isRTL ? "pr-12" : "pl-12")}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsEditingCustomer(false)} className="h-12 px-6 rounded-xl font-bold bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm border-none text-slate-500">{t('customerDetails.cancel')}</Button>
                    <Button type="submit" className="h-12 px-8 rounded-xl bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm border-none text-brand-primary font-black">{t('customerDetails.saveChanges')}</Button>
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
                <Card className="border-none shadow-neu bg-gray-100 text-slate-900 rounded-[2.5rem] overflow-hidden">
                  <CardHeader className="p-8 pb-4 border-b border-gray-200/50">
                    <CardTitle className="text-2xl font-black">{t('customerDetails.newOrderFor')} {customer.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-6">
                    <form onSubmit={handleCreateOrder} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className={cn("text-xs font-black text-slate-500 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customerDetails.dressType')}</label>
                          <div className="relative">
                            <Scissors className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                            <Input 
                              required 
                              value={newOrder.dressType} 
                              onChange={e => setNewOrder({...newOrder, dressType: e.target.value})} 
                              className={cn("h-14 rounded-2xl bg-gray-100 shadow-neu-pressed-sm border-none text-slate-900 focus:ring-2 focus:ring-brand-primary/20 text-base font-bold transition-all", isRTL ? "pr-12" : "pl-12")}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className={cn("text-xs font-black text-slate-500 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customerDetails.deliveryDate')}</label>
                          <div className="relative">
                            <Calendar className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                            <Input 
                              type="date" 
                              required 
                              value={newOrder.deliveryDate} 
                              onChange={e => setNewOrder({...newOrder, deliveryDate: e.target.value})} 
                              className={cn("h-14 rounded-2xl bg-gray-100 shadow-neu-pressed-sm border-none text-slate-900 focus:ring-2 focus:ring-brand-primary/20 text-base font-bold transition-all", isRTL ? "pr-12" : "pl-12")}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className={cn("text-xs font-black text-slate-500 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customerDetails.totalPrice')} ({settings.currency})</label>
                          <div className="relative">
                            <CreditCard className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                            <Input 
                              type="number" 
                              required 
                              value={newOrder.price} 
                              onChange={e => setNewOrder({...newOrder, price: e.target.value})} 
                              className={cn("h-14 rounded-2xl bg-gray-100 shadow-neu-pressed-sm border-none text-slate-900 focus:ring-2 focus:ring-brand-primary/20 text-base font-bold transition-all", isRTL ? "pr-12" : "pl-12")}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className={cn("text-xs font-black text-slate-500 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customerDetails.advancePayment')} ({settings.currency})</label>
                          <div className="relative">
                            <CreditCard className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                            <Input 
                              type="number" 
                              value={newOrder.advancePayment} 
                              onChange={e => setNewOrder({...newOrder, advancePayment: e.target.value})} 
                              className={cn("h-14 rounded-2xl bg-gray-100 shadow-neu-pressed-sm border-none text-slate-900 focus:ring-2 focus:ring-brand-primary/20 text-base font-bold transition-all", isRTL ? "pr-12" : "pl-12")}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200/50">
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            {t('quickOrder.referencePhoto')} (Beta)
                          </label>
                          <div className="relative">
                            {referencePhoto ? (
                              <div className="relative h-32 w-full rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none overflow-hidden group p-2">
                                <img src={URL.createObjectURL(referencePhoto)} alt="Reference" className="w-full h-full object-cover rounded-lg" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                  <Button type="button" variant="destructive" size="sm" onClick={() => setReferencePhoto(null)} className="rounded-full bg-red-500 text-white border-none shadow-neu-sm">
                                    <X className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('quickOrder.remove')}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center h-32 w-full rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none hover:shadow-neu-sm transition-all cursor-pointer">
                                <Upload className="h-6 w-6 text-brand-primary mb-2" />
                                <span className="text-sm font-medium text-slate-500">{t('quickOrder.clickToUpload')}</span>
                                <input type="file" accept="image/*" className="hidden" onChange={e => setReferencePhoto(e.target.files?.[0] || null)} />
                              </label>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            {t('quickOrder.sampleDesign')} (Beta)
                          </label>
                          <div className="relative">
                            {sampleDesign ? (
                              <div className="relative h-32 w-full rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none overflow-hidden group p-2">
                                <img src={URL.createObjectURL(sampleDesign)} alt="Sample" className="w-full h-full object-cover rounded-lg" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                  <Button type="button" variant="destructive" size="sm" onClick={() => setSampleDesign(null)} className="rounded-full bg-red-500 text-white border-none shadow-neu-sm">
                                    <X className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('quickOrder.remove')}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center h-32 w-full rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none hover:shadow-neu-sm transition-all cursor-pointer">
                                <Upload className="h-6 w-6 text-brand-primary mb-2" />
                                <span className="text-sm font-medium text-slate-500">{t('quickOrder.clickToUpload')}</span>
                                <input type="file" accept="image/*" className="hidden" onChange={e => setSampleDesign(e.target.files?.[0] || null)} />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200/50">
                        <Button type="button" variant="ghost" onClick={() => setIsAddingOrder(false)} className="h-12 px-6 rounded-xl font-bold bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm border-none text-slate-500">{t('customerDetails.cancel')}</Button>
                        <Button type="submit" disabled={isUploading} className="h-12 px-10 rounded-xl font-black text-base bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm border-none text-brand-primary transition-all">
                          {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('customerDetails.createOrder')}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="border-none shadow-neu bg-gray-100 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between border-b border-gray-200/50">
              <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Scissors className="h-6 w-6 text-brand-primary" />
                {t('customerDetails.measurements')}
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex bg-gray-200/50 p-1 rounded-xl">
                  {(['male', 'female', 'kids'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setSelectedGender(g)}
                      className={cn("px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all", selectedGender === g ? "bg-white shadow-neu-sm text-brand-primary" : "text-slate-500")}
                    >
                      {g}
                    </button>
                  ))}
                </div>
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
                  className="h-12 px-8 rounded-2xl bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm border-none text-brand-primary font-black transition-all"
                >
                  {savingMeasurements ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />}
                  {savingMeasurements ? t('customerDetails.saving') : t('customerDetails.save')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-8">
              <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
                {Array.from(new Set([...MEASUREMENT_SETS, ...Object.keys(measurementSets)])).map(setName => (
                  <div key={setName} className="flex relative group shrink-0">
                    <button
                      type="button"
                      onClick={() => { setActiveSet(setName); setMeasurements(measurementSets[setName] || {}); }}
                      className={cn("px-5 py-2.5 font-bold text-sm rounded-xl whitespace-nowrap transition-all", activeSet === setName ? "bg-brand-primary text-white shadow-neu-sm" : "bg-gray-100 text-slate-500 shadow-neu-sm hover:shadow-neu-pressed-sm")}
                    >
                      {setName}
                    </button>
                    {activeSet === setName && setName !== 'Shalwar Kameez' && (
                      <button type="button" onClick={() => handleDeleteSet(setName)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-neu-sm">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                
                {isAddingSet ? (
                  <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl shadow-neu-pressed-sm pl-3 shrink-0">
                    <Input 
                      autoFocus 
                      value={newSetName} 
                      onChange={e => setNewSetName(e.target.value)} 
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSet(); } }} 
                      className="h-9 w-32 border-none bg-transparent focus:ring-0 text-sm font-bold shadow-none" 
                      placeholder="Set Name..." 
                    />
                    <Button size="sm" onClick={handleAddSet} className="h-9 rounded-lg bg-brand-primary text-white px-3 border-none hover:bg-brand-primary/90"><CheckCircle2 className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsAddingSet(false)} className="h-9 rounded-lg text-slate-500 px-2 border-none"><X className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setIsAddingSet(true)} className="px-4 py-2.5 font-bold text-sm bg-gray-100 text-slate-500 hover:text-brand-primary rounded-xl shadow-neu-sm hover:shadow-neu-pressed-sm transition-all flex items-center whitespace-nowrap shrink-0">
                    <Plus className="h-4 w-4 mr-1" /> Add Set
                  </button>
                )}
              </div>

              {(() => {
                 const currentSetData = measurementSets[activeSet] || {};
                 const updatedAt = currentSetData?.updatedAt?.toDate ? currentSetData.updatedAt.toDate() : (currentSetData?.updatedAt ? new Date(currentSetData.updatedAt) : null);
                 if (updatedAt && (Date.now() - updatedAt.getTime() > 1000 * 60 * 60 * 24 * 30 * 6)) {
                    return (
                      <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl flex items-center gap-3">
                        <span className="text-xl">⚠️</span>
                        <div className="text-sm font-bold">Measurements may be outdated - last updated {format(updatedAt, 'MMM dd, yyyy')}</div>
                      </div>
                    )
                 }
                 return null;
              })()}

              <form className="space-y-12">
                {(() => {
                  const customTemplate = templates.find(t => t.gender === selectedGender && t.isDefault) || templates.find(t => t.gender === selectedGender);
                  
                  if (customTemplate) {
                    return (
                      <div className="space-y-8">
                        <div className="flex items-center gap-4">
                          <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">
                            {isRTL ? customTemplate.nameUr || customTemplate.nameEn : customTemplate.nameEn}
                          </h3>
                          <div className="flex-1 h-px bg-gray-200/50"></div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                          {[...customTemplate.fields].sort((a, b) => a.order - b.order).map((field) => (
                            <div key={field.id} className="space-y-2 group">
                              <label className={cn("text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 group-focus-within:text-brand-primary transition-colors", isRTL ? "mr-1" : "ml-1")}>
                                <Ruler className="h-3 w-3" />
                                {isRTL ? field.labelUr || field.labelEn : field.labelEn}
                              </label>
                              <div className="relative">
                                <Input 
                                  type="number" 
                                  step="0.25"
                                  placeholder="0.00"
                                  value={measurements[field.id] || ''} 
                                  onChange={e => {
                                    const val = e.target.value === '' ? '' : Number(e.target.value);
                                    setMeasurements({...measurements, [field.id]: val});
                                  }} 
                                  className={cn("h-12 rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 text-base font-black transition-all text-slate-900", isRTL ? "pr-3 pl-8" : "pl-3 pr-8")}
                                />
                                <span className={cn("absolute top-1/2 -translate-y-1/2 text-[10px] uppercase font-black text-slate-400", isRTL ? "left-4" : "right-4")}>
                                  {customTemplate.unit === 'cm' ? 'CM' : 'IN'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return getAllMeasurementCategories().map((category, index) => (
                    <div key={category.id} className="space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-gray-100 shadow-neu-pressed-sm flex items-center justify-center text-brand-primary font-black text-sm">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">
                          {isRTL ? category.titleUr : category.titleEn}
                        </h3>
                        <div className="flex-1 h-px bg-gray-200/50"></div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                        {category.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div key={item.id} className="space-y-2 group">
                              <label className={cn("text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 group-focus-within:text-brand-primary transition-colors", isRTL ? "mr-1" : "ml-1")}>
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
                                  className={cn("h-12 rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 text-base font-black transition-all text-slate-900", isRTL ? "pr-3 pl-8" : "pl-3 pr-8")}
                                />
                                <span className={cn("absolute top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400", isRTL ? "left-4" : "right-4")}>IN</span>
                              </div>
                              <p className={cn("text-[9px] text-slate-400 font-medium", isRTL ? "mr-1" : "ml-1")}>{item.desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </form>
              
              {(() => {
                 const currentSetData = measurementSets[activeSet] || {};
                 const updatedAt = currentSetData?.updatedAt?.toDate ? currentSetData.updatedAt.toDate() : (currentSetData?.updatedAt ? new Date(currentSetData.updatedAt) : null);
                 if (updatedAt) {
                    return (
                      <div className="mt-8 pt-6 border-t border-gray-200/50 flex justify-end">
                        <p className="text-xs font-bold text-slate-400">Last updated: {format(updatedAt, 'MMM dd, yyyy h:mm a')}</p>
                      </div>
                    )
                 }
                 return null;
              })()}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-10">
          <Card className="border-none shadow-neu bg-gray-100 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4 border-b border-gray-200/50">
              <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Hash className="h-6 w-6 text-brand-primary" />
                {t('customerDetails.orderHistory')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-6">
              <div className="space-y-6">
                {orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="h-16 w-16 bg-gray-100 shadow-neu-pressed-sm rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
                      <CreditCard className="h-8 w-8" />
                    </div>
                    <p className="text-slate-500 font-bold">{t('customerDetails.noOrders')}</p>
                  </div>
                ) : (
                  orders.map((order, idx) => (
                    <motion.div 
                      key={order.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-6 rounded-[2rem] bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm border-none transition-all cursor-pointer group"
                      onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('customerDetails.token')}</span>
                            <span className="text-sm font-black text-brand-primary">#{order.tokenId}</span>
                          </div>
                          <div className="font-black text-slate-900 group-hover:text-brand-primary transition-colors">{order.dressType}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-neu-sm",
                            order.status === ORDER_STATUS.DELIVERED ? 'bg-gray-100 text-emerald-600' : 'bg-gray-100 text-amber-600'
                          )}>
                            {t(`orders.${order.status.toLowerCase()}`)}
                          </span>
                          <span className={cn(
                            "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-neu-sm",
                            (!order.paymentStatus || order.paymentStatus === 'Unpaid') ? "bg-red-50 text-rose-500" :
                            order.paymentStatus === 'Partial' ? "bg-blue-50 text-blue-500" :
                            "bg-emerald-50 text-emerald-500"
                          )}>
                            {order.paymentStatus || 'Unpaid'}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200/50">
                        <div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{t('customerDetails.delivery')}</span>
                          <span className="text-xs font-bold text-slate-700">{formatDate(order.deliveryDate)}</span>
                        </div>
                        <div className={cn(isRTL ? "text-left" : "text-right")}>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{t('customerDetails.amount')}</span>
                          <span className="text-xs font-black text-slate-900">{settings.currency} {order.price}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {(customer.notes || customer.stylePreferences) && (
            <Card className="border-none shadow-neu bg-gray-100 rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 pb-4 border-b border-gray-200/50">
                <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Notebook className="h-5 w-5 text-brand-primary" />
                  Profile Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-6 space-y-6">
                {customer.stylePreferences && (
                  <div>
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><span className="text-amber-500">✨</span> Style Preferences</h4>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed bg-gray-100 shadow-neu-pressed-sm p-4 rounded-2xl">
                      {customer.stylePreferences}
                    </p>
                  </div>
                )}
                {customer.notes && (
                  <div>
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">Client Notes</h4>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed bg-gray-100 shadow-neu-pressed-sm p-4 rounded-2xl">
                      {customer.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
