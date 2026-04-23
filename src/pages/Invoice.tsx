import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useShop } from '../contexts/ShopContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { ArrowLeft, ArrowRight, Printer, Download, Share2, Edit2, MessageCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleSnapshotError = (error: unknown, path: string) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Invoice snapshot error at ${path}:`, message);
    if (message.toLowerCase().includes('missing or insufficient permissions')) {
      const permissionMessage = 'Permission denied: Please verify your account access and try again.';
      setLoadError(permissionMessage);
      toast.error(permissionMessage);
      return;
    }
    const genericMessage = 'Unable to load invoice right now. Please try again.';
    setLoadError(genericMessage);
    toast.error(genericMessage);
  };

  useEffect(() => {
    if (!user || !id) return;
    setLoadError(null);
    setOrder(null);
    setShop(null);
    setCustomer(null);

    const unsubOrder = onSnapshot(doc(db, 'shops', user.uid, 'orders', id), (orderSnap) => {
      if (!orderSnap.exists() || orderSnap.data().shopId !== user.uid) {
        navigate('/dashboard/orders');
        return;
      }
      setOrder({ id: orderSnap.id, ...orderSnap.data() });
    }, (error) => handleSnapshotError(error, `shops/${user.uid}/orders/${id}`));

    return () => {
      unsubOrder();
    };
  }, [user, id, navigate]);

  useEffect(() => {
    if (!user) return;

    const unsubShop = onSnapshot(doc(db, 'shops', user.uid), (shopSnap) => {
      if (shopSnap.exists()) {
        setShop(shopSnap.data());
      }
    }, (error) => handleSnapshotError(error, `shops/${user.uid}`));

    return () => {
      unsubShop();
    };
  }, [user]);

  useEffect(() => {
    if (!order?.customerId) {
      setCustomer(null);
      return;
    }
    if (!user) return;

    const unsubCustomer = onSnapshot(doc(db, 'shops', user.uid, 'customers', order.customerId), (custSnap) => {
      if (custSnap.exists()) setCustomer(custSnap.data());
      else setCustomer(null);
    }, (error) => handleSnapshotError(error, `shops/${user.uid}/customers/${order.customerId}`));

    return () => unsubCustomer();
  }, [user, order?.customerId]);

  if (loadError) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-red-600 font-semibold">{loadError}</p>
        <Button variant="outline" onClick={() => navigate('/dashboard/orders')}>
          {t('invoice.back')}
        </Button>
      </div>
    );
  }

  if (!order || !shop || !customer) return <div className="p-8">{t('invoice.loading')}</div>;

  const totalPaid = (order?.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0) + Number(order?.advancePayment || 0);
  const balanceDue = Math.max(0, Number(order?.price || 0) - totalPaid);

  const handlePrint = () => {
    window.print();
  };

  const generateCanvas = async () => {
    if (!invoiceRef.current) return null;
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
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
      pdf.save(`Invoice_${order.id.slice(-6).toUpperCase()}.pdf`);
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
      a.download = `Invoice_${order.id.slice(-6).toUpperCase()}.png`;
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
      
      const file = new File([blob], `Invoice_${order.id.slice(-6).toUpperCase()}.png`, { type: 'image/png' });
      const shareData = {
        title: `${t('invoice.invoice')} - ${shop.name}`,
        files: [file]
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: Download the PNG
        handleDownloadImage();
      }
    } catch (error) {
      console.error('Error sharing invoice:', error);
      toast.error(t('invoice.shareError'));
    } finally {
      setIsSharing(false);
    }
  };

  const handleWhatsAppShare = async () => {
    setIsGenerating(true);
    try {
      const blob = await generatePNGBlob();
      if (!blob) throw new Error("Failed to generate image");
      
      const file = new File([blob], `Invoice_${order.id.slice(-6).toUpperCase()}.png`, { type: 'image/png' });
      const shareData = {
        title: `${t('invoice.invoice')} - ${shop.name}`,
        files: [file]
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: Download the PNG and open WhatsApp
        handleDownloadImage();
        
        if (customer?.phone) {
          const cleanPhone = customer.phone.replace(/[^\d+]/g, '').replace('+', '');
          window.open(`https://wa.me/${cleanPhone}`, '_blank');
        } else {
          window.open(`https://wa.me/`, '_blank');
        }
      }
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      toast.error(t('invoice.shareError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const renderInvoiceContent = (isCapture = false) => (
    <>
      {/* Header Section */}
      <div className={cn("flex flex-row justify-between items-start border-b border-slate-100 gap-4", isCapture ? "pb-8 mb-8" : "pb-5 mb-5")}>
        <div className="flex items-center gap-3">
          {shop.logoUrl && <img src={shop.logoUrl} alt="Shop Logo" crossOrigin="anonymous" className={cn("object-contain rounded-xl bg-gray-100 shadow-neu-pressed-sm p-1", isCapture ? "h-20 w-20" : "h-10 w-10 sm:h-16 sm:w-16")} />}
          <div>
            <h1 className={cn("font-black text-slate-900 leading-tight tracking-tight", isCapture ? "text-4xl" : "text-xl sm:text-3xl")}>{shop.name}</h1>
            <p className={cn("text-slate-500 font-medium", isCapture ? "text-lg mt-1" : "text-xs sm:text-base")}>{shop.phone}</p>
          </div>
        </div>
        <div className={cn(isRTL ? "text-left" : "text-right")}>
          <h2 className={cn("font-black text-brand-primary tracking-tighter uppercase", isCapture ? "text-3xl" : "text-base sm:text-2xl")}>{t('invoice.invoice')}</h2>
          <p className={cn("font-bold text-slate-400 mt-1", isCapture ? "text-lg" : "text-xs sm:text-base")}>#{order.id.slice(-6).toUpperCase()}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className={cn("grid grid-cols-2 gap-4", isCapture ? "mb-10" : "mb-6 sm:mb-8")}>
        <div className="space-y-1">
          <h3 className={cn("font-black text-slate-400 uppercase tracking-widest", isCapture ? "text-sm" : "text-xs sm:text-sm")}>{t('invoice.billTo')}</h3>
          <p className={cn("font-bold text-slate-900 leading-tight", isCapture ? "text-xl" : "text-sm sm:text-lg")}>{customer.name}</p>
          <p className={cn("text-slate-500 font-medium", isCapture ? "text-lg" : "text-xs sm:text-base truncate max-w-[140px] sm:max-w-none")}>{customer.phone}</p>
        </div>
        <div className={cn("space-y-1", isRTL ? "text-left" : "text-right")}>
          <h3 className={cn("font-black text-slate-400 uppercase tracking-widest", isCapture ? "text-sm" : "text-xs sm:text-sm")}>{t('invoice.delivery')}</h3>
          <p className={cn("font-bold text-slate-900", isCapture ? "text-xl" : "text-sm sm:text-lg")}>{format(new Date(order.deliveryDate), 'MMM dd, yyyy')}</p>
          <p className={cn("text-slate-500 font-medium", isCapture ? "text-lg" : "text-xs sm:text-base")}>{t('invoice.issued')}: {format(new Date(), 'MMM dd')}</p>
        </div>
      </div>

      {/* Items Table - Compact */}
      <div className={cn("border-y border-gray-200/50 py-2", isCapture ? "mb-10" : "mb-6 sm:mb-8")}>
        <div className={cn("flex justify-between items-center py-2 font-black text-slate-400 uppercase tracking-widest px-1", isCapture ? "text-sm" : "text-xs sm:text-sm")}>
          <span>{t('invoice.description')}</span>
          <span>{t('invoice.amount')}</span>
        </div>
        <div className="flex justify-between items-center py-3 px-1">
          <div>
            <p className={cn("font-bold text-slate-900", isCapture ? "text-xl" : "text-sm sm:text-lg")}>{order.dressType}</p>
            <p className={cn("text-slate-500 font-medium", isCapture ? "text-lg" : "text-xs sm:text-base")}>{t('invoice.customTailoring')}</p>
          </div>
          <p className={cn("font-black text-slate-900", isCapture ? "text-xl" : "text-sm sm:text-lg")}>{settings.currency} {order.price.toLocaleString()}</p>
        </div>
      </div>

      {/* Payment History */}
      {((order.payments && order.payments.length > 0) || Number(order.advancePayment) > 0) && (
        <div className={cn("mb-6 sm:mb-8", isCapture ? "mx-1" : "")}>
          <h3 className={cn("font-black text-slate-400 uppercase tracking-widest px-1 mb-2", isCapture ? "text-sm" : "text-xs sm:text-sm")}>Payment History</h3>
          <div className="bg-gray-100 shadow-neu-pressed-sm rounded-2xl border-none p-4 divide-y divide-gray-200/50">
            {Number(order.advancePayment) > 0 && (
              <div className="py-2 flex justify-between items-center text-sm font-bold text-slate-700">
                <div className="flex flex-col">
                  <span>{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                  <span className="text-xs text-slate-500 font-medium">Initial Advance</span>
                </div>
                <span className="text-emerald-600">+{settings.currency} {Number(order.advancePayment).toLocaleString()}</span>
              </div>
            )}
            {(order.payments || []).map((payment: any, index: number) => (
              <div key={index} className="py-2 flex justify-between items-center text-sm font-bold text-slate-700">
                <div className="flex flex-col">
                  <span>{format(new Date(payment.date), 'MMM dd, yyyy')}</span>
                  <span className="text-xs text-slate-500 font-medium">{payment.method} {payment.note && `- ${payment.note}`}</span>
                </div>
                <span className="text-emerald-600">+{settings.currency} {Number(payment.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Totals Section */}
      <div className={cn("flex", isCapture ? "mb-12" : "mb-6 sm:mb-10", isRTL ? "justify-start" : "justify-end")}>
        <div className={cn("space-y-3 bg-gray-100 shadow-neu-pressed-sm rounded-2xl border-none", isCapture ? "w-96 p-6" : "w-full sm:w-72 p-4")}>
          <div className={cn("flex justify-between font-bold text-slate-500", isCapture ? "text-base" : "text-xs sm:text-sm")}>
            <span>{t('invoice.subtotal')}</span>
            <span>{settings.currency} {order.price.toLocaleString()}</span>
          </div>
          <div className={cn("flex justify-between font-bold text-emerald-600", isCapture ? "text-base" : "text-xs sm:text-sm")}>
            <span>Total Paid</span>
            <span>-{settings.currency} {totalPaid.toLocaleString()}</span>
          </div>
          <div className={cn("flex justify-between font-black text-slate-900 pt-3 border-t border-slate-200", isCapture ? "text-2xl" : "text-base sm:text-xl")}>
            <span>{t('invoice.balanceDue')}</span>
            <span className="text-brand-primary">{settings.currency} {balanceDue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center space-y-2 pt-8 border-t border-slate-100">
        <p className={cn("font-bold text-slate-400 uppercase tracking-widest", isCapture ? "text-base" : "text-xs sm:text-sm")}>{t('invoice.thankYou')}</p>
        <p className={cn("font-medium text-slate-500 italic", isCapture ? "text-lg" : "text-sm sm:text-base")}>
          "{shop.invoiceFooter || t('invoice.defaultFooter')}"
        </p>
        <div className={cn("pt-4 flex justify-center gap-4 text-slate-300 font-medium", isCapture ? "text-sm" : "text-xs")}>
          <span>{shop.address}</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
        <Button variant="ghost" onClick={() => navigate('/dashboard/orders')} className="-ml-2 h-8 text-slate-500 hover:text-slate-900">
          {isRTL ? <ArrowRight className="h-4 w-4 ml-1.5" /> : <ArrowLeft className="h-4 w-4 mr-1.5" />} {t('invoice.back')}
        </Button>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/orders/${id}`)} className="flex-1 sm:flex-none rounded-xl h-9">
            <Edit2 className={cn("h-3.5 w-3.5", isRTL ? "ml-1.5" : "mr-1.5")} /> {t('invoice.edit')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare} disabled={isSharing} className="flex-1 sm:flex-none rounded-xl h-9">
            <Share2 className={cn("h-3.5 w-3.5", isRTL ? "ml-1.5" : "mr-1.5")} /> {isSharing ? '...' : t('invoice.share')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleWhatsAppShare} disabled={isGenerating} className="flex-1 sm:flex-none rounded-xl h-9 bg-[#25D366] text-white hover:bg-[#128C7E] border-none">
            <MessageCircle className={cn("h-3.5 w-3.5", isRTL ? "ml-1.5" : "mr-1.5")} /> {isGenerating ? '...' : 'WhatsApp'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={isGenerating} className="flex-1 sm:flex-none rounded-xl h-9">
            <FileText className={cn("h-3.5 w-3.5", isRTL ? "ml-1.5" : "mr-1.5")} /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadImage} disabled={isGenerating} className="flex-1 sm:flex-none rounded-xl h-9">
            <Download className={cn("h-3.5 w-3.5", isRTL ? "ml-1.5" : "mr-1.5")} /> Image
          </Button>
        </div>
      </div>

      <div className={cn("bg-gray-100 p-5 sm:p-10 rounded-[2.5rem] shadow-neu border-none print:shadow-none print:border-none print:p-0 overflow-hidden", isRTL && "text-[1.2rem]")} dir={isRTL ? "rtl" : "ltr"}>
        {renderInvoiceContent(false)}
      </div>

      {/* Off-screen Invoice for Capture */}
      <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none w-[800px] overflow-hidden">
        <div ref={invoiceRef} className={cn("bg-gray-100 p-12", isRTL && "text-[1.2rem]")} dir={isRTL ? "rtl" : "ltr"}>
          {renderInvoiceContent(true)}
        </div>
      </div>
    </div>
  );
}
