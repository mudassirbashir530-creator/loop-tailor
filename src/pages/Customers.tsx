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
    <div className={cn("page", loading && "opacity-70 pointer-events-none")}>
      {/* Top Bar */}
      <div className="bg-white border-b border-[#E2DDD6] px-4 py-4 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-xl font-bold text-[#0D3D33]">{t('customers.title')}</h1>
      </div>

      {/* Search Bar */}
      <div className="px-4 mt-5 mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#555555]" />
          <input
            type="text"
            placeholder={t('customers.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-[48px] pl-11 pr-4 rounded-full border border-[#E2DDD6] bg-white text-[#111111] text-sm focus:border-[#0D3D33] focus:outline-none placeholder:text-[#888888] shadow-sm"
          />
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 overflow-hidden mb-4"
          >
            <div className="card !p-0 overflow-hidden shadow-md">
              <div className="p-4 border-b border-[#E2DDD6] bg-[#F7F5F0]">
                <h2 className="text-[16px] font-bold text-[#111111]">{t('customers.newProfile')}</h2>
              </div>
              <div className="p-4">
                <form onSubmit={handleAddCustomer} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-bold text-[#555555] uppercase tracking-wide">{t('customers.fullName')}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#888888]" />
                      <input 
                        required 
                        value={newCustomer.name} 
                        onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} 
                        placeholder="e.g. Muhammad Ahmed" 
                        className="pl-10 h-12 !border-[#E2DDD6]"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-bold text-[#555555] uppercase tracking-wide">{t('customers.phone')}</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#888888]" />
                      <input 
                        required 
                        value={newCustomer.phone} 
                        onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} 
                        placeholder="e.g. 0300 1234567" 
                        className="pl-10 h-12 !border-[#E2DDD6]"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-bold text-[#555555] uppercase tracking-wide">{t('customers.address')}</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#888888]" />
                      <input 
                        value={newCustomer.address} 
                        onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} 
                        placeholder="e.g. House #123, Street 4, Lahore" 
                        className="pl-10 h-12 !border-[#E2DDD6]"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-bold text-[#555555] uppercase tracking-wide">{t('customers.notes')}</label>
                    <div className="relative">
                      <Notebook className="absolute left-3 top-4 h-5 w-5 text-[#888888]" />
                      <textarea 
                        value={newCustomer.notes} 
                        onChange={e => setNewCustomer({...newCustomer, notes: e.target.value})} 
                        placeholder="Specific preferences, fit styles, etc." 
                        className="pl-10 !border-[#E2DDD6] min-h-[100px] py-4"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsAdding(false)}
                      className="btn-outline flex-1"
                    >
                      {t('customers.discard')}
                    </button>
                    <button 
                      type="submit"
                      className="btn-primary flex-1"
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
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {['all', 'active', 'inactive'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab as any)}
              className={cn(
                "px-5 py-2 rounded-full text-[13px] font-bold transition-all whitespace-nowrap border capitalize",
                filterTab === tab
                  ? "bg-[#0D3D33] text-white border-[#0D3D33]"
                  : "bg-white text-[#555555] border-[#E2DDD6] hover:bg-[#F7F5F0]"
              )}
            >
              {tab === 'all' ? 'All Clients' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Client List */}
      <div className="px-4">
        {loading ? (
          <div className="flex flex-col gap-3">
             {[1, 2, 3, 4, 5].map((i) => (
               <div key={i} className="h-20 bg-white rounded-xl border border-[#E2DDD6] animate-pulse"></div>
             ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {filteredCustomers.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card text-center !py-12 !border-[#E2DDD6] flex flex-col items-center shadow-sm"
                >
                  <div className="w-16 h-16 rounded-full bg-[#F7F5F0] flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-[#555555]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#111111]">{t('customers.noCustomers')}</h3>
                  <p className="text-[#555555] text-sm mt-1 mb-6">{t('customers.trySearching')}</p>
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="btn-primary"
                  >
                    <Plus className="h-5 w-5 mr-no-rtl ml-auto-rtl mr-2" />
                    {t('customers.addCustomer')}
                  </button>
                </motion.div>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <motion.div
                    key={customer.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div 
                      className="card !m-0 flex items-center justify-between !border-[#E2DDD6] hover:border-[#0D3D33] transition-all cursor-pointer !p-4 shadow-sm"
                      onClick={() => navigate(`/dashboard/customers/${customer.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-[#F7F5F0] flex items-center justify-center text-[#111111] font-bold text-lg border border-[#E2DDD6]">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <h3 className="text-[15px] font-bold text-[#111111] line-clamp-1">
                            {customer.name}
                          </h3>
                          <div className="flex items-center text-[#555555] text-[13px] mt-0.5">
                            <Phone className="h-3.5 w-3.5 mr-1" />
                            {customer.phone}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                         {ordersPerCustomer[customer.id]?.total > 0 && (
                            <div className="bg-[#F7F5F0] text-[#555555] border border-[#E2DDD6] px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap">
                              {ordersPerCustomer[customer.id].total} Order{ordersPerCustomer[customer.id].total !== 1 ? 's' : ''}
                            </div>
                         )}
                         {ordersPerCustomer[customer.id]?.active > 0 && (
                            <div className="bg-[#2ECC71]/10 text-[#2ECC71] px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap uppercase tracking-wider">
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
           className="fab-btn fixed bottom-[80px] right-4 z-50 text-white"
           onClick={() => setIsAdding(true)}
         >
           <Plus className="w-6 h-6" />
         </button>
      )}
    </div>
  );
}
