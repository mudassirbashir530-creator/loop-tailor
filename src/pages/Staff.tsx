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
    <div className={cn("page pb-[100px]", isRTL && "font-urdu")} dir={isRTL ? "rtl" : "ltr"}>
      {/* Top Bar */}
      <div className="bg-white border-b border-[#E2DDD6] px-4 py-4 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-xl font-bold text-[#111111]">Team & Staff</h1>
        <button 
          onClick={() => handleOpenModal()} 
          className="text-[#0D3D33] font-bold text-sm bg-white border border-[#E2DDD6] px-3 py-1.5 rounded-lg flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
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
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="card !m-0 !p-0 overflow-hidden shadow-sm !border-[#E2DDD6]">
                      <div className="px-4 py-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-[#F7F5F0] border border-[#E2DDD6] flex items-center justify-center">
                              <span className="text-xl font-bold text-[#0D3D33] uppercase">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-bold text-[16px] text-[#111111]">{member.name}</h3>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-[#555555] uppercase tracking-widest mt-0.5">
                                <RoleIcon className="h-3 w-3" />
                                {member.role}
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleOpenModal(member)}
                            className="h-8 w-8 rounded-lg bg-[#F7F5F0] border border-[#E2DDD6] text-[#555555] flex items-center justify-center"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="pt-3 border-t border-[#E2DDD6] grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-[10px] font-bold text-[#888888] uppercase tracking-widest mb-1">Phone</div>
                            <div className="text-[13px] font-bold text-[#111111]">{member.phone || 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-[#888888] uppercase tracking-widest mb-1">Salary / Rate</div>
                            <div className="text-[13px] font-bold text-[#111111] flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-[#2ECC71]" />
                              {member.salaryAmount} <span className="text-[10px] text-[#555555]">({member.salaryType === 'fixed' ? 'Monthly' : 'Per Order'})</span>
                            </div>
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
                          <div className="px-4 py-3 bg-[#F7F5F0] border-t border-[#E2DDD6]">
                             <div className="grid grid-cols-2 gap-4">
                               <div>
                                 <div className="text-[10px] font-bold text-[#888888] uppercase tracking-widest mb-1">Total Earned</div>
                                 <div className="text-sm font-bold text-[#111111]">${totalEarned}</div>
                               </div>
                               <div>
                                 <div className="text-[10px] font-bold text-[#888888] uppercase tracking-widest mb-1">Pending Pay</div>
                                 <div className={cn("text-sm font-bold", totalPending > 0 ? "text-[#E53935]" : "text-[#111111]")}>${totalPending}</div>
                               </div>
                             </div>
                             {pendingEntries.length > 0 && (
                               <div className="space-y-2 mt-3 pt-3 border-t border-[#E2DDD6]">
                                 <div className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Pending Payouts ({pendingEntries.length})</div>
                                 <div className="space-y-2 max-h-32 overflow-y-auto">
                                   {pendingEntries.map(entry => (
                                      <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E2DDD6]">
                                        <div>
                                          <div className="text-[11px] font-bold text-[#111111]">Order #{entry.tokenId}</div>
                                          <div className="text-[10px] text-[#2ECC71] font-bold">Amt: ${entry.paymentAmount}</div>
                                        </div>
                                        <button
                                          onClick={() => handleMarkAsPaid(entry.id)}
                                          className="h-6 text-[10px] px-2 font-bold rounded bg-[#0D3D33] text-white"
                                        >
                                          Mark Paid
                                        </button>
                                      </div>
                                   ))}
                                 </div>
                               </div>
                             )}
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
