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
import { DesignModal } from '../components/DesignModal';

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
  
  // Garment Part UI State
  const [activePartModal, setActivePartModal] = useState<string | null>(null);
  const [garmentDesigns, setGarmentDesigns] = useState<Record<string, string>>({
    Collar: 'Classic',
    Sleeves: 'Full',
    Pocket: 'Single',
    Placket: 'Hidden',
    'Half Pk': 'None'
  });
  
  const getOptionsForPart = (part: string) => {
    switch (part) {
      case 'Collar': return [{id: 'Classic', label: 'Classic'}, {id: 'Cutaway', label: 'Cutaway'}, {id: 'Mandarin', label: 'Mandarin'}, {id: 'Button Down', label: 'Button Down'}];
      case 'Sleeves': return [{id: 'Full', label: 'Full Sleeves'}, {id: 'Half', label: 'Half Sleeves'}, {id: 'Roll Up', label: 'Roll Up'}];
      case 'Pocket': return [{id: 'Single', label: 'Single Pocket'}, {id: 'Double', label: 'Double Pockets'}, {id: 'None', label: 'No Pocket'}];
      default: return [{id: 'Option 1', label: 'Option 1'}, {id: 'Option 2', label: 'Option 2'}];
    }
  };

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
      className={cn("min-h-screen bg-[#F5F7FA] pb-[80px]", isRTL && "font-urdu")}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-[#F5F7FA]">
        <button onClick={() => navigate(-1)} type="button" className="p-2">
          {isRTL ? <ArrowRight className="h-6 w-6 text-[#0F172A]" /> : <ArrowLeft className="h-6 w-6 text-[#0F172A]" />}
        </button>
        <h1 className="text-[18px] font-bold text-[#0F172A]">Customize Order</h1>
        <div className="w-10"></div>
      </div>

      {preGeneratedToken && (
        <div className="flex items-center justify-center gap-2 px-2 pb-4 text-[#22C55E] text-xs font-bold">
          <Hash className="h-3 w-3" />
          Order: {preGeneratedToken}
        </div>
      )}

      {/* Product Image Area */}
      <div className="px-4 mb-6">
        <div className="w-full h-[320px] bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.07)] relative flex items-center justify-center overflow-hidden">
          {/* Garment Preview Placeholder */}
          <div className="absolute inset-0 bg-[#F1F5F9] flex flex-col items-center justify-center">
             <Scissors className="w-16 h-16 text-[#CBD5E1] mb-4" />
             <span className="text-[#94A3B8] font-medium">Garment Preview</span>
          </div>
          
          {/* Color Swatches */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
            {[ '#1E293B', '#22C55E', '#94A3B8', '#DC2626' ].map((color, i) => (
              <div key={i} className={`w-8 h-8 rounded-full shadow-md cursor-pointer border-2 ${i === 1 ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }}></div>
            ))}
          </div>
        </div>
      </div>

      {/* Price + View Button Row */}
      <div className="px-4 mb-6 flex justify-between items-center">
        <div className="text-[20px] font-bold text-[#22C55E]">
          {settings.currency} {orderData.price || '0.00'}
        </div>
        <button type="button" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="bg-[#22C55E] text-white px-6 py-2 rounded-full text-[14px] font-semibold shadow-[0_2px_12px_rgba(34, 197, 94,0.3)]">
          View Details
        </button>
      </div>

      {/* Garment Part Options Row */}
      <div className="px-4 mb-8">
        <div className="flex overflow-x-auto gap-4 hide-scrollbar pb-2">
           {[ 
             { label: 'Collar' },
             { label: 'Sleeves' },
             { label: 'Pocket' },
             { label: 'Placket' },
             { label: 'Half Pk' }
           ].map((part, i) => {
             const hasDesign = !!garmentDesigns[part.label];
             return (
             <div key={i} onClick={() => setActivePartModal(part.label)} className="flex flex-col items-center shrink-0 min-w-[72px] cursor-pointer">
               <div className={`w-[56px] h-[56px] rounded-[16px] flex items-center justify-center mb-2 transition-colors ${hasDesign ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-white text-[#64748B] shadow-[0_2px_12px_rgba(0,0,0,0.07)]'}`}>
                 <Tag className="w-6 h-6" />
               </div>
               <div className={`text-[12px] font-medium ${hasDesign ? 'text-[#22C55E]' : 'text-[#64748B]'}`}>{part.label}</div>
               {hasDesign && <div className="w-8 h-1 bg-[#22C55E] rounded-full mt-1.5"></div>}
             </div>
           )})}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 mb-10 space-y-3">
        <div className="flex gap-3">
          <label className="flex-1 bg-[#22C55E] text-white h-12 rounded-full font-semibold text-[14px] shadow-[0_2px_12px_rgba(34, 197, 94,0.3)] flex items-center justify-center gap-2 cursor-pointer">
             <Upload className="w-4 h-4"/> Upload Design
             <input type="file" accept="image/*" className="hidden" onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  setReferencePhoto(file);
                  toast.success('Design uploaded. Proceed to Details.');
                }
             }} />
          </label>
          <a href={customerData.phone ? `tel:${customerData.phone}` : '#'} className="flex-1 bg-white border-2 border-[#22C55E] text-[#22C55E] h-12 rounded-full font-semibold text-[14px] flex items-center justify-center gap-2">
            <Phone className="w-4 h-4"/> Call Customer
          </a>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="w-1/3 bg-transparent border border-[#E2E8F0] text-[#64748B] h-12 rounded-full font-semibold text-[14px]">
            Save Draft
          </button>
          <button onClick={handleSubmit} type="button" disabled={isSubmitting} className="w-2/3 bg-[#22C55E] text-white h-12 rounded-full font-bold text-[15px] shadow-[0_2px_12px_rgba(34, 197, 94,0.3)] flex items-center justify-center">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Order'}
          </button>
        </div>
      </div>

      <div className="text-center font-bold text-[#64748B] uppercase tracking-widest text-[10px] mb-2 px-4 flex items-center gap-2">
         <div className="h-px bg-[#E2E8F0] flex-1"></div>
         Order Details Form
         <div className="h-px bg-[#E2E8F0] flex-1"></div>
      </div>

      {/* Existing Full Form (Scroll Context) */}
      <div className="px-4 bg-white rounded-t-[32px] pt-8 pb-10 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] space-y-6">
          <TemplateSelector 
            templateHook={templateHook} 
            setOrderData={setOrderData} 
            setMeasurements={setMeasurements} 
            setGender={setGender}
          />
          
          <div className="space-y-4">
             <h3 className="section-title">Customer</h3>
             <div className="space-y-3 relative" ref={dropdownRef}>
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
                        setCustomerData({...customerData, name: e.target.value});
                      }
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search Customer or Name..."
                    className="bg-[#F1F5F9] border-none rounded-[12px] h-12"
                  />
                  <AnimatePresence>
                    {showDropdown && searchQuery && filteredCustomers.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-50 w-full mt-2 bg-white shadow-[0_8px_30px_rgba(34, 197, 94,0.12)] rounded-[16px] border border-[#F8FAFC] overflow-hidden max-h-60 overflow-y-auto"
                      >
                        {filteredCustomers.map(customer => (
                          <div 
                            key={customer.id}
                            onClick={() => handleSelectCustomer(customer)}
                            className="p-4 hover:bg-[#F5F7FA] cursor-pointer border-b border-[#F8FAFC] flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-[12px] bg-[#F5F7FA] flex items-center justify-center text-[#22C55E] font-bold">
                                {customer.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-[#0F172A]">{customer.name}</div>
                                <div className="text-xs text-[#64748B] flex items-center mt-0.5"><Phone className="h-3 w-3 mr-1" /> {customer.phone}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
             </div>
             <Input 
                value={customerData.phone} 
                onChange={e => setCustomerData({...customerData, phone: e.target.value})}
                placeholder="Phone Number"
                className="bg-[#F1F5F9] border-none rounded-[12px] h-12"
             />
          </div>

          <div className="space-y-4">
             <h3 className="section-title">Order Details</h3>
             <Input 
                value={orderData.dressType} 
                onChange={e => setOrderData({...orderData, dressType: e.target.value})}
                placeholder="Dress Type (e.g. Suit)"
                className="bg-[#F1F5F9] border-none rounded-[12px] h-12"
             />
             <Input 
                type="date"
                value={orderData.deliveryDate} 
                onChange={e => setOrderData({...orderData, deliveryDate: e.target.value})}
                className="bg-[#F1F5F9] border-none rounded-[12px] h-12"
             />
             <div className="flex gap-3">
               <Input 
                  type="number"
                  value={orderData.price} 
                  onChange={e => setOrderData({...orderData, price: e.target.value})}
                  placeholder="Total Price"
                  className="flex-1 bg-[#F1F5F9] border-none rounded-[12px] h-12"
               />
               <Input 
                  type="number"
                  value={orderData.advancePayment} 
                  onChange={e => setOrderData({...orderData, advancePayment: e.target.value})}
                  placeholder="Advance Pay"
                  className="flex-1 bg-[#F1F5F9] border-none rounded-[12px] h-12"
               />
             </div>
          </div>

          <div className="space-y-4">
            <h3 className="section-title">Measurements</h3>
            {getMeasurementCategoriesForDress(orderData.dressType).map((category, index) => (
              <div key={category.id} className="space-y-3">
                 <div className="font-bold text-[12px] text-[#64748B] uppercase tracking-widest">{category.titleEn}</div>
                 <div className="grid grid-cols-2 gap-3">
                   {category.items.map((item) => (
                     <div key={item.id}>
                        <label className="text-[10px] uppercase font-bold text-[#64748B]">{item.en}</label>
                        <Input 
                          type="number"
                          step="0.25"
                          value={measurements[item.id] || ''} 
                          onChange={e => setMeasurements({...measurements, [item.id]: e.target.value === '' ? '' : Number(e.target.value)})}
                          placeholder="0.00"
                          className="bg-[#F8FAFC] border-[#E2E8F0] rounded-[12px] h-[40px] text-[14px]"
                        />
                     </div>
                   ))}
                 </div>
              </div>
            ))}
          </div>
          
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-14 bg-[#22C55E] hover:bg-[#0D3D33] text-white rounded-[16px] font-bold text-[16px] shadow-[0_4px_16px_rgba(34, 197, 94,0.3)]">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Order'}
          </Button>

      </div>

      <AnimatePresence>
        {activePartModal && (
          <DesignModal 
            partName={activePartModal}
            options={getOptionsForPart(activePartModal)}
            selectedOption={garmentDesigns[activePartModal] || ''}
            onSelect={(id) => setGarmentDesigns({...garmentDesigns, [activePartModal]: id})}
            onClose={() => setActivePartModal(null)}
            onSave={() => setActivePartModal(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
