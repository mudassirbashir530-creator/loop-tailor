import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { ArrowLeft, Printer, Download, Share2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Invoice() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
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

  if (!order || !shop || !customer) return <div className="p-8">Loading invoice...</div>;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!invoiceRef.current) return;
    setIsSharing(true);
    try {
      const element = invoiceRef.current;
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return;

      const file = new File([blob], `Invoice_${order.id.slice(-6).toUpperCase()}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice - ${shop.name}`,
          text: `Invoice for ${customer.name} from ${shop.name}`
        });
      } else {
        // Fallback: Copy link or just alert
        const url = window.location.href;
        await navigator.clipboard.writeText(url);
        alert('Invoice link copied to clipboard! (Sharing files not supported in this browser)');
      }
    } catch (error) {
      console.error('Error sharing invoice:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const generatePDF = async () => {
    if (!invoiceRef.current) return;
    setIsGenerating(true);
    try {
      const element = invoiceRef.current;
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Invoice_${order.id.slice(-6).toUpperCase()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
        <Button variant="ghost" onClick={() => navigate('/dashboard/orders')} className="-ml-2 h-8 text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
        </Button>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={handleShare} disabled={isSharing} className="flex-1 sm:flex-none rounded-xl h-9">
            <Share2 className="h-3.5 w-3.5 mr-1.5" /> {isSharing ? '...' : 'Share'}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 sm:flex-none rounded-xl h-9">
            <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
          </Button>
          <Button size="sm" onClick={generatePDF} disabled={isGenerating} className="flex-1 sm:flex-none rounded-xl h-9 bg-slate-900">
            <Download className="h-3.5 w-3.5 mr-1.5" /> {isGenerating ? '...' : 'PDF'}
          </Button>
        </div>
      </div>

      <div ref={invoiceRef} className="bg-white p-5 sm:p-10 rounded-3xl shadow-sm border border-slate-100 print:shadow-none print:border-none print:p-0 overflow-hidden">
        {/* Header Section */}
        <div className="flex flex-row justify-between items-start border-b border-slate-100 pb-5 mb-5 gap-4">
          <div className="flex items-center gap-3">
            {shop.logoUrl && <img src={shop.logoUrl} alt="Shop Logo" className="h-10 w-10 sm:h-14 sm:w-14 object-contain rounded-xl bg-slate-50 p-1" />}
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight tracking-tight">{shop.name}</h1>
              <p className="text-[10px] sm:text-sm text-slate-500 font-medium">{shop.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-sm sm:text-xl font-black text-brand-primary tracking-tighter uppercase">Invoice</h2>
            <p className="text-[10px] sm:text-sm font-bold text-slate-400 mt-0.5">#{order.id.slice(-6).toUpperCase()}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 sm:mb-8">
          <div className="space-y-1">
            <h3 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill To</h3>
            <p className="text-xs sm:text-base font-bold text-slate-900 leading-tight">{customer.name}</p>
            <p className="text-[10px] sm:text-sm text-slate-500 font-medium truncate max-w-[140px] sm:max-w-none">{customer.phone}</p>
          </div>
          <div className="text-right space-y-1">
            <h3 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery</h3>
            <p className="text-xs sm:text-base font-bold text-slate-900">{format(new Date(order.deliveryDate), 'MMM dd, yyyy')}</p>
            <p className="text-[10px] sm:text-sm text-slate-500 font-medium">Issued: {format(new Date(), 'MMM dd')}</p>
          </div>
        </div>

        {/* Items Table - Compact */}
        <div className="mb-6 sm:mb-8 border-y border-slate-50 py-2">
          <div className="flex justify-between items-center py-2 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            <span>Description</span>
            <span>Amount</span>
          </div>
          <div className="flex justify-between items-center py-3 px-1">
            <div>
              <p className="text-xs sm:text-base font-bold text-slate-900">{order.dressType}</p>
              <p className="text-[10px] sm:text-sm text-slate-500 font-medium">Custom Tailoring Service</p>
            </div>
            <p className="text-xs sm:text-base font-black text-slate-900">PKR {order.price.toLocaleString()}</p>
          </div>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-6 sm:mb-10">
          <div className="w-full sm:w-64 space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
            <div className="flex justify-between text-[10px] sm:text-xs font-bold text-slate-500">
              <span>Subtotal</span>
              <span>PKR {order.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] sm:text-xs font-bold text-emerald-600">
              <span>Advance Paid</span>
              <span>-PKR {(order.advancePayment || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm sm:text-lg font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>Balance Due</span>
              <span className="text-brand-primary">PKR {(order.price - (order.advancePayment || 0)).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-1 pt-6 border-t border-slate-100">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Thank You</p>
          <p className="text-xs sm:text-sm font-medium text-slate-500 italic">
            "{shop.invoiceFooter || 'We appreciate your trust in our craftsmanship.'}"
          </p>
          <div className="pt-4 flex justify-center gap-4 text-[9px] text-slate-300 font-medium">
            <span>{shop.address}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
