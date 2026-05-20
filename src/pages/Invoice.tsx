import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useShop } from '../contexts/ShopContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { ArrowLeft, ArrowRight, Download, Share2, Edit2, FileText, Save, Image as ImageIcon, Ruler } from 'lucide-react';
import { WhatsAppIcon } from '../components/icons/WhatsAppIcon';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cn } from '../lib/utils';
import { openWhatsApp } from '../lib/whatsapp';
import { toast } from 'sonner';

const toDate = (val: any) => {
  if (!val) return new Date();
  if (val?.toDate) return val.toDate();
  if (val?.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
};

const safeNum = (val: any) => Number(val) || 0;

export default function Invoice() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const { settings } = useShop();
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const [order, setOrder] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    shopName: '',
    invoiceFooter: '',
    balanceDueOverride: ''
  });

  useEffect(() => {
    if (!user || !id) return;
    
    const unsubOrder = onSnapshot(doc(db, 'orders', id), (orderSnap) => {
      if (!orderSnap.exists() || orderSnap.data().userId !== user.uid) {
        navigate('/app/orders');
        return;
      }
      setOrder({ id: orderSnap.id, ...orderSnap.data() });
    }, (error) => handleFirestoreError(error, OperationType.GET, `orders/${id}`));

    const unsubShop = onSnapshot(doc(db, 'settings', user.uid), (shopSnap) => {
      try {
        if (shopSnap.exists()) {
          const data = shopSnap.data();
          setShop(data);
          setEditData(prev => ({ 
            ...prev, 
            shopName: data.name || 'Loop Tailor', 
            invoiceFooter: data.invoiceFooter || 'Thank you for choosing Loop Tailor!' 
          }));
        }
      } catch (err) {
        console.error("Error processing shop doc:", err);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `settings/${user.uid}`));

    import('firebase/firestore').then(({ query, collection }) => {
      const qPayments = query(collection(db, `orders/${id}/payments`));
      const unsubPayments = onSnapshot(qPayments, (paymentsSnap) => {
        const pData = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPaymentsList(pData.sort((a: any, b: any) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateA - dateB;
        }));
      }, (error) => handleFirestoreError(error, OperationType.GET, `orders/${id}/payments`));
      
      return () => {
        unsubPayments();
      };
    });

    return () => {
      unsubOrder();
      unsubShop();
    };
  }, [user, id, navigate]);

  useEffect(() => {
    if (!user || !order?.customerId) return;
    const unsubCustomer = onSnapshot(doc(db, 'customers', order.customerId), (custSnap) => {
      if (custSnap.exists()) {
        setCustomer(custSnap.data());
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `customers/${order.customerId}`));

    return () => unsubCustomer();
  }, [user, order?.customerId]);

  if (!order || !shop || !customer) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  const totalPaid = paymentsList.reduce((sum: number, p: any) => sum + safeNum(p.amount), 0) + safeNum(order?.advancePayment);
  const calculatedBalanceDue = Math.max(0, safeNum(order?.price) - totalPaid);
  const displayBalanceDue = editData.balanceDueOverride !== '' ? safeNum(editData.balanceDueOverride) : calculatedBalanceDue;

  const generateCanvas = async () => {
    if (!invoiceRef.current) return null;
    try {
      // Small buffer delay to allow font & layouts to stabilize
      await new Promise(resolve => setTimeout(resolve, 250));

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        backgroundColor: '#FFFFFF',
        logging: false
      });

      return canvas;
    } catch (error) {
      console.error('Error generating canvas:', error);
      return null;
    }
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) throw new Error("Failed to render invoice image");
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Invoice_${order.tokenId || order.id.slice(-6).toUpperCase()}.pdf`);
      toast.success("PDF invoice downloaded successfully");
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error("Failed to save PDF. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = async () => {
    setIsGenerating(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) throw new Error("Failed to render image");
      
      const imgUrl = canvas.toDataURL('image/png', 1.0);
      const a = document.createElement('a');
      a.href = imgUrl;
      a.download = `Invoice_${order.tokenId || order.id.slice(-6).toUpperCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Invoice image saved successfully");
    } catch (error) {
      console.error('Error downloading Image:', error);
      toast.error("Failed to save image");
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDFBlob = async (): Promise<Blob | null> => {
    const canvas = await generateCanvas();
    if (!canvas) return null;
    try {
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      return pdf.output('blob');
    } catch (e) {
      console.error("Error creating PDF blob", e);
      return null;
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const pdfBlob = await generatePDFBlob();
      if (!pdfBlob) throw new Error("Could not construct PDF artifact file");
      
      const filename = `Invoice_${order.tokenId || order.id.slice(-6).toUpperCase()}.pdf`;
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });
      
      const shareData = {
        title: `Invoice - ${editData.shopName || shop.name || 'Loop Tailor'}`,
        text: `Invoice #${order.tokenId || order.id.slice(-6).toUpperCase()} for ${customer?.name || 'Customer'}`,
        files: [file]
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success("Native sharing sheets opened successfully");
      } else {
        // Fallback to direct download
        handleDownloadPDF();
      }
    } catch (error) {
      console.error('Error sharing invoice:', error);
      toast.error('Share failed. Saved PDF to your device instead.');
      handleDownloadPDF();
    } finally {
      setIsSharing(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!customer?.phone || customer.phone.trim() === '') {
      toast.error("Please add customer phone number first");
      return;
    }
    
    setIsGenerating(true);
    try {
      const dateFormatted = order?.deliveryDate ? format(toDate(order.deliveryDate), 'MMM dd, yyyy') : 'No delivery date set';
      const statusLabel = (order.status || 'Pending').toUpperCase();

      const messageText = `السلام علیکم *${customer.name}*!\n` +
        `آرڈر کی تفصیلات اور ڈیجیٹل انوائس موصول کریں۔ ✨\n\n` +
        `📋 آرڈر نمبر: *#${order.tokenId || order.id.slice(-6).toUpperCase()}*\n` +
        `👗 لباس: *${order.clothingType || order.dressType || 'Suit'}*\n` +
        `🗓️ واپسی کی تاریخ: *${dateFormatted}*\n` +
        `상태 (اسٹیٹس): *${statusLabel}*\n\n` +
        `💰 کل رقم: PKR ${safeNum(order.price).toLocaleString()}\n` +
        `✅ کل ادائیگی: PKR ${totalPaid.toLocaleString()}\n` +
        `🔴 واجب الادا رقم: PKR ${displayBalanceDue.toLocaleString()}\n\n` +
        `اپنا بل آن لائن دیکھنے کے لیے اس لنک پر جائیں:\n` +
        `${window.location.origin}/app/orders/${order.id}/invoice\n\n` +
        `شکریہ!\n` +
        `*${editData.shopName || shop.name || 'Loop Tailor'}*`;

      openWhatsApp(customer.phone, messageText);
      toast.success("WhatsApp sharing initiated successfully");
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      toast.error('Could not initiate WhatsApp message.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderInvoiceContent = (isCapture = false) => (
    <>
      {/* Brand Header */}
      <div className={cn("flex flex-row justify-between items-start border-b border-slate-200/60 gap-4", isCapture ? "pb-8 mb-8" : "pb-5 mb-5")}>
        <div className="flex items-center gap-3">
          {shop.logoUrl ? (
            <img 
              src={shop.logoUrl} 
              alt="Shop Logo" 
              crossOrigin="anonymous" 
              className={cn("object-contain rounded-xl bg-gray-50 border border-slate-200 p-1", isCapture ? "h-20 w-20" : "h-11 w-11 sm:h-16 sm:w-16")} 
            />
          ) : (
            <div className={cn("rounded-xl bg-indigo-600 font-black text-white flex items-center justify-center shadow-sm select-none", isCapture ? "h-16 w-16 text-3xl" : "h-11 w-11 text-lg sm:h-14 sm:w-14 sm:text-2xl")}>
              LT
            </div>
          )}
          <div>
            {isEditing && !isCapture ? (
              <input 
                type="text" 
                value={editData.shopName} 
                onChange={(e) => setEditData({...editData, shopName: e.target.value})}
                className={cn("font-black text-slate-900 leading-tight tracking-tight bg-white border border-slate-300 rounded px-2 w-full", isCapture ? "text-3xl" : "text-base sm:text-2xl")}
              />
            ) : (
              <h1 className={cn("font-black text-slate-900 leading-tight tracking-tight", isCapture ? "text-3xl" : "text-base sm:text-2xl")}>
                {editData.shopName || shop.name || 'Loop Tailor'}
              </h1>
            )}
            <p className={cn("text-slate-500 font-bold", isCapture ? "text-base mt-0.5" : "text-xs sm:text-sm")}>{shop.phone || 'Store'}</p>
          </div>
        </div>

        <div className="text-right">
          <h2 className={cn("font-black text-indigo-600 tracking-tighter uppercase", isCapture ? "text-2xl" : "text-sm sm:text-xl")}>
            {t('invoice.invoice') || 'INVOICE'}
          </h2>
          <p className={cn("font-black text-slate-400 mt-0.5", isCapture ? "text-base" : "text-xs sm:text-sm")}>
            #{order.tokenId || order.id.slice(-6).toUpperCase()}
          </p>
          {/* Status Badge */}
          <div className="mt-1.5 flex justify-end">
            <span className={cn(
              "text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block",
              order.status === 'delivered' ? "bg-emerald-100 text-emerald-800" :
              order.status === 'ready' ? "bg-indigo-100 text-indigo-800" :
              order.status === 'stitching' ? "bg-amber-100 text-amber-800" :
              "bg-slate-100 text-slate-800"
            )}>
              {order.status || 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Bill To & Dates */}
      <div className={cn("grid grid-cols-2 gap-4 border-b border-dashed border-slate-200/80 pb-6", isCapture ? "mb-8 text-base" : "mb-5 text-[13px] sm:text-[15px]")}>
        <div className="space-y-1 pr-2">
          <h3 className="font-extrabold text-slate-400 uppercase tracking-widest text-[10px] sm:text-xs">
            {t('invoice.billTo') || 'BILL TO'}
          </h3>
          <p className="font-black text-slate-900 leading-snug">{customer?.name || 'Customer'}</p>
          <p className="text-slate-500 font-bold tracking-tight">
            {customer?.phone || 'No phone number'}
          </p>
        </div>
        <div className="space-y-1 text-right pl-2">
          <h3 className="font-extrabold text-slate-400 uppercase tracking-widest text-[10px] sm:text-xs">
            {t('invoice.delivery') || 'DUE DATE'}
          </h3>
          <p className="font-black text-slate-900">
            {order?.deliveryDate ? format(toDate(order.deliveryDate), 'MMM dd, yyyy') : 'No Due Date'}
          </p>
          <p className="text-slate-500 font-semibold text-[11px] sm:text-xs">
            Issued: {format(new Date(), 'MMM dd, yyyy')}
          </p>
        </div>
      </div>

      {/* Order Item Description */}
      <div className={cn("border-b border-slate-200/80 pb-6", isCapture ? "mb-8 text-base" : "mb-5 text-[13px] sm:text-[15px]")}>
        <div className="flex justify-between items-center py-1.5 font-extrabold text-slate-400 uppercase tracking-widest text-[10px] sm:text-xs">
          <span>{t('invoice.description') || 'ITEM DESCRIPTION'}</span>
          <span className="text-right">{t('invoice.amount') || 'TOTAL AMOUNT'}</span>
        </div>
        
        <div className="flex justify-between items-start py-2.5">
          <div className="flex-1">
            <p className="font-black text-slate-900 text-base sm:text-lg">
              {order?.clothingType || order?.dressType || 'Custom Suit'}
            </p>
            <p className="text-slate-500 font-bold block text-xs sm:text-sm">
              Custom Tailored Garment
            </p>
          </div>
          <p className="font-semibold text-slate-900 text-base sm:text-lg shrink-0">
            {settings?.currency || 'PKR'} {safeNum(order?.price).toLocaleString()}
          </p>
        </div>

        {/* Display Item Measurements Inline */}
        {order?.measurements && Object.keys(order.measurements).length > 0 && (
          <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
            <div className="flex items-center gap-1.5 mb-3 text-slate-500 font-bold text-xs">
              <Ruler className="h-3.5 w-3.5" />
              <span>GARMENT MEASUREMENTS ({order?.clothingType || order?.dressType || 'Suit'})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
              {Object.entries(order.measurements as Record<string, any>).map(([key, value]) => {
                if (value === undefined || value === null || value === '') return null;
                const formattedLabel = key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2').trim();
                return (
                  <div key={key} className="flex justify-between items-center text-[11px] sm:text-xs bg-white rounded-lg px-2.5 py-1.5 border border-slate-100 shadow-sm">
                    <span className="text-slate-400 font-semibold truncate capitalize mr-1">{formattedLabel}:</span>
                    <span className="text-slate-900 font-bold shrink-0">{String(value)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Payment History Log */}
      {((paymentsList && paymentsList.length > 0) || safeNum(order.advancePayment) > 0) && (
        <div className={cn("pb-6 border-b border-slate-200/80", isCapture ? "mb-8" : "mb-5")}>
          <h3 className="font-extrabold text-slate-400 uppercase tracking-widest text-[10px] sm:text-xs mb-3">
            PAYMENT HISTORY
          </h3>
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 border border-slate-200/60">
            {safeNum(order.advancePayment) > 0 && (
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <div className="flex flex-col">
                  <span className="text-slate-600">Initial Advance Paid</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{format(toDate(order.createdAt), 'MMM dd, yyyy')}</span>
                </div>
                <span className="text-emerald-600">-{settings.currency} {safeNum(order.advancePayment).toLocaleString()}</span>
              </div>
            )}
            {paymentsList.map((payment: any) => (
              <div key={payment.id} className="flex justify-between items-center text-xs font-bold text-slate-700 pt-2 border-t border-slate-200/40">
                <div className="flex flex-col">
                  <span className="text-slate-600">Payment ({payment.method || 'Cash'}) {payment.note && `(${payment.note})`}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{format(toDate(payment.date), 'MMM dd, yyyy')}</span>
                </div>
                <span className="text-emerald-600">-{settings.currency} {safeNum(payment.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Balance Summary */}
      <div className={cn("flex pb-8 border-b border-slate-200/60", isCapture ? "mb-10" : "mb-6", isRTL ? "justify-start" : "justify-end")}>
        <div className={cn("space-y-2.5 bg-slate-50 rounded-2xl border border-slate-200/60 shadow-sm", isCapture ? "w-96 p-6" : "w-full sm:w-72 p-4")}>
          <div className="flex justify-between font-bold text-slate-500 text-xs sm:text-sm">
            <span>{t('invoice.subtotal') || 'Total Charges'}</span>
            <span>{settings.currency} {safeNum(order.price).toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-emerald-600 text-xs sm:text-sm">
            <span>Total Payments Received</span>
            <span>-{settings.currency} {totalPaid.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center font-black text-slate-900 pt-2.5 border-t border-slate-200">
            <span className="text-sm sm:text-base">{t('invoice.balanceDue') || 'Balance Due'}</span>
            {isEditing && !isCapture ? (
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-500">{settings.currency}</span>
                <input 
                  type="number" 
                  value={editData.balanceDueOverride} 
                  onChange={(e) => setEditData({...editData, balanceDueOverride: e.target.value})}
                  placeholder={calculatedBalanceDue.toString()}
                  className="w-20 text-right bg-white border border-slate-300 rounded px-1.5 py-0.5 text-sm"
                />
              </div>
            ) : (
              <span className="text-indigo-600 text-base sm:text-lg font-black">
                {settings.currency} {displayBalanceDue.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer thank you with address */}
      <div className="text-center space-y-2">
        <p className="font-extrabold text-slate-400 uppercase tracking-widest text-[11px] sm:text-xs">
          {t('invoice.thankYou') || 'THANK YOU FOR YOUR TRUST!'}
        </p>
        {isEditing && !isCapture ? (
          <textarea 
            value={editData.invoiceFooter} 
            onChange={(e) => setEditData({...editData, invoiceFooter: e.target.value})}
            className="font-medium text-slate-500 italic bg-white border border-slate-300 rounded p-2 w-full text-center resize-none text-xs sm:text-sm h-16 shadow-inner"
          />
        ) : (
          <p className="font-bold text-slate-500 italic text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            "{editData.invoiceFooter}"
          </p>
        )}
        <div className="pt-2 text-slate-400 font-bold text-[10px] sm:text-xs">
          <span>{shop.address || 'Loop Tailor Specialist Design Store'}</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 sm:px-0 pb-16 pt-4 bg-[#F8FAFC]">
      {/* Action panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/app/orders')} 
          className="h-10 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-bold shadow-sm"
        >
          {isRTL ? <ArrowRight className="h-4 w-4 ml-1.5" /> : <ArrowLeft className="h-4 w-4 mr-1.5" />} 
          Back to Orders
        </Button>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {isEditing ? (
            <Button 
              variant="default" 
              onClick={() => setIsEditing(false)} 
              className="rounded-xl h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow"
            >
              <Save className="h-4 w-4 mr-1.5" /> Save Edits
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(true)} 
              className="rounded-xl h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-bold shadow-sm"
            >
              <Edit2 className="h-4 w-4 mr-1.5" /> Edit
            </Button>
          )}
          
          <Button 
            onClick={handleWhatsAppShare} 
            disabled={isGenerating} 
            className="rounded-xl h-10 px-4 bg-[#25D366] text-white hover:bg-[#20BE59] font-black shadow-sm"
          >
            <WhatsAppIcon className="h-4 w-4 mr-1.5 fill-current" /> {isGenerating ? 'Wait...' : 'WhatsApp'}
          </Button>
          
          <Button 
            onClick={handleShare} 
            disabled={isSharing} 
            className="rounded-xl h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-bold shadow-sm"
          >
            <Share2 className="h-4 w-4 mr-1.5" /> {isSharing ? 'Sharing...' : 'Share'}
          </Button>
          
          <Button 
            onClick={handleDownloadPDF} 
            disabled={isGenerating} 
            className="rounded-xl h-10 px-4 bg-white hover:bg-slate-50 text-indigo-600 border-slate-200 font-bold shadow-sm"
          >
            <FileText className="h-4 w-4 mr-1.5" /> Save PDF
          </Button>

          <Button 
            onClick={handleDownloadImage} 
            disabled={isGenerating} 
            className="rounded-xl h-10 px-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold shadow-sm"
          >
            <ImageIcon className="h-4 w-4 mr-1.5" /> PNG Image
          </Button>
        </div>
      </div>

      {/* Rendered Invoice Section */}
      <div 
        ref={invoiceRef}
        className={cn("bg-white p-6 sm:p-12 rounded-3xl shadow-sm border border-slate-100 print:border-none print:shadow-none print:p-0 overflow-hidden", isRTL && "text-[1.1rem]")} 
        dir={isRTL ? "rtl" : "ltr"}
      >
        {renderInvoiceContent(false)}
      </div>
    </div>
  );
}
