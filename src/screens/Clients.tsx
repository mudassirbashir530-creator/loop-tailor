import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../components/animations/PageWrapper';
import { motion } from 'motion/react';
import { 
  UserPlus, Search, Phone, MapPin, ShoppingBag, Loader2, Edit, 
  Trash2, Check, Camera, Upload, X, MoreVertical, MessageCircle, AlertCircle, Plus 
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { SearchBar } from '../components/ui/search-bar';
import { Button } from '../components/ui/button';
import { useCustomers } from '../hooks/useCustomers';
import { formatDate, cleanPhoneNumber } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Customer, CloudinaryImage } from '../lib/types';
import { toast } from 'sonner';
import { uploadToCloudinary } from '../lib/cloudinary';
import { useAuth } from '../contexts/AuthContext';
import { openWhatsApp } from '../lib/whatsapp';
import { usePlanLimits } from '../hooks/usePlanLimits';

import LimitReachedModal from '../components/LimitReachedModal';

// Validates whether input is a valid Pakistani phone number pattern
const isValidPakistaniMobile = (phone: string): boolean => {
  if (!phone) return false;
  const clean = phone.replace(/[\s\-\(\)\+]/g, '');
  if (clean.length === 10 && clean.startsWith('3')) return true;
  if (clean.length === 11 && clean.startsWith('03')) return true;
  if (clean.length === 12 && clean.startsWith('923')) return true;
  return false;
};

// Translates mobile number to standard +92 international format
const autoFormatPakistaniMobile = (phone: string): string => {
  if (!phone) return '';
  const clean = phone.replace(/[\s\-\(\)\+]/g, '');
  if (clean.length === 10 && clean.startsWith('3')) {
    return '+92' + clean;
  }
  if (clean.length === 11 && clean.startsWith('03')) {
    return '+92' + clean.slice(1);
  }
  if (clean.length === 12 && clean.startsWith('923')) {
    return '+92' + clean.slice(2);
  }
  return phone;
};

