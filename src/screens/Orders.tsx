import React, { useState, useRef } from 'react';
import { Calendar, DollarSign, User, Loader2, Download, MessageCircle, Ruler } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { SearchBar } from '../components/ui/search-bar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { useOrders } from '../hooks/useOrders';
import { useShop } from '../contexts/ShopContext';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { OrderStatus, Order } from '../lib/types';
import { InvoiceTemplate } from '../components/InvoiceTemplate';
import * as htmlToImage from 'html-to-image';
import { toast } from 'sonner';

export default function Orders() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { orders, loading, updateOrderStatus } = useOrders();
  const { settings } = useShop();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const tabs: { label: string, value: OrderStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Stitching', value: 'stitching' },
    { label: 'Ready', value: 'ready' },
    { label: 'Delivered', value: 'delivered' },
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

  const handleDownloadInvoice = async () => {
    if (!invoiceRef.current || !selectedOrder) return;
    try {
      setIsDownloading(true);
      const dataUrl = await htmlToImage.toPng(invoiceRef.current, { quality: 1.0 });
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

  const handleWhatsAppShare = () => {
    if (!selectedOrder) return;
    const phone = selectedOrder.customerPhone.replace(/[^0-9+]/g, ''); // KEEP PLUS
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

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

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
          filteredOrders.map(order => (
            <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedOrder(order)}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-foreground text-base leading-tight">{order?.customerName || 'Unnamed'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{order?.clothingType || 'Tailoring'} • #{order?.id?.slice(-6).toUpperCase() || '??????'}</p>
                  </div>
                  <Badge variant={order?.status || 'pending'} className="capitalize">{order?.status || 'pending'}</Badge>
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
          ))
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
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Update Order Status</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['pending', 'stitching', 'ready', 'delivered'] as OrderStatus[]).map((status) => (
                      <Button 
                        key={status} 
                        size="sm" 
                        variant={selectedOrder.status === status ? 'default' : 'outline'}
                        onClick={async () => {
                          try {
                            await updateOrderStatus(selectedOrder.id, status);
                            setSelectedOrder(null);
                            toast.success(`Status updated to ${status}`);
                          } catch (e) {
                            console.error("Update status error:", e);
                            toast.error("Failed to update status");
                          }
                        }}
                        className={cn(
                          "capitalize h-10 font-semibold transition-all",
                          selectedOrder.status === status ? "shadow-md shadow-primary/20" : "hover:border-primary/50"
                        )}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-row justify-between sm:justify-end gap-2 w-full pt-4 border-t">
                <Button variant="outline" className="flex-1 sm:flex-none gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200" onClick={handleWhatsAppShare}>
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </Button>
                <Button className="flex-1 sm:flex-none gap-2" onClick={handleDownloadInvoice} disabled={isDownloading}>
                  {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download Invoice
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden container to generate invoice image */}
      <div className="fixed left-[-9999px]">
         {selectedOrder && <InvoiceTemplate ref={invoiceRef} order={selectedOrder} />}
      </div>

    </div>
  );
}
