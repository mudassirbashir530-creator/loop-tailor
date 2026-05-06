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
        navigate(`/dashboard/orders`);
      }, 2); // Pass maxRetries as 2
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'quick_order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("page pb-[100px]", isRTL && "font-urdu")} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Bar */}
      <div className="bg-white border-b border-[#E2DDD6] px-4 py-4 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => navigate(-1)} type="button" className="p-2 -ml-2 text-[#111111]">
          {isRTL ? <ArrowRight className="h-6 w-6" /> : <ArrowLeft className="h-6 w-6" />}
        </button>
        <h1 className="text-xl font-bold text-[#111111]">Customize Order</h1>
        <div className="w-10"></div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {preGeneratedToken && (
          <div className="flex items-center justify-center gap-2 bg-[#2ECC71]/10 text-[#2ECC71] px-4 py-3 rounded-xl border border-[#2ECC71]/20 font-bold text-sm">
            <Hash className="h-4 w-4" />
            Order: {preGeneratedToken}
          </div>
        )}

        {/* Product Image Area */}
        <div className="w-full h-[280px] bg-white rounded-2xl border border-[#E2DDD6] relative flex items-center justify-center overflow-hidden shadow-sm">
          {/* Garment Preview Placeholder */}
          <div className="absolute inset-0 bg-[#F7F5F0] flex flex-col items-center justify-center">
             <Scissors className="w-16 h-16 text-[#E2DDD6] mb-4" />
             <span className="text-[#555555] font-bold">Garment Preview</span>
          </div>
          
          {/* Color Swatches */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
            {[ '#111111', '#0D3D33', '#2ECC71', '#E53935' ].map((color, i) => (
              <div key={i} className={`w-8 h-8 rounded-full shadow-md cursor-pointer border-2 ${i === 1 ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }}></div>
            ))}
          </div>
        </div>

        {/* Price Row */}
        <div className="flex justify-between items-center card !m-0 !py-4 shadow-sm">
          <div className="text-[24px] font-bold text-[#2ECC71]">
            {settings.currency} {orderData.price || '0.00'}
          </div>
          <button type="button" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="btn-outline !py-2 !h-10 text-[13px]">
            View Details
          </button>
        </div>

        {/* Garment Style Selection */}
        <div className="card shadow-sm !m-0">
          <h3 className="text-[16px] font-bold text-[#111111] mb-4 border-b border-[#E2DDD6] pb-3">Garment Style Selection</h3>
          <div className="space-y-6">
            {STYLE_CATEGORIES.map((category) => (
               <div key={category.id}>
                 <h4 className="text-xs font-bold text-[#555555] uppercase tracking-widest mb-3" >{category.title}</h4>
                 <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar">
                   {category.options.map(opt => {
                     const isSelected = garmentStyles[category.id] === opt.label;
                     return (
                       <div 
                         key={opt.id} 
                         onClick={() => setGarmentStyles(prev => ({...prev, [category.id]: opt.label}))}
                         className={cn(
                           "flex flex-col items-center justify-between p-3 rounded-xl border-2 min-w-[110px] cursor-pointer transition-all",
                           isSelected ? "border-[#0D3D33] bg-[#0D3D33]/5" : "border-[#E2DDD6] bg-[#F7F5F0] hover:border-[#0D3D33]/30"
                         )}
                       >
                          <div className="w-16 h-16 bg-white rounded-lg mb-3 flex items-center justify-center text-3xl border border-[#E2DDD6]">
                             {category.id === 'Collar' ? '👔' : category.id === 'Sleeves' ? '👕' : category.id === 'Pocket' ? '👝' : category.id === 'Placket' ? '🧵' : '🎽'}
                          </div>
                          <div className="text-[12px] font-bold text-center text-[#111111] leading-tight">
                            {opt.label}
                          </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
            ))}
          </div>
        </div>

        <div className="text-center font-bold text-[#555555] uppercase tracking-widest text-[11px] mb-2 flex items-center gap-2">
           <div className="h-px bg-[#E2DDD6] flex-1"></div>
           Order Details Form
           <div className="h-px bg-[#E2DDD6] flex-1"></div>
        </div>

        <div className="card shadow-sm !m-0 space-y-6">
            <TemplateSelector 
              templateHook={templateHook} 
              setOrderData={setOrderData} 
              setMeasurements={setMeasurements} 
              setGender={setGender}
            />
            
            <div className="space-y-4">
               <h3 className="text-[15px] font-bold text-[#111111] border-b border-[#E2DDD6] pb-2">Customer</h3>
               <div className="space-y-3 relative" ref={dropdownRef}>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#888888] pointer-events-none" />
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
                        className="w-full h-14 pl-12 pr-4 rounded-xl border border-[#E2DDD6] bg-[#F7F5F0] focus:bg-white focus:border-[#0D3D33] text-[#111111] font-bold placeholder:font-normal placeholder:text-[#555555] outline-none"
                      />
                    </div>
                    <AnimatePresence>
                      {showDropdown && searchQuery && filteredCustomers.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute z-50 w-full mt-1 bg-white shadow-lg rounded-xl border border-[#E2DDD6] overflow-hidden max-h-60 overflow-y-auto"
                        >
                          {filteredCustomers.map(customer => (
                            <div 
                              key={customer.id}
                              onClick={() => handleSelectCustomer(customer)}
                              className="p-3 hover:bg-[#F7F5F0] cursor-pointer border-b border-[#E2DDD6] flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-[#0D3D33]/10 flex items-center justify-center text-[#0D3D33] font-bold text-lg">
                                  {customer.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-[#111111] text-sm">{customer.name}</div>
                                  <div className="text-xs text-[#555555] flex items-center mt-0.5"><Phone className="h-3.5 w-3.5 mr-1" /> {customer.phone}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
               </div>
               <div className="relative">
                 <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#888888] pointer-events-none" />
                 <input 
                    value={customerData.phone} 
                    onChange={e => setCustomerData({...customerData, phone: e.target.value})}
                    placeholder="Phone Number"
                    className="w-full h-14 pl-12 pr-4 rounded-xl border border-[#E2DDD6] bg-[#F7F5F0] focus:bg-white focus:border-[#0D3D33] text-[#111111] font-bold placeholder:font-normal placeholder:text-[#555555] outline-none"
                 />
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-[15px] font-bold text-[#111111] border-b border-[#E2DDD6] pb-2">Order Details</h3>
               <div className="relative">
                 <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#888888] pointer-events-none" />
                 <input 
                    value={orderData.dressType} 
                    onChange={e => setOrderData({...orderData, dressType: e.target.value})}
                    placeholder="Dress Type (e.g. Suit)"
                    className="w-full h-14 pl-12 pr-4 rounded-xl border border-[#E2DDD6] bg-[#F7F5F0] focus:bg-white focus:border-[#0D3D33] text-[#111111] font-bold placeholder:font-normal placeholder:text-[#555555] outline-none"
                 />
               </div>
               <div className="relative">
                 <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#888888] pointer-events-none" />
                 <input 
                    type="date"
                    value={orderData.deliveryDate} 
                    onChange={e => setOrderData({...orderData, deliveryDate: e.target.value})}
                    className="w-full h-14 pl-12 pr-4 rounded-xl border border-[#E2DDD6] bg-[#F7F5F0] focus:bg-white focus:border-[#0D3D33] text-[#111111] font-bold placeholder:font-normal placeholder:text-[#555555] outline-none uppercase"
                 />
               </div>
               <div className="flex gap-3">
                 <div className="relative flex-1">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#888888] font-bold select-none text-sm flex items-center justify-center">$</div>
                   <input 
                      type="number"
                      value={orderData.price} 
                      onChange={e => setOrderData({...orderData, price: e.target.value})}
                      placeholder="Total Price"
                      className="w-full h-14 pl-10 pr-4 rounded-xl border border-[#E2DDD6] bg-[#F7F5F0] focus:bg-white focus:border-[#0D3D33] text-[#111111] font-bold placeholder:font-normal placeholder:text-[#555555] outline-none"
                   />
                 </div>
                 <div className="relative flex-1">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#888888] font-bold select-none text-sm flex items-center justify-center">$</div>
                   <input 
                      type="number"
                      value={orderData.advancePayment} 
                      onChange={e => setOrderData({...orderData, advancePayment: e.target.value})}
                      placeholder="Advance Pay"
                      className="w-full h-14 pl-10 pr-4 rounded-xl border border-[#E2DDD6] bg-[#F7F5F0] focus:bg-white focus:border-[#0D3D33] text-[#111111] font-bold placeholder:font-normal placeholder:text-[#555555] outline-none"
                   />
                 </div>
               </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-[15px] font-bold text-[#111111] border-b border-[#E2DDD6] pb-2">Measurements</h3>
              {getMeasurementCategoriesForDress(orderData.dressType).map((category) => (
                <div key={category.id} className="space-y-3 pt-2">
                   <div className="font-bold text-[12px] text-[#0D3D33] uppercase tracking-widest bg-[#0D3D33]/5 inline-block px-3 py-1 rounded-md">{category.titleEn}</div>
                   <div className="grid grid-cols-2 gap-3">
                     {category.items.map((item) => (
                       <div key={item.id} className="bg-[#F7F5F0] rounded-xl border border-[#E2DDD6] p-3 focus-within:border-[#0D3D33] focus-within:bg-white transition-colors">
                          <label className="text-[10px] uppercase font-bold text-[#555555] block mb-1.5 leading-none">{item.en}</label>
                          <input 
                            type="number"
                            step="0.25"
                            value={measurements[item.id] || ''} 
                            onChange={e => setMeasurements({...measurements, [item.id]: e.target.value === '' ? '' : Number(e.target.value)})}
                            placeholder="0.00"
                            className="w-full bg-transparent border-none p-0 text-[16px] font-bold text-[#111111] placeholder-[#888888] outline-none"
                          />
                       </div>
                     ))}
                   </div>
                </div>
              ))}
            </div>
            
        </div>
      </div>

      {/* Action Buttons (Fixed Bottom Bar) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#E2DDD6] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 flex items-center gap-3">
        <label className="btn-outline flex-1 !p-0 !min-h-0 flex items-center justify-center gap-2 cursor-pointer h-14 text-sm whitespace-nowrap">
           <Upload className="w-4 h-4"/> Upload Design
           <input type="file" accept="image/*" className="hidden" onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                setReferencePhoto(file);
                toast.success('Design uploaded.');
              }
           }} />
        </label>
        <button onClick={handleSubmit} type="button" disabled={isSubmitting} className="btn-primary flex-[1.5] flex items-center justify-center h-14 text-sm">
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Order'}
        </button>
      </div>
    </div>
  );
}
