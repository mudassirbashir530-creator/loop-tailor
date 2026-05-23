import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoice } from '../hooks/useInvoice';
import { Invoice } from '../components/Invoice';
import { InvoiceActions } from '../components/InvoiceActions';
import { Button } from '../components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const { order, shop, customer, paymentsList, loading, updateFooter } = useInvoice(id);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a3a2a]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-slate-50 gap-4">
        <p className="text-slate-500 font-medium text-lg">Invoice not found or unauthorized.</p>
        <Button onClick={() => navigate('/app/orders')} className="rounded-xl">Go Back to Orders</Button>
      </div>
    );
  }

  const currentFooter = shop?.invoiceFooter || `Thank you for choosing ${shop?.name || 'us'}!\nFor queries contact us on WhatsApp.`;

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 md:px-8">
      {/* Top Banner Navigation */}
      <div className="max-w-[800px] mx-auto mb-6 flex items-center justify-start">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/app/orders/${id}`)}
          className="rounded-xl font-bold text-slate-600 bg-white shadow-sm border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Order
        </Button>
      </div>

      <div className="overflow-x-auto hide-scrollbar">
        <div className="min-w-[400px]">
          <Invoice 
            ref={invoiceRef}
            order={order} 
            shop={shop} 
            customer={customer} 
            paymentsList={paymentsList} 
          />
        </div>
      </div>

      <InvoiceActions 
        invoiceRef={invoiceRef}
        orderId={order.id}
        customerName={order.customerName}
        shopName={shop?.name || 'Loop Tailor'}
        currentFooter={currentFooter}
        onSaveFooter={updateFooter}
      />
    </div>
  );
}
