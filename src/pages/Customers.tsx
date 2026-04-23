import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, getDocs, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Plus, User, Phone, MapPin, Notebook, ArrowRight, Loader2, UserPlus, X, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { ORDER_STATUS } from '../lib/config';

export default function Customers() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [ordersPerCustomer, setOrdersPerCustomer] = useState<Record<string, { active: number, total: number }>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', notes: '' });

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    let customersData: any[] = [];
    
    const unsubscribeCustomers = onSnapshot(collection(db, 'shops', user.uid, 'customers'), (snap) => {
      customersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setCustomers(customersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'customers');
      setLoading(false);
    });

    const unsubscribeOrders = onSnapshot(collection(db, 'shops', user.uid, 'orders'), (snap) => {
      const counts: Record<string, { active: number, total: number }> = {};
      snap.forEach(doc => {
        const order = doc.data();
        if (order.customerId) {
          if (!counts[order.customerId]) counts[order.customerId] = { active: 0, total: 0 };
          counts[order.customerId].total += 1;
          if ([ORDER_STATUS.PENDING, ORDER_STATUS.STITCHING, ORDER_STATUS.READY].includes(order.status)) {
            counts[order.customerId].active += 1;
          }
        }
      });
      setOrdersPerCustomer(counts);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });

    return () => {
      unsubscribeCustomers();
      unsubscribeOrders();
    };
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

  const filteredCustomers = useMemo(() => {
    return customers
      .filter(c => {
        const matchesSearch = c.phone.includes(searchTerm) || c.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        
        const activeCount = ordersPerCustomer[c.id]?.active || 0;
        if (filterTab === 'active' && activeCount === 0) return false;
        if (filterTab === 'inactive' && activeCount > 0) return false;
        
        return true;
      })
      .sort((a, b) => {
        const aActive = ordersPerCustomer[a.id]?.active || 0;
        const bActive = ordersPerCustomer[b.id]?.active || 0;
        
        if (aActive > 0 && bActive === 0) return -1;
        if (bActive > 0 && aActive === 0) return 1;
        
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [customers, searchTerm, filterTab, ordersPerCustomer]);

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

      <div className="flex bg-gray-100 shadow-neu-inner p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setFilterTab('all')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
            filterTab === 'all' 
              ? "bg-white shadow-neu-sm text-brand-primary" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          All Clients
        </button>
        <button
          onClick={() => setFilterTab('active')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
            filterTab === 'active' 
              ? "bg-white shadow-neu-sm text-brand-primary" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Active
        </button>
        <button
          onClick={() => setFilterTab('inactive')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
            filterTab === 'inactive' 
              ? "bg-white shadow-neu-sm text-brand-primary" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Inactive
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
             {[1, 2, 3, 4, 5, 6].map((i) => (
               <div key={i} className="h-32 bg-gray-100 shadow-neu-sm rounded-[2.5rem] animate-pulse"></div>
             ))}
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-8">Accessing directory...</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredCustomers.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full py-16 px-4 text-center bg-gray-100 shadow-neu-pressed-sm rounded-[3rem] flex flex-col items-center space-y-6"
              >
                <div className="w-64 max-w-full opaciy-80">
                  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="200" cy="120" r="40" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="8"/>
                    <path d="M120 250C120 205.817 155.817 170 200 170C244.183 170 280 205.817 280 250" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="8"/>
                    <circle cx="200" cy="150" r="100" stroke="#004643" strokeWidth="12" strokeDasharray="20 20" opacity="0.1"/>
                    <path d="M260 100V140M240 120H280" stroke="#004643" strokeWidth="12" strokeLinecap="round" opacity="0.2"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{t('customers.noCustomers')}</h3>
                  <p className="text-slate-500 font-medium mt-2">{t('customers.trySearching')}</p>
                </div>
                <Button 
                  onClick={() => setIsAdding(true)}
                  className="rounded-xl h-14 px-8 font-bold bg-brand-primary shadow-lg text-white mt-4"
                >
                  <Plus className="h-5 w-5 mr-no-rtl ml-auto-rtl mr-2" />
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
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-slate-900 group-hover:text-brand-primary transition-colors line-clamp-1">
                              {customer.name}
                            </h3>
                            {ordersPerCustomer[customer.id]?.active > 0 && (
                              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center text-slate-500 font-bold text-sm">
                              <Phone className="h-3.5 w-3.5 mr-1 text-brand-primary" />
                              {customer.phone}
                            </div>
                            {ordersPerCustomer[customer.id]?.total > 0 && (
                              <div className="bg-brand-primary/10 text-brand-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {ordersPerCustomer[customer.id].total} {ordersPerCustomer[customer.id].total === 1 ? 'order' : 'orders'}
                              </div>
                            )}
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
