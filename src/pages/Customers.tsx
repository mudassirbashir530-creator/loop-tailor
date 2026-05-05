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
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8"
      >
        <div>
          <h1 className="text-[28px] md:text-[32px] font-display font-semibold tracking-tight text-on-surface">{t('customers.title')}</h1>
          <p className="text-on-surface-variant text-sm sm:text-base mt-2">{t('customers.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
          <div className="relative w-full sm:w-80 group">
            <input
              type="text"
              placeholder={t('customers.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn("w-full h-12 rounded-full bg-surface-container-highest border border-outline-variant text-on-surface focus:outline-none focus:border-primary transition-all placeholder:text-on-surface-variant", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
            />
            <div className={cn("absolute top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors", isRTL ? "right-4" : "left-4")}>
              <Search className="h-5 w-5" />
            </div>
          </div>
          <Button 
            onClick={() => setIsAdding(!isAdding)} 
            className="bg-primary hover:bg-on-surface text-on-primary rounded-full h-12 px-6 font-medium shadow-none w-full sm:w-auto"
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
            <div className="bg-surface border border-outline-variant rounded-3xl shadow-sm overflow-hidden mb-8">
              <div className="p-6 border-b border-outline-variant bg-surface-container-lowest">
                <h2 className="text-[18px] font-semibold text-on-surface">{t('customers.newProfile')}</h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleAddCustomer} className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className={cn("text-[13px] font-medium text-on-surface-variant uppercase tracking-wide", isRTL ? "mr-1" : "ml-1")}>{t('customers.fullName')}</label>
                    <div className="relative group">
                      <User className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant group-focus-within:text-primary transition-colors", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        required 
                        value={newCustomer.name} 
                        onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} 
                        placeholder="e.g. Muhammad Ahmed" 
                        className={cn("h-12 w-full rounded-2xl bg-surface-container-highest border border-outline-variant focus:border-primary px-4 shadow-none", isRTL ? "pr-12" : "pl-12")}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-[13px] font-medium text-on-surface-variant uppercase tracking-wide", isRTL ? "mr-1" : "ml-1")}>{t('customers.phone')}</label>
                    <div className="relative group">
                      <Phone className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant group-focus-within:text-primary transition-colors", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        required 
                        value={newCustomer.phone} 
                        onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} 
                        placeholder="e.g. 0300 1234567" 
                        className={cn("h-12 w-full rounded-2xl bg-surface-container-highest border border-outline-variant focus:border-primary px-4 shadow-none", isRTL ? "pr-12" : "pl-12")}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className={cn("text-[13px] font-medium text-on-surface-variant uppercase tracking-wide", isRTL ? "mr-1" : "ml-1")}>{t('customers.address')}</label>
                    <div className="relative group">
                      <MapPin className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant group-focus-within:text-primary transition-colors", isRTL ? "right-4" : "left-4")} />
                      <Input 
                        value={newCustomer.address} 
                        onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} 
                        placeholder="e.g. House #123, Street 4, Lahore" 
                        className={cn("h-12 w-full rounded-2xl bg-surface-container-highest border border-outline-variant focus:border-primary px-4 shadow-none", isRTL ? "pr-12" : "pl-12")}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className={cn("text-[13px] font-medium text-on-surface-variant uppercase tracking-wide", isRTL ? "mr-1" : "ml-1")}>{t('customers.notes')}</label>
                    <div className="relative group">
                      <Notebook className={cn("absolute top-4 h-5 w-5 text-on-surface-variant group-focus-within:text-primary transition-colors", isRTL ? "right-4" : "left-4")} />
                      <textarea 
                        value={newCustomer.notes} 
                        onChange={e => setNewCustomer({...newCustomer, notes: e.target.value})} 
                        placeholder="Specific preferences, fit styles, etc." 
                        className={cn("w-full rounded-2xl bg-surface-container-highest border border-outline-variant focus:border-primary focus:ring-0 p-4 min-h-[120px] resize-none", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setIsAdding(false)}
                      className="rounded-full h-12 px-8 font-medium text-on-surface hover:bg-surface-variant hover:text-on-surface"
                    >
                      {t('customers.discard')}
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-primary hover:bg-on-surface text-on-primary rounded-full h-12 px-10 font-medium shadow-sm w-auto"
                    >
                      {t('customers.save')}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex bg-surface-container-highest rounded-full p-1.5 border border-outline-variant w-fit mb-8 shadow-sm">
        <button
          onClick={() => setFilterTab('all')}
          className={cn(
            "px-6 py-2 rounded-full text-[14px] font-medium transition-all whitespace-nowrap",
            filterTab === 'all' 
              ? "bg-secondary-container text-on-secondary-container shadow-sm" 
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          All Clients
        </button>
        <button
          onClick={() => setFilterTab('active')}
          className={cn(
            "px-6 py-2 rounded-full text-[14px] font-medium transition-all whitespace-nowrap",
            filterTab === 'active' 
              ? "bg-secondary-container text-on-secondary-container shadow-sm" 
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          Active
        </button>
        <button
          onClick={() => setFilterTab('inactive')}
          className={cn(
            "px-6 py-2 rounded-full text-[14px] font-medium transition-all whitespace-nowrap",
            filterTab === 'inactive' 
              ? "bg-secondary-container text-on-secondary-container shadow-sm" 
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          Inactive
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
             {[1, 2, 3, 4, 5, 6].map((i) => (
               <div key={i} className="h-32 bg-[#F5F7FA] rounded-[20px] animate-pulse"></div>
             ))}
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredCustomers.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full py-16 px-4 text-center bg-white rounded-[24px] shadow-[0_2px_12px_rgba(34, 197, 94,0.04)] border border-[#F8FAFC] flex flex-col items-center space-y-6"
              >
                <div className="w-64 max-w-full opaciy-80">
                  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="200" cy="120" r="40" fill="#F5F7FA" stroke="#F8FAFC" strokeWidth="8"/>
                    <path d="M120 250C120 205.817 155.817 170 200 170C244.183 170 280 205.817 280 250" fill="#F5F7FA" stroke="#F8FAFC" strokeWidth="8"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A]">{t('customers.noCustomers')}</h3>
                  <p className="text-[#64748B] font-medium mt-1">{t('customers.trySearching')}</p>
                </div>
                <Button 
                  onClick={() => setIsAdding(true)}
                  className="btn-primary mt-4"
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
                  <div 
                    className="bg-surface rounded-3xl p-5 flex items-center justify-between border border-outline-variant shadow-sm hover:bg-surface-variant hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => navigate(`/dashboard/customers/${customer.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold text-xl">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[16px] font-semibold text-on-surface line-clamp-1">
                            {customer.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center text-on-surface-variant text-[13px] font-medium">
                            <Phone className="h-3.5 w-3.5 mr-1.5" />
                            {customer.phone}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       {ordersPerCustomer[customer.id]?.total > 0 && (
                          <div className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap">
                            {ordersPerCustomer[customer.id].total} {ordersPerCustomer[customer.id].total === 1 ? 'order' : 'orders'}
                          </div>
                       )}
                       {ordersPerCustomer[customer.id]?.active > 0 && (
                          <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap">
                            Active
                          </div>
                        )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
