import React, { useState, useMemo } from 'react';
import { PageWrapper } from '../components/animations/PageWrapper';
import { 
  Users, Search, Phone, MapPin, Loader2, Edit, Trash2, Check, Camera, 
  Upload, X, Briefcase, DollarSign, Calendar, Star, 
  ChevronRight, BadgeCheck, Clock, TrendingUp, Filter, Plus, UserCircle,
  FileText
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { SearchBar } from '../components/ui/search-bar';
import { Button } from '../components/ui/button';
import { useWorkers } from '../hooks/useWorkers';
import { useOrders } from '../hooks/useOrders';
import { formatDate, formatCurrency, renderSafeNumber } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Worker, CloudinaryImage, WorkerRole, WorkerStatus, SalaryType } from '../lib/types';
import { toast } from 'sonner';
import { uploadToCloudinary } from '../lib/cloudinary';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { openWhatsApp } from '../lib/whatsapp';
import { usePlanLimits } from '../hooks/usePlanLimits';
import LimitReachedModal from '../components/LimitReachedModal';
import { WhatsAppIcon } from '../components/icons/WhatsAppIcon';

const ROLE_OPTIONS: { value: WorkerRole; label: string }[] = [
  { value: 'tailor', label: 'Tailor' },
  { value: 'master', label: 'Master' },
  { value: 'cutter', label: 'Cutter' },
  { value: 'embroidery', label: 'Embroidery' },
  { value: 'helper', label: 'Helper' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS: { value: WorkerStatus; label: string; color: string; badgeBg: string }[] = [
  { value: 'available', label: 'Available', color: 'bg-emerald-500', badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'busy', label: 'Busy', color: 'bg-amber-500', badgeBg: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'on_leave', label: 'On Leave', color: 'bg-rose-500', badgeBg: 'bg-rose-100 text-rose-800 border-rose-300' },
  { value: 'offline', label: 'Offline', color: 'bg-slate-400', badgeBg: 'bg-slate-100 text-slate-700 border-slate-300' },
];

export default function Workers() {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<WorkerRole | 'all'>('all');
  const { workers, loading, addWorker, updateWorker, deleteWorker } = useWorkers();
  const { orders } = useOrders();
  const { canAddWorker, limits, usage } = usePlanLimits();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    whatsappPhone: string;
    countryCode: string;
    role: WorkerRole;
    salaryType: SalaryType;
    salaryAmount: number;
    speciality: string;
    address: string;
    notes: string;
    joiningDate: string;
    status: WorkerStatus;
    profileImage: string | CloudinaryImage | null;
  }>({
    name: '',
    phone: '',
    whatsappPhone: '',
    countryCode: '+92',
    role: 'tailor',
    salaryType: 'monthly',
    salaryAmount: 0,
    speciality: '',
    address: '',
    notes: '',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'available',
    profileImage: null
  });

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Calculate live 100% accurate order statistics per worker
  const workerStats = useMemo(() => {
    const statsMap: Record<string, { active: number; completed: number; estimatedEarnings: number }> = {};
    
    workers.forEach(w => {
      statsMap[w.id] = { active: 0, completed: 0, estimatedEarnings: 0 };
    });

    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      const matched = workers.find(w => w.id === o.workerId || (o.workerName && w.name.toLowerCase() === o.workerName.toLowerCase()));
      if (!matched) return;

      if (!statsMap[matched.id]) {
        statsMap[matched.id] = { active: 0, completed: 0, estimatedEarnings: 0 };
      }

      if (o.status === 'delivered') {
        statsMap[matched.id].completed++;
      } else {
        statsMap[matched.id].active++;
      }

      if (matched.salaryType === 'per_suit' || matched.salaryType === 'per_order') {
        statsMap[matched.id].estimatedEarnings += Number(matched.salaryAmount || 0);
      }
    });

    // Add monthly salaries to total earnings
    workers.forEach(w => {
      if (w.salaryType === 'monthly') {
        if (statsMap[w.id]) {
          statsMap[w.id].estimatedEarnings = Number(w.salaryAmount || 0);
        }
      }
    });

    return statsMap;
  }, [workers, orders]);

  const filteredWorkers = workers.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase()) || 
                          w.phone.includes(search) || 
                          (w.speciality && w.speciality.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = filterRole === 'all' || w.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const resetForm = () => {
    setFormData({ 
      name: '', 
      phone: '', 
      whatsappPhone: '', 
      countryCode: '+92', 
      role: 'tailor',
      salaryType: 'monthly',
      salaryAmount: 0,
      speciality: '',
      address: '', 
      notes: '', 
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'available',
      profileImage: null 
    });
    setProfileImageFile(null);
    setUploadProgress(0);
  };

  const openAddModal = () => {
    if (!canAddWorker) {
      setIsLimitModalOpen(true);
      return;
    }
    resetForm();
    setIsAddOpen(true);
  };

  const openEditModal = (w: Worker) => {
    setSelectedWorker(w);
    setFormData({
      name: w.name || '',
      phone: w.phone || '',
      whatsappPhone: w.whatsappPhone || '',
      countryCode: w.countryCode || '+92',
      role: w.role || 'tailor',
      salaryType: w.salaryType === 'per_suit' ? 'per_order' : (w.salaryType || 'monthly'),
      salaryAmount: w.salaryAmount || 0,
      speciality: w.speciality || '',
      address: w.address || '',
      notes: w.notes || '',
      joiningDate: w.joiningDate ? w.joiningDate.split('T')[0] : new Date().toISOString().split('T')[0],
      status: w.status || 'available',
      profileImage: w.profileImage || null
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (w: Worker) => {
    setSelectedWorker(w);
    setIsDeleteOpen(true);
  };

  const openDetailsModal = (w: Worker) => {
    setSelectedWorker(w);
    setIsDetailsOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddWorker) {
       setIsLimitModalOpen(true);
       toast.error(`Your current plan allows up to ${limits.workers} worker(s). Please upgrade your plan.`);
       return;
    }
    if (!formData.name || !formData.phone) {
       toast.error("Name and Phone are required.");
       return;
    }
    setIsSubmitting(true);
    try {
      let finalProfileImage: string | null = null;
      if (profileImageFile) {
        const uploadedImg = await uploadToCloudinary(profileImageFile, setUploadProgress);
        finalProfileImage = typeof uploadedImg === 'string' ? uploadedImg : (uploadedImg?.url || null);
      } else {
        finalProfileImage = typeof formData.profileImage === 'string' ? formData.profileImage : (formData.profileImage?.url || null);
      }
      
      await addWorker({ ...formData, profileImage: finalProfileImage });
      setIsAddOpen(false);
      resetForm();
    } catch (e) {
      console.error("Add worker error:", e);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    if (!formData.name || !formData.phone) {
       toast.error("Name and Phone are required.");
       return;
    }
    setIsSubmitting(true);
    try {
      let finalProfileImage: string | null = null;
      if (profileImageFile) {
        const uploadedImg = await uploadToCloudinary(profileImageFile, setUploadProgress);
        finalProfileImage = typeof uploadedImg === 'string' ? uploadedImg : (uploadedImg?.url || null);
      } else {
        finalProfileImage = typeof formData.profileImage === 'string' ? formData.profileImage : (formData.profileImage?.url || null);
      }
      
      await updateWorker(selectedWorker.id, { ...formData, profileImage: finalProfileImage });
      setIsEditOpen(false);
      setSelectedWorker(null);
    } catch (e) {
      console.error("Edit worker error:", e);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedWorker) return;
    setIsSubmitting(true);
    try {
      await deleteWorker(selectedWorker.id);
      setIsDeleteOpen(false);
      setSelectedWorker(null);
    } catch (e) {
      console.error("Delete worker error:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalActiveWorkload = useMemo(() => {
    return Object.values(workerStats).reduce((acc, curr) => acc + curr.active, 0);
  }, [workerStats]);

  const totalEstimatedEarnings = useMemo(() => {
    return Object.values(workerStats).reduce((acc, curr) => acc + curr.estimatedEarnings, 0);
  }, [workerStats]);

  return (
    <PageWrapper className="p-3 sm:p-5 md:p-8 space-y-6 flex flex-col h-full bg-[#F7F5F0] min-h-screen">
      
      {/* Header Banner — Signature Emerald Theme */}
      <div className="bg-[#0D3D33] text-white rounded-[28px] p-5 sm:p-7 relative overflow-hidden shadow-2xl border border-emerald-500/20">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-[#2ECC71]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#2ECC71]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="px-3 py-1 rounded-full bg-white/15 text-white font-extrabold text-[10px] uppercase tracking-widest border border-white/20">
                STAFF DIRECTORY
              </span>
              <span className="text-xs font-bold text-[#2ECC71]">
                {usage.workers} / {limits.workers === 0 ? '∞' : limits.workers} Active Workers
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <UserCircle className="h-8 w-8 text-[#2ECC71]" />
              Tailoring Staff & Workers
            </h1>
            <p className="text-white/70 mt-1 font-medium text-xs sm:text-sm max-w-xl">
              Manage your shop's tailors, masters, and cutters. Track active workloads and handle payroll payouts seamlessly.
            </p>
          </div>

          <Button 
            onClick={openAddModal}
            className="rounded-2xl shadow-lg bg-[#2ECC71] hover:bg-[#27ae60] text-[#0D3D33] h-12 px-6 font-extrabold border-none transition-all active:scale-95 shrink-0 self-start md:self-center"
          >
            <Plus className="h-5 w-5 mr-2 stroke-[3]" />
            Add New Worker
          </Button>
        </div>
      </div>

      {/* Analytics Live Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 rounded-2xl shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Staff</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{workers.length}</h3>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-[#0D3D33] flex items-center justify-center font-bold shadow-xs">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 rounded-2xl shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Workload</p>
                <h3 className="text-2xl font-black text-amber-600 mt-1">{totalActiveWorkload} Orders</h3>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-xs">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 rounded-2xl shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Now</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">{workers.filter(w => w.status === 'available').length} Staff</h3>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
                <Check className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 rounded-2xl shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Payouts Due</p>
                <h3 className="text-2xl font-black text-[#0D3D33] mt-1">{formatCurrency(totalEstimatedEarnings)}</h3>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-[#0D3D33]/10 text-[#0D3D33] flex items-center justify-center font-bold shadow-xs">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="flex-1 w-full">
          <SearchBar 
            value={search} 
            onChange={(e: any) => setSearch(e?.target?.value || e)} 
            placeholder="Search workers by name, phone, or specialty skill..." 
            className="h-12 rounded-2xl bg-white border-none ring-1 ring-slate-200 shadow-xs"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 hide-scrollbar">
          <Button 
            variant={filterRole === 'all' ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterRole('all')}
            className={`rounded-xl text-xs font-bold h-10 ${filterRole === 'all' ? 'bg-[#0D3D33] text-white' : 'bg-white text-slate-600 border-slate-200'}`}
          >
             All Staff
          </Button>
          {ROLE_OPTIONS.map((r) => (
            <Button 
              key={r.value} 
              variant={filterRole === r.value ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterRole(r.value)}
              className={`rounded-xl text-xs font-bold h-10 capitalize shrink-0 ${filterRole === r.value ? 'bg-[#0D3D33] text-white' : 'bg-white text-slate-600 border-slate-200'}`}
            >
               {r.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse h-[220px] bg-slate-100/60 border-none rounded-3xl" />
          ))
        ) : filteredWorkers.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 text-slate-500 shadow-sm p-6">
            <UserCircle className="h-16 w-16 mx-auto mb-4 opacity-40 text-[#0D3D33]" />
            <p className="text-xl font-extrabold text-slate-800">No staff members found</p>
            <p className="mt-1 text-sm text-slate-500">Add your tailoring staff members to assign orders and manage payouts.</p>
            <Button className="mt-6 bg-[#0D3D33] hover:bg-[#092B24] text-white rounded-2xl font-bold h-11 px-6" onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-2" /> Add First Worker
            </Button>
          </div>
        ) : (
          filteredWorkers.map((worker) => {
            const stats = workerStats[worker.id] || { active: 0, completed: 0, estimatedEarnings: 0 };
            const statusConfig = STATUS_OPTIONS.find(s => s.value === worker.status) || STATUS_OPTIONS[0];

            return (
              <motion.div
                key={worker.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
              >
                <Card 
                  className="group border border-slate-200/90 hover:border-[#2ECC71]/50 shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden bg-white rounded-3xl relative flex flex-col justify-between"
                  onClick={() => openDetailsModal(worker)}
                >
                  <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      {/* Top Header Row: Status Badge */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusConfig.badgeBg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.color} mr-1.5`} />
                          {statusConfig.label}
                        </span>

                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          {worker.role}
                        </span>
                      </div>

                      {/* Info Section */}
                      <div className="flex gap-3.5 items-start">
                        {worker.profileImage ? (
                          <img 
                            src={typeof worker.profileImage === 'string' ? worker.profileImage : worker.profileImage.url} 
                            className="h-14 w-14 rounded-2xl object-cover border-2 border-slate-100 shadow-sm bg-slate-50 shrink-0" 
                            alt={worker.name} 
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-2xl bg-[#0D3D33]/10 text-[#0D3D33] flex items-center justify-center font-black text-2xl shadow-sm border border-emerald-500/20 shrink-0">
                            {worker.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h3 className="font-extrabold text-base text-slate-900 truncate leading-tight group-hover:text-[#0D3D33] transition-colors">
                            {worker.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                            📞 {worker.phone || 'No phone'}
                          </p>
                          {worker.speciality && (
                            <p className="text-[11px] text-emerald-700 font-bold mt-0.5 truncate">
                              ✨ {worker.speciality}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Workload Stats Box */}
                      <div className="grid grid-cols-2 gap-2 mt-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Active Stitching</span>
                          <span className="text-sm font-black text-amber-600">{stats.active} Suits</span>
                        </div>
                        <div className="border-l border-slate-200">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Delivered</span>
                          <span className="text-sm font-black text-emerald-600">{stats.completed} Suits</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                      <div className="text-xs font-bold text-slate-700">
                        <span className="text-slate-400 font-medium text-[10px] block uppercase">Pay Structure</span>
                        <span className="text-[#0D3D33] font-extrabold text-xs">
                          {worker.salaryType === 'monthly' ? `${formatCurrency(worker.salaryAmount)}/mo` : `${formatCurrency(worker.salaryAmount)}/suit`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 px-2.5 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10 rounded-xl font-bold text-xs flex items-center gap-1 shrink-0"
                          onClick={() => openWhatsApp(worker.whatsappPhone || worker.phone)}
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 fill-current text-emerald-500" />
                          Chat
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 px-2.5 text-slate-700 rounded-xl font-bold text-xs"
                          onClick={() => openEditModal(worker)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 px-2.5 text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl font-bold text-xs"
                          onClick={() => openDeleteModal(worker)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add Worker Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-[#0D3D33]">Add New Staff Worker</DialogTitle>
            <DialogDescription>Create a profile for your tailor, master, or cutter to assign orders and track payouts.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-6 mt-4">
            <div className="space-y-6">
              {/* Profile Image Upload */}
              <div className="flex items-center gap-6 py-4 border-b">
                 <div className="relative group shrink-0">
                    <label className="relative flex w-24 h-24 rounded-3xl bg-slate-50 border-2 border-dashed border-[#0D3D33]/30 items-center justify-center overflow-hidden shadow-inner cursor-pointer hover:bg-emerald-500/5 transition-colors">
                       {profileImageFile || formData.profileImage ? (
                         <img 
                           src={profileImageFile ? URL.createObjectURL(profileImageFile) : (typeof formData.profileImage === 'string' ? formData.profileImage : formData.profileImage?.url)} 
                           className="w-full h-full object-cover" 
                           referrerPolicy="no-referrer"
                           alt="preview" 
                         />
                       ) : (
                         <div className="flex flex-col items-center gap-1">
                           <Camera className="w-8 h-8 text-slate-400 group-hover:scale-110 transition-transform" />
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Photo</span>
                         </div>
                       )}
                       <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={e => e.target.files?.[0] && setProfileImageFile(e.target.files[0])}
                       />
                    </label>
                    {(profileImageFile || formData.profileImage) && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setProfileImageFile(null);
                          setFormData(prev => ({ ...prev, profileImage: null }));
                        }}
                        className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1.5 shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                 </div>
                 <div className="flex-1 space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-900">Worker Profile Picture</h4>
                    <p className="text-xs text-slate-500">Upload a clear photo. This appears when assigning orders and viewing staff rosters.</p>
                    {uploadProgress > 0 && (
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          className="h-full bg-[#2ECC71]"
                        />
                      </div>
                    )}
                 </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Full Name <span className="text-rose-500">*</span></label>
                  <Input required placeholder="e.g. Master Ustad Ahmed" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Phone Number <span className="text-rose-500">*</span></label>
                  <Input required placeholder="0300 1234567" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">WhatsApp Number</label>
                  <Input placeholder="Leave empty if same as primary phone" value={formData.whatsappPhone} onChange={e => setFormData({...formData, whatsappPhone: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Address / City</label>
                  <Input placeholder="Home address or shop branch" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="h-12 rounded-xl" />
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Worker Role</label>
                  <select 
                    className="w-full h-12 rounded-xl border border-input bg-card px-4 text-sm font-semibold focus:ring-2 focus:ring-[#0D3D33] outline-none capitalize"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as WorkerRole})}
                  >
                    {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Speciality / Skill</label>
                  <Input placeholder="e.g. Kurta Specialist, Sherwani Master" value={formData.speciality} onChange={e => setFormData({...formData, speciality: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Joining Date</label>
                  <Input type="date" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} className="h-12 rounded-xl py-2" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Current Status</label>
                  <select 
                    className="w-full h-12 rounded-xl border border-input bg-card px-4 text-sm font-semibold focus:ring-2 focus:ring-[#0D3D33] outline-none capitalize"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as WorkerStatus})}
                  >
                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Salary Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase">Salary Structure</label>
                    <div className="flex gap-2">
                       <Button 
                        type="button" 
                        variant={formData.salaryType === 'monthly' ? 'default' : 'outline'} 
                        className={`flex-1 rounded-xl h-11 font-bold ${formData.salaryType === 'monthly' ? 'bg-[#0D3D33] text-white' : ''}`}
                        onClick={() => setFormData({...formData, salaryType: 'monthly'})}
                       >Monthly Salary</Button>
                       <Button 
                        type="button" 
                        variant={formData.salaryType === 'per_order' ? 'default' : 'outline'} 
                        className={`flex-1 rounded-xl h-11 font-bold ${formData.salaryType === 'per_order' ? 'bg-[#0D3D33] text-white' : ''}`}
                        onClick={() => setFormData({...formData, salaryType: 'per_order'})}
                       >Per Suit Rate</Button>
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase">
                      {formData.salaryType === 'monthly' ? 'Monthly Salary (PKR)' : 'Rate Per Suit (PKR)'}
                    </label>
                    <div className="relative">
                       <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <Input 
                        type="number" 
                        placeholder="e.g. 35000" 
                        className="pl-9 h-12 rounded-xl font-bold" 
                        value={formData.salaryAmount || ''}
                        onChange={e => setFormData({...formData, salaryAmount: Number(e.target.value)})}
                       />
                    </div>
                 </div>
              </div>

              <div className="space-y-1.5 pt-4 border-t">
                <label className="text-xs font-bold text-slate-600 uppercase">Notes & Remarks</label>
                <Textarea placeholder="Additional notes regarding salary, shifts, or tailoring expertise..." className="rounded-xl p-3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-8">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl h-12 px-8 font-bold">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl h-12 px-10 font-bold bg-[#0D3D33] hover:bg-[#092B24] text-white shadow-lg">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                Save Worker Profile
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Worker Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-[#0D3D33]">Edit Worker Profile</DialogTitle>
            <DialogDescription>Update {selectedWorker?.name}'s information, role, or salary details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6 mt-4">
            <div className="space-y-6">
              {/* Profile Image Section */}
              <div className="flex flex-col items-center gap-4 py-4 border-b text-center">
                 <div className="relative group mx-auto">
                    <div className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-dashed border-[#0D3D33]/30 flex items-center justify-center overflow-hidden shadow-inner">
                       {profileImageFile ? (
                         <img src={URL.createObjectURL(profileImageFile)} className="w-full h-full object-cover" alt="preview" />
                       ) : formData.profileImage ? (
                         <img src={typeof formData.profileImage === 'string' ? formData.profileImage : formData.profileImage.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="current" />
                       ) : (
                         <Camera className="w-8 h-8 text-slate-400 group-hover:scale-110 transition-transform" />
                       )}
                       <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={e => e.target.files?.[0] && setProfileImageFile(e.target.files[0])}
                       />
                    </div>
                    {(profileImageFile || formData.profileImage) && (
                      <button 
                        type="button" 
                        onClick={() => {
                           setProfileImageFile(null);
                           setFormData(prev => ({...prev, profileImage: null}));
                        }}
                        className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1.5 shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                 </div>
                 <div>
                    <Button type="button" variant="outline" size="sm" className="mt-2 text-xs rounded-xl h-8 font-bold">Change Photo</Button>
                    {uploadProgress > 0 && (
                      <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3 mx-auto">
                        <div className="bg-[#2ECC71] h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    )}
                 </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Full Name <span className="text-rose-500">*</span></label>
                  <Input required placeholder="Enter worker's full name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Phone Number <span className="text-rose-500">*</span></label>
                  <Input required placeholder="0300 1234567" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">WhatsApp Number</label>
                  <Input placeholder="Leave empty if same as phone" value={formData.whatsappPhone} onChange={e => setFormData({...formData, whatsappPhone: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Address / City</label>
                  <Input placeholder="Home address or branch" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="h-12 rounded-xl" />
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Worker Role</label>
                  <select 
                    className="w-full h-12 rounded-xl border border-input bg-card px-4 text-sm font-semibold focus:ring-2 focus:ring-[#0D3D33] outline-none capitalize"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as WorkerRole})}
                  >
                    {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Speciality / Skill</label>
                  <Input placeholder="e.g. Kurta Specialist, Sherwani Master" value={formData.speciality} onChange={e => setFormData({...formData, speciality: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Current Status</label>
                  <select 
                    className="w-full h-12 rounded-xl border border-input bg-card px-4 text-sm font-semibold focus:ring-2 focus:ring-[#0D3D33] outline-none capitalize"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as WorkerStatus})}
                  >
                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Joining Date</label>
                  <Input type="date" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} className="h-12 rounded-xl py-2" />
                </div>
              </div>

              {/* Salary Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase">Salary Structure</label>
                    <div className="flex gap-2">
                       <Button 
                        type="button" 
                        variant={formData.salaryType === 'monthly' ? 'default' : 'outline'} 
                        className={`flex-1 rounded-xl h-11 font-bold ${formData.salaryType === 'monthly' ? 'bg-[#0D3D33] text-white' : ''}`}
                        onClick={() => setFormData({...formData, salaryType: 'monthly'})}
                       >Monthly Salary</Button>
                       <Button 
                        type="button" 
                        variant={formData.salaryType === 'per_order' ? 'default' : 'outline'} 
                        className={`flex-1 rounded-xl h-11 font-bold ${formData.salaryType === 'per_order' ? 'bg-[#0D3D33] text-white' : ''}`}
                        onClick={() => setFormData({...formData, salaryType: 'per_order'})}
                       >Per Suit Rate</Button>
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase">
                      {formData.salaryType === 'monthly' ? 'Monthly Salary (PKR)' : 'Rate Per Suit (PKR)'}
                    </label>
                    <div className="relative">
                       <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="pl-9 h-12 rounded-xl font-bold" 
                        value={formData.salaryAmount || ''}
                        onChange={e => setFormData({...formData, salaryAmount: Number(e.target.value)})}
                       />
                    </div>
                 </div>
              </div>

              <div className="space-y-1.5 pt-4 border-t">
                <label className="text-xs font-bold text-slate-600 uppercase">Notes & Remarks</label>
                <Textarea placeholder="Additional information..." className="rounded-xl p-3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-8">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-xl h-12 px-8 font-bold">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl h-12 px-10 font-bold bg-[#0D3D33] hover:bg-[#092B24] text-white shadow-lg">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                Update Worker Profile
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-slate-900">Delete Staff Profile</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
             <p className="text-sm text-slate-700">Are you sure you want to remove <strong>{selectedWorker?.name}</strong> from your active staff directory?</p>
             <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-3 rounded-xl border border-rose-200">
               This will unassign their profile from future orders. Historical completed orders remain intact.
             </p>
          </div>
          <DialogFooter className="mt-4">
             <Button type="button" variant="ghost" className="h-11 rounded-xl font-bold" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
             <Button variant="destructive" className="h-11 rounded-xl font-bold bg-rose-600 hover:bg-rose-700" onClick={handleDeleteSubmit} disabled={isSubmitting}>
               {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
               Confirm Delete
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Limit Modal */}
      <LimitReachedModal 
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        limitType="workers"
        current={usage.workers}
        limit={limits.workers}
      />
    </PageWrapper>
  );
}
