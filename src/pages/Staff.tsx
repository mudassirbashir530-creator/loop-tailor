import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaff, StaffMember } from '../hooks/useStaff';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { format } from 'date-fns';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, Loader2, Users, Scissors, Pocket, UserCircle, Edit2, Trash2, Shield, DollarSign, Wallet, CheckCircle2, Activity, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

import { RecordStaffPaymentModal } from '../components/RecordStaffPaymentModal';

export default function Staff() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { staff, loading, addStaff, updateStaff, deleteStaff } = useStaff();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  
  const [formData, setFormData] = useState<Omit<StaffMember, 'id' | 'createdAt' | 'shopId'>>({
    name: '',
    phone: '',
    role: 'Cutter',
    salaryType: 'fixed',
    salaryAmount: 0,
  });

  const [saving, setSaving] = useState(false);
  const [payrollEntries, setPayrollEntries] = useState<any[]>([]);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedStaffForPayment, setSelectedStaffForPayment] = useState<StaffMember | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(query(collection(db, 'payroll'), where('userId', '==', user.uid)), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayrollEntries(data);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'payroll'));
    
    return () => unsubscribe();
  }, [user]);

  const handleMarkAsPaid = async (payrollId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'payroll', payrollId), {
        paidStatus: 'paid',
        paidAt: serverTimestamp()
      });
      toast.success('Marked as paid');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `payroll/${payrollId}`);
    }
  };

  const handleRecordPayment = async (data: any) => {
    if (!user || !selectedStaffForPayment) return;
    try {
      await addDoc(collection(db, 'payroll'), {
        userId: user.uid,
        staffId: selectedStaffForPayment.id,
        staffName: selectedStaffForPayment.name,
        paymentAmount: data.amount,
        method: data.method,
        type: data.type, // Salary, Advance, Bonus, Overtime
        note: data.note,
        date: data.date,
        month: format(new Date(data.date), 'yyyy-MM'),
        paidStatus: 'paid', // Manual payments are considered paid
        createdAt: serverTimestamp()
      });

      // Also save to the new collection for better history if needed
      await addDoc(collection(db, 'payroll_payments'), {
        userId: user.uid,
        staffId: selectedStaffForPayment.id,
        amount: data.amount,
        method: data.method,
        type: data.type,
        note: data.note,
        date: data.date,
        month: format(new Date(data.date), 'yyyy-MM'),
        createdAt: serverTimestamp()
      });

      toast.success('Payment recorded successfully');
      setIsRecordPaymentOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'payroll_payments');
    }
  };

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.phone && s.phone.includes(search))
  );

  const handleOpenModal = (member?: StaffMember) => {
    if (member) {
      setEditingStaff(member);
      setFormData({ 
        name: member.name, 
        phone: member.phone || '', 
        role: member.role,
        salaryType: member.salaryType || 'fixed',
        salaryAmount: member.salaryAmount || 0
      });
    } else {
      setEditingStaff(null);
      setFormData({ name: '', phone: '', role: 'Cutter', salaryType: 'fixed', salaryAmount: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Name and Phone are required.');
      return;
    }
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        salaryAmount: Number(formData.salaryAmount)
      };

      if (editingStaff) {
        await updateStaff(editingStaff.id, dataToSave);
        toast.success("Staff updated successfully");
      } else {
        await addStaff(dataToSave);
        toast.success("Staff added successfully");
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this staff member?")) {
      try {
        await deleteStaff(id);
        toast.success("Staff removed");
      } catch (error) {
        toast.error("Failed to delete staff");
      }
    }
  };

  const roleIcons: Record<string, any> = {
    Stitcher: Scissors,
    Cutter: Pocket,
    Finisher: Shield,
    Other: UserCircle 
  };

  const currentMonth = format(new Date(), 'yyyy-MM');

  return (
    <div className={cn("page pb-[100px]", isRTL && "font-urdu")} dir={isRTL ? "rtl" : "ltr"}>
      <RecordStaffPaymentModal 
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        onConfirm={handleRecordPayment}
        staffName={selectedStaffForPayment?.name || ''}
      />
      {/* Top Bar */}
      <div className="bg-white border-b border-[#E2DDD6] px-4 py-4 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-xl font-bold text-[#111111]">Team & Staff</h1>
        <div className="flex gap-2">
           <button 
             onClick={() => navigate('/app/payroll')} 
             className="text-blue-600 font-bold text-sm bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
           >
             <Wallet className="w-4 h-4" /> Payroll
           </button>
           <button 
             onClick={() => handleOpenModal()} 
             className="text-[#0D3D33] font-bold text-sm bg-white border border-[#E2DDD6] px-3 py-1.5 rounded-lg flex items-center gap-1.5"
           >
             <Plus className="w-4 h-4" /> Add
           </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        <div className="relative group">
          <div className={cn("absolute top-1/2 -translate-y-1/2 text-[#888888]", isRTL ? "right-4" : "left-4")}>
            <Search className="h-5 w-5" />
          </div>
          <input 
            type="text"
            placeholder="Search team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn("w-full h-12 rounded-xl bg-white border border-[#E2DDD6] text-sm font-bold text-[#111111] focus:outline-none focus:border-[#0D3D33] placeholder-[#888888]", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#0D3D33]" />
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[#E2DDD6] rounded-xl shadow-sm">
            <Users className="h-12 w-12 text-[#888888] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#111111] mb-2">No staff found</h3>
            <p className="text-[#555555] text-sm">Add team members to assign them to orders.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredStaff.map((member, idx) => {
                const RoleIcon = roleIcons[member.role] || UserCircle;
                
                // Calculations
                const memberPayroll = payrollEntries.filter(p => p.staffId === member.id);
                
                // Lifetime
                const lifetimeEarnings = memberPayroll.filter(p => p.type === 'Earning').reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);
                
                // This Month
                const monthEntries = memberPayroll.filter(p => p.month === currentMonth);
                const monthEarned = monthEntries.filter(p => p.type === 'Earning').reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);
                const monthPaid = monthEntries.filter(p => p.type !== 'Earning' || p.paidStatus === 'paid').reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);
                
                const salaryBase = member.salaryType === 'fixed' ? member.salaryAmount : 0;
                const totalTargetEarned = salaryBase + monthEarned;
                const balanceDue = totalTargetEarned - monthPaid;

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="card !m-0 !p-0 overflow-hidden shadow-sm !border-[#E2DDD6] bg-white">
                      <div className="px-4 py-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-[#F7F5F0] border border-[#E2DDD6] flex items-center justify-center">
                              <span className="text-xl font-bold text-[#0D3D33] uppercase">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-[16px] text-[#111111]">{member.name}</h3>
                                <div className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-bold uppercase tracking-wider border border-blue-100">
                                  {member.salaryType === 'fixed' ? 'Salary' : 'Commission'}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-[#555555] uppercase tracking-widest mt-0.5">
                                <RoleIcon className="h-3 w-3" />
                                {member.role}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setSelectedStaffForPayment(member);
                                setIsRecordPaymentOpen(true);
                              }}
                              className="h-8 px-2.5 rounded-lg bg-green-50 text-green-600 border border-green-200 text-[11px] font-bold flex items-center gap-1 hover:bg-green-600 hover:text-white transition-colors"
                            >
                              <DollarSign className="w-3.5 h-3.5" /> Pay
                            </button>
                            <button 
                              onClick={() => handleOpenModal(member)}
                              className="h-8 w-8 rounded-lg bg-[#F7F5F0] border border-[#E2DDD6] text-[#555555] flex items-center justify-center"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Monthly Summary Cards */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                           <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-slate-100">
                              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Earned</div>
                              <div className="text-[13px] font-bold text-slate-900">Rs {monthEarned.toLocaleString()}</div>
                           </div>
                           <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-slate-100">
                              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Paid</div>
                              <div className="text-[13px] font-bold text-slate-900">Rs {monthPaid.toLocaleString()}</div>
                           </div>
                           <div className={cn("p-2.5 rounded-xl border", balanceDue > 0 ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100")}>
                              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Balance</div>
                              <div className={cn("text-[13px] font-bold", balanceDue > 0 ? "text-red-600" : "text-green-600")}>Rs {balanceDue.toLocaleString()}</div>
                           </div>
                        </div>

                        <div className="pt-3 border-t border-[#E2DDD6] grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-1 flex items-center gap-1">
                              <Activity className="w-3 h-3"/> Lifetime Earning
                            </div>
                            <div className="text-[13px] font-bold text-[#111111]">Rs {lifetimeEarnings.toLocaleString()}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-1">Phone</div>
                            <div className="text-[13px] font-bold text-[#111111]">{member.phone || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Last 5 Payments */}
                      {(() => {
                        const lastPayments = memberPayroll
                          .filter(p => p.type !== 'Earning')
                          .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
                          .slice(0, 5);
                        
                        if (lastPayments.length === 0) return null;

                        return (
                          <div className="px-4 py-3 bg-[#F8FAFC] border-t border-slate-100">
                             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                               <Clock className="w-3 h-3"/> Recent Payments
                             </div>
                             <div className="space-y-1.5">
                               {lastPayments.map((p, i) => (
                                 <div key={p.id || i} className="flex justify-between items-center text-[11px]">
                                   <div className="flex items-center gap-2">
                                     <span className={cn(
                                       "w-1.5 h-1.5 rounded-full",
                                       p.type === 'Salary' ? "bg-green-500" : p.type === 'Advance' ? "bg-orange-500" : "bg-blue-500"
                                     )} />
                                     <span className="font-semibold text-slate-700">{p.type}</span>
                                     <span className="text-slate-400">({format(new Date(p.date), 'MMM dd')})</span>
                                   </div>
                                   <div className="font-bold text-slate-900">Rs {p.paymentAmount.toLocaleString()}</div>
                                 </div>
                               ))}
                             </div>
                          </div>
                        );
                      })()}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Staff Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[#111111]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
            >
              <h2 className="text-[18px] font-bold text-[#111111] mb-6 border-b border-[#E2DDD6] pb-3">{editingStaff ? 'Edit Staff Member' : 'Add New Staff'}</h2>
              
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#555555] mb-1.5 block">Name</label>
                  <input 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter name"
                    className="w-full h-12 rounded-xl bg-[#F7F5F0] border border-[#E2DDD6] px-4 font-bold text-[#111111] focus:bg-white focus:border-[#0D3D33] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#555555] mb-1.5 block">Phone</label>
                  <input 
                    required
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="Phone number"
                    className="w-full h-12 rounded-xl bg-[#F7F5F0] border border-[#E2DDD6] px-4 font-bold text-[#111111] focus:bg-white focus:border-[#0D3D33] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#555555] mb-1.5 block">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                    className="w-full h-12 rounded-xl bg-[#F7F5F0] border border-[#E2DDD6] px-4 font-bold text-[#111111] focus:bg-white focus:border-[#0D3D33] outline-none appearance-none"
                  >
                    <option value="Cutter">Cutter</option>
                    <option value="Stitcher">Stitcher</option>
                    <option value="Finisher">Finisher</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#555555] mb-1.5 block">Salary Type</label>
                    <select
                      value={formData.salaryType}
                      onChange={(e) => setFormData({...formData, salaryType: e.target.value as any})}
                      className="w-full h-12 rounded-xl bg-[#F7F5F0] border border-[#E2DDD6] px-4 font-bold text-[#111111] focus:bg-white focus:border-[#0D3D33] outline-none appearance-none"
                    >
                      <option value="fixed">Fixed Monthly</option>
                      <option value="per-order">Per Order</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#555555] mb-1.5 block">Amount / Rate</label>
                    <input 
                      type="number"
                      min="0"
                      required
                      value={formData.salaryAmount} 
                      onChange={e => setFormData({...formData, salaryAmount: Number(e.target.value)})}
                      placeholder="0"
                      className="w-full h-12 rounded-xl bg-[#F7F5F0] border border-[#E2DDD6] px-4 font-bold text-[#111111] focus:bg-white focus:border-[#0D3D33] outline-none"
                    />
                  </div>
                </div>
                
                <div className="pt-2 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="btn-outline flex-1 h-12"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="btn-primary flex-1 h-12 flex items-center justify-center"
                  >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Staff'}
                  </button>
                </div>
                {editingStaff && (
                  <button 
                    type="button" 
                    onClick={() => handleDelete(editingStaff.id)}
                    className="w-full mt-2 h-10 rounded-xl text-[#E53935] font-bold hover:bg-[#E53935]/10 justify-center items-center flex text-sm transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Remove Staff Member
                  </button>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
