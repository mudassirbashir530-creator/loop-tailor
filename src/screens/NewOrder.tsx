import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Scissors, Ruler, DollarSign, Loader2, Search, Plus, 
  CheckCircle2, Camera, UserSquare2, ChevronRight, X, Check, Upload 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useCustomers } from '../hooks/useCustomers';
import { useWorkers } from '../hooks/useWorkers';
import { useOrders } from '../hooks/useOrders';
import { formatCurrency, generateTokenId } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { getMeasurementCategoriesForDress } from '../lib/measurements';

export const CLOTHING_CATEGORIES = [
  { group: 'Men', options: ['Shalwar Kameez', 'Kurta', 'Waistcoat', 'Pant', 'Shirt', 'Coat', 'Blazer', 'Sherwani', 'Prince Coat', 'Safari Suit'] },
  { group: 'Women', options: ['Suit', 'Kurti', 'Lehenga', 'Maxi', 'Gown', 'Abaya', 'Blouse', 'Trouser'] },
  { group: 'Kids', options: ['Kids Kurta', 'Kids Suit', 'School Uniform'] },
  { group: 'Other', options: ['Alteration', 'Custom Design', 'Repair', 'Other'] }
];

import { uploadToCloudinary } from '../lib/cloudinary';
import { CloudinaryImage, OrderStatus } from '../lib/types';
import { motion, AnimatePresence } from 'framer-motion';

