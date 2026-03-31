import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { ArrowLeft, ArrowRight, Printer, Download, Share2, Edit2, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { cn } from '../lib/utils';

export default function Invoice() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const [order, setOrder] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    const fetchInvoiceData = async () => {
      try {
        const orderSnap = await getDoc(doc(db, 'shops', user.uid, 'orders', id));
        if (!orderSnap.exists() || orderSnap.data().shopId !== user.uid) {
          navigate('/dashboard/orders');
          return;
        }
        const orderData = orderSnap.data();
        setOrder({ id: orderSnap.id, ...orderData });

        const shopSnap = await getDoc(doc(db, 'shops', user.uid));
        if (shopSnap.exists()) setShop(shopSnap.data());

        const custSnap = await getDoc(doc(db, 'shops', user.uid, 'customers', orderData.customerId));
        if (custSnap.exists()) setCustomer(custSnap.data());

      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `invoice/${id}`);
      }
    };
    fetchInvoiceData();
  }, [user, id, navigate]);

  if (!order || !shop || !customer) return <div className="p-8">{t('invoice.loading')}</div>;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const shareUrl = window.location.href;
      const shareData = {
        title: `${t('invoice.invoice')} - ${shop.name}`,
        text: `${t('invoice.invoice')} for ${customer.name} from ${shop.name}`,
        url: shareUrl
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
        } catch (shareError: any) {
          if (shareError.name !== 'AbortError') {
            await navigator.clipboard.writeText(shareUrl);
            alert(t('invoice.shareSuccess'));
          }
        }
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert(t('invoice.shareFallback'));
      }
    } catch (error) {
      console.error('Error sharing invoice:', error);
      alert(t('invoice.shareError'));
    } finally {
      setIsSharing(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!customer?.phone) {
      alert("Customer phone number is missing.");
      return;
    }
    
    const balanceDue = order.price - (order.advancePayment || 0);
    const deliveryDate = format(new Date(order.deliveryDate), 'MMM dd, yyyy');
    
    const message = `Hello ${customer.name},\n\nHere are your order details from ${shop.name}:\n\nItem: ${order.dressType}\nPrice: PKR ${order.price.toLocaleString()}\nAdvance Paid: PKR ${(order.advancePayment || 0).toLocaleString()}\nBalance Due: PKR ${balanceDue.toLocaleString()}\nDelivery Date: ${deliveryDate}\n\nView your invoice here: ${window.location.href}\n\nThank you!`;
    
    const cleanPhone = customer.phone.replace(/[^\d+]/g, '').replace('+', '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const generatePDF = async () => {
    if (!invoiceRef.current) return;
    setIsGenerating(true);
    let clone: HTMLElement | null = null;
    try {
      const element = invoiceRef.current;

      // Create a clone to avoid touching the live UI and to get correct desktop dimensions
      clone = element.cloneNode(true) as HTMLElement;
      clone.style.width = '800px';
      clone.style.maxWidth = '800px';
      clone.style.padding = '40px';
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '-9999px';
      
      document.body.appendChild(clone);
      
      // Wait for layout to calculate
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await toPng(clone, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Invoice_${order.id.slice(-6).toUpperCase()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(t('invoice.pdfError'));
    } finally {
      if (clone && clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
      setIsGenerating(false);
    }
  };

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
          <Button variant="outline" size="sm" onClick={handleWhatsAppShare} className="flex-1 sm:flex-none rounded-xl h-9 bg-[#25D366] text-white hover:bg-[#128C7E] border-none">
            <MessageCircle className={cn("h-3.5 w-3.5", isRTL ? "ml-1.5" : "mr-1.5")} /> WhatsApp
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 sm:flex-none rounded-xl h-9">
            <Printer className={cn("h-3.5 w-3.5", isRTL ? "ml-1.5" : "mr-1.5")} /> {t('invoice.print')}
          </Button>
          <Button size="sm" onClick={generatePDF} disabled={isGenerating} className="flex-1 sm:flex-none rounded-xl h-9 bg-slate-900">
            <Download className={cn("h-3.5 w-3.5", isRTL ? "ml-1.5" : "mr-1.5")} /> {isGenerating ? '...' : t('invoice.pdf')}
          </Button>
        </div>
      </div>

      <div id="invoice-capture-area" ref={invoiceRef} className={cn("bg-white p-5 sm:p-10 rounded-3xl shadow-sm border border-slate-100 print:shadow-none print:border-none print:p-0 overflow-hidden", isRTL && "text-[1.2rem]")} dir={isRTL ? "rtl" : "ltr"}>
        {/* Header Section */}
        <div className="flex flex-row justify-between items-start border-b border-slate-100 pb-5 mb-5 gap-4">
          <div className="flex items-center gap-3">
            {shop.logoUrl && <img src={shop.logoUrl} alt="Shop Logo" className="h-10 w-10 sm:h-16 sm:w-16 object-contain rounded-xl bg-slate-50 p-1" />}
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-slate-900 leading-tight tracking-tight">{shop.name}</h1>
              <p className="text-xs sm:text-base text-slate-500 font-medium">{shop.phone}</p>
            </div>
          </div>
          <div className={cn(isRTL ? "text-left" : "text-right")}>
            <h2 className="text-base sm:text-2xl font-black text-brand-primary tracking-tighter uppercase">{t('invoice.invoice')}</h2>
            <p className="text-xs sm:text-base font-bold text-slate-400 mt-0.5">#{order.id.slice(-6).toUpperCase()}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 sm:mb-8">
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest">{t('invoice.billTo')}</h3>
            <p className="text-sm sm:text-lg font-bold text-slate-900 leading-tight">{customer.name}</p>
            <p className="text-xs sm:text-base text-slate-500 font-medium truncate max-w-[140px] sm:max-w-none">{customer.phone}</p>
          </div>
          <div className={cn("space-y-1", isRTL ? "text-left" : "text-right")}>
            <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest">{t('invoice.delivery')}</h3>
            <p className="text-sm sm:text-lg font-bold text-slate-900">{format(new Date(order.deliveryDate), 'MMM dd, yyyy')}</p>
            <p className="text-xs sm:text-base text-slate-500 font-medium">{t('invoice.issued')}: {format(new Date(), 'MMM dd')}</p>
          </div>
        </div>

        {/* Items Table - Compact */}
        <div className="mb-6 sm:mb-8 border-y border-slate-50 py-2">
          <div className="flex justify-between items-center py-2 text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest px-1">
            <span>{t('invoice.description')}</span>
            <span>{t('invoice.amount')}</span>
          </div>
          <div className="flex justify-between items-center py-3 px-1">
            <div>
              <p className="text-sm sm:text-lg font-bold text-slate-900">{order.dressType}</p>
              <p className="text-xs sm:text-base text-slate-500 font-medium">{t('invoice.customTailoring')}</p>
            </div>
            <p className="text-sm sm:text-lg font-black text-slate-900">PKR {order.price.toLocaleString()}</p>
          </div>
        </div>

        {/* Totals Section */}
        <div className={cn("flex mb-6 sm:mb-10", isRTL ? "justify-start" : "justify-end")}>
          <div className="w-full sm:w-72 space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
            <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-500">
              <span>{t('invoice.subtotal')}</span>
              <span>PKR {order.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm font-bold text-emerald-600">
              <span>{t('invoice.advancePaid')}</span>
              <span>-PKR {(order.advancePayment || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base sm:text-xl font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>{t('invoice.balanceDue')}</span>
              <span className="text-brand-primary">PKR {(order.price - (order.advancePayment || 0)).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-1 pt-6 border-t border-slate-100">
          <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">{t('invoice.thankYou')}</p>
          <p className="text-sm sm:text-base font-medium text-slate-500 italic">
            "{shop.invoiceFooter || t('invoice.defaultFooter')}"
          </p>
          <div className="pt-4 flex justify-center gap-4 text-xs text-slate-300 font-medium">
            <span>{shop.address}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
