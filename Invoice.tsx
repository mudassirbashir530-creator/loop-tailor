import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { ArrowLeft, ArrowRight, Printer, Download, Share2, Edit2, MessageCircle, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
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
  const [copied, setCopied] = useState(false);

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

  if (!order || !shop || !customer) {
    return (
      <div className="flex items-center justify-center p-8 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        <p className="text-slate-500">{t('invoice.loading')}</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  /** Captures the invoice element as a canvas, with onclone to fix rendering issues */
  const captureInvoiceCanvas = async (): Promise<HTMLCanvasElement> => {
    if (!invoiceRef.current) throw new Error('Invoice element not found');

    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      // onclone lets us safely modify the cloned DOM without touching the live DOM
      onclone: (clonedDoc) => {
        const el = clonedDoc.getElementById('invoice-print-area');
        if (el) {
          // Remove backdrop-blur and glassmorphism effects that html2canvas can't render
          el.style.backdropFilter = 'none';
          el.style.webkitBackdropFilter = 'none';
          el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          el.style.border = '1px solid #e2e8f0';
          el.style.borderRadius = '24px';
          el.style.width = '780px';
          el.style.maxWidth = '780px';
          el.style.padding = '40px';

          // Remove backdrop blur from all children
          const allEls = el.querySelectorAll('*');
          allEls.forEach((child: any) => {
            if (child.style) {
              child.style.backdropFilter = 'none';
              child.style.webkitBackdropFilter = 'none';
            }
          });
        }
      },
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas rendering failed — zero dimensions');
    }
    return canvas;
  };

  /** Download as PDF (A4) */
  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const canvas = await captureInvoiceCanvas();
      const imgData = canvas.toDataURL('image/png');

      // A4 page: 210mm × 297mm
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const pageHeight = 297;

      const imgWidthMM = pageWidth;
      const imgHeightMM = (canvas.height * pageWidth) / canvas.width;

      // If content is taller than one A4 page, scale it down to fit
      if (imgHeightMM <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMM, imgHeightMM);
      } else {
        // Multi-page support
        let yPosition = 0;
        while (yPosition < imgHeightMM) {
          if (yPosition > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, -yPosition, imgWidthMM, imgHeightMM);
          yPosition += pageHeight;
        }
      }

      const fileName = `Invoice_${order.tokenId || order.id.slice(-6).toUpperCase()}_${customer.name.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert(t('invoice.pdfError'));
    } finally {
      setIsGenerating(false);
    }
  };

  /** Share via Web Share API (URL only — most reliable) */
  const handleShare = async () => {
    setIsSharing(true);
    const shareUrl = window.location.href;
    const shareTitle = `${t('invoice.invoice')} — ${shop.name}`;
    const shareText = `${t('invoice.invoice')} for ${customer.name} | PKR ${order.price.toLocaleString()}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        // Final fallback — copy URL
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch {
          alert(t('invoice.shareFallback'));
        }
      }
    } finally {
      setIsSharing(false);
    }
  };

  /** Copy invoice URL to clipboard */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Could not copy link.');
    }
  };

  /** Share via WhatsApp */
  const handleWhatsApp = () => {
    const balance = order.price - (order.advancePayment || 0);
    const message = encodeURIComponent(
      `*${shop.name}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *Invoice #${order.tokenId}*\n` +
      `👤 *Customer:* ${customer.name}\n` +
      `👗 *Item:* ${order.dressType}\n` +
      `📅 *Delivery:* ${format(new Date(order.deliveryDate), 'MMM dd, yyyy')}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *Total:* PKR ${order.price.toLocaleString()}\n` +
      `✅ *Advance Paid:* PKR ${(order.advancePayment || 0).toLocaleString()}\n` +
      `⚠️ *Balance Due:* PKR ${balance.toLocaleString()}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      (shop.invoiceFooter || 'Thank you for your business!') + '\n' +
      `\n${window.location.href}`
    );
    const phone = customer.phone?.replace(/\D/g, ''); // strip non-digits
    const waUrl = phone
      ? `https://wa.me/${phone}?text=${message}`
      : `https://wa.me/?text=${message}`;
    window.open(waUrl, '_blank');
  };

  const balanceDue = order.price - (order.advancePayment || 0);

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0 pb-12">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
        <Button variant="ghost" onClick={() => navigate('/dashboard/orders')} className="-ml-2 h-8 text-slate-500 hover:text-slate-900">
          {isRTL ? <ArrowRight className="h-4 w-4 ml-1.5" /> : <ArrowLeft className="h-4 w-4 mr-1.5" />}
          {t('invoice.back')}
        </Button>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Edit */}
          <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/orders/${id}`)} className="flex-1 sm:flex-none rounded-xl h-9">
            <Edit2 className={cn('h-3.5 w-3.5', isRTL ? 'ml-1.5' : 'mr-1.5')} />
            {t('invoice.edit')}
          </Button>

          {/* WhatsApp */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsApp}
            className="flex-1 sm:flex-none rounded-xl h-9 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-400"
          >
            <MessageCircle className={cn('h-3.5 w-3.5', isRTL ? 'ml-1.5' : 'mr-1.5')} />
            WhatsApp
          </Button>

          {/* Share / Copy Link */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={isSharing}
            className="flex-1 sm:flex-none rounded-xl h-9"
          >
            {isSharing ? (
              <Loader2 className={cn('h-3.5 w-3.5 animate-spin', isRTL ? 'ml-1.5' : 'mr-1.5')} />
            ) : copied ? (
              <CheckCircle2 className={cn('h-3.5 w-3.5 text-green-500', isRTL ? 'ml-1.5' : 'mr-1.5')} />
            ) : (
              <Share2 className={cn('h-3.5 w-3.5', isRTL ? 'ml-1.5' : 'mr-1.5')} />
            )}
            {copied ? 'Copied!' : t('invoice.share')}
          </Button>

          {/* Print */}
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 sm:flex-none rounded-xl h-9">
            <Printer className={cn('h-3.5 w-3.5', isRTL ? 'ml-1.5' : 'mr-1.5')} />
            {t('invoice.print')}
          </Button>

          {/* Download PDF */}
          <Button
            size="sm"
            onClick={generatePDF}
            disabled={isGenerating}
            className="flex-1 sm:flex-none rounded-xl h-9 bg-slate-900 hover:bg-slate-800 text-white"
          >
            {isGenerating ? (
              <Loader2 className={cn('h-3.5 w-3.5 animate-spin', isRTL ? 'ml-1.5' : 'mr-1.5')} />
            ) : (
              <Download className={cn('h-3.5 w-3.5', isRTL ? 'ml-1.5' : 'mr-1.5')} />
            )}
            {isGenerating ? 'Generating...' : t('invoice.pdf')}
          </Button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────
          INVOICE CONTENT — this is what gets captured
      ──────────────────────────────────────────────── */}
      <div
        id="invoice-print-area"
        ref={invoiceRef}
        className={cn(
          'bg-white p-5 sm:p-10 rounded-3xl shadow-sm border border-slate-100',
          'print:shadow-none print:border-none print:p-0 print:rounded-none',
          isRTL && 'text-[1.1rem]'
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex flex-row justify-between items-start border-b border-slate-100 pb-5 mb-5 gap-4">
          <div className="flex items-center gap-3">
            {shop.logoUrl && (
              <img
                src={shop.logoUrl}
                alt="Shop Logo"
                crossOrigin="anonymous"
                className="h-10 w-10 sm:h-16 sm:w-16 object-contain rounded-xl bg-slate-50 p-1"
              />
            )}
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-slate-900 leading-tight tracking-tight">
                {shop.name}
              </h1>
              <p className="text-xs sm:text-base text-slate-500 font-medium">{shop.phone}</p>
              {shop.address && (
                <p className="text-xs text-slate-400 font-medium">{shop.address}</p>
              )}
            </div>
          </div>
          <div className={cn(isRTL ? 'text-left' : 'text-right')}>
            <h2 className="text-base sm:text-2xl font-black text-brand-primary tracking-tighter uppercase">
              {t('invoice.invoice')}
            </h2>
            <p className="text-xs sm:text-base font-bold text-slate-400 mt-0.5">
              #{order.tokenId || order.id.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Bill-To + Dates */}
        <div className="grid grid-cols-2 gap-4 mb-6 sm:mb-8">
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest">
              {t('invoice.billTo')}
            </h3>
            <p className="text-sm sm:text-lg font-bold text-slate-900 leading-tight">{customer.name}</p>
            <p className="text-xs sm:text-base text-slate-500 font-medium">{customer.phone}</p>
            {customer.address && (
              <p className="text-xs text-slate-400">{customer.address}</p>
            )}
          </div>
          <div className={cn('space-y-1', isRTL ? 'text-left' : 'text-right')}>
            <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest">
              {t('invoice.delivery')}
            </h3>
            <p className="text-sm sm:text-lg font-bold text-slate-900">
              {format(new Date(order.deliveryDate), 'MMM dd, yyyy')}
            </p>
            <p className="text-xs sm:text-base text-slate-500 font-medium">
              {t('invoice.issued')}: {format(new Date(), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6 sm:mb-8 border-y border-slate-100 py-2">
          <div className="flex justify-between items-center py-2 text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest px-1">
            <span>{t('invoice.description')}</span>
            <span>{t('invoice.amount')}</span>
          </div>
          <div className="flex justify-between items-center py-3 px-1">
            <div>
              <p className="text-sm sm:text-lg font-bold text-slate-900">{order.dressType}</p>
              <p className="text-xs sm:text-base text-slate-500 font-medium">{t('invoice.customTailoring')}</p>
              {order.quantity && order.quantity > 1 && (
                <p className="text-xs text-slate-400">Qty: {order.quantity}</p>
              )}
              {order.rackLocation && (
                <p className="text-xs text-slate-400">Rack: {order.rackLocation}</p>
              )}
            </div>
            <p className="text-sm sm:text-lg font-black text-slate-900">
              PKR {order.price.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Totals */}
        <div className={cn('flex mb-6 sm:mb-10', isRTL ? 'justify-start' : 'justify-end')}>
          <div className="w-full sm:w-72 space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-500">
              <span>{t('invoice.subtotal')}</span>
              <span>PKR {order.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm font-bold text-emerald-600">
              <span>{t('invoice.advancePaid')}</span>
              <span>- PKR {(order.advancePayment || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base sm:text-xl font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>{t('invoice.balanceDue')}</span>
              <span className="text-brand-primary">PKR {balanceDue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Notes (if any) */}
        {order.notes && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">Notes</p>
            <p className="text-sm text-amber-800">{order.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center space-y-1 pt-6 border-t border-slate-100">
          <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">
            {t('invoice.thankYou')}
          </p>
          <p className="text-sm sm:text-base font-medium text-slate-500 italic">
            "{shop.invoiceFooter || t('invoice.defaultFooter')}"
          </p>
          {shop.address && (
            <p className="text-xs text-slate-300 pt-2">{shop.address}</p>
          )}
        </div>
      </div>

      {/* Copied toast */}
      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-full shadow-xl text-sm font-medium print:hidden">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          Invoice link copied to clipboard!
        </div>
      )}
    </div>
  );
}
