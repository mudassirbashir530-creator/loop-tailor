import React, { useState, useEffect } from 'react';
import { useStaff, StaffMember } from '../hooks/useStaff';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, Loader2, Users, Scissors, Pocket, UserCircle, Edit2, Trash2, Shield, DollarSign, Wallet, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function Staff() {
  const { user } = useAuth();
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

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(collection(db, 'shops', user.uid, 'payroll'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayrollEntries(data);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'payroll'));
    
    return () => unsubscribe();
  }, [user]);

  const handleMarkAsPaid = async (payrollId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'shops', user.uid, 'payroll', payrollId), {
        paidStatus: 'paid',
        paidAt: serverTimestamp()
      });
      toast.success('Marked as paid');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `payroll/${payrollId}`);
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

  return (
    <div className={cn("space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-0", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Team & Staff</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your tailors, cutters, and workers.</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()} 
          className="w-full sm:w-auto h-12 rounded-2xl bg-brand-primary text-white font-black shadow-neu hover:shadow-neu-pressed transition-all"
        >
          <Plus className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} /> Add Staff
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <div className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors", isRTL ? "right-4" : "left-4")}>
            <Search className="h-5 w-5" />
          </div>
          <Input 
            type="text"
            placeholder="Search team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn("w-full h-14 rounded-2xl bg-gray-100 shadow-neu-pressed-sm border-none text-base font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-20 bg-gray-100 rounded-[2rem] shadow-neu-pressed-sm">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">No staff found</h3>
            <p className="text-slate-500">Add team members to assign them to orders.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredStaff.map((member, idx) => {
                const RoleIcon = roleIcons[member.role] || UserCircle;
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="border-none shadow-neu hover:shadow-neu-pressed transition-all duration-300 bg-gray-100 rounded-[2rem] overflow-hidden group">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-gray-100 shadow-neu-pressed-sm flex items-center justify-center">
                              <span className="text-xl font-black text-brand-primary uppercase">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-black text-lg text-slate-900 group-hover:text-brand-primary transition-colors">{member.name}</h3>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                <RoleIcon className="h-3.5 w-3.5" />
                                {member.role}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleOpenModal(member)}
                              className="h-8 w-8 rounded-xl bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-200/50 mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Phone</div>
                            <div className="text-sm font-medium text-slate-900">{member.phone || 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Salary / Rate</div>
                            <div className="text-sm font-medium text-slate-900 flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5 text-brand-primary" />
                              {member.salaryAmount} <span className="text-xs text-slate-500">({member.salaryType === 'fixed' ? 'Monthly' : 'Per Order'})</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Payroll Summary Snippet */}
                        {(() => {
                          const memberPayroll = payrollEntries.filter(p => p.staffId === member.id);
                          const totalEarned = memberPayroll.reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);
                          const totalPaid = memberPayroll.filter(p => p.paidStatus === 'paid').reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);
                          const pendingEntries = memberPayroll.filter(p => p.paidStatus === 'pending');
                          const totalPending = totalEarned - totalPaid;
                          
                          return (
                            <div className="pt-4 border-t border-gray-200/50 mt-4 grid grid-cols-2 gap-4 bg-gray-100 min-h-[60px]">
                               <div>
                                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Earned</div>
                                 <div className="text-sm font-black text-slate-900">{totalEarned}</div>
                               </div>
                               <div>
                                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pending Pay</div>
                                 <div className={cn("text-sm font-black", totalPending > 0 ? "text-amber-600" : "text-slate-900")}>{totalPending}</div>
                               </div>
                               {pendingEntries.length > 0 && (
                                 <div className="col-span-2 space-y-2 mt-2">
                                   <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending Payouts ({pendingEntries.length})</div>
                                   <div className="space-y-2 max-h-32 overflow-y-auto">
                                     {pendingEntries.map(entry => (
                                        <div key={entry.id} className="flex items-center justify-between p-2 rounded-xl bg-white shadow-neu-sm border border-gray-200/50">
                                          <div>
                                            <div className="text-xs font-bold text-slate-900">Order #{entry.tokenId}</div>
                                            <div className="text-[10px] text-brand-primary font-bold">Amt: {entry.paymentAmount}</div>
                                          </div>
                                          <Button
                                            size="sm"
                                            onClick={() => handleMarkAsPaid(entry.id)}
                                            className="h-7 text-[10px] px-3 font-black rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 shadow-neu-sm"
                                          >
                                            Mark Paid
                                          </Button>
                                        </div>
                                     ))}
                                   </div>
                                 </div>
                               )}
                            </div>
                           );
                        })()}
                      </CardContent>
                    </Card>
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
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-gray-100 rounded-[2rem] shadow-2xl p-6 sm:p-8"
            >
              <h2 className="text-2xl font-black mb-6">{editingStaff ? 'Edit Staff Member' : 'Add New Staff'}</h2>
              
              <form onSubmit={handleSave} className="space-y-4 lg:space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Name</label>
                  <Input 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter name"
                    className="h-12 rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none px-4 font-bold focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Phone</label>
                  <Input 
                    required
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="Phone number"
                    className="h-12 rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none px-4 font-bold focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                    className="h-12 w-full rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  >
                    <option value="Cutter">Cutter</option>
                    <option value="Stitcher">Stitcher</option>
                    <option value="Finisher">Finisher</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Salary Type</label>
                  <select
                    value={formData.salaryType}
                    onChange={(e) => setFormData({...formData, salaryType: e.target.value as any})}
                    className="h-12 w-full rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  >
                    <option value="fixed">Fixed Monthly</option>
                    <option value="per-order">Per Order</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Salary / Rate Amount</label>
                  <Input 
                    type="number"
                    min="0"
                    required
                    value={formData.salaryAmount} 
                    onChange={e => setFormData({...formData, salaryAmount: Number(e.target.value)})}
                    placeholder="0"
                    className="h-12 rounded-xl bg-gray-100 shadow-neu-pressed-sm border-none px-4 font-bold focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>
                
                <div className="pt-4 flex gap-3">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="flex-1 h-12 rounded-xl bg-brand-primary text-white font-black shadow-neu-sm hover:shadow-neu-pressed-sm transition-all"
                  >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Staff'}
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 h-12 rounded-xl bg-gray-100 text-slate-700 font-black shadow-neu-sm hover:shadow-neu-pressed-sm transition-all border-none hover:bg-gray-100"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
                {editingStaff && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => handleDelete(editingStaff.id)}
                    className="w-full mt-2 h-12 rounded-xl text-rose-500 font-black hover:bg-rose-50 hover:text-rose-600 border-none justify-center items-center flex"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Remove Staff Member
                  </Button>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
