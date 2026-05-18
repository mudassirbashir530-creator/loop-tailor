import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, User, Loader2, Download, MessageCircle, Ruler, Image as ImageIcon, ExternalLink, Share2 } from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const { userData } = useAuth();
  const navigate = useNavigate();
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
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500 flex flex-col h-full">
      
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
                        {order.customerPhone && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openWhatsApp(order.customerPhone, '', '+92');
                            }}
                            className="text-[#25D366] hover:bg-[#25D366]/10 p-1 rounded-full transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{order?.clothingType || 'Tailoring'} • #{order?.id?.slice(-6).toUpperCase() || '??????'}</p>
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
              <DialogHeader>
                <DialogTitle className="flex justify-between items-center text-xl">
                  Order #{selectedOrder.id.slice(-6).toUpperCase()}
                  <Badge variant={selectedOrder.status} className="capitalize ml-4 text-sm px-3 py-1">{selectedOrder.status}</Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Customer</p>
                    <p className="font-bold">{selectedOrder?.customerName || 'Unnamed'}</p>
                    <p className="text-sm">{selectedOrder?.customerPhone || 'No phone'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Delivery</p>
                    <p className="font-bold">{selectedOrder?.deliveryDate ? formatDate(selectedOrder.deliveryDate) : 'No date'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                   <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Measurements</p>
                   {Object.keys(selectedOrder.measurements).length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 bg-muted/50 p-4 rounded-xl border">
                        {Object.entries(selectedOrder.measurements).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-xs text-muted-foreground capitalize">{key}</p>
                            <p className="font-semibold text-sm">{value || '-'}</p>
                          </div>
                        ))}
                      </div>
                   ) : (
                      <p className="text-sm italic text-muted-foreground">No measurements provided.</p>
                   )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Payment Info</p>
                  <div className="bg-muted/50 p-4 rounded-xl border space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Price</span>
                      <span className="font-medium">{formatCurrency(selectedOrder.price)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Advance</span>
                      <span>-{formatCurrency(selectedOrder.advancePayment)}</span>
                    </div>
                    <div className="w-full h-px bg-border my-2" />
                    <div className="flex justify-between font-bold text-base">
                      <span>Remaining Balance</span>
                      <span className="text-orange-600">{formatCurrency(selectedOrder.remainingPayment)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Images</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <p className="text-xs font-semibold text-muted-foreground">Reference Designs</p>
                       <div className="grid grid-cols-2 gap-2">
                         {selectedOrder.referenceImages && selectedOrder.referenceImages.length > 0 ? (
                           selectedOrder.referenceImages.map((img, i) => (
                             <div 
                               key={i} 
                               onClick={() => setPreviewImage({ url: typeof img === 'string' ? img : img.url, type: 'reference', index: i })}
                               className="aspect-square rounded-lg overflow-hidden border cursor-pointer group relative"
                             >
                               <img 
                                 src={typeof img === 'string' ? img : img.url} 
                                 className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                                 alt="ref" 
                                 loading="lazy"
                                 referrerPolicy="no-referrer"
                               />
                               <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <ImageIcon className="w-5 h-5 text-white" />
                               </div>
                             </div>
                           ))
                         ) : (
                           <div className="col-span-2 aspect-[2/1] bg-muted rounded-xl border flex flex-col items-center justify-center text-muted-foreground">
                             <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                             <p className="text-xs">No reference images</p>
                           </div>
                         )}
                       </div>
                    </div>
                    
                    <div className="space-y-2">
                       <p className="text-xs font-semibold text-muted-foreground">Design Samples</p>
                       <div className="grid grid-cols-2 gap-2">
                         {selectedOrder.designImages && selectedOrder.designImages.length > 0 ? (
                           selectedOrder.designImages.map((img, i) => (
                             <div 
                               key={i} 
                               onClick={() => setPreviewImage({ url: typeof img === 'string' ? img : img.url, type: 'design', index: i })}
                               className="aspect-square rounded-lg overflow-hidden border cursor-pointer group relative"
                             >
                               <img 
                                 src={typeof img === 'string' ? img : img.url} 
                                 className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                                 alt="design" 
                                 loading="lazy"
                                 referrerPolicy="no-referrer"
                               />
                               <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <ImageIcon className="w-5 h-5 text-white" />
                               </div>
                             </div>
                           ))
                         ) : (
                           <div className="col-span-2 aspect-[2/1] bg-muted rounded-xl border flex flex-col items-center justify-center text-muted-foreground">
                             <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                             <p className="text-xs">No design samples</p>
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                  
                  {selectedOrder.invoiceImage && (
                    <div className="space-y-2 pt-2">
                       <p className="text-xs font-semibold text-muted-foreground">Invoice Preview</p>
                       <div 
                         onClick={() => setPreviewImage({ url: typeof selectedOrder.invoiceImage === 'string' ? selectedOrder.invoiceImage : (selectedOrder.invoiceImage as CloudinaryImage).url, type: 'invoice' })}
                         className="block w-full aspect-[4/3] rounded-xl overflow-hidden border relative group cursor-pointer"
                       >
                         <img 
                           src={typeof selectedOrder.invoiceImage === 'string' ? selectedOrder.invoiceImage : (selectedOrder.invoiceImage as CloudinaryImage).url} 
                           className="w-full h-full object-cover" 
                           alt="invoice" 
                           loading="lazy"
                           referrerPolicy="no-referrer"
                         />
                         <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <div className="bg-white/90 p-2 rounded-full text-black shadow-lg">
                             <ImageIcon className="w-5 h-5" />
                           </div>
                         </div>
                       </div>
                    </div>
                  )}
                </div>

                {(ORDER_STATUS_TRANSITIONS[selectedOrder.status] || []).length > 0 && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Update Order Status</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(ORDER_STATUS_TRANSITIONS[selectedOrder.status] || []).map((status) => (
                        <Button 
                          key={status} 
                          size="sm" 
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
                            "capitalize h-10 font-semibold transition-all hover:border-primary/50",
                            status === ORDER_STATUS.CANCELLED ? "text-red-600 hover:bg-red-50 hover:border-red-200" : ""
                          )}
                        >
                          {status}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-row flex-wrap justify-between sm:justify-end gap-2 w-full pt-4 border-t">
                {userData?.permissions?.whatsapp !== false && (
                  <Button variant="ghost" className="flex-1 sm:flex-none gap-2 bg-[#25D366] text-white hover:bg-[#128C7E] hover:text-white border-none transition-colors" onClick={handleWhatsAppShare}>
                    <MessageCircle className="h-4 w-4 text-white" />
                    <span className="hidden sm:inline">Status Update</span>
                  </Button>
                )}
                {userData?.permissions?.invoice !== false && (
                  <>
                    <Button variant="outline" className="flex-1 sm:flex-none gap-2" onClick={handlePreviewInvoice} disabled={isDownloading}>
                      <ExternalLink className="h-4 w-4" />
                      Preview Invoice
                    </Button>
                    <Button variant="outline" className="flex-1 sm:flex-none gap-2" onClick={handleShareInvoice} disabled={isSharing}>
                      {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                      Share Invoice
                    </Button>
                    <Button className="flex-1 sm:flex-none gap-2" onClick={handleDownloadInvoice} disabled={isDownloading}>
                      {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Download png
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

    </div>
  );
}
