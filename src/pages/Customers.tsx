import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Plus, User, Phone, MapPin, Notebook, ArrowRight, Loader2, UserPlus, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function Customers() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', notes: '' });

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const q = query(collection(db, 'shops', user.uid, 'customers'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setCustomers(data.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'customers');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCustomer.name || !newCustomer.phone) return;

    try {
      await addDoc(collection(db, 'shops', user.uid, 'customers'), {
        shopId: user.uid,
        ...newCustomer,
        createdAt: serverTimestamp()
      });
      setIsAdding(false);
      setNewCustomer({ name: '', phone: '', address: '', notes: '' });
      toast.success(t('customers.customerAdded') || 'Customer added successfully');
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
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-slate-900">{t('customers.title')}</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2 font-medium">{t('customers.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
          <div className="relative w-full sm:w-80 group">
            <input
              type="text"
              placeholder={t('customers.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn("w-full h-14 rounded-2xl bg-gray-100 shadow-neu-pressed-sm border-none text-base font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
            />
            <div className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors", isRTL ? "right-4" : "left-4")}>
              <Search className="h-5 w-5" />
            </div>
          </div>
          <Button 
            onClick={() => setIsAdding(!isAdding)} 
            className={cn(
              "w-full sm:w-auto h-14 rounded-2xl transition-all hover:scale-105 active:scale-95 px-8 font-black text-base border-none",
              isAdding ? "bg-gray-100 shadow-neu-pressed-sm text-slate-600" : "bg-gray-100 shadow-neu-sm text-brand-primary hover:shadow-neu-pressed-sm"
            )}
          >
            {isAdding ? <X className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} /> : <UserPlus className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />}
            {isAdding ? t('customers.cancel') : t('customers.addCustomer')}
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
            <Card className="border-none shadow-neu bg-gray-100 rounded-[2.5rem] overflow-hidden mb-8">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-black text-brand-primary">{t('customers.newProfile')}</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <form onSubmit={handleAddCustomer} className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className={cn("text-xs font-black text-slate-500 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customers.fullName')}</label>
                    <div className="relative group">
                      <User className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-primary transition-colors", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        required 
                        value={newCustomer.name} 
                        onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} 
                        placeholder="e.g. Muhammad Ahmed" 
                        className={cn("h-14 rounded-2xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 text-base font-bold text-slate-700 transition-all", isRTL ? "pr-12" : "pl-12")}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-xs font-black text-slate-500 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customers.phone')}</label>
                    <div className="relative group">
                      <Phone className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-primary transition-colors", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        required 
                        value={newCustomer.phone} 
                        onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} 
                        placeholder="e.g. 0300 1234567" 
                        className={cn("h-14 rounded-2xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 text-base font-bold text-slate-700 transition-all", isRTL ? "pr-12" : "pl-12")}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className={cn("text-xs font-black text-slate-500 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customers.address')}</label>
                    <div className="relative group">
                      <MapPin className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-primary transition-colors", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        value={newCustomer.address} 
                        onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} 
                        placeholder="e.g. House #123, Street 4, Lahore" 
                        className={cn("h-14 rounded-2xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 text-base font-bold text-slate-700 transition-all", isRTL ? "pr-12" : "pl-12")}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className={cn("text-xs font-black text-slate-500 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t('customers.notes')}</label>
                    <div className="relative group">
                      <Notebook className={cn("absolute top-4 h-5 w-5 text-slate-400 group-focus-within:text-brand-primary transition-colors", isRTL ? "right-4" : "left-4")} />
                      <textarea 
                        value={newCustomer.notes} 
                        onChange={e => setNewCustomer({...newCustomer, notes: e.target.value})} 
                        placeholder="Specific preferences, fit styles, etc." 
                        className={cn("w-full min-h-[120px] py-4 rounded-2xl bg-gray-100 shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-brand-primary/20 text-base font-bold text-slate-700 transition-all focus:outline-none", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setIsAdding(false)}
                      className="h-14 px-8 rounded-2xl font-bold text-slate-500 hover:text-slate-700 hover:bg-transparent"
                    >
                      {t('customers.discard')}
                    </Button>
                    <Button 
                      type="submit"
                      className="h-14 px-10 rounded-2xl bg-gray-100 shadow-neu-sm text-brand-primary hover:shadow-neu-pressed-sm font-black text-base transition-all hover:scale-105 active:scale-95 border-none"
                    >
                      {t('customers.save')}
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredCustomers.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full p-16 text-center bg-gray-100 shadow-neu-pressed-sm rounded-[2.5rem] flex flex-col items-center space-y-4"
              >
                <div className="h-16 w-16 bg-gray-100 shadow-neu-sm rounded-2xl flex items-center justify-center text-slate-400">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{t('customers.noCustomers')}</h3>
                  <p className="text-slate-500 font-medium">{t('customers.trySearching')}</p>
                </div>
                <Button 
                  onClick={() => setIsAdding(true)}
                  variant="outline"
                  className="rounded-xl font-bold bg-gray-100 shadow-neu-sm border-none text-brand-primary hover:shadow-neu-pressed-sm mt-4"
                >
                  {t('customers.addCustomer')}
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
                    className="border-none shadow-neu bg-gray-100 rounded-[2.5rem] overflow-hidden hover:-translate-y-1 transition-all group cursor-pointer"
                    onClick={() => navigate(`/dashboard/customers/${customer.id}`)}
                  >
                    <CardContent className="p-7 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-gray-100 shadow-neu-pressed-sm flex items-center justify-center text-brand-primary font-black text-2xl group-hover:shadow-neu-sm transition-all duration-300">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-black text-slate-900 group-hover:text-brand-primary transition-colors line-clamp-1">
                            {customer.name}
                          </h3>
                          <div className="flex items-center text-slate-500 font-bold text-sm">
                            <Phone className="h-3.5 w-3.5 mr-1.5 text-brand-primary" />
                            {customer.phone}
                          </div>
                        </div>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-gray-100 shadow-neu-sm flex items-center justify-center text-brand-primary group-hover:shadow-neu-pressed-sm transition-all">
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
