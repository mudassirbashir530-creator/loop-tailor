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

  // Format creation date
  let invoiceDateStr = 'N/A';
  try {
    invoiceDateStr = format(toDate(order.createdAt), 'MMM dd, yyyy');
  } catch (e) {
    invoiceDateStr = 'N/A';
  }

  // Format delivery date
  let deliveryDateStr = 'N/A';
  try {
    if (order.deliveryDate) {
      deliveryDateStr = format(toDate(order.deliveryDate), 'MMM dd, yyyy');
    }
  } catch (e) {}

  const getStatusBadge = (status: string) => {
    const s = (status || 'PENDING').toUpperCase();
    if (s === 'DELIVERED') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">✅ Delivered</span>;
    }
    if (s === 'READY') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">✨ Ready</span>;
    }
    if (s === 'STITCHING') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">✂️ Stitching</span>;
    }
    if (s === 'CANCELLED') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">🚫 Cancelled</span>;
    }
    return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-300">⏳ Pending</span>;
  };

  const shopLogoUrl = shop?.shopLogo || shop?.logoUrl;

  const defaultFooter = `Thank you for choosing ${shop?.name || 'us'}!\nFor queries, contact us on WhatsApp: ${shop?.phone || ''}`;
  const footerContent = shop?.invoiceFooter || defaultFooter;

  return (
    <div className="w-full flex justify-center py-4 bg-slate-100">
      <div 
        ref={ref} 
        id="invoice-to-share"
        className="bg-white text-slate-800 w-[650px] shrink-0 shadow-2xl font-sans text-left overflow-hidden border border-slate-200 rounded-3xl relative"
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        {/* Top Decorative Brand Bar */}
        <div className="h-3 bg-gradient-to-r from-[#0D3D33] via-[#2ECC71] to-[#0D3D33]" />

        {/* Center Watermark of Shop Logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0 overflow-hidden">
          {shopLogoUrl ? (
            <img src={typeof shopLogoUrl === 'string' ? shopLogoUrl : shopLogoUrl.url} alt="Watermark" className="w-[350px] h-[350px] object-contain grayscale" />
          ) : (
            <span className="text-[180px] font-black text-[#0D3D33]">✂️</span>
          )}
        </div>

        {/* Content Container */}
        <div className="relative z-10">
          {/* Header */}
          <div className="bg-[#0D3D33] text-white p-8 flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              {shopLogoUrl && typeof shopLogoUrl === 'string' && shopLogoUrl.startsWith('http') ? (
                <img 
                  src={shopLogoUrl} 
                  alt={shop?.name || 'Shop Logo'} 
                  className="w-[70px] h-[70px] rounded-2xl object-cover bg-white shrink-0 border-2 border-white/30 shadow-md" 
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-[70px] h-[70px] rounded-2xl bg-white/10 flex items-center justify-center font-black text-2xl text-white uppercase shrink-0 border border-white/20 shadow-md">
                  {(shop?.name || 'LT').substring(0, 2)}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-2xl font-black tracking-tight text-white truncate">{shop?.name || 'Loop Tailor Shop'}</h1>
                <div className="text-xs text-white/80 mt-1 space-y-0.5 font-medium">
                  {shop?.phone && <p>📞 Phone: {shop.phone}</p>}
                  {shop?.address && <p className="line-clamp-2">📍 Address: {shop.address}</p>}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-white font-extrabold text-[10px] uppercase tracking-widest mb-1.5 border border-white/20">
                OFFICIAL INVOICE
              </span>
              <p className="text-2xl font-mono font-black text-white">
                #{order.tokenId || order.id?.substring(0, 8).toUpperCase() || 'ORDER'}
              </p>
              <p className="text-xs text-white/70 font-semibold mt-1">Date: {invoiceDateStr}</p>
            </div>
          </div>

          {/* Bill To & Status Section */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BILL TO (CUSTOMER)</p>
              <div className="flex items-center gap-2">
                <p className="font-black text-lg text-slate-900">{order.customerName || 'Valued Customer'}</p>
                {order?.isVip && (
                  <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-amber-400 text-slate-950 border border-amber-500 shadow-xs">
                    ⭐ VIP
                  </span>
                )}
              </div>
              {orderPhone && (
                <p className="text-xs text-slate-600 font-bold">📞 {orderPhone}</p>
              )}
            </div>
            <div className="text-right">
              {getStatusBadge(order.status)}
            </div>
          </div>

          {/* Garments & Suit Breakdown */}
          <div className="p-6 border-b border-slate-100 space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SUIT & STITCHING DETAILS</p>
            
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Dress Type</span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{order.clothingType || 'Custom Suit'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Service Category</span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{order.serviceCategory || 'Bespoke'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Delivery Date</span>
                <p className="font-bold text-slate-800 text-xs mt-0.5">{deliveryDateStr}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Rack / Storage</span>
                <p className="font-bold text-slate-800 text-xs mt-0.5">{order.rackLocation || 'Assigned'}</p>
              </div>
            </div>

            {order.designNotes && (
              <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/80 text-xs">
                <span className="text-amber-800 font-bold uppercase text-[10px] block mb-0.5">Special Instructions / Stitching Notes</span>
                <p className="text-slate-800 font-medium leading-relaxed">{order.designNotes}</p>
              </div>
            )}
          </div>

          {/* Measurements Profile Section */}
          {hasMeasurements && (
            <div className="p-6 border-b border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">CUSTOM MEASUREMENTS PROFILE</p>
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                {Object.entries(measurements).map(([key, value]) => {
                  if (value === null || value === undefined || value === '') return null;
                  const friendlyLabel = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .trim();
                  return (
                    <div key={key} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-center">
                      <span className="text-slate-400 font-bold text-[10px] block uppercase">{friendlyLabel}</span>
                      <span className="font-black text-slate-900 text-sm block mt-0.5">{value as string}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="p-6 border-b border-slate-100 flex justify-end">
            <div className="w-72 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Total Amount</span>
                <span className="text-slate-900">{orderCurrency} {safeNum(order.price).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-emerald-600">
                <span>Advance Paid</span>
                <span>-{orderCurrency} {totalPaid.toLocaleString()}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="font-black text-sm text-slate-900">Balance Due</span>
                <span className={`text-base font-black ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {orderCurrency} {balanceDue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Area */}
          <div className="p-6 text-center bg-slate-50 border-t border-slate-100">
            <div className="whitespace-pre-line text-xs font-semibold text-slate-600 leading-relaxed max-w-[480px] mx-auto">
              {footerContent}
            </div>
            <p className="text-[10px] text-slate-400 font-semibold pt-3 border-t border-slate-200/60 mt-3">
              Loop Tailor — Smart Tailor Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

Invoice.displayName = 'Invoice';
