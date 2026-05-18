import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useShop } from '../contexts/ShopContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { ArrowLeft, ArrowRight, Download, Share2, Edit2, FileText, Save, Image as ImageIcon } from 'lucide-react';
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
            shopName: data.name || '', 
            invoiceFooter: data.invoiceFooter || '' 
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
      if (custSnap.exists()) setCustomer(custSnap.data());
    }, (error) => handleFirestoreError(error, OperationType.GET, `customers/${order.customerId}`));

    return () => unsubCustomer();
  }, [user, order?.customerId]);

  if (!order || !shop || !customer) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div></div>;

  const totalPaid = paymentsList.reduce((sum: number, p: any) => sum + safeNum(p.amount), 0) + safeNum(order?.advancePayment);
  const calculatedBalanceDue = Math.max(0, safeNum(order?.price) - totalPaid);
  const displayBalanceDue = editData.balanceDueOverride !== '' ? safeNum(editData.balanceDueOverride) : calculatedBalanceDue;

  const generateCanvas = async () => {
    if (!invoiceRef.current) return null;
    try {
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      await wait(100);

      // Remove external stylesheets to avoid CORS "cssRules" error
      const stylesheets = Array.from(document.styleSheets);
      const elementsToRemove: HTMLElement[] = [];
      Array.from(document.querySelectorAll('link[rel="stylesheet"]')).forEach(link => {
        if ((link as HTMLLinkElement).href.includes('fonts.googleapis.com')) {
          elementsToRemove.push(link as HTMLElement);
        }
      });
      elementsToRemove.forEach(el => el.parentNode?.removeChild(el));

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        backgroundColor: '#ffffff',
        logging: false
      });

      // Restore stylesheets
      elementsToRemove.forEach(el => document.head.appendChild(el));

      return canvas;
    } catch (error) {
      console.error('Error generating canvas:', error);
      return null;
    }
  };

  const generatePNGBlob = async (): Promise<Blob | null> => {
    const canvas = await generateCanvas();
    if (!canvas) return null;
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png', 1.0);
    });
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) throw new Error("Failed to generate PDF");
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Invoice_${order.tokenId || order.id.slice(-6).toUpperCase()}.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error("Failed to download PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = async () => {
    setIsGenerating(true);
    try {
      const blob = await generatePNGBlob();
      if (!blob) throw new Error("Failed to generate image");
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${order.tokenId || order.id.slice(-6).toUpperCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image downloaded successfully");
    } catch (error) {
      console.error('Error downloading Image:', error);
      toast.error("Failed to download Image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const blob = await generatePNGBlob();
      if (!blob) throw new Error("Failed to generate image");
      
      const file = new File([blob], `Invoice_${order.tokenId || order.id.slice(-6).toUpperCase()}.png`, { type: 'image/png' });
      const shareData = {
        title: `Invoice - ${editData.shopName || shop.name}`,
        files: [file]
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        handleDownloadImage();
      }
    } catch (error) {
      console.error('Error sharing invoice:', error);
      toast.error(t('invoice.shareError') || 'Share failed');
    } finally {
      setIsSharing(false);
    }
  };

  const handleWhatsAppShare = async () => {
    setIsGenerating(true);
    try {
      const blob = await generatePNGBlob();
      if (!blob) throw new Error("Failed to generate image");
      
      const file = new File([blob], `Invoice_${order.tokenId || order.id.slice(-6).toUpperCase()}.png`, { type: 'image/png' });
      
      const messageText = `السلام علیکم *${customer.name}* صاحب! 🎉\nآپ کا آرڈر تیار ہو گیا ہے۔\n📋 Token: #${order.tokenId || order.id.slice(-6).toUpperCase()}\n👗 Dress: ${order.dressType}\n💰 Total: PKR ${safeNum(order.price)}\n✅ Paid: PKR ${totalPaid}\n🔴 Balance: PKR ${displayBalanceDue}\nبراہ کرم جلد تشریف لائیں 🙏\n${editData.shopName || shop.name}`;
      
      const shareData = {
        title: `Invoice - ${editData.shopName || shop.name}`,
        text: messageText,
        files: [file]
      };

      // Try native share first (mobile)
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback for desktop: download image and open WA web
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${order.tokenId || order.id.slice(-6).toUpperCase()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (customer?.phone) {
          openWhatsApp(customer.phone, messageText);
        } else {
          openWhatsApp('', messageText);
        }
      }
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      toast.error(t('invoice.shareError') || 'Share failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderInvoiceContent = (isCapture = false) => (
    <>
      <div className={cn("flex flex-row justify-between items-start border-b border-slate-100 gap-4", isCapture ? "pb-8 mb-8" : "pb-5 mb-5")}>
        <div className="flex items-center gap-3">
          {shop.logoUrl && <img src={shop.logoUrl} alt="Shop Logo" crossOrigin="anonymous" className={cn("object-contain rounded-xl bg-gray-100 shadow-neu-pressed-sm p-1", isCapture ? "h-20 w-20" : "h-10 w-10 sm:h-16 sm:w-16")} />}
          <div>
            {isEditing && !isCapture ? (
              <input 
                type="text" 
                value={editData.shopName} 
                onChange={(e) => setEditData({...editData, shopName: e.target.value})}
                className={cn("font-black text-slate-900 leading-tight tracking-tight bg-white border rounded px-2 w-full", isCapture ? "text-4xl" : "text-xl sm:text-3xl")}
              />
            ) : (
              <h1 className={cn("font-black text-slate-900 leading-tight tracking-tight", isCapture ? "text-4xl" : "text-xl sm:text-3xl")}>{editData.shopName || shop.name}</h1>
            )}
            <p className={cn("text-slate-500 font-medium", isCapture ? "text-lg mt-1" : "text-xs sm:text-base")}>{shop.phone}</p>
          </div>
        </div>
        <div className={cn(isRTL ? "text-left" : "text-right")}>
          <h2 className={cn("font-black text-brand-primary tracking-tighter uppercase", isCapture ? "text-3xl" : "text-base sm:text-2xl")}>{t('invoice.invoice') || 'INVOICE'}</h2>
          <p className={cn("font-bold text-slate-400 mt-1", isCapture ? "text-lg" : "text-xs sm:text-base")}>#{order.tokenId || order.id.slice(-6).toUpperCase()}</p>
        </div>
      </div>

      <div className={cn("grid grid-cols-2 gap-4", isCapture ? "mb-10" : "mb-6 sm:mb-8")}>
        <div className="space-y-1">
          <h3 className={cn("font-black text-slate-400 uppercase tracking-widest", isCapture ? "text-sm" : "text-xs sm:text-sm")}>{t('invoice.billTo') || 'BILL TO'}</h3>
          <p className={cn("font-bold text-slate-900 leading-tight", isCapture ? "text-xl" : "text-sm sm:text-lg")}>{customer?.name || 'Customer'}</p>
          <p className={cn("text-slate-500 font-medium", isCapture ? "text-lg" : "text-xs sm:text-base truncate max-w-[140px] sm:max-w-none")}>{customer?.phone || 'No phone'}</p>
        </div>
        <div className={cn("space-y-1", isRTL ? "text-left" : "text-right")}>
          <h3 className={cn("font-black text-slate-400 uppercase tracking-widest", isCapture ? "text-sm" : "text-xs sm:text-sm")}>{t('invoice.delivery') || 'DOCUMENT DATE'}</h3>
          <p className={cn("font-bold text-slate-900", isCapture ? "text-xl" : "text-sm sm:text-lg")}>
            {order?.deliveryDate ? format(toDate(order.deliveryDate), 'MMM dd, yyyy') : 'No Date'}
          </p>
          <p className={cn("text-slate-500 font-medium", isCapture ? "text-lg" : "text-xs sm:text-base")}>Issued: {format(new Date(), 'MMM dd, yyyy')}</p>
        </div>
      </div>

      <div className={cn("border-y border-gray-200/50 py-2", isCapture ? "mb-10" : "mb-6 sm:mb-8")}>
        <div className={cn("flex justify-between items-center py-2 font-black text-slate-400 uppercase tracking-widest px-1", isCapture ? "text-sm" : "text-xs sm:text-sm")}>
          <span>{t('invoice.description') || 'DESCRIPTION'}</span>
          <span>{t('invoice.amount') || 'AMOUNT'}</span>
        </div>
        <div className="flex justify-between items-center py-3 px-1">
          <div>
            <p className={cn("font-bold text-slate-900", isCapture ? "text-xl" : "text-sm sm:text-lg")}>{order?.clothingType || order?.dressType || 'Tailoring'}</p>
            <p className={cn("text-slate-500 font-medium", isCapture ? "text-lg" : "text-xs sm:text-base")}>{t('invoice.customTailoring') || 'Custom Tailoring'}</p>
          </div>
          <p className={cn("font-black text-slate-900", isCapture ? "text-xl" : "text-sm sm:text-lg")}>{settings?.currency} {safeNum(order?.price).toLocaleString()}</p>
        </div>
      </div>

      {((paymentsList && paymentsList.length > 0) || safeNum(order.advancePayment) > 0) && (
        <div className={cn("mb-6 sm:mb-8", isCapture ? "mx-1" : "")}>
          <h3 className={cn("font-black text-slate-400 uppercase tracking-widest px-1 mb-2", isCapture ? "text-sm" : "text-xs sm:text-sm")}>Payment History</h3>
          <div className="bg-gray-100 shadow-neu-pressed-sm rounded-2xl border-none p-4 divide-y divide-gray-200/50">
            {safeNum(order.advancePayment) > 0 && (
              <div className="py-2 flex justify-between items-center text-sm font-bold text-slate-700">
                <div className="flex flex-col">
                  <span>{format(toDate(order.createdAt), 'MMM dd, yyyy')}</span>
                  <span className="text-xs text-slate-500 font-medium">Initial Advance</span>
                </div>
                <span className="text-emerald-600">+{settings.currency} {safeNum(order.advancePayment).toLocaleString()}</span>
              </div>
            )}
            {(paymentsList || []).map((payment: any) => (
              <div key={payment.id} className="py-2 flex justify-between items-center text-sm font-bold text-slate-700">
                <div className="flex flex-col">
                  <span>{format(toDate(payment.date), 'MMM dd, yyyy')}</span>
                  <span className="text-xs text-slate-500 font-medium">{payment.method} {payment.note && `- ${payment.note}`}</span>
                </div>
                <span className="text-emerald-600">+{settings.currency} {safeNum(payment.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cn("flex", isCapture ? "mb-12" : "mb-6 sm:mb-10", isRTL ? "justify-start" : "justify-end")}>
        <div className={cn("space-y-3 bg-gray-100 shadow-neu-pressed-sm rounded-2xl border-none", isCapture ? "w-96 p-6" : "w-full sm:w-72 p-4")}>
          <div className={cn("flex justify-between font-bold text-slate-500", isCapture ? "text-base" : "text-xs sm:text-sm")}>
            <span>{t('invoice.subtotal') || 'Subtotal'}</span>
            <span>{settings.currency} {safeNum(order.price).toLocaleString()}</span>
          </div>
          <div className={cn("flex justify-between font-bold text-emerald-600", isCapture ? "text-base" : "text-xs sm:text-sm")}>
            <span>Total Paid</span>
            <span>-{settings.currency} {totalPaid.toLocaleString()}</span>
          </div>
          <div className={cn("flex justify-between items-center font-black text-slate-900 pt-3 border-t border-slate-200", isCapture ? "text-2xl" : "text-base sm:text-xl")}>
            <span>{t('invoice.balanceDue') || 'Balance Due'}</span>
            {isEditing && !isCapture ? (
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{settings.currency}</span>
                <input 
                  type="number" 
                  value={editData.balanceDueOverride} 
                  onChange={(e) => setEditData({...editData, balanceDueOverride: e.target.value})}
                  placeholder={calculatedBalanceDue.toString()}
                  className="w-20 text-right bg-white border rounded px-2"
                />
              </div>
            ) : (
              <span className="text-brand-primary">{settings.currency} {displayBalanceDue.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>

      <div className="text-center space-y-2 pt-8 border-t border-slate-100">
        <p className={cn("font-bold text-slate-400 uppercase tracking-widest", isCapture ? "text-base" : "text-xs sm:text-sm")}>{t('invoice.thankYou') || 'THANK YOU!'}</p>
        {isEditing && !isCapture ? (
          <textarea 
            value={editData.invoiceFooter} 
            onChange={(e) => setEditData({...editData, invoiceFooter: e.target.value})}
            className={cn("font-medium text-slate-500 italic bg-white border rounded px-2 py-1 w-full text-center resize-none", isCapture ? "text-lg h-24" : "text-sm sm:text-base h-16")}
          />
        ) : (
          <p className={cn("font-medium text-slate-500 italic", isCapture ? "text-lg" : "text-sm sm:text-base")}>
            "{editData.invoiceFooter || shop.invoiceFooter || 'We appreciate your business'}"
          </p>
        )}
        <div className={cn("pt-4 flex justify-center gap-4 text-slate-300 font-medium", isCapture ? "text-sm" : "text-xs")}>
          <span>{shop.address}</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 sm:px-0 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <Button variant="ghost" onClick={() => navigate('/app/orders')} className="h-10 text-slate-500 hover:text-slate-900 bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm border-none rounded-xl">
          {isRTL ? <ArrowRight className="h-4 w-4 ml-2" /> : <ArrowLeft className="h-4 w-4 mr-2" />} Back to Orders
        </Button>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {isEditing ? (
            <Button variant="ghost" onClick={() => setIsEditing(false)} className="rounded-xl h-10 px-4 bg-gray-100 shadow-neu-pressed text-brand-primary border-none font-bold">
              <Save className="h-4 w-4 mr-2" /> Save Edit
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setIsEditing(true)} className="rounded-xl h-10 px-4 bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm border-none font-bold text-slate-700">
              <Edit2 className="h-4 w-4 mr-2" /> Edit Invoice
            </Button>
          )}
          
          <Button variant="ghost" onClick={handleWhatsAppShare} disabled={isGenerating} className="rounded-xl h-10 px-4 bg-[#25D366] text-white hover:bg-[#128C7E] shadow-neu-sm hover:shadow-neu-pressed-sm border-none font-black flex-1 sm:flex-none">
            <WhatsAppIcon className="h-4 w-4 mr-2" /> {isGenerating ? 'Wait...' : 'WhatsApp'}
          </Button>
          
          <Button variant="ghost" onClick={handleShare} disabled={isSharing} className="rounded-xl h-10 px-4 bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm border-none font-bold text-slate-700">
            <Share2 className="h-4 w-4 mr-2" /> {isSharing ? '...' : 'Share'}
          </Button>
          
          <Button variant="ghost" onClick={handleDownloadPDF} disabled={isGenerating} className="rounded-xl h-10 px-4 bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm border-none font-bold text-slate-700">
            <FileText className="h-4 w-4 mr-2" /> PDF
          </Button>

          <Button variant="ghost" onClick={handleDownloadImage} disabled={isGenerating} className="rounded-xl h-10 px-4 bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm border-none font-bold text-slate-700">
            <ImageIcon className="h-4 w-4 mr-2" /> Save PNG
          </Button>
        </div>
      </div>

      <div className={cn("bg-gray-100 p-6 sm:p-10 rounded-[2.5rem] shadow-neu border-none print:shadow-none print:border-none print:p-0 overflow-hidden", isRTL && "text-[1.2rem]")} dir={isRTL ? "rtl" : "ltr"}>
        {renderInvoiceContent(false)}
      </div>

      {/* Off-screen high-quality invoice for html2canvas */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0', zIndex: -100 }} aria-hidden="true">
        <div 
          ref={invoiceRef} 
          className={cn(isRTL && "text-[1.2rem]")}
          style={{ backgroundColor: '#F3F4F6', padding: '64px', width: '800px', borderRadius: '40px', fontFamily: "'Segoe UI', Arial, sans-serif" }}
          dir={isRTL ? "rtl" : "ltr"}
        >
          {renderInvoiceContent(true)}
        </div>
      </div>
    </div>
  );
}
