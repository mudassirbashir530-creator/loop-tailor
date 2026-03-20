import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Plus, User, Phone, MapPin, Notebook, ArrowRight, Loader2, UserPlus, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Customers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', notes: '' });

  useEffect(() => {
    if (!user) return;
    fetchCustomers();
  }, [user]);

  const fetchCustomers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'customers'), where('shopId', '==', user.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setCustomers(data.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'customers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCustomer.name || !newCustomer.phone) return;

    try {
      await addDoc(collection(db, 'customers'), {
        shopId: user.uid,
        ...newCustomer,
        createdAt: serverTimestamp()
      });
      setIsAdding(false);
      setNewCustomer({ name: '', phone: '', address: '', notes: '' });
      fetchCustomers();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'customers');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.phone.includes(searchTerm) || 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-slate-900">Customer Directory</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2 font-medium">Manage your client profiles and measurement history.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
          <div className="relative w-full sm:w-80 group">
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-100 bg-white text-base font-bold focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all shadow-sm"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors">
              <Search className="h-5 w-5" />
            </div>
          </div>
          <Button 
            onClick={() => setIsAdding(!isAdding)} 
            className={cn(
              "w-full sm:w-auto h-14 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 px-8 font-black text-base",
              isAdding ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-brand-primary text-white hover:bg-brand-primary/90 shadow-brand-primary/20"
            )}
          >
            {isAdding ? <X className="h-5 w-5 mr-2" /> : <UserPlus className="h-5 w-5 mr-2" />}
            {isAdding ? 'Cancel' : 'Add Customer'}
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden border-2 border-brand-primary/10">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-black text-slate-900">New Client Profile</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <form onSubmit={handleAddCustomer} className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name *</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                      <Input 
                        required 
                        value={newCustomer.name} 
                        onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} 
                        placeholder="e.g. Muhammad Ahmed" 
                        className="h-14 pl-12 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary text-base font-bold transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number *</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                      <Input 
                        required 
                        value={newCustomer.phone} 
                        onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} 
                        placeholder="e.g. 0300 1234567" 
                        className="h-14 pl-12 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary text-base font-bold transition-all"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Residential Address</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                      <Input 
                        value={newCustomer.address} 
                        onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} 
                        placeholder="e.g. House #123, Street 4, Lahore" 
                        className="h-14 pl-12 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary text-base font-bold transition-all"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Additional Notes</label>
                    <div className="relative group">
                      <Notebook className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                      <textarea 
                        value={newCustomer.notes} 
                        onChange={e => setNewCustomer({...newCustomer, notes: e.target.value})} 
                        placeholder="Specific preferences, fit styles, etc." 
                        className="w-full min-h-[120px] pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary text-base font-bold transition-all focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setIsAdding(false)}
                      className="h-14 px-8 rounded-2xl font-bold text-slate-500 hover:bg-slate-50"
                    >
                      Discard
                    </Button>
                    <Button 
                      type="submit"
                      className="h-14 px-10 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-black text-base shadow-lg transition-all hover:scale-105 active:scale-95"
                    >
                      Save Profile
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="h-12 w-12 text-brand-primary animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing directory...</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredCustomers.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full p-16 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center space-y-4"
              >
                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">No customers found</h3>
                  <p className="text-slate-400 font-medium">Try searching with a different name or phone number.</p>
                </div>
                <Button 
                  onClick={() => setIsAdding(true)}
                  variant="outline"
                  className="rounded-xl font-bold border-slate-200"
                >
                  Add New Customer
                </Button>
              </motion.div>
            ) : (
              filteredCustomers.map((customer, index) => (
                <motion.div
                  key={customer.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden hover:shadow-xl transition-all group border-2 border-transparent hover:border-brand-primary/10 cursor-pointer"
                    onClick={() => navigate(`/dashboard/customers/${customer.id}`)}
                  >
                    <CardContent className="p-7 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-brand-primary/5 flex items-center justify-center text-brand-primary font-black text-2xl group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 shadow-inner">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-black text-slate-900 group-hover:text-brand-primary transition-colors line-clamp-1">
                            {customer.name}
                          </h3>
                          <div className="flex items-center text-slate-500 font-bold text-sm">
                            <Phone className="h-3 w-3 mr-1.5 text-slate-400" />
                            {customer.phone}
                          </div>
                        </div>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
