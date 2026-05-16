import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useShop } from '../contexts/ShopContext';
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, serverTimestamp, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { format, startOfMonth, endOfMonth, subMonths, parse } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Wallet, Calendar, Download, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Users, DollarSign, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { useStaff, StaffMember } from '../hooks/useStaff';

export default function Payroll() {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const { settings } = useShop();
  const { staff } = useStaff();
  
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [payrollEntries, setPayrollEntries] = useState<any[]>([]);
  const [closedMonths, setClosedMonths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [view, setView] = useState<'current' | 'history'>('current');

  useEffect(() => {
    if (!user) return;

    const unsubPayroll = onSnapshot(query(collection(db, 'payroll'), where('userId', '==', user.uid)), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayrollEntries(data);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'payroll'));

    const unsubClosed = onSnapshot(query(collection(db, 'payroll_closed'), where('userId', '==', user.uid)), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, month: doc.data().month, ...doc.data() }) as any);
      setClosedMonths(data.sort((a: any, b: any) => b.month.localeCompare(a.month)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'payroll_closed'));

    return () => {
      unsubPayroll();
      unsubClosed();
    };
  }, [user]);

  const monthPayroll = payrollEntries.filter(p => p.month === selectedMonth);
  const isMonthClosed = closedMonths.some(m => m.month === selectedMonth);

  const calculateWorkerSummary = (member: StaffMember) => {
    const memberEntries = monthPayroll.filter(p => p.staffId === member.id);
    const earned = memberEntries.filter(p => p.type === 'Earning').reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);
    const paid = memberEntries.filter(p => p.type !== 'Earning' || p.paidStatus === 'paid').reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);
    
    const salaryBase = member.salaryType === 'fixed' ? member.salaryAmount : 0;
    const totalEarned = salaryBase + earned;
    const toPay = totalEarned - paid;
    const ordersCount = memberEntries.filter(p => p.type === 'Earning').length;

    return { earned: totalEarned, paid, toPay, ordersCount };
  };

  const totalSummary = staff.reduce((acc, member) => {
    const summary = calculateWorkerSummary(member);
    acc.totalEarned += summary.earned;
    acc.totalPaid += summary.paid;
    acc.totalToPay += Math.max(0, summary.toPay);
    acc.totalOrders += summary.ordersCount;
    return acc;
  }, { totalEarned: 0, totalPaid: 0, totalToPay: 0, totalOrders: 0 });

  const handleCloseMonth = async () => {
    if (!user) return;
    if (isMonthClosed) {
      toast.error('Month already closed');
      return;
    }

    const confirmText = `Are you sure you want to close payroll for ${format(parse(selectedMonth, 'yyyy-MM', new Date()), 'MMMM yyyy')}?\n\nTotal Workers: ${staff.length}\nTotal Earned: Rs ${totalSummary.totalEarned.toLocaleString()}\nAlready Paid: Rs ${totalSummary.totalPaid.toLocaleString()}\nRemaining to Pay: Rs ${totalSummary.totalToPay.toLocaleString()}`;
    
    if (!window.confirm(confirmText)) return;

    setIsClosing(true);
    try {
      const workersData = staff.map(member => ({
        id: member.id,
        name: member.name,
        ...calculateWorkerSummary(member)
      }));

      await addDoc(collection(db, 'payroll_closed'), {
        userId: user.uid,
        month: selectedMonth,
        totalWorkers: staff.length,
        totalEarned: totalSummary.totalEarned,
        alreadyPaid: totalSummary.totalPaid,
        remaining: totalSummary.totalToPay,
        totalOrders: totalSummary.totalOrders,
        workersData,
        closedAt: serverTimestamp()
      });

      toast.success(`${selectedMonth} payroll closed successfully`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'payroll_closed');
    } finally {
      setIsClosing(false);
    }
  };

  const changeMonth = (offset: number) => {
    const current = parse(selectedMonth, 'yyyy-MM', new Date());
    const next = offset > 0 ? subMonths(current, -1) : subMonths(current, 1);
    setSelectedMonth(format(next, 'yyyy-MM'));
  };

  return (
    <div className={cn("page pb-[100px]", isRTL && "font-urdu")} dir={isRTL ? "rtl" : "ltr"}>
      {/* Top Bar */}
      <div className="bg-white border-b border-[#E2DDD6] px-4 py-4 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-xl font-bold text-[#111111]">Staff Payroll</h1>
        <div className="flex bg-[#F7F5F0] rounded-lg p-1">
          <button 
            onClick={() => setView('current')}
            className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", view === 'current' ? "bg-white text-[#0D3D33] shadow-sm" : "text-[#555555]")}
          >
            Management
          </button>
          <button 
            onClick={() => setView('history')}
            className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", view === 'history' ? "bg-white text-[#0D3D33] shadow-sm" : "text-[#555555]")}
          >
            History
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {view === 'current' ? (
          <>
            {/* Month Selector */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#E2DDD6] shadow-sm">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-[#F7F5F0] rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-[#0D3D33]" />
              </button>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#2ECC71]" />
                <span className="text-[16px] font-bold text-[#111111]">{format(parse(selectedMonth, 'yyyy-MM', new Date()), 'MMMM yyyy')}</span>
              </div>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-[#F7F5F0] rounded-full transition-colors">
                <ChevronRight className="w-5 h-5 text-[#0D3D33]" />
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-[#0D3D33] p-4 rounded-2xl border border-[#0D3D33] shadow-md text-white">
                 <div className="text-[10px] uppercase font-bold tracking-widest text-[#2ECC71] mb-1">Total Payroll</div>
                 <div className="text-[20px] font-bold">Rs {totalSummary.totalEarned.toLocaleString()}</div>
               </div>
               <div className="bg-white p-4 rounded-2xl border border-[#E2DDD6] shadow-sm">
                 <div className="text-[10px] uppercase font-bold tracking-widest text-[#888888] mb-1">Remaining to Pay</div>
                 <div className="text-[20px] font-bold text-red-600">Rs {totalSummary.totalToPay.toLocaleString()}</div>
               </div>
            </div>

            {/* Workers Table */}
            <div className="bg-white rounded-2xl border border-[#E2DDD6] shadow-sm overflow-hidden">
               <div className="p-4 border-b border-[#E2DDD6] bg-[#F7F5F0] flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[#555555]">
                  <div className="flex-1">Worker Name</div>
                  <div className="w-12 text-center">Orders</div>
                  <div className="w-20 text-right">Earned</div>
                  <div className="w-20 text-right">To Pay</div>
               </div>
               <div className="divide-y divide-[#E2DDD6]">
                 {staff.map(member => {
                   const summary = calculateWorkerSummary(member);
                   return (
                     <div key={member.id} className="p-4 flex justify-between items-center text-[13px]">
                        <div className="flex-1 font-bold text-[#111111]">{member.name}</div>
                        <div className="w-12 text-center font-bold text-[#555555]">{summary.ordersCount}</div>
                        <div className="w-20 text-right font-bold text-[#111111]">{summary.earned.toLocaleString()}</div>
                        <div className={cn("w-20 text-right font-bold", summary.toPay > 0 ? "text-red-500" : "text-[#2ECC71]")}>
                          {summary.toPay.toLocaleString()}
                        </div>
                     </div>
                   );
                 })}
               </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              {isMonthClosed ? (
                <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3 text-green-700 font-bold justify-center">
                  <CheckCircle2 className="w-5 h-5" /> Month Marked as Closed
                </div>
              ) : (
                <Button 
                  onClick={handleCloseMonth}
                  disabled={isClosing}
                  className="w-full h-14 bg-[#0D3D33] hover:bg-[#082a23] text-white rounded-2xl font-bold flex items-center justify-center gap-2 text-lg shadow-lg"
                >
                  {isClosing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wallet className="w-6 h-6" />}
                  Close {format(parse(selectedMonth, 'yyyy-MM', new Date()), 'MMMM')} Payroll
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {closedMonths.length === 0 ? (
              <div className="text-center py-20 bg-white border border-[#E2DDD6] rounded-xl shadow-sm">
                <History className="h-12 w-12 text-[#888888] mx-auto mb-4" />
                <h3 className="text-lg font-bold text-[#111111] mb-2">No closed payrolls</h3>
                <p className="text-[#555555] text-sm">Close a month to see it here.</p>
              </div>
            ) : (
              closedMonths.map(record => (
                <Card key={record.id} className="border border-[#E2DDD6] shadow-sm rounded-2xl overflow-hidden hover:border-[#0D3D33] transition-all cursor-pointer">
                  <CardHeader className="p-4 bg-[#F7F5F0] flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="text-sm font-bold text-[#111111]">{format(parse(record.month, 'yyyy-MM', new Date()), 'MMMM yyyy')}</CardTitle>
                      <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Closed on {format(record.closedAt?.toDate?.() || new Date(), 'MMM dd, yyyy')}</div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-blue-600">
                      <Download className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 grid grid-cols-3 gap-2 text-center">
                     <div>
                       <div className="text-[9px] font-bold text-slate-400">WORKERS</div>
                       <div className="text-sm font-bold text-slate-900">{record.totalWorkers}</div>
                     </div>
                     <div>
                       <div className="text-[9px] font-bold text-slate-400">TOTAL</div>
                       <div className="text-sm font-bold text-slate-900">Rs {record.totalEarned.toLocaleString()}</div>
                     </div>
                     <div>
                       <div className="text-[9px] font-bold text-slate-400">REMAINING</div>
                       <div className="text-sm font-bold text-red-600">Rs {record.remaining.toLocaleString()}</div>
                     </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
