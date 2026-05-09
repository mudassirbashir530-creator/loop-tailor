import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Scissors, Ruler, DollarSign, Loader2, Search, Plus, 
  CheckCircle2, Camera, UserSquare2, ChevronRight, X 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useCustomers } from '../hooks/useCustomers';
import { useWorkers } from '../hooks/useWorkers';
import { useOrders } from '../hooks/useOrders';
import { formatCurrency, generateTokenId } from '../lib/utils';
import { OrderStatus } from '../lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { getMeasurementCategoriesForDress } from '../lib/measurements';
import { useAuth } from '../contexts/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { toast } from 'sonner';

export const CLOTHING_CATEGORIES = [
  { group: 'Men', options: ['Shalwar Kameez', 'Kurta', 'Waistcoat', 'Pant', 'Shirt', 'Coat', 'Blazer', 'Sherwani', 'Prince Coat', 'Safari Suit'] },
  { group: 'Women', options: ['Suit', 'Kurti', 'Lehenga', 'Maxi', 'Gown', 'Abaya', 'Blouse', 'Trouser'] },
  { group: 'Kids', options: ['Kids Kurta', 'Kids Suit', 'School Uniform'] },
  { group: 'Other', options: ['Alteration', 'Custom Design', 'Repair', 'Other'] }
];

export default function NewOrder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { customers, loading: loadingCustomers, addCustomer } = useCustomers();
  const { workers, loading: loadingWorkers } = useWorkers();
  const { addOrder } = useOrders();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

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
  
  // Images
  const [referencePhoto, setReferencePhoto] = useState<File | null>(null);
  const [bodyPhoto, setBodyPhoto] = useState<File | null>(null);

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
        name: newCustomer.name,
        phone: newCustomer.phone,
        whatsappPhone: newCustomer.whatsappPhone,
        address: newCustomer.address,
        countryCode: newCustomer.countryCode,
        gender: newCustomer.gender,
        notes: newCustomer.notes
      });
      if (custId) {
        setSelectedCustomer({ id: custId, ...newCustomer });
        setIsCreatingCustomer(false);
        setCustomerSearch('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, path: string) => {
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer first.');
      return;
    }
    if (!deliveryDate || price <= 0) {
      toast.error('Please fill delivery date and valid price.');
      return;
    }
    
    setLoading(true);
    try {
      let referencePhotoUrl = '';
      let sampleDesignUrl = ''; // using bodyPhoto as sampleDesignUrl or reference body
      
      const actualClothingType = clothingType === 'Custom Design' ? customClothingType : clothingType;
      
      // Auto-generate order ID if possible, but let useOrders handle DB doc
      const orderRefId = `ORDER_${Date.now()}`; 
      
      if (referencePhoto) {
        referencePhotoUrl = await uploadImage(referencePhoto, `orders/${user?.uid}/${orderRefId}/reference_${referencePhoto.name}`);
      }
      if (bodyPhoto) {
        sampleDesignUrl = await uploadImage(bodyPhoto, `orders/${user?.uid}/${orderRefId}/body_${bodyPhoto.name}`);
      }

      const assignedWorker = workers.find(w => w.id === workerId);
      
      const orderData = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        workerId: workerId || undefined,
        workerName: assignedWorker?.name || undefined,
        status: 'pending' as OrderStatus,
        clothingType: actualClothingType,
        designNotes: designNotes,
        measurements: measurements,
        price: price,
        advancePayment: advance,
        remainingPayment: Math.max(0, price - advance),
        deliveryDate: deliveryDate,
        referencePhotoUrl,
        sampleDesignUrl,
        // if notes needed
      };

      const docId = await addOrder(orderData);
      
      if (docId) {
         navigate('/app/orders');
      }
    } catch (error) {
       console.error("Order submit failed:", error);
       toast.error("Failed to create order");
    } finally {
      setLoading(false);
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
                             {selectedCustomer.name.charAt(0).toUpperCase()}
                           </div>
                           <div>
                             <p className="font-semibold">{selectedCustomer.name}</p>
                             <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                           </div>
                         </div>
                         <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>Change</Button>
                       </div>
                    )}
                    
                    {!selectedCustomer && (
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
                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute z-50 w-full mt-2 bg-popover text-popover-foreground shadow-xl rounded-xl border overflow-hidden">
                              <div className="max-h-60 overflow-y-auto p-1">
                                {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
                                  <div key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerDropdown(false); setCustomerSearch(''); }} className="p-3 hover:bg-accent cursor-pointer rounded-lg flex flex-col transition-colors">
                                    <span className="font-medium">{c.name}</span>
                                    <span className="text-xs text-muted-foreground">{c.phone}</span>
                                  </div>
                                )) : (
                                  <div className="p-4 text-center text-muted-foreground text-sm">No exact matches found.</div>
                                )}
                              </div>
                              <div className="p-2 border-t bg-muted/30">
                                <Button variant="ghost" className="w-full text-primary justify-start gap-2" onClick={() => { setIsCreatingCustomer(true); setShowCustomerDropdown(false); setNewCustomer(prev => ({...prev, name: customerSearch})); }}>
                                  <Plus className="w-4 h-4" /> Create "{customerSearch || 'New Customer'}"
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
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
                  <label className="text-sm font-medium">Clothing Type</label>
                  <select 
                    value={clothingType}
                    onChange={(e) => {
                      setClothingType(e.target.value);
                      if (e.target.value !== 'Custom Design') setCustomClothingType('');
                    }}
                    className="w-full h-12 rounded-xl border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                     {CLOTHING_CATEGORIES.map(cat => (
                        <optgroup key={cat.group} label={cat.group}>
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
                                   className="h-11 rounded-lg bg-surface-container-lowest focus-visible:ring-primary/20 transition-all font-medium text-base shadow-sm group-hover:border-primary/50" 
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                   <div className="space-y-3">
                     <label className="text-sm font-medium flex items-center gap-2"><Camera className="w-4 h-4"/> Reference Design</label>
                     <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors border-muted-foreground/30 hover:border-primary/50 relative overflow-hidden group">
                        {referencePhoto ? (
                           <>
                             <div className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><span className="text-sm font-medium">Change Image</span></div>
                             <img src={URL.createObjectURL(referencePhoto)} className="absolute inset-0 w-full h-full object-cover" alt="ref" />
                           </>
                        ) : (
                           <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                             <Upload className="w-8 h-8 mb-2 opacity-50" />
                             <p className="text-sm font-medium">Upload Design Image</p>
                           </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files && setReferencePhoto(e.target.files[0])} />
                     </label>
                   </div>
                   
                   <div className="space-y-3">
                     <label className="text-sm font-medium flex items-center gap-2"><UserSquare2 className="w-4 h-4"/> Body Reference</label>
                     <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors border-muted-foreground/30 hover:border-primary/50 relative overflow-hidden group">
                        {bodyPhoto ? (
                           <>
                             <div className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><span className="text-sm font-medium">Change Image</span></div>
                             <img src={URL.createObjectURL(bodyPhoto)} className="absolute inset-0 w-full h-full object-cover" alt="body" />
                           </>
                        ) : (
                           <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                             <Upload className="w-8 h-8 mb-2 opacity-50" />
                             <p className="text-sm font-medium">Upload Body Image</p>
                           </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files && setBodyPhoto(e.target.files[0])} />
                     </label>
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
