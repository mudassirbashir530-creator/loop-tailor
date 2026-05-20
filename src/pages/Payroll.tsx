import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { format, subMonths, addMonths, startOfMonth, parseISO } from 'date-fns';
import { useStaff } from '../hooks/useStaff';
import { usePayroll, StaffPayment } from '../hooks/usePayroll';
import { ChevronLeft, ChevronRight, CheckCircle2, Lock, FileText, AlertCircle, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';

export function Payroll() {
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const monthStr = format(currentMonth, 'yyyy-MM');
  
  const { staff, loading: staffLoading } = useStaff();
  const { payroll, loading: payrollLoading, initOrUpdatePayroll, lockPayroll } = usePayroll(monthStr);
  const [search, setSearch] = useState('');

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Payroll shows ALL workers automatically (monthly + per_suit)
  const filteredStaff = useMemo(() => {
    return staff.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [staff, search]);

  const existingPayments = payroll?.payments || [];
  const isLocked = payroll?.status === 'closed';

  // Total payroll for monthly-salaried team members
  const totalPayroll = useMemo(() => {
    return filteredStaff
      .filter(s => s.salaryType === 'monthly')
      .reduce((acc, s) => acc + (s.salaryAmount || 0), 0);
  }, [filteredStaff]);

  const totalPaid = useMemo(() => existingPayments.reduce((acc, p) => acc + (p.amountPaid || 0), 0), [existingPayments]);
  
  const unpaidStaffCount = useMemo(() => {
    return filteredStaff.filter(s => {
      const payment = existingPayments.find(p => p.staffId === s.id);
      const paid = payment?.amountPaid || 0;
      const targetAmount = s.salaryAmount || 0;
      return paid < targetAmount;
    }).length;
  }, [filteredStaff, existingPayments]);

  const handleRecordPayment = async (staffId: string, fullAmount: number) => {
    if (isLocked) return;
    
    // Check if already paid
    const isAlreadyPaid = existingPayments.some(p => p.staffId === staffId);
    if (isAlreadyPaid) {
        toast.error("Already recorded payment for this worker for this month.");
        return;
    }

    const newPayment: StaffPayment = {
      staffId,
      amountPaid: fullAmount,
      paymentDate: new Date().toISOString()
    };

    try {
      await initOrUpdatePayroll([...existingPayments, newPayment], payroll?.status || 'open');
      toast.success('Payment recorded successfully');
    } catch (e) {
      toast.error('Failed to record payment');
    }
  };

  const handleLockPayroll = async () => {
    if (window.confirm("Are you sure you want to close the payroll for this month? This cannot be undone.")) {
      try {
        if (!payroll) {
            await initOrUpdatePayroll([], 'closed');
        } else {
            await lockPayroll();
        }
        toast.success('Payroll locked successfully');
      } catch (e) {
        toast.error('Failed to lock payroll');
      }
    }
  };

  const isLoading = staffLoading || payrollLoading;

  if (isLoading) {
    return <div className="p-6 text-center animate-pulse text-gray-500">Loading payroll data...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team Payroll</h1>
          <p className="text-sm text-gray-500">Manage monthly salaries and per-suit payments from workers</p>
        </div>

        <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="w-32 text-center font-medium text-sm text-gray-700">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 rounded-full">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Monthly Payroll</p>
            <p className="text-2xl font-bold text-gray-900">Rs {totalPayroll.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-emerald-600">Rs {totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">Unpaid Workers</p>
            <p className="text-2xl font-bold text-amber-600">{unpaidStaffCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search workers..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200 rounded-full h-10 w-full"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {!isLocked ? (
                <Button 
                    onClick={handleLockPayroll}
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-5 h-10 shadow-sm font-medium"
                >
                    <Lock className="h-4 w-4 mr-2" />
                    Close Month
                </Button>
            ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-full text-sm">
                    <Lock className="h-4 w-4" />
                    Payroll Closed
                </div>
            )}
          </div>
        </div>

        {filteredStaff.length === 0 ? (
            <div className="text-center py-10">
                <p className="text-gray-500 text-sm">No workers found.</p>
            </div>
        ) : (
            <div className="space-y-3 mt-4">
                {filteredStaff.map((s) => {
                    const payment = existingPayments.find(p => p.staffId === s.id);
                    const isPaid = !!payment;

                    return (
                        <div key={s.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 gap-4">
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-900">{s.name}</span>
                                <span className="text-xs text-gray-500">
                                  <span className="capitalize">{s.role}</span> • Rs {s.salaryAmount?.toLocaleString()} ({s.salaryType === 'monthly' ? 'Monthly' : 'Per Suit'})
                                </span>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                {isPaid ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-col items-end mr-2">
                                            <span className="text-sm font-bold text-emerald-600">Paid Rs {payment.amountPaid.toLocaleString()}</span>
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">{format(parseISO(payment.paymentDate), 'MMM d, yyyy h:mm a')}</span>
                                        </div>
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    </div>
                                ) : (
                                    <Button 
                                        onClick={() => handleRecordPayment(s.id, s.salaryAmount || 0)} 
                                        disabled={isLocked}
                                        variant="outline"
                                        className="rounded-full h-9 px-4 border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-medium"
                                    >
                                        Record Payment
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
}
