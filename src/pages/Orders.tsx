import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Search, Loader2, Filter, Package, MapPin, Calendar, CheckCircle2, Clock, Hash, Scissors, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'shops', user.uid, 'orders'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'shops', user!.uid, 'orders', orderId), { 
        status: newStatus, 
        updatedAt: serverTimestamp() 
      });
      fetchOrders();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-slate-100 text-slate-700';
      case 'Stitching': return 'bg-blue-100 text-blue-700';
      case 'Ready': return 'bg-amber-100 text-amber-700';
      case 'Delivered': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filter === 'All' || order.status === filter;
    const matchesSearch = 
      (order.tokenId && order.tokenId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.dressType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-slate-900">Order Tracking</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2 font-medium">Manage and track your customer orders in real-time.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
          <div className="relative w-full sm:w-80 group">
            <input
              type="text"
              placeholder="Search Token ID, Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-100 bg-white text-base font-bold focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all shadow-sm"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors">
              <Search className="h-5 w-5" />
            </div>
          </div>
          <Button 
            onClick={() => navigate('/dashboard/orders/new')} 
            className="w-full sm:w-auto h-14 rounded-2xl bg-brand-primary hover:bg-brand-primary/90 shadow-lg shadow-brand-primary/20 px-8 font-black text-base transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Order
          </Button>
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-3">
        {['All', 'Pending', 'Stitching', 'Ready', 'Delivered'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
            className={cn(
              "rounded-xl px-6 h-10 font-bold transition-all",
              filter === status 
                ? "bg-slate-900 text-white shadow-md scale-105" 
                : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            {status}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="h-12 w-12 text-brand-primary animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading orders...</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredOrders.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full p-16 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center space-y-4"
              >
                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                  <Package className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">No orders found</h3>
                  <p className="text-slate-400 font-medium">
                    {filter === 'All' ? 'Start by creating your first order.' : `No ${filter.toLowerCase()} orders found.`}
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/dashboard/orders/new')}
                  variant="outline"
                  className="rounded-xl font-bold border-slate-200"
                >
                  Create New Order
                </Button>
              </motion.div>
            ) : (
              filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden hover:shadow-xl transition-all group border-2 border-transparent hover:border-brand-primary/10">
                    <CardHeader className="p-7 pb-4 flex flex-row items-start justify-between space-y-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="bg-brand-primary/10 text-brand-primary p-1.5 rounded-lg">
                            <Hash className="h-3 w-3" />
                          </div>
                          <span className="text-xl font-black text-slate-900">{order.tokenId || '---'}</span>
                        </div>
                        <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-brand-primary transition-colors line-clamp-1">
                          {order.customerName}
                        </CardTitle>
                      </div>
                      <span className={cn(
                        "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm",
                        getStatusColor(order.status)
                      )}>
                        {order.status}
                      </span>
                    </CardHeader>
                    <CardContent className="p-7 pt-0 space-y-6">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Scissors className="h-3 w-3" /> Dress Type
                          </span>
                          <p className="font-bold text-slate-700">{order.dressType}</p>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Rack
                          </span>
                          <p className="font-bold text-slate-700">{order.rackLocation || '---'}</p>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-50 flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Delivery
                          </span>
                          <span className="text-sm font-black text-slate-900">
                            {format(new Date(order.deliveryDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.status !== 'Delivered' ? (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => updateStatus(order.id, 'Delivered')}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-black text-xs rounded-xl h-10 px-4"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1.5" />
                              Deliver
                            </Button>
                          ) : (
                            <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4" />
                              Done
                            </div>
                          )}
                          <Button 
                            size="icon" 
                            variant="outline" 
                            onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                            className="rounded-xl h-10 w-10 border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
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
