import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, Edit2, Loader2, Save, X, MessageSquare, Share2, Sparkles } from 'lucide-react';
import { toPng } from 'html-to-image';
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
  customerName: propCustomerName,
  shopName,
  currentFooter,
  onSaveFooter
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isSavingFooter, setIsSavingFooter] = useState(false);

  // Editable fields states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [clothingType, setClothingType] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [advancePayment, setAdvancePayment] = useState<number | string>('');
  const [notes, setNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [rackLocation, setRackLocation] = useState('');
  const [footerText, setFooterText] = useState('');

  // Measurements edit state
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [length, setLength] = useState('');
  const [shoulder, setShoulder] = useState('');
  const [sleeves, setSleeves] = useState('');
  const [neck, setNeck] = useState('');

  useEffect(() => {
    if (order) {
      setCustomerName(order.customerName || propCustomerName || 'Valued Customer');
      setCustomerPhone(order.customerPhone || order.phone || customer?.phone || customer?.mobile || '');
      setClothingType(order.clothingType || order.dressType || 'Custom Suit');
      setServiceCategory(order.serviceCategory || 'Bespoke');
      setPrice(order.price ?? 0);
      setAdvancePayment(order.advancePayment ?? 0);
      setNotes(order.notes || order.designNotes || '');
      setDeliveryDate(toInputDateString(order.deliveryDate));
      setRackLocation(order.rackLocation || '');

      const m = order.measurements || {};
      setChest(m.chest || m.kameezLength || '');
      setWaist(m.waist || m.bazu || '');
      setLength(m.length || m.teera || '');
      setShoulder(m.shoulder || m.gala || '');
      setSleeves(m.sleeves || m.chati || '');
      setNeck(m.neck || m.shalwarLength || '');
    }
  }, [order, propCustomerName, customer, isEditing]);

  useEffect(() => {
    setFooterText(currentFooter || '');
  }, [currentFooter, isEditing]);

  const tokenNumber = order?.tokenId || order?.id?.substring(0, 8).toUpperCase() || 'N/A';

  // Base64 helper for image CORS compatibility
  const convertImagesToBase64 = async (element: HTMLElement) => {
    const images = Array.from(element.getElementsByTagName('img'));
    const originalSrcs: { img: HTMLImageElement; src: string }[] = [];

    for (const img of images) {
      if (img.src && !img.src.startsWith('data:')) {
        originalSrcs.push({ img, src: img.src });
        try {
          const response = await fetch(img.src, { mode: 'cors' });
          const blob = await response.blob();
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                img.src = reader.result;
              }
              resolve();
            };
            reader.onerror = () => resolve();
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn("Base64 conversion skipped for image:", e);
        }
      }
    }
    return () => {
      originalSrcs.forEach(({ img, src }) => {
        img.src = src;
      });
    };
  };

  // High-Resolution PNG Generator Engine
  const captureInvoicePNG = async (): Promise<{ dataUrl: string; blob: Blob; file: File }> => {
    const invoiceEl = document.getElementById('invoice-to-share') || invoiceRef.current;
    if (!invoiceEl) {
      throw new Error('Invoice preview card element not found');
    }

    let restoreImages: (() => void) | null = null;
    try {
      restoreImages = await convertImagesToBase64(invoiceEl);
      await new Promise((resolve) => setTimeout(resolve, 200));

      let dataUrl = '';
      try {
        dataUrl = await toPng(invoiceEl, {
          quality: 1.0,
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: '#ffffff'
        });
      } catch (err) {
        console.warn("toPng fallback to html2canvas:", err);
        const canvas = await html2canvas(invoiceEl, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false
        });
        dataUrl = canvas.toDataURL('image/png', 1.0);
      }

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileName = `Invoice-${tokenNumber}-${(customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      return { dataUrl, blob, file };
    } finally {
      if (restoreImages) restoreImages();
    }
  };

  // 1. Export Crisp PNG Image
  const handleExportPNG = async () => {
    if (isDownloading || isSharing) return;
    setIsDownloading(true);
    try {
      const { dataUrl, file } = await captureInvoicePNG();
      const link = document.createElement('a');
      link.download = file.name;
      link.href = dataUrl;
      link.click();
      toast.success('Invoice PNG exported successfully!');
    } catch (error: any) {
      console.error('PNG Export Error:', error);
      toast.error('PNG Export failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // 2. Direct WhatsApp PNG Image Sharing
  const handleShareWhatsAppPNG = async () => {
    if (isDownloading || isSharing) return;
    setIsSharing(true);
    try {
      const { file, dataUrl } = await captureInvoicePNG();
      const rawPhone = customerPhone || order?.customerPhone || order?.phone || customer?.phone || '';
      const formattedPhone = formatWhatsAppNumber(rawPhone);

      const priceNum = Number(price) || Number(order?.price) || 0;
      const advanceNum = Number(advancePayment) || Number(order?.advancePayment) || 0;
      const balanceNum = Math.max(0, priceNum - advanceNum);

      const deliveryDateStr = deliveryDate || (order?.deliveryDate 
        ? (typeof order.deliveryDate.toDate === 'function' ? order.deliveryDate.toDate().toLocaleDateString() : new Date(order.deliveryDate).toLocaleDateString())
        : 'N/A');

      const messageText = `🧾 *OFFICIAL INVOICE — ${shopName}*\n----------------------------------------\n📋 *Token #*: #${tokenNumber}\n👤 *Customer*: ${customerName || 'Valued Customer'}\n👗 *Dress Type*: ${clothingType || 'Custom Suit'}\n📅 *Delivery*: ${deliveryDateStr}\n----------------------------------------\n💰 *Total*: PKR ${priceNum.toLocaleString()}\n✅ *Advance*: PKR ${advanceNum.toLocaleString()}\n🔴 *Balance Due*: PKR ${balanceNum.toLocaleString()}\n\nThank you for choosing *${shopName}*!`;

      // Check if Web Share API with File sharing is supported
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Invoice #${tokenNumber} - ${shopName}`,
            text: messageText,
            files: [file]
          });
          toast.success('Invoice PNG shared directly to WhatsApp!');
          setIsSharing(false);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            setIsSharing(false);
            return;
          }
          console.warn("Web Share API error, using direct link fallback:", shareErr);
        }
      }

      // Fallback for browsers that don't support Web Share API File sharing
      const link = document.createElement('a');
      link.download = file.name;
      link.href = dataUrl;
      link.click();

      // Copy text to clipboard
      try {
        await navigator.clipboard.writeText(messageText);
      } catch (e) {}

      const encodedMsg = encodeURIComponent(messageText);
      const whatsappUrl = formattedPhone 
        ? `https://wa.me/${formattedPhone}?text=${encodedMsg}`
        : `https://api.whatsapp.com/send?text=${encodedMsg}`;
        
      window.open(whatsappUrl, '_blank');
      toast.success('PNG downloaded & WhatsApp opened! Attach PNG in chat.', { duration: 5000 });
    } catch (err: any) {
      console.error("WhatsApp PNG Share Error:", err);
      toast.error('Could not generate WhatsApp PNG preview');
    } finally {
      setIsSharing(false);
    }
  };

  // 3. Save Edits to Database (Firestore + MongoDB Dual Sync)
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

      const updatedMeasurements = {
        ...(order?.measurements || {}),
        ...(chest ? { chest } : {}),
        ...(waist ? { waist } : {}),
        ...(length ? { length } : {}),
        ...(shoulder ? { shoulder } : {}),
        ...(sleeves ? { sleeves } : {}),
        ...(neck ? { neck } : {}),
      };

      await onSaveOrderFields({
        customerName,
        customerPhone,
        phone: customerPhone,
        clothingType,
        dressType: clothingType,
        serviceCategory,
        price: pNum,
        advancePayment: aNum,
        remainingPayment: rNum,
        notes,
        designNotes: notes,
        deliveryDate: finalDate,
        rackLocation,
        measurements: updatedMeasurements
      });
      setIsEditing(false);
    } catch (err: any) {
      console.error("Save invoice error:", err);
      toast.error('Failed to save edits to MongoDB & Firestore');
    } finally {
      setIsSavingDetails(false);
    }
  };

  // 4. Save Default Shop Invoice Footer to Database
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
    <div className="w-full max-w-[650px] mx-auto mt-4 sm:mt-6 space-y-4 sm:space-y-6 px-2">
      
      {/* Primary Action Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 shadow-md">
        <Button 
          variant="outline"
          onClick={handleExportPNG}
          disabled={isAnyProcessing}
          className="w-full rounded-xl font-bold border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-all h-11 sm:h-12 text-xs sm:text-sm active:scale-95"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#0D3D33]" />
          ) : (
            <Download className="w-4 h-4 mr-2 text-[#0D3D33]" />
          )}
          Export PNG
        </Button>

        <Button 
          onClick={handleShareWhatsAppPNG}
          disabled={isAnyProcessing}
          className="w-full rounded-xl font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-md active:scale-95 transition-all h-11 sm:h-12 text-xs sm:text-sm"
        >
          {isSharing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
          ) : (
            <MessageSquare className="w-4 h-4 mr-2 text-white" />
          )}
          Share PNG on WhatsApp
        </Button>

        <Button 
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
          disabled={isAnyProcessing}
          className={`w-full rounded-xl font-bold transition-all h-11 sm:h-12 text-xs sm:text-sm ${
            isEditing 
              ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800" 
              : "border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
          }`}
        >
          <Edit2 className="w-4 h-4 mr-2" />
          {isEditing ? "Close Edit" : "Edit Invoice"}
        </Button>
      </div>

      {/* Real-time Editable Invoice Drawer */}
      {isEditing && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 text-left animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#0D3D33]" />
                Edit Invoice Details
              </h3>
              <p className="text-xs text-slate-500 font-medium">All changes sync automatically to MongoDB & Firestore in real-time.</p>
            </div>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Customer Name
              </label>
              <input 
                type="text" 
                value={customerName} 
                onChange={e => setCustomerName(e.target.value)} 
                className="w-full p-3 border rounded-xl bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0D3D33]" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Customer WhatsApp / Phone
              </label>
              <input 
                type="text" 
                value={customerPhone} 
                onChange={e => setCustomerPhone(e.target.value)} 
                placeholder="e.g. +923001234567" 
                className="w-full p-3 border rounded-xl bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0D3D33]" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Garment / Dress Type
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
                Service Category
              </label>
              <input 
                type="text" 
                value={serviceCategory} 
                onChange={e => setServiceCategory(e.target.value)} 
                placeholder="e.g. Bespoke, Alteration" 
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

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Rack / Storage Location
              </label>
              <input 
                type="text" 
                value={rackLocation} 
                onChange={e => setRackLocation(e.target.value)} 
                placeholder="e.g. Rack B-04" 
                className="w-full p-3 border rounded-xl bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0D3D33]" 
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Special Stitching Instructions / Design Notes
            </label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="Write custom instructions for this invoice..." 
              rows={3} 
              className="w-full p-3 border rounded-xl bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0D3D33]" 
            />
          </div>

          {/* Measurements Edit Grid */}
          <div className="border-t pt-4 space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Edit Custom Measurements
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Length / Kameez</span>
                <input type="text" value={length} onChange={e => setLength(e.target.value)} placeholder="e.g. 40" className="w-full p-2 border rounded-lg bg-slate-50 text-xs font-bold" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Chest / Chati</span>
                <input type="text" value={chest} onChange={e => setChest(e.target.value)} placeholder="e.g. 38" className="w-full p-2 border rounded-lg bg-slate-50 text-xs font-bold" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Waist / Kamar</span>
                <input type="text" value={waist} onChange={e => setWaist(e.target.value)} placeholder="e.g. 34" className="w-full p-2 border rounded-lg bg-slate-50 text-xs font-bold" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Shoulder / Teera</span>
                <input type="text" value={shoulder} onChange={e => setShoulder(e.target.value)} placeholder="e.g. 18" className="w-full p-2 border rounded-lg bg-slate-50 text-xs font-bold" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Sleeves / Bazu</span>
                <input type="text" value={sleeves} onChange={e => setSleeves(e.target.value)} placeholder="e.g. 24" className="w-full p-2 border rounded-lg bg-slate-50 text-xs font-bold" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Gala / Neck</span>
                <input type="text" value={neck} onChange={e => setNeck(e.target.value)} placeholder="e.g. 15.5" className="w-full p-2 border rounded-lg bg-slate-50 text-xs font-bold" />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSaveChanges} 
            disabled={isSavingDetails}
            className="w-full bg-[#0D3D33] hover:bg-[#092B24] text-white font-bold rounded-xl h-12 shadow-md active:scale-95 transition-all"
          >
            {isSavingDetails ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save All Changes to Database (MongoDB & Firestore)
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
              Save Default Shop Footer to Database
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