function ImagePreview({ file, onRemove, progress }: { file: File, onRemove: () => void, progress?: number }) {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="relative aspect-square rounded-lg overflow-hidden border">
      {url && <img src={url} className="w-full h-full object-cover" alt="preview" />}
      <button 
        onClick={onRemove}
        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm hover:scale-110 transition-transform"
      >
        <X className="w-3 h-3" />
      </button>
      {progress !== undefined && progress < 100 && (
        <div className="absolute inset-x-0 bottom-0 bg-black/60 h-1">
          <div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

export default function NewOrder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { customers, loading: loadingCustomers, addCustomer } = useCustomers();
  const { workers, loading: loadingWorkers } = useWorkers();
  const { addOrder } = useOrders();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Customer State
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', whatsappPhone: '', address: '', countryCode: '+92', gender: 'male', notes: '' });
  
  // Order State
  const [clothingType, setClothingType] = useState('Shalwar Kameez');
  const [customClothingType, setCustomClothingType] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [designNotes, setDesignNotes] = useState('');
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [measurementNotes, setMeasurementNotes] = useState('');
  
  // Images (Multiple support)
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [designImages, setDesignImages] = useState<File[]>([]);

  // Payment State
  const [price, setPrice] = useState(0);
  const [advance, setAdvance] = useState(0);
  const [deliveryDate, setDeliveryDate] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch) ||
    (c.id && c.id.includes(customerSearch))
  );

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error('Name and Phone are required.');
      return;
    }
    setLoading(true);
    try {
      const custId = await addCustomer({
        name: newCustomer.name || '',
        phone: newCustomer.phone || '',
        whatsappPhone: newCustomer.whatsappPhone || '',
        address: newCustomer.address || '',
        countryCode: newCustomer.countryCode || '+92',
        gender: newCustomer.gender || 'male',
        notes: newCustomer.notes || ''
      });
      if (custId) {
        setSelectedCustomer({ 
          id: custId, 
          name: newCustomer.name || '',
          phone: newCustomer.phone || '',
          whatsappPhone: newCustomer.whatsappPhone || '',
          address: newCustomer.address || '',
          countryCode: newCustomer.countryCode || '+92',
          gender: newCustomer.gender || 'male',
          notes: newCustomer.notes || ''
        });
        setIsCreatingCustomer(false);
        setCustomerSearch('');
        toast.success("Customer created and selected");
      }
    } catch (e) {
      console.error("Create customer error:", e);
      toast.error("Failed to create customer");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer first.');
      return;
    }
    if (!deliveryDate) {
      toast.error('Please select a delivery date.');
      return;
    }
    if (price <= 0) {
      toast.error('Please enter a valid price.');
      return;
    }
    
    setLoading(true);
    try {
      const uploadedReferenceImages: CloudinaryImage[] = [];
      const uploadedDesignImages: CloudinaryImage[] = [];
      
      const actualClothingType = clothingType === 'Custom Design' ? (customClothingType || 'Custom Design') : clothingType;
      
      // Upload Reference Images
      for (let i = 0; i < referenceImages.length; i++) {
        const file = referenceImages[i];
        const progressId = `ref-${i}`;
        try {
          const img = await uploadToCloudinary(file, (p) => {
            setUploadProgress(prev => ({ ...prev, [progressId]: p }));
          });
          uploadedReferenceImages.push(img);
        } catch (e) {
          console.error("Cloudinary ref upload failed:", e);
          toast.error(`Failed to upload reference image ${i + 1}`);
        }
      }

      // Upload Design Images
      for (let i = 0; i < designImages.length; i++) {
        const file = designImages[i];
        const progressId = `design-${i}`;
        try {
          const img = await uploadToCloudinary(file, (p) => {
            setUploadProgress(prev => ({ ...prev, [progressId]: p }));
          });
          uploadedDesignImages.push(img);
        } catch (e) {
          console.error("Cloudinary design upload failed:", e);
          toast.error(`Failed to upload design image ${i + 1}`);
        }
      }

      const assignedWorker = workers && workerId ? workers.find(w => w.id === workerId) : null;
      
      const orderData: any = {
        customerId: selectedCustomer.id || '',
        customerName: selectedCustomer.name || '',
        customerPhone: selectedCustomer.phone || '',
        status: 'pending' as OrderStatus,
        clothingType: actualClothingType || '',
        designNotes: designNotes || '',
        measurements: measurements || {},
        price: Number(price) || 0,
        advancePayment: Number(advance) || 0,
        remainingPayment: Math.max(0, Number(price) - Number(advance)),
        deliveryDate: deliveryDate || '',
        referenceImages: uploadedReferenceImages,
        designImages: uploadedDesignImages,
        createdBy: user?.uid,
      };

      if (workerId) {
        orderData.workerId = workerId;
        orderData.workerName = assignedWorker?.name || '';
      }
      
      // Compatibility with old code/other parts if needed
      if (uploadedReferenceImages.length > 0) orderData.referencePhotoUrl = uploadedReferenceImages[0].url;
      if (uploadedDesignImages.length > 0) orderData.sampleDesignUrl = uploadedDesignImages[0].url;

      const docId = await addOrder(orderData);
      
      if (docId) {
         navigate('/app/orders', { replace: true });
      }
    } catch (error) {
       console.error("Order submit failed:", error);
       toast.error("An unexpected error occurred while creating the order");
    } finally {
      setLoading(false);
      setUploadProgress({});
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in slide-in-from-right-4 duration-300 pb-32 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 bg-card p-4 rounded-2xl shadow-sm border">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors" type="button">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Create New Order</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">Complete the steps to place a new tailoring order</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 relative">
         <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full -z-10"></div>
         <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full -z-10 transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
         {[
           { num: 1, label: 'Customer', icon: User },
           { num: 2, label: 'Measurements', icon: Ruler },
           { num: 3, label: 'Images & Notes', icon: Camera },
           { num: 4, label: 'Payment', icon: DollarSign }
         ].map(s => (
           <div key={s.num} className="flex flex-col items-center gap-2">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= s.num ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-muted text-muted-foreground border-2 border-background'}`}>
               {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
             </div>
             <span className={`text-xs font-medium hidden sm:block ${step >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
           </div>
         ))}
      </div>

      {/* STEP 1: Customer */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
           <Card className="shadow-sm border-primary/20">
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><User className="text-primary w-5 h-5"/> Select or Create Customer</CardTitle>
               <CardDescription>Search an existing customer or add a new one.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
                {!isCreatingCustomer ? (
                  <div className="space-y-4">
                    {selectedCustomer && (
                       <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold">
                             {(selectedCustomer.name || 'C').charAt(0).toUpperCase()}
                           </div>
                           <div>
                             <p className="font-semibold">{selectedCustomer.name || 'Unnamed Customer'}</p>
                             <p className="text-sm text-muted-foreground">{selectedCustomer.phone || 'No phone'}</p>
                           </div>
                         </div>
                         <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>Change</Button>
                       </div>
                    )}
                    
                    {!selectedCustomer && (
                      <div className="space-y-4">
                        <div className="relative" ref={dropdownRef}>
                          <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                            <Input 
                              value={customerSearch}
                              onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                              onFocus={() => setShowCustomerDropdown(true)}
                              placeholder="Search by Name, Phone or ID..."
                              className="pl-10 h-12 text-base rounded-xl"
                            />
                          </div>
                          <AnimatePresence>
                            {showCustomerDropdown && (
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, y: 5 }} 
                                className="absolute z-50 w-full mt-2 bg-popover text-popover-foreground shadow-2xl rounded-xl border border-border overflow-hidden"
                              >
                                <div className="max-h-60 overflow-y-auto p-1 py-2">
                                  {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
                                    <div 
                                      key={c.id} 
                                      onClick={() => { setSelectedCustomer(c); setShowCustomerDropdown(false); setCustomerSearch(''); }} 
                                      className="px-4 py-3 hover:bg-muted cursor-pointer rounded-lg flex flex-col transition-colors mx-1"
                                    >
                                      <span className="font-semibold text-foreground">{c.name}</span>
                                      <span className="text-xs text-muted-foreground">{c.phone}</span>
                                    </div>
                                  )) : (
                                    <div className="p-4 text-center text-muted-foreground text-sm">No exact matches found.</div>
                                  )}
                                </div>
                                <div className="p-2 border-t bg-muted/40">
                                  <Button 
                                    variant="ghost" 
                                    className="w-full text-primary justify-start gap-2 hover:bg-primary/10 transition-colors" 
                                    onClick={() => { setIsCreatingCustomer(true); setShowCustomerDropdown(false); setNewCustomer({ ...newCustomer, name: customerSearch }); }}
                                  >
                                    <Plus className="w-4 h-4 font-bold" /> 
                                    <span className="font-medium">Create "{customerSearch || 'New Customer'}"</span>
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-[1px] flex-1 bg-border" />
                          <span className="text-xs text-muted-foreground uppercase font-semibold">Or</span>
                          <div className="h-[1px] flex-1 bg-border" />
                        </div>
                        <Button variant="outline" className="w-full h-12 rounded-xl gap-2 border-dashed border-primary/50 text-primary hover:bg-primary/5" onClick={() => setIsCreatingCustomer(true)}>
                          <Plus className="w-5 h-5" /> Add New Customer
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                     <div className="flex items-center justify-between border-b pb-2 mb-4">
                        <h3 className="font-semibold text-lg">New Customer Details</h3>
                        <Button variant="ghost" size="icon" onClick={() => setIsCreatingCustomer(false)}><X className="w-4 h-4" /></Button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5"><label className="text-sm font-medium">Full Name *</label><Input value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} placeholder="John Doe" required /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium">Phone Number *</label><Input value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="0300 1234567" required /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium">WhatsApp Number</label><Input value={newCustomer.whatsappPhone} onChange={e => setNewCustomer({...newCustomer, whatsappPhone: e.target.value})} placeholder="Same as phone if empty" /></div>
                        <div className="space-y-1.5">
                           <label className="text-sm font-medium">Gender</label>
                           <select value={newCustomer.gender} onChange={e => setNewCustomer({...newCustomer, gender: e.target.value})} className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm">
                             <option value="male">Male</option>
                             <option value="female">Female</option>
                             <option value="other">Other</option>
                           </select>
                        </div>
                        <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-medium">Address</label><Input value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} placeholder="Full address" /></div>
                        <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-medium">Notes</label><Input value={newCustomer.notes} onChange={e => setNewCustomer({...newCustomer, notes: e.target.value})} placeholder="Preferences, special instructions..." /></div>
                     </div>
                     <div className="pt-2">
                        <Button onClick={handleCreateCustomer} disabled={loading} className="w-full sm:w-auto">
                          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Check className="w-4 h-4 mr-2" />} Save & Select Customer
                        </Button>
                     </div>
                  </div>
                )}
             </CardContent>
           </Card>
           
           <div className="flex justify-end">
              <Button onClick={nextStep} disabled={!selectedCustomer} className="gap-2 px-8">Continue <ChevronRight className="w-4 h-4" /></Button>
           </div>
        </motion.div>
      )}

      {/* STEP 2: Measurements */}
      {step === 2 && (
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
           <Card className="shadow-sm">
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><Scissors className="text-primary w-5 h-5"/> Clothing & Measurements</CardTitle>
               <CardDescription>Select the clothing type to dynamically load relevant measurement fields.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Clothing Type</label>
                  <select 
                    value={clothingType}
                    onChange={(e) => {
                      setClothingType(e.target.value);
                      if (e.target.value !== 'Custom Design') setCustomClothingType('');
                    }}
                    className="w-full h-12 rounded-xl border border-input bg-background px-4 text-sm focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all shadow-sm cursor-pointer"
                  >
                     {CLOTHING_CATEGORIES.map(cat => (
                        <optgroup key={cat.group} label={cat.group} className="font-bold">
                           {cat.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                           ))}
                        </optgroup>
                     ))}
                  </select>
                </div>
                
                {clothingType === 'Custom Design' && (
                  <div className="space-y-1.5 animate-in fade-in">
                    <label className="text-sm font-medium">Custom Name</label>
                    <Input value={customClothingType} onChange={e => setCustomClothingType(e.target.value)} placeholder="Enter custom garment name" className="h-12 rounded-xl" />
                  </div>
                )}
                
                <div className="pt-4 border-t space-y-6">
                  {getMeasurementCategoriesForDress(clothingType).length > 0 ? (
                    getMeasurementCategoriesForDress(clothingType).map((category, i) => (
                      <div key={i} className="space-y-4">
                         <h4 className="font-semibold text-sm text-primary uppercase tracking-wider bg-primary/5 self-start inline-block px-3 py-1 rounded-full">{category.titleEn}</h4>
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                           {category.items.map((item) => (
                             <div key={item.id} className="space-y-1">
                               <label className="text-xs font-medium text-muted-foreground uppercase">{item.en}</label>
                               <div className="relative group">
                                 <Input 
                                   type="number" step="0.25" placeholder="0.00"
                                   value={measurements[item.id] || ''}
                                   onChange={e => setMeasurements({...measurements, [item.id]: e.target.value})}
                                   className="h-11 rounded-lg bg-background font-semibold text-base shadow-sm focus:ring-primary h-12" 
                                 />
                                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none pointer-events-none">in</span>
                               </div>
                             </div>
                           ))}
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-6 bg-muted/30 rounded-xl border border-dashed">
                       <p className="text-muted-foreground text-sm">No specific measurements defined for this clothing type. You can add notes in the next step.</p>
                    </div>
                  )}
                </div>
             </CardContent>
           </Card>
           
           <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>Back</Button>
              <Button onClick={nextStep} className="gap-2 px-8">Continue <ChevronRight className="w-4 h-4" /></Button>
           </div>
         </motion.div>
      )}

      {/* STEP 3: Images & Notes */}
      {step === 3 && (
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
           <Card className="shadow-sm">
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><Camera className="text-primary w-5 h-5"/> Images & Notes</CardTitle>
               <CardDescription>Upload design inspiration and add specific tailoring instructions.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
                
                <div className="space-y-2">
                   <label className="text-sm font-medium">Design / Tailoring Notes</label>
                   <textarea
                     value={designNotes}
                     onChange={e => setDesignNotes(e.target.value)}
                     placeholder="Special instructions, styling details, pocket placements, collar styling, etc."
                     className="w-full min-h-[120px] rounded-xl border border-input bg-transparent p-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                   />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                   <div className="space-y-3">
                     <label className="text-sm font-medium flex items-center gap-2 text-primary">
                       <Camera className="w-4 h-4" /> Reference Designs (Max 3)
                     </label>
                     <div className="grid grid-cols-3 gap-2">
                       {referenceImages.map((file, idx) => (
                         <ImagePreview 
                           key={`ref-${idx}`} 
                           file={file} 
                           onRemove={() => setReferenceImages(prev => prev.filter((_, i) => i !== idx))}
                           progress={uploadProgress[`ref-${idx}`]}
                         />
                       ))}
                       {referenceImages.length < 3 && (
                         <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                           <Plus className="w-6 h-6 text-muted-foreground" />
                           <span className="text-[10px] text-muted-foreground mt-1">Add</span>
                           <input 
                             type="file" 
                             className="hidden" 
                             accept="image/*" 
                             onChange={e => e.target.files?.[0] && setReferenceImages(prev => [...prev, e.target.files![0]])} 
                           />
                         </label>
                       )}
                     </div>
                   </div>
                   
                   <div className="space-y-3">
                     <label className="text-sm font-medium flex items-center gap-2 text-primary">
                       <UserSquare2 className="w-4 h-4" /> Design Samples / Body Reference (Max 3)
                     </label>
                     <div className="grid grid-cols-3 gap-2">
                       {designImages.map((file, idx) => (
                         <ImagePreview 
                           key={`design-${idx}`} 
                           file={file} 
                           onRemove={() => setDesignImages(prev => prev.filter((_, i) => i !== idx))}
                           progress={uploadProgress[`design-${idx}`]}
                         />
                       ))}
                       {designImages.length < 3 && (
                         <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                           <Plus className="w-6 h-6 text-muted-foreground" />
                           <span className="text-[10px] text-muted-foreground mt-1">Add</span>
                           <input 
                             type="file" 
                             className="hidden" 
                             accept="image/*" 
                             onChange={e => e.target.files?.[0] && setDesignImages(prev => [...prev, e.target.files![0]])} 
                           />
                         </label>
                       )}
                     </div>
                   </div>
                </div>
                
             </CardContent>
           </Card>
           
           <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>Back</Button>
              <Button onClick={nextStep} className="gap-2 px-8">Continue <ChevronRight className="w-4 h-4" /></Button>
           </div>
         </motion.div>
      )}

      {/* STEP 4: Payment */}
      {step === 4 && (
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
           <Card className="shadow-sm">
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><DollarSign className="text-primary w-5 h-5"/> Payment & Delivery</CardTitle>
               <CardDescription>Finalize order price and expected completion date.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <div className="space-y-1.5">
                       <label className="text-sm font-medium text-muted-foreground">Total Price</label>
                       <div className="relative">
                         <div className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted-foreground select-none">PKR</div>
                         <Input type="number" min="0" value={price || ''} onChange={e => setPrice(Number(e.target.value))} className="pl-12 h-14 text-lg font-semibold rounded-xl" placeholder="0" />
                       </div>
                     </div>
                     <div className="space-y-1.5">
                       <label className="text-sm font-medium text-muted-foreground">Advance Received</label>
                       <div className="relative">
                         <div className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted-foreground select-none">PKR</div>
                         <Input type="number" min="0" max={price} value={advance || ''} onChange={e => setAdvance(Number(e.target.value))} className="pl-12 h-14 text-lg rounded-xl" placeholder="0" />
                       </div>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <div className="p-4 bg-muted/30 border rounded-xl flex flex-col justify-center h-[120px]">
                        <span className="text-sm font-medium text-muted-foreground mb-1">Remaining Balance</span>
                        <span className="text-3xl font-bold text-primary">{formatCurrency(Math.max(0, price - advance))}</span>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">Delivery Date *</label>
                        <Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} required className="h-12 rounded-xl" />
                     </div>
                     <div className="space-y-1.5">
                       <label className="text-sm font-medium text-muted-foreground">Assign Staff (Optional)</label>
                       <select value={workerId} onChange={e => setWorkerId(e.target.value)} className="w-full h-12 rounded-xl border border-input bg-transparent px-3 text-sm">
                         <option value="">Unassigned</option>
                         {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                       </select>
                     </div>
                   </div>
                </div>

             </CardContent>
           </Card>
           
           <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={prevStep} disabled={loading}>Back</Button>
              <Button onClick={handleSubmit} size="lg" disabled={loading} className="gap-2 px-8 w-full sm:w-auto text-base">
                 {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle2 className="w-5 h-5" />} 
                 Complete Order
              </Button>
           </div>
         </motion.div>
      )}

    </div>
  );
}
