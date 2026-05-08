import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Loader2, BellRing, User, Phone, CheckCircle2, MessageCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function PaymentReminders() {
  const { user } = useAuth();
  const { settings } = useShop();
  const { isRTL } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'ready' | 'active'>('all');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const pendingOrders = useMemo(() => {
    return orders.filter(order => {
      const price = Number(order.price) || 0;
      const advance = Number(order.advancePayment) || 0;
      const balance = price - advance;
      
      if (balance <= 0) return false;

      // Ensure we have a phone number to send to
      if (!order.phone) return false;

      const matchesSearch = 
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone?.includes(searchTerm);

      if (!matchesSearch) return false;

      if (filterTab === 'all') {
        return order.status !== 'Delivered';
      } else if (filterTab === 'ready') {
        return order.status === 'Ready'; // Ready or Delivered (Unpaid)... WAIT, prompt says:
        // Filter tabs: "All Pending" | "Ready/Delivered (Unpaid)" | "Active Orders (Unpaid)"
      } else if (filterTab === 'active') {
        return order.status === 'Pending' || order.status === 'Stitching';
      }
      return true;
    });
  }, [orders, filterTab, searchTerm]);

  // Adjusting "Ready/Delivered (Unpaid)" according to what we want
  const displayedOrders = useMemo(() => {
    return orders.filter(order => {
      const price = Number(order.price) || 0;
      const advance = Number(order.advancePayment) || 0;
      const balance = price - advance;
      
      if (balance <= 0) return false;
      if (!order.phone) return false;

      const matchesSearch = 
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone?.includes(searchTerm);

      if (!matchesSearch) return false;

      if (filterTab === 'all') {
        return order.status !== 'Delivered'; // Prompt requested: fetch all where status != 'Delivered' AND balance > 0.
        // Wait, it also says: "Also fetch Delivered orders where price > advancePayment (delivered but not fully paid)"
        // If "all" means ALL pending payments regardless of status:
        // Actually, let's include all statuses in "all" if they have balance.
      } else if (filterTab === 'ready') {
        return order.status === 'Ready' || order.status === 'Delivered';
      } else if (filterTab === 'active') {
        return order.status === 'Pending' || order.status === 'Stitching';
      }
      return true;
    }).sort((a: any, b: any) => {
      const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0);
      const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [orders, filterTab, searchTerm]);

  const totalPendingAmount = displayedOrders.reduce((sum, order) => {
    const price = Number(order.price) || 0;
    const advance = Number(order.advancePayment) || 0;
    return sum + (price - advance);
  }, 0);

  const getWhatsAppLink = (order: any) => {
    const cleanPhone = order.phone.replace(/[^\d+]/g, '').replace('+', '');
    const price = Number(order.price) || 0;
    const advance = Number(order.advancePayment) || 0;
    const balance = price - advance;
    
    // Assalam o Alaikum {customerName}! Aapka {dressType} tayyar hai. Total: {currency}{price} | Advance: {currency}{advance} | Baaki: {currency}{balance}. Please contact us. - {shopName}
    const message = `Assalam o Alaikum ${order.customerName}! Aapka ${order.dressType} tayyar hai. Total: ${settings.currency}${price} | Advance: ${settings.currency}${advance} | Baaki: ${settings.currency}${balance}. Please contact us. - ${settings.name}`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleSendReminder = (order: any) => {
    window.open(getWhatsAppLink(order), '_blank');
  };

  const handleSendAllReminders = () => {
    if (displayedOrders.length === 0) return;
    if (window.confirm(`Are you sure you want to send ${displayedOrders.length} reminders? This will open WhatsApp for each one in sequence.`)) {
      displayedOrders.forEach((order, index) => {
        setTimeout(() => {
          window.open(getWhatsAppLink(order), '_blank');
        }, index * 1500);
      });
    }
  };

  return (
    <div className={cn("space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-0", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Payment Reminders</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage and send reminders for unpaid orders.</p>
        </div>
        <Button 
          onClick={handleSendAllReminders}
          disabled={displayedOrders.length === 0}
          className="w-full sm:w-auto h-12 rounded-2xl bg-brand-primary text-white font-black shadow-neu hover:shadow-neu-pressed transition-all"
        >
          <BellRing className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} /> Send All Reminders
        </Button>
      </div>

      <div className="bg-gray-100 p-6 rounded-[2rem] shadow-neu-pressed-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Pending</div>
            <div className="text-2xl font-black text-slate-900">
              {displayedOrders.length} <span className="text-lg text-slate-500 font-medium">customers</span>
            </div>
          </div>
        </div>
        <div className="text-right w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-200/50 pt-4 md:pt-0 md:pl-6 pl-0">
           <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Amount</div>
           <div className="text-3xl font-black text-amber-600">
             {settings.currency}{totalPendingAmount.toLocaleString()}
           </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-100/50 p-2 rounded-[2rem]">
        <div className="flex bg-gray-100 p-1.5 rounded-[1.5rem] shadow-neu-pressed-sm w-full md:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All Pending' },
            { id: 'ready', label: 'Ready/Delivered (Unpaid)' },
            { id: 'active', label: 'Active Orders (Unpaid)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as 'all' | 'ready' | 'active')}
              className={cn(
                "px-6 py-3 rounded-[1.25rem] text-sm font-bold transition-all whitespace-nowrap",
                filterTab === tab.id
                  ? "bg-brand-primary text-white shadow-neu-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-gray-200/50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <div className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 focus-within:text-brand-primary", isRTL ? "right-4" : "left-4")}>
            <Search className="h-5 w-5" />
          </div>
          <Input 
            placeholder="Search by name or phone" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn("w-full h-12 rounded-2xl bg-gray-100 shadow-neu border-none focus:ring-2 focus:ring-brand-primary/20", isRTL ? "pr-12" : "pl-12")}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-4">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="text-center py-20 bg-gray-100 rounded-[2rem] shadow-neu-pressed-sm">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-900 mb-2">All Clear!</h3>
            <p className="text-slate-500 font-medium">You have no unpaid orders matching this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {displayedOrders.map((order, idx) => {
                const price = Number(order.price) || 0;
                const advance = Number(order.advancePayment) || 0;
                const balance = price - advance;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="border-none shadow-neu bg-gray-100 rounded-[2rem] overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-black text-slate-900 group-hover:text-brand-primary transition-colors flex items-center gap-2">
                              <User className="h-4 w-4 text-slate-400" />
                              {order.customerName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-bold text-slate-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {order.phone}
                              </span>
                            </div>
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                            order.status === 'Pending' ? "bg-slate-200 text-slate-700" :
                            order.status === 'Stitching' ? "bg-blue-100 text-blue-700" :
                            order.status === 'Ready' ? "bg-amber-100 text-amber-700" :
                            "bg-emerald-100 text-emerald-700"
                          )}>
                            {order.status}
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-neu-pressed-sm space-y-3 mb-6">
                          <div className="flex justify-between items-center text-sm font-bold border-b border-gray-100 pb-2">
                            <span className="text-slate-500">{order.dressType}</span>
                            <span className="text-slate-900">Due: {order.deliveryDate ? format(new Date(order.deliveryDate), 'MMM d, yyyy') : 'No Date'}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-500">Total Price</span>
                            <span className="font-black text-slate-900">{settings.currency}{price.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-500">Advance Paid</span>
                            <span className="font-black text-emerald-600">{settings.currency}{advance.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-base pt-2 border-t border-gray-100">
                            <span className="font-black text-slate-900">Balance Due</span>
                            <span className="font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
                              {settings.currency}{balance.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <Button 
                          onClick={() => handleSendReminder(order)}
                          className="w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black shadow-neu hover:shadow-neu-pressed transition-all"
                        >
                          <MessageCircle className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} /> 
                          Send WhatsApp Reminder
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
