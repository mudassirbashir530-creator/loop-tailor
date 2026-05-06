import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, getDocs, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, Loader2, Search, Filter, Calendar, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isSameDay, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';

export default function Invoices() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const q = query(collection(db, 'shops', user.uid, 'orders'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setInvoices(data.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      }));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'invoices');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = 
        invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.tokenId && invoice.tokenId.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;
      
      let matchesDate = true;
      if (dateFilter) {
        const invoiceDate = invoice.createdAt?.seconds 
          ? new Date(invoice.createdAt.seconds * 1000) 
          : new Date(invoice.createdAt);
        matchesDate = isSameDay(invoiceDate, parseISO(dateFilter));
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [invoices, searchTerm, statusFilter, dateFilter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-slate-900">{t('invoices.title')}</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2 font-medium">Manage and view all your shop invoices.</p>
        </div>
      </div>

      <Card className="border-none shadow-neu bg-gray-100 rounded-[2rem] overflow-hidden">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative group">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors", isRTL ? "right-4" : "left-4")} />
              <input 
                type="text"
                placeholder={t('customers.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn("w-full h-12 rounded-2xl border-none bg-gray-100 shadow-neu-pressed-sm text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
              />
            </div>

            <div className="relative group">
              <Filter className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors", isRTL ? "right-4" : "left-4")} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={cn("w-full h-12 rounded-2xl border-none bg-gray-100 shadow-neu-pressed-sm text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all appearance-none", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
              >
                <option value="All">{t('invoices.allStatuses')}</option>
                <option value="Pending">{t('orders.pending')}</option>
                <option value="Stitching">{t('orders.stitching')}</option>
                <option value="Ready">{t('orders.ready')}</option>
                <option value="Delivered">{t('orders.delivered')}</option>
              </select>
            </div>

            <div className="relative group">
              <Calendar className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors", isRTL ? "right-4" : "left-4")} />
              <input 
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={cn("w-full h-12 rounded-2xl border-none bg-gray-100 shadow-neu-pressed-sm text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="h-12 w-12 text-brand-primary animate-spin" />
        </div>
      ) : (
        <Card className="border-none shadow-neu bg-gray-100 rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-0">
            {filteredInvoices.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center space-y-4">
                <div className="h-20 w-20 bg-gray-100 shadow-neu-pressed-sm rounded-3xl flex items-center justify-center text-slate-400">
                  <Package className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{t('invoices.emptyStateTitle')}</h3>
                  <p className="text-slate-500 font-medium max-w-xs mx-auto mt-2">{t('invoices.emptyStateDesc')}</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200/50">
                {filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="p-6 flex items-center justify-between hover:bg-gray-200/20 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-gray-100 shadow-neu-sm flex items-center justify-center text-brand-primary group-hover:shadow-neu-pressed-sm transition-all duration-300">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-brand-primary transition-colors">{invoice.customerName}</div>
                        <div className="text-xs text-slate-500 font-medium">
                          {invoice.dressType} • {invoice.createdAt ? format(invoice.createdAt.seconds ? new Date(invoice.createdAt.seconds * 1000) : new Date(invoice.createdAt), 'MMM dd, yyyy') : t('invoices.na')}
                        </div>
                      </div>
                    </div>
                    <div className={cn("text-right", isRTL ? "text-left" : "text-right")}>
                      <Link to={`/app/orders/${invoice.id}/invoice`}>
                        <Button variant="outline" size="sm" className="rounded-xl font-bold border-slate-200 hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all">
                          {t('invoices.viewInvoice')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
