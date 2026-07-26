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
  customer?: any;
  onSaveOrderFields: (fields: Record<string, any>) => Promise<void>;
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
  customer,
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
  const [clothingType, setClothingType] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [advancePayment, setAdvancePayment] = useState<number | string>('');
  const [notes, setNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [rackLocation, setRackLocation] = useState('');
  const [footerText, setFooterText] = useState('');

  useEffect(() => {
    if (order) {
      setClothingType(order.clothingType || order.dressType || 'Custom Suit');
      setPrice(order.price ?? 0);
      setAdvancePayment(order.advancePayment ?? 0);
      setNotes(order.notes || order.designNotes || '');
      setDeliveryDate(toInputDateString(order.deliveryDate));
      setRackLocation(order.rackLocation || '');
    }
  }, [order, isEditing]);

  useEffect(() => {
    setFooterText(currentFooter || '');
  }, [currentFooter, isEditing]);

  const tokenNumber = order?.tokenId || order?.id?.substring(0, 8).toUpperCase() || 'N/A';

  // 100% Fail-Proof PNG Export
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
      await new Promise(resolve => setTimeout(resolve, 200));

      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(invoiceEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false
        });
      } catch {
        // Fallback for CORS image restrictions
        canvas = await html2canvas(invoiceEl, {
          scale: 2,
          useCORS: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false
        });
      }

      const url = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Invoice-${tokenNumber}-${(customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      link.href = url;
      link.click();
      toast.success('Invoice PNG exported successfully!');
    } catch (error) {
      console.error('PNG Download Error:', error);
      toast.error('Export error. Taking a quick screenshot recommended.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Direct WhatsApp Share targeting Customer Phone
  const handleShareWhatsApp = () => {
    const rawPhone = order?.customerPhone || order?.phone || customer?.phone || customer?.mobile || customer?.whatsapp || '';
    const formattedPhone = formatWhatsAppNumber(rawPhone);

    const priceNum = Number(price) || Number(order?.price) || 0;
    const advanceNum = Number(advancePayment) || Number(order?.advancePayment) || 0;
    const balanceNum = Math.max(0, priceNum - advanceNum);

    const deliveryDateStr = order?.deliveryDate 
      ? (typeof order.deliveryDate.toDate === 'function' ? order.deliveryDate.toDate().toLocaleDateString() : new Date(order.deliveryDate).toLocaleDateString())
      : 'N/A';

    const message = `🧾 *OFFICIAL INVOICE — ${shopName}*
----------------------------------------
📋 *Invoice Token #*: #${tokenNumber}
👤 *Customer*: ${customerName || order?.customerName || 'Valued Customer'}
👗 *Dress Type*: ${clothingType || order?.clothingType || 'Custom Suit'}
📅 *Delivery Date*: ${deliveryDateStr}

----------------------------------------
💰 *Total Amount*: PKR ${priceNum.toLocaleString()}
✅ *Advance Paid*: PKR ${advanceNum.toLocaleString()}
🔴 *Balance Due*: PKR ${balanceNum.toLocaleString()}

Thank you for choosing *${shopName}*!
For queries, contact us.`;

    const encodedMsg = encodeURIComponent(message);
    
    // Target exact customer phone if available!
    const url = formattedPhone 
      ? `https://wa.me/${formattedPhone}?text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;
      
    window.open(url, '_blank');
    if (formattedPhone) {
      toast.success(`Opening WhatsApp for +${formattedPhone}!`);
    } else {
      toast.info('Opening WhatsApp (Customer phone not set in profile)');
    }
  };

  // Save Edits to Database (Firestore & MongoDB)
  const handleSaveChanges = async () => {
    setIsSavingDetails(true);
    try {
      let finalDate: any = order?.deliveryDate || null;
      if (deliveryDate) {
        const dateParts = deliveryDate.split('-');
        finalDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
      }

      const pNum = Number(price) || 0;
      const aNum = Number(advancePayment) || 0;
      const rNum = Math.max(0, pNum - aNum);

      await onSaveOrderFields({
        clothingType,
        dressType: clothingType,
        price: pNum,
        advancePayment: aNum,
        remainingPayment: rNum,
        notes,
        designNotes: notes,
        deliveryDate: finalDate,
        rackLocation
      });
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save edits to database');
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Save Default Shop Footer
  const handleSaveFooter = async () => {
    setIsSavingFooter(true);
    try {
      await onSaveFooter(footerText);
    } catch (err: any) {
      console.error(err);
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
          className="flex-1 min-w-[130px] rounded-xl font-bold border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors h-11 sm:h-12 text-xs sm:text-sm"
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
          className="flex-1 min-w-[150px] rounded-xl font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-md active:scale-95 transition-all h-11 sm:h-12 text-xs sm:text-sm"
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
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 text-left">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-[#0D3D33]" />
              Edit Invoice Details (Saved to Database)
            </h3>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Dress / Garment Type
              </label>
              <input 
                type="text" 
                value={clothingType} 
                onChange={e => setClothingType(e.target.value)} 
                className="w-full p-3 border rounded-xl bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0D3D33]" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Total Price (PKR)
              </label>
              <input 
                type="number" 
                value={price} 
                onChange={e => setPrice(e.target.value)} 
                className="w-full p-3 border rounded-xl bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0D3D33]" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Advance Paid (PKR)
              </label>
              <input 
                type="number" 
                value={advancePayment} 
                onChange={e => setAdvancePayment(e.target.value)} 
                className="w-full p-3 border rounded-xl bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0D3D33]" 
              />
            </div>

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
              Special Stitching Instructions / Notes
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

          <div className="border-t pt-4 space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Default Shop Invoice Footer Text & Terms
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