export default function Clients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { userData } = useAuth();
  const { customers, loading, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { canAddCustomer, limits, usage } = usePlanLimits();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Custom interactive dropdown menu tracking
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    whatsappPhone: string;
    countryCode: string;
    address: string;
    gender: string;
    notes: string;
    profileImage: string | CloudinaryImage | null;
  }>({
    name: '',
    phone: '',
    whatsappPhone: '',
    countryCode: '+92',
    address: '',
    gender: 'male',
    notes: '',
    profileImage: null
  });
  
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Filters customers lists
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search)
    );
  }, [customers, search]);

  // Form helper checks for validation displays
  const phoneError = useMemo(() => {
    if (!formData.phone) {
      return 'Phone number is required — needed for WhatsApp.';
    }
    if (!isValidPakistaniMobile(formData.phone)) {
      return 'Please enter a valid Pakistani mobile number (e.g., 0300 1234567).';
    }
    return '';
  }, [formData.phone]);

  const resetForm = () => {
    setFormData({ name: '', phone: '', whatsappPhone: '', countryCode: '+92', address: '', gender: 'male', notes: '', profileImage: null });
    setProfileImageFile(null);
    setUploadProgress(0);
  };

  const openAddModal = () => {
    if (!canAddCustomer) {
      setIsLimitModalOpen(true);
      return;
    }
    resetForm();
    setIsAddOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setSelectedCustomer(c);
    setFormData({
      name: c.name || '',
      phone: c.phone || '',
      whatsappPhone: c.whatsappPhone || '',
      countryCode: c.countryCode || '+92',
      address: c.address || '',
      gender: c.gender || 'male',
      notes: c.notes || '',
      profileImage: c.profileImage || null
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (c: Customer) => {
    setSelectedCustomer(c);
    setIsDeleteOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
       toast.error("Name is required.");
       return;
    }
    if (!formData.phone) {
       toast.error("Phone number is required.");
       return;
    }
    if (!isValidPakistaniMobile(formData.phone)) {
       toast.error("Valid Pakistani mobile number starts with 03 or 92 (10-12 digits) is required.");
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
      
      const formattedPhone = autoFormatPakistaniMobile(formData.phone);
      const formattedWhatsapp = formData.whatsappPhone 
        ? autoFormatPakistaniMobile(formData.whatsappPhone) 
        : formattedPhone;

      await addCustomer({ 
        ...formData, 
        phone: formattedPhone, 
        whatsappPhone: formattedWhatsapp, 
        profileImage: finalProfileImage 
      });
      setIsAddOpen(false);
      resetForm();
      toast.success("Customer added successfully");
    } catch (e) {
      console.error("Add customer error:", e);
      toast.error("Failed to add customer");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!formData.name) {
       toast.error("Name is required.");
       return;
    }
    if (!formData.phone) {
       toast.error("Phone number is required.");
       return;
    }
    if (!isValidPakistaniMobile(formData.phone)) {
       toast.error("A valid Pakistani mobile number is required.");
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
      
      const formattedPhone = autoFormatPakistaniMobile(formData.phone);
      const formattedWhatsapp = formData.whatsappPhone 
        ? autoFormatPakistaniMobile(formData.whatsappPhone) 
        : formattedPhone;

      await updateCustomer(selectedCustomer.id, { 
        ...formData, 
        phone: formattedPhone, 
        whatsappPhone: formattedWhatsapp, 
        profileImage: finalProfileImage 
      });
      setIsEditOpen(false);
      setSelectedCustomer(null);
      toast.success("Customer updated successfully");
    } catch (e) {
      console.error("Edit customer error:", e);
      toast.error("Failed to update customer");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedCustomer) return;
    setIsSubmitting(true);
    try {
      await deleteCustomer(selectedCustomer.id);
      setIsDeleteOpen(false);
      setSelectedCustomer(null);
      toast.success("Customer deleted successfully");
    } catch (e) {
      console.error("Delete customer error:", e);
      toast.error("Failed to delete customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto pb-24 relative">
      
      {/* Translucent overlay to handle standard backdrop dismiss of our touch menu */}
      {activeMenuId && (
        <div 
          className="fixed inset-0 z-40 bg-black/0 cursor-default" 
          onClick={() => setActiveMenuId(null)} 
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your {customers.length} total customers</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto h-11" onClick={openAddModal}>
          <UserPlus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Add Client Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Full Name <span className="text-red-500">*</span></label>
                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" className="h-12" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center justify-between">
                  <span>Phone Number <span className="text-red-500">*</span></span>
                  {formData.phone && !phoneError && (
                    <span className="text-emerald-600 text-xs font-semibold">
                      ✓ Ready Format
                    </span>
                  )}
                </label>
                <Input 
                  required 
                  value={formData.phone} 
                  onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                  placeholder="e.g. 0300 1234567" 
                  className={`h-12 ${phoneError ? 'border-amber-500 focus-visible:ring-amber-500 bg-amber-500/5' : ''}`}
                />
                {phoneError && (
                  <p className="text-xs font-medium text-amber-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {phoneError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center justify-between">
                  <span>WhatsApp Number</span>
                </label>
                <Input 
                  value={formData.whatsappPhone} 
                  onChange={e => setFormData({ ...formData, whatsappPhone: e.target.value })} 
                  placeholder="Leave empty to use primary phone" 
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                 <label className="text-sm font-medium text-foreground">Gender</label>
                 <select 
                   value={formData.gender} 
                   onChange={e => setFormData({...formData, gender: e.target.value})} 
                   className="w-full h-12 rounded-xl border border-input bg-background px-4 text-sm focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all shadow-sm cursor-pointer"
                 >
                   <option value="male">Male</option>
                   <option value="female">Female</option>
                   <option value="other">Other</option>
                 </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="City, Country" className="h-12" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Preferences, special tailoring choices..." className="h-12" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Profile Image (optional)</label>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <label className="relative flex-shrink-0 w-20 h-20 border-2 border-dashed rounded-full cursor-pointer hover:bg-muted/50 transition-all flex items-center justify-center overflow-hidden">
                      {profileImageFile || formData.profileImage ? (
                        <img 
                          src={profileImageFile ? URL.createObjectURL(profileImageFile) : (typeof formData.profileImage === 'string' ? formData.profileImage : formData.profileImage?.url)} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          alt="profile" 
                        />
                      ) : (
                        <Upload className="w-6 h-6 text-muted-foreground group-hover:scale-110 transition-transform" />
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setProfileImageFile(file);
                      }} />
                    </label>
                    {(profileImageFile || formData.profileImage) && (
                      <button 
                        type="button"
                        onClick={() => {
                          setProfileImageFile(null);
                          setFormData(prev => ({ ...prev, profileImage: null }));
                        }}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-2">Upload a profile photo. High quality JPG or PNG works best.</p>
                    {uploadProgress > 0 && (
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="bg-primary h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
               <Button type="button" variant="ghost" className="h-[44px]" onClick={() => setIsAddOpen(false)}>Cancel</Button>
               <Button type="submit" disabled={isSubmitting} className="h-[44px]">
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                 Save Client
               </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Full Name <span className="text-red-500">*</span></label>
                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" className="h-12" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center justify-between">
                  <span>Phone Number <span className="text-red-500">*</span></span>
                  {formData.phone && !phoneError && (
                    <span className="text-emerald-600 text-xs font-semibold">
                      ✓ Ready Format
                    </span>
                  )}
                </label>
                <Input 
                  required 
                  value={formData.phone} 
                  onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                  placeholder="e.g. 0300 1234567" 
                  className={`h-12 ${phoneError ? 'border-amber-500 focus-visible:ring-amber-500 bg-amber-500/5' : ''}`}
                />
                {phoneError && (
                  <p className="text-xs font-medium text-amber-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {phoneError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center justify-between">
                  <span>WhatsApp Number</span>
                </label>
                <Input 
                  value={formData.whatsappPhone} 
                  onChange={e => setFormData({ ...formData, whatsappPhone: e.target.value })} 
                  placeholder="Leave empty to use primary phone" 
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                 <label className="text-sm font-medium text-foreground">Gender</label>
                 <select 
                   value={formData.gender} 
                   onChange={e => setFormData({...formData, gender: e.target.value})} 
                   className="w-full h-12 rounded-xl border border-input bg-background px-4 text-sm focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all shadow-sm cursor-pointer"
                 >
                   <option value="male">Male</option>
                   <option value="female">Female</option>
                   <option value="other">Other</option>
                 </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="City, Country" className="h-12" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Tailoring preferences..." className="h-12" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Profile Image</label>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <label className="relative flex-shrink-0 w-20 h-20 border-2 border-dashed rounded-full cursor-pointer hover:bg-muted/50 transition-all flex items-center justify-center overflow-hidden">
                      {profileImageFile || formData.profileImage ? (
                        <img 
                          src={profileImageFile ? URL.createObjectURL(profileImageFile) : (typeof formData.profileImage === 'string' ? formData.profileImage : formData.profileImage?.url)} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          alt="profile" 
                        />
                      ) : (
                        <Upload className="w-6 h-6 text-muted-foreground group-hover:scale-110 transition-transform" />
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setProfileImageFile(file);
                      }} />
                    </label>
                    {(profileImageFile || formData.profileImage) && (
                      <button 
                        type="button"
                        onClick={() => {
                          setProfileImageFile(null);
                          setFormData(prev => ({ ...prev, profileImage: null }));
                        }}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-2">Upload a profile photo. High quality JPG or PNG works best.</p>
                    {uploadProgress > 0 && (
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="bg-primary h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
               <Button type="button" variant="ghost" className="h-[44px]" onClick={() => setIsEditOpen(false)}>Cancel</Button>
               <Button type="submit" disabled={isSubmitting} className="h-[44px]">
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                 Update Client
               </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
          </DialogHeader>
          <div className="py-4">
             <p>Are you sure you want to delete <strong>{selectedCustomer?.name}</strong>?</p>
             <p className="text-sm text-muted-foreground mt-2">This action cannot be undone. Orders associated with this customer might lose their reference.</p>
          </div>
          <DialogFooter>
             <Button type="button" variant="ghost" className="h-[44px]" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
             <Button variant="destructive" className="h-[44px]" onClick={handleDeleteSubmit} disabled={isSubmitting}>
               {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
               Delete
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search Bar */}
      <SearchBar 
        value={search} 
        onChange={(e: any) => setSearch(e?.target?.value || e)} 
        placeholder="Search clients by name or phone..." 
      />

      {/* Customer List */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-[170px] bg-muted/20" />
              </Card>
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-dashed text-muted-foreground">
            <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50 text-primary" />
            <p className="text-lg font-medium text-foreground">No clients found</p>
            <p className="text-sm mt-1">Add your first client to get started</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.map((customer) => {
              const phoneValid = isValidPakistaniMobile(customer.phone);
              return (
                <Card key={customer.id} className="relative bg-card hover:shadow-md hover:border-border/80 transition-all rounded-3xl overflow-hidden shadow-xs border flex flex-col justify-between">
                  <span className="sr-only">{customer.name}</span>
                  <CardContent className="p-0 flex-1 flex flex-col justify-between">
                    <div className="p-5">
                      {/* Top Row: Info + 3-Dot Dropdown */}
                      <div className="flex gap-4 items-start justify-between">
                        <div className="flex gap-3">
                          {customer.profileImage ? (
                            <img 
                              src={typeof customer.profileImage === 'string' ? customer.profileImage : customer.profileImage.url} 
                              className="h-12 w-12 shrink-0 rounded-full object-cover border bg-muted shadow-inner" 
                              alt={customer.name} 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-12 w-12 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shadow-inner">
                              {(customer.name || 'C').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-bold text-base text-foreground leading-tight line-clamp-1">{customer.name || 'Unnamed'}</h3>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                              <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                              <span className="truncate">{customer.phone || 'No phone'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive menu trigger icon */}
                        <div className="relative">
                          <Button 
                            variant="ghost" 
                            className="h-11 w-11 p-0 rounded-full hover:bg-muted/80 flex items-center justify-center shrink-0 text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === customer.id ? null : customer.id);
                            }}
                          >
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                          
                          {activeMenuId === customer.id && (
                            <div className="absolute right-0 top-12 w-52 bg-card text-foreground border shadow-lg rounded-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                              <button 
                                type="button"
                                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 hover:bg-muted transition-colors font-medium"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  navigate(`/app/orders`, { state: { search: customer.name } });
                                }}
                              >
                                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                                View Orders
                              </button>

                              <button 
                                type="button"
                                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 hover:bg-muted transition-colors font-medium"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  openEditModal(customer);
                                }}
                              >
                                <Edit className="w-4 h-4 text-muted-foreground" />
                                Edit Profile
                              </button>

                              {customer.phone && (
                                <button 
                                  type="button"
                                  className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 hover:bg-muted transition-colors font-medium text-emerald-600 hover:text-emerald-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                    openWhatsApp(customer.phone);
                                  }}
                                >
                                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                                  WhatsApp Chat
                                </button>
                              )}

                              <div className="border-t my-1" />

                              <button 
                                type="button"
                                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 hover:bg-destructive/15 text-destructive transition-colors font-semibold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  openDeleteModal(customer);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Client
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Display warning if phone key is missing or formatted out */}
                      {!customer.phone || !phoneValid ? (
                        <div className="text-amber-600 bg-amber-500/5 rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1.5 mt-3 border border-amber-500/20">
                          <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                          <span>Missing valid phone (required for WhatsApp)</span>
                        </div>
                      ) : null}

                      {/* Address Display */}
                      {customer.address && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      )}

                      {/* Notes Display */}
                      {customer.notes && (
                        <div className="mt-3 bg-muted/30 p-2.5 rounded-xl text-xs text-muted-foreground italic line-clamp-2">
                          "{customer.notes}"
                        </div>
                      )}
                    </div>

                    {/* Footer Actions block: ALWAYS visible and sized for high touchscreen ergonomics (min 44px) */}
                    <div className="bg-muted/30 px-4 py-3 border-t flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                        Added: {formatDate(customer.createdAt)}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* 1. Edit Profile button */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-[40px] px-3.5 rounded-xl font-semibold text-xs flex items-center gap-1.5" 
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(customer);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit
                        </Button>

                        {/* 2. View Orders shortcut trigger */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-[40px] px-3.5 rounded-xl font-semibold text-xs flex items-center gap-1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/app/orders`, { state: { search: customer.name } });
                          }}
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
                          Orders
                        </Button>

                        {/* 3. Send WhatsApp button (renders only if they have a phone) */}
                        {customer.phone && phoneValid && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-[40px] px-3 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10 rounded-xl font-bold text-xs flex items-center gap-1 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              openWhatsApp(customer.phone);
                            }}
                          >
                            <MessageCircle className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                            WhatsApp
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Limit Modal */}
      <LimitReachedModal 
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        limitType="customers"
        current={usage.customers}
        limit={limits.customers}
      />

      {/* FAB Button */}
      {!isAddOpen && (
         <motion.button 
           className="fixed bottom-[88px] right-4 lg:hidden z-30 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center cursor-pointer"
           onClick={openAddModal}
           whileHover={{ scale: 1.08 }}
           whileTap={{ scale: 0.92 }}
           animate={{
             scale: [1, 1.08, 1],
             boxShadow: [
               "0px 4px 10px rgba(0,0,0,0.15)",
               "0px 8px 24px rgba(26,58,42,0.4)",
               "0px 4px 10px rgba(0,0,0,0.15)"
             ]
           }}
           transition={{
             scale: { repeat: 2, duration: 1.2, ease: "easeInOut", delay: 1 },
             boxShadow: { repeat: 2, duration: 1.2, ease: "easeInOut", delay: 1 }
           }}
         >
           <Plus className="w-6 h-6" />
         </motion.button>
      )}
    </PageWrapper>
  );
}
