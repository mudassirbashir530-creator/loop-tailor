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

// Robust helper to extract valid image URL from strings, objects, base64, or cloud URLs
const getValidLogoUrl = (logo: any): string | null => {
  if (!logo) return null;
  if (typeof logo === 'string' && logo.trim().length > 0) return logo.trim();
  if (typeof logo === 'object') {
    if (logo.url && typeof logo.url === 'string') return logo.url.trim();
    if (logo.secure_url && typeof logo.secure_url === 'string') return logo.secure_url.trim();
  }
  return null;
};

export const Invoice = forwardRef<HTMLDivElement, InvoiceProps>(({ 
  order, shop, customer, paymentsList 
}, ref) => {
  if (!order) return null;

  const totalPaid = safeNum(order.advancePayment) + (paymentsList || []).reduce((sum, p) => sum + safeNum(p.amount), 0);
  const priceNum = safeNum(order.price);
  const balanceDue = Math.max(0, priceNum - totalPaid);
  const isFullyPaid = balanceDue <= 0;

  const measurements = order.measurements || {};
  const hasMeasurements = Object.keys(measurements).length > 0 && Object.values(measurements).some(v => v !== null && v !== undefined && v !== '');

  const orderPhone = order?.customerPhone || order?.phone || customer?.phone || customer?.mobile || '';
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
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">✅ Delivered</span>;
    }
    if (s === 'READY') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">✨ Ready for Pick Up</span>;
    }
    if (s === 'STITCHING') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">✂️ In Stitching</span>;
    }
    if (s === 'CANCELLED') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">🚫 Cancelled</span>;
    }
    return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-300">⏳ Pending</span>;
  };

  // Robust Logo Resolution
  const shopLogoUrl = getValidLogoUrl(shop?.shopLogo) || 
                      getValidLogoUrl(shop?.logoUrl) || 
                      getValidLogoUrl(shop?.shopLogoUrl) || 
                      getValidLogoUrl(shop?.logo);

  const shopName = shop?.shopName || shop?.name || 'Loop Tailor Shop';
  const shopPhone = shop?.shopPhone || shop?.phone || '';
  const shopAddress = shop?.shopAddress || shop?.address || '';
  const shopEmail = shop?.shopEmail || shop?.email || '';

  const defaultFooter = `Thank you for choosing ${shopName}!\nFor queries or revisions, contact us at ${shopPhone || 'our boutique'}.`;
  const footerContent = shop?.invoiceFooter || defaultFooter;

  const tokenNumber = order?.tokenId || order?.id?.substring(0, 8).toUpperCase() || 'ORDER';

  return (
    <div className="w-full flex justify-center py-2 sm:py-4 px-2 sm:px-4 bg-slate-100/80 max-w-full overflow-x-hidden">
      <div 
        ref={ref} 
        id="invoice-to-share"
        className="bg-white text-slate-800 w-full max-w-[650px] mx-auto shadow-xl font-sans text-left overflow-hidden border border-slate-200/90 rounded-2xl sm:rounded-3xl relative box-border"
        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      >
        {/* Top Decorative Gold/Emerald Accent Line */}
        <div className="h-2.5 bg-gradient-to-r from-[#0D3D33] via-[#2ECC71] to-[#0D3D33]" />

        {/* Center Shop Logo Watermark Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0 overflow-hidden">
          {shopLogoUrl ? (
            <img src={shopLogoUrl} alt="Watermark" className="w-64 h-64 sm:w-96 sm:h-96 object-contain grayscale" />
          ) : (
            <span className="text-8xl sm:text-[180px] font-black text-[#0D3D33]">✂️</span>
          )}
        </div>

        {/* Invoice Content */}
        <div className="relative z-10">
          
          {/* Header Banner */}
          <div className="bg-[#0D3D33] text-white p-5 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6 border-b border-white/10">
            <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
              {shopLogoUrl ? (
                <img 
                  src={shopLogoUrl} 
                  alt={shopName} 
                  className="w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-2xl object-cover bg-white shrink-0 border-2 border-[#2ECC71]/40 shadow-lg p-0.5" 
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-2xl bg-white/10 flex items-center justify-center font-black text-xl sm:text-2xl text-[#2ECC71] uppercase shrink-0 border border-white/20 shadow-lg">
                  {shopName.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate">{shopName}</h1>
                <div className="text-xs text-white/80 mt-1 space-y-0.5 font-medium">
                  {shopPhone && <p className="truncate">📞 {shopPhone}</p>}
                  {shopAddress && <p className="line-clamp-2">📍 {shopAddress}</p>}
                  {shopEmail && <p className="truncate">✉️ {shopEmail}</p>}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0 w-full sm:w-auto border-t border-white/15 sm:border-none pt-3 sm:pt-0">
              <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-white font-extrabold text-[10px] uppercase tracking-widest mb-1.5 border border-white/20">
                OFFICIAL INVOICE
              </span>
              <p className="text-xl sm:text-2xl font-mono font-black text-white tracking-tight">
                #{tokenNumber}
              </p>
              <div className="text-xs text-white/70 font-semibold mt-1 space-y-0.5">
                <p>Date: {invoiceDateStr}</p>
                {deliveryDateStr !== 'N/A' && <p className="text-white/90">Delivery: {deliveryDateStr}</p>}
              </div>
            </div>
          </div>

          {/* Customer & Status Bar */}
          <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">BILL TO (CUSTOMER)</span>
              <div className="flex items-center gap-2">
                <p className="font-extrabold text-base sm:text-lg text-slate-900 truncate">{order.customerName || 'Valued Customer'}</p>
                {order?.isVip && (
                  <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-amber-400 text-slate-950 border border-amber-500 shadow-xs shrink-0">
                    ⭐ VIP
                  </span>
                )}
              </div>
              {orderPhone && (
                <p className="text-xs text-slate-600 font-bold">📞 {orderPhone}</p>
              )}
            </div>

            <div className="text-right shrink-0">
              {getStatusBadge(order.status)}
            </div>
          </div>

          {/* Order Details & Stitching Specs */}
          <div className="p-4 sm:p-6 border-b border-slate-100 space-y-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ORDER & SUIT SPECIFICATIONS</span>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Garment Type</span>
                <p className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5 truncate">{order.clothingType || order.dressType || 'Custom Suit'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Service Category</span>
                <p className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5 truncate">{order.serviceCategory || 'Bespoke Stitching'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Delivery Date</span>
                <p className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5">{deliveryDateStr}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Rack / Storage</span>
                <p className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5">{order.rackLocation || 'Assigned'}</p>
              </div>
            </div>

            {(order.designNotes || order.notes) && (
              <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/80 text-xs">
                <span className="text-amber-800 font-bold uppercase text-[10px] block mb-1">Special Stitching Instructions & Design Notes</span>
                <p className="text-slate-800 font-semibold leading-relaxed">{order.designNotes || order.notes}</p>
              </div>
            )}
          </div>

          {/* Measurements Profile Section */}
          {hasMeasurements && (
            <div className="p-4 sm:p-6 border-b border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">CUSTOM MEASUREMENTS PROFILE</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {Object.entries(measurements).map(([key, value]) => {
                  if (value === null || value === undefined || value === '') return null;
                  const friendlyLabel = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .trim();
                  return (
                    <div key={key} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-center">
                      <span className="text-slate-400 font-bold text-[9px] block uppercase truncate">{friendlyLabel}</span>
                      <span className="font-black text-slate-900 text-xs sm:text-sm block mt-0.5">{value as string}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Itemized Payment Breakdown Table */}
          <div className="p-4 sm:p-6 border-b border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-2.5 px-2">Description</th>
                  <th className="py-2.5 px-2 text-right">Amount ({orderCurrency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                <tr>
                  <td className="py-3 px-2">
                    <span className="font-extrabold text-slate-900 block">{order.clothingType || 'Custom Suit Stitching'}</span>
                    <span className="text-[11px] text-slate-500 font-medium">Bespoke Tailoring Service</span>
                  </td>
                  <td className="py-3 px-2 text-right font-extrabold text-slate-900">
                    {orderCurrency} {priceNum.toLocaleString()}
                  </td>
                </tr>
                {totalPaid > 0 && (
                  <tr className="text-emerald-700 bg-emerald-50/40">
                    <td className="py-2.5 px-2 font-bold">
                      Advance Payment Received
                    </td>
                    <td className="py-2.5 px-2 text-right font-extrabold">
                      -{orderCurrency} {totalPaid.toLocaleString()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Total Summary Box */}
            <div className="mt-4 flex justify-end">
              <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Total Charges:</span>
                  <span className="text-slate-900">{orderCurrency} {priceNum.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-emerald-600">
                  <span>Total Paid:</span>
                  <span>-{orderCurrency} {totalPaid.toLocaleString()}</span>
                </div>
                <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-black text-xs sm:text-sm text-slate-900">Balance Due:</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-black ${
                    isFullyPaid 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {orderCurrency} {balanceDue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer & Contact Section */}
          <div className="p-5 sm:p-6 text-center bg-slate-50 border-t border-slate-100 space-y-3">
            {shopPhone && (
              <p className="text-xs font-bold text-[#0D3D33]">
                📞 For Inquiries & Revisions: {shopPhone} {shopAddress ? `| 📍 ${shopAddress}` : ''}
              </p>
            )}

            <div className="whitespace-pre-line text-xs font-medium text-slate-600 leading-relaxed max-w-[500px] mx-auto border-t border-slate-200/60 pt-3">
              {footerContent}
            </div>

            <p className="text-[10px] text-slate-400 font-semibold pt-2 border-t border-slate-200/50">
              Loop Tailor — Smart Boutique Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

Invoice.displayName = 'Invoice';
