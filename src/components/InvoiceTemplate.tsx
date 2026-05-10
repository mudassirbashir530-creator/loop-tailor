import React, { forwardRef } from 'react';
import { Order } from '../lib/types';
import { formatCurrency, formatDate } from '../lib/utils';
import { Scissors } from 'lucide-react';
import { useShop } from '../contexts/ShopContext';

interface InvoiceTemplateProps {
  order: Order;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ order }, ref) => {
  const { settings } = useShop();

  return (
    <div 
      ref={ref} 
      className="bg-white text-black p-8 max-w-2xl mx-auto border"
      style={{ width: '800px', minHeight: '1000px' }} // fixed size for good image export
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-100 pb-6 mb-8">
        <div className="flex items-center gap-4">
          {settings.shopLogo ? (
            <img 
              src={typeof settings.shopLogo === 'string' ? settings.shopLogo : settings.shopLogo.url} 
              className="h-16 w-16 rounded-xl object-cover bg-gray-50 border shadow-sm" 
              alt="Logo"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="bg-primary text-white p-2 rounded">
              <Scissors className="h-6 w-6" />
            </div>
          )}
          <div>
            <span className="font-bold text-2xl text-primary block">{settings.name || 'Loop Tailor Shop'}</span>
            <p className="text-gray-600 text-sm mt-0.5">{settings.phone}</p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-light text-gray-400 tracking-widest uppercase mb-2">Invoice</h1>
          <p className="font-medium text-gray-800">#{order.id.slice(-6).toUpperCase()}</p>
          <p className="text-gray-500 mt-1">Date: {formatDate(order.createdAt)}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-10">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Bill To</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="font-bold text-xl text-gray-800 mb-1">{order?.customerName || 'Unnamed Customer'}</p>
          <p className="text-gray-600">{order?.customerPhone || 'No contact info'}</p>
        </div>
      </div>

      {/* Order Details */}
      <div className="mb-10">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Order Details</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="py-3 font-semibold text-gray-700">Description</th>
              <th className="py-3 font-semibold text-gray-700 text-right">Delivery Date</th>
              <th className="py-3 font-semibold text-gray-700 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-4">
                <p className="font-medium text-gray-800">{order.clothingType}</p>
                {order.designNotes && <p className="text-sm text-gray-500 mt-1">{order.designNotes}</p>}
              </td>
              <td className="py-4 text-right text-gray-700">{formatDate(order.deliveryDate)}</td>
              <td className="py-4 text-right font-medium text-gray-800">{formatCurrency(order.price)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payments */}
      <div className="flex justify-end mb-16">
        <div className="w-1/2">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-800">{formatCurrency(order.price)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 text-green-600">
            <span>Advance Paid</span>
            <span className="font-medium">-{formatCurrency(order.advancePayment)}</span>
          </div>
          <div className="flex justify-between py-3 border-b-2 border-gray-800 mt-2">
            <span className="font-bold text-lg text-gray-800">Balance Due</span>
            <span className="font-bold text-lg text-orange-600">{formatCurrency(order.remainingPayment)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-8 border-t border-gray-100 text-gray-500 text-sm">
        <p className="mb-2 font-medium text-gray-700">Thank you for your business!</p>
        <p>This is a computer-generated invoice.</p>
        {settings.invoiceFooter && <p className="mt-2 text-xs text-gray-400">{settings.invoiceFooter}</p>}
      </div>
    </div>
  );
});
