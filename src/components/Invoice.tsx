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
  const hasMeasurements = Object.keys(measurements).length > 0;

  const orderPhone = customer?.phone || order.phone;
  const orderCurrency = shop?.currency || 'PKR';

  return (
    <div 
      ref={ref} 
      id="invoice-content"
      className="bg-white text-slate-900 p-8 w-full max-w-[800px] mx-auto shadow-sm"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start pb-6 border-b-2 border-slate-100 gap-6">
        <div className="flex flex-col items-center sm:items-start max-w-[200px]">
          {shop?.logo ? (
            <img src={shop.logo} alt="Shop Logo" className="h-16 w-auto object-contain mb-3" crossOrigin="anonymous" />
          ) : (
            <h1 className="text-3xl font-black tracking-tight text-[#1a3a2a] mb-2">{shop?.name || 'Loop Tailor'}</h1>
          )}
        </div>
        <div className="text-center sm:text-right text-sm font-medium text-slate-500">
          <p>{shop?.phone || ''}</p>
          <p className="whitespace-pre-line">{shop?.address || ''}</p>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="flex flex-col sm:flex-row justify-between pt-8 pb-8 gap-8">
        <div>
          <h2 className="text-4xl font-black text-slate-100 tracking-tighter uppercase mb-4">Invoice</h2>
          <div className="space-y-1">
            <p className="text-sm"><span className="text-slate-500 font-medium">Invoice #:</span> <span className="font-bold">{order.tokenId || order.id.slice(-6).toUpperCase()}</span></p>
            <p className="text-sm"><span className="text-slate-500 font-medium">Date:</span> <span className="font-bold">{format(toDate(order.createdAt), 'MMM dd, yyyy')}</span></p>
            <p className="text-sm"><span className="text-slate-500 font-medium">Status:</span> <span className="font-bold uppercase text-[#1a3a2a]">{order.status || 'PENDING'}</span></p>
          </div>
        </div>

        <div className="sm:text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">BILL TO:</p>
          <p className="font-bold text-lg">{order.customerName}</p>
          {orderPhone && <p className="text-sm text-slate-600 font-medium">{orderPhone}</p>}
        </div>
      </div>

      {/* Order Details */}
      <div className="mb-8">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b-2 border-slate-100 pb-2">ORDER DETAILS</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-500 font-medium">Dress Type</p>
            <p className="font-bold text-base">{order.dressType || 'Suit'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Delivery Date</p>
            <p className="font-bold text-base">{order.deliveryDate ? format(toDate(order.deliveryDate), 'MMM dd, yyyy') : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Delivery Type</p>
            <p className="font-bold text-base">{order.deliveryType || 'Self Pickup'}</p>
          </div>
        </div>
      </div>

      {/* Measurements */}
      {hasMeasurements && (
        <div className="mb-10">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b-2 border-slate-100 pb-2">MEASUREMENTS</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-6">
            {Object.entries(measurements).map(([key, value]) => {
              if (!value) return null;
              return (
                <div key={key}>
                  <p className="text-xs text-slate-500 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="font-bold text-sm">{value as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Summary */}
      <div className="mb-12 flex justify-end">
        <div className="w-full sm:w-80 bg-slate-50 p-6 rounded-2xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">PAYMENT SUMMARY</p>
          <div className="space-y-2 text-sm font-medium">
            <div className="flex justify-between">
              <span className="text-slate-600">Total Price</span>
              <span className="font-bold">{orderCurrency} {safeNum(order.price).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Total Paid</span>
              <span className="font-bold">{orderCurrency} {totalPaid.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t-2 border-slate-200">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-slate-900">Balance Due</span>
              <span className="text-xl font-black text-[#1a3a2a]">{orderCurrency} {balanceDue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm font-medium text-slate-500 border-t-2 border-slate-100 pt-6 whitespace-pre-line">
        {shop?.invoiceFooter || `Thank you for choosing ${shop?.name || 'us'}!\nFor queries contact us on WhatsApp.`}
      </div>
    </div>
  );
});

Invoice.displayName = 'Invoice';
