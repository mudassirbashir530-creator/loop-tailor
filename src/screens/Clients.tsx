import React, { useState } from 'react';
import { UserPlus, Search, Phone, MapPin, ShoppingBag, Loader2, Edit, Trash2, Check } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { SearchBar } from '../components/ui/search-bar';
import { Button } from '../components/ui/button';
import { useCustomers } from '../hooks/useCustomers';
import { formatDate } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Customer } from '../lib/types';
import { toast } from 'sonner';

export default function Clients() {
  const [search, setSearch] = useState('');
  const { customers, loading, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsappPhone: '',
    countryCode: '+92',
    address: '',
    gender: 'male',
    notes: ''
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  const resetForm = () => {
    setFormData({ name: '', phone: '', whatsappPhone: '', countryCode: '+92', address: '', gender: 'male', notes: '' });
  };

  const openAddModal = () => {
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
      notes: c.notes || ''
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (c: Customer) => {
    setSelectedCustomer(c);
    setIsDeleteOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
       toast.error("Name and Phone are required.");
       return;
    }
    setIsSubmitting(true);
    await addCustomer(formData);
    setIsSubmitting(false);
    setIsAddOpen(false);
    resetForm();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!formData.name || !formData.phone) {
       toast.error("Name and Phone are required.");
       return;
    }
    setIsSubmitting(true);
    await updateCustomer(selectedCustomer.id, formData);
    setIsSubmitting(false);
    setIsEditOpen(false);
    setSelectedCustomer(null);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedCustomer) return;
    setIsSubmitting(true);
    await deleteCustomer(selectedCustomer.id);
    setIsSubmitting(false);
    setIsDeleteOpen(false);
    setSelectedCustomer(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-24">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your {customers.length} total customers</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={openAddModal}>
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Name <span className="text-red-500">*</span></label>
                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone <span className="text-red-500">*</span></label>
                <Input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="0300 0000000" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">WhatsApp</label>
                <Input value={formData.whatsappPhone} onChange={e => setFormData({ ...formData, whatsappPhone: e.target.value })} placeholder="Same as phone if empty" />
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-medium">Gender</label>
                 <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                   <option value="male">Male</option>
                   <option value="female">Female</option>
                   <option value="other">Other</option>
                 </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="City, Country" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Preferences..." />
              </div>
            </div>
            <DialogFooter className="mt-6">
               <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
               <Button type="submit" disabled={isSubmitting}>
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
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name <span className="text-red-500">*</span></label>
                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone <span className="text-red-500">*</span></label>
                <Input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="0300 0000000" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">WhatsApp</label>
                <Input value={formData.whatsappPhone} onChange={e => setFormData({ ...formData, whatsappPhone: e.target.value })} placeholder="Same as phone if empty" />
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-medium">Gender</label>
                 <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                   <option value="male">Male</option>
                   <option value="female">Female</option>
                   <option value="other">Other</option>
                 </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="City, Country" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Preferences..." />
              </div>
            </div>
            <DialogFooter className="mt-6">
               <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
               <Button type="submit" disabled={isSubmitting}>
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
             <Button type="button" variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
             <Button variant="destructive" onClick={handleDeleteSubmit} disabled={isSubmitting}>
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
                <CardContent className="p-6 h-[140px] bg-muted/20" />
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="group hover:border-primary/50 transition-colors overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-5 flex gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">{customer.name}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{customer.phone}</span>
                      </div>
                      {customer.address && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 px-5 py-3 border-t flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Added: {formatDate(customer.createdAt)}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEditModal(customer)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => openDeleteModal(customer)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
