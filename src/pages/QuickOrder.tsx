import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useShop } from '../contexts/ShopContext';
import { db, storage, handleFirestoreError, OperationType, generateTokenId, withRetry } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, getDocs, limit, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, ArrowRight, Save, Hash, MapPin, Ruler, Loader2, Search, User, Phone, Check, Upload, X, Scissors, Calendar, CreditCard, Notebook, ChevronDown, Plus, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMeasurementCategoriesForDress } from '../lib/measurements';
import { useMeasurementTemplates } from '../hooks/useMeasurementTemplates';
import { cn } from '../lib/utils';
import { ORDER_STATUS } from '../lib/config';
import { TemplateSelector, SaveTemplateButton } from '../components/OrderTemplates';
import { useOrderTemplates } from '../hooks/useOrderTemplates';
import { useStaff } from '../hooks/useStaff';
import { toast } from 'sonner';
import { useNotifications } from '../hooks/useNotifications';

export default function QuickOrder() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const { settings } = useShop();
  const navigate = useNavigate();
  const { staff } = useStaff();
  const { addNotification } = useNotifications();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const templateHook = useOrderTemplates(user?.uid);
  const { templates: measurementTemplates } = useMeasurementTemplates();
  const [preGeneratedToken, setPreGeneratedToken] = useState('');
  const [gender, setGender] = useState('male');
  const [showDressDropdown, setShowDressDropdown] = useState(false);
  const [dressSearch, setDressSearch] = useState('');
  const dressDropdownRef = useRef<HTMLDivElement>(null);

  const DRESS_OPTIONS = {
    male: [
      { en: 'Shalwar Kameez', ur: 'مرد' },
      { en: 'Kurta Pajama', ur: 'کرتہ' },
      { en: 'Waistcoat', ur: 'واسکٹ' },
      { en: 'Suit', ur: 'سوٹ' },
      { en: 'Sherwani', ur: 'شیروانی' },
      { en: 'Pants + Shirt', ur: 'پینٹ شرٹ' },
      { en: 'Shalwar Only', ur: 'شلوار' },
      { en: 'Kameez Only', ur: 'قمیض' },
    ],
    female: [
      { en: 'Shalwar Kameez', ur: 'خواتین' },
      { en: 'Frock', ur: 'فراک' },
      { en: 'Lehenga', ur: 'لہنگا' },
      { en: 'Gharara', ur: 'گھرارہ' },
      { en: 'Saree Blouse', ur: 'ساڑی' },
      { en: 'Kurti', ur: 'کرتی' },
      { en: 'Dupatta', ur: 'دوپٹہ' },
      { en: 'Bridal Dress', ur: 'برائیڈل' },
      { en: 'Maxi', ur: 'میکسی' },
    ],
    kids: [
      { en: 'Kids Shalwar Kameez', ur: 'بچوں' },
      { en: 'Kids Frock', ur: 'بچیوں' },
      { en: 'Kids Suit', ur: 'بچے' },
    ]
  };

  useEffect(() => {
    if (!user) return;
    const initToken = async () => {
      const token = await generateTokenId(user.uid);
      setPreGeneratedToken(token);
    };
    initToken();
  }, [user]);

  // Customer Search State
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchCustomers = async () => {
      try {
        const q = query(collection(db, 'shops', user.uid, 'customers'));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomers(data);
      } catch (error) {
        console.error("Error fetching customers", error);
      }
    };
    fetchCustomers();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (dressDropdownRef.current && !dressDropdownRef.current.contains(event.target as Node)) {
        setShowDressDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  // Customer Data
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });

  // Order Data
  const [orderData, setOrderData] = useState<{
    dressType: string;
    deliveryDate: string;
    price: string;
    advancePayment: string;
    quantity: string;
    rackLocation: string;
    notes: string;
    assignedStaffId: string;
    assignedStaffName: string;
  }>({
    dressType: 'Shalwar Kameez',
    deliveryDate: '',
    price: '',
    advancePayment: '',
    quantity: '1',
    rackLocation: '',
    notes: '',
    assignedStaffId: '',
    assignedStaffName: ''
  });

  // File Uploads
  const [referencePhoto, setReferencePhoto] = useState<File | null>(null);
  const [sampleDesign, setSampleDesign] = useState<File | null>(null);

  // Measurements
  const [measurements, setMeasurements] = useState<any>({});
  const [measurementSets, setMeasurementSets] = useState<Record<string, any>>({});
  const [selectedMeasurementSet, setSelectedMeasurementSet] = useState('');

  const handleSelectCustomer = async (customer: any) => {
    setCustomerData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address || '',
      notes: customer.notes || ''
    });
    setSelectedCustomerId(customer.id);
    setSearchQuery(customer.name);
    setShowDropdown(false);

    // Fetch measurements
    try {
      const qMeas = query(collection(db, 'shops', user!.uid, 'measurements'), where('customerId', '==', customer.id));
      const measSnap = await getDocs(qMeas);
      const loadedSets: Record<string, any> = {};
      measSnap.docs.forEach((d) => {
        const docId = d.id;
        const data = d.data();
        if (docId === customer.id) {
          loadedSets['Shalwar Kameez'] = data;
        } else {
          const parts = docId.split('__');
          if (parts.length === 2 && parts[0] === customer.id) {
            loadedSets[parts[1]] = data;
          }
        }
      });
      setMeasurementSets(loadedSets);
      
      const setNames = Object.keys(loadedSets);
      if (setNames.length > 0) {
         // Auto-select 'Shalwar Kameez' or the first available set
         const defaultSet = setNames.includes('Shalwar Kameez') ? 'Shalwar Kameez' : setNames[0];
         setSelectedMeasurementSet(defaultSet);
         setMeasurements(loadedSets[defaultSet] || {});
      } else {
         setSelectedMeasurementSet('');
         setMeasurements({});
      }
    } catch (error) {
      console.error("Error fetching measurements", error);
    }
  };

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [serviceType, setServiceType] = useState('Standard');

  useEffect(() => {
    const daysToAdd = serviceType === 'Premium' ? 1 : serviceType === 'Express' ? 2 : 6;
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    setOrderData(prev => ({ ...prev, deliveryDate: date.toISOString().split('T')[0] }));
  }, [serviceType]);

  const validateStep = (step: number) => {
    const errors: Record<string, string> = {};
    if (step === 1) {
      if (!customerData.name.trim()) errors.name = 'Customer name is required';
      if (!customerData.phone.trim()) errors.phone = 'Phone number is required';
    } else if (step === 2) {
      if (!orderData.dressType.trim()) errors.dressType = 'Dress type is required';
      if (!orderData.deliveryDate.trim()) errors.deliveryDate = 'Delivery date is required';
      if (!orderData.price) errors.price = 'Price is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateStep(4)) return;
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await withRetry(async () => {
        // 1. Generate Token ID
        const tokenId = preGeneratedToken || await generateTokenId(user.uid);

        // 2. Check for existing customer by phone or selected ID
        let customerId = selectedCustomerId;
        
        if (!customerId && customerData.phone) {
          const q = query(
            collection(db, 'shops', user.uid, 'customers'), 
            where('phone', '==', customerData.phone),
            limit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            customerId = snap.docs[0].id;
          }
        }

        if (customerId) {
          // Update existing customer name/address if changed
          await updateDoc(doc(db, 'shops', user.uid, 'customers', customerId), {
            name: customerData.name,
            address: customerData.address,
            shopId: user.uid,
            updatedAt: serverTimestamp()
          });
        } else {
          // Create new customer
          const customerRef = await addDoc(collection(db, 'shops', user.uid, 'customers'), {
            ...customerData,
            shopId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          customerId = customerRef.id;
        }

        // Save/Update Measurements
        if (Object.keys(measurements).length > 0) {
          const setName = selectedMeasurementSet || 'Shalwar Kameez';
          const docId = `${customerId}__${setName}`;
          await setDoc(doc(db, 'shops', user.uid, 'measurements', docId), {
            ...measurements,
            shopId: user.uid,
            customerId: customerId,
            setName: setName,
            updatedAt: serverTimestamp()
          }, { merge: true });

          // Backward compatibility for Shalwar Kameez
          if (setName === 'Shalwar Kameez') {
             await setDoc(doc(db, 'shops', user.uid, 'measurements', customerId), {
                ...measurements,
                shopId: user.uid,
                customerId: customerId,
                updatedAt: serverTimestamp()
             }, { merge: true });
          }
        }

        const price = Number(orderData.price || 0);
        const advanceTotal = Number(orderData.advancePayment || 0);
        let paymentStatus = 'Unpaid';
        if (advanceTotal > 0) {
          paymentStatus = advanceTotal >= price ? 'Paid' : 'Partial';
        }

        const initialPayments = advanceTotal > 0 ? [{
          amount: advanceTotal,
          date: new Date().toISOString(),
          method: 'Cash',
          note: 'Advance Payment'
        }] : [];

        // 3. Create Order
        const orderRef = await addDoc(collection(db, 'shops', user.uid, 'orders'), {
          shopId: user.uid,
          tokenId,
          customerId,
          customerName: customerData.name,
          phone: customerData.phone,
          gender: gender,
          dressType: orderData.dressType,
          serviceType: serviceType,
          deliveryDate: new Date(orderData.deliveryDate).toISOString(),
          status: ORDER_STATUS.PENDING,
          price: price,
          advancePayment: advanceTotal,
          paymentStatus: paymentStatus,
          payments: initialPayments,
          assignedStaffId: orderData.assignedStaffId || '',
          assignedStaffName: orderData.assignedStaffName || '',
          quantity: Number(orderData.quantity),
          rackLocation: orderData.rackLocation,
          notes: orderData.notes,
          measurements: Object.fromEntries(
            Object.entries(measurements).map(([k, v]) => [k, Number(v) || 0])
          ),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        generateTokenId(user.uid).then(setPreGeneratedToken).catch(console.error);

        // 4. Notifications
        addNotification({
          type: 'new_order',
          title: 'New Order',
          message: `New order #${tokenId} created for ${customerData.name}.`,
          orderId: orderRef.id,
          customerId: customerId
        });

        if (price > advanceTotal) {
          addNotification({
            type: 'payment_pending',
            title: 'Payment Pending',
            message: `PKR ${price - advanceTotal} is pending from ${customerData.name} for order #${tokenId}.`,
            orderId: orderRef.id,
            customerId: customerId
          });
        }

        // 5. Upload Files (BETA - Disabled for now)
        let referencePhotoUrl = '';
        let sampleDesignUrl = '';

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

        // 5. Navigate to orders list
        toast.success(t('quickOrder.orderCreated') || 'Order created successfully!');
        navigate(`/dashboard/orders`);
      }, 2); // Pass maxRetries as 2
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'quick_order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("max-w-5xl mx-auto space-y-8 pb-12", isRTL && "font-urdu")}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm border-none rounded-xl">
            {isRTL ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </Button>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-slate-900">{t('quickOrder.newOrder')}</h1>
        </div>
        {preGeneratedToken && (
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 shadow-neu-pressed-sm text-brand-primary rounded-xl font-bold border-none">
            <Hash className="h-4 w-4" />
            Order Token: {preGeneratedToken}
          </div>
        )}
      </div>
      {preGeneratedToken && (
        <div className="sm:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 shadow-neu-pressed-sm text-brand-primary rounded-xl font-bold border-none mb-4">
          <Hash className="h-4 w-4" />
          Order Token: {preGeneratedToken}
        </div>
      )}

      <TemplateSelector 
        templateHook={templateHook} 
        setOrderData={setOrderData} 
        setMeasurements={setMeasurements} 
        setGender={setGender}
      />

      {/* Steps Indicator */}
      <div className="mb-4 sm:mb-8 mt-2 px-4 sm:px-10">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-primary rounded-full z-0 transition-all duration-300" style={{ width: `${((currentStep - 1) / 3) * 100}%` }}></div>
          
          {[1, 2, 3, 4].map((step) => (
             <div key={step} className="flex flex-col items-center relative z-10 bg-gray-100 p-1 rounded-full">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-colors shadow-neu-sm", currentStep > step ? "bg-emerald-500 text-white" : currentStep === step ? "bg-brand-primary text-white" : "bg-gray-100 text-slate-500")}>
                   {currentStep > step ? <Check className="w-5 h-5"/> : step}
                </div>
                <div className={cn("absolute -bottom-6 w-32 text-center text-[10px] font-black uppercase tracking-wider hidden sm:block", currentStep >= step ? "text-slate-800" : "text-slate-400")}>
                  {step === 1 ? 'Customer Info' : step === 2 ? 'Order Details' : step === 3 ? 'Measurements' : 'Review'}
                </div>
             </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-100 rounded-[2rem] p-4 sm:p-8 shadow-neu mt-8 sm:mt-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 1 && (
            <div className="space-y-8">
            <Card className="border-none shadow-neu bg-gray-100 rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-transparent border-b border-gray-200/50 p-4 sm:p-6">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="h-2 w-2 bg-blue-500 rounded-full shadow-neu-sm"></span>
                  {t('quickOrder.customerInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 grid sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2 space-y-1.5 relative" ref={dropdownRef}>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('quickOrder.searchCustomer')}</label>
                  <div className="relative">
                    <Search className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary", isRTL ? "right-4" : "left-4")} />
                    <Input 
                      value={searchQuery} 
                      onChange={e => {
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                        if (e.target.value === '') {
                          setSelectedCustomerId('');
                          setCustomerData({ name: '', phone: '', address: '', notes: '' });
                          setMeasurements({});
                        } else {
                          // Keep name synced if typing a new customer
                          setCustomerData({...customerData, name: e.target.value});
                        }
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder={t('quickOrder.searchPlaceholder')}
                      className={cn("rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 transition-all h-12 text-base font-medium", isRTL ? "pr-12" : "pl-12")}
                    />
                  </div>
                  
                  <AnimatePresence>
                    {showDropdown && searchQuery && filteredCustomers.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-50 w-full mt-2 bg-gray-100 shadow-neu rounded-2xl border-none overflow-hidden max-h-60 overflow-y-auto"
                      >
                        {filteredCustomers.map(customer => (
                          <div 
                            key={customer.id}
                            onClick={() => handleSelectCustomer(customer)}
                            className="p-4 hover:bg-gray-200/50 cursor-pointer border-b border-gray-200/50 last:border-0 flex items-center justify-between group transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gray-100 shadow-neu-sm flex items-center justify-center text-brand-primary font-bold">
                                {customer.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 group-hover:text-brand-primary transition-colors">{customer.name}</div>
                                <div className="text-xs text-slate-500 flex items-center mt-0.5">
                                  <Phone className="h-3 w-3 mr-1" /> {customer.phone}
                                </div>
                              </div>
                            </div>
                            {selectedCustomerId === customer.id && (
                              <Check className="h-5 w-5 text-brand-primary" />
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                  <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('quickOrder.customerName')}</label>
                  <div className="relative">
                    <User className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                    <Input 
                      required 
                      value={customerData.name} 
                      onChange={e => {
                        setCustomerData({...customerData, name: e.target.value});
                        setSearchQuery(e.target.value);
                      }}
                      placeholder={t('quickOrder.customerNamePlaceholder')}
                      className={cn("rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 transition-all h-12 text-base font-medium", isRTL ? "pr-12" : "pl-12")}
                    />
                  </div>
                  {validationErrors.name && <p className="text-red-500 text-xs font-bold mt-1 pl-1">{validationErrors.name}</p>}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {['male', 'female', 'kids'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={cn(
                          "h-12 rounded-xl font-bold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all border-none text-xs sm:text-sm",
                          gender === g 
                            ? "bg-gray-100 shadow-neu-pressed text-brand-primary" 
                            : "bg-gray-100 shadow-neu-sm text-slate-500 hover:text-brand-primary hover:shadow-neu-pressed-sm"
                        )}
                      >
                        <span>{g === 'male' ? '👨' : g === 'female' ? '👩' : '👶'}</span>
                        <span className="hidden sm:inline">{g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Kids'}</span>
                        <span className="sm:hidden text-[10px] leading-none">{g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Kids'}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('quickOrder.phoneNumber')}</label>
                  <div className="relative">
                    <Phone className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                    <Input 
                      value={customerData.phone} 
                      onChange={e => setCustomerData({...customerData, phone: e.target.value})}
                      placeholder={t('quickOrder.phonePlaceholder')}
                      className={cn("rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 transition-all h-12 text-base font-medium", isRTL ? "pr-12 text-right" : "pl-12")}
                      dir="ltr"
                    />
                  </div>
                  {validationErrors.phone && <p className="text-red-500 text-xs font-bold mt-1 pl-1">{validationErrors.phone}</p>}
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('quickOrder.address')}</label>
                  <div className="relative">
                    <MapPin className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                    <Input 
                      value={customerData.address} 
                      onChange={e => setCustomerData({...customerData, address: e.target.value})}
                      placeholder={t('quickOrder.addressPlaceholder')}
                      className={cn("rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 transition-all h-12 text-base font-medium", isRTL ? "pr-12" : "pl-12")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end pt-4">
              <Button type="button" onClick={handleNext} className="h-12 px-8 rounded-xl bg-brand-primary text-white font-black shadow-neu hover:shadow-neu-pressed transition-all">
                Next <ArrowRight className={cn("h-5 w-5", isRTL ? "mr-2" : "ml-2")} />
              </Button>
            </div>
            </div>
            )}

            {currentStep === 2 && (
            <div className="space-y-8">
            <Card className="border-none shadow-neu bg-gray-100 rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-transparent border-b border-gray-200/50 p-4 sm:p-6">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="h-2 w-2 bg-brand-primary rounded-full shadow-neu-sm"></span>
                  {t('quickOrder.orderDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5 relative" ref={dressDropdownRef}>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('quickOrder.dressType')}</label>
                    <div className="relative">
                      <Scissors className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        required 
                        value={showDressDropdown ? dressSearch : orderData.dressType} 
                        onChange={e => {
                          setDressSearch(e.target.value);
                          setShowDressDropdown(true);
                        }}
                        onFocus={() => {
                          setDressSearch('');
                          setShowDressDropdown(true);
                        }}
                        placeholder={t('quickOrder.dressTypePlaceholder')}
                        className={cn("rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 transition-all h-12 text-base font-medium", isRTL ? "pr-12" : "pl-12")}
                      />
                      <ChevronDown className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400", isRTL ? "left-4" : "right-4")} />
                    </div>
                    
                    <AnimatePresence>
                      {showDressDropdown && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute z-50 w-full mt-2 bg-gray-100 shadow-neu rounded-2xl border-none overflow-hidden max-h-60 overflow-y-auto"
                        >
                          {DRESS_OPTIONS[gender as keyof typeof DRESS_OPTIONS]
                            .filter(opt => opt.en.toLowerCase().includes(dressSearch.toLowerCase()) || opt.ur.includes(dressSearch))
                            .map((opt, i) => (
                            <div 
                              key={i}
                              onClick={() => {
                                setOrderData({...orderData, dressType: opt.en});
                                setShowDressDropdown(false);
                              }}
                              className="p-3 hover:bg-gray-200/50 cursor-pointer border-b border-gray-200/50 last:border-0 flex items-center justify-between group transition-colors"
                            >
                              <div className="font-bold text-slate-900 group-hover:text-brand-primary">{opt.en}</div>
                              <div className="text-sm text-slate-500 font-urdu">{opt.ur}</div>
                            </div>
                          ))}
                          {dressSearch && !DRESS_OPTIONS[gender as keyof typeof DRESS_OPTIONS].some(opt => opt.en.toLowerCase() === dressSearch.toLowerCase()) && (
                            <div 
                              onClick={() => {
                                setOrderData({...orderData, dressType: dressSearch});
                                setShowDressDropdown(false);
                              }}
                              className="p-3 bg-gray-100 shadow-neu-pressed-sm hover:shadow-neu-sm cursor-pointer flex items-center gap-2 text-brand-primary font-bold m-2 rounded-xl"
                            >
                              <Plus className="h-4 w-4" /> Use custom: "{dressSearch}"
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {validationErrors.dressType && <p className="text-red-500 text-xs font-bold mt-1 pl-1">{validationErrors.dressType}</p>}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service Type</label>
                    <div className="relative">
                      <Tag className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                      <select
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value)}
                        className={cn("w-full rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 transition-all h-12 text-base font-medium appearance-none", isRTL ? "pr-12 text-right" : "pl-12")}
                      >
                        <option value="Standard">Standard (5-7 days)</option>
                        <option value="Express">Express (2-3 days)</option>
                        <option value="Premium">Premium (1 day)</option>
                      </select>
                      <ChevronDown className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none", isRTL ? "left-4" : "right-4")} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('quickOrder.deliveryDate')}</label>
                    <div className="relative">
                      <Calendar className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        type="date" 
                        required 
                        value={orderData.deliveryDate} 
                        onChange={e => setOrderData({...orderData, deliveryDate: e.target.value})}
                        className={cn("rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 transition-all h-12 text-base font-medium", isRTL ? "pr-12 text-right" : "pl-12")}
                      />
                    </div>
                    {validationErrors.deliveryDate && <p className="text-red-500 text-xs font-bold mt-1 pl-1">{validationErrors.deliveryDate}</p>}
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('quickOrder.quantity')}</label>
                    <div className="relative">
                      <Hash className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        type="number" 
                        required 
                        value={orderData.quantity} 
                        onChange={e => setOrderData({...orderData, quantity: e.target.value})}
                        className={cn("rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 transition-all h-12 text-base font-medium", isRTL ? "pr-12 text-right" : "pl-12")}
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('quickOrder.totalPrice')} ({settings.currency})</label>
                    <div className="relative">
                      <CreditCard className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        type="number" 
                        required 
                        value={orderData.price} 
                        onChange={e => setOrderData({...orderData, price: e.target.value})}
                        placeholder="0.00"
                        className={cn("rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 transition-all h-12 text-base font-medium", isRTL ? "pr-12 text-right" : "pl-12")}
                        dir="ltr"
                      />
                    </div>
                    {validationErrors.price && <p className="text-red-500 text-xs font-bold mt-1 pl-1">{validationErrors.price}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('quickOrder.advance')} ({settings.currency})</label>
                    <div className="relative">
                      <CreditCard className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        type="number" 
                        value={orderData.advancePayment} 
                        onChange={e => setOrderData({...orderData, advancePayment: e.target.value})}
                        placeholder="0.00"
                        className={cn("rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 transition-all h-12 text-base font-medium", isRTL ? "pr-12 text-right" : "pl-12")}
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Scissors className="h-3 w-3" /> Assign Staff
                    </label>
                    <div className="relative">
                      <User className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                      <select
                        value={orderData.assignedStaffId}
                        onChange={(e) => {
                          const selectedStaff = staff.find(s => s.id === e.target.value);
                          setOrderData({
                            ...orderData, 
                            assignedStaffId: e.target.value,
                            assignedStaffName: selectedStaff ? selectedStaff.name : ''
                          });
                        }}
                        className={cn("w-full rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 transition-all h-12 text-base font-medium appearance-none", isRTL ? "pr-12 text-right" : "pl-12")}
                      >
                        <option value="">Unassigned</option>
                        {staff.map(w => (
                          <option key={w.id} value={w.id}>{w.name} ({w.role})</option>
                        ))}
                      </select>
                      <ChevronDown className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none", isRTL ? "left-4" : "right-4")} />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {t('quickOrder.rackLocation')}
                    </label>
                    <div className="relative">
                      <MapPin className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        value={orderData.rackLocation} 
                        onChange={e => setOrderData({...orderData, rackLocation: e.target.value})}
                        placeholder={t('quickOrder.rackPlaceholder')}
                        className={cn("rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 transition-all h-12 text-base font-medium", isRTL ? "pr-12" : "pl-12")}
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('quickOrder.notes')}</label>
                    <div className="relative">
                      <Notebook className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary z-10", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        value={orderData.notes} 
                        onChange={e => setOrderData({...orderData, notes: e.target.value})}
                        placeholder={t('quickOrder.notesPlaceholder')}
                        className={cn("rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 transition-all h-12 text-base font-medium", isRTL ? "pr-12" : "pl-12")}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200/50 grid sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {t('quickOrder.referencePhoto')} (Beta)
                    </label>
                    <div className="relative">
                      {referencePhoto ? (
                        <div className="relative h-32 w-full rounded-xl bg-gray-100 shadow-neu-pressed-sm overflow-hidden group">
                          <img src={URL.createObjectURL(referencePhoto)} alt="Reference" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button type="button" variant="destructive" size="sm" onClick={() => setReferencePhoto(null)} className="rounded-full shadow-neu-sm">
                              <X className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('quickOrder.remove')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-32 w-full rounded-xl bg-gray-100 shadow-neu-pressed-sm hover:shadow-neu-sm transition-all cursor-pointer border-none">
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
                        <div className="relative h-32 w-full rounded-xl bg-gray-100 shadow-neu-pressed-sm overflow-hidden group">
                          <img src={URL.createObjectURL(sampleDesign)} alt="Sample" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button type="button" variant="destructive" size="sm" onClick={() => setSampleDesign(null)} className="rounded-full shadow-neu-sm">
                              <X className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('quickOrder.remove')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-32 w-full rounded-xl bg-gray-100 shadow-neu-pressed-sm hover:shadow-neu-sm transition-all cursor-pointer border-none">
                          <Upload className="h-6 w-6 text-brand-primary mb-2" />
                          <span className="text-sm font-medium text-slate-500">{t('quickOrder.clickToUpload')}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => setSampleDesign(e.target.files?.[0] || null)} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between pt-4">
              <Button type="button" variant="ghost" onClick={handleBack} className="h-12 px-6 rounded-xl text-slate-500 font-bold hover:bg-gray-200/50">
                <ArrowLeft className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} /> Back
              </Button>
              <Button type="button" onClick={handleNext} className="h-12 px-8 rounded-xl bg-brand-primary text-white font-black shadow-neu hover:shadow-neu-pressed transition-all">
                Next <ArrowRight className={cn("h-5 w-5", isRTL ? "mr-2" : "ml-2")} />
              </Button>
            </div>
            </div>
            )}

            {currentStep === 3 && (
            <div className="space-y-8">
            <Card className="border-none shadow-neu bg-gray-100 rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-transparent border-b border-gray-200/50 p-4 sm:p-6">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-brand-primary" />
                  {t('quickOrder.measurements')}
                </CardTitle>
                {selectedCustomerId ? (
                  <div className="space-y-4 mt-4">
                    {Object.keys(measurementSets).length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Scissors className="h-3 w-3" /> Use measurements from:
                        </label>
                        <div className="relative">
                          <select
                            value={selectedMeasurementSet}
                            onChange={(e) => {
                              setSelectedMeasurementSet(e.target.value);
                              setMeasurements(measurementSets[e.target.value] || {});
                            }}
                            className={cn("w-full rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 transition-all h-10 text-sm font-bold appearance-none", isRTL ? "pr-10 text-right" : "pl-4 pr-10")}
                          >
                            <option value="">-- Choose Set --</option>
                            {Object.keys(measurementSets).map(setName => (
                              <option key={setName} value={setName}>{setName}</option>
                            ))}
                          </select>
                          <ChevronDown className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none", isRTL ? "left-4" : "right-4")} />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 bg-emerald-100/50 text-emerald-600 px-3 py-2 rounded-xl text-sm font-bold border border-emerald-200 w-fit">
                      <Check className="h-4 w-4" />
                      {selectedMeasurementSet ? `📐 ${selectedMeasurementSet} measurements loaded. Editing updates their profile.` : 'Loaded from customer profile. Editing here updates their profile.'}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-blue-100/50 text-blue-600 px-3 py-2 rounded-xl text-sm font-bold border border-blue-200 w-fit mt-3">
                    <User className="h-4 w-4" />
                    These measurements will be saved to the customer's profile.
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-8">
                
                {(() => {
                  const customTemplate = measurementTemplates.find(t => t.gender === gender && t.isDefault) || measurementTemplates.find(t => t.gender === gender);
                  
                  if (customTemplate) {
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="h-8 w-8 rounded-xl bg-gray-100 shadow-neu-pressed-sm flex items-center justify-center text-brand-primary font-black text-xs">
                            01
                          </div>
                          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                            {isRTL ? customTemplate.nameUr || customTemplate.nameEn : customTemplate.nameEn}
                          </h3>
                          <div className="flex-1 h-px bg-gray-200/50"></div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                          {[...customTemplate.fields].sort((a,b) => a.order - b.order).map((field) => (
                            <div key={field.id} className="space-y-1.5 group">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 group-focus-within:text-brand-primary transition-colors">
                                <Ruler className="h-3 w-3" />
                                {isRTL ? field.labelUr || field.labelEn : field.labelEn}
                              </label>
                              <div className="relative">
                                <Input 
                                  type="number" 
                                  step="0.25"
                                  value={measurements[field.id] || ''} 
                                  onChange={e => {
                                    const val = e.target.value === '' ? '' : Number(e.target.value);
                                    setMeasurements({...measurements, [field.id]: val});
                                  }}
                                  placeholder="0.00"
                                  className={cn("rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 transition-all h-12 text-base sm:text-sm font-bold", isRTL ? "pr-3 pl-8 text-right" : "pl-3 pr-8")}
                                  dir="ltr"
                                />
                                <span className={cn("absolute top-1/2 -translate-y-1/2 text-[10px] uppercase font-black text-slate-400", isRTL ? "left-3" : "right-3")}>
                                  {customTemplate.unit === 'cm' ? 'CM' : 'IN'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return getMeasurementCategoriesForDress(orderData.dressType).map((category, index) => (
                    <div key={category.id} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-xl bg-gray-100 shadow-neu-pressed-sm flex items-center justify-center text-brand-primary font-black text-xs">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                          {isRTL ? category.titleUr : category.titleEn}
                        </h3>
                        <div className="flex-1 h-px bg-gray-200/50"></div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                        {category.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div key={item.id} className="space-y-1.5 group">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 group-focus-within:text-brand-primary transition-colors">
                                <Icon className="h-3 w-3" />
                                {isRTL ? item.ur : item.en}
                              </label>
                              <div className="relative">
                                <Input 
                                  type="number" 
                                  step="0.25"
                                  value={measurements[item.id] || ''} 
                                  onChange={e => {
                                    const val = e.target.value === '' ? '' : Number(e.target.value);
                                    setMeasurements({...measurements, [item.id]: val});
                                  }}
                                  placeholder="0.00"
                                  className={cn("rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 transition-all h-12 text-base sm:text-sm font-bold", isRTL ? "pr-3 pl-8 text-right" : "pl-3 pr-8")}
                                  dir="ltr"
                                />
                                <span className={cn("absolute top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400", isRTL ? "left-3" : "right-3")}>{t('quickOrder.in')}</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-medium">{item.desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}

              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <SaveTemplateButton 
                templateHook={templateHook} 
                currentOrderData={orderData} 
                currentMeasurements={measurements} 
                currentGender={gender} 
              />
              <div className="flex justify-between pt-4">
                <Button type="button" variant="ghost" onClick={handleBack} className="h-12 px-6 rounded-xl text-slate-500 font-bold hover:bg-gray-200/50">
                  <ArrowLeft className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} /> Back
                </Button>
                <Button type="button" onClick={handleNext} className="h-12 px-8 rounded-xl bg-brand-primary text-white font-black shadow-neu hover:shadow-neu-pressed transition-all">
                  Next <ArrowRight className={cn("h-5 w-5", isRTL ? "mr-2" : "ml-2")} />
                </Button>
              </div>
            </div>
            </div>
            )}

            {currentStep === 4 && (
            <div className="space-y-8">
            <Card className="border-none shadow-neu bg-gray-100 rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-transparent border-b border-gray-200/50 p-4 sm:p-6 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-500" />
                  Review & Confirm
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-8">
                {/* Customer Summary */}
                <div className="space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <User className="h-3 w-3" /> Customer Info
                    </h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(1)} className="text-brand-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2">Edit</Button>
                  </div>
                  <div className="bg-white/50 rounded-xl p-4 space-y-2">
                    <div className="font-bold text-slate-900">{customerData.name}</div>
                    <div className="text-sm text-slate-600 flex items-center gap-2"><Phone className="h-3 w-3" /> {customerData.phone}</div>
                    {customerData.address && <div className="text-sm text-slate-600 flex items-center gap-2"><MapPin className="h-3 w-3" /> {customerData.address}</div>}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Scissors className="h-3 w-3" /> Order Details
                    </h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(2)} className="text-brand-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2">Edit</Button>
                  </div>
                  <div className="bg-white/50 rounded-xl p-4 grid sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Dress Type</div>
                      <div className="font-bold text-slate-900">{orderData.dressType}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Quantity</div>
                      <div className="font-bold text-slate-900">{orderData.quantity}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Gender</div>
                      <div className="font-bold text-slate-900 capitalize">{gender}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Assigned To</div>
                      <div className="font-bold text-slate-900">{orderData.assignedStaffName || 'Unassigned'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-500">Estimated Delivery</div>
                      <div className="font-bold text-emerald-600 flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {new Date(orderData.deliveryDate).toLocaleDateString()}</div>
                    </div>
                    {orderData.rackLocation && (
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Rack</div>
                        <div className="font-bold text-slate-900">{orderData.rackLocation}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Summary */}
                <div className="space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <CreditCard className="h-3 w-3" /> Payment Info
                    </h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(2)} className="text-brand-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2">Edit</Button>
                  </div>
                  <div className="bg-white/50 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total</div>
                      <div className="font-black text-slate-900">{settings.currency}{orderData.price || "0"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Advance</div>
                      <div className="font-black text-emerald-600">{settings.currency}{orderData.advancePayment || "0"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Balance</div>
                      <div className="font-black text-red-500">{settings.currency}{Number(orderData.price || 0) - Number(orderData.advancePayment || 0)}</div>
                    </div>
                  </div>
                </div>

                {/* Measurements Summary */}
                <div className="space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Ruler className="h-3 w-3" /> Measurements Summary
                    </h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(3)} className="text-brand-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2">Edit</Button>
                  </div>
                  <div className="bg-white/50 rounded-xl p-4">
                    <p className="text-sm font-bold text-slate-600 leading-relaxed">
                      {Object.entries(measurements)
                        .filter(([_, val]) => val && Number(val) > 0)
                        .map(([key, val]) => {
                          const capKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                          return `${capKey}: ${val}`;
                        })
                        .join(", ")}
                      {Object.keys(measurements).length === 0 && <span className="text-slate-400 italic">No measurements entered</span>}
                    </p>
                  </div>
                </div>

                {/* Notes Summar */}
                {orderData.notes && (
                  <div className="space-y-3 relative group">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Notebook className="h-3 w-3" /> Notes
                      </h3>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(2)} className="text-brand-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2">Edit</Button>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                      <p className="text-sm font-bold text-amber-800">{orderData.notes}</p>
                    </div>
                  </div>
                )}
                
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between pt-4 mb-4">
                <Button type="button" variant="ghost" onClick={handleBack} className="h-12 px-6 rounded-xl text-slate-500 font-bold hover:bg-gray-200/50">
                  <ArrowLeft className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} /> Back
                </Button>
              </div>
              <Button 
                type="button" 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-2xl h-14 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 shadow-neu text-white w-full transition-all active:scale-95 disabled:opacity-70 border-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t('quickOrder.processing')}
                  </>
                ) : (
                  <>
                    <Check className="h-6 w-6" />
                    Complete & Save Order
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => navigate(-1)}
                className="rounded-2xl h-12 w-full font-bold bg-gray-100 shadow-neu-sm text-slate-500 hover:text-brand-primary hover:shadow-neu-pressed-sm border-none mt-2"
              >
                {t('quickOrder.cancel')}
              </Button>
            </div>
            </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
