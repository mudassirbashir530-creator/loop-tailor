import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, Share2, Edit2, Check, Loader2, Save, Calendar, Hash, Tag, FileText, AlignLeft, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

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

  // Sync state values when edit opens or order updates
  useEffect(() => {
    if (order) {
      setNotes(order.notes || '');
      setDeliveryDate(toInputDateString(order.deliveryDate));
      setRackLocation(order.rackLocation || '');
    }
  }, [order, isEditing]);

  useEffect(() => {
    setFooterText(currentFooter || '');
  }, [currentFooter, isEditing]);

  const tokenNumber = order?.tokenId || order?.id?.substring(0, 8).toUpperCase() || 'N/A';

  // PART 4 — SAVE AS PNG (Download)
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
      // Small timeout to ensure the DOM has completed all paints and fonts are ready to print.
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(invoiceEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 600,
        windowWidth: 600,
        logging: false
      });

      const url = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Invoice-${tokenNumber}-${customerName}.png`;
      link.href = url;
      link.click();
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('PNG Download Failed:', error);
      toast.error('Download failed. Try taking a screenshot or printing instead.');
    } finally {
      setIsDownloading(false);
    }
  };

  // PART 5 — SHARE INVOICE
  const handleShare = async () => {
    if (isDownloading || isSharing) return;
    setIsSharing(true);
    const invoiceEl = document.getElementById('invoice-to-share');
    if (!invoiceEl) {
      toast.error('Invoice element not found');
      setIsSharing(false);
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(invoiceEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 600,
        windowWidth: 600
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Failed to create image blob');
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
            // User aborted the native dialog, ignore. If different error, fallback to download.
            if (e.name !== 'AbortError') {
              console.error('Web share dialog failed:', e);
              // Fallback to direct download
              const url = canvas.toDataURL('image/png');
              const a = document.createElement('a');
              a.href = url;
              a.download = `Invoice-${tokenNumber}.png`;
              a.click();
              toast.info('Share cancelled or not supported. File downloaded instead.');
            }
          }
        } else {
          // Fallback: download instead if CanShare not supported or missing
          const url = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = url;
          a.download = `Invoice-${tokenNumber}.png`;
          a.click();
          toast.info('Direct Web Share is not supported on this platform. Saving download instead.');
        }
        setIsSharing(false);
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Share failed:', error);
      toast.error('Share failed. Try download instead.');
      setIsSharing(false);
    }
  };

  // Save changes to Order details
  const handleSaveChanges = async () => {
    setIsSavingDetails(true);
    try {
      let finalDate: any = null;
      if (deliveryDate) {
        // Construct a safe date object from standard format
        const dateParts = deliveryDate.split('-');
        finalDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
      }

      await onSaveOrderFields({
        notes,
        deliveryDate: finalDate,
        rackLocation
      });
      // Close editing modal on success
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Save changes to footer
  const handleSaveFooter = async () => {
    setIsSavingFooter(true);
    try {
      await onSaveFooter(footerText);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingFooter(false);
    }
  };

  const isAnyProcessing = isDownloading || isSharing || isSavingDetails || isSavingFooter;

  return (
    <div className="w-full max-w-[600px] mx-auto mt-6 space-y-6">
      
      {/* PART 6 — ACTION BUTTONS BAR */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-3 shadow-md">
        <Button 
          variant="outline"
          onClick={handleSaveAsPNG}
          disabled={isAnyProcessing}
          className="flex-1 rounded-xl font-bold border-gray-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors h-14"
        >
          {isDownloading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin text-primary" />
          ) : (
            <Download className="w-5 h-5 mr-2 text-primary" />
          )}
          Download PNG
        </Button>

        <Button 
          onClick={handleShare}
          disabled={isAnyProcessing}
          className="flex-1 rounded-xl font-bold bg-[#1a3a2a] hover:bg-[#153022] text-white shadow-md active:scale-95 transition-all h-14"
        >
          {isSharing ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin text-white" />
          ) : (
            <Share2 className="w-5 h-5 mr-2 text-white" />
          )}
          Share
        </Button>

        <Button 
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
          disabled={isAnyProcessing}
          className={`flex-1 rounded-xl font-bold border-gray-300 text-slate-700 transition-colors h-14 ${isEditing ? 'bg-primary-50 border-primary text-primary bg-slate-100' : 'bg-white hover:bg-slate-50'}`}
        >
          <Edit2 className="w-5 h-5 mr-2 text-primary" />
          {isEditing ? 'Hide Edit' : 'Edit'}
        </Button>
      </div>

      {/* Editing Panel (Collapsible Grid) */}
      {isEditing && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-md space-y-6 animate-in slide-in-from-top-4 duration-300">
          
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-[#1a3a2a]" />
              Edit Invoice Settings
            </h3>
            <button 
              onClick={() => setIsEditing(false)}
              className="p-1 rounded-full hover:bg-slate-100 transition-colors text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* COLUMN 1: EDIT INVOICE DETAILS */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#1a3a2a] uppercase tracking-wider border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Invoice Contents
              </h4>

              {/* Rack Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3 h-3 text-gray-400" />
                  Rack Location
                </label>
                <input
                  type="text"
                  value={rackLocation}
                  onChange={(e) => setRackLocation(e.target.value)}
                  className="w-full text-sm font-medium p-3 border border-gray-250 border-gray-200 rounded-xl outline-none focus:border-[#1a3a2a] focus:ring-1 focus:ring-[#1a3a2a] transition-all bg-slate-50 shadow-inner"
                  placeholder="e.g. Rack A-4"
                />
              </div>

              {/* Delivery Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full text-sm font-medium p-3 border border-gray-250 border-gray-200 rounded-xl outline-none focus:border-[#1a3a2a] focus:ring-1 focus:ring-[#1a3a2a] transition-all bg-slate-50 shadow-inner"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <AlignLeft className="w-3 h-3 text-gray-400" />
                  Order Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-sm font-medium p-3 border border-gray-250 border-gray-200 rounded-xl outline-none focus:border-[#1a3a2a] focus:ring-1 focus:ring-[#1a3a2a] transition-all bg-slate-50 shadow-inner resize-none h-[96px]"
                  placeholder="Add details, instructions or requests..."
                />
              </div>

              {/* Save Details Button */}
              <Button 
                onClick={handleSaveChanges}
                disabled={isAnyProcessing}
                className="w-full rounded-xl bg-primary hover:bg-primary/95 text-white font-bold h-11 shadow-sm flex items-center justify-center gap-1.5"
              >
                {isSavingDetails ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Details
              </Button>
            </div>

            {/* COLUMN 2: EDIT INVOICE FOOTER */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#1a3a2a] uppercase tracking-wider border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5" />
                Shop Invoice Footer
              </h4>

              {/* Notes style text area for footer */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Footer Message
                </label>
                <textarea
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full text-sm font-medium p-3 border border-gray-250 border-gray-200 rounded-xl outline-none focus:border-[#1a3a2a] focus:ring-1 focus:ring-[#1a3a2a] transition-all bg-slate-50 shadow-inner resize-none h-[202px]"
                  placeholder={`Thank you for choosing ${shopName}!\nFor queries, contact us on WhatsApp.`}
                />
              </div>

              {/* Save Footer Button */}
              <Button 
                onClick={handleSaveFooter}
                disabled={isAnyProcessing}
                className="w-full rounded-xl bg-[#1a3a2a] hover:bg-[#152e21] text-white font-bold h-11 shadow-sm flex items-center justify-center gap-1.5"
              >
                {isSavingFooter ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Save Footer
              </Button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
