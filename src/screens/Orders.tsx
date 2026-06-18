import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageWrapper } from '../components/animations/PageWrapper';
import { Calendar, DollarSign, User, Loader2, Download, MessageCircle, Ruler, Image as ImageIcon, ExternalLink, Share2 } from 'lucide-react';
import { WhatsAppIcon } from '../components/icons/WhatsAppIcon';
import { Card, CardContent } from '../components/ui/card';
import { SearchBar } from '../components/ui/search-bar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { useOrders } from '../hooks/useOrders';
import { useCustomers } from '../hooks/useCustomers';
import { useShop } from '../contexts/ShopContext';
import { formatCurrency, formatDate, cn, cleanPhoneNumber } from '../lib/utils';
import { openWhatsApp } from '../lib/whatsapp';
import { OrderStatus, Order, CloudinaryImage } from '../lib/types';
import { ORDER_STATUS_TRANSITIONS, isValidStatusTransition, ORDER_STATUS } from '../lib/config';
import { InvoiceTemplate } from '../components/InvoiceTemplate';
import { ImagePreviewModal } from '../components/ImagePreviewModal';
import * as htmlToImage from 'html-to-image';
import { toast } from 'sonner';
import { uploadToCloudinary } from '../lib/cloudinary';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Orders() {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const { userData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state && (location.state as any).search) {
      setSearch((location.state as any).search);
    }
  }, [location.state]);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string, type: 'reference' | 'design' | 'invoice', index?: number } | null>(null);
  const { orders, loading, updateOrderStatus } = useOrders();
  const { customers } = useCustomers();
  const { settings } = useShop();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const tabs: { label: string, value: OrderStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Stitching', value: 'stitching' },
    { label: 'Ready', value: 'ready' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) || 
                          o.id.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || o.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getTabCount = (tab: OrderStatus | 'all') => {
    if (tab === 'all') return orders.length;
    return orders.filter(o => o.status === tab).length;
  };

  const generateInvoiceImage = async (ref: HTMLElement, options?: any) => {
    const elementsToRemove: HTMLElement[] = [];
    Array.from(document.querySelectorAll('link[rel="stylesheet"]')).forEach(link => {
      if ((link as HTMLLinkElement).href.includes('googleapis.com')) {
        elementsToRemove.push(link as HTMLElement);
      }
    });
    elementsToRemove.forEach(el => el.parentNode?.removeChild(el));
    
    try {
      const dataUrl = await htmlToImage.toPng(ref, { 
        quality: 1.0, 
        pixelRatio: 2, 
        skipFonts: true,
        ...options 
      });
      return dataUrl;
    } finally {
      elementsToRemove.forEach(el => document.head.appendChild(el));
    }
  };

  const handlePreviewInvoice = async () => {
    if (!invoiceRef.current || !selectedOrder) return;
    try {
      setIsDownloading(true);
      const dataUrl = await generateInvoiceImage(invoiceRef.current);
      setPreviewImage({ url: dataUrl, type: 'invoice' });
    } catch (err) {
      toast.error("Failed to generate preview");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoiceRef.current || !selectedOrder) return;
    try {
      setIsDownloading(true);
      const dataUrl = await generateInvoiceImage(invoiceRef.current);
      const link = document.createElement('a');
      link.download = `Invoice-${selectedOrder.id.slice(-6)}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Invoice downloaded!");
    } catch (err) {
      toast.error("Failed to generate invoice");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareInvoice = async () => {
    if (!invoiceRef.current || !selectedOrder) return;
    try {
      setIsSharing(true);
      const dataUrl = await generateInvoiceImage(invoiceRef.current, { quality: 0.95 });
      
      // Convert dataUrl to File
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `invoice-${selectedOrder.id.slice(-6)}.png`, { type: 'image/png' });
      
      const cloudinaryImg = await uploadToCloudinary(file);
      
      // Update order with invoice image URL
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        invoiceImage: cloudinaryImg
      });
      
      // Update local state
      setSelectedOrder({ ...selectedOrder, invoiceImage: cloudinaryImg });
      
      const message = `Hello ${selectedOrder.customerName}, here is your invoice for order #${selectedOrder.id.slice(-6).toUpperCase()}: ${cloudinaryImg.url}`;
      openWhatsApp(selectedOrder.customerPhone, message, '+92');
      
      toast.success("Invoice shared to Cloudinary and WhatsApp!");
    } catch (err) {
      console.error("Share error:", err);
      toast.error("Failed to share invoice");
    } finally {
      setIsSharing(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!selectedOrder) return;
    let templateType = 'orderReceived';
    if (selectedOrder.status === 'stitching') templateType = 'stitchingStarted';
    if (selectedOrder.status === 'ready') templateType = 'readyForDelivery';
    if (selectedOrder.status === 'delivered') templateType = 'deliveredSuccessfully';
    
    // allow 'paymentPending' logic if you want but status maps usually to these
    let rawMessage = settings?.templates?.[templateType];
    
    if (!rawMessage) {
       // fallback
       rawMessage = `Hello {customerName}, your order for {clothingType} is currently ${selectedOrder.status}. Total price: {totalPrice}, Remaining balance: {remainingAmount}. Delivery expected by {deliveryDate}. Thank you!`;
    }

    const message = rawMessage
      .replace(/{customerName}/g, selectedOrder.customerName)
      .replace(/{orderId}/g, selectedOrder.id.slice(-6).toUpperCase())
      .replace(/{clothingType}/g, selectedOrder.clothingType)
      .replace(/{totalPrice}/g, formatCurrency(selectedOrder.price))
      .replace(/{advanceAmount}/g, formatCurrency(selectedOrder.advancePayment))
      .replace(/{remainingAmount}/g, formatCurrency(selectedOrder.remainingPayment))
      .replace(/{deliveryDate}/g, formatDate(selectedOrder.deliveryDate));

    openWhatsApp(selectedOrder.customerPhone, message, '+92');
  };

  const handleDeleteImage = async () => {
    if (!selectedOrder || !previewImage) return;
    
    setLoadingImageAction(true);
    try {
      let updatedFields: any = {};
      
      if (previewImage.type === 'reference') {
        const images = selectedOrder.referenceImages || [];
        const newImages = images.filter((_, i) => i !== previewImage.index);
        updatedFields.referenceImages = newImages;
        if (previewImage.index === 0) {
          updatedFields.referencePhotoUrl = newImages.length > 0 ? newImages[0].url : "";
        }
      } else if (previewImage.type === 'design') {
        const images = selectedOrder.designImages || [];
        const newImages = images.filter((_, i) => i !== previewImage.index);
        updatedFields.designImages = newImages;
        if (previewImage.index === 0) {
          updatedFields.sampleDesignUrl = newImages.length > 0 ? newImages[0].url : "";
        }
      } else if (previewImage.type === 'invoice') {
        updatedFields.invoiceImage = null;
      }
      
      await updateDoc(doc(db, 'orders', selectedOrder.id), updatedFields);
      setSelectedOrder({ ...selectedOrder, ...updatedFields });
      setPreviewImage(null);
      toast.success("Image deleted successfully");
    } catch (e) {
      toast.error("Failed to delete image");
    } finally {
      setLoadingImageAction(false);
    }
  };

  const handleReplaceImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOrder || !previewImage) return;

    setLoadingImageAction(true);
    try {
      const cloudinaryImg = await uploadToCloudinary(file);
      let updatedFields: any = {};
      
      if (previewImage.type === 'reference') {
        const images = [...(selectedOrder.referenceImages || [])];
        images[previewImage.index!] = cloudinaryImg;
        updatedFields.referenceImages = images;
        if (previewImage.index === 0) {
          updatedFields.referencePhotoUrl = cloudinaryImg.url;
        }
      } else if (previewImage.type === 'design') {
        const images = [...(selectedOrder.designImages || [])];
        images[previewImage.index!] = cloudinaryImg;
        updatedFields.designImages = images;
        if (previewImage.index === 0) {
          updatedFields.sampleDesignUrl = cloudinaryImg.url;
        }
      } else if (previewImage.type === 'invoice') {
        updatedFields.invoiceImage = cloudinaryImg;
      }
      
      await updateDoc(doc(db, 'orders', selectedOrder.id), updatedFields);
      setSelectedOrder({ ...selectedOrder, ...updatedFields });
      setPreviewImage(prev => prev ? { ...prev, url: cloudinaryImg.url } : null);
      toast.success("Image replaced successfully");
    } catch (e) {
      toast.error("Failed to replace image");
    } finally {
      setLoadingImageAction(false);
    }
  };

  const [loadingImageAction, setLoadingImageAction] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <PageWrapper className="p-4 md:p-8 space-y-6 flex flex-col h-full">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Orders</h1>
        <p className="text-muted-foreground">Manage all your tailoring orders</p>
      </div>

      {/* Search */}
      <SearchBar 
        placeholder="Search by customer or order #..." 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border",
              activeTab === tab.value 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-background text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {tab.label}
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full ml-1",
              activeTab === tab.value ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
            )}>
              {getTabCount(tab.value)}
            </span>
          </button>
        ))}
      </div>

      {/* Order List */}
      <div className="space-y-4 pb-12">
        {loading ? (
           <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border">
            <p>No orders found.</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const customer = customers.find(c => c.id === order.customerId);
            return (
            <Card key={order.id} className={cn("cursor-pointer hover:shadow-md transition-shadow", order.status === 'cancelled' && "opacity-75 bg-muted/30 grayscale-[50%]")} onClick={() => navigate(`/app/orders/${order.id}`)}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {customer?.profileImage ? (
                      <img 
                        src={typeof customer.profileImage === 'string' ? customer.profileImage : customer.profileImage.url} 
                        alt={order.customerName} 
                        className="w-10 h-10 rounded-full object-cover shadow-sm border border-border shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm shrink-0">
                        {order.customerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground text-base leading-tight">{order?.customerName || 'Unnamed'}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{order?.clothingType || 'Tailoring'} • {order?.tokenId || `T-${order?.id?.slice(0, 6).toUpperCase()}`}</p>
                    </div>
                  </div>
                  <Badge variant={order?.status || 'pending'} className="capitalize shrink-0 ml-2">{order?.status || 'pending'}</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{order?.deliveryDate ? formatDate(order.deliveryDate) : 'No date'}</span>
                  </div>
                  
                  {order.workerName && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      <span className="truncate">{order.workerName}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium text-foreground">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>{formatCurrency(order.price)}</span>
                  </div>

                  {order.remainingPayment > 0 && (
                    <div className="flex items-center text-xs font-semibold text-orange-600">
                      Bal: {formatCurrency(order.remainingPayment)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
          })
        )}
      </div>

      {/* Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <DialogTitle className="flex justify-between items-center text-2xl font-black">
                  <span>Order <span className="text-slate-400 dark:text-slate-500">#{selectedOrder.id.slice(-6).toUpperCase()}</span></span>
                  <Badge variant={selectedOrder.status} className="capitalize ml-4 text-sm px-3 py-1 font-bold">{selectedOrder.status}</Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-8 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                       <User className="w-16 h-16" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest relative z-10">Customer</p>
                    <p className="font-bold text-lg text-slate-900 dark:text-white leading-tight relative z-10">{selectedOrder?.customerName || 'Unnamed'}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold relative z-10">{selectedOrder?.customerPhone || 'No phone'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                       <Calendar className="w-16 h-16" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest relative z-10">Delivery</p>
                    <p className="font-bold text-lg text-slate-900 dark:text-white leading-tight relative z-10">{selectedOrder?.deliveryDate ? formatDate(selectedOrder.deliveryDate) : 'No date'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                   <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Measurements</p>
                   {Object.keys(selectedOrder.measurements).length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        {Object.entries(selectedOrder.measurements).map(([key, value]) => (
                          <div key={key} className="space-y-1 block">
                            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize font-medium">{key}</p>
                            <p className="font-bold text-slate-900 dark:text-white text-base">{value || '-'}</p>
                          </div>
                        ))}
                      </div>
                   ) : (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center">
                        <p className="text-sm italic text-slate-500 font-medium">No measurements provided.</p>
                      </div>
                   )}
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Payment Info</p>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex justify-between items-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                      <span>Total Price</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(selectedOrder.price)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-semibold text-[#25D366]">
                      <span>Advance</span>
                      <span className="font-bold">-{formatCurrency(selectedOrder.advancePayment)}</span>
                    </div>
                    <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-2" />
                    <div className="flex justify-between items-center font-black text-lg">
                      <span className="text-slate-900 dark:text-white">Remaining Balance</span>
                      <span className="text-rose-500">{formatCurrency(selectedOrder.remainingPayment)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Images & Design</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reference Designs</p>
                       <div className="grid grid-cols-2 gap-2">
                         {selectedOrder.referenceImages && selectedOrder.referenceImages.length > 0 ? (
                           selectedOrder.referenceImages.map((img, i) => (
                             <div 
                               key={i} 
                               onClick={() => setPreviewImage({ url: typeof img === 'string' ? img : img.url, type: 'reference', index: i })}
                               className="aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group relative bg-white dark:bg-slate-900 shadow-sm"
                             >
                               <img 
                                 src={typeof img === 'string' ? img : img.url} 
                                 className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                                 alt="ref" 
                                 loading="lazy"
                                 referrerPolicy="no-referrer"
                               />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <div className="bg-white/90 p-2 rounded-full text-slate-900 shadow-lg backdrop-blur-sm">
                                   <ImageIcon className="w-4 h-4" />
                                 </div>
                               </div>
                             </div>
                           ))
                         ) : (
                           <div className="col-span-2 aspect-[2/1] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 border-dashed">
                             <ImageIcon className="w-6 h-6 mb-2 opacity-50" />
                             <p className="text-xs font-medium">No references</p>
                           </div>
                         )}
                       </div>
                    </div>
                    
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Design Samples</p>
                       <div className="grid grid-cols-2 gap-3">
                         {selectedOrder.designImages && selectedOrder.designImages.length > 0 ? (
                           selectedOrder.designImages.map((img, i) => (
                             <div 
                               key={i} 
                               onClick={() => setPreviewImage({ url: typeof img === 'string' ? img : img.url, type: 'design', index: i })}
                               className="aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group relative bg-white dark:bg-slate-900 shadow-sm"
                             >
                               <img 
                                 src={typeof img === 'string' ? img : img.url} 
                                 className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                                 alt="design" 
                                 loading="lazy"
                                 referrerPolicy="no-referrer"
                               />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <div className="bg-white/90 p-2 rounded-full text-slate-900 shadow-lg backdrop-blur-sm">
                                   <ImageIcon className="w-4 h-4" />
                                 </div>
                               </div>
                             </div>
                           ))
                         ) : (
                           <div className="col-span-2 aspect-[2/1] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 border-dashed">
                             <ImageIcon className="w-6 h-6 mb-2 opacity-50" />
                             <p className="text-xs font-medium">No samples</p>
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                  
                  {selectedOrder.invoiceImage && (
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoice View</p>
                       <div 
                         onClick={() => setPreviewImage({ url: typeof selectedOrder.invoiceImage === 'string' ? selectedOrder.invoiceImage : (selectedOrder.invoiceImage as CloudinaryImage).url, type: 'invoice' })}
                         className="block w-full aspect-[16/9] sm:aspect-[3/1] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group cursor-pointer bg-white dark:bg-slate-900 shadow-sm"
                       >
                         <img 
                           src={typeof selectedOrder.invoiceImage === 'string' ? selectedOrder.invoiceImage : (selectedOrder.invoiceImage as CloudinaryImage).url} 
                           className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                           alt="invoice" 
                           loading="lazy"
                           referrerPolicy="no-referrer"
                         />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <div className="bg-white/90 p-3 rounded-full text-slate-900 shadow-xl backdrop-blur-sm font-semibold text-sm flex items-center gap-2">
                             <ImageIcon className="w-4 h-4" />
                             View Full Invoice
                           </div>
                         </div>
                       </div>
                    </div>
                  )}
                </div>

                {(ORDER_STATUS_TRANSITIONS[selectedOrder.status] || []).length > 0 && (
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Update Order Status</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(ORDER_STATUS_TRANSITIONS[selectedOrder.status] || []).map((status) => (
                        <Button 
                          key={status} 
                          variant="outline"
                          onClick={async () => {
                            if (!isValidStatusTransition(selectedOrder.status, status)) {
                              toast.error(`Cannot transition from ${selectedOrder.status} to ${status}`);
                              return;
                            }
                            try {
                              await updateOrderStatus(selectedOrder.id, status);
                              setSelectedOrder(null);
                            } catch (e) {
                              console.error("Update status error:", e);
                              toast.error("Failed to update status");
                            }
                          }}
                          className={cn(
                            "capitalize h-12 font-bold text-sm transition-all rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 shadow-sm",
                            status === ORDER_STATUS.CANCELLED ? "text-rose-600 hover:bg-rose-50 hover:border-rose-200" : "text-slate-700 hover:text-slate-900"
                          )}
                        >
                          {status}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-row flex-wrap justify-between sm:justify-end gap-3 w-full pt-6 md:pt-4 border-t border-slate-100 dark:border-slate-800">
                {userData?.permissions?.whatsapp !== false && (
                  <Button variant="ghost" className="flex-1 sm:flex-none gap-2 bg-[#25D366] text-white hover:bg-[#128C7E] hover:text-white border-none transition-colors h-12 rounded-xl font-bold shadow-lg shadow-[#25D366]/20" onClick={handleWhatsAppShare}>
                    <WhatsAppIcon className="h-5 w-5 fill-current text-white" />
                    <span className="hidden sm:inline">Status Update</span>
                  </Button>
                )}
                {userData?.permissions?.invoice !== false && (
                  <>
                    <Button variant="outline" className="flex-1 sm:flex-none gap-2 h-12 rounded-xl font-bold border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300" onClick={handlePreviewInvoice} disabled={isDownloading}>
                      <ExternalLink className="h-4 w-4" />
                      Preview
                    </Button>
                    <Button variant="outline" className="flex-1 sm:flex-none gap-2 h-12 rounded-xl font-bold border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300" onClick={handleShareInvoice} disabled={isSharing}>
                      {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                      Share
                    </Button>
                    <Button className="flex-1 sm:flex-none gap-2 h-12 rounded-xl font-bold shadow-sm" onClick={handleDownloadInvoice} disabled={isDownloading}>
                      {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Download
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden container to generate invoice image */}
      <div className="fixed left-[-9999px]">
         {selectedOrder && <InvoiceTemplate ref={invoiceRef} order={selectedOrder} />}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <ImagePreviewModal 
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          imageUrl={previewImage.url}
          title={`${previewImage.type.charAt(0).toUpperCase() + previewImage.type.slice(1)} Image`}
          onDelete={handleDeleteImage}
          onReplace={() => fileInputRef.current?.click()}
        />
      )}
      
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        accept="image/*" 
        onChange={handleReplaceImage} 
      />

      {loadingImageAction && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
          <span className="text-white font-medium">Updating Image...</span>
        </div>
      )}

    </PageWrapper>
  );
}
