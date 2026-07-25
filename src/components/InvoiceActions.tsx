import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, Share2, Edit2, Check, Loader2, Save, Calendar, Hash, Tag, FileText, AlignLeft, X, MessageSquare } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { formatWhatsAppNumber } from '../lib/utils';

interface InvoiceActionsProps {
  invoiceRef: React.RefObject<HTMLDivElement | null>;
  orderId: string;
  order: any;
  onSaveOrderFields: (fields: { notes?: string; deliveryDate?: any; rackLocation?: string }) => Promise<void>;
  customerName: string;
  shopName: string;
  currentFooter: string;
  onSaveFooter: (newFooter: string) => Promise<void>;
}

const toInputDateString = (val: any) => {
  if (!val) return '';
  let d: Date;
  if (val?.toDate) d = val.toDate();
  else if (val?.seconds) d = new Date(val.seconds * 1000);
  else d = new Date(val);
  
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const InvoiceActions: React.FC<InvoiceActionsProps> = ({
  invoiceRef,
  orderId,
  order,
  onSaveOrderFields,
  customerName,
  shopName,
  currentFooter,
  onSaveFooter
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isSavingFooter, setIsSavingFooter] = useState(false);

  // Edit fields states
  const [notes, setNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [rackLocation, setRackLocation] = useState('');
  const [footerText, setFooterText] = useState('');

  useEffect(() => {
    if (order) {
      setNotes(order.notes || order.designNotes || '');
      setDeliveryDate(toInputDateString(order.deliveryDate));
      setRackLocation(order.rackLocation || '');
    }
  }, [order, isEditing]);

  useEffect(() => {
    setFooterText(currentFooter || '');
  }, [currentFooter, isEditing]);

  const tokenNumber = order?.tokenId || order?.id?.substring(0, 8).toUpperCase() || 'N/A';

  // Reliable PNG Download
  const handleSaveAsPNG = async () => {
    if (isDownloading || isSharing) return;
    setIsDownloading(true);
    const invoiceEl = document.getElementById('invoice-to-share');
    if (!invoiceEl) {
      toast.error('Invoice element not found');
      setIsDownloading(false);
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 150));

      const canvas = await html2canvas(invoiceEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const url = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Invoice-${tokenNumber}-${customerName || 'Customer'}.png`;
      link.href = url;
      link.click();
      toast.success('Invoice PNG exported successfully!');
    } catch (error) {
      console.error('PNG Download Failed:', error);
      toast.error('Export failed. Try taking a screenshot instead.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Direct WhatsApp Share
  const handleShareWhatsApp = () => {
    const phone = order?.customerPhone || order?.phone || '';
    const formattedPhone = formatWhatsAppNumber(phone);

    const price = Number(order?.price) || 0;
    const advance = Number(order?.advancePayment) || 0;
    const remaining = Number(order?.remainingPayment) || Math.max(0, price - advance);

    const message = `🧾 *OFFICIAL INVOICE — ${shopName}*
----------------------------------
📋 *Invoice Token*: #${tokenNumber}
👤 *Customer*: ${customerName || 'Valued Customer'}
👗 *Dress Type*: ${order?.clothingType || 'Custom Suit'}
📅 *Delivery Date*: ${order?.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}

----------------------------------
💰 *Total Amount*: PKR ${price.toLocaleString()}
✅ *Advance Paid*: PKR ${advance.toLocaleString()}
🔴 *Balance Due*: PKR ${remaining.toLocaleString()}

Thank you for choosing *${shopName}*!
For queries, contact us.`;

    const encodedMsg = encodeURIComponent(message);
    const url = formattedPhone 
      ? `https://wa.me/${formattedPhone}?text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;
      
    window.open(url, '_blank');
    toast.success('Opening WhatsApp with invoice details!');
  };

  // Web Share / File Share
  const handleShareFile = async () => {
    if (isDownloading || isSharing) return;
    setIsSharing(true);
    const invoiceEl = document.getElementById('invoice-to-share');
    if (!invoiceEl) {
      toast.error('Invoice element not found');
      setIsSharing(false);
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 150));

      const canvas = await html2canvas(invoiceEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Failed to create image file');
          setIsSharing(false);
          return;
        }

        const file = new File(
          [blob],
          `Invoice-${tokenNumber}.png`,
          { type: 'image/png' }
        );

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `Invoice ${tokenNumber}`,
              text: `Order invoice from ${shopName}`,
              files: [file]
            });
            toast.success('Shared successfully!');
          } catch (e: any) {
            if (e.name !== 'AbortError') {
              handleShareWhatsApp();
            }
          }
        } else {
          handleShareWhatsApp();
        }
        setIsSharing(false);
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Share failed:', error);
      handleShareWhatsApp();
      setIsSharing(false);
    }
  };

  // Save edits to order details (Firestore / MongoDB)
  const handleSaveChanges = async () => {
    setIsSavingDetails(true);
    try {
      let finalDate: any = null;
      if (deliveryDate) {
        const dateParts = deliveryDate.split('-');
        finalDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
      }

      await onSaveOrderFields({
        notes,
        deliveryDate: finalDate,
        rackLocation
      });
      setIsEditing(false);
      toast.success('Invoice details updated & saved to database!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save edits to database');
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Save footer changes
  const handleSaveFooter = async () => {
    setIsSavingFooter(true);
    try {
      await onSaveFooter(footerText);
      toast.success('Invoice footer updated!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save footer text');
    } finally {
      setIsSavingFooter(false);
    }
  };

  const isAnyProcessing = isDownloading || isSharing || isSavingDetails || isSavingFooter;

  return (
    <div className="w-full max-w-full sm:max-w-2xl mx-auto mt-4 sm:mt-6 space-y-4 sm:space-y-6 px-2">
      
      {/* Action Buttons Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 shadow-md">
        <Button 
          variant="outline"
          onClick={handleSaveAsPNG}
          disabled={isAnyProcessing}
          className="flex-1 min-w-[140px] rounded-xl font-bold border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors h-11 sm:h-12 text-xs sm:text-sm"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#0D3D33]" />
          ) : (
            <Download className="w-4 h-4 mr-2 text-[#0D3D33]" />
          )}
          Export PNG
        </Button>

        <Button 
          onClick={handleShareWhatsApp}
          disabled={isAnyProcessing}
          className="flex-1 min-w-[140px] rounded-xl font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-md active:scale-95 transition-all h-11 sm:h-12 text-xs sm:text-sm"
        >
          <MessageSquare className="w-4 h-4 mr-2 text-white" />
          Share to WhatsApp
        </Button>

        <Button 
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
          disabled={isAnyProcessing}
          className={`flex-1 min-w-[120px] rounded-xl font-bold transition-all h-11 sm:h-12 text-xs sm:text-sm ${
            isEditing 
              ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800" 
              : "border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
          }`}
        >
          <Edit2 className="w-4 h-4 mr-2" />
          {isEditing ? "Close Edit" : "Edit Invoice"}
        </Button>
      </div>

      {/* Edit Invoice Drawer Panel */}
      {isEditing && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-[#0D3D33]" />
              Edit Invoice Details (Saved to Database)
            </h3>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 text-left">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Delivery Date
              </label>
              <input 
                type="date" 
                value={deliveryDate} 
                onChange={e => setDeliveryDate(e.target.value)} 
                className="w-full p-3 border rounded-xl bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0D3D33]" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Rack / Storage Location
              </label>
              <input 
                type="text" 
                value={rackLocation} 
                onChange={e => setRackLocation(e.target.value)} 
                placeholder="e.g. Rack A-12" 
                className="w-full p-3 border rounded-xl bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0D3D33]" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Special Instructions / Notes
              </label>
              <textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="Write custom instructions for this invoice..." 
                rows={3} 
                className="w-full p-3 border rounded-xl bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0D3D33]" 
              />
            </div>

            <Button 
              onClick={handleSaveChanges} 
              disabled={isSavingDetails}
              className="w-full bg-[#0D3D33] hover:bg-[#092B24] text-white font-bold rounded-xl h-11"
            >
              {isSavingDetails ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Order Changes to Database
            </Button>
          </div>

          <div className="border-t pt-4 space-y-3 text-left">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Shop Invoice Footer Text & Terms
            </label>
            <textarea 
              value={footerText} 
              onChange={e => setFooterText(e.target.value)} 
              rows={3} 
              className="w-full p-3 border rounded-xl bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0D3D33]" 
            />
            <Button 
              onClick={handleSaveFooter} 
              disabled={isSavingFooter}
              variant="outline"
              className="w-full font-bold rounded-xl h-11 border-slate-300"
            >
              {isSavingFooter ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Default Shop Footer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
