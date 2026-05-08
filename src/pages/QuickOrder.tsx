import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useShop } from '../contexts/ShopContext';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { generateTokenId, withRetry } from '../lib/utils';
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

const STYLE_CATEGORIES = [
  {
    id: 'Collar',
    title: 'Collar',
    options: [
      { id: 'classic', label: 'Classic Collar' },
      { id: 'mandarin', label: 'Mandarin / Band Collar' },
      { id: 'pointed', label: 'Pointed Collar' },
      { id: 'round', label: 'Round Collar' },
      { id: 'vshape', label: 'V-Shape Collar' },
      { id: 'nehru', label: 'Nehru Collar' },
    ]
  },
  {
    id: 'Sleeves',
    title: 'Sleeves',
    options: [
      { id: 'full', label: 'Full Sleeves' },
      { id: 'half', label: 'Half Sleeves' },
      { id: 'three_quarter', label: '3/4 Sleeves' },
      { id: 'sleeveless', label: 'Sleeveless' },
      { id: 'bell', label: 'Bell Sleeves' },
    ]
  },
  {
    id: 'Pocket',
    title: 'Pocket',
    options: [
      { id: 'none', label: 'No Pocket' },
      { id: 'single', label: 'Single Chest Pocket' },
      { id: 'double', label: 'Double Side Pockets' },
      { id: 'patch', label: 'Patch Pocket' },
      { id: 'welt', label: 'Welt Pocket' },
    ]
  },
  {
    id: 'Placket',
    title: 'Placket',
    options: [
      { id: 'simple', label: 'Simple Placket' },
      { id: 'hidden', label: 'Hidden Placket' },
      { id: 'french', label: 'French Placket' },
      { id: 'half', label: 'Half Placket (Half PK)' },
      { id: 'full', label: 'Full Button Placket' },
    ]
  },
  {
    id: 'Back',
    title: 'Back',
    options: [
      { id: 'plain', label: 'Plain Back' },
      { id: 'center', label: 'Center Pleat' },
      { id: 'side', label: 'Side Pleats' },
      { id: 'box', label: 'Box Pleat' },
    ]
  }
];

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
        const q = query(collection(db, 'customers'), where('userId', '==', user.uid));
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
  const [garmentStyles, setGarmentStyles] = useState<Record<string, string>>({});

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
      const qMeas = query(collection(db, 'measurements'), where('userId', '==', user!.uid), where('customerId', '==', customer.id));
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
            collection(db, 'customers'), 
            where('userId', '==', user.uid),
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
          await updateDoc(doc(db, 'customers', customerId), {
            name: customerData.name,
            address: customerData.address,
            userId: user.uid,
            updatedAt: serverTimestamp()
          });
        } else {
          // Create new customer
          const customerRef = await addDoc(collection(db, 'customers'), {
            ...customerData,
            userId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          customerId = customerRef.id;
        }

        // Save/Update Measurements
        if (Object.keys(measurements).length > 0) {
          const setName = selectedMeasurementSet || 'Shalwar Kameez';
          const docId = `${customerId}__${setName}`;
          await setDoc(doc(db, 'measurements', docId), {
            ...measurements,
            userId: user.uid,
            customerId: customerId,
            setName: setName,
            updatedAt: serverTimestamp()
          }, { merge: true });

          // Backward compatibility for Shalwar Kameez
          if (setName === 'Shalwar Kameez') {
             await setDoc(doc(db, 'measurements', customerId), {
                ...measurements,
                userId: user.uid,
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
        const orderRef = await addDoc(collection(db, 'orders'), {
          userId: user.uid,
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
          garmentStyles: garmentStyles,
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
        navigate(`/app/orders`);
      }, 2); // Pass maxRetries as 2
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'quick_order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto pb-32", isRTL && "font-urdu")} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface/90 backdrop-blur-md border-b border-outline-variant px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-40"
      >
        <button onClick={() => navigate(-1)} type="button" className="p-2 -ml-2 text-on-surface hover:bg-surface-container rounded-full transition-colors">
          {isRTL ? <ArrowRight className="h-6 w-6" /> : <ArrowLeft className="h-6 w-6" />}
        </button>
        <h1 className="text-xl font-display font-medium text-on-surface">Customize Order</h1>
        <div className="w-10"></div>
      </motion.div>

      <div className="px-4 sm:px-6 py-6 space-y-8">
        {preGeneratedToken && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 bg-secondary/10 text-secondary px-4 py-3 rounded-2xl border border-secondary/20 font-medium text-sm shadow-soft"
          >
            <Hash className="h-4 w-4" />
            Order: {preGeneratedToken}
          </motion.div>
        )}

        {/* Product Image Area */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full h-[280px] bg-surface rounded-[2rem] border border-outline-variant relative flex items-center justify-center overflow-hidden shadow-sm group"
        >
          {/* Garment Preview Placeholder */}
          <div className="absolute inset-0 bg-surface-container-lowest flex flex-col items-center justify-center transition-transform group-hover:scale-105">
             <Scissors className="w-16 h-16 text-outline mb-4" />
             <span className="text-on-surface-variant font-medium">Garment Preview</span>
          </div>
          
          {/* Color Swatches */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3">
            {[ '#111111', '#0D3D33', '#2ECC71', '#E53935' ].map((color, i) => (
              <div key={i} className={`w-8 h-8 rounded-full shadow-md cursor-pointer border-2 transition-transform hover:scale-110 ${i === 1 ? 'border-surface scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }}></div>
            ))}
          </div>
        </motion.div>

        {/* Price Row */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex justify-between items-center bg-surface rounded-2xl border border-outline-variant shadow-sm px-6 py-5"
        >
          <div className="text-3xl font-display font-medium text-secondary">
            {settings.currency} {orderData.price || '0.00'}
          </div>
          <button type="button" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="h-10 px-4 rounded-xl border border-outline-variant text-sm font-medium hover:bg-surface-container transition-colors">
            View Details
          </button>
        </motion.div>

        {/* Garment Style Selection */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface rounded-3xl border border-outline-variant shadow-sm p-6"
        >
          <h3 className="text-lg font-medium text-on-surface mb-5 border-b border-outline-variant pb-4">Garment Style Selection</h3>
          <div className="space-y-8">
            {STYLE_CATEGORIES.map((category) => (
               <div key={category.id}>
                 <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-4" >{category.title}</h4>
                 <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar">
                   {category.options.map(opt => {
                     const isSelected = garmentStyles[category.id] === opt.label;
                     return (
                       <div 
                         key={opt.id} 
                         onClick={() => setGarmentStyles(prev => ({...prev, [category.id]: opt.label}))}
                         className={cn(
                           "flex flex-col items-center justify-between p-4 rounded-2xl border flex-shrink-0 min-w-[120px] cursor-pointer transition-all",
                           isSelected ? "border-primary bg-primary/5 shadow-soft" : "border-outline-variant bg-surface hover:border-primary/30 hover:shadow-sm"
                         )}
                       >
                          <div className="w-16 h-16 bg-surface rounded-[14px] mb-3 flex items-center justify-center text-3xl border border-outline-variant shadow-sm">
                             {category.id === 'Collar' ? '👔' : category.id === 'Sleeves' ? '👕' : category.id === 'Pocket' ? '👝' : category.id === 'Placket' ? '🧵' : '🎽'}
                          </div>
                          <div className="text-[13px] font-medium text-center text-on-surface leading-tight">
                            {opt.label}
                          </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
            ))}
          </div>
        </motion.div>

        <div className="text-center font-semibold text-on-surface-variant uppercase tracking-widest text-[11px] flex items-center gap-4 py-2">
           <div className="h-px bg-outline-variant flex-1"></div>
           Order Details Form
           <div className="h-px bg-outline-variant flex-1"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-surface rounded-3xl border border-outline-variant shadow-sm p-6 space-y-8"
        >
            <TemplateSelector 
              templateHook={templateHook} 
              setOrderData={setOrderData} 
              setMeasurements={setMeasurements} 
              setGender={setGender}
            />
            
            <div className="space-y-5">
               <h3 className="text-lg font-medium text-on-surface border-b border-outline-variant pb-3">Customer</h3>
               <div className="space-y-4 relative" ref={dropdownRef}>
                    <div className="relative group/input">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant transition-colors group-focus-within/input:text-primary pointer-events-none" />
                      <input 
                        value={searchQuery} 
                        onChange={e => {
                          setSearchQuery(e.target.value);
                          setShowDropdown(true);
                          if (e.target.value === '') {
                            setSelectedCustomerId('');
                            setCustomerData({ name: '', phone: '', address: '', notes: '' });
                            setMeasurements({});
                          } else {
                            setCustomerData({...customerData, name: e.target.value});
                          }
                        }}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Search Customer or Name..."
                        className="w-full h-14 pl-12 pr-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 text-on-surface font-medium placeholder:font-normal placeholder:text-on-surface-variant outline-none transition-all"
                      />
                    </div>
                    <AnimatePresence>
                      {showDropdown && searchQuery && filteredCustomers.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute z-50 w-full mt-2 bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl border border-outline-variant overflow-hidden max-h-[280px] overflow-y-auto"
                        >
                          {filteredCustomers.map(customer => (
                            <div 
                              key={customer.id}
                              onClick={() => handleSelectCustomer(customer)}
                              className="p-4 hover:bg-surface-container cursor-pointer border-b border-outline-variant flex items-center justify-between transition-colors last:border-0"
                            >
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display font-medium text-xl">
                                  {customer.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-on-surface text-base">{customer.name}</div>
                                  <div className="text-sm text-on-surface-variant flex items-center mt-0.5"><Phone className="h-3.5 w-3.5 mr-1.5" /> {customer.phone}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
               </div>
               <div className="relative group/phone">
                 <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant transition-colors group-focus-within/phone:text-primary pointer-events-none" />
                 <input 
                    value={customerData.phone} 
                    onChange={e => setCustomerData({...customerData, phone: e.target.value})}
                    placeholder="Phone Number"
                    className="w-full h-14 pl-12 pr-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 text-on-surface font-medium placeholder:font-normal placeholder:text-on-surface-variant outline-none transition-all"
                 />
               </div>
            </div>

            <div className="space-y-5 pt-4">
               <h3 className="text-lg font-medium text-on-surface border-b border-outline-variant pb-3">Order Details</h3>
               <div className="relative group/tag">
                 <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant transition-colors group-focus-within/tag:text-primary pointer-events-none" />
                 <input 
                    value={orderData.dressType} 
                    onChange={e => setOrderData({...orderData, dressType: e.target.value})}
                    placeholder="Dress Type (e.g. Suit)"
                    className="w-full h-14 pl-12 pr-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 text-on-surface font-medium placeholder:font-normal placeholder:text-on-surface-variant outline-none transition-all"
                 />
               </div>
               <div className="relative group/date">
                 <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant transition-colors group-focus-within/date:text-primary pointer-events-none" />
                 <input 
                    type="date"
                    value={orderData.deliveryDate} 
                    onChange={e => setOrderData({...orderData, deliveryDate: e.target.value})}
                    className="w-full h-14 pl-12 pr-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 text-on-surface font-medium placeholder:font-normal placeholder:text-on-surface-variant outline-none transition-all uppercase"
                 />
               </div>
               <div className="flex flex-col sm:flex-row gap-4">
                 <div className="relative flex-1 group/price">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant font-medium select-none text-base flex items-center justify-center transition-colors group-focus-within/price:text-primary">{settings.currency}</div>
                   <input 
                      type="number"
                      value={orderData.price} 
                      onChange={e => setOrderData({...orderData, price: e.target.value})}
                      placeholder="Total Price"
                      className="w-full h-14 pl-12 pr-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 text-on-surface font-medium placeholder:font-normal placeholder:text-on-surface-variant outline-none transition-all"
                   />
                 </div>
                 <div className="relative flex-1 group/adv">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant font-medium select-none text-base flex items-center justify-center transition-colors group-focus-within/adv:text-primary">{settings.currency}</div>
                   <input 
                      type="number"
                      value={orderData.advancePayment} 
                      onChange={e => setOrderData({...orderData, advancePayment: e.target.value})}
                      placeholder="Advance Pay"
                      className="w-full h-14 pl-12 pr-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 text-on-surface font-medium placeholder:font-normal placeholder:text-on-surface-variant outline-none transition-all"
                   />
                 </div>
               </div>
            </div>

            <div className="space-y-5 pt-4">
              <h3 className="text-lg font-medium text-on-surface border-b border-outline-variant pb-3">Measurements</h3>
              {getMeasurementCategoriesForDress(orderData.dressType).map((category) => (
                <div key={category.id} className="space-y-4 pt-2">
                   <div className="font-semibold text-xs text-primary uppercase tracking-widest bg-primary/10 inline-block px-3 py-1.5 rounded-[8px]">{category.titleEn}</div>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {category.items.map((item) => (
                       <div key={item.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-sm">
                          <label className="text-[11px] uppercase font-semibold text-on-surface-variant block mb-2 leading-none">{item.en}</label>
                          <input 
                            type="number"
                            step="0.25"
                            value={measurements[item.id] || ''} 
                            onChange={e => setMeasurements({...measurements, [item.id]: e.target.value === '' ? '' : Number(e.target.value)})}
                            placeholder="0.00"
                            className="w-full bg-transparent border-none p-0 text-lg font-medium text-on-surface placeholder-on-surface-variant/50 outline-none"
                          />
                       </div>
                     ))}
                   </div>
                </div>
              ))}
            </div>
            
        </motion.div>
      </div>

      {/* Action Buttons (Fixed Bottom Bar) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-surface/90 backdrop-blur-lg border-t border-outline-variant shadow-[0_-8px_32px_rgba(0,0,0,0.06)] z-50 flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto flex gap-4">
          <label className="flex-1 max-w-[200px] h-14 rounded-full border border-outline-variant bg-surface text-on-surface font-medium flex items-center justify-center gap-2 cursor-pointer hover:bg-surface-container transition-colors shadow-soft">
             <Upload className="w-5 h-5"/> 
             <span className="hidden sm:inline">Upload Design</span>
             <span className="sm:hidden">Upload</span>
             <input type="file" accept="image/*" className="hidden" onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  setReferencePhoto(file);
                  toast.success('Design uploaded.');
                }
             }} />
          </label>
          <button onClick={handleSubmit} type="button" disabled={isSubmitting} className="flex-[2] h-14 rounded-full bg-primary text-white font-medium flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-all shadow-soft disabled:opacity-70 disabled:hover:scale-100">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
