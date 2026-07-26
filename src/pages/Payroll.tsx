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
  ArrowUpRight, 
  Coins, 
  Clock, 
  CheckCircle, 
  LockKeyhole,
  Info,
  Scissors,
  Banknote,
  Users,
  TrendingUp,
  Calendar,
  Star,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { type: 'spring', stiffness: 280, damping: 22 }
  }
};

const workerRowVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 26,
      delay: i * 0.06 
    }
  }),
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
};

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

  const workersPayrollData = useMemo(() => {
    return workers.map(worker => {
      const workerOrdersInMonth = orders.filter(order => {
        if (!order.workerId || order.workerId !== worker.id) return false;
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

      const countedOrders = workerOrdersInMonth.filter(order => order.status !== 'cancelled');
      const orderCount = countedOrders.length;
      const amountDue = worker.salaryType === 'monthly' 
        ? (worker.salaryAmount || 0) 
        : (orderCount * (worker.salaryAmount || 0));
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

  const filteredWorkersData = useMemo(() => {
    return workersPayrollData.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));
  }, [workersPayrollData, search]);

  const totalPayrollAmount = useMemo(() => workersPayrollData.reduce((acc, w) => acc + w.amountDue, 0), [workersPayrollData]);
  const totalPaidAmount = useMemo(() => existingPayments.reduce((acc, p) => acc + (p.amountPaid || 0), 0), [existingPayments]);
  const totalRemainingAmount = useMemo(() => Math.max(0, totalPayrollAmount - totalPaidAmount), [totalPayrollAmount, totalPaidAmount]);
  const paidWorkersCount = useMemo(() => workersPayrollData.filter(w => w.isPaid).length, [workersPayrollData]);
  const payrollProgress = workersPayrollData.length > 0 ? Math.round((paidWorkersCount / workersPayrollData.length) * 100) : 0;

  const handleRecordPayment = async (workerId: string, fullAmount: number) => {
    if (isLocked) { toast.error("Payroll is closed for this month."); return; }
    const isAlreadyPaid = existingPayments.some(p => p.workerId === workerId);
    if (isAlreadyPaid) { toast.error("Payment already recorded for this worker."); return; }
    const newPayment: WorkerPayment = { workerId, amountPaid: fullAmount, paymentDate: new Date().toISOString() };
    try {
      await initOrUpdatePayroll([...existingPayments, newPayment], payroll?.status || 'open');
      toast.success('Payment recorded!');
    } catch { toast.error('Failed to record payment'); }
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
          <div className="h-1 w-24 bg-slate-100 rounded-full overflow-hidden mx-auto">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              className="h-full w-1/2 bg-[#2ECC71] rounded-full"
            />
          </div>
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
        {/* Ambient glow blobs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-[#2ECC71]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#2ECC71]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#2ECC71] flex items-center justify-center shrink-0">
                <Banknote className="w-4 h-4 text-slate-950" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#2ECC71]">ACCOUNTING DESK</span>
              {isLocked && (
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/15 px-2 py-0.5 rounded-full">LOCKED</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Team Payroll</h1>
            <p className="text-white/60 text-xs sm:text-sm font-semibold">Manage monthly salaries and per-suit tailor payouts</p>
          </div>

          {/* Month Selector */}
          <div className="flex items-center bg-white/10 border border-white/15 rounded-2xl p-1 gap-1 shrink-0 self-start">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handlePrevMonth}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </motion.button>
            <div className="w-32 text-center font-black text-xs text-white uppercase tracking-tight select-none">
              {format(currentMonth, 'MMM yyyy')}
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleNextMonth}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </motion.button>
          </div>
        </div>

        {/* Progress Bar */}
        {workersPayrollData.length > 0 && (
          <div className="relative z-10 mt-5 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-black text-white/60 uppercase tracking-wider">
              <span>Payroll Progress</span>
              <span className="text-[#2ECC71]">{paidWorkersCount}/{workersPayrollData.length} Paid</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${payrollProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                className="h-full bg-gradient-to-r from-[#2ECC71] to-emerald-400 rounded-full"
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* ===== STATS ROW ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Due', value: `PKR ${totalPayrollAmount.toLocaleString()}`, icon: Wallet, color: 'bg-[#0D3D33]/10 text-[#0D3D33]', textColor: 'text-[#0D3D33]', sub: 'Total payroll this month' },
          { label: 'Disbursed', value: `PKR ${totalPaidAmount.toLocaleString()}`, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700', textColor: 'text-emerald-700', sub: `${paidWorkersCount} workers paid` },
          { label: 'Outstanding', value: `PKR ${totalRemainingAmount.toLocaleString()}`, icon: Clock, color: 'bg-amber-100 text-amber-700', textColor: 'text-amber-700', sub: 'Pending settlements', hidden: false },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={cardVariants}
            custom={i}
            className={`bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-2.5 shadow-sm hover:shadow-md transition-shadow ${stat.hidden ? 'col-span-2 sm:col-span-1' : ''}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <div className={`w-8 h-8 rounded-xl ${stat.color} flex items-center justify-center shrink-0`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <p className={`text-lg sm:text-2xl font-black ${stat.textColor} leading-tight`}>{stat.value}</p>
            <p className="text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-2">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ===== WORKER LEDGER PANEL ===== */}
      <motion.div variants={itemVariants} className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Panel Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0D3D33]" />
              Worker Ledger
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Record salary disbursements for {format(currentMonth, 'MMMM yyyy')}</p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                placeholder="Search workers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0D3D33] focus:ring-2 focus:ring-[#0D3D33]/10 rounded-xl text-xs font-semibold text-slate-800 w-full outline-none transition-all"
              />
            </div>

            {/* Lock Button */}
            {!isLocked ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleLockPayroll}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-3 py-2 text-xs font-black transition-colors shadow-md shrink-0"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lock Month</span>
              </motion.button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 font-black rounded-xl text-xs uppercase tracking-wider border border-amber-200 shrink-0">
                <LockKeyhole className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Locked</span>
              </div>
            )}
          </div>
        </div>

        {/* Worker List */}
        <div className="p-3 sm:p-4 space-y-2">
          {filteredWorkersData.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center space-y-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
                <Scissors className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-slate-400 font-bold text-sm">No workers found</p>
              <p className="text-slate-300 font-semibold text-xs">Add workers from the Workers section</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredWorkersData.map((w, i) => (
                <motion.div
                  key={w.id}
                  variants={workerRowVariants}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="group relative bg-slate-50 hover:bg-white rounded-2xl border border-slate-200/60 hover:border-[#0D3D33]/20 hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Left accent */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all ${w.isPaid ? 'bg-emerald-500' : 'bg-slate-200 group-hover:bg-[#2ECC71]'}`} />

                  <div className="pl-4 pr-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Avatar + Name */}
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
                          <span className="font-black text-slate-900 text-sm">{w.name}</span>
                          <span className="bg-[#0D3D33]/10 text-[#0D3D33] font-bold px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider shrink-0">
                            {w.role}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                          {w.salaryType === 'monthly' 
                            ? `PKR ${Number(w.salaryAmount || 0).toLocaleString()}/month`
                            : `PKR ${Number(w.salaryAmount || 0).toLocaleString()}/suit · ${w.orderCount} suits this month`
                          }
                        </div>
                      </div>
                    </div>

                    {/* Amount + Payment Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-14 sm:pl-0 border-t sm:border-t-0 border-slate-100 pt-2.5 sm:pt-0">
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Due</p>
                        <p className="text-base font-black text-slate-900">PKR {w.amountDue.toLocaleString()}</p>
                      </div>

                      {w.isPaid ? (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 shrink-0"
                        >
                          <div>
                            <p className="text-[10px] font-black text-emerald-700 uppercase leading-none">PAID</p>
                            {w.paymentDate && (
                              <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                {(() => {
                                  try {
                                    const pDate = w.paymentDate as any;
                                    const d = pDate?.seconds ? new Date(pDate.seconds * 1000) :
                                              typeof pDate === 'string' && pDate.includes('T') ? parseISO(pDate) : new Date(pDate);
                                    return isNaN(d.getTime()) ? '' : format(d, 'MMM d');
                                  } catch { return ''; }
                                })()}
                              </p>
                            )}
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        </motion.div>
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => handleRecordPayment(w.id, w.amountDue)}
                          disabled={isLocked || w.amountDue <= 0}
                          className="px-4 py-2.5 bg-[#0D3D33] hover:bg-[#092B24] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all duration-200 shrink-0"
                        >
                          Pay Now
                        </motion.button>
                      )}
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
              <div className="text-center px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
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
    </motion.div>
  );
}
