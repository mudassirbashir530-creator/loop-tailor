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
    <div className={cn("w-full max-w-6xl mx-auto space-y-6", isRTL && "font-urdu", loading && "opacity-70 pointer-events-none")} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-medium tracking-tight text-on-surface">
            {t('customers.title')}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage your clients and measurements</p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          className="hidden sm:flex rounded-full shadow-soft hover:shadow-soft-hover transition-all bg-primary text-white h-11 px-6 font-medium w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </motion.div>

      {/* Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            placeholder={t('customers.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-2xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none placeholder:text-on-surface-variant transition-all shadow-sm"
          />
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
            <div className="bg-surface rounded-3xl overflow-hidden shadow-md border border-outline-variant">
              <div className="p-5 sm:p-6 border-b border-outline-variant bg-surface-container-lowest">
                <h2 className="text-lg font-medium text-on-surface">{t('customers.newProfile')}</h2>
              </div>
              <div className="p-5 sm:p-6">
                <form onSubmit={handleAddCustomer} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{t('customers.fullName')}</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
                      <input 
                        required 
                        value={newCustomer.name} 
                        onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} 
                        placeholder="e.g. Muhammad Ahmed" 
                        className="w-full pl-12 h-12 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{t('customers.phone')}</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
                      <input 
                        required 
                        value={newCustomer.phone} 
                        onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} 
                        placeholder="e.g. 0300 1234567" 
                        className="w-full pl-12 h-12 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{t('customers.address')}</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
                      <input 
                        value={newCustomer.address} 
                        onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} 
                        placeholder="e.g. House #123, Street 4, Lahore" 
                        className="w-full pl-12 h-12 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{t('customers.notes')}</label>
                    <div className="relative">
                      <Notebook className="absolute left-4 top-4 h-5 w-5 text-on-surface-variant" />
                      <textarea 
                        value={newCustomer.notes} 
                        onChange={e => setNewCustomer({...newCustomer, notes: e.target.value})} 
                        placeholder="Specific preferences, fit styles, etc." 
                        className="w-full pl-12 pt-4 min-h-[120px] rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all resize-y"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button 
                      type="button" 
                      onClick={() => setIsAdding(false)}
                      className="flex-1 h-12 rounded-xl border border-outline-variant bg-surface text-on-surface font-medium hover:bg-surface-container transition-colors"
                    >
                      {t('customers.discard')}
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 h-12 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors shadow-soft"
                    >
                      {t('customers.save')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {['all', 'active', 'inactive'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab as any)}
              className={cn(
                "px-5 py-2.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap uppercase tracking-wider",
                filterTab === tab
                  ? "bg-primary text-white shadow-soft"
                  : "bg-surface text-on-surface border border-outline-variant hover:bg-surface-container hover:text-on-surface"
              )}
            >
              {tab === 'all' ? 'All Clients' : tab}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Client List */}
      <div>
        {loading ? (
          <div className="flex flex-col gap-4">
             {[1, 2, 3, 4, 5].map((i) => (
               <div key={i} className="h-20 bg-surface rounded-2xl border border-outline-variant animate-pulse"></div>
             ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {filteredCustomers.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-16 text-center bg-surface border border-outline-variant rounded-[2rem] flex flex-col items-center shadow-sm"
                >
                  <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-6">
                    <User className="h-8 w-8 text-on-surface-variant" />
                  </div>
                  <h3 className="text-xl font-medium text-on-surface">{t('customers.noCustomers')}</h3>
                  <p className="text-on-surface-variant text-sm mt-2 mb-8">{t('customers.trySearching')}</p>
                  <Button 
                    onClick={() => setIsAdding(true)}
                    className="rounded-full shadow-soft hover:shadow-soft-hover transition-all bg-primary text-white h-12 px-8 font-medium"
                  >
                    <Plus className="w-5 h-5 mr-no-rtl ml-auto-rtl mr-2" />
                    {t('customers.addCustomer')}
                  </Button>
                </motion.div>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <motion.div
                    key={customer.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <div 
                      className="bg-surface rounded-2xl border border-outline-variant hover:border-primary hover:shadow-md transition-all cursor-pointer shadow-sm p-4 sm:p-5 flex items-center justify-between group"
                      onClick={() => navigate(`/dashboard/customers/${customer.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface font-display font-medium text-lg sm:text-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <h3 className="text-base sm:text-lg font-medium text-on-surface line-clamp-1">
                            {customer.name}
                          </h3>
                          <div className="flex items-center text-sm text-on-surface-variant mt-0.5">
                            <Phone className="h-4 w-4 mr-1.5" />
                            {customer.phone}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                         {ordersPerCustomer[customer.id]?.total > 0 && (
                            <div className="bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap">
                              {ordersPerCustomer[customer.id].total} Order{ordersPerCustomer[customer.id].total !== 1 ? 's' : ''}
                            </div>
                         )}
                         {ordersPerCustomer[customer.id]?.active > 0 && (
                            <div className="bg-secondary/10 text-secondary px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap uppercase tracking-wider">
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

      {/* FAB Button */}
      {!isAdding && (
         <button 
           className="fixed bottom-[88px] right-4 lg:hidden z-50 w-14 h-14 bg-primary text-white rounded-full shadow-fab flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
           onClick={() => setIsAdding(true)}
         >
           <Plus className="w-6 h-6" />
         </button>
      )}
    </div>
  );
}
