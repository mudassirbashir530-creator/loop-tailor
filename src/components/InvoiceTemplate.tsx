import React, { forwardRef } from 'react';
import { Order } from '../lib/types';
import { formatCurrency, formatDate } from '../lib/utils';
import { useShop } from '../contexts/ShopContext';

interface InvoiceTemplateProps {
  order: Order;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ order }, ref) => {
  const { settings } = useShop();

  const totalPaid = (Number(order.price) || 0) - (Number(order.remainingPayment) || 0);
  const isFullyPaid = (Number(order.remainingPayment) || 0) <= 0;

  return (
    <div 
      ref={ref} 
      className="bg-white text-slate-900 p-10 max-w-3xl mx-auto border shadow-xl rounded-xl relative overflow-hidden"
      style={{ width: '850px', minHeight: '1100px', fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif" }}
    >
      {/* Top Decorative Branding Bar */}
      <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-r from-[#0D3D33] via-[#2ECC71] to-[#0D3D33]" />

      {/* Header */}
      <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8 mt-2">
        <div className="flex items-center gap-5">
          {settings.shopLogo ? (
            <img 
              src={typeof settings.shopLogo === 'string' ? settings.shopLogo : settings.shopLogo.url} 
              className="h-20 w-20 rounded-2xl object-cover border-2 border-slate-100 shadow-md bg-slate-50" 
              alt="Logo"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="bg-[#0D3D33] text-white p-3 rounded-2xl text-3xl font-black shadow-md flex items-center justify-center" style={{ width: '64px', height: '64px' }}>
              ✂️
            </div>
          )}
          <div>
            <h1 className="font-extrabold text-2xl text-[#0D3D33] tracking-tight">{settings.name || 'Loop Tailor Shop'}</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">📍 {settings.address || 'Smart Tailoring Studio'}</p>
            <p className="text-slate-500 text-sm font-medium">📞 Phone: {settings.phone || '+92 300 0000000'}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[#0D3D33]/10 text-[#0D3D33] font-black text-xs uppercase tracking-widest mb-2">
            OFFICIAL INVOICE
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">#{order.tokenId || `T-${order.id.slice(0, 6).toUpperCase()}`}</h2>
          <p className="text-slate-500 text-xs mt-1 font-medium">Issue Date: {formatDate(order.createdAt)}</p>
          <p className="text-slate-500 text-xs font-medium">Delivery: {formatDate(order.deliveryDate)}</p>
          
          <div className="mt-3">
            <span className={`px-3 py-1 text-xs font-extrabold rounded-full border uppercase ${
              isFullyPaid 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {isFullyPaid ? '✅ Fully Paid' : '⏳ Balance Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bill To (Customer)</h3>
          <div className="flex items-center gap-2">
            <p className="font-extrabold text-lg text-slate-900">{order?.customerName || 'Valued Customer'}</p>
            {order?.isVip && (
              <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-amber-400 text-slate-950 border border-amber-500">
                ⭐ VIP
              </span>
            )}
          </div>
          <p className="text-slate-600 text-sm mt-1 font-medium">Phone: {order?.customerPhone || 'N/A'}</p>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Order Specs</h3>
          <p className="text-slate-900 font-bold text-base">{order?.clothingType || 'Custom Tailoring'}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500 font-medium">Category:</span>
            <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-[#0D3D33]/10 text-[#0D3D33]">
              {order?.serviceCategory || 'Bespoke'}
            </span>
          </div>
        </div>
      </div>

      {/* Items Breakdown Table */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Itemized Breakdown</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Item & Description</th>
              <th className="py-3 px-4 text-center">Qty</th>
              <th className="py-3 px-4 text-right">Delivery</th>
              <th className="py-3 px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-4 px-4">
                <p className="font-bold text-slate-900">{order.clothingType}</p>
                {order.designNotes && <p className="text-xs text-slate-500 mt-1 italic">Note: {order.designNotes}</p>}
              </td>
              <td className="py-4 px-4 text-center font-bold text-slate-700">1</td>
              <td className="py-4 px-4 text-right text-slate-600 text-sm font-medium">{formatDate(order.deliveryDate)}</td>
              <td className="py-4 px-4 text-right font-extrabold text-slate-900">{formatCurrency(order.price)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Measurements Summary (if available) */}
      {order.measurements && Object.keys(order.measurements).length > 0 && (
        <div className="mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Measurements Profile</h3>
          <div className="grid grid-cols-4 gap-3 text-xs">
            {Object.entries(order.measurements).slice(0, 8).map(([key, val]) => (
              <div key={key} className="bg-white p-2.5 rounded-xl border border-slate-200/60 text-center">
                <span className="text-slate-400 capitalize block text-[10px] font-bold">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="font-black text-slate-900 text-sm mt-0.5 block">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div className="flex justify-end mb-12">
        <div className="w-72 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex justify-between text-sm text-slate-600 font-medium">
            <span>Subtotal</span>
            <span className="font-bold text-slate-900">{formatCurrency(order.price)}</span>
          </div>
          <div className="flex justify-between text-sm text-emerald-600 font-medium">
            <span>Advance Received</span>
            <span className="font-bold">-{formatCurrency(order.advancePayment)}</span>
          </div>
          <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
            <span className="font-extrabold text-base text-slate-900">Balance Due</span>
            <span className="font-black text-xl text-rose-600">{formatCurrency(order.remainingPayment)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-8 border-t border-slate-200 text-center text-slate-500 text-xs space-y-2">
        <p className="font-bold text-slate-800">Thank you for stitching with {settings.name || 'Loop Tailor'}!</p>
        <p>This document is an official computer-generated receipt.</p>
        {settings.invoiceFooter && <p className="text-slate-400 text-[11px] italic">{settings.invoiceFooter}</p>}
      </div>
    </div>
  );
});
