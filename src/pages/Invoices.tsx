import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, Loader2, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export default function Invoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchInvoices();
  }, [user]);

  const fetchInvoices = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'shops', user.uid, 'orders'));
      const snap = await getDocs(q);
      const data = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(order => order.status === 'Delivered'); // Assuming delivered orders have invoices
      setInvoices(data.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'invoices');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-slate-900">Invoices</h1>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="h-12 w-12 text-brand-primary animate-spin" />
        </div>
      ) : (
        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium">No invoices found.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{invoice.customerName}</div>
                        <div className="text-xs text-slate-500 font-medium">{invoice.dressType} • {invoice.createdAt ? format(new Date(invoice.createdAt.seconds * 1000), 'MMM dd, yyyy') : 'N/A'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-brand-primary">PKR {invoice.price}</div>
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
