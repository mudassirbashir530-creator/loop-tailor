import React, { useState } from 'react';
import { 
  Users, Search, Phone, MapPin, Loader2, Edit, Trash2, Check, Camera, 
  Upload, X, MessageSquare, Briefcase, DollarSign, Calendar, Star, 
  ChevronRight, BadgeCheck, Clock, TrendingUp, Filter, Plus, UserCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { SearchBar } from '../components/ui/search-bar';
import { Button } from '../components/ui/button';
import { useWorkers } from '../hooks/useWorkers';
import { formatDate, formatCurrency } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Worker, CloudinaryImage, WorkerRole, WorkerStatus, SalaryType } from '../lib/types';
import { toast } from 'sonner';
import { uploadToCloudinary } from '../lib/cloudinary';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { openWhatsApp } from '../lib/whatsapp';

const ROLE_OPTIONS: { value: WorkerRole; label: string }[] = [
  { value: 'tailor', label: 'Tailor' },
  { value: 'master', label: 'Master' },
  { value: 'cutter', label: 'Cutter' },
  { value: 'embroidery', label: 'Embroidery' },
  { value: 'helper', label: 'Helper' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS: { value: WorkerStatus; label: string; color: string }[] = [
  { value: 'available', label: 'Available', color: 'bg-green-500' },
  { value: 'busy', label: 'Busy', color: 'bg-amber-500' },
  { value: 'on_leave', label: 'On Leave', color: 'bg-red-500' },
  { value: 'offline', label: 'Offline', color: 'bg-slate-500' },
];

export default function Workers() {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<WorkerRole | 'all'>('all');
  const { workers, loading, addWorker, updateWorker, deleteWorker } = useWorkers();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
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

  const filteredWorkers = workers.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase()) || w.phone.includes(search);
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

  const handleQuickStatusChange = async (id: string, status: WorkerStatus) => {
     try {
       await updateWorker(id, { status });
     } catch (e) {
       console.error("Quick status change error:", e);
     }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-24">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Worker Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Manage your tailoring staff, track performance, and handle salaries.</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto shadow-lg shadow-primary/20" onClick={openAddModal}>
          <Plus className="h-5 w-5" />
          Add New Worker
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
                <h3 className="text-2xl font-bold mt-1">{workers.length}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                 <Users className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Workload</p>
                <h3 className="text-2xl font-bold mt-1">{workers.reduce((acc, w) => acc + (w.activeOrders || 0), 0)}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                 <Briefcase className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Now</p>
                <h3 className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">{workers.filter(w => w.status === 'available').length}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                 <Check className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Payouts</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(workers.reduce((acc, w) => acc + (w.totalEarnings || 0), 0))}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                 <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <SearchBar 
            value={search} 
            onChange={(e: any) => setSearch(e?.target?.value || e)} 
            placeholder="Search workers by name, phone or skill..." 
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {['all', ...ROLE_OPTIONS.map(r => r.value)].map((role) => (
            <Button 
              key={role} 
              variant={filterRole === role ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterRole(role as any)}
              className="capitalize"
            >
               {role}
            </Button>
          ))}
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse h-[200px] bg-muted/20 border-none shadow-sm" />
          ))
        ) : filteredWorkers.length === 0 ? (
          <div className="col-span-full text-center py-24 bg-card rounded-3xl border border-dashed border-muted-foreground/20 text-muted-foreground shadow-sm">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50 text-primary" />
            <p className="text-xl font-semibold text-foreground">No workers found</p>
            <p className="mt-2 text-sm">Add your staff members to manage their work and payouts.</p>
            <Button variant="outline" className="mt-6" onClick={openAddModal}>Add First Worker</Button>
          </div>
        ) : (
          filteredWorkers.map((worker) => (
            <motion.div
              key={worker.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                className="group border-none shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden bg-card"
                onClick={() => openDetailsModal(worker)}
              >
                <div className="relative h-2 bg-muted overflow-hidden">
                   <div 
                     className={cn("h-full transition-all duration-1000", STATUS_OPTIONS.find(s => s.value === worker.status)?.color)}
                    />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="relative">
                        {worker.profileImage ? (
                          <img 
                            src={typeof worker.profileImage === 'string' ? worker.profileImage : worker.profileImage.url} 
                            className="h-16 w-16 rounded-2xl object-cover border-2 border-background shadow-md bg-muted" 
                            alt={worker.name} 
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl shadow-md border-2 border-background">
                            {worker.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card shadow-sm",
                          STATUS_OPTIONS.find(s => s.value === worker.status)?.color
                        )} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{worker.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground capitalize">
                          <Briefcase className="h-3 w-3" />
                          {worker.role} {worker.speciality && `• ${worker.speciality}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <div className="bg-muted/40 rounded-xl p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Active</p>
                      <p className="text-lg font-bold text-foreground">{worker.activeOrders || 0}</p>
                    </div>
                    <div className="bg-muted/40 rounded-xl p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Completed</p>
                      <p className="text-lg font-bold text-foreground">{worker.completedOrders || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                    <div className="text-sm font-medium">
                       <span className="text-muted-foreground">Payout: </span>
                       <span className="text-primary font-bold">
                         {worker.salaryType === 'monthly' ? `${formatCurrency(worker.salaryAmount)}/mo` : `${formatCurrency(worker.salaryAmount)}/order`}
                       </span>
                    </div>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                       <Button variant="ghost" className="h-11 w-11 p-2 flex items-center justify-center rounded-full" onClick={() => openWhatsApp(worker.phone)}>
                          <MessageSquare className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" className="h-11 w-11 p-2 flex items-center justify-center rounded-full" onClick={() => openEditModal(worker)}>
                          <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" className="h-11 w-11 p-2 flex items-center justify-center rounded-full text-destructive hover:bg-destructive/10" onClick={() => openDeleteModal(worker)}>
                          <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Worker Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add New Worker</DialogTitle>
            <DialogDescription>Create a new profile for your tailoring staff. Enter their role, contact info and salary details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-6 mt-4">
            <div className="space-y-6">
              {/* Profile Image Section */}
              <div className="flex items-center gap-6 py-4 border-b">
                 <div className="relative group shrink-0">
                    <label className="relative flex w-24 h-24 rounded-3xl bg-muted border-2 border-dashed border-primary/30 items-center justify-center overflow-hidden shadow-inner cursor-pointer hover:bg-primary/5 transition-colors">
                       {profileImageFile || formData.profileImage ? (
                         <img 
                           src={profileImageFile ? URL.createObjectURL(profileImageFile) : (typeof formData.profileImage === 'string' ? formData.profileImage : formData.profileImage?.url)} 
                           className="w-full h-full object-cover" 
                           referrerPolicy="no-referrer"
                           alt="preview" 
                         />
                       ) : (
                         <div className="flex flex-col items-center gap-1">
                           <Camera className="w-8 h-8 text-muted-foreground group-hover:scale-110 transition-transform" />
                           <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Upload</span>
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
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                 </div>
                 <div className="flex-1 space-y-2">
                    <h4 className="font-bold text-sm">Worker Profile Picture</h4>
                    <p className="text-xs text-muted-foreground">Select a clear profile picture for this worker. This will be shown during order assignment.</p>
                    {uploadProgress > 0 && (
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          className="h-full bg-primary"
                        />
                      </div>
                    )}
                 </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Full Name <span className="text-red-500">*</span></label>
                  <Input required placeholder="Enter worker's full name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Phone Number <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <select className="w-24 h-11 rounded-xl border border-input bg-card px-3 text-sm focus:ring-2 focus:ring-primary outline-none">
                       <option value="+92">+92 (PK)</option>
                       <option value="+91">+91 (IN)</option>
                       <option value="+44">+44 (UK)</option>
                       <option value="+1">+1 (US)</option>
                    </select>
                    <Input required placeholder="0300 1234567" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="flex-1 h-11 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">WhatsApp Number</label>
                  <Input placeholder="Leave empty if same as phone" value={formData.whatsappPhone} onChange={e => setFormData({...formData, whatsappPhone: e.target.value})} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Address</label>
                  <Input placeholder="Home address or area" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="h-11 rounded-xl" />
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Worker Role</label>
                  <select 
                    className="w-full h-11 rounded-xl border border-input bg-card px-4 text-sm focus:ring-2 focus:ring-primary outline-none capitalize"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as WorkerRole})}
                  >
                    {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Speciality / Skill</label>
                  <Input placeholder="e.g. Kurta Specialist, Sherwani" value={formData.speciality} onChange={e => setFormData({...formData, speciality: e.target.value})} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Joining Date</label>
                  <Input type="date" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} className="h-11 rounded-xl h-auto py-2" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Current Status</label>
                  <select 
                    className="w-full h-11 rounded-xl border border-input bg-card px-4 text-sm focus:ring-2 focus:ring-primary outline-none capitalize"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as WorkerStatus})}
                  >
                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Salary Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                 <div className="space-y-2">
                    <label className="text-sm font-semibold">Salary Type</label>
                    <div className="flex gap-2">
                       <Button 
                        type="button" 
                        variant={formData.salaryType === 'monthly' ? 'default' : 'outline'} 
                        className="flex-1 rounded-xl"
                        onClick={() => setFormData({...formData, salaryType: 'monthly'})}
                       >Monthly</Button>
                       <Button 
                        type="button" 
                        variant={formData.salaryType === 'per_order' ? 'default' : 'outline'} 
                        className="flex-1 rounded-xl"
                        onClick={() => setFormData({...formData, salaryType: 'per_order'})}
                       >Per Order</Button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      {formData.salaryType === 'monthly' ? 'Monthly Salary Amount' : 'Amount Per Order'}
                    </label>
                    <div className="relative">
                       <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="pl-9 h-11 rounded-xl" 
                        value={formData.salaryAmount || ''}
                        onChange={e => setFormData({...formData, salaryAmount: Number(e.target.value)})}
                       />
                    </div>
                 </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-semibold">Notes</label>
                <Textarea placeholder="Additional information about worker..." className="rounded-xl" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-8">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl h-11 px-8">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl h-11 px-10 shadow-lg shadow-primary/20">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                Add Worker Profile
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Worker Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Worker Profile</DialogTitle>
            <DialogDescription>Update {selectedWorker?.name}'s information, role, or salary details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6 mt-4">
            <div className="space-y-6">
              {/* Profile Image Section */}
              <div className="flex flex-col items-center gap-4 py-4 border-b text-center">
                 <div className="relative group mx-auto">
                    <div className="w-24 h-24 rounded-3xl bg-muted border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden shadow-inner">
                       {profileImageFile ? (
                         <img src={URL.createObjectURL(profileImageFile)} className="w-full h-full object-cover" alt="preview" />
                       ) : formData.profileImage ? (
                         <img src={typeof formData.profileImage === 'string' ? formData.profileImage : formData.profileImage.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="current" />
                       ) : (
                         <Camera className="w-8 h-8 text-muted-foreground group-hover:scale-110 transition-transform" />
                       )}
                       <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={e => e.target.files?.[0] && setProfileImageFile(e.target.files[0])}
                       />
                    </div>
                    { (profileImageFile || formData.profileImage) && (
                      <button 
                        type="button" 
                        onClick={() => {
                           setProfileImageFile(null);
                           setFormData(prev => ({...prev, profileImage: null}));
                        }}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1.5 shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                 </div>
                 <div>
                    <Button variant="outline" size="sm" className="mt-2 text-xs rounded-xl h-8">Change Photo</Button>
                    {uploadProgress > 0 && (
                      <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden mt-3 mx-auto">
                        <div className="bg-primary h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    )}
                 </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Full Name <span className="text-red-500">*</span></label>
                  <Input required placeholder="Enter worker's full name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Phone Number <span className="text-red-500">*</span></label>
                  <Input required placeholder="0300 1234567" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">WhatsApp Number</label>
                  <Input placeholder="Leave empty if same as phone" value={formData.whatsappPhone} onChange={e => setFormData({...formData, whatsappPhone: e.target.value})} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Address</label>
                  <Input placeholder="Home address or area" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="h-11 rounded-xl" />
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Worker Role</label>
                  <select 
                    className="w-full h-11 rounded-xl border border-input bg-card px-4 text-sm focus:ring-2 focus:ring-primary outline-none capitalize"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as WorkerRole})}
                  >
                    {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Speciality / Skill</label>
                  <Input placeholder="e.g. Kurta Specialist, Sherwani" value={formData.speciality} onChange={e => setFormData({...formData, speciality: e.target.value})} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Current Status</label>
                  <select 
                    className="w-full h-11 rounded-xl border border-input bg-card px-4 text-sm focus:ring-2 focus:ring-primary outline-none capitalize"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as WorkerStatus})}
                  >
                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                 <div className="space-y-2">
                  <label className="text-sm font-semibold">Joining Date</label>
                  <Input type="date" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} className="h-11 rounded-xl h-auto py-2" />
                </div>
              </div>

              {/* Salary Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                 <div className="space-y-2">
                    <label className="text-sm font-semibold">Salary Type</label>
                    <div className="flex gap-2">
                       <Button 
                        type="button" 
                        variant={formData.salaryType === 'monthly' ? 'default' : 'outline'} 
                        className="flex-1 rounded-xl"
                        onClick={() => setFormData({...formData, salaryType: 'monthly'})}
                       >Monthly</Button>
                       <Button 
                        type="button" 
                        variant={formData.salaryType === 'per_order' ? 'default' : 'outline'} 
                        className="flex-1 rounded-xl"
                        onClick={() => setFormData({...formData, salaryType: 'per_order'})}
                       >Per Order</Button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      {formData.salaryType === 'monthly' ? 'Monthly Salary Amount' : 'Amount Per Order'}
                    </label>
                    <div className="relative">
                       <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="pl-9 h-11 rounded-xl" 
                        value={formData.salaryAmount || ''}
                        onChange={e => setFormData({...formData, salaryAmount: Number(e.target.value)})}
                       />
                    </div>
                 </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-semibold">Notes</label>
                <Textarea placeholder="Additional information..." className="rounded-xl" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-8">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-xl h-11 px-8">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl h-11 px-10 shadow-lg shadow-primary/20">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                Update Profile
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Delete Worker Profile?</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
             <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
             </div>
             <p className="text-foreground font-medium">This will permanently remove <strong>{selectedWorker?.name}</strong> from your records.</p>
             <p className="text-sm text-muted-foreground mt-2">Active orders assigned to this worker will remain, but the name might be lost. This cannot be undone.</p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
             <Button type="button" variant="ghost" className="flex-1 rounded-xl" onClick={() => setIsDeleteOpen(false)}>No, Keep Worker</Button>
             <Button variant="destructive" className="flex-1 rounded-xl" onClick={handleDeleteSubmit} disabled={isSubmitting}>
               {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
               Yes, Delete
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Worker Details View */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-[480px] w-[95vw] rounded-3xl p-0 overflow-hidden outline-none bg-background border border-border/80">
          {selectedWorker && (
            <div className="flex flex-col max-h-[85vh] overflow-y-auto">
               {/* Hero Header Custom */}
               <div className="relative p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border/40">
                  <div className="flex items-center gap-4">
                     {/* Avatar Left */}
                     <div className="relative shrink-0">
                       {selectedWorker.profileImage ? (
                         <img 
                           src={typeof selectedWorker.profileImage === 'string' ? selectedWorker.profileImage : selectedWorker.profileImage.url} 
                           className="h-20 w-20 rounded-[1.25rem] object-cover border-2 border-background shadow-md bg-muted" 
                           alt={selectedWorker.name} 
                           referrerPolicy="no-referrer"
                         />
                       ) : (
                         <div className="h-20 w-20 rounded-[1.25rem] bg-card border-2 border-background shadow-md text-primary flex items-center justify-center font-black text-3xl select-none">
                           {selectedWorker.name.charAt(0).toUpperCase()}
                         </div>
                       )}
                       <div className={cn(
                         "absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-background shadow-sm",
                         STATUS_OPTIONS.find(s => s.value === selectedWorker.status)?.color
                       )} />
                     </div>

                     {/* Name & Role Right */}
                     <div className="flex-1 min-w-0 pr-6">
                        <h2 className="text-xl font-black text-foreground drop-shadow-sm leading-tight truncate">{selectedWorker.name}</h2>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                           <span className="bg-primary/15 text-primary px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider shrink-0">{selectedWorker.role}</span>
                           {selectedWorker.speciality && (
                             <span className="text-[11px] text-muted-foreground font-semibold truncate">
                               • {selectedWorker.speciality}
                             </span>
                           )}
                        </div>
                     </div>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="absolute top-4 right-4 rounded-full bg-muted/40 hover:bg-muted/80 text-foreground h-8 w-8 p-0 border-none transition-colors"
                    onClick={() => setIsDetailsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
               </div>

               {/* Content */}
               <div className="p-6 space-y-6">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 bg-muted/25 p-1 rounded-[1.25rem] border border-border/30">
                     <div className="bg-background dark:bg-card/40 rounded-xl p-2.5 text-center flex flex-col justify-center min-w-0 shadow-sm border border-border/10">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight truncate">Active Load</p>
                        <p className="text-lg font-black text-primary mt-0.5 leading-none truncate">{selectedWorker.activeOrders}</p>
                        <p className="text-[9px] text-muted-foreground/80 tracking-normal uppercase font-semibold mt-1 truncate">Orders</p>
                     </div>
                     <div className="bg-background dark:bg-card/40 rounded-xl p-2.5 text-center flex flex-col justify-center min-w-0 shadow-sm border border-border/10">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight truncate">Completed</p>
                        <p className="text-lg font-black text-primary mt-0.5 leading-none truncate">{selectedWorker.completedOrders}</p>
                        <p className="text-[9px] text-muted-foreground/80 tracking-normal uppercase font-semibold mt-1 truncate">Orders</p>
                     </div>
                     <div className="bg-background dark:bg-card/40 rounded-xl p-2.5 text-center flex flex-col justify-center min-w-0 shadow-sm border border-border/10">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight truncate">Earnings</p>
                        <p className="text-lg font-black text-primary mt-0.5 leading-none truncate">{formatCurrency(selectedWorker.totalEarnings || 0)}</p>
                        <p className="text-[9px] text-muted-foreground/80 tracking-normal uppercase font-semibold mt-1 truncate">To Date</p>
                     </div>
                  </div>

                  {/* Contact Info List */}
                  <div className="space-y-3">
                     <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground font-black">Contact Info</h4>
                     <div className="space-y-2.5">
                        <div className="flex items-center gap-3 bg-muted/30 p-2.5 rounded-2xl border border-border/20">
                           <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center shrink-0 border border-border/50 shadow-sm">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                           </div>
                           <div className="min-w-0 flex-1">
                              <p className="text-[9px] text-muted-foreground uppercase font-semibold">Mobile</p>
                              <p className="text-sm font-bold text-foreground truncate">{selectedWorker.phone}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3 bg-muted/30 p-2.5 rounded-2xl border border-border/20">
                           <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center shrink-0 border border-border/50 shadow-sm">
                              <MessageSquare className="w-4 h-4 text-muted-foreground" />
                           </div>
                           <div className="min-w-0 flex-1">
                              <p className="text-[9px] text-muted-foreground uppercase font-semibold">WhatsApp</p>
                              <p className="text-sm font-bold text-foreground truncate">{selectedWorker.whatsappPhone || selectedWorker.phone}</p>
                           </div>
                           <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-green-600 hover:bg-green-50 shrink-0 border border-border/20" onClick={() => openWhatsApp(selectedWorker.phone)}>
                              <TrendingUp className="w-4 h-4 rotate-45" />
                           </Button>
                        </div>
                        {selectedWorker.address && (
                           <div className="flex items-start gap-3 bg-muted/30 p-2.5 rounded-2xl border border-border/20">
                              <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center shrink-0 border border-border/50 shadow-sm mt-0.5">
                                 <MapPin className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div className="min-w-0 flex-1">
                                 <p className="text-[9px] text-muted-foreground uppercase font-semibold">Address</p>
                                 <p className="text-xs font-bold text-foreground leading-snug break-words pr-1">{selectedWorker.address}</p>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Status Grid */}
                  <div className="space-y-3">
                     <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground font-black">Quick Status</h4>
                     <div className="grid grid-cols-2 gap-2">
                        {STATUS_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => handleQuickStatusChange(selectedWorker.id, opt.value)}
                            className={cn(
                              "px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border-2 flex items-center justify-center gap-2",
                              selectedWorker.status === opt.value 
                                ? "bg-primary/10 border-primary text-primary shadow-sm" 
                                : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted/80"
                            )}
                          >
                            <span className={cn("w-2 h-2 rounded-full shrink-0", opt.color)} />
                            <span className="truncate">{opt.label}</span>
                          </button>
                        ))}
                     </div>
                  </div>

                  {/* Salary Card */}
                  <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-2xl p-4 shadow-sm flex flex-col gap-1.5">
                     <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Salary Configuration</h4>
                        <p className="text-[10px] font-black px-2 py-0.5 bg-primary/15 text-primary rounded-md uppercase tracking-wider shrink-0">
                          {selectedWorker.salaryType.replace('_', ' ')}
                        </p>
                     </div>
                     <div className="flex items-baseline gap-1.5 mt-1">
                        <p className="text-2xl font-black text-foreground">{formatCurrency(selectedWorker.salaryAmount)}</p>
                        <p className="text-xs text-muted-foreground font-semibold opacity-85">
                          {selectedWorker.salaryType === 'monthly' ? '/ month' : '/ per order'}
                        </p>
                     </div>
                  </div>

                  {/* Joining Details & Notes */}
                  <div className="flex items-center gap-3 bg-muted/20 px-3 py-2.5 rounded-2xl border border-border/10">
                     <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center shrink-0 border border-border/50">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                     </div>
                     <div className="min-w-0 flex-1">
                        <p className="text-[9px] text-muted-foreground uppercase font-semibold">Joined Store</p>
                        <p className="text-xs font-bold text-foreground truncate">{formatDate(selectedWorker.joiningDate)}</p>
                     </div>
                  </div>

                  {selectedWorker.notes && (
                  <div className="space-y-1.5">
                     <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground font-black">Worker Notes</h4>
                     <p className="text-xs text-foreground bg-muted/30 p-3.5 rounded-2xl border-l-4 border-primary/70 italic leading-relaxed break-words">
                       "{selectedWorker.notes}"
                     </p>
                  </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2 w-full">
                     <Button className="flex-1 rounded-2xl h-11 font-bold shadow-sm" onClick={() => openEditModal(selectedWorker)}>
                        <Edit className="w-4 h-4 mr-1.5" />
                        Edit Profile
                     </Button>
                     <Button variant="outline" className="flex-1 rounded-2xl h-11 font-bold border-border bg-background hover:bg-muted/30" onClick={() => openWhatsApp(selectedWorker.phone)}>
                        <MessageSquare className="w-4 h-4 mr-1.5 text-green-600" />
                        Chat Worker
                     </Button>
                  </div>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
