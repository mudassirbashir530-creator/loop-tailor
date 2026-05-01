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
import { getAllMeasurementCategories, MEASUREMENT_SETS, getMeasurementCategoriesForDress } from '../lib/measurements';
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

  // Visual filters for Orders list
  const [orderFilter, setOrderFilter] = useState<'All' | 'Complete' | 'Not Complete'>('All');
  const [activeTab, setActiveTab] = useState<'Orders' | 'Measurements'>('Orders');

  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'All') return true;
    if (orderFilter === 'Complete') return o.status === ORDER_STATUS.DELIVERED;
    return o.status !== ORDER_STATUS.DELIVERED;
  });

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-[80px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-[#F5F7FA]">
        <button onClick={() => navigate('/dashboard/customers')} className="p-2">
          <ArrowLeft className="h-6 w-6 text-[#0F172A]" />
        </button>
        <h1 className="text-[18px] font-bold text-[#0F172A]">Customer Detail</h1>
        <button className="p-2" onClick={() => setIsEditingCustomer(!isEditingCustomer)}>
          <Edit className="h-5 w-5 text-[#0F172A]" />
        </button>
      </div>

      <AnimatePresence>
        {isEditingCustomer && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 mb-6 overflow-hidden">
             <div className="bg-white p-4 rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
               <h3 className="font-bold text-[#0F172A] mb-3">Edit Customer</h3>
               <form onSubmit={handleUpdateCustomer} className="space-y-3">
                 <Input value={editCustomerData.name} onChange={e => setEditCustomerData({...editCustomerData, name: e.target.value})} placeholder="Name" className="bg-[#F1F5F9] border-none" />
                 <Input value={editCustomerData.phone} onChange={e => setEditCustomerData({...editCustomerData, phone: e.target.value})} placeholder="Phone" className="bg-[#F1F5F9] border-none" />
                 <Input value={editCustomerData.address} onChange={e => setEditCustomerData({...editCustomerData, address: e.target.value})} placeholder="Address" className="bg-[#F1F5F9] border-none" />
                 <div className="flex justify-end gap-2 pt-2">
                   <Button type="button" onClick={() => setIsEditingCustomer(false)} className="bg-transparent text-[#64748B] border border-[#E2E8F0] rounded-full px-5 py-2 h-auto text-[14px]">Cancel</Button>
                   <Button type="submit" className="bg-[#22C55E] text-white rounded-full px-5 py-2 h-auto text-[14px]">Save</Button>
                 </div>
               </form>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Section */}
      <div className="px-4 mb-6">
        <div className="flex flex-col items-center">
          <div className="w-[72px] h-[72px] rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#64748B] text-2xl font-bold mb-3 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-[18px] font-bold text-[#0F172A]">{customer.name}</div>
          <div className="text-[13px] text-[#64748B] mb-5">ID: {customer.id.substring(0,8)}</div>
          
          <div className="w-full flex justify-center items-center bg-white rounded-[16px] py-4 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
            <div className="flex-1 flex flex-col items-center justify-center px-2">
              <div className="text-[12px] text-[#64748B] mb-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5"/> Phone</div>
              <div className="text-[14px] font-semibold text-[#0F172A] text-center">{customer.phone}</div>
            </div>
            <div className="h-10 w-[1px] bg-[#E2E8F0]"></div>
            <div className="flex-1 flex flex-col items-center justify-center px-2">
              <div className="text-[12px] text-[#64748B] mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> Location</div>
              <div className="text-[14px] font-semibold text-[#0F172A] text-center line-clamp-1">{customer.address || 'Not set'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="px-4 mb-6 flex justify-center">
        <div className="bg-[#F1F5F9] rounded-full p-1 flex">
          {['Orders', 'Measurements'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-8 py-2 rounded-full text-[14px] font-semibold transition-all",
                activeTab === tab ? "bg-[#22C55E] text-white shadow-sm" : "text-[#64748B] bg-transparent"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mb-4 flex justify-between items-center">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">
          {activeTab === 'Orders' ? 'Order History' : 'Measurements'}
        </h2>
        {activeTab === 'Orders' && (
          <Button onClick={() => setIsAddingOrder(!isAddingOrder)} className="bg-[#22C55E] text-white rounded-full h-8 px-4 text-[13px] font-semibold flex items-center gap-1">
            <Plus className="w-4 h-4"/> New Order
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isAddingOrder && activeTab === 'Orders' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 mb-6 overflow-hidden">
             <div className="bg-white p-4 rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
               <h3 className="font-bold text-[#0F172A] mb-3">Add New Order</h3>
               <form onSubmit={handleCreateOrder} className="space-y-3">
                 <Input value={newOrder.dressType} onChange={e => setNewOrder({...newOrder, dressType: e.target.value})} placeholder="Dress Type" required className="bg-[#F1F5F9] border-none" />
                 <Input type="date" value={newOrder.deliveryDate} onChange={e => setNewOrder({...newOrder, deliveryDate: e.target.value})} required className="bg-[#F1F5F9] border-none" />
                 <Input type="number" value={newOrder.price} onChange={e => setNewOrder({...newOrder, price: e.target.value})} placeholder="Total Price" required className="bg-[#F1F5F9] border-none" />
                 <Input type="number" value={newOrder.advancePayment} onChange={e => setNewOrder({...newOrder, advancePayment: e.target.value})} placeholder="Advance Payment" className="bg-[#F1F5F9] border-none" />
                 <div className="flex justify-end gap-2 pt-2">
                   <Button type="button" onClick={() => setIsAddingOrder(false)} className="bg-transparent text-[#64748B] border border-[#E2E8F0] rounded-full px-5 py-2 h-auto text-[14px]">Cancel</Button>
                   <Button disabled={isUploading} type="submit" className="bg-[#22C55E] text-white rounded-full px-5 py-2 h-auto text-[14px]">
                     {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Create'}
                   </Button>
                 </div>
               </form>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'Orders' ? (
        <>
          {/* Orders Filter Pills */}
          <div className="flex gap-2 px-4 mb-4">
            {['All', 'Complete', 'Not Complete'].map(f => (
              <button 
                key={f}
                onClick={() => setOrderFilter(f as any)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors",
                  orderFilter === f ? "bg-[#22C55E] text-white" : "bg-white text-[#64748B] border border-[#E2E8F0]"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="px-4 space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-[#64748B] text-[14px]">No orders found.</div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-[16px] p-3.5 flex items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.07)]" onClick={() => navigate(`/dashboard/orders/${order.id}`)}>
                  <div className="w-[44px] h-[44px] rounded-[12px] bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                    <Scissors className="w-5 h-5"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-[#0F172A] truncate leading-tight">{order.dressType || 'Order'}</div>
                    <div className="text-[12px] text-[#64748B] mt-0.5">{formatDate(order.createdAt)}</div>
                  </div>
                  <div className="text-right flex flex-col items-end shrink-0 gap-1.5">
                    <div className="text-[14px] font-semibold text-[#0F172A] leading-none mb-0.5">{(order.price || 0).toLocaleString()}</div>
                    <div className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider leading-relaxed",
                      order.status === ORDER_STATUS.DELIVERED ? "bg-[#22C55E]" : 
                      order.status === ORDER_STATUS.PENDING ? "bg-[#F59E0B]" : "bg-[#1E293B]"
                    )}>
                      {order.status === ORDER_STATUS.DELIVERED ? 'Completed' : 
                       order.status === ORDER_STATUS.PENDING ? 'Pending' : 'Not Complete'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="px-4">
           {/* Measurements UI preserving original Logic */}
           <div className="bg-white p-5 rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.07)] mb-4">
              <div className="flex items-center gap-3 overflow-x-auto pb-2 mb-4 hide-scrollbar">
                {Object.keys(measurementSets).map((setName) => (
                  <button
                    key={setName}
                    onClick={() => setActiveSet(setName)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap",
                      activeSet === setName 
                        ? "bg-[#22C55E] text-white" 
                        : "bg-[#F1F5F9] text-[#64748B]"
                    )}
                  >
                    {setName}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSaveMeasurements} className="grid grid-cols-2 gap-4">
                {getMeasurementCategoriesForDress(activeSet).map((cat) => (
                  <div key={cat.id} className="col-span-2 sm:col-span-1">
                    <label className="block text-[12px] font-bold text-[#64748B] mb-1.5 ml-1">{cat.label.en}</label>
                    <Input 
                      type={cat.type === 'number' ? 'number' : 'text'}
                      value={measurements[cat.id] || ''}
                      onChange={(e) => setMeasurements({...measurements, [cat.id]: e.target.value})}
                      placeholder={cat.placeholder?.en}
                      className="bg-[#F8FAFC] border-[#E2E8F0] h-[44px] rounded-[12px] text-[14px]"
                    />
                  </div>
                ))}
                <div className="col-span-2 pt-2">
                  <Button type="submit" disabled={savingMeasurements} className="w-full bg-[#22C55E] text-white rounded-full py-6 text-[15px] font-semibold">
                    {savingMeasurements ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Save Measurements'}
                  </Button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
