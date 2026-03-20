import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType, generateTokenId } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Save, Hash, MapPin, Ruler, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function QuickOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Customer Data
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });

  // Order Data
  const [orderData, setOrderData] = useState({
    dressType: 'Shalwar Kameez',
    deliveryDate: '',
    price: '',
    advancePayment: '',
    quantity: '1',
    rackLocation: '',
    notes: ''
  });

  // Measurements
  const [measurements, setMeasurements] = useState({
    length: '',
    chest: '',
    waist: '',
    hip: '',
    shoulder: '',
    sleeve: '',
    neck: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // 1. Generate Token ID
      const tokenId = await generateTokenId(user.uid);

      // 2. Check for existing customer by phone
      let customerId = '';
      if (customerData.phone) {
        const q = query(
          collection(db, 'customers'), 
          where('shopId', '==', user.uid), 
          where('phone', '==', customerData.phone),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          customerId = snap.docs[0].id;
          // Update existing customer name/address if changed
          await updateDoc(doc(db, 'customers', customerId), {
            name: customerData.name,
            address: customerData.address,
            updatedAt: serverTimestamp()
          });
        }
      }

      if (!customerId) {
        // Create new customer
        const customerRef = await addDoc(collection(db, 'customers'), {
          ...customerData,
          shopId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        customerId = customerRef.id;
      }

      // 3. Create Order
      await addDoc(collection(db, 'orders'), {
        shopId: user.uid,
        tokenId,
        customerId,
        customerName: customerData.name,
        phone: customerData.phone,
        dressType: orderData.dressType,
        deliveryDate: new Date(orderData.deliveryDate).toISOString(),
        status: 'Pending',
        price: Number(orderData.price),
        advancePayment: Number(orderData.advancePayment || 0),
        quantity: Number(orderData.quantity),
        rackLocation: orderData.rackLocation,
        notes: orderData.notes,
        measurements: Object.fromEntries(
          Object.entries(measurements).map(([k, v]) => [k, Number(v) || 0])
        ),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 4. Navigate to orders list
      navigate(`/dashboard/orders`);
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
      className="max-w-5xl mx-auto space-y-8 pb-12"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-slate-900">New Order</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Customer & Basic Order Info */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Name *</label>
                  <Input 
                    required 
                    value={customerData.name} 
                    onChange={e => setCustomerData({...customerData, name: e.target.value})}
                    placeholder="Enter customer name"
                    className="rounded-xl border-slate-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all h-12 text-base font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                  <Input 
                    value={customerData.phone} 
                    onChange={e => setCustomerData({...customerData, phone: e.target.value})}
                    placeholder="Enter phone number"
                    className="rounded-xl border-slate-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all h-12 text-base font-medium"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
                  <Input 
                    value={customerData.address} 
                    onChange={e => setCustomerData({...customerData, address: e.target.value})}
                    placeholder="Enter address"
                    className="rounded-xl border-slate-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all h-12 text-base font-medium"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="h-2 w-2 bg-brand-primary rounded-full"></span>
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dress Type *</label>
                    <Input 
                      required 
                      value={orderData.dressType} 
                      onChange={e => setOrderData({...orderData, dressType: e.target.value})}
                      placeholder="e.g. Shalwar Kameez"
                      className="rounded-xl border-slate-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all h-12 text-base font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivery Date *</label>
                    <Input 
                      type="date" 
                      required 
                      value={orderData.deliveryDate} 
                      onChange={e => setOrderData({...orderData, deliveryDate: e.target.value})}
                      className="rounded-xl border-slate-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all h-12 text-base font-medium"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity *</label>
                    <Input 
                      type="number" 
                      required 
                      value={orderData.quantity} 
                      onChange={e => setOrderData({...orderData, quantity: e.target.value})}
                      className="rounded-xl border-slate-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all h-12 text-base font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Price *</label>
                    <Input 
                      type="number" 
                      required 
                      value={orderData.price} 
                      onChange={e => setOrderData({...orderData, price: e.target.value})}
                      placeholder="0.00"
                      className="rounded-xl border-slate-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all h-12 text-base font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Advance</label>
                    <Input 
                      type="number" 
                      value={orderData.advancePayment} 
                      onChange={e => setOrderData({...orderData, advancePayment: e.target.value})}
                      placeholder="0.00"
                      className="rounded-xl border-slate-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all h-12 text-base font-medium"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Rack Location
                    </label>
                    <Input 
                      value={orderData.rackLocation} 
                      onChange={e => setOrderData({...orderData, rackLocation: e.target.value})}
                      placeholder="e.g. A1, Shelf 3"
                      className="rounded-xl border-slate-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all h-12 text-base font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</label>
                    <Input 
                      value={orderData.notes} 
                      onChange={e => setOrderData({...orderData, notes: e.target.value})}
                      placeholder="Any special instructions?"
                      className="rounded-xl border-slate-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all h-12 text-base font-medium"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Measurements */}
          <div className="space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-brand-primary" />
                  Measurements (Inches)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-2 gap-4">
                {Object.keys(measurements).map((key) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                    <Input 
                      type="number" 
                      step="0.1"
                      value={(measurements as any)[key]} 
                      onChange={e => setMeasurements({...measurements, [key]: e.target.value})}
                      placeholder="0.0"
                      className="rounded-xl border-slate-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all h-10 text-sm font-medium"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="rounded-2xl h-14 text-lg font-bold bg-brand-primary hover:bg-brand-primary/90 shadow-lg shadow-brand-primary/20 w-full transition-all active:scale-95 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Save Order
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => navigate(-1)}
                className="rounded-2xl h-12 w-full font-bold text-slate-500 hover:text-slate-900"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
