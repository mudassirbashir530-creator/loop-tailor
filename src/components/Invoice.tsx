import React, { forwardRef } from 'react';
import { format } from 'date-fns';

interface InvoiceProps {
  order: any;
  shop: any;
  customer: any;
  paymentsList: any[];
}

const safeNum = (val: any) => Number(val) || 0;

const toDate = (val: any) => {
  if (!val) return new Date();
  if (val?.toDate) return val.toDate();
  if (val?.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
};

export const Invoice = forwardRef<HTMLDivElement, InvoiceProps>(({ 
  order, shop, customer, paymentsList 
}, ref) => {
  if (!order) return null;

  const totalPaid = safeNum(order.advancePayment) + paymentsList.reduce((sum, p) => sum + safeNum(p.amount), 0);
  const balanceDue = Math.max(0, safeNum(order.price) - totalPaid);
  const measurements = order.measurements || {};
  const hasMeasurements = Object.keys(measurements).length > 0 && Object.values(measurements).some(v => v !== null && v !== undefined && v !== '');

  const orderPhone = customer?.phone || order.phone;
  const orderCurrency = shop?.currency || 'PKR';

  // Format creation date beautifully
  let invoiceDateStr = 'N/A';
  try {
    invoiceDateStr = format(toDate(order.createdAt), 'MMM dd, yyyy');
  } catch (e) {
    invoiceDateStr = 'N/A';
  }

  // Format delivery date beautifully
  let deliveryDateStr = 'N/A';
  try {
    if (order.deliveryDate) {
      deliveryDateStr = format(toDate(order.deliveryDate), 'MMM dd, yyyy');
    }
  } catch (e) {
    // leave as N/A
  }

  // Status color styling helpers
  const getStatusBadge = (status: string) => {
    const s = (status || 'PENDING').toUpperCase();
    if (s === 'DELIVERED') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-100 text-green-800">Delivered</span>;
    }
    if (s === 'READY') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">Ready</span>;
    }
    if (s === 'STITCHING') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-800">Stitching</span>;
    }
    if (s === 'CANCELLED') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800">Cancelled</span>;
    }
    return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fff2e6] text-[#e65c00]">Pending</span>;
  };

  // Helper to render URL or fallback text for logo
  const shopLogoUrl = shop?.shopLogo || shop?.logoUrl;
  const renderLogo = () => {
    if (shopLogoUrl && typeof shopLogoUrl === 'string' && shopLogoUrl.startsWith('https://')) {
      return (
        <img 
          src={shopLogoUrl} 
          alt={shop?.name || 'Shop Logo'} 
          className="w-[60px] h-[60px] rounded-lg object-cover bg-white shrink-0 border border-white/20" 
          crossOrigin="anonymous"
        />
      );
    }
    return null;
  };

  // Default footer template
  const defaultFooter = `Thank you for choosing ${shop?.name || 'us'}!\nFor queries, contact us on WhatsApp.`;
  const footerContent = shop?.invoiceFooter || defaultFooter;

  return (
    <div className="w-full flex justify-center py-2 bg-slate-100">
      <div 
        ref={ref} 
        id="invoice-to-share"
        className="bg-white text-slate-800 w-[600px] shrink-0 shadow-lg font-sans text-left overflow-hidden border border-gray-100 rounded-2xl"
        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
      >
        {/* Header - Styled Dark Green (#1a3a2a) */}
        <div className="bg-[#1a3a2a] text-white p-6 flex items-start gap-4">
          {renderLogo() || (
            <div className="w-[60px] h-[60px] rounded-lg bg-white/10 flex items-center justify-center font-black text-xl text-white uppercase shrink-0 border border-white/10">
              {(shop?.name || 'LT').substring(0, 2)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight truncate">{shop?.name || 'Loop Tailor'}</h1>
            <div className="text-xs text-white/80 mt-1 space-y-0.5 font-medium">
              {shop?.phone && <p>📞 {shop.phone}</p>}
              {shop?.address && <p className="line-clamp-2">📍 {shop.address}</p>}
              {shop?.email && <p>✉️ {shop.email}</p>}
            </div>
          </div>
        </div>

        {/* Invoice Meta Section */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">INVOICE</h2>
            <p className="text-2xl font-mono font-bold text-slate-900 mt-1">
              #{order.tokenId || order.id?.substring(0, 8).toUpperCase() || 'ORDER'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-semibold mb-2">Date: {invoiceDateStr}</p>
            {getStatusBadge(order.status)}
          </div>
        </div>

        {/* Bill To Section */}
        <div className="px-6 py-4 border-b border-gray-100 bg-slate-50/50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">BILL TO:</p>
          <div className="space-y-0.5">
            <p className="font-bold text-base text-slate-900 flex items-center gap-1.5">
              👤 {order.customerName || 'Walk-in Customer'}
            </p>
            {orderPhone && (
              <p className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                📞 {orderPhone}
              </p>
            )}
          </div>
        </div>

        {/* Order Details Grid */}
        <div className="p-6 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3.5">ORDER DETAILS</p>
          <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-sm">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-50">
              <span className="text-gray-500 font-semibold">Dress Type:</span>
              <span className="font-bold text-slate-900">{order.dressType || 'Suit'}</span>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-50">
              <span className="text-gray-500 font-semibold">Delivery Date:</span>
              <span className="font-bold text-slate-900">{deliveryDateStr}</span>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-50">
              <span className="text-gray-500 font-semibold">Delivery Type:</span>
              <span className="font-bold text-slate-900">{order.deliveryType || 'Self Pickup'}</span>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-50">
              <span className="text-gray-500 font-semibold">Rack Location:</span>
              <span className="font-bold text-slate-900">{order.rackLocation || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Measurements Section - Display only non-empty fields in 2 column grid */}
        {hasMeasurements && (
          <div className="p-6 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3.5">MEASUREMENTS</p>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-6 text-xs">
              {Object.entries(measurements).map(([key, value]) => {
                if (value === null || value === undefined || value === '') return null;
                const friendlyLabel = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .trim();
                return (
                  <div key={key} className="flex justify-between border-b border-dashed border-gray-100 pb-1">
                    <span className="text-gray-500 font-semibold">{friendlyLabel}</span>
                    <span className="font-bold text-slate-900">{value as string}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment Summary Section */}
        <div className="p-6 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">PAYMENT SUMMARY</p>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between font-medium">
              <span className="text-gray-500">Total Price</span>
              <span className="font-bold text-slate-950">{orderCurrency} {safeNum(order.price).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-gray-500">Amount Paid</span>
              <span className="font-bold text-green-700">{orderCurrency} {totalPaid.toLocaleString()}</span>
            </div>
            <div className="pt-3 border-t border-gray-200 mt-2 flex justify-between items-center">
              <span className="text-base font-bold text-slate-900">Balance Due</span>
              <span className={`text-[17px] font-black flex items-center gap-1 ${balanceDue > 0 ? 'text-red-600' : 'text-green-700'}`}>
                {orderCurrency} {balanceDue.toLocaleString()}
                {balanceDue > 0 && <span className="text-red-500 text-xs inline-block animate-pulse">🔴</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Editable Custom Footer Area */}
        <div className="p-6 text-center bg-gray-50 border-t border-gray-100 rounded-b-2xl">
          <div className="whitespace-pre-line text-xs font-semibold text-gray-600 leading-relaxed max-w-[480px] mx-auto">
            {footerContent}
          </div>
          <p className="text-[10px] text-gray-400 font-semibold pt-3.5 border-t border-gray-100 mt-3.5">
            Loop Tailor — Stitching loop management system
          </p>
        </div>
      </div>
    </div>
  );
});

Invoice.displayName = 'Invoice';
