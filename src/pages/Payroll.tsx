import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { format, subMonths, addMonths, startOfMonth, parseISO } from 'date-fns';
import { useWorkers } from '../hooks/useWorkers';
import { useOrders } from '../hooks/useOrders';
import { usePayroll, WorkerPayment } from '../hooks/usePayroll';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Lock, 
  Search, 
  Wallet, 
  ArrowUpRight, 
  Coins, 
  Clock, 
  CheckCircle, 
  LockKeyhole,
  Info
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';

export function Payroll() {
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const monthStr = format(currentMonth, 'yyyy-MM');
  
  const { workers, loading: workersLoading } = useWorkers();
  const { orders, loading: ordersLoading } = useOrders();
  const { payroll, loading: payrollLoading, initOrUpdatePayroll, lockPayroll } = usePayroll(monthStr);
  const [search, setSearch] = useState('');

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const existingPayments = useMemo(() => payroll?.payments || [], [payroll]);
  const isLocked = payroll?.status === 'closed';

  // Calculate orders & due amount per worker for the selected month
  const workersPayrollData = useMemo(() => {
    return workers.map(worker => {
      // Find orders created in the selected month assigned to this worker
      const workerOrdersInMonth = orders.filter(order => {
        if (!order.workerId || order.workerId !== worker.id) return false;
        try {
          const date = order.createdAt ? new Date(order.createdAt) : new Date();
          return format(date, 'yyyy-MM') === monthStr;
        } catch {
          return false;
        }
      });

      // Filter out cancelled orders
      const countedOrders = workerOrdersInMonth.filter(order => order.status !== 'cancelled');
      const orderCount = countedOrders.length;

      // Calculate amount due based on salary type
      const amountDue = worker.salaryType === 'monthly' 
        ? (worker.salaryAmount || 0) 
        : (orderCount * (worker.salaryAmount || 0));

      // Check payment status from payroll record
      const paymentInfo = existingPayments.find(p => p.workerId === worker.id);
      const isPaid = !!paymentInfo;

      return {
        ...worker,
        orderCount,
        amountDue,
        isPaid,
        paymentDate: paymentInfo?.paymentDate || null,
        amountPaid: paymentInfo?.amountPaid || 0
      };
    });
  }, [workers, orders, monthStr, existingPayments]);

  // Filter workers based on search string
  const filteredWorkersData = useMemo(() => {
    return workersPayrollData.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));
  }, [workersPayrollData, search]);

  // Summary widgets
  const totalPayrollAmount = useMemo(() => {
    return workersPayrollData.reduce((acc, w) => acc + w.amountDue, 0);
  }, [workersPayrollData]);

  const totalPaidAmount = useMemo(() => {
    return existingPayments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);
  }, [existingPayments]);

  const totalRemainingAmount = useMemo(() => {
    return Math.max(0, totalPayrollAmount - totalPaidAmount);
  }, [totalPayrollAmount, totalPaidAmount]);

  const paidWorkersCount = useMemo(() => {
    return workersPayrollData.filter(w => w.isPaid).length;
  }, [workersPayrollData]);

  const handleRecordPayment = async (workerId: string, fullAmount: number) => {
    if (isLocked) {
      toast.error("Payroll is closed for this month. Unlock to record new payments.");
      return;
    }
    
    // Check if already paid
    const isAlreadyPaid = existingPayments.some(p => p.workerId === workerId);
    if (isAlreadyPaid) {
      toast.error("Payment already recorded for this worker for this month.");
      return;
    }

    const newPayment: WorkerPayment = {
      workerId,
      amountPaid: fullAmount,
      paymentDate: new Date().toISOString()
    };

    try {
      await initOrUpdatePayroll([...existingPayments, newPayment], payroll?.status || 'open');
      toast.success('Payment recorded successfully!');
    } catch (e) {
      toast.error('Failed to record payment');
    }
  };

  const handleLockPayroll = async () => {
    if (window.confirm("Are you sure you want to CLOSE & LOCK the payroll for this month? Once locked, you cannot record any more payments for this month unless unlocked.")) {
      try {
        if (!payroll) {
          await initOrUpdatePayroll([], 'closed');
        } else {
          await lockPayroll();
        }
        toast.success('Payroll locked and archived successfully!');
      } catch (e) {
        toast.error('Failed to lock payroll');
      }
    }
  };

  const isLoading = workersLoading || ordersLoading || payrollLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 z-10 relative">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-[14px] text-slate-500 font-bold animate-pulse">Syncing employee ledger ledger ledger...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#F8FAFC] z-10 p-4 sm:p-8 pb-24 text-[#0F172A] selection:bg-indigo-100">
      {/* Container Inner with solid boundaries */}
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Content */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <span className="bg-indigo-50 text-indigo-600 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full mb-2 inline-block">
              Accounting Desk
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Team Payroll</h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">Manage monthly salaries and per-suit tailor payouts</p>
          </div>

          {/* Month Selector Picker */}
          <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-full p-1 shadow-sm shrink-0">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-9 w-9 rounded-full bg-white hover:bg-slate-100 shadow-sm border border-slate-200/50">
              <ChevronLeft className="h-4 w-4 text-slate-700" />
            </Button>
            <div className="w-36 text-center font-black text-xs sm:text-sm text-slate-800 uppercase tracking-tight select-none px-1">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-9 w-9 rounded-full bg-white hover:bg-slate-100 shadow-sm border border-slate-200/50">
              <ChevronRight className="h-4 w-4 text-slate-700" />
            </Button>
          </div>
        </div>

        {/* Dynamic Payroll Stats Dashboard Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Payroll Due */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-4 top-4 w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Wallet className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Payroll Due</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                PKR {totalPayrollAmount.toLocaleString()}
              </h3>
            </div>
            <p className="text-[11px] font-bold text-slate-400 mt-4 flex items-center gap-1.5 pt-2 border-t border-slate-100">
              <Clock className="h-3 w-3 text-slate-400" /> Base salaries + tailor orders
            </p>
          </div>

          {/* Card 2: Total Paid Amount */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-4 top-4 w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Coins className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Disbursed</p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-600">
                PKR {totalPaidAmount.toLocaleString()}
              </h3>
            </div>
            <p className="text-[11px] font-bold text-emerald-600/80 mt-4 flex items-center gap-1.5 pt-2 border-t border-slate-100 select-none">
              <CheckCircle className="h-3 w-3" /> {paidWorkersCount} of {workersPayrollData.length} team paid
            </p>
          </div>

          {/* Card 3: Total Outstanding Balance */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-4 top-4 w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <ArrowUpRight className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Remaining</p>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-600">
                PKR {totalRemainingAmount.toLocaleString()}
              </h3>
            </div>
            <p className="text-[11px] font-bold text-amber-600 mt-4 pt-2 border-t border-slate-100 select-none">
              Outstanding worker settlements
            </p>
          </div>
        </div>

        {/* Main Content Layout Container (Opaque bg) */}
        <div className="bg-white rounded-[2rem] p-5 sm:p-8 shadow-sm border border-slate-100/90 flex flex-col space-y-6">
          
          {/* Controls Panel */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search workers by name..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200/80 focus:border-indigo-400 focus:bg-white rounded-2xl h-10 w-full text-xs sm:text-sm font-semibold text-slate-800 transition-all select-none"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto self-stretch sm:self-auto justify-end">
              {!isLocked ? (
                <Button 
                  onClick={handleLockPayroll}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-5 h-10 shadow-md font-black text-xs sm:text-sm tracking-tight inline-flex items-center transition-all duration-300 w-full sm:w-auto justify-center"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Close Month Ledger
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 font-extrabold rounded-2xl text-xs uppercase tracking-wider border border-slate-200/50 w-full sm:w-auto">
                  <LockKeyhole className="h-4 w-4 text-indigo-500" />
                  Ledger Archived
                </div>
              )}
            </div>
          </div>

          {/* Workers Ledger Payments list */}
          {filteredWorkersData.length === 0 ? (
            <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/60">
              <p className="text-slate-400 font-bold text-sm">No tailors or team members registered in loop</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorkersData.map((w) => {
                return (
                  <div 
                    key={w.id} 
                    className="flex flex-col md:flex-row justify-between items-stretch md:items-center p-5 bg-slate-50 rounded-2xl border border-slate-200/30 gap-4 transition-all hover:border-slate-200"
                  >
                    {/* Worker Profile Details */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {w.profileImage ? (
                        <img 
                          src={typeof w.profileImage === 'string' ? w.profileImage : w.profileImage.url} 
                          className="h-12 w-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-sm bg-white" 
                          alt={w.name} 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-50 to-slate-100 text-indigo-600 font-black text-lg flex items-center justify-center shrink-0 uppercase border border-slate-200/30 shadow-inner select-none">
                          {w.name.charAt(0)}
                        </div>
                      )}
                      
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-extrabold text-slate-800 text-sm truncate">{w.name}</span>
                          <span className="bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider shrink-0 select-none">
                            {w.role}
                          </span>
                        </div>
                        
                        <div className="text-[11px] font-bold text-slate-400 leading-none">
                          {w.salaryType === 'monthly' ? (
                            <span>Salary: <strong className="text-slate-600 font-extrabold">PKR {Number(w.salaryAmount || 0).toLocaleString()}</strong> / month</span>
                          ) : (
                            <span>Salary: <strong className="text-slate-600 font-extrabold">PKR {Number(w.salaryAmount || 0).toLocaleString()}</strong> per suit completion</span>
                          )}
                        </div>

                        {w.salaryType === 'per_suit' && (
                          <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 bg-slate-200/30 px-2 py-0.5 rounded-md w-fit">
                            <Info className="h-2.5 w-2.5 text-indigo-500 shrink-0" /> Recorded orders this month: {w.orderCount}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Worker Payout Segment */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between md:justify-end shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200/40">
                      
                      {/* Amount Display */}
                      <div className="text-left md:text-right shrink-0">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-1">Due Amount</p>
                        <p className="text-base sm:text-lg font-black text-slate-800">
                          PKR {w.amountDue.toLocaleString()}
                        </p>
                      </div>

                      {/* Payment Interactive Buttons */}
                      <div className="w-full sm:w-auto">
                        {w.isPaid ? (
                          <div className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100/60 w-full sm:w-auto">
                            <div className="text-right select-none pr-1">
                              <span className="text-[11px] font-black text-emerald-600 uppercase tracking-wider leading-none block">Paid</span>
                              {w.paymentDate && (
                                <span className="text-[9px] text-slate-400 font-bold leading-none mt-0.5 block">
                                  {format(parseISO(w.paymentDate), 'MMM d, p')}
                                </span>
                              )}
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 animate-bounce" />
                          </div>
                        ) : (
                          <Button 
                            onClick={() => handleRecordPayment(w.id, w.amountDue)} 
                            disabled={isLocked || w.amountDue <= 0}
                            variant="outline"
                            className="w-full sm:w-auto rounded-2xl h-10 px-4 text-xs font-extrabold text-indigo-600 hover:text-white border-indigo-200/50 hover:bg-indigo-600 hover:border-indigo-600 shadow-sm transition-all bg-white"
                          >
                            Record Payout
                          </Button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
