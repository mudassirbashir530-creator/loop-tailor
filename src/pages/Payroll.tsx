import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
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
  Coins, 
  Clock, 
  CheckCircle, 
  Banknote,
  Users,
  Sparkles,
  DollarSign,
  Edit2,
  RotateCcw
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export function Payroll() {
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const monthStr = format(currentMonth, 'yyyy-MM');
  
  const { workers, loading: workersLoading } = useWorkers();
  const { orders, loading: ordersLoading } = useOrders();
  const { payroll, loading: payrollLoading, initOrUpdatePayroll, lockPayroll } = usePayroll(monthStr);
  const [search, setSearch] = useState('');

  // Custom payment modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedWorkerForPay, setSelectedWorkerForPay] = useState<any | null>(null);
  const [payInputAmount, setPayInputAmount] = useState<number | string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const existingPayments = useMemo(() => payroll?.payments || [], [payroll]);
  const isLocked = payroll?.status === 'closed';

  const workersPayrollData = useMemo(() => {
    return workers.map(worker => {
      const workerOrdersInMonth = orders.filter(order => {
        if (order.status === 'cancelled') return false;
        const matchesWorker = (order.workerId && order.workerId === worker.id) || 
                              (order.workerName && order.workerName.toLowerCase() === worker.name.toLowerCase());
        if (!matchesWorker) return false;

        try {
          let date: Date;
          const createdAtVal = order.createdAt as any;
          if (createdAtVal?.seconds) {
            date = new Date(createdAtVal.seconds * 1000);
          } else if (createdAtVal && typeof createdAtVal.toDate === 'function') {
            date = createdAtVal.toDate();
          } else if (createdAtVal) {
            date = new Date(createdAtVal);
          } else {
            date = new Date();
          }
          if (isNaN(date.getTime())) return false;
          return format(date, 'yyyy-MM') === monthStr;
        } catch {
          return false;
        }
      });

      const orderCount = workerOrdersInMonth.length;
      const amountDue = worker.salaryType === 'monthly' 
        ? (worker.salaryAmount || 0) 
        : (orderCount * (worker.salaryAmount || 0));

      const paymentInfo = existingPayments.find(p => p.workerId === worker.id);
      const amountPaid = Number(paymentInfo?.amountPaid) || 0;
      const remainingDue = Math.max(0, amountDue - amountPaid);
      const isPaid = amountDue > 0 ? amountPaid >= amountDue : amountPaid > 0;
      const isPartial = amountPaid > 0 && amountPaid < amountDue;

      return {
        ...worker,
        orderCount,
        amountDue,
        amountPaid,
        remainingDue,
        isPaid,
        isPartial,
        paymentDate: paymentInfo?.paymentDate || null
      };
    });
  }, [workers, orders, monthStr, existingPayments]);

  const filteredWorkersData = useMemo(() => {
    return workersPayrollData.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));
  }, [workersPayrollData, search]);

  const totalPayrollAmount = useMemo(() => workersPayrollData.reduce((acc, w) => acc + w.amountDue, 0), [workersPayrollData]);
  const totalPaidAmount = useMemo(() => existingPayments.reduce((acc, p) => acc + (p.amountPaid || 0), 0), [existingPayments]);
  const totalRemainingAmount = useMemo(() => Math.max(0, totalPayrollAmount - totalPaidAmount), [totalPayrollAmount, totalPaidAmount]);
  const paidWorkersCount = useMemo(() => workersPayrollData.filter(w => w.isPaid).length, [workersPayrollData]);
  const payrollProgress = workersPayrollData.length > 0 ? Math.round((paidWorkersCount / workersPayrollData.length) * 100) : 0;

  const openPayModal = (w: any) => {
    if (isLocked) { toast.error("Payroll is closed for this month."); return; }
    setSelectedWorkerForPay(w);
    setPayInputAmount(w.remainingDue > 0 ? w.remainingDue : w.amountDue);
    setPaymentModalOpen(true);
  };

  const handleSavePayment = async () => {
    if (!selectedWorkerForPay || isLocked) return;
    const amountToSet = Number(payInputAmount);
    if (isNaN(amountToSet) || amountToSet < 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const otherPayments = existingPayments.filter(p => p.workerId !== selectedWorkerForPay.id);
      const updatedPayment: WorkerPayment = {
        workerId: selectedWorkerForPay.id,
        amountPaid: amountToSet,
        paymentDate: new Date().toISOString()
      };

      await initOrUpdatePayroll([...otherPayments, updatedPayment], payroll?.status || 'open');
      toast.success(`Payment of PKR ${amountToSet.toLocaleString()} recorded for ${selectedWorkerForPay.name}!`);
      setPaymentModalOpen(false);
      setSelectedWorkerForPay(null);
    } catch {
      toast.error('Failed to record payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleResetPayment = async (workerId: string, workerName: string) => {
    if (isLocked) { toast.error("Payroll is closed for this month."); return; }
    if (!window.confirm(`Reset payment record for ${workerName}?`)) return;

    try {
      const otherPayments = existingPayments.filter(p => p.workerId !== workerId);
      await initOrUpdatePayroll(otherPayments, payroll?.status || 'open');
      toast.success(`Payment reset for ${workerName}`);
    } catch {
      toast.error('Failed to reset payment');
    }
  };

  const handleLockPayroll = async () => {
    if (window.confirm("Lock & close this month's payroll? No new payments can be recorded.")) {
      try {
        if (!payroll) await initOrUpdatePayroll([], 'closed');
        else await lockPayroll();
        toast.success('Payroll locked!');
      } catch { toast.error('Failed to lock payroll'); }
    }
  };

  const isLoading = workersLoading || ordersLoading || payrollLoading;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-5">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="w-16 h-16 bg-[#0D3D33] text-[#2ECC71] rounded-3xl flex items-center justify-center shadow-xl"
        >
          <Banknote className="w-8 h-8" />
        </motion.div>
        <div className="text-center space-y-2">
          <p className="text-xs font-black text-slate-500 tracking-widest uppercase">Loading Payroll...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen w-full p-3 sm:p-5 md:p-8 pb-28 space-y-5 max-w-5xl mx-auto"
    >
      {/* ===== HEADER ===== */}
      <motion.div variants={itemVariants} className="relative bg-[#0D3D33] text-white rounded-[28px] p-5 sm:p-7 overflow-hidden shadow-2xl border border-emerald-500/20">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-[#2ECC71]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#2ECC71]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#2ECC71] border border-white/10">
                Staff Payroll Hub
              </span>
              {isLocked && (
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Team Payroll</h1>
            <p className="text-xs sm:text-sm text-white/70 font-medium mt-0.5">
              Track monthly salaries, per-suit piece rates, and record worker payouts.
            </p>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 self-start sm:self-center shrink-0">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white/15 rounded-xl transition-all active:scale-90 text-white"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black px-2 min-w-[90px] text-center uppercase tracking-wider">
              {format(currentMonth, 'MMM yyyy')}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-white/15 rounded-xl transition-all active:scale-90 text-white"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {workersPayrollData.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/10 relative z-10">
            <div className="flex justify-between items-center text-xs font-bold mb-2">
              <span className="text-white/80">Payroll Payout Progress</span>
              <span className="text-[#2ECC71]">{paidWorkersCount}/{workersPayrollData.length} Paid ({payrollProgress}%)</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${payrollProgress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#2ECC71] to-emerald-400 rounded-full"
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* ===== METRIC CARDS ===== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Payroll Due</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">PKR {totalPayrollAmount.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#0D3D33]/10 text-[#0D3D33] shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Paid Out</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">PKR {totalPaidAmount.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Remaining Payout Due</p>
            <p className="text-xl sm:text-2xl font-black text-amber-600 mt-1">PKR {totalRemainingAmount.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </motion.div>

      {/* ===== WORKER ROSTER ===== */}
      <motion.div variants={itemVariants} className="bg-white rounded-[24px] border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Roster Header Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D3D33]"
            />
          </div>

          <div className="flex items-center gap-2">
            {!isLocked && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs font-bold rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100"
                onClick={handleLockPayroll}
              >
                <Lock className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Lock Month
              </Button>
            )}
          </div>
        </div>

        {/* Worker Cards List */}
        <div className="p-4 sm:p-5 space-y-3">
          {filteredWorkersData.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Users className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">No staff members found for {format(currentMonth, 'MMMM yyyy')}</p>
              <p className="text-xs text-slate-400">Add workers in the Staff directory to track monthly payrolls.</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredWorkersData.map((w, index) => (
                <motion.div
                  key={w.id}
                  variants={itemVariants}
                  className="group relative bg-slate-50/70 hover:bg-white rounded-2xl border border-slate-200/70 hover:border-[#0D3D33]/30 hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl transition-all ${w.isPaid ? 'bg-emerald-500' : w.isPartial ? 'bg-amber-500' : 'bg-slate-300'}`} />

                  <div className="pl-4 pr-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Avatar + Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {w.profileImage ? (
                        <img
                          src={typeof w.profileImage === 'string' ? w.profileImage : (w.profileImage as any).url}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0"
                          alt={w.name}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#0D3D33] text-[#2ECC71] font-black text-lg flex items-center justify-center shrink-0 uppercase shadow-sm">
                          {w.name.charAt(0)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-sm">{w.name}</span>
                          <span className="bg-[#0D3D33]/10 text-[#0D3D33] font-bold px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider shrink-0">
                            {w.role}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                          {w.salaryType === 'monthly' 
                            ? `Fixed PKR ${Number(w.salaryAmount || 0).toLocaleString()}/month`
                            : `PKR ${Number(w.salaryAmount || 0).toLocaleString()}/suit · ${w.orderCount} suits assigned this month`
                          }
                        </div>
                      </div>
                    </div>

                    {/* Amount + Payment Status / Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-14 sm:pl-0 border-t sm:border-t-0 border-slate-200/60 pt-2.5 sm:pt-0">
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Due / Paid</p>
                        <p className="text-sm font-black text-slate-900">
                          <span className="text-emerald-700">PKR {w.amountPaid.toLocaleString()}</span> / <span className="text-slate-700">PKR {w.amountDue.toLocaleString()}</span>
                        </p>
                        {w.remainingDue > 0 && w.amountPaid > 0 && (
                          <p className="text-[10px] font-bold text-amber-600">PKR {w.remainingDue.toLocaleString()} Remaining</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {w.isPaid ? (
                          <div className="flex items-center gap-1.5">
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PAID
                            </span>
                            {!isLocked && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded-xl text-slate-400 hover:text-slate-700"
                                onClick={() => openPayModal(w)}
                                title="Edit Payment"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              onClick={() => openPayModal(w)}
                              disabled={isLocked}
                              className="px-3.5 py-2 bg-[#0D3D33] hover:bg-[#092B24] text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0"
                            >
                              {w.isPartial ? 'Pay Balance' : 'Record Pay'}
                            </Button>
                            {w.amountPaid > 0 && !isLocked && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded-xl text-slate-400 hover:text-rose-600"
                                onClick={() => handleResetPayment(w.id, w.name)}
                                title="Reset Payment"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Panel Footer Summary */}
        {workersPayrollData.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-[#2ECC71]" />
              {format(currentMonth, 'MMMM yyyy')} Summary
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-center px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <p className="text-[9px] font-black text-slate-400 uppercase">Workers</p>
                <p className="text-base font-black text-slate-900">{workersPayrollData.length}</p>
              </div>
              <div className="text-center px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-[9px] font-black text-emerald-600 uppercase">Paid</p>
                <p className="text-base font-black text-emerald-700">{paidWorkersCount}</p>
              </div>
              <div className="text-center px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-[9px] font-black text-amber-600 uppercase">Pending</p>
                <p className="text-base font-black text-amber-700">{workersPayrollData.length - paidWorkersCount}</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Record Payout Dialog */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-[#0D3D33]">
              Record Payment for {selectedWorkerForPay?.name}
            </DialogTitle>
            <DialogDescription>
              Enter the amount paid to this worker for {format(currentMonth, 'MMMM yyyy')}.
            </DialogDescription>
          </DialogHeader>

          {selectedWorkerForPay && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between font-medium text-slate-600">
                  <span>Worker Role:</span>
                  <span className="font-bold text-slate-900 capitalize">{selectedWorkerForPay.role}</span>
                </div>
                <div className="flex justify-between font-medium text-slate-600">
                  <span>Total Amount Due:</span>
                  <span className="font-bold text-slate-900">PKR {selectedWorkerForPay.amountDue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium text-slate-600">
                  <span>Already Paid:</span>
                  <span className="font-bold text-emerald-700">PKR {selectedWorkerForPay.amountPaid.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Amount Paid (PKR)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="number" 
                    value={payInputAmount} 
                    onChange={e => setPayInputAmount(e.target.value)} 
                    placeholder="Enter payout amount" 
                    className="pl-9 h-12 rounded-xl font-extrabold text-base" 
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" className="h-11 rounded-xl font-bold" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
            <Button className="h-11 rounded-xl font-bold bg-[#0D3D33] hover:bg-[#092B24] text-white" onClick={handleSavePayment} disabled={isSubmittingPayment}>
              Save Payment Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
